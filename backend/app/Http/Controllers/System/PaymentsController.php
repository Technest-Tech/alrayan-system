<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\PaymentRowResource;
use App\Models\System\StudentPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentsController extends Controller
{
    public function index(Request $request)
    {
        $latestIds = StudentPackage::selectRaw('MAX(id) as id')
            ->whereNull('deleted_at')
            ->groupBy('student_id');

        $query = StudentPackage::whereIn('id', $latestIds)
            ->with(['student.assignedTeacher.user', 'student.guardian'])
            ->when($request->payment_status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->whereHas('student', fn ($sq) =>
                $sq->where('name', 'like', "%{$s}%")
                   ->orWhereHas('guardian', fn ($gq) => $gq->where('whatsapp', 'like', "%{$s}%"))
            ))
            ->when($request->teacher_id, fn ($q, $tid) => $q->whereHas('student', fn ($sq) =>
                $sq->where('assigned_teacher_id', $tid)
            ));

        $sort = $request->sort_by ?? 'latest';

        if (in_array($sort, ['name_asc', 'name_desc'])) {
            $query->join('sys_students as sort_s', 'sort_s.id', '=', 'sys_student_packages.student_id')
                  ->select('sys_student_packages.*')
                  ->orderBy('sort_s.name', $sort === 'name_asc' ? 'asc' : 'desc');
        } elseif ($sort === 'tariff_asc') {
            $query->orderBy('tariff_at_time');
        } elseif ($sort === 'tariff_desc') {
            $query->orderByDesc('tariff_at_time');
        } else {
            $query->orderByDesc('sys_student_packages.id');
        }

        $perPage = min((int) ($request->per_page ?? 20), 100);

        return PaymentRowResource::collection($query->paginate($perPage));
    }

    public function stats()
    {
        $latestIds = StudentPackage::selectRaw('MAX(id) as id')
            ->whereNull('deleted_at')
            ->groupBy('student_id');

        $pendingStudents = StudentPackage::whereIn('id', $latestIds)
            ->where('status', 'pending')
            ->count();

        $multipleUnpaid = DB::table(
            DB::table('sys_student_packages')
                ->whereNull('deleted_at')
                ->where('status', 'pending')
                ->selectRaw('student_id')
                ->groupBy('student_id')
                ->havingRaw('COUNT(*) > 1'),
            'sub'
        )->count();

        $totalPendingMinor = StudentPackage::whereNull('deleted_at')
            ->where('status', 'pending')
            ->sum('tariff_at_time');

        $receivedMinor = StudentPackage::whereNull('deleted_at')
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('tariff_at_time');

        $currency = StudentPackage::whereNull('deleted_at')
            ->whereNotNull('currency')
            ->value('currency') ?? 'USD';

        return response()->json([
            'pending_students'     => $pendingStudents,
            'multiple_unpaid'      => $multipleUnpaid,
            'total_pending_minor'  => (int) $totalPendingMinor,
            'received_month_minor' => (int) $receivedMinor,
            'currency'             => $currency,
        ]);
    }
}
