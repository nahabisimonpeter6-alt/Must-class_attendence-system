require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');

// Team members (from the README) are the students.
// Username = registration number (lowercased) and the first password = registration number.
const students = [
  ['Tinyefunza Derick', '2025/BSE/173/PS'],
  ['Asingura Faizal', '2025/BSE/044/PS'],
  ['Enyang Mark', '2025/BSE/204/PS'],
  ['Kizza Jessy Mitembo', '2025/BSE/094/PS'],
  ['Muhairwe Andrew', '2025/BSE/110/PS'],
  ['Ainamaani Bright', '2025/BSE/001'],
  ['Murungi Collins', '2025/BSE/003'],
  ['Sserwanga Adrian Josephat', '2025/BSE/168/PS'],
  ['Nahabi Simon Peter', '2025/BSE/004'],
  ['Rukundo Joshua', '2025/BSE/157/PS'],
  ['Kwagala Everest', '2025/BSE/242/PS']
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Course.deleteMany(), Session.deleteMany(), Attendance.deleteMany()]);
  // Older versions had a unique index on email; remove it so users without an email can be saved.
  try { await User.collection.dropIndex('email_1'); } catch (e) { /* index not there, fine */ }

  const lecturerPassword = await bcrypt.hash('password123', 10);
  const studentDocs = await Promise.all(
    students.map(async ([name, regNumber]) => ({
      name,
      regNumber,
      username: regNumber.toLowerCase(),
      role: 'student',
      password: await bcrypt.hash(regNumber, 10),
      passwordIsDefault: true
    }))
  );

  await User.create([
    { name: 'Dr. Amina Nakato', username: 'lecturer', password: lecturerPassword, role: 'lecturer' },
    ...studentDocs
  ]);

  console.log('Seeded. Lecturer: username "lecturer", password "password123".');
  console.log('Students: username = registration number, password = registration number (see README).');
  await mongoose.disconnect();
})();
