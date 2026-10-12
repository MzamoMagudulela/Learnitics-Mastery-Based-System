#  Learnitics — Mastery-Based Learning Management System (LMS)

> **Learnitics** is an adaptive, mastery-driven learning platform engineered to replace passive education with true competency verification. Students only unlock subsequent modules once they achieve **$\ge 80\%$** on module checkpoint assessments. Features comprehensive instructor telemetry, miss-rate question heatmaps, institutional analytics, gamified badges, and **PWA Offline Mode with IndexedDB sync**.

---

##  Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Prerequisites & Environment Setup](#-prerequisites--environment-setup)
3. [Quick Start Guide](#-quick-start-guide)
4. [Demo Accounts & Credentials](#-demo-accounts--credentials)
5. [Complete Feature Matrix (Stages 0–10)](#-complete-feature-matrix)
6. [Mastery Progression & Security Rules](#-mastery-progression--security-rules)
7. [PWA Offline Engine & Sync Protocol](#-pwa-offline-engine--sync-protocol)
8. [Testing & Quality Checklist](#-testing--quality-checklist)
9. [Honest Disclosure of Limitations & Future Roadmap](#-honest-disclosure-of-limitations--future-roadmap)

---

##  Architectural Overview

Learnitics is built on a decoupled, production-grade MERN architecture:

```
Learnitics Architecture
├── client/ (Vite + React 18 SPA + PWA)
│   ├── public/ (manifest.json, sw.js Service Worker)
│   ├── src/
│   │   ├── api/ & services/ (Axios + JWT interceptor)
│   │   ├── components/ (Dashboard, Common Navbar, OfflineBanner, ProtectedRoute)
│   │   ├── context/ (AuthContext with reactive roles)
│   │   ├── pages/ (Home, Login, Register, Dashboard, CourseOverview, Quiz, Achievements, Catalog)
│   │   └── utils/ (offlineStorage.js — IndexedDB + localStorage fallback)
│
└── server/ (Node.js + Express REST API)
    ├── config/ (Mongoose connection & roles)
    ├── controllers/ (Auth, Course, Module, Lesson, Quiz, Analytics, User, Sync)
    ├── middleware/ (JWT verifyToken, roleGuard, optionalAuth)
    ├── models/ (14 Mongoose schema definitions + compound indexes)
    ├── routes/ (REST endpoints mounted under /api/*)
    └── utils/ (masteryCalculator.js streak & achievement triggers)
```

---

##  Prerequisites & Environment Setup

- **Node.js**: v18.0.0 or later (Tested on Node v25.9.0)
- **npm**: v9.0.0 or later
- **MongoDB**: Local MongoDB community server running on port `27017` or MongoDB Atlas URI

### Server Environment Configuration (`server/.env`)

Create or review `server/.env` (a template is available in `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/learnitics
JWT_SECRET=learnitics_super_secret_mastery_jwt_key_2026_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

##  Quick Start Guide

### 1. Install Dependencies

Open a terminal at the repository root:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Seed the Database

Seed 1 Admin, 2 Teachers, 16 Students, 3 complete courses with ordered modules, lessons, quizzes, and 8 achievement definitions:

```bash
cd server
npm run seed
```

### 3. Run the Development Servers

In Terminal 1 (Start Express API):
```bash
cd server
npm run dev
# Server boots at http://localhost:5000
# Health check available at http://localhost:5000/api/health
```

In Terminal 2 (Start React Frontend):
```bash
cd client
npm run dev
# Vite client launches at http://localhost:5173
```

Open your browser to `http://localhost:5173`.

---

##  Demo Accounts & Credentials

The database seed provides ready-to-test role-based credentials. All passwords are encrypted with bcrypt (10 rounds):

| Role | Email | Password | 2FA Security Answers | Primary Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@learnitics.com` | `AdminPass123!` | Q1: `SPU`<br>Q2: `2025` | `/admin` (Institutional Governance) |
| **Instructor / Teacher** | `teacher@learnitics.com` | `TeacherPass123!` | Q1: `spu`<br>Q2: `2026` | `/teacher` (Telemetry & Heatmap) |
| **Learner / Student** | `student@learnitics.com` | `StudentPass123!` | *Direct login* | `/dashboard` (Mastery Experience) |

*Alternative teacher:* `ada.lovelace@learnitics.edu` / `TeacherPass123!` (Q1: `spu`, Q2: `2026`)  
*Alternative student:* `beatriz@learnitics.edu` / `StudentPass123!`

---

##  Complete Feature Matrix

### Stage 1 — Database Schema & Data Models
- 14 complete Mongoose models: `User`, `UserProfile`, `Course`, `Module`, `CourseEnrollment`, `Lesson`, `LessonProgress`, `Quiz`, `Question`, `AnswerOption`, `QuizAttempt`, `AttemptAnswer`, `Achievement`, `UserAchievement`.
- Strict enum validations (`student`, `teacher`, `admin`; `mcq`, `fill-blank`).
- Compound indexes for sub-second aggregations.

### Stage 2 — Authentication & Access Control
- JWT payload containing `{ id, role }`.
- `roleGuard('student' | 'teacher' | 'admin')` middleware.
- Passwords stripped from all JSON responses.

### Stage 3 — Course & Module Engine with Mastery Locks
- `GET /api/courses/:id` algorithm:
  - **Module 1**: Always unlocked.
  - **Module $N$**: Unlocked **only** if the quiz for Module $N-1$ was passed with $\ge 80\%$.
- Prevents duplicate enrollments; automatically updates course completion percentages.

### Stage 4 — Secure Quiz Engine
- **Zero Leakage**: `GET /api/quizzes/:id/attempt` strips all `isCorrect` flags and fill-in-the-blank answer keys before sending questions to the client.
- **Server-Side Grading**: Multiple choice matches option IDs; fill-in-the-blank evaluates case-insensitive trimmed strings against acceptable aliases.
- Evaluates $\ge 80\%$ mastery threshold; unlocks next module upon passing.

### Stage 5 — Aggregation Analytics & Daily Streaks
- **Student Analytics**: Active courses, average progress, completed courses, daily streaks, per-course completion progress bars, recent achievements.
- **Teacher Analytics**: Enrolled students, average scores, and **question miss-rate heatmap** data.
- **Admin Analytics**: Institutional KPIs, course enrollment distributions, user role breakdowns.
- **Daily Streak Engine**: Increments at most once per calendar day (UTC); resets on broken streaks; awards 5-day streak badge.

### Stage 6 — React Foundation & Auth Pages
- Responsive Landing Page with `#1e3a8a` hero, features grid, testimonials, and statistics.
- Minimalist centered card authentication pages (Login & Sign Up) with role-based post-login redirects.

### Stage 7 — Student Experience
- Student Dashboard featuring:
  - ` X Day Streak` badge
  - Four color-coded stat cards:
    - 📘 **Active Courses** (Blue)
    - 📗 **Average Progress** (Green)
    - 📙 **Completed Courses** (Orange)
    - 📕 **Study Streak** (Red)
  - Learning goals with per-course progress bars.
- Course Overview with  locked module indicators, video/text lesson reader, "Mark Complete", and offline study pack downloader.
- Interactive step-by-step Quiz Engine with 80% threshold Pass/Fail banner and remediation feedback.
- Achievements Page with earned vs. greyed-out locked badges.

### Stage 8 — Teacher & Admin Dashboards
- **Teacher Dashboard**:
  - KPIs: Total Courses, Total Students, Class Avg Score.
  - "My Courses" curriculum selector + Course Creation form with SDG goals.
  - Recharts student score bar chart.
  - **Question Miss-Rate Heatmap** with **>50% miss rate highlighted in red**.
  - Remediation assignment modal and per-student feedback form.
- **Admin Dashboard**:
  - Four KPIs: Total Users, Total Courses, Active Students, Teachers.
  - Recharts "Course Distribution by Type" Pie Chart.
  - Recharts "User Role Distribution" Bar Chart.
  - User management table with live role dropdown changes and account deactivation/activation.
  - Content provisioning form and compliance report export cards.

### Stage 9 — PWA Offline Mode & Data Synchronization
- `manifest.json` configured for standalone installation.
- Service Worker (`sw.js`) caching visited lessons, static assets, and app shell.
- "Download for Offline" storing lesson data in **IndexedDB** (`LearniticsOfflineDB`) with `localStorage` fallback.
- Global offline indicator banner appearing when `navigator.onLine === false`.
- Batched sync protocol to `POST /api/sync`: deduplicates by client-generated IDs (`clientSyncId`), autonomous server-side grading, and atomic progress persistence.

### Stage 10 — Testing, Accessibility & Performance
- Full accessibility audit: WCAG AA contrast, `:focus-visible` styling, ARIA radiogroups, keyboard navigation.
- Dashboard code-splitting via `React.lazy` separating Recharts bundles (reducing student first-paint bundle by >350 KB).

---

##  Mastery Progression & Security Rules

1. **The 80% Mastery Rule**:
   - Every module ends in a checkpoint quiz.
   - Module $K$ is locked if $\text{Score}(\text{Quiz}_{K-1}) < 80\%$.
2. **Answer Key Protection**:
   - `GET /api/quizzes/:id/attempt` projects answer options as `{ _id, optionText, order }`.
   - All `isCorrect` fields and fill-in-the-blank answer arrays are excluded server-side before response transmission.
3. **Daily Streak Protection**:
   - Activity timestamp checked against UTC calendar days. Multiple activities within the same day update `lastActiveDate` without artificially inflating the streak count.

---

##  PWA Offline Engine & Sync Protocol

When a student goes offline or has an unstable connection:

1. **Viewing Saved Lessons**: Lessons saved via *"Download for Offline"* are retrieved instantly from IndexedDB.
2. **Offline Actions**: Marking lessons complete or submitting quiz attempts generates a `clientSyncId` and queues the payload locally.
3. **Reconnection Sync**:
   - When `window.ononline` fires, `synchronizeOfflineQueue()` sends:
     ```json
     {
       "lessonProgress": [{ "clientSyncId": "sync-...", "lessonId": "...", "percentCompleted": 100 }],
       "quizAttempts": [{ "clientSyncId": "sync-...", "quizId": "...", "answers": [...] }]
     }
     ```
   - The server inspects `clientSyncId` against existing records to prevent double-submission.
   - If unrecorded, it evaluates answers, updates daily streaks, recomputes course completion, and returns synced confirmations.

---

##  Testing & Quality Checklist

- [x] **Registration & Login**: Tested across `student`, `teacher`, and `admin` with auto-routing.
- [x] **Module Locking Logic**: Verified Module 1 unlocked; Module 2 locked until Module 1 quiz passed $\ge 80\%$.
- [x] **Quiz Submission Flow**: Verified failing ($<80\%$) renders retry banner; passing ($\ge 80\%$) unlocks next module.
- [x] **Miss-Rate Heatmap**: High-miss rate questions correctly highlighted in red when miss rate exceeds 50%.
- [x] **PWA Build Verification**: Built with Vite production pipeline with 0 syntax errors or broken imports.
- [x] **Accessibility**: WCAG AA focus rings, screen-reader labels, and keyboard enter/space controls verified.

---

##  Honest Disclosure of Limitations & Future Roadmap

1. **Video Hosting**: Current video lessons utilize responsive YouTube/Vimeo embed players. Direct multi-part MP4 upload to S3/Cloudflare R2 is planned for enterprise deployments.
2. **WebRTC Quiz Proctoring**: Current quiz engine does not enforce webcam or tab-switching detection; students are trusted under self-paced honor code.
3. **Advanced Rich-Text Formatting**: Text lessons currently render clean markdown and pre-formatted text. An embedded WYSIWYG editor (e.g. TipTap) can be added for teacher authoring.
4. **Push Notifications**: Offline synchronization is event-driven (`window.ononline`). Background Push Notifications via WebPush protocol can further remind learners of expiring daily streaks.
