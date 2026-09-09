# Full System Documentation
## Employee Account Creation with Email Notification
### All Pages · All Components · All Backend · All Tips

---

## TABLE OF CONTENTS

1. [Project Structure Overview](#1-project-structure-overview)
2. [Database — Prisma Schema](#2-database--prisma-schema)
3. [Lib Utilities](#3-lib-utilities)
4. [Server Actions — Backend](#4-server-actions--backend)
5. [Middleware & Auth Guard](#5-middleware--auth-guard)
6. [All Pages](#6-all-pages)
7. [All Components](#7-all-components)
8. [Email Template](#8-email-template)
9. [Environment Variables](#9-environment-variables)
10. [Packages to Install](#10-packages-to-install)
11. [Full File Tree](#11-full-file-tree)
12. [Tips & Best Practices](#12-tips--best-practices)

---

## 1. PROJECT STRUCTURE OVERVIEW

```
project/
├── app/
│   ├── actions/
│   │   ├── auth.ts                            [MODIFY]
│   │   └── profile.ts                         [MODIFY]
│   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── employees/
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx               [NEW]
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx               [NEW]
│   │   │   │   └── page.tsx                   [NEW]
│   │   │   ├── AdminSidebar.tsx               [MODIFY]
│   │   │   ├── layout.tsx                     [MODIFY]
│   │   │   └── page.tsx                       [MODIFY]
│   │   └── employee/
│   │       ├── profile/
│   │       │   └── page.tsx                   [EXISTS - no change]
│   │       ├── EmployeeSidebar.tsx            [EXISTS - no change]
│   │       ├── layout.tsx                     [EXISTS - no change]
│   │       └── page.tsx                       [EXISTS - no change]
│   ├── change-password/
│   │   ├── ChangePasswordForm.tsx             [NEW]
│   │   └── page.tsx                           [NEW]
│   ├── login/
│   │   ├── LoginForm.tsx                      [MODIFY]
│   │   └── page.tsx                           [EXISTS - no change]
│   ├── globals.css                            [EXISTS]
│   ├── layout.tsx                             [EXISTS]
│   └── page.tsx                               [EXISTS]
├── components/
│   ├── admin/
│   │   ├── CreateEmployeeForm.tsx             [NEW]
│   │   ├── EmployeeTable.tsx                  [NEW]
│   │   ├── EmployeeCard.tsx                   [NEW]
│   │   ├── EmailStatusBadge.tsx               [NEW]
│   │   └── ResendCredentialsButton.tsx        [NEW]
│   └── ui/
│       ├── SuccessAlert.tsx                   [NEW]
│       ├── ErrorAlert.tsx                     [NEW]
│       ├── PageHeader.tsx                     [NEW]
│       ├── StatusBadge.tsx                    [NEW]
│       ├── LoadingSpinner.tsx                 [NEW]
│       └── ConfirmModal.tsx                   [NEW]
├── lib/
│   ├── prisma.ts                              [NEW - check if exists]
│   ├── email.ts                               [NEW]
│   └── password.ts                            [NEW]
├── prisma/
│   ├── migrations/                            [EXISTS]
│   ├── schema.prisma                          [MODIFY]
│   └── seed.ts                                [MODIFY]
├── public/                                    [EXISTS]
├── .env                                       [MODIFY]
├── middleware.ts                              [NEW]
└── next.config.ts                             [EXISTS]
```

---

## 2. DATABASE — PRISMA SCHEMA

### File: `prisma/schema.prisma` [MODIFY]

---

### 2.1 Enum — EmailStatus

```
Purpose: Track the status of the welcome email sent to employee

Values:
  PENDING   → Email not yet sent (default when account created)
  SENT      → Email successfully delivered
  FAILED    → Email sending attempt failed
```

---

### 2.2 Enum — Role

```
Purpose: Define what type of user this account belongs to

Values:
  ADMIN     → Has full access, can create/manage employees
  MANAGER   → Can view team members, limited admin features
  EMPLOYEE  → Standard employee, limited to own profile/dashboard
```

---

### 2.3 Model — User

```
Fields to have in User model:

id              String        Primary key — use cuid()
fullName        String        Employee full name
email           String        Unique — used as login username
phone           String?       Optional phone number
passwordHash    String        bcrypt hashed password — NEVER store plain
role            Role          Enum — default EMPLOYEE
department      String?       Department name
jobTitle        String?       Job title / position
isActive        Boolean       Default true — false = soft deleted/deactivated
isFirstLogin    Boolean       Default true — forces password change on first login
emailStatus     EmailStatus   Default PENDING — tracks welcome email delivery
emailSentAt     DateTime?     Nullable — timestamp of when email was sent
createdAt       DateTime      Auto — default now()
updatedAt       DateTime      Auto — updatedAt

Relations:
  emailLogs     EmailLog[]    One-to-many → all email logs for this user
```

---

### 2.4 Model — EmailLog

```
Purpose: Audit trail for all emails sent by the system

Fields:

id          String      Primary key — cuid()
userId      String      Foreign key → User.id
user        User        Relation to User model
type        String      Type of email: "WELCOME", "RESEND", "RESET"
recipient   String      The email address it was sent to
status      String      "SUCCESS" or "FAILED"
errorMsg    String?     Nullable — error message if sending failed
sentAt      DateTime    Default now()
```

---

### 2.5 Seed File: `prisma/seed.ts` [MODIFY]

```
Purpose: Populate DB with initial data for testing

What to add:

1. Admin User Seed
   - fullName:  "System Admin"
   - email:     "admin@company.com"
   - password:  Hash of "Admin@1234" using bcrypt
   - role:      ADMIN
   - isFirstLogin: false
   - emailStatus:  SENT

2. Sample Employee Seeds (2–3 employees)
   - fullName:  "John Perera"
   - email:     "john@company.com"
   - password:  Hash of temp password
   - role:      EMPLOYEE
   - isFirstLogin: true
   - emailStatus:  SENT

Tips:
  - Run: npx prisma db seed
  - Always check for existing records before inserting (use upsert)
  - Hash all passwords in the seed file using bcrypt — never store plain text
```

---

## 3. LIB UTILITIES

### 3.1 File: `lib/prisma.ts` [NEW]

```
Purpose:
  Prisma Client singleton — prevents too many DB connections in development
  caused by Next.js hot module reloading

What it does:
  - Creates one PrismaClient instance
  - In development: stores it on the global object so it survives hot reloads
  - In production: creates a fresh instance
  - Export a single `prisma` object used everywhere in the app

Usage:
  import { prisma } from "@/lib/prisma"
  const users = await prisma.user.findMany()
```

---

### 3.2 File: `lib/password.ts` [NEW]

```
Purpose:
  All password-related utilities — generation and hashing

Functions:

generateTempPassword(length?: number)
  - Generates a random secure temporary password
  - Default length: 12 characters
  - Character set: uppercase A-Z, lowercase a-z, digits 0-9, symbols !@#$%
  - Returns: plain string (use this in email BEFORE hashing)
  - Example output: "Kx7#mPqL2!nR"

hashPassword(plain: string)
  - Hashes a plain text password using bcrypt
  - Salt rounds: 12 (good balance of security and performance)
  - Returns: Promise<string> — the hashed string to store in DB

comparePasswords(plain: string, hashed: string)
  - Compares a submitted plain password against stored hash
  - Returns: Promise<boolean> — true if they match

Tips:
  - ALWAYS hash before saving to DB
  - NEVER log or store plain passwords
  - Pass plain password to email BEFORE calling hashPassword()
  - bcrypt is async — always await it
```

---

### 3.3 File: `lib/email.ts` [NEW]

```
Purpose:
  All email sending logic using Nodemailer (SMTP) or Resend

Functions:

sendWelcomeEmail(to, name, loginEmail, tempPassword)
  - Builds the welcome HTML email using buildWelcomeEmailHtml()
  - Sends via configured transport (Nodemailer or Resend)
  - Returns: { success: true } or { success: false, error: string }

  Parameters:
    to           string   Recipient email address
    name         string   Employee full name (used in greeting)
    loginEmail   string   The email they will use to log in
    tempPassword string   The plain temporary password (before hashing)

buildWelcomeEmailHtml(name, loginEmail, tempPassword)
  - Private helper that builds the HTML string for welcome email
  - Uses inline CSS only (no external stylesheets — email clients strip them)
  - Returns: string (full HTML)

  Content includes:
    - Company/system logo placeholder
    - Greeting: "Dear [name],"
    - Message: "Your account has been created"
    - Credentials box:
        Login Email : [loginEmail]
        Password    : [tempPassword]
    - Login button linking to NEXT_PUBLIC_APP_URL/login
    - Important notice: "Change your password after first login"
    - Footer with app name and contact

createTransporter()
  - Private helper that creates and returns a Nodemailer transporter
  - Reads config from .env: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
  - Returns: nodemailer.Transporter

Tips:
  - For Gmail: use App Password, not account password (2FA must be on)
  - For production: use Resend or SendGrid — more reliable than Gmail SMTP
  - Always wrap send calls in try/catch
  - Log send failures to EmailLog in DB
  - Test with Ethereal (fake SMTP) in development: nodemailer.createTestAccount()
```

---

## 4. SERVER ACTIONS — BACKEND

> All backend logic in Next.js App Router uses Server Actions.
> These are functions marked with "use server" at the top of the file.
> They run on the server, can use Prisma directly, and are called from client components.

---

### 4.1 File: `app/actions/auth.ts` [MODIFY]

---

#### Function: `loginAction(email, password)`

```
Purpose: Authenticate a user and create a session

Steps:
  1. Find user by email in DB using prisma.user.findUnique()
  2. If not found → return { success: false, error: "Invalid credentials" }
  3. If isActive = false → return { success: false, error: "Account deactivated" }
  4. Compare submitted password with passwordHash using comparePasswords()
  5. If mismatch → return { success: false, error: "Invalid credentials" }
  6. Create session (JWT or NextAuth session)
  7. If isFirstLogin = true → return { success: true, redirect: "/change-password" }
  8. If role = ADMIN → return { success: true, redirect: "/dashboard/admin" }
  9. If role = EMPLOYEE → return { success: true, redirect: "/dashboard/employee" }

Return:
  { success: boolean, redirect?: string, error?: string }

Tips:
  - Do NOT tell user whether email or password was wrong separately
    (say "Invalid credentials" for both — prevents email enumeration attacks)
  - Lock account after 5 failed attempts (optional but recommended)
```

---

#### Function: `createEmployeeAccount(formData)`

```
Purpose: Admin creates a new employee account and sends welcome email

Steps:
  1. Validate all required fields (fullName, email, department, jobTitle, role)
  2. Validate email format
  3. Check if email already exists: prisma.user.findUnique({ where: { email } })
  4. If exists → return { success: false, error: "Email already in use" }
  5. Call generateTempPassword() from lib/password.ts
     → store the plain password in a variable (needed for email)
  6. Call hashPassword(tempPassword) → get hashedPassword
  7. Create user: prisma.user.create({
       data: {
         fullName, email, phone, department, jobTitle, role,
         passwordHash: hashedPassword,
         isFirstLogin: true,
         emailStatus: "PENDING"
       }
     })
  8. Call sendWelcomeEmail(email, fullName, email, tempPassword) from lib/email.ts
  9. If email sent successfully:
       → prisma.user.update({ emailStatus: "SENT", emailSentAt: new Date() })
       → prisma.emailLog.create({ userId, type: "WELCOME", status: "SUCCESS" })
  10. If email failed:
       → prisma.user.update({ emailStatus: "FAILED" })
       → prisma.emailLog.create({ userId, type: "WELCOME", status: "FAILED", errorMsg })
       → Still return success (account was created, just email failed)
  11. Return { success: true, employee: { id, fullName, email } }

Return:
  { success: boolean, employee?: object, error?: string }

Tips:
  - Never return the plain tempPassword to the client/frontend
  - Even if email fails, account is still created — admin can resend later
  - Wrap entire function in try/catch
  - This function must be called only by ADMIN role — check session role at top
```

---

#### Function: `resendCredentials(employeeId)`

```
Purpose: Admin resends a new set of login credentials to an employee

Steps:
  1. Verify caller is ADMIN (check session)
  2. Find employee by ID: prisma.user.findUnique({ where: { id: employeeId } })
  3. If not found → return { success: false, error: "Employee not found" }
  4. Generate new temp password using generateTempPassword()
  5. Hash the new password using hashPassword()
  6. Update user in DB:
       passwordHash = new hashed password
       isFirstLogin = true (reset — forces them to change again)
       emailStatus = "PENDING"
  7. Call sendWelcomeEmail() with new tempPassword
  8. Update emailStatus to SENT or FAILED
  9. Log to EmailLog table with type = "RESEND"
  10. Return { success: true } or { success: false, error }

Tips:
  - Reset isFirstLogin to true so they are forced to change the new temp password
  - Inform admin if email failed — they may need to check email config
```

---

#### Function: `changePassword(userId, currentPassword, newPassword, confirmPassword)`

```
Purpose: Employee changes their system-generated temp password

Steps:
  1. Validate newPassword and confirmPassword match
  2. Validate newPassword length ≥ 8 characters
  3. Validate newPassword is not the same as currentPassword
  4. Find user: prisma.user.findUnique({ where: { id: userId } })
  5. Compare currentPassword with stored passwordHash using comparePasswords()
  6. If mismatch → return { success: false, error: "Current password is incorrect" }
  7. Hash newPassword using hashPassword()
  8. Update DB:
       passwordHash = new hash
       isFirstLogin = false
  9. Return { success: true, redirect: "/dashboard/employee" }

Tips:
  - Always verify current password before allowing change
  - Set isFirstLogin = false ONLY after successful password change
  - Log the password change event (optional security audit)
```

---

#### Function: `logoutAction()`

```
Purpose: Clear the user session and redirect to login

Steps:
  1. Clear session cookie / JWT
  2. Redirect to /login

Tips:
  - This is a simple server action — just clear cookies and redirect
```

---

### 4.2 File: `app/actions/profile.ts` [MODIFY]

---

#### Function: `getAllEmployees(searchQuery?, page?, limit?)`

```
Purpose: Fetch all employee accounts for admin list page

Steps:
  1. Verify caller is ADMIN
  2. Build Prisma query:
       where: {
         role: { in: ["EMPLOYEE", "MANAGER"] },
         fullName/email contains searchQuery (if provided)
       }
       orderBy: createdAt desc
       skip: (page - 1) * limit
       take: limit
  3. Also get total count for pagination
  4. Return { employees: [], total, page, limit }

Return:
  { success: boolean, employees: User[], total: number, page: number }

Tips:
  - Never return passwordHash to frontend — use Prisma select to exclude it
  - Default limit to 20 per page
  - searchQuery should check both fullName and email (use OR in Prisma where)
```

---

#### Function: `getEmployeeById(id)`

```
Purpose: Get a single employee's full details

Steps:
  1. Verify caller is ADMIN
  2. prisma.user.findUnique({
       where: { id },
       include: { emailLogs: { orderBy: { sentAt: desc }, take: 5 } }
     })
  3. If not found → return { success: false, error: "Not found" }
  4. Return { success: true, employee }

Tips:
  - Include last 5 email logs to show history on detail page
  - Exclude passwordHash from returned object
```

---

#### Function: `updateEmployee(id, formData)`

```
Purpose: Admin updates employee profile details

Fields that CAN be updated:
  - fullName
  - phone
  - department
  - jobTitle
  - role
  - isActive (activate/deactivate)

Fields that CANNOT be updated here:
  - email (changing email is a separate sensitive operation)
  - passwordHash (use resendCredentials for reset)
  - emailStatus

Steps:
  1. Verify caller is ADMIN
  2. Validate formData fields
  3. prisma.user.update({ where: { id }, data: { ...formData } })
  4. Return { success: true, employee: updated }

Tips:
  - Only update the fields you explicitly allow — never spread all formData directly
```

---

#### Function: `deactivateEmployee(id)`

```
Purpose: Soft delete — deactivate an employee account

Steps:
  1. Verify caller is ADMIN
  2. prisma.user.update({ where: { id }, data: { isActive: false } })
  3. Return { success: true }

Tips:
  - Never hard delete user records — set isActive = false instead
  - Deactivated users cannot log in (check isActive in loginAction)
  - Admin can reactivate by setting isActive = true later
```

---

#### Function: `getAdminDashboardStats()`

```
Purpose: Get summary stats for admin dashboard page

Returns:
  - totalEmployees: number (role = EMPLOYEE or MANAGER, isActive = true)
  - newThisMonth: number (createdAt within current month)
  - emailFailed: number (emailStatus = FAILED)
  - deactivated: number (isActive = false)

Tips:
  - Use prisma.user.count() with where filters for each stat
  - Can run all 4 counts in parallel using Promise.all()
```

---

## 5. MIDDLEWARE & AUTH GUARD

### File: `middleware.ts` [NEW]

```
Purpose:
  Protect routes — redirect unauthenticated users to /login
  Prevent non-admins from accessing /dashboard/admin routes

Location: Root of project (next to package.json, not inside app/)

What it does:
  1. Runs on every request matching the config matcher
  2. Reads session token from cookie
  3. If no token → redirect to /login
  4. If token exists → decode and check role
  5. If accessing /dashboard/admin/* and role is not ADMIN → redirect to /dashboard/employee
  6. If accessing /dashboard/employee/* and role is ADMIN → redirect to /dashboard/admin
  7. If accessing /change-password and isFirstLogin is false → redirect to dashboard

Matcher config (routes to protect):
  - /dashboard/:path*
  - /change-password

Routes NOT protected (public):
  - /login
  - /api/auth/*
  - /_next/*
  - /public/*

Tips:
  - Use NextResponse.redirect() for redirects inside middleware
  - Keep middleware lightweight — avoid DB calls here
  - Store user role in JWT payload so you can read it without hitting DB
  - Use jose library for JWT in middleware (Edge Runtime compatible — bcrypt is NOT)
```

---

## 6. ALL PAGES

---

### 6.1 `app/login/page.tsx` [EXISTS — NO CHANGE]

```
Purpose: Public login page for all users
Current state: Already exists — no structural changes needed

Only LoginForm.tsx needs modification (see components section)
```

---

### 6.2 `app/login/LoginForm.tsx` [MODIFY]

```
Purpose: The login form component

Current state: Already exists
What to ADD:

After calling loginAction():
  - If response.redirect === "/change-password" → router.push("/change-password")
  - If response.redirect === "/dashboard/admin"  → router.push("/dashboard/admin")
  - If response.redirect === "/dashboard/employee" → router.push("/dashboard/employee")
  - If error → show error alert below the form

Loading state:
  - Disable submit button while action is running
  - Show spinner inside submit button

Tips:
  - Use useRouter from next/navigation for programmatic redirect
  - Use useTransition or useState for loading state
  - Do not use window.location — use Next.js router
```

---

### 6.3 `app/change-password/page.tsx` [NEW]

```
Route: /change-password
Access: Authenticated users with isFirstLogin = true

Purpose:
  Forced password change screen shown to new employees after first login
  with system-generated credentials

Page layout:
  - Centered card layout (not full dashboard layout — no sidebar)
  - System/company logo at top
  - Heading: "Set Your New Password"
  - Subheading: "For security, you must set a personal password before continuing."
  - Renders <ChangePasswordForm /> component
  - No navigation — user should not be able to leave without changing password

Tips:
  - Do NOT use the admin or employee dashboard layout for this page
  - Use a simple centered layout (like the login page)
  - Middleware should redirect away from this page if isFirstLogin = false
```

---

### 6.4 `app/change-password/ChangePasswordForm.tsx` [NEW]

```
Purpose: The form for changing password on first login

Form fields:
  1. Current Password
       type: password
       label: "Current Password (from your welcome email)"
       required: true

  2. New Password
       type: password
       label: "New Password"
       required: true
       validation: min 8 chars, must include number and uppercase

  3. Confirm New Password
       type: password
       label: "Confirm New Password"
       required: true
       validation: must match New Password

Submit button: "Update Password"

On submit:
  - Validate all three fields
  - Call changePassword() server action with userId from session
  - Show loading spinner
  - On success: redirect to /dashboard/employee
  - On error: show error message

Tips:
  - Show password strength indicator on New Password field
  - Show/Hide password toggle button on each field
  - Validate passwords match in real-time as user types confirm field
```

---

### 6.5 `app/dashboard/admin/page.tsx` [MODIFY]

```
Route: /dashboard/admin
Access: ADMIN role only

Purpose: Admin home dashboard with overview stats and quick actions

What to ADD to existing page:

Stats Row (4 cards side by side):
  Card 1: Total Employees
          → value from getAdminDashboardStats().totalEmployees
          → icon: Users
          → color: blue

  Card 2: New This Month
          → value from getAdminDashboardStats().newThisMonth
          → icon: UserPlus
          → color: green

  Card 3: Email Failed
          → value from getAdminDashboardStats().emailFailed
          → icon: MailX
          → color: red (alert indicator)
          → clicking navigates to employee list filtered by emailStatus = FAILED

  Card 4: Deactivated
          → value from getAdminDashboardStats().deactivated
          → icon: UserX
          → color: gray

Quick Actions Section:
  - Button: "Add New Employee" → /dashboard/admin/employees/create
  - Button: "View All Employees" → /dashboard/admin/employees

Recent Employees Table (last 5 added):
  - Columns: Name, Email, Date Added, Email Status
  - "View All" link at bottom

Tips:
  - Fetch stats using getAdminDashboardStats() — it's a server component so fetch directly
  - Stats cards should have a subtle hover effect
  - Email Failed card should stand out visually if count > 0
```

---

### 6.6 `app/dashboard/admin/AdminSidebar.tsx` [MODIFY]

```
Purpose: Navigation sidebar for all admin pages

What to ADD — new navigation link:

  Label:  Employees
  href:   /dashboard/admin/employees
  Icon:   Users (from lucide-react)
  Active: highlight when current path starts with /dashboard/admin/employees

Full expected sidebar links after modification:
  1. Dashboard       → /dashboard/admin
  2. Employees       → /dashboard/admin/employees     ← ADD THIS
  3. Profile         → /dashboard/admin/profile (if exists)
  4. Settings        → /dashboard/admin/settings (if exists)
  5. Logout          → calls logoutAction()

Tips:
  - Use usePathname() from next/navigation to detect active route
  - Highlight active link with a different background or border-left accent
```

---

### 6.7 `app/dashboard/admin/layout.tsx` [MODIFY]

```
Purpose: Shared layout wrapper for all /dashboard/admin/* pages

What to CHECK / ADD:
  - Verify AdminSidebar is rendered inside this layout
  - Ensure layout wraps all children with sidebar + top bar
  - No structural changes needed if sidebar is already included

Layout structure:
  <div className="flex">
    <AdminSidebar />
    <main className="flex-1">
      <TopBar />     ← optional: shows current page title + admin name
      {children}
    </main>
  </div>

Tips:
  - This layout already exists — only add sidebar link, do not restructure
```

---

### 6.8 `app/dashboard/admin/employees/page.tsx` [NEW]

```
Route: /dashboard/admin/employees
Access: ADMIN only

Purpose: View all employee accounts in a searchable, paginated table

Page structure:
  <PageHeader
    title="Employee Accounts"
    subtitle="Manage all employee accounts"
    actionLabel="Add New Employee"
    actionHref="/dashboard/admin/employees/create"
  />

  Search bar:
    - Input: search by name or email
    - Updates URL query param: ?search=john
    - Triggers re-fetch of employee list

  <EmployeeTable employees={employees} />

  Pagination:
    - Previous / Next buttons
    - Shows "Showing X–Y of Z employees"
    - Uses URL query params: ?page=2

Data fetching:
  - Call getAllEmployees(searchQuery, page, limit) server action
  - This is a Server Component — fetch data directly, no useEffect needed

Empty state:
  - If no employees: show illustration + "No employees found" + "Add First Employee" button

Tips:
  - Read search and page from searchParams prop (Next.js passes to Server Components)
  - Debounce search input on client side before updating URL
  - Table should be responsive — horizontal scroll on mobile
```

---

### 6.9 `app/dashboard/admin/employees/create/page.tsx` [NEW]

```
Route: /dashboard/admin/employees/create
Access: ADMIN only

Purpose: Form page to create a new employee account

Page structure:
  <PageHeader
    title="Create New Employee"
    subtitle="Fill in details to create an account and send login credentials"
  />

  Back button: ← Back to Employees (link to /dashboard/admin/employees)

  <CreateEmployeeForm />

On success:
  - CreateEmployeeForm shows <SuccessAlert email={employee.email} />
  - Optional: auto-redirect to /dashboard/admin/employees after 3 seconds

Tips:
  - Keep this page simple — just the header and form
  - Do not add extra navigation inside the form page
  - The form handles its own submit logic and feedback
```

---

### 6.10 `app/dashboard/admin/employees/[id]/page.tsx` [NEW]

```
Route: /dashboard/admin/employees/[id]
Access: ADMIN only

Purpose: View and edit a specific employee's details

Data fetching:
  - Read id from params
  - Call getEmployeeById(id) server action
  - If employee not found → show "Not Found" card + back button

Page sections:

  Section 1 — Employee Profile Header
    - Avatar (initials if no photo)
    - Full Name (large)
    - Email
    - Role badge (EMPLOYEE / MANAGER)
    - Status badge (Active / Inactive)
    - Email Status badge (SENT / FAILED / PENDING)

  Section 2 — Edit Form
    - Fields: Full Name, Phone, Department, Job Title, Role
    - Save button → calls updateEmployee(id, formData)
    - Shows success/error feedback

  Section 3 — Account Actions (card with action buttons)
    Button 1: Resend Credentials
              → Renders <ResendCredentialsButton employeeId={id} />
              → Shows confirm modal before action
              → Calls resendCredentials(id)
              → Shows success/error result

    Button 2: Deactivate Account (if isActive = true)
              OR Activate Account (if isActive = false)
              → Shows <ConfirmModal /> before action
              → Calls deactivateEmployee(id) or activateEmployee(id)
              → Shows result

  Section 4 — Email History (optional)
    - Table of last 5 EmailLog entries for this user
    - Columns: Type, Status, Date Sent, Error (if failed)

Tips:
  - Fetch employee as a Server Component — no client-side loading needed
  - ResendCredentialsButton must be a Client Component (needs onClick handler)
  - Show a warning in the Deactivate button: "This will prevent the employee from logging in"
```

---

### 6.11 `app/dashboard/employee/page.tsx` [EXISTS — NO CHANGE]

```
No changes needed.
Employee dashboard is already implemented.
The only connection is: after changePassword() succeeds, redirect here.
```

---

### 6.12 `app/dashboard/employee/profile/page.tsx` [EXISTS — NO CHANGE]

```
No changes needed.
Employee can view/edit their own profile here.
```

---

## 7. ALL COMPONENTS

---

### 7.1 `components/admin/CreateEmployeeForm.tsx` [NEW]

```
Type: Client Component ("use client")
Purpose: Form for admin to create a new employee account

Form Fields:

  fullName        text input    Required    Min 2 characters
  email           email input   Required    Valid email format, must be unique
  phone           text input    Optional    Phone number
  department      select        Required    Dropdown: Engineering, HR, Finance, Marketing, Operations, Other
  jobTitle        text input    Required
  role            select        Required    Options: EMPLOYEE, MANAGER
  startDate       date input    Optional

State management:
  - formData object with all field values
  - errors object for field-level validation messages
  - isLoading boolean (true while submitting)
  - isSuccess boolean (true after successful submit)
  - successEmail string (employee email to show in success alert)

Submit behaviour:
  1. Run client-side validation on all required fields
  2. Set isLoading = true
  3. Call createEmployeeAccount(formData) server action
  4. Set isLoading = false
  5. If success: set isSuccess = true, set successEmail
  6. If error: set field-level or global error message

Render when isSuccess = true:
  - Replace form with <SuccessAlert email={successEmail} />
  - Show "Create Another Employee" button that resets form state

Render when isLoading = true:
  - Disable all inputs and submit button
  - Show spinner inside submit button

Tips:
  - Use a two-column grid layout for form fields on desktop (single column on mobile)
  - Add asterisk (*) next to required field labels
  - Show inline error messages below each invalid field (not just a top-level error)
  - department dropdown options should match what's used across the system
```

---

### 7.2 `components/admin/EmployeeTable.tsx` [NEW]

```
Type: Client Component (needs interactive action buttons)
Purpose: Table of all employees on the employee list page

Props:
  employees: Employee[]   Array of employee objects from DB

Columns:
  1. Name        Full name + avatar initials circle
  2. Email       Email address
  3. Department  Text
  4. Role        <StatusBadge> with role value
  5. Status      <StatusBadge active/inactive>
  6. Email Sent  <EmailStatusBadge> with emailStatus value
  7. Actions     Three buttons: View, Edit, Resend Email

Column — Actions:
  View button:   → navigate to /dashboard/admin/employees/[id]
  Edit button:   → navigate to /dashboard/admin/employees/[id] (edit section)
  Resend button: → calls resendCredentials(id) after confirm prompt

Empty state:
  - If employees.length === 0: show "No employees found" row spanning all columns

Mobile behaviour:
  - On small screens: hide Department and Role columns
  - Show horizontal scroll on very small screens

Tips:
  - Do NOT put actual DB calls inside this component — receive data as props
  - Actions column buttons should be small (icon + label or just icon with tooltip)
  - Highlight rows where emailStatus = FAILED in a subtle red background
```

---

### 7.3 `components/admin/EmployeeCard.tsx` [NEW]

```
Type: Client Component
Purpose: Mobile-friendly card view for a single employee
         Used as alternative to table on small screens

Props:
  employee: Employee    Single employee object

Displays:
  - Avatar circle (initials of fullName)
  - Full Name (bold)
  - Email (muted)
  - Department | Job Title
  - Role badge
  - Status badge (Active/Inactive)
  - Email Status badge
  - Bottom row: View button + Resend button

When to use:
  - EmployeeTable can conditionally render EmployeeCard items
    on mobile (below md breakpoint) instead of table rows
  - Or use a responsive grid of EmployeeCards on the list page

Tips:
  - Keep card compact — max height so grid looks consistent
  - Use subtle shadow + border + rounded corners
```

---

### 7.4 `components/admin/EmailStatusBadge.tsx` [NEW]

```
Type: Server or Client Component (no interactivity needed)
Purpose: Visual badge showing whether the welcome email was sent successfully

Props:
  status: "SENT" | "FAILED" | "PENDING"

Render:
  SENT    → green background, white text, "✓ Email Sent"
  FAILED  → red background, white text, "✗ Email Failed"
  PENDING → yellow/amber background, dark text, "⏳ Pending"

Style:
  - Pill shape (rounded-full)
  - Small text (text-xs or text-sm)
  - Compact padding (px-2 py-1)

Tips:
  - Reuse StatusBadge component with different color props if possible
  - FAILED status should visually stand out to draw admin attention
```

---

### 7.5 `components/admin/ResendCredentialsButton.tsx` [NEW]

```
Type: Client Component ("use client")
Purpose: Button that triggers resendCredentials() with a confirmation step

Props:
  employeeId: string
  employeeEmail: string   (shown in confirm message)

Behaviour:
  1. Admin clicks "Resend Credentials" button
  2. <ConfirmModal /> opens with message:
     "This will generate a new password and send it to [employeeEmail].
      The employee will need to change this new password on next login.
      Are you sure?"
  3. If admin confirms:
     - Set isLoading = true
     - Call resendCredentials(employeeId) server action
     - Set isLoading = false
     - Show success toast: "New credentials sent to [employeeEmail]"
     - Or show error message if failed
  4. If admin cancels: close modal, do nothing

State:
  isLoading: boolean
  showModal: boolean
  result: { success: boolean, message: string } | null

Tips:
  - Never trigger resend without confirmation — it resets the employee's password
  - Disable button while loading
  - Show clear success/failure feedback after action
```

---

### 7.6 `components/ui/SuccessAlert.tsx` [NEW]

```
Type: Client or Server Component
Purpose: Green success alert shown after employee account creation

Props:
  email: string           The employee email that was sent credentials
  onCreateAnother?: () => void   Optional callback for "Create Another" button

Displays:
  - Green checkmark icon
  - Heading: "Account Created Successfully!"
  - Body: "Login credentials have been sent to [email]"
  - Note: "The employee must change their password on first login."
  - Button: "Create Another Employee" (calls onCreateAnother or resets)
  - Button: "View All Employees" (link to /dashboard/admin/employees)

Tips:
  - Use a card with green border-left accent rather than a full green background
  - This component replaces the form after success — the form should not stay visible
```

---

### 7.7 `components/ui/ErrorAlert.tsx` [NEW]

```
Type: Client Component
Purpose: Red error alert shown when an action fails

Props:
  message: string     The error message to display
  onDismiss?: () => void

Displays:
  - Red X icon
  - Message text
  - Dismiss (×) button

Tips:
  - Reuse this for all error feedback across admin pages
  - Auto-dismiss after 5 seconds (optional)
```

---

### 7.8 `components/ui/PageHeader.tsx` [NEW]

```
Type: Server Component
Purpose: Consistent page title header across all admin pages

Props:
  title: string
  subtitle?: string
  actionLabel?: string       Text for optional action button
  actionHref?: string        Link for the action button

Displays:
  - Large heading (title)
  - Smaller muted text (subtitle)
  - Right-aligned button if actionLabel + actionHref provided

Tips:
  - Use on every admin page for visual consistency
  - Action button should use the primary brand color
  - Add a bottom divider line or margin to separate header from page content
```

---

### 7.9 `components/ui/StatusBadge.tsx` [NEW]

```
Type: Server or Client Component
Purpose: Generic colored badge/pill for showing status values

Props:
  label: string       Text inside the badge
  variant: "green" | "red" | "yellow" | "blue" | "gray"

Usage:
  <StatusBadge label="Active" variant="green" />
  <StatusBadge label="Inactive" variant="gray" />
  <StatusBadge label="Manager" variant="blue" />
  <StatusBadge label="Employee" variant="yellow" />

Tips:
  - Build this as a generic component — all specific badges (EmailStatusBadge, etc.)
    can use this underneath with their own props mapping
  - Keep consistent sizing with EmailStatusBadge
```

---

### 7.10 `components/ui/LoadingSpinner.tsx` [NEW]

```
Type: Client Component
Purpose: Animated spinner shown during async operations

Props:
  size?: "sm" | "md" | "lg"    default: "md"
  color?: string               default: "currentColor"

Usage locations:
  - Inside submit buttons while form is submitting
  - Full page loading state (centered spinner)
  - Table loading state (spinner above empty table)

Tips:
  - Use CSS animation (animate-spin) with a circle border trick
  - Small variant (size="sm") goes inside buttons next to text
  - Can also export a FullPageSpinner wrapper for page-level loading
```

---

### 7.11 `components/ui/ConfirmModal.tsx` [NEW]

```
Type: Client Component
Purpose: Reusable confirmation dialog before destructive or important actions

Props:
  isOpen: boolean
  title: string             e.g. "Resend Credentials?"
  message: string           e.g. "This will reset the employee's password..."
  confirmLabel?: string     default: "Confirm"
  cancelLabel?: string      default: "Cancel"
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean       Shows spinner on confirm button while loading
  variant?: "danger" | "warning" | "info"   Affects confirm button color

Usage:
  <ConfirmModal
    isOpen={showModal}
    title="Resend Credentials?"
    message="A new password will be generated and emailed..."
    confirmLabel="Yes, Resend"
    onConfirm={handleResend}
    onCancel={() => setShowModal(false)}
    variant="warning"
  />

Tips:
  - Trap focus inside modal when open (accessibility)
  - Close on backdrop click and on Escape key
  - Confirm button should be red for "danger" actions (deactivate, delete)
  - Confirm button should be yellow/orange for "warning" actions (resend)
  - Use a portal or dialog element to render above all other content
```

---

## 8. EMAIL TEMPLATE

### File: Template built inside `lib/email.ts` as a string function

```
Subject line:
  "Welcome to [APP_NAME] — Your Login Credentials Inside"

HTML Structure (inline CSS only):

  Outer wrapper:
    - Background: light gray (#f4f4f4)
    - Max width: 600px, centered

  Email card:
    - Background: white
    - Rounded corners
    - Subtle shadow

  Header section:
    - Background: primary brand color (e.g. #2563eb)
    - White text: "[APP_NAME]"
    - Subtext: "Employee Account Created"

  Body section:
    - Greeting: "Dear [fullName],"
    - Paragraph: "Your employee account has been successfully created.
                   Below are your login credentials. Please keep them secure."

  Credentials box:
    - Background: #f0f9ff (light blue)
    - Border-left: 4px solid #2563eb
    - Border-radius: 8px
    - Padding: 20px
    - Two rows:
        Login Email  |  [email]
        Password     |  [tempPassword]

  Login button:
    - Background: #2563eb
    - White text: "Login to Your Account"
    - Link: [NEXT_PUBLIC_APP_URL]/login
    - Centered
    - Rounded corners

  Important notice box:
    - Background: #fff7ed (light orange)
    - Border-left: 4px solid #f97316
    - Text: "⚠ Important: You will be required to change your password
             after your first login for security purposes."

  Footer:
    - Muted small text
    - "[APP_NAME] · [company address or website]"
    - "If you did not expect this email, contact your administrator."
    - Copyright: "© [year] [APP_NAME]. All rights reserved."

Tips:
  - Use only inline styles — no <style> tags (Gmail strips them)
  - Test with Mailtrap or Ethereal before going live
  - Do NOT include HTML forms or JS in email body — email clients block them
  - Add plain text version as alternative (Nodemailer supports html + text)
  - Keep email under 100KB total size
```

---

## 9. ENVIRONMENT VARIABLES

### File: `.env` [MODIFY]

```
# ─────────────────────────────────────────────
# EXISTING VARIABLES (already in your .env)
# ─────────────────────────────────────────────

DATABASE_URL="postgresql://user:password@localhost:5432/yourdb"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"


# ─────────────────────────────────────────────
# NEW VARIABLES TO ADD
# ─────────────────────────────────────────────

# App Info (used in email template)
APP_NAME="YourSystemName"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── OPTION A: Gmail SMTP (for development/small projects) ──
EMAIL_PROVIDER="nodemailer"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="yoursystem@gmail.com"
EMAIL_PASS="your-16-char-google-app-password"
EMAIL_FROM="YourSystem <yoursystem@gmail.com>"

# ── OPTION B: Resend (recommended for production) ──
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="YourSystem <no-reply@yourdomain.com>"

# JWT (if not using NextAuth for token-based sessions)
JWT_SECRET="a-very-long-random-secure-string-here"
JWT_EXPIRY="24h"
```

---

## 10. PACKAGES TO INSTALL

```
Run in your project terminal:

# Email sending — choose ONE
npm install nodemailer
npm install --save-dev @types/nodemailer

# OR (recommended for production)
npm install resend

# Password hashing
npm install bcryptjs
npm install --save-dev @types/bcryptjs

# JWT (for session tokens if not using NextAuth)
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken

# OR (Edge-compatible JWT for middleware)
npm install jose

# Validation (recommended — works with server actions)
npm install zod

# Check if already installed (likely already in your project):
# - next
# - react / react-dom
# - @prisma/client
# - prisma (dev dependency)
# - tailwindcss
```

---

## 11. FULL FILE TREE

```
LEGEND:  [NEW] = Create  |  [MOD] = Modify  |  [OK] = Exists, no change

project/
├── app/
│   ├── actions/
│   │   ├── auth.ts                                    [MOD]
│   │   └── profile.ts                                 [MOD]
│   │
│   ├── change-password/
│   │   ├── ChangePasswordForm.tsx                     [NEW]
│   │   └── page.tsx                                   [NEW]
│   │
│   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── employees/
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx                       [NEW]
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx                       [NEW]
│   │   │   │   └── page.tsx                           [NEW]
│   │   │   ├── AdminSidebar.tsx                       [MOD]
│   │   │   ├── layout.tsx                             [MOD - verify sidebar]
│   │   │   └── page.tsx                               [MOD]
│   │   │
│   │   └── employee/
│   │       ├── profile/
│   │       │   └── page.tsx                           [OK]
│   │       ├── EmployeeSidebar.tsx                    [OK]
│   │       ├── layout.tsx                             [OK]
│   │       └── page.tsx                               [OK]
│   │
│   ├── login/
│   │   ├── LoginForm.tsx                              [MOD]
│   │   └── page.tsx                                   [OK]
│   │
│   ├── globals.css                                    [OK]
│   ├── layout.tsx                                     [OK]
│   └── page.tsx                                       [OK]
│
├── components/
│   ├── admin/
│   │   ├── CreateEmployeeForm.tsx                     [NEW]
│   │   ├── EmployeeTable.tsx                          [NEW]
│   │   ├── EmployeeCard.tsx                           [NEW]
│   │   ├── EmailStatusBadge.tsx                       [NEW]
│   │   └── ResendCredentialsButton.tsx                [NEW]
│   └── ui/
│       ├── SuccessAlert.tsx                           [NEW]
│       ├── ErrorAlert.tsx                             [NEW]
│       ├── PageHeader.tsx                             [NEW]
│       ├── StatusBadge.tsx                            [NEW]
│       ├── LoadingSpinner.tsx                         [NEW]
│       └── ConfirmModal.tsx                           [NEW]
│
├── lib/
│   ├── prisma.ts                                      [NEW]
│   ├── email.ts                                       [NEW]
│   └── password.ts                                    [NEW]
│
├── prisma/
│   ├── migrations/                                    [OK]
│   ├── schema.prisma                                  [MOD]
│   └── seed.ts                                        [MOD]
│
├── public/                                            [OK]
├── .env                                               [MOD]
├── middleware.ts                                      [NEW]
└── next.config.ts                                     [OK]

─────────────────────────────────────────────
TOTAL NEW FILES:    19
TOTAL MOD FILES:    8
─────────────────────────────────────────────
```

---

## 12. TIPS & BEST PRACTICES

---

### Security Tips

```
1. NEVER store plain text passwords
   Always hash with bcrypt before saving to DB.
   The plain temp password is used ONCE — to send in email — then discarded.

2. NEVER send hashed passwords to frontend
   Use Prisma's "select" to exclude passwordHash from all query results.

3. Use "Invalid credentials" for all login errors
   Do not say "Email not found" or "Wrong password" separately.
   This prevents attackers from learning which emails are registered.

4. Rate limit the login endpoint
   Prevent brute force attacks by limiting failed login attempts.
   After 5 failed attempts: lock for 15 minutes.

5. Always verify admin role in server actions
   Every admin server action must check the session role at the very start.
   Do not rely only on middleware.

6. JWT secret must be long and random
   Use at least 32 random characters.
   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

7. Use App Password for Gmail, not account password
   Gmail requires enabling 2FA and generating a 16-character App Password.
   Never use your main account password in .env.

8. Keep .env out of version control
   Confirm .env is in .gitignore — never commit secrets to Git.

9. Validate on both client AND server
   Client-side validation improves UX.
   Server-side validation (in server actions) is what actually protects the system.

10. Use zod for server action validation
    Define a schema for each form's expected input and parse it at the top
    of every server action before touching the DB.
```

---

### Database Tips

```
11. Always use soft delete (isActive = false) instead of hard delete
    You may need employee records for payroll history, audit logs, etc.
    Hard deleting breaks foreign key references.

12. Run migrations properly
    After every schema change:
      npx prisma migrate dev --name "describe_your_change"
    Never manually edit migration files after they are applied.

13. Use prisma.ts singleton in lib/
    In development, Next.js hot reload recreates modules.
    Without a singleton, you get "too many DB connections" warnings.

14. Exclude sensitive fields in queries
    Use Prisma select:
      prisma.user.findMany({
        select: { id: true, fullName: true, email: true, role: true }
        // passwordHash is NOT selected — never returned
      })

15. Use transactions for multi-step DB writes
    When creating user AND logging the email:
    Wrap both in prisma.$transaction([]) so if one fails, both roll back.
```

---

### Email Tips

```
16. Test with Ethereal or Mailtrap in development
    Ethereal: https://ethereal.email — creates fake SMTP, preview emails in browser
    Mailtrap: https://mailtrap.io — email sandbox with inbox preview
    Never send real emails in development/testing.

17. Always handle email failure gracefully
    If email sending fails, do NOT fail the entire account creation.
    Create the account, set emailStatus = FAILED, let admin resend later.

18. Use Resend for production
    Resend (resend.com) is far more reliable than Gmail SMTP for transactional email.
    Has a generous free tier (3,000 emails/month).
    Simple SDK: resend.emails.send({...})

19. Inline CSS only in email templates
    Most email clients (Gmail, Outlook) strip <style> tags and class names.
    Every style must be written as inline style attributes.

20. Include a plain text version
    Nodemailer accepts both html and text options.
    Always write a plain text fallback for email clients that don't render HTML.
```

---

### Next.js App Router Tips

```
21. Server Components vs Client Components
    Default in App Router: all components are Server Components.
    Add "use client" at top only when you need:
      - useState / useEffect
      - onClick, onChange event handlers
      - useRouter / usePathname
    Keep Server Components for data fetching and static rendering.

22. Server Actions must have "use server" directive
    Either at the top of the file (all functions in file are server actions)
    or inside each individual function.

23. Use Server Components for data fetching in pages
    In page.tsx files, call server actions or Prisma directly.
    No need for useEffect or API routes for simple data loading.

24. Middleware runs on Edge Runtime
    bcrypt does NOT work in Edge Runtime — use jose for JWT instead.
    Keep middleware lightweight (no DB calls).

25. Use searchParams for search and pagination
    In Server Components, searchParams prop carries URL query parameters.
    ?search=john&page=2 → props.searchParams.search, props.searchParams.page

26. Redirect after form submit
    Use redirect() from "next/navigation" inside server actions for redirects.
    Or return a redirect URL from the action and use router.push() on client.
```

---

### UI / UX Tips

```
27. Always show loading state during async actions
    Users expect feedback. A frozen button looks like a bug.
    Disable the button and show a spinner while the action runs.

28. Show inline field errors, not just a top banner
    "Email is required" should appear below the email input, not as a top toast.
    Top-level errors are fine for general failures ("Something went wrong").

29. Use confirm modals for destructive actions
    Deactivating an account or resending credentials (resets password) should
    require confirmation — never trigger on a single click.

30. Make Email Failed status visually alarming
    Admins need to notice when an email failed to send.
    Red badge in the table + highlighting the row draws attention effectively.

31. Responsive design — test on mobile
    Admin dashboards are often opened on tablets or phones.
    Use Tailwind's md: and lg: prefixes to adjust layout at different screen sizes.

32. Empty states should guide the user
    An empty employee table should show:
    "No employees yet" + "Add First Employee" button
    Never show a blank table with no explanation.
```

---

### Implementation Order (Recommended)

```
Follow this order to avoid dependency issues:

Step 1:  Update prisma/schema.prisma (add fields + EmailLog model)
Step 2:  Run: npx prisma migrate dev --name "add_employee_email_fields"
Step 3:  Update prisma/seed.ts and run: npx prisma db seed
Step 4:  Create lib/prisma.ts
Step 5:  Create lib/password.ts
Step 6:  Create lib/email.ts (test with Ethereal first)
Step 7:  Update app/actions/auth.ts (add all new functions)
Step 8:  Update app/actions/profile.ts (add employee management functions)
Step 9:  Create middleware.ts
Step 10: Create all UI components (ui/ folder first, then admin/ components)
Step 11: Create admin employee pages (list → create → detail)
Step 12: Create change-password page
Step 13: Modify LoginForm.tsx
Step 14: Modify AdminSidebar.tsx
Step 15: Modify admin dashboard page.tsx
Step 16: Test full flow end to end
```

---

*Full system documentation for: Employee Account Creation with Email Notification*
*Codebase: Next.js 14 App Router · Prisma ORM · PostgreSQL · Tailwind CSS*
*Total new files: 19 · Modified files: 8*