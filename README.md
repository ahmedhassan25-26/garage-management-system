# Garage Management System

A full-stack, role-based garage and workshop management system built with **React**, **Node.js**, **Express**, and **MongoDB**. It digitises the complete garage operation — customers, vehicles, job cards, spare-part inventory, invoices, and payments — while recording every sensitive action in an audit trail.

---

## 1. Project Overview

The Garage Management System is a single web application that lets a garage run its daily operations from one place. Staff sign in with role-based credentials, register customers and their vehicles, raise job cards, assign work to mechanics, record services and spare parts used, and automatically produce invoices when work is completed. Payments are recorded against those invoices, outstanding balances are tracked, inventory is deducted and restored atomically, and every important action is written to an audit log.

The business problem it solves is straightforward: manual garages typically juggle paper job cards, loose bins of spare parts, notebooks of customer names, and memory of "who still owes what". That approach is slow, error-prone, and impossible to audit. This system replaces it with structured records and enforced business rules that protect both inventory and financial data.

---

## 2. Problem Statement

A traditional or manual garage commonly faces the following problems, all of which this project addresses:

- **Customer records** — Customer details live in scattered notebooks or staff memory, making it hard to find a customer, their contact details, or their history.
- **Vehicle records** — VINs, plates, and servicing history are not consistently recorded, so the wrong vehicle can be worked on or history cannot be recalled.
- **Job tracking** — Without formal job cards there is no clear record of the complaint, the diagnosis, the services performed, the assigned mechanic, or whether a job is pending, in progress, or complete.
- **Spare-part inventory** — Parts are ordered and consumed without stock counts, leading to parts running out mid-job or money being tied up in unused stock.
- **Invoices** — There is no consistent, sequential invoice numbering or reliable breakdown of services, parts, subtotal, tax, and discount.
- **Payments** — Payments and partial payments are recorded informally, so balances go unpaid without anyone knowing.
- **User management** — Anyone has access to everything, or access is controlled by a shared password, with no way to restrict what each role can do.
- **Auditability** — There is no record of who created, changed, or cancelled what, making disputes and reviews impossible.

---

## 3. Project Objectives

The objectives realised by this implementation are:

- Provide a single web workspace for the complete garage workflow, from customer registration to payment collection.
- Enforce role-based access so that admins, managers, receptionists, and mechanics only see and do what their role permits.
- Store structured customer, vehicle, job card, spare part, invoice, and payment records in a central database.
- Automate invoice generation from completed, locked job cards with sequential invoice numbers.
- Protect inventory integrity with atomic stock deduction, stock restoration on cancellation, restocking, and low-stock alerts.
- Protect financial integrity with payment idempotency, balance enforcement, and payment status tracking.
- Keep a full audit trail of sensitive operations for accountability.
- Provide a responsive interface that works on desktop, tablet, and mobile.

---

## 4. Main Features

Implemented and verified features:

- **Authentication** — Email/password sign-in returning a JWT; protected routes on both API and UI; session restore from stored token.
- **Role-based access control** — Two enforcement layers: backend permission middleware and frontend route/navigation guards.
- **Dashboard** — Live statistics (customers, vehicles, jobs, inventory, invoices, revenue, pending revenue), job-status pie chart, 7-day revenue area chart, and recent jobs/invoices/payments.
- **Customer management** — Create, list, search, view, update, and delete customers (delete is blocked while related records exist).
- **Vehicle management** — Register vehicles against customers with unique license plates, update, view, delete, and list a customer's vehicles.
- **Job cards** — Create with complaint, diagnosis, services, and assigned mechanic; edit; status workflow; delete only when still safe.
- **Mechanic assignment** — Assign an active mechanic when creating or editing a job card; mechanics can only modify their own assigned jobs.
- **Services** — Line-item services with description and cost on job cards; costs roll up into the job's actual cost and the invoice.
- **Spare parts** — Inventory catalogue with unique part numbers, pricing (purchase and selling), supplier, location, and categories.
- **Inventory management** — Create, update, delete, view, and restock parts.
- **Stock deduction** — Adding a part to a job card deducts quantity atomically inside a database transaction and refuses overselling.
- **Stock restoration after cancellation** — Cancelling a job restores the exact quantities that were deducted, exactly once.
- **Low-stock management** — Parts at or below their minimum stock are flagged via a dedicated low-stock endpoint, dashboard counts, and a notification bell.
- **Invoices** — Auto-generated from completed and locked job cards with sequential numbers (`INV-00001`), services/parts breakdown, subtotal, discount, tax, total, and payment status; printable.
- **Payments** — Record payments against invoices with cash / bank / mobile money / card methods; partial payments supported; idempotency key prevents double-submission.
- **Payment status** — Invoices transition `unpaid → partially_paid → paid` based on the running balance.
- **Audit logs** — Time-stamped, searchable, filterable history of customer, vehicle, part, stock, and payment actions, including who performed them.
- **User management (admin)** — Create, update, deactivate/reactivate, and delete staff accounts; list mechanics for assignment.
- **Reports (admin/manager)** — Aggregated financial, operational, inventory, and mechanic performance views with CSV export.
- **Notifications** — Bell panel summarising low stock, pending jobs, and unpaid invoices.
- **Company settings** — Company name, address, phone, and email served from environment variables and printed on invoices.
- **Responsive UI** — Mobile-first layout with a collapsible sidebar, overlay navigation, and responsive tables via CSS media queries.

---

## 5. User Roles

Four roles are implemented. Permissions are defined centrally (backend `utils/permissions.js`, mirrored for UI navigation in `frontend/src/utils/permissions.js`) and enforced by API middleware.

| Area | Admin | Manager | Receptionist | Mechanic |
| ---- | ----- | ------- | ------------ | -------- |
| Dashboard | ✅ | ✅ | — | — |
| Customers — view / manage / delete | ✅ / ✅ / ✅ | ✅ / ✅ / ✅ | ✅ / ✅ / — | ✅ / — / — |
| Vehicles — view / manage / delete | ✅ / ✅ / ✅ | ✅ / ✅ / ✅ | ✅ / ✅ / — | ✅ / — / — |
| Job cards — view / create / edit | ✅ / ✅ / ✅ | ✅ / ✅ / ✅ | ✅ / ✅ / ✅ | ✅ / ✅ / ✅* |
| Job status (start / complete / cancel) | ✅ | ✅ | — | ✅* |
| Add parts to job | ✅ | ✅ | — | ✅* |
| Delete job card | ✅ | ✅ | — | — |
| Spare parts — view / manage | ✅ / ✅ | ✅ / ✅ | — / — | ✅ / — |
| Invoices — view / create / delete | ✅ / ✅ / ✅ | ✅ / ✅ / ✅ | ✅ / ✅ / — | — |
| Payments — view / create | ✅ / ✅ | ✅ / ✅ | ✅ / ✅ | — |
| Users (staff) management | ✅ | — | — | — |
| Audit logs | ✅ | ✅ | — | — |
| Reports (+ CSV export) | ✅ | ✅ | — | — |
| Company settings view | ✅ | ✅ | ✅ | ✅ |

\* Mechanics can only act on job cards **assigned to them**; on any other job card they get read-only access (`403` on modify, status change, or adding parts).

Additional role rules enforced in code:

- **Admin** is the only role that can create, update, or delete user accounts, and the only role with the `users.manage` permission. Deleting a user is additionally gated to admin (`authorize("admin")`).
- **Manager** has the same operational breadth as admin except user management.
- **Receptionist** handles front-desk operations (customers, vehicles, job cards, invoices, payments) but cannot delete or change job status and has no inventory, audit, or report access.
- **Mechanic** has a view-only dashboard-free workspace focused on their assigned work — customers, vehicles, job cards, and spare parts lookup.

---

## 6. Main Business Workflow

```
Customer → Vehicle → Job Card → Services + Spare Parts → Invoice → Payment → Balance / Payment Status → Audit Log
```

1. **Customer** — A customer is added with name and contact details.
2. **Vehicle** — One or more vehicles are registered against the customer with a unique license plate.
3. **Job Card** — A job card is raised for a customer's vehicle, capturing the complaint, diagnosis, services, and an assigned mechanic.
4. **Services + Spare Parts** — Services carry line-item costs. Spare parts are deducted from inventory atomically the moment they are attached to the job, so records and stock never drift apart.
5. **Invoice** — When the job is marked **completed** it is locked and an invoice is generated automatically (services + parts → subtotal → discount/tax → total) with a unique sequential number.
6. **Payment** — Payments reduce the invoice balance; partial payments are supported and each request is idempotency-protected against double-submission.
7. **Balance / Payment Status** — The invoice balance and `unpaid / partially_paid / paid` status track what remains owed.
8. **Audit Log** — Every action above (creation, stock deduction, status change, payment) is recorded with the acting user and time.

**How the system protects what it manages:**

- **Inventory integrity** — A part is only added to a job when stock is sufficient; deducing the quantity and recording it on the job card happen inside one MongoDB transaction session. Cancelling a job restores the deducted quantities exactly once (guarded so repeated cancels cannot double-restore), and stocking, low-stock, and part deletion are all reference-checked.
- **Financial integrity** — Invoices exist only for completed and locked jobs, one invoice per job card. Payments are applied atomically against the current balance, cannot exceed it, are rejected for cancelled invoices, and are idempotent via an `Idempotency-Key`. Deleting an invoice is blocked once it has any payment.

---

## 7. Technology Stack

### Frontend
| Technology | Version |
| ---------- | ------- |
| React | ^19.2.8 |
| React DOM | ^19.2.8 |
| React Router DOM | ^7.18.2 |
| Axios | ^1.19.0 |
| Recharts | ^3.10.1 |
| lucide-react (icons) | ^1.31.0 |
| Vite (build tool) | ^8.2.0 |
| ESLint | ^10.8.0 |

### Backend
| Technology | Version |
| ---------- | ------- |
| Node.js | (tested on v20.20.2) |
| Express | ^5.2.1 |
| Mongoose | ^9.9.3 |
| jsonwebtoken | ^9.0.3 |
| bcryptjs | ^3.0.3 |
| cors | ^2.8.6 |
| dotenv | ^17.4.2 |
| nodemon (development) | ^3.1.14 |

### Database
- **MongoDB** — accessed through Mongoose with schema validation, unique constraints, and multi-document transactions (sessions) for stock and payment operations. Invoices also rely on a `Counter` collection for sequential numbering.

### Authentication
- **JWT (jsonwebtoken)** — stateless Bearer tokens with a 1-day expiry.
- **bcryptjs** — password hashing before storage and verification at sign-in.

### Development tools
- Vite dev server with a proxy from `/api` to `http://localhost:5000`.
- ESLint for the React frontend (`npm run lint`).
- Backend helper scripts: `init-invoice-counter` and `create-admin`.

---

## 8. System Architecture

The application follows a classic client–server split:

```
React SPA (Vite)
      │  HTTP / JSON
      ▼
REST API (/api/...)
Express 5  → routes → controllers
      │
      ▼
Mongoose (ODM)  →  MongoDB
```

- **React frontend** — A Vite-built single-page application. Role-aware routing in `App.jsx` (protected routes, role routes, permission routes) decides which pages are reachable; the sidebar hides nav items the role cannot use. `AuthContext` holds the signed-in user and token.
- **REST API** — Express routes under `/api` (auth, users, customers, vehicles, job-cards, spare-parts, invoices, payments, dashboard, audit-logs, settings, reports) forward to controllers that validate input, enforce permissions, run business logic, and return JSON.
- **Mongoose / MongoDB** — Models define schemas with required fields, enums, unique indexes, and numeric constraints. Transactional flows (stock deduction, stock restoration, invoice generation, payment application) run in MongoDB sessions so partial failures cannot corrupt data.

**Authentication and authorization flow:**

1. The user signs in at `POST /api/auth/login`; the backend verifies the email, the account is active, and the bcrypt password hash, then returns a JWT (1-day expiry) with the user id and role.
2. The token is stored in `localStorage`; the Axios interceptor attaches `Authorization: Bearer <token>` to every request.
3. Each protected route first runs the `protect` middleware, which verifies the token signature and loads the user — rejecting inactive or missing accounts.
4. Permission-based middleware next checks the user's role against the permission matrix (e.g. `jobs.status`, `inventory.manage`), returning `403` when the role lacks the permission; some routes use role lists (e.g. mechanics only, admin only).
5. The Axios response interceptor logs the user out automatically on a `401`.

---

## 9. Project Structure

```
garage-management-system/
├── backend/                         # Express REST API
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/                 # Request handlers per resource
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── vehicleController.js
│   │   ├── jobCardController.js     # stock deduction + status workflow
│   │   ├── sparePartController.js   # restock, low-stock
│   │   ├── invoiceController.js
│   │   ├── paymentController.js     # idempotent payments
│   │   ├── dashboardController.js
│   │   ├── reportsController.js     # analytics + CSV export
│   │   ├── auditLogController.js
│   │   ├── userController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT protect + role authorize
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js  Customer.js  Vehicle.js  JobCard.js
│   │   ├── SparePart.js  Invoice.js  Payment.js
│   │   ├── AuditLog.js  Counter.js
│   ├── routes/                      # Express route definitions
│   ├── scripts/
│   │   ├── createAdmin.js           # bootstrap an admin account
│   │   └── initInvoiceCounter.js    # seed invoice number counter
│   ├── services/
│   │   └── invoiceService.js        # invoice creation from job cards
│   ├── utils/
│   │   ├── permissions.js           # role permission matrix
│   │   ├── validation.js            # shared input validation
│   │   └── createAuditLog.js
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # app entry point
│
└── frontend/                        # React SPA
    ├── src/
    │   ├── components/              # reusable UI (StatusBadge, SearchBar, Skeleton, …)
    │   ├── context/                 # AuthContext, ToastContext
    │   ├── layouts/
    │   │   └── MainLayout.jsx       # sidebar, topbar, notifications
    │   ├── pages/                   # Login, Dashboard, Customers, Vehicles,
    │   │                            # JobCards, SpareParts, Invoices, Payments,
    │   │                            # Reports, Users, AuditLogs
    │   ├── services/
    │   │   └── api.js               # Axios instance + interceptors
    │   ├── utils/
    │   │   └── permissions.js       # UI permission matrix mirror
    │   ├── App.jsx                  # routing + guards
    │   └── main.jsx
    ├── .env.example
    ├── index.html
    ├── vite.config.js               # dev proxy to /api → localhost:5000
    └── package.json
```

---

## 10. Security

The following security measures are implemented and verified in the code:

- **Password hashing** — Passwords are hashed with bcrypt before storage (12 rounds for the admin bootstrap script, 10 for user creation) and never returned by the API.
- **JWT authentication** — Stateless Bearer tokens signed with `JWT_SECRET`, 1-day expiry; the `protect` middleware rejects missing, malformed, expired, or invalid tokens and inactive accounts.
- **Role-based authorization** — A central permission matrix plus role lists gate every protected route; `403` is returned for forbidden operations.
- **JWT secret validation** — The server refuses to start when `JWT_SECRET` is missing, is the placeholder value, or is shorter than 32 characters.
- **Environment variables** — All secrets live in `.env` files (git-ignored); `backend/.env.example` documents variables with placeholders only; no secret values exist in the repository.
- **Input validation** — Object IDs are format-checked, numbers are validated as finite with minimum bounds, required fields are enforced, and duplicate values (license plates, part numbers, emails) are rejected before writing.
- **Inventory integrity** — Overselling is impossible: stock is decremented only when it is sufficient, atomically inside a transaction.
- **Payment / invoice protection** — Payments are idempotent, capped by the current balance, and rejected for cancelled invoices; invoices cannot be double-created for one job card, and invoiced/paid records are protected from deletion.
- **Security middleware** — CORS restricted to an explicit origin allow-list (`CLIENT_URL`), JSON body size limited to 1 MB, and a central error handler that returns generic messages for server errors.
- **Audit logging** — Sensitive operations (creates, updates, deletes, stock events, payments) record who did what and when.

---

## 11. Data Integrity

Protections that are implemented and verified:

- **Inventory** — Part quantities cannot go below zero (schema `min: 0`); deduction uses an atomic `quantity >= requested` update inside a transaction session so concurrent requests cannot oversell.
- **Job cards** — A job can only be started from `pending`, completed from `in_progress`, and completed/cancelled jobs are locked (`isLocked`) and immutable thereafter; parts cannot be added to a locked job.
- **Stock restoration** — Cancellation restores deducted quantities **exactly once**: an atomic claim (`status != cancelled` and `stockRestored != true`) guarantees repeated cancellation attempts cannot double-restore.
- **Invoices** — Only completed and locked job cards can be invoiced; a job card maps to at most one invoice (unique ref, `409` on repeat), invoice numbers are sequential through a counter, and totals are computed as `subtotal − discount + tax` and rejected when negative.
- **Payments** — Payment application is atomic against the current balance (`balance >= amount`), cannot exceed it, is rejected for cancelled invoices, and an `Idempotency-Key` makes retries safe.
- **Balances** — `amountPaid` and `balance` move together in a single transaction; `paymentStatus` is derived from the resulting balance (`unpaid / partially_paid / paid`).
- **Duplicate operations** — Unique indexes on license plates, part numbers, emails, invoice numbers, and payment idempotency keys, plus the `stockRestored` guard, prevent duplicates.
- **Referential integrity** — Deletion is blocked while dependent records exist: a customer with vehicles/jobs/invoices/payments, a vehicle with jobs/invoices, a part used in a job or invoice, a job with an invoice or used parts, and an invoice that has received payments. Vehicle ownership can also not change once jobs or invoices exist.

---

## 12. Installation

### Prerequisites
- **Node.js** and **npm**
- **MongoDB** running locally or a connection string to a MongoDB instance
  - Note: stock and payment operations use MongoDB multi-document transactions, which require a **replica set**. For local development, start MongoDB as a single-node replica set (e.g. `mongod --replSet rs0 ...` and `rs.initiate()`), or use a MongoDB Atlas cluster.

### 1. Clone the repository
```bash
git clone <repository-url>
cd garage-management-system
```

### 2. Backend installation
```bash
cd backend
npm install
```

### 3. Environment configuration (backend)
```bash
cp .env.example .env
```
Edit `backend/.env` and set `MONGODB_URI`, a strong `JWT_SECRET` (at least 32 random characters), and, for production, `CLIENT_URL`. The server will not start with a placeholder or short secret.

Optionally create the administrator account (requires `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env`):
```bash
npm run create-admin
```

If you are migrating an existing database, seed the invoice counter:
```bash
npm run init-invoice-counter
```

### 4. Database configuration
Point `MONGODB_URI` at your MongoDB instance, for example:
```
MONGODB_URI=mongodb://127.0.0.1:27017/garage_pro
```

### 5. Run the backend
```bash
npm run dev        # development (nodemon)
# or
npm start          # production entry point
```
The API runs on `http://localhost:5000` by default; the health endpoint is `GET /api/health`.

### 6. Frontend installation and run
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000`. No frontend environment variables are needed for local development.

---

## 13. Environment Variables

### Backend (`backend/.env`) — all documented in `backend/.env.example`
```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/garage_pro
JWT_SECRET=your_secure_secret_at_least_32_characters
CLIENT_URL=http://localhost:5173
COMPANY_NAME=Your Garage Name
COMPANY_ADDRESS=123 Main Street, City
COMPANY_PHONE=0123-456-789
COMPANY_EMAIL=info@example.com
```
Optional, used by the admin bootstrap script:
```bash
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### Frontend (`frontend/.env`) — documented in `frontend/.env.example`
```bash
# Leave unset when the frontend and API share a domain (default: /api).
# For a separately hosted API, use its full API path.
VITE_API_URL=
```

---

## 14. Testing

The final release verification covered the following, all executed against the repository:

- **Frontend build** — `npm run lint` (ESLint) passed; `npm run build` (Vite production build) completed successfully.
- **Backend startup** — `node --check server.js` passed; the server started and `GET /api/health` returned `200`.
- **End-to-end API verification** — A 41-check automated scenario run against a fresh MongoDB database (single-node replica set) covering:
  - **Authentication** — login success, `401` when accessing protected endpoints without a token.
  - **Authorization** — mechanics blocked from deleting customers, creating invoices, listing users, or managing inventory; receptionists blocked from audit logs and reports; both can still access their permitted areas.
  - **Customer workflow** — create customer and confirm it is retrievable.
  - **Vehicle workflow** — register a vehicle against the customer.
  - **Job cards** — create a job card with services and an assigned mechanic; start it; the status workflow rejects invalid transitions.
  - **Inventory** — attaching a part deducts stock correctly (10 → 7); insufficient-stock requests are rejected (`400`) without recording the part.
  - **Invoices** — completing a job auto-generates a locked invoice (`INV-00001`) with the correct total (`50 + 3 × 12 = 86`).
  - **Payments** — a partial payment updates balance/status correctly; replaying the same `Idempotency-Key` does not double-apply; overpayment is rejected; deleting a paid invoice is blocked.
  - **Audit logs** — stock deductions, payments, and stock-restoration events are recorded and queryable.
  - **Reports** — aggregated reports and CSV export return `200`.
- **Responsive behavior** — the UI is built with CSS media queries (collapsible sidebar, overlay navigation, scroll-lock, responsive tables) and verified through the production build.

All 41 automated checks passed (41 pass, 0 fail).

---

## 15. Screenshots

Screenshots are placed here as static assets (not committed with the repository). Add images named as below to complete the documentation:

| Page | Screenshot path |
| ---- | --------------- |
| Login | `docs/screenshots/login.png` |
| Dashboard | `docs/screenshots/dashboard.png` |
| Customers | `docs/screenshots/customers.png` |
| Vehicles | `docs/screenshots/vehicles.png` |
| Job Cards | `docs/screenshots/job-cards.png` |
| Spare Parts | `docs/screenshots/spare-parts.png` |
| Invoices | `docs/screenshots/invoices.png` |
| Payments | `docs/screenshots/payments.png` |
| Audit Logs | `docs/screenshots/audit-logs.png` |

---

## 16. Future Improvements

Reasonable next steps that are **not** already implemented:

- Password reset and change for users who are signed in.
- Email/SMS notifications for invoice issue and payment confirmation.
- A customer-facing portal where customers can track the status of their vehicle.
- Multi-branch support with per-branch inventory and staff.
- Barcode/QR scanning for incoming and outgoing parts.
- More granular tax configuration (multiple tax rates per service).
- Automated stock reorder suggestions and purchase order generation.
- Unit/automated test suites (integration and component tests) as a permanent CI pipeline.
- Deployment configuration (e.g. Dockerfiles and a `docker-compose` for the stack).

---

## 17. Author

**Ahmed Hassan**  
Computer Science Student

---

## 18. License

No license file is included in this repository; no license is claimed. The code is shared as-is for portfolio review.