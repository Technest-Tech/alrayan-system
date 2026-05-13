# Alrayan Academy — Admin Management System
## Complete Feature Specification (Final v3)

**Project:** Alrayan Academy (Online Quran & Arabic Academy)
**Tech Stack:** Next.js (Frontend) + Laravel (Backend)
**UI Language:** English
**Architecture:** Single project — Public Website + Admin Management System
**Date:** May 10, 2026

---

## Module 1: Authentication & Role-Based Access Control

**Roles:**
- **Admin (Owner):** Full access to everything
- **Supervisor:** Configurable permissions (e.g., can manage students but cannot view financials)
- **Teacher:** Own dashboard only (schedule, students, session reports, salary statement)

**Features:**
- Login/logout with secure authentication
- Role-based permission system (granular, configurable per supervisor)
- Admin can create/edit/deactivate supervisor and teacher accounts
- Password reset functionality

---

## Module 2: Leads / CRM

**Purpose:** Track potential students from first contact to enrollment.

**Lead Sources (tracked):**
- Google Ads
- Facebook/Instagram Ads
- WhatsApp direct
- Student referral
- Website form

**Lead Pipeline:**
- New → Contacted → Trial Booked → Trial Completed → Enrolled → Lost

**Follow-Up System:**
- Schedule follow-up date per lead
- System sends internal notification reminder on follow-up date
- Add notes/follow-up actions on each lead

**Features:**
- Lead list with filters (status, source, date, course interest)
- Assign lead to a supervisor for follow-up
- Convert lead to student (auto-creates student record)
- Lost lead: record reason for loss
- Track conversion rate (leads → trials → enrollments)

---

## Module 3: Student Management

**Registration Flow:**
1. Lead enters system (website form or manual/WhatsApp)
2. Lead is contacted and trial is booked
3. Student gets 1 free trial session
4. After trial → student decides to enroll or not
5. If enrolling → admin sets course, teacher, schedule, price
6. System calculates pro-rata for remaining month
7. Admin clicks "Create Advance Invoice"
8. Student must pay before first regular session begins
9. Sessions start after payment confirmed

**Student Profile:**
- Name, email, phone, WhatsApp, country, timezone
- Age category: child or adult
- Parent/guardian info (for children): name, phone, WhatsApp, email
- Course(s) enrolled in
- Assigned teacher
- Schedule (days, times, session duration)
- Number of sessions per month
- Custom monthly price (set manually by admin)
- Currency (per student)
- Wallet/credit balance
- Family/sibling linking
- WhatsApp group link + status (active/stopped)

**Student Statuses:**
- Trial → Active → Paused → Suspended (auto, non-payment) → Cancelled

**Status Rules:**
- Trial → Active: after payment of advance invoice
- Active → Paused: manual by admin, billing stops automatically, no refund for remaining days
- Paused → Active: pro-rata invoice for remaining month, must pay before sessions resume
- Active → Suspended: auto after X months non-payment (configurable), sessions stop, teacher notified
- Suspended → Active: must pay all outstanding invoices + pro-rata for remaining month
- Any → Cancelled: record cancellation reason (price, schedule, teacher, personal, quality, other)

**Student Timeline:**
- Log every change: teacher change, price change, schedule change, status change, session count change
- Who made the change + timestamp + old value → new value

**Features:**
- Add/edit/view student profiles
- Assign teacher manually (admin decides)
- Transfer student between teachers (with history)
- Pause and reactivate subscriptions
- Family/sibling linking with discount support
- Internal notes on each student
- Filter/search students by status, course, teacher, country, age category
- View student's full history (sessions, payments, reports, timeline)
- Alert: student has no WhatsApp group registered

---

## Module 4: Teacher Management

**Teacher Profile:**
- Name, email, phone, WhatsApp, qualifications
- Courses they can teach
- Availability schedule
- Per-minute rate (in EGP, may differ by session duration: 30/45/60 min)
- Payment method: Vodafone Cash / electronic wallet (account details stored)
- Assigned students list
- WhatsApp group link + status (active/stopped)

**Leave Management:**
- Teacher requests leave (date range + reason)
- Admin approves/rejects
- On approval: system auto-flags affected sessions
- Admin gets notification to arrange substitute or cancel sessions
- Leave calendar view

**Features:**
- Add/edit/view/deactivate teacher profiles
- Set availability (weekly recurring)
- View teacher's schedule and assigned students
- Internal notes on each teacher
- Teacher performance metrics (from quality module)

---

## Module 5: Courses

**Available Courses:**
- Quran Recitation & Tajweed
- Quran Memorization (Hifz)
- Arabic Language
- Islamic Studies / Ijazah

**Features:**
- Course list management (name, description)
- Session type: 1-on-1 only
- Platform: Zoom (with auto-generated links)
- Note: Courses do NOT have fixed prices — pricing is per student

---

## Module 6: Pricing & Subscription

**Pricing Model:**
- Price based on number of sessions per month + session duration
- Session durations: 30, 45, or 60 minutes (each has a different base price)
- Final price set manually per student by admin (can differ from base price)
- Monthly subscription (recurring)

**Examples:**
- Student A: 4 sessions/month × 30 min = $25/month
- Student B: 8 sessions/month × 60 min = $60/month
- Student C: 12 sessions/month × 45 min = $50/month

**Discounts:**
- Family/sibling discount (admin sets manually)
- Custom discount per student

**Mid-Month Changes:**
- Student reduces sessions (8→4): loses remaining sessions, no refund, change applies from next month
- Student increases sessions: not allowed mid-month, change applies from next month
- Price change tracked in student timeline

**Currencies (for student billing):**
- USD, EUR, CAD, GBP, EGP, AED, Dinar (KWD/BHD), SAR

**Website Pricing:**
- Admin controls base prices displayed on the public website from system settings

---

## Module 7: Scheduling

**Schedule Type:** Weekly recurring (can be modified)

**Features:**
- Set student schedule: days, times, session duration (30/45/60 min)
- Flexible number of sessions per week per student
- Calendar view (daily/weekly) for admin and per-teacher
- Reschedule individual sessions
- Makeup sessions (case-by-case, admin decides)
- Detect scheduling conflicts (teacher double-booked)
- Timezone handling (students in different countries)
- Zoom link auto-generated per session (Zoom API integration)
- Zoom link included in session reminders
- Teacher leave: affected sessions auto-flagged

---

## Module 8: Attendance Tracking

**Features:**
- Mark each session: Attended / Absent / Cancelled / Rescheduled
- Track who cancelled (student or teacher)
- Makeup session tracking (approved/pending/denied)
- Attendance reports per student and per teacher
- Flag students with frequent absences

---

## Module 9: Session Reports (Teacher Logs)

**Purpose:** Teacher logs a report after every session.

**Report Fields:**
- Student name (auto-filled)
- Date and duration (auto-filled)
- What was covered (free text)
- Student performance rating (Excellent/Good/Needs Improvement)
- Homework/assignment given (optional)
- Notes for next session

**Features:**
- Teacher submits report from their dashboard
- Admin/supervisor can review all reports
- Alert if teacher hasn't submitted report (configurable hours)
- WhatsApp reminder to teacher to submit report (via wassender)
- Report history per student (viewable timeline)

---

## Module 10: Quality Management

**Teacher Evaluation (by Admin/Supervisor):**
- Review session reports quality
- Periodic teacher performance review (monthly)
- Metrics: attendance rate, report submission rate, student retention under this teacher, punctuality

**Features:**
- Teacher quality score dashboard
- Flag underperforming teachers
- Quality review history per teacher
- Monthly performance summary reports
- Bonus recommendations based on quality scores

---

## Module 11: Student Billing & Invoicing

### Invoice Types

**1. Advance Invoice (First-time / Reactivation):**
- Created manually when admin clicks "Create Advance Invoice"
- For new students: pro-rata amount for remaining days in current month
- For reactivating students: pro-rata for remaining days + any outstanding balance
- Student must pay this before sessions start
- System auto-calculates based on: (monthly price ÷ days in month) × remaining days

**2. Monthly Invoice (Recurring):**
- Auto-generated on 1st of each month for all active students
- Full monthly price
- Student wallet credit applied automatically (reduces invoice amount)
- Not generated for paused/suspended/cancelled students

### Invoice Details
- Student name, course, sessions count, session duration, monthly price
- Discount applied (if any)
- Wallet credit applied (if any)
- Currency per student
- Invoice number (auto-incremented)
- Status: Draft → Sent → Paid → Overdue → Void

### Payment Methods
- **Online:** Paymob integration (payment page on website)
  - Payment link generated per invoice
  - Payment link sent to student's WhatsApp group automatically
  - On successful payment: invoice auto-updates to "Paid" via Paymob webhook
- **Manual:** bank transfer, PayPal, Vodafone Cash, etc.
  - Admin records payment manually (amount, method, date, reference)

### Payment Rules
- Full payment only (no partial payments)
- Payment due within 3 days of invoice (configurable in settings)
- After due date → status becomes "Overdue"

### Payment Reminders (via WhatsApp/wassender)
- Configurable timing from settings:
  - Before due date (e.g., 3 days before, 1 day before)
  - On due date
  - After overdue (e.g., 1 day, 3 days, 7 days after)
- Sent to student's WhatsApp group
- Multiple reminders supported
- Reminders include payment link

### Non-Payment Auto-Suspension
- After X months of non-payment (configurable in settings) → student auto-suspended
- Suspended student: sessions stop, teacher notified via WhatsApp
- All reminders and session scheduling stops
- To reactivate: must pay all outstanding invoices first + pro-rata for remaining month

### Student Wallet / Credit
- Balance tracked per student
- Sources: overpayment, admin manual credit, adjustment
- Auto-applied to next invoice (reduces amount due)
- Wallet history visible on student profile
- Note: no refund on pause — remaining days are NOT credited to wallet

### Mid-Month Session Changes
- Reducing sessions: change takes effect next month, no refund/credit for current month
- Increasing sessions: not allowed mid-month

### Features
- Invoice list with filters (status, date, student, amount, currency)
- Payment history per student
- Outstanding/overdue invoices dashboard widget
- Export invoices to Excel/PDF
- "Create Advance Invoice" button on student profile

---

## Module 12: Teacher Payroll

**Payroll Calculation (Auto):**
- Sum all attended sessions in the month per teacher
- Calculate: total minutes × per-minute rate (in EGP)
- Add bonuses (manual entry by admin, with reason)
- Subtract deductions (manual entry by admin, with reason — e.g., unauthorized absence, late reports)
- Net salary = (minutes × rate) + bonuses - deductions

**Payroll Cycle:**
- Auto-calculated on 1st of each month for previous month
- Admin reviews → approves → marks as "Transferred"
- Payment method: Vodafone Cash / electronic wallets

**Teacher Salary Statement (visible to teacher in their dashboard):**
- Total sessions count
- Total minutes
- Base salary amount
- Bonuses breakdown (amount + reason for each)
- Deductions breakdown (amount + reason for each)
- Net salary
- Payment status: Pending → Approved → Transferred
- Payment history (monthly archive)

**Features:**
- Payroll summary: all teachers in one view
- Per-teacher detailed breakdown
- Approve/reject individual payrolls
- Mark as transferred (with date and reference)
- Payroll history archive
- Export payroll to Excel/PDF

---

## Module 13: Teacher Rewards / Bonuses

**Bonus Type:** Financial bonus (added to monthly salary)

**Criteria (admin decides manually):**
- Excellent performance rating
- High student retention
- Consistent report submission
- Any other reason (free text)

**Features:**
- Add bonus to teacher (amount + reason + month)
- Bonus appears in teacher's salary statement
- Bonus history per teacher
- Total bonuses in financial reports

---

## Module 14: Accounting & Financial Reports

### Revenue Tracking
- All student payments (auto from Paymob + manual entries)
- Revenue by course, by student, by currency
- Revenue by month/quarter/year

### Expense Tracking
- Teacher salaries (auto from payroll)
- Teacher bonuses (auto from payroll)
- General expenses with categories:
  - Advertising/Marketing
  - Hosting & Domain
  - Zoom subscription
  - Tools & Software
  - wassender subscription
  - Other (custom categories supported)
- Each expense: amount, category, date, description, currency

### Profit & Loss
- Monthly P&L: Revenue - (Salaries + Bonuses + General Expenses) = Net Profit
- Annual P&L
- Custom date range P&L

### Collection Report
- Invoices paid on time vs overdue (percentage)
- Average days delay in payment
- Total outstanding amounts
- Collection rate trend

### Cancellation Report
- Monthly cancellation rate
- Most common cancellation reasons (breakdown chart)
- Students lost per teacher
- Cancellation trend over time

### Trial Analytics
- Total trials per month
- Trials converted to enrollment (count + percentage)
- Trials that didn't convert (count + percentage)
- Conversion rate trend
- Best converting teacher

### Auto Monthly Report
- System generates comprehensive report on 1st of each month
- Includes: revenue, expenses, profit, new students, cancellations, trial stats, teacher performance
- Ready for download (PDF/Excel)

### Features
- Add/edit/delete general expenses
- Expense categories management (add custom categories)
- Revenue vs expenses charts
- Export all reports to Excel/PDF
- Multi-currency display (with base currency setting)

---

## Module 15: Notifications & Reminders

### External (WhatsApp via wassender)

**Session Reminders (sent to WhatsApp groups):**
- Reminder to student group before session (configurable timing in settings)
- Reminder to teacher group before session (configurable timing in settings)
- Message includes: session time + Zoom link
- NOT sent if student is paused/suspended (teacher notified of status change)

**Payment Notifications (sent to student WhatsApp group):**
- Invoice created: payment link sent automatically
- Payment reminders: configurable schedule (before due, on due, after overdue)
- Reminders include payment link

**Session Report Reminder (sent to teacher WhatsApp group):**
- If teacher hasn't submitted report within X hours (configurable)

**Welcome Message:**
- Auto welcome message to new student upon enrollment

**Status Change Notifications:**
- Student paused/suspended → teacher notified
- Teacher leave approved → affected students' sessions flagged, admin notified

**Message Templates:**
- All WhatsApp message templates editable from settings
- Support variables: {student_name}, {teacher_name}, {session_time}, {zoom_link}, {payment_link}, {amount}, {due_date}

**Delivery Log:**
- Every wassender message logged: timestamp, recipient, message type, status (sent/failed)
- Viewable in admin dashboard

### Internal (In-Dashboard Notifications)

**Alerts:**
- New lead received
- CRM follow-up reminder due
- Student hasn't paid (overdue invoice)
- Teacher hasn't submitted session report
- Trial student — follow up needed
- Student absent X times in a row
- Student auto-suspended for non-payment
- Student has no WhatsApp group registered
- Teacher leave request pending
- Teacher leave approved — sessions need rescheduling
- Upcoming payroll due
- New payment received

**Features:**
- Notification bell in dashboard header with badge count
- Mark as read/unread
- Notification history
- Notification preferences per user role

---

## Module 16: WhatsApp Groups Management

**Group Structure:**
- One group per student: Student (or parent) + Supervisor
- One group per teacher: Teacher + Supervisor

**Group Creation:** Manual (admin creates on WhatsApp and registers in system)

**Group Record:**
- WhatsApp group invite link
- Status: Active / Stopped
- Linked to student or teacher profile

**Automation:**
- Session reminders sent to groups via wassender
- Payment links and reminders sent to student groups
- Report reminders sent to teacher groups

**Validation:**
- System alerts if active student has no group registered
- System alerts if active teacher has no group registered

---

## Module 17: Certificates

**Features:**
- Issue certificates for:
  - Course completion
  - Quran memorization milestones (e.g., completed Juz Amma)
  - Ijazah completion
- Certificate template with academy branding
- Auto-fill student name, course, date, teacher name
- Download as PDF
- Certificate record per student

---

## Module 18: Admin Dashboard

**Key Metrics:**
- Total students (active / paused / trial / suspended / cancelled)
- Total teachers (active)
- Today's sessions count + upcoming sessions
- Monthly revenue vs expenses vs profit
- Conversion rate (leads → trials → enrolled)
- Trial conversion rate
- Student retention rate
- Collection rate (on-time payments %)
- Outstanding payments total

**Alerts Panel:**
- Unpaid invoices (overdue)
- Absent students
- Missing session reports
- Expiring trials / pending follow-ups
- New leads
- Pending teacher leave requests
- Students without WhatsApp groups
- CRM follow-up reminders

**Features:**
- Visual charts (revenue trend, student growth, expenses breakdown, cancellation reasons)
- Quick actions (add student, add lead, view today's schedule, create advance invoice)
- Role-based: supervisors see limited dashboard, teachers see own dashboard

---

## Module 19: Teacher Dashboard

**What teacher sees:**
- Today's sessions with student details + Zoom links
- Upcoming sessions (weekly view)
- Their assigned students list
- Session report submission form
- Past session reports
- Monthly salary statement (sessions, minutes, base, bonuses, deductions, net)
- Salary payment history
- Leave request form + history

---

## Module 20: System Settings

**Pricing Settings:**
- Base session prices per duration (30/45/60 min) — displayed on public website
- Teacher per-minute rates (in EGP, configurable per duration)
- Discount rules (sibling, custom)
- Supported currencies list

**Billing Settings:**
- Invoice due period (default: 3 days, configurable)
- Auto-suspension threshold: after X months non-payment (configurable)
- Payment reminder schedule (configurable: days before/after due date)

**Notification Settings:**
- Session reminder timing (hours before session — configurable)
- Report submission reminder timing (hours after session — configurable)
- WhatsApp message templates (editable with variable support)
- wassender API configuration (API key, instance)

**General Settings:**
- Default timezone
- Academy info (name, logo, contact — for certificates)
- Expense categories management (add/edit/delete)
- Zoom API configuration (API key, secret)
- Paymob API configuration (API key, integration ID)

---

## Module 21: Data & Administration

**Audit Log:**
- Track all actions: who did what, when
- User, action type, target entity, timestamp
- Old value → new value for edits
- Filterable by user, action type, date range, entity

**Data Export:**
- Students list → Excel/PDF
- Financial reports → Excel/PDF
- Payroll reports → Excel/PDF
- Invoices → Excel/PDF
- Attendance reports → Excel/PDF
- Cancellation reports → Excel/PDF
- Trial analytics → Excel/PDF

---

## Summary Table

| # | Module | Priority | Complexity |
|---|--------|----------|------------|
| 1 | Auth & Roles | Critical | Medium |
| 2 | Leads / CRM | High | Medium |
| 3 | Student Management | Critical | Very High |
| 4 | Teacher Management | Critical | High |
| 5 | Courses | Critical | Low |
| 6 | Pricing & Subscription | Critical | High |
| 7 | Scheduling | Critical | Very High |
| 8 | Attendance | High | Medium |
| 9 | Session Reports | High | Medium |
| 10 | Quality Management | Medium | Medium |
| 11 | Student Billing & Invoicing | Critical | Very High |
| 12 | Teacher Payroll | Critical | High |
| 13 | Teacher Rewards / Bonuses | Medium | Low |
| 14 | Accounting & Financial Reports | High | High |
| 15 | Notifications & Reminders | High | Very High |
| 16 | WhatsApp Groups | Medium | Low |
| 17 | Certificates | Medium | Medium |
| 18 | Admin Dashboard | High | High |
| 19 | Teacher Dashboard | High | Medium |
| 20 | System Settings | High | Medium |
| 21 | Data & Administration | High | Medium |

---

## Integrations

| Service | Purpose | Details |
|---------|---------|---------|
| Paymob | Payment gateway | Student payment page, webhook for auto-confirmation |
| Zoom API | Session management | Auto-generate meeting links per session |
| wassender | WhatsApp automation | Reminders, payment links, notifications to groups |

---

## Key Business Rules Summary

| Rule | Detail |
|------|--------|
| Trial | 1 free session per new student |
| First Payment | Must pay advance invoice before first regular session |
| Advance Invoice | Pro-rata for remaining days in current month |
| Monthly Billing | Auto on 1st of each month for active students |
| Payment Due | 3 days (configurable) |
| Overdue | After due date, status → Overdue |
| Auto-Suspend | After X months non-payment (configurable) |
| Reactivation | Must pay all outstanding + pro-rata for remaining month |
| Pause | No refund, billing stops, pro-rata on reactivation |
| Wallet/Credit | Overpayments stored as credit, auto-applied to next invoice |
| Session Reduction | Mid-month: loses remaining, no credit. Change applies next month |
| Session Increase | Not allowed mid-month |
| Cancellation | Record reason (mandatory) |
| Teacher Pay | Per-minute rate × total attended minutes, in EGP |
| Teacher Payment | Vodafone Cash / e-wallets, 1st of each month |
| Teacher Bonuses | Manual, financial, added to salary |
| Teacher Deductions | Manual (unauthorized absence, late reports) |
| WhatsApp Groups | Manual creation, registered in system, mandatory for active students/teachers |
| Reminders | Sent to WhatsApp groups, timing configurable |
| Currencies (Students) | USD, EUR, CAD, GBP, EGP, AED, Dinar, SAR |
| Currency (Teachers) | EGP only |

---

## Deferred Features (Future Consideration)
- CMS (edit website content from admin)
- Learning materials management (upload PDFs, curriculum)
- Curriculum progress tracking (which Surah/Juz)
- Coupon/discount codes for marketing campaigns
- Referral system (student brings student)
- Student portal (student sees own schedule/reports/invoices)
- Student change requests (schedule/teacher change via system)
- Communication log per student
- Campaign ROI tracking in CRM
- Auto payment via Stripe/PayPal recurring
- Broadcast messages (send to all students/teachers)
- Auto WhatsApp group creation via wassender

---

*Document created: May 10, 2026*
*Last updated: May 10, 2026*
*Academy: Alrayan Academy — Online Quran & Arabic Education*
*Total Modules: 21 | Integrations: 3 | Business Rules: 17*