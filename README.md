# MUST Class Attendance System
 by Group H

SWE2106 Etivity 5. A digital class-attendance system for the Academic Registrar, Mbarara University of Science and Technology.

## Problem
Paper registers waste lecture time, allow proxy sign-ins, and make it hard to see who has fallen below the attendance threshold needed for exam eligibility.

## Users
- **Lecturer:** Creates courses, opens class sessions, marks attendance, views reports.
- **Student:** Views their own attendance and eligibility on the system.

## The Objectives
1. Cut the time spent taking attendance of students.
2. Keep one reliable record with no duplicate marking.
3. Flag students below the threshold (default 75%) automatically.

## Scope .
**In:** login with roles (JWT) using a username (students: registration number), changing username and password, , courses with enrolled students, class sessions, attendance marking, per-student and per-course reports, simple web page.
**Out (future work):** QR or biometric check-in, SMS alerts, admin role, password reset by email.

## Stack
Node.js, Express, MongoDB Atlas (Mongoose), JWT, express-validator, plain HTML/JS frontend, Postman.

## Setup locally using
```bash
git clone <repo-url> && cd must-attendance
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run seed              # creates demo users (wipes all data)
npm start                 # http://localhost:3000
```
Open `http://localhost:3000` for the frontend. API base: `http://localhost:3000/api`.

**Lecturer login:** username `lecturer`, password `password123`

**Student logins:** the team members are the students. The **registration number is the username and also the first password** (the username is not case sensitive, the password is). After logging in, every student and the lecturer can change their username and password under **My account**.

| Student | Username (Reg No.) | First password (Reg No.) |
|---|---|---|
| Tinyefunza Derick | 2025/BSE/173/PS | 2025/BSE/173/PS |
| Asingura Faizal | 2025/BSE/044/PS | 2025/BSE/044/PS |
| Enyang Mark | 2025/BSE/204/PS | 2025/BSE/204/PS |
| Kizza Jessy Mitembo | 2025/BSE/094/PS | 2025/BSE/094/PS |
| Muhairwe Andrew | 2025/BSE/110/PS | 2025/BSE/110/PS |
| Ainamaani Bright | 2025/BSE/001 | 2025/BSE/001 |
| Murungi Collins | 2025/BSE/003 | 2025/BSE/003 |
| Sserwanja Adrian Josephat | 2025/BSE/168/PS | 2025/BSE/168/PS |
| Nahabi Simon Peter | 2025/BSE/004 | 2025/BSE/004 |
| Rukundo Joshua | 2025/BSE/157/PS | 2025/BSE/157/PS |
| Kwagala Everest | 2025/BSE/242/PS | 2025/BSE/242/PS |

Run `npm run seed` once to create these accounts (it clears and recreates all data).

**Already have data and only want to switch from email login to username login?** Run `npm run migrate` instead. It keeps all users, courses, sessions and attendance, gives every user a username (students: reg number, lecturer: `lecturer`) and removes the old email index. Run it once, before deploying this version.

## Deploy to Vercel
1. Push the repo to GitHub (`api/index.js` and `vercel.json` must be included).
2. On vercel.com choose Add New, Project, import the repo, Framework Preset: Other.
3. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `ATTENDANCE_THRESHOLD` (75). Redeploy after adding them.
4. In MongoDB Atlas, Network Access must contain `0.0.0.0/0` (Vercel IPs change).
5. Test `https://<your-app>.vercel.app/api/health`, then log in on the home page.

## API
| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | /api/auth/login | any | Log in with `{ username, password }`, get a JWT |
| PUT | /api/auth/account | any (logged in) | Change own username and/or password (needs `currentPassword`) |
| POST | /api/courses | lecturer | Create course, enrol students by reg number |
| GET | /api/courses | any | List my courses |
| GET | /api/courses/:id/sessions | lecturer | List sessions |
| POST | /api/sessions | lecturer | Open a class session |
| POST | /api/sessions/:id/attendance | lecturer | Mark attendance (bulk) |
| GET | /api/students/:id/attendance | student (self) / lecturer | Attendance summary |
| GET | /api/courses/:id/report | lecturer | Percentages and below-threshold flag |

Responses always use `{ success, message?, data?, errors? }`. Status codes: 200/201 success, 400 validation, 401 no/invalid token, 403 wrong role, 404 not found, 409 duplicate.

## Postman
Import `postman/must-attendance.postman_collection.json`, run the folders in order 1 to 4 (or use the Collection Runner). Each request has tests, and tokens/ids are saved automatically.

## Team responsibilities (what they did)
| # | Name | Reg No. | Responsibility | Branch / PR |
|---|---|---|---|---|
| 1 | Tinyefunza Derick | 2025/BSE/173/PS | Team lead, GitHub repo, reviewing and merging PRs | feature/project-setup |
| 2 | Asingura Faizal | 2025/BSE/044/PS | Login, JWT and role middleware | feature/auth |
| 3 | Enyang Mark | 2025/BSE/204/PS | MongoDB Atlas, models, seed script | feature/database |
| 4 | Kizza Jessy Mitembo | 2025/BSE/094/PS | Courses and enrollment routes | feature/courses |
| 5 | Muhairwe Andrew | 2025/BSE/110/PS | Class session routes | feature/sessions |
| 6 | Ainamaani Bright | 2025/BSE/001 | Attendance marking and duplicate checks | feature/attendance |
| 7 | Murungi Collins | 2025/BSE/003 | Course report and 75% threshold logic | feature/reports |
| 8 | Sserwanja Adrian Josephat | 2025/BSE/168/PS | Student attendance endpoint and error handling | feature/student-view |
| 9 | Nahabi Simon Peter | 2025/BSE/004 | Frontend page | feature/frontend |
| 10 | Rukundo Joshua | 2025/BSE/157/PS | Postman collection and test data | feature/postman |
| 11 | Kwagala Everest | 2025/BSE/242/PS | Proposal, README and presentation | feature/docs |

Each member opened a pull request from their own branch.
