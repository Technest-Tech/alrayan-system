<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Certificate\StoreCertificateRequest;
use App\Http\Requests\System\Certificate\UpdateCertificateRequest;
use App\Http\Resources\System\CertificateResource;
use App\Models\System\Certificate;
use App\Services\System\AuditLog;
use App\Services\System\CertificateNumberer;
use App\Services\System\CertificateRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function __construct(
        private readonly CertificateNumberer $numberer,
        private readonly CertificateRenderer $renderer,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Certificate::with('student', 'course', 'teacher', 'issuedBy')
            ->when($request->input('filter.type'), fn($q, $v) => $q->where('type', $v))
            ->when($request->input('filter.student_id'), fn($q, $v) => $q->where('student_id', $v))
            ->when($request->input('filter.q'), fn($q, $v) => $q->where(fn($s) =>
                $s->where('title', 'like', "%{$v}%")->orWhere('certificate_number', 'like', "%{$v}%")
            ))
            ->orderByDesc('issued_on');

        $paginated = $query->paginate($request->integer('per_page', 25));
        return response()->json(CertificateResource::collection($paginated)->response()->getData(true));
    }

    public function show(int $id): CertificateResource
    {
        return new CertificateResource(Certificate::with('student', 'course', 'teacher', 'issuedBy')->findOrFail($id));
    }

    public function store(StoreCertificateRequest $request): JsonResponse
    {
        $year   = now()->year;
        $number = $this->numberer->next($year);

        $certificate = Certificate::create(array_merge(
            $request->validated(),
            [
                'certificate_number' => $number,
                'issued_by_user_id'  => $request->user()->id,
            ]
        ));

        // Generate + store PDF
        try {
            $pdf = $this->renderer->renderPdf($certificate->fresh(['student', 'teacher', 'course']));
            $path = "certificates/{$number}.pdf";
            \Illuminate\Support\Facades\Storage::disk('local')->put($path, $pdf);
            $certificate->update(['pdf_path' => $path]);
        } catch (\Throwable) {
            // PDF generation is best-effort; don't fail the whole request
        }

        AuditLog::record('certificates.issued', $request->user(), [
            'certificate_id'     => $certificate->id,
            'certificate_number' => $number,
            'student_id'         => $certificate->student_id,
        ]);

        return response()->json(['data' => new CertificateResource($certificate->load('student', 'teacher', 'course'))], 201);
    }

    public function preview(StoreCertificateRequest $request): \Symfony\Component\HttpFoundation\Response
    {
        $stub = new Certificate($request->validated());
        $stub->certificate_number = 'PREVIEW';
        $stub->issued_on = now();

        $pdf = $this->renderer->renderPdf($stub, preview: true);

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview.pdf"',
        ]);
    }

    public function update(UpdateCertificateRequest $request, int $id): CertificateResource
    {
        $certificate = Certificate::findOrFail($id);
        $certificate->update($request->validated());
        return new CertificateResource($certificate->load('student', 'teacher', 'course'));
    }

    public function revoke(Request $request, int $id): JsonResponse
    {
        $certificate = Certificate::findOrFail($id);
        $certificate->update(['revoked_at' => now()]);

        AuditLog::record('certificates.revoked', $request->user(), [
            'certificate_id'     => $certificate->id,
            'certificate_number' => $certificate->certificate_number,
        ]);

        return response()->json(['data' => new CertificateResource($certificate)]);
    }

    public function pdf(int $id): \Symfony\Component\HttpFoundation\Response
    {
        $certificate = Certificate::with('student', 'teacher', 'course')->findOrFail($id);
        $pdf = $this->renderer->renderPdf($certificate);

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$certificate->certificate_number}.pdf\"",
        ]);
    }

    public function forStudent(int $studentId): JsonResponse
    {
        $certs = Certificate::with('course', 'teacher', 'issuedBy')
            ->where('student_id', $studentId)
            ->orderByDesc('issued_on')
            ->get();

        return response()->json(['data' => CertificateResource::collection($certs)]);
    }
}
