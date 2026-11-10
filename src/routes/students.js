const router = require('express').Router();
const { param } = require('express-validator');
const Course = require('../models/Course');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { attendancePercentage, isBelowThreshold } = require('../utils/attendance');

// GET /api/students/:id/attendance - students see only their own; lecturers can see any
router.get(
  '/:id/attendance',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid student id.')],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.role === 'student' && req.user.id !== req.params.id) {
        return res.status(403).json({ success: false, message: 'You can only view your own attendance.' });
      }
      const threshold = Number(process.env.ATTENDANCE_THRESHOLD) || 75;
      const courses = await Course.find({ students: req.params.id });
      if (!courses.length) {
        return res.status(404).json({ success: false, message: 'No courses found for this student.' });
      }

      const summary = [];
      for (const c of courses) {
        const total = await Session.countDocuments({ course: c._id });
        const recs = await Attendance.find({ course: c._id, student: req.params.id });
        const attended = recs.filter((r) => r.status !== 'absent').length;
        const percentage = attendancePercentage(attended, total);
        summary.push({
          course: { id: c._id, code: c.code, name: c.name },
          attended, totalSessions: total, percentage,
          belowThreshold: total > 0 && isBelowThreshold(percentage, threshold)
        });
      }
      res.json({ success: true, threshold, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
