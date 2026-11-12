// Generates must-attendance.postman_collection.json  (run: node postman/build.js)
const fs = require('fs');
const U = '{{baseUrl}}';
const json = (o) => JSON.stringify(o, null, 2);
const test = (lines) => ({ listen: 'test', script: { type: 'text/javascript', exec: lines } });
const req = (name, method, path, { body, auth, tests = [], desc } = {}) => ({
  name,
  event: tests.length ? [test(tests)] : undefined,
  request: {
    method,
    description: desc,
    header: [{ key: 'Content-Type', value: 'application/json' }],
    auth: auth ? { type: 'bearer', bearer: [{ key: 'token', value: `{{${auth}}}`, type: 'string' }] } : { type: 'noauth' },
    body: body ? { mode: 'raw', raw: json(body), options: { raw: { language: 'json' } } } : undefined,
    url: { raw: U + path, host: ['{{baseUrl}}'], path: path.split('/').filter(Boolean) }
  }
});
const status = (code) => `pm.test('Status is ${code}', () => pm.response.to.have.status(${code}));`;
const ok = "pm.test('success is true', () => pm.expect(pm.response.json().success).to.eql(true));";
const bad = "pm.test('success is false', () => pm.expect(pm.response.json().success).to.eql(false));";

const collection = {
  info: {
    name: 'MUST Class Attendance API',
    description: 'Run the folders in order. Seed the DB first (npm run seed). Variables are filled automatically by test scripts.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api' },
    { key: 'lecturerToken', value: '' }, { key: 'studentToken', value: '' },
    { key: 'courseId', value: '' }, { key: 'sessionId', value: '' },
    { key: 'student1Id', value: '' }, { key: 'student2Id', value: '' }, { key: 'student3Id', value: '' }
  ],
  item: [
    { name: '1. Auth', item: [
      req('Login lecturer (valid)', 'POST', '/auth/login', {
        body: { email: 'lecturer@must.ac.ug', password: 'password123' },
        tests: [status(200), ok, "pm.collectionVariables.set('lecturerToken', pm.response.json().token);"]
      }),
      req('Login student (valid)', 'POST', '/auth/login', {
        body: { email: 'derick@must.ac.ug', password: '2025/BSE/173/PS' },
        tests: [status(200), ok,
          "pm.collectionVariables.set('studentToken', pm.response.json().token);",
          "pm.collectionVariables.set('student1Id', pm.response.json().user.id);"]
      }),
      req('Login (wrong password)', 'POST', '/auth/login', {
        body: { email: 'lecturer@must.ac.ug', password: 'wrong' }, tests: [status(401), bad]
      }),
      req('Login (missing fields)', 'POST', '/auth/login', {
        body: { email: 'not-an-email' }, tests: [status(400), bad]
      })
    ]},
    { name: '2. Courses', item: [
      req('Create course (valid)', 'POST', '/courses', {
        auth: 'lecturerToken',
        body: { code: 'SWE2106', name: 'Internet Technologies and Web Design',
          studentRegNumbers: ['2025/BSE/173/PS', '2025/BSE/044/PS', '2025/BSE/204/PS'] },
        tests: [status(201), ok, "pm.collectionVariables.set('courseId', pm.response.json().data._id);",
          "const s = pm.response.json().data.students; pm.collectionVariables.set('student1Id', s[0]); pm.collectionVariables.set('student2Id', s[1]); pm.collectionVariables.set('student3Id', s[2]);"]
      }),
      req('Create course (duplicate code)', 'POST', '/courses', {
        auth: 'lecturerToken', body: { code: 'SWE2106', name: 'Duplicate course' }, tests: [status(409), bad]
      }),
      req('Create course (invalid code)', 'POST', '/courses', {
        auth: 'lecturerToken', body: { code: 'X1', name: 'Bad code' }, tests: [status(400), bad]
      }),
      req('Create course (unknown reg number)', 'POST', '/courses', {
        auth: 'lecturerToken', body: { code: 'SWE2107', name: 'Ghost students', studentRegNumbers: ['9999/XXX/999'] },
        tests: [status(400), bad]
      }),
      req('Create course (as student, forbidden)', 'POST', '/courses', {
        auth: 'studentToken', body: { code: 'SWE2108', name: 'Not allowed' }, tests: [status(403), bad]
      }),
      req('Create course (no token)', 'POST', '/courses', {
        body: { code: 'SWE2109', name: 'No token' }, tests: [status(401), bad]
      }),
      req('List my courses', 'GET', '/courses', { auth: 'lecturerToken', tests: [status(200), ok] })
    ]},
    { name: '3. Sessions and attendance', item: [
      req('Open session (valid)', 'POST', '/sessions', {
        auth: 'lecturerToken', body: { courseId: '{{courseId}}', topic: 'Express routing', date: '2026-11-10' },
        tests: [status(201), ok, "pm.collectionVariables.set('sessionId', pm.response.json().data._id);"]
      }),
      req('Open session (bad date)', 'POST', '/sessions', {
        auth: 'lecturerToken', body: { courseId: '{{courseId}}', topic: 'Bad date', date: 'tomorrow' }, tests: [status(400), bad]
      }),
      req('Open session (course not found)', 'POST', '/sessions', {
        auth: 'lecturerToken', body: { courseId: '64b0000000000000000000aa', topic: 'Ghost', date: '2026-11-10' },
        tests: [status(404), bad]
      }),
      req('Mark attendance (valid)', 'POST', '/sessions/{{sessionId}}/attendance', {
        auth: 'lecturerToken',
        body: { records: [
          { studentId: '{{student1Id}}', status: 'present' },
          { studentId: '{{student2Id}}', status: 'late' },
          { studentId: '{{student3Id}}', status: 'absent' } ] },
        tests: [status(201), ok]
      }),
      req('Mark attendance (duplicate)', 'POST', '/sessions/{{sessionId}}/attendance', {
        auth: 'lecturerToken', body: { records: [{ studentId: '{{student1Id}}', status: 'present' }] },
        tests: [status(409), bad]
      }),
      req('Mark attendance (invalid status)', 'POST', '/sessions/{{sessionId}}/attendance', {
        auth: 'lecturerToken', body: { records: [{ studentId: '{{student1Id}}', status: 'sleeping' }] },
        tests: [status(400), bad]
      }),
      req('Mark attendance (empty records)', 'POST', '/sessions/{{sessionId}}/attendance', {
        auth: 'lecturerToken', body: { records: [] }, tests: [status(400), bad]
      }),
      req('Mark attendance (as student, forbidden)', 'POST', '/sessions/{{sessionId}}/attendance', {
        auth: 'studentToken', body: { records: [{ studentId: '{{student1Id}}', status: 'present' }] },
        tests: [status(403), bad]
      })
    ]},
    { name: '4. Reports', item: [
      req('Course report (lecturer)', 'GET', '/courses/{{courseId}}/report', {
        auth: 'lecturerToken', tests: [status(200), ok,
          "pm.test('has per-student rows', () => pm.expect(pm.response.json().data.length).to.be.above(0));"]
      }),
      req('Course report (as student, forbidden)', 'GET', '/courses/{{courseId}}/report', {
        auth: 'studentToken', tests: [status(403), bad]
      }),
      req('Course report (invalid id)', 'GET', '/courses/123/report', { auth: 'lecturerToken', tests: [status(400), bad] }),
      req('My attendance (student, own)', 'GET', '/students/{{student1Id}}/attendance', {
        auth: 'studentToken', tests: [status(200), ok]
      }),
      req("Another student's attendance (forbidden)", 'GET', '/students/{{student2Id}}/attendance', {
        auth: 'studentToken', tests: [status(403), bad]
      })
    ]}
  ]
};
fs.writeFileSync(__dirname + '/must-attendance.postman_collection.json', json(collection));
console.log('Collection written.');
