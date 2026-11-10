# MUST Class Attendance System

SWE2106 Etivity 5. A digital class-attendance system for the Academic Registrar, Mbarara University of Science and Technology.

## Problem
Paper registers waste lecture time, allow proxy sign-ins, and make it hard to see who has fallen below the attendance threshold needed for exam eligibility.

## Users
- **Lecturer:** creates courses, opens class sessions, marks attendance, views reports.
- **Student:** views their own attendance and eligibility.

## Objectives
1. Cut the time spent taking attendance.
2. Keep one reliable record with no duplicate marking.
3. Flag students below the threshold (default 75%) automatically.

## Scope
**In:** login with roles (JWT), courses with enrolled students, class sessions, attendance marking, per-student and per-course reports, simple web page.
**Out (future work):** QR or biometric check-in, SMS alerts, admin role, password reset.

## Stack
Node.js, Express, MongoDB Atlas (Mongoose), JWT, express-validator, plain HTML/JS frontend, Postman.

## Setup
```bash
git clone <repo-url> && cd must-attendance
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run seed              # creates demo users
npm start                 # http://localhost:3000
```
Open `http://localhost:3000` for the frontend. API base: `http://localhost:3000/api`.

Demo logins (password `password123`): `lecturer@must.ac.ug`, `brian@must.ac.ug`, `grace@must.ac.ug`, `peter@must.ac.ug`.

## API
| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | /api/auth/login | any | Get a JWT |
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

## Team responsibilities
| Member | Responsibility | Branch / PR |
|---|---|---|
| Member 1 | Auth, roles, JWT middleware | feature/auth |
| Member 2 | Courses and enrollment | feature/courses |
| Member 3 | Sessions and attendance marking | feature/attendance |
| Member 4 | Reports and student view | feature/reports |
| Member 5 | Frontend, Postman, README | feature/frontend-docs |

Each member opens a pull request from their own branch.
# Must_attendence-website
# Must_attendence-website
# Must_attendence-website
