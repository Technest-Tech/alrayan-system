<?php

namespace App\Policies\System;

use App\Models\System\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $u)
    {
        return $u->can('invoices.view');
    }

    public function view(User $u, Invoice $i)
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return false;
        return $u->can('invoices.view');
    }

    public function create(User $u)
    {
        return $u->can('invoices.create');
    }

    public function createAdvance(User $u)
    {
        return $u->can('invoices.create_advance');
    }

    public function update(User $u, Invoice $i)
    {
        return $u->can('invoices.edit') && $i->status === 'draft';
    }

    public function void(User $u, Invoice $i)
    {
        return $u->can('invoices.void') && $i->status !== 'paid';
    }

    public function recordPayment(User $u, Invoice $i)
    {
        return $u->can('invoices.record_payment') && in_array($i->status, ['sent', 'overdue']);
    }

    public function resendLink(User $u, Invoice $i)
    {
        return $u->can('invoices.resend_link');
    }

    public function downloadPdf(User $u, Invoice $i)
    {
        return $u->can('invoices.download_pdf');
    }

    public function export(User $u)
    {
        return $u->can('invoices.export');
    }

    public function send(User $u, Invoice $i)
    {
        return $u->can('invoices.edit') && $i->status === 'draft';
    }
}
