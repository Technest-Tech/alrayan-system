<?php

namespace App\Services\Integrations\XPay;

use App\Models\System\Invoice;
use App\Models\System\XPayPaymentLink;
use App\Support\System\Setting;
use Illuminate\Support\Facades\Http;

class XPayClient
{
    private const STAGING = 'https://staging.xpay.app/api/v1';
    private const STAGING_ORDERS = 'https://staging.xpay.app/api';

    private function base(): string
    {
        return self::STAGING;
    }

    private function headers(): array
    {
        return ['x-api-key' => Setting::get('xpay.api_key', '')];
    }

    public function prepareAmount(int $amountMinor, string $currency): float
    {
        $communityId = Setting::get('xpay.community_id', '');
        $method      = Setting::get('xpay.default_payment_method', 'card');

        $res = Http::withHeaders($this->headers())
            ->timeout(30)
            ->post($this->base() . '/payments/prepare-amount/', [
                'community_id'            => $communityId,
                'amount'                  => $amountMinor / 100,
                'currency'                => $currency,
                'selected_payment_method' => $method,
            ])->throw()->json();

        return (float) ($res['data']['total_amount'] ?? ($amountMinor / 100));
    }

    public function createPayment(Invoice $invoice, float $totalAmount, string $redirectUrl, string $callbackUrl): array
    {
        $communityId      = Setting::get('xpay.community_id', '');
        $variableAmountId = (int) Setting::get('xpay.variable_amount_id', 0);
        $originalAmount   = $invoice->total_minor / 100;
        $student          = $invoice->student;

        $res = Http::withHeaders($this->headers())
            ->timeout(60)
            ->post($this->base() . '/payments/pay/variable-amount', [
                'community_id'       => $communityId,
                'amount'             => $totalAmount,
                'original_amount'    => $originalAmount,
                'currency'           => $invoice->currency,
                'variable_amount_id' => $variableAmountId,
                'pay_using'          => 'card',
                'membership_id'      => $invoice->payment_token,
                'billing_data'       => [
                    'name'         => $student?->name ?? 'Student',
                    'email'        => $student?->email ?? 'na@na.com',
                    'phone_number' => $this->normalizePhone($student?->phone),
                ],
            ])->throw()->json();

        return [
            'iframe_url'       => $res['data']['iframe_url'] ?? '',
            'transaction_id'   => $res['data']['transaction_id'] ?? null,
            'transaction_uuid' => $res['data']['transaction_uuid'] ?? null,
        ];
    }

    public function getTransaction(string $transactionUuid): array
    {
        $communityId = Setting::get('xpay.community_id', '');

        return Http::withHeaders($this->headers())
            ->get($this->base() . "/communities/{$communityId}/transactions/{$transactionUuid}/")
            ->throw()
            ->json('data', []);
    }

    private function normalizePhone(?string $phone): string
    {
        if (empty($phone)) {
            return '+201000000001'; // valid placeholder (EG)
        }

        // Strip spaces, dashes, parens — keep digits and leading +
        $clean = preg_replace('/[^\d+]/', '', $phone);

        if (empty($clean)) {
            return '+201000000001';
        }

        // Already valid E.164 (starts with + and has enough digits)
        if (str_starts_with($clean, '+') && strlen($clean) >= 8) {
            return $clean;
        }

        // International format with 00 prefix (e.g. 0020101234567 → +20101234567)
        if (str_starts_with($clean, '00') && strlen($clean) > 4) {
            return '+' . substr($clean, 2);
        }

        // Local Egyptian number (01XXXXXXXXX → +201XXXXXXXXX)
        $stripped = ltrim($clean, '0');
        return '+20' . $stripped;
    }

    public function createPaymentLink(Invoice $invoice): XPayPaymentLink
    {
        $totalAmount = $this->prepareAmount($invoice->total_minor, $invoice->currency);
        $redirectUrl = Setting::get('xpay.redirect_url', config('app.frontend_url') . '/xpay-return');
        $callbackUrl = url('/api/system/webhooks/xpay');

        $data = $this->createPayment($invoice, $totalAmount, $redirectUrl, $callbackUrl);

        return XPayPaymentLink::create([
            'invoice_id'       => $invoice->id,
            'transaction_uuid' => $data['transaction_uuid'],
            'transaction_id'   => $data['transaction_id'],
            'iframe_url'       => $data['iframe_url'],
            'expires_at'       => now()->addHours(24),
            'is_active'        => true,
        ]);
    }
}
