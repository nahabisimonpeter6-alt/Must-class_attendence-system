// One-time, NON-destructive upgrade from email login to username login.
// Keeps all users, courses, sessions and attendance. Safe to run more than once.
//   npm run migrate
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  try { await User.collection.dropIndex('email_1'); console.log('Dropped old email index.'); } catch (e) { /* not there */ }

  const users = await User.collection.find({}).toArray();
  let updated = 0;
  for (const u of users) {
    const set = {};
    if (!u.username) {
      if (u.role === 'student' && u.regNumber) set.username = u.regNumber.toLowerCase();
      else if (u.email) set.username = u.email.split('@')[0].toLowerCase(); // lecturer@must.ac.ug -> lecturer
    }
    if (u.role === 'student' && u.regNumber && u.passwordIsDefault === undefined) {
      set.passwordIsDefault = await bcrypt.compare(u.regNumber, u.password); // still on the reg number?
    }
    if (Object.keys(set).length) {
      await User.collection.updateOne({ _id: u._id }, { $set: set });
      updated++;
      console.log(`  ${u.name}: ${JSON.stringify(set)}`);
    }
  }
  await User.syncIndexes(); // builds the unique username index
  console.log(`Done. ${updated} user(s) updated.`);
  await mongoose.disconnect();
})().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
