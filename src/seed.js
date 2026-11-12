require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');

// Team members (from the README) are the students. Password = registration number.
const students = [
  ['Tinyefunza Derick', 'derick@must.ac.ug', '2025/BSE/173/PS'],
  ['Asingura Faizal', 'faizal@must.ac.ug', '2025/BSE/044/PS'],
  ['Enyang Mark', 'mark@must.ac.ug', '2025/BSE/204/PS'],
  ['Kizza Jessy Mitembo', 'jessy@must.ac.ug', '2025/BSE/094/PS'],
  ['Muhairwe Andrew', 'andrew@must.ac.ug', '2025/BSE/110/PS'],
  ['Ainamaani Bright', 'bright@must.ac.ug', '2025/BSE/001'],
  ['Murungi Collins', 'collins@must.ac.ug', '2025/BSE/003'],
  ['Sserwanga Adrian Josephat', 'adrian@must.ac.ug', '2025/BSE/168/PS'],
  ['Nahabi Simon Peter', 'simon@must.ac.ug', '2025/BSE/004'],
  ['Rukundo Joshua', 'joshua@must.ac.ug', '2025/BSE/157/PS'],
  ['Kwagala Everest', 'everest@must.ac.ug', '2025/BSE/242/PS']
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Course.deleteMany(), Session.deleteMany(), Attendance.deleteMany()]);

  const lecturerPassword = await bcrypt.hash('password123', 10);
  const studentDocs = await Promise.all(
    students.map(async ([name, email, regNumber]) => ({
      name, email, regNumber, role: 'student', password: await bcrypt.hash(regNumber, 10)
    }))
  );

  await User.create([
    { name: 'Dr. Amina Nakato', email: 'lecturer@must.ac.ug', password: lecturerPassword, role: 'lecturer' },
    ...studentDocs
  ]);

  console.log('Seeded. Lecturer: lecturer@must.ac.ug / password123');
  console.log('Students: <firstname>@must.ac.ug, password = registration number (see README).');
  await mongoose.disconnect();
})();
