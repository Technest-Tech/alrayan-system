<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Wallet\AdjustWalletRequest;
use App\Http\Requests\System\Wallet\CreditWalletRequest;
use App\Http\Requests\System\Wallet\DebitWalletRequest;
use App\Http\Resources\System\WalletTransactionResource;
use App\Models\System\Student;
use App\Models\System\WalletTransaction;
use App\Services\System\WalletService;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Student $student)
    {
        abort_unless(auth()->user()->can('wallet.view'), 403);
        return response()->json([
            'wallet_balance_minor' => $student->wallet_balance_minor,
            'currency'             => $student->currency,
        ]);
    }

    public function transactions(Request $request, Student $student)
    {
        abort_unless(auth()->user()->can('wallet.view'), 403);
        $txs = WalletTransaction::where('student_id', $student->id)
            ->latest()
            ->paginate($request->integer('per_page', 25));
        return WalletTransactionResource::collection($txs);
    }

    public function credit(CreditWalletRequest $request, Student $student, WalletService $wallet)
    {
        abort_unless(auth()->user()->can('wallet.credit'), 403);
        $tx = $wallet->credit($student, $request->amount_minor, 'manual_credit', null, $request->note);
        return new WalletTransactionResource($tx);
    }

    public function debit(DebitWalletRequest $request, Student $student, WalletService $wallet)
    {
        abort_unless(auth()->user()->can('wallet.debit'), 403);
        $tx = $wallet->debit($student, $request->amount_minor, 'manual_debit', null, $request->note);
        return new WalletTransactionResource($tx);
    }

    public function adjust(AdjustWalletRequest $request, Student $student, WalletService $wallet)
    {
        abort_unless(auth()->user()->can('wallet.adjust'), 403);
        $amount = $request->amount_minor;
        if ($amount >= 0) {
            $tx = $wallet->credit($student, $amount, 'adjustment', null, $request->note);
        } else {
            $tx = $wallet->debit($student, abs($amount), 'adjustment', null, $request->note);
        }
        return new WalletTransactionResource($tx);
    }
}
