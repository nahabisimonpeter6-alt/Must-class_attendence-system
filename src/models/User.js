const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['lecturer', 'student'], required: true },
    regNumber: { type: String, trim: true } // students only, e.g. 2023/BSE/001
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
