<?php

namespace App\Services\Integrations\Paymob;

use App\Models\System\Invoice;
use App\Models\System\PaymobPaymentLink;
use App\Support\System\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PaymobClient
{
    private const BASE = 'https://accept.paymob.com/api';

    public function createPaymentLink(Invoice $invoice): PaymobPaymentLink
    {
        $auth    = $this->authenticate();
        $order   = $this->createOrder($auth, $invoice);
        $key     = $this->createPaymentKey($auth, $order, $invoice);
        $iframeId = Setting::get('paymob.public_iframe_id', '');
        $url     = self::BASE . "/acceptance/iframes/{$iframeId}?payment_token={$key}";

        return PaymobPaymentLink::create([
            'invoice_id'      => $invoice->id,
            'paymob_order_id' => (string) ($order['id'] ?? ''),
            'payment_url'     => $url,
            'expires_at'      => now()->addHours(24),
            'is_active'       => true,
        ]);
    }

    public function authenticate(): string
    {
        return Cache::remember('paymob_auth_token', 50 * 60, function () {
            $res = Http::post(self::BASE . '/auth/tokens', [
                'api_key' => Setting::get('paymob.api_key', ''),
            ])->throw()->json();
            return $res['token'];
        });
    }

    private function createOrder(string $auth, Invoice $invoice): array
    {
        return Http::withToken($auth)
            ->post(self::BASE . '/ecommerce/orders', [
                'auth_token'        => $auth,
                'delivery_needed'   => false,
                'amount_cents'      => $invoice->total_minor,
                'currency'          => $invoice->currency,
                'merchant_order_id' => $invoice->invoice_number,
                'items'             => [],
            ])->throw()->json();
    }

    private function createPaymentKey(string $auth, array $order, Invoice $invoice): string
    {
        $res = Http::withToken($auth)
            ->post(self::BASE . '/acceptance/payment_keys', [
                'auth_token'   => $auth,
                'amount_cents' => $invoice->total_minor,
                'expiration'   => 3600,
                'order_id'     => $order['id'],
                'billing_data' => [
                    'apartment'       => 'NA',
                    'email'           => $invoice->student->email ?? 'na@na.com',
                    'floor'           => 'NA',
                    'first_name'      => $invoice->student->name ?? 'Student',
                    'street'          => 'NA',
                    'building'        => 'NA',
                    'phone_number'    => $invoice->student->phone ?? '+10000000000',
                    'shipping_method' => 'NA',
                    'postal_code'     => 'NA',
                    'city'            => 'NA',
                    'country'         => $invoice->student->country ?? 'EG',
                    'last_name'       => 'NA',
                    'state'           => 'NA',
                ],
                'currency'             => $invoice->currency,
                'integration_id'       => (int) Setting::get('paymob.integration_id', 0),
                'lock_order_when_paid' => true,
            ])->throw()->json();
        return $res['token'];
    }
}
