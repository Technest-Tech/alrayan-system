---
name: SYS-04 implementation status
description: SYS-04 (Scheduling/Sessions/Attendance/Reports) implemented 2026-05-10; what's done and what still needs work
type: project
---

Implemented 2026-05-10. The core of scheduling, sessions, attendance, and reports is wired up.

**Why:** Sprint 4 covers scheduling infrastructure — the foundation for billing (SYS-05), payroll (SYS-06), and reminders (SYS-07).

## Backend (complete)
- 5 migrations: `sys_schedule_patterns`, `sys_sessions`, `sys_session_reports`, `sys_makeup_requests`, + settings seed
- Models: `Session`, `SchedulePattern`, `SessionReport`, `MakeupRequest` (all with Spatie ActivityLog)
- Policies: `SessionPolicy`, `SessionReportPolicy`, `SchedulePatternPolicy`, `MakeupRequestPolicy`
- PermissionRegistry updated: `sessions.*`, `reports.*` (expanded), `makeups.*`
- Services: `RecurrenceCalculator`, `SessionMaterializer`, `ScheduleConflictDetector`, `SchedulePatternService`, `TimezoneResolver`, `ReportSubmissionMonitor`
- Zoom: `ZoomClient` (real), `FakeZoomClient` (tests/local), `MeetingRequest/Response` DTOs
- Jobs: `CreateSessionZoomMeeting`, `UpdateSessionZoomMeeting`, `DeleteSessionZoomMeeting`
- Observer: `SessionObserver` (dispatches Zoom jobs on create/delete)
- Events: `SessionAttended`, `SessionAbsent`, `SessionRescheduled`
- Listeners: `FlagSessionsOnTeacherLeaveApproved`, `NotifyAdminOnAbsenceStreak`
- Controllers: `SessionController`, `SessionReportController`, `SchedulePatternController`, `MakeupRequestController`
- 22 routes added to `routes/system.php` under the authenticated middleware group
- Artisan: `system:sessions:materialize` (nightly 02:00), `system:reports:check` (every 15 min)
- AppServiceProvider updated with all SYS-04 policies, observers, events, and ZoomClient binding

## Frontend (complete)
- Types: `src/types/system/session.ts` (Session, SchedulePattern, SessionReport, MakeupRequest, etc.)
- Hooks: `useSessions`, `useSchedulePatterns`, `useSessionReports`, `useMakeupRequests`, `useTeacherToday`, `useReschedulePreview`
- Components: `CalendarView`, `SessionDrawer`, `RescheduleSheet`, `CancelSessionDialog`, `ConflictBanner`, `RecurringPatternBuilder`, `AttendanceMarker`, `SessionReportForm`, `TodaySessionsList`, `MissingReportsBanner`
- Pages: `/schedule`, `/schedule/conflicts`, `/attendance`, `/session-reports`, `/session-reports/[id]`, `/teacher/today`, `/teacher/upcoming`, `/teacher/students`, `/teacher/reports`, `/teacher/salary`

## Still needed (next steps)
- `SystemDemoSeeder` extension (seed 90-day history + upcoming sessions + reports)
- `/students/[id]` Sessions/Schedule/Reports tabs wiring (currently placeholder)
- `/teachers/[id]` Schedule tab wiring
- Mobile QA + Lighthouse audits
- Feature tests + unit tests (RecurrenceCalculator DST, ScheduleConflictDetector, SessionMaterializer, etc.)
- Playwright acceptance flows (8 flows from sprint doc)

**How to apply:** When working on SYS-05/06/07, assume all session rows, attendance states, and report submission logic are live and can be queried.
