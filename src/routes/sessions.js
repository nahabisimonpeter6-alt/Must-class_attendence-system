const router = require('express').Router();
const { body, param } = require('express-validator');
const Session = require('../models/Session');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/sessions (lecturer) - open a class session
router.post(
  '/',
  authenticate,
  requireRole('lecturer'),
  [
    body('courseId').isMongoId().withMessage('courseId must be a valid id.'),
    body('topic').trim().notEmpty().withMessage('Topic is required.'),
    body('date').isISO8601().withMessage('date must be a valid date, e.g. 2026-11-10.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const course = await Course.findById(req.body.courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      if (String(course.lecturer) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'This is not your course.' });
      }
      const session = await Session.create({
        course: course._id, topic: req.body.topic, date: req.body.date
      });
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/sessions/:id/attendance (lecturer) - mark attendance for many students
router.post(
  '/:id/attendance',
  authenticate,
  requireRole('lecturer'),
  [
    param('id').isMongoId().withMessage('Invalid session id.'),
    body('records').isArray({ min: 1 }).withMessage('records must be a non-empty array.'),
    body('records.*.studentId').isMongoId().withMessage('Each record needs a valid studentId.'),
    body('records.*.status').isIn(['present', 'absent', 'late'])
      .withMessage('status must be present, absent or late.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

      const course = await Course.findById(session.course);
      if (String(course.lecturer) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'This is not your course.' });
      }

      const enrolled = course.students.map(String);
      const notEnrolled = req.body.records.filter((r) => !enrolled.includes(r.studentId));
      if (notEnrolled.length) {
        return res.status(400).json({
          success: false,
          message: 'Some students are not enrolled in this course.',
          studentIds: notEnrolled.map((r) => r.studentId)
        });
      }

      const ids = req.body.records.map((r) => r.studentId);
      if (new Set(ids).size !== ids.length) {
        return res.status(400).json({ success: false, message: 'A student appears twice in records.' });
      }

      const already = await Attendance.find({ session: session._id, student: { $in: ids } });
      if (already.length) {
        return res.status(409).json({
          success: false,
          message: 'Attendance already marked for some students in this session.',
          studentIds: already.map((a) => a.student)
        });
      }

      const docs = req.body.records.map((r) => ({
        session: session._id, course: course._id, student: r.studentId, status: r.status
      }));
      const saved = await Attendance.insertMany(docs);
      res.status(201).json({ success: true, message: `${saved.length} attendance records saved.`, data: saved });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
