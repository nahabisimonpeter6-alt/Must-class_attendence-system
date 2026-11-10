require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Course.deleteMany(), Session.deleteMany(), Attendance.deleteMany()]);

  const password = await bcrypt.hash('password123', 10);
  await User.create([
    { name: 'Dr. Amina Nakato', email: 'lecturer@must.ac.ug', password, role: 'lecturer' },
    { name: 'Brian Mugisha', email: 'brian@must.ac.ug', password, role: 'student', regNumber: '2023/BSE/001' },
    { name: 'Grace Atuhaire', email: 'grace@must.ac.ug', password, role: 'student', regNumber: '2023/BSE/002' },
    { name: 'Peter Okello', email: 'peter@must.ac.ug', password, role: 'student', regNumber: '2023/BSE/003' }
  ]);

  console.log('Seeded. Login: lecturer@must.ac.ug / password123 (students: brian@, grace@, peter@must.ac.ug)');
  await mongoose.disconnect();
})();
