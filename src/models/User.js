const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Login name. For students it starts as their registration number (lowercased) and can be changed later.
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['lecturer', 'student'], required: true },
    regNumber: { type: String, trim: true }, // students only, e.g. 2025/BSE/173/PS. Never changes.
    passwordIsDefault: { type: Boolean, default: false } // true while a student still uses the reg number as password
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
