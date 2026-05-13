<?php

namespace App\Services\Integrations\Paymob;

use App\Support\System\Setting;
use Illuminate\Http\Request;

class PaymobHmacVerifier
{
    // Field concatenation order per Paymob v1 docs
    private const FIELDS = [
        'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
        'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
        'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
        'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
    ];

    public function verify(Request $request, string $sig): bool
    {
        $secret = Setting::get('paymob.webhook_hmac_secret', '');
        if (empty($secret)) return false;
        $obj    = $request->input('obj', $request->all());
        $concat = collect(self::FIELDS)
            ->map(fn($k) => (string) data_get($obj, $k, ''))
            ->implode('');
        return hash_hmac('sha512', $concat, $secret) === $sig;
    }
}
