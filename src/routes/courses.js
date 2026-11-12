const router = require('express').Router();
const { body, param } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

const THRESHOLD = () => Number(process.env.ATTENDANCE_THRESHOLD) || 75;

// POST /api/courses (lecturer) - create a course and enrol students by reg number
router.post(
  '/',
  authenticate,
  requireRole('lecturer'),
  [
    body('code').trim().notEmpty().withMessage('Course code is required.')
      .matches(/^[A-Za-z]{3}\d{4}$/).withMessage('Course code must look like SWE2106.'),
    body('name').trim().isLength({ min: 3 }).withMessage('Course name must be at least 3 characters.'),
    body('studentRegNumbers').optional().isArray().withMessage('studentRegNumbers must be an array.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { code, name, studentRegNumbers = [] } = req.body;
      if (await Course.findOne({ code: code.toUpperCase() })) {
        return res.status(409).json({ success: false, message: `Course ${code.toUpperCase()} already exists.` });
      }
      const students = await User.find({ role: 'student', regNumber: { $in: studentRegNumbers } });
      const found = students.map((s) => s.regNumber);
      const unknown = studentRegNumbers.filter((r) => !found.includes(r));
      if (unknown.length) {
        return res.status(400).json({
          success: false,
          message: 'Some registration numbers do not match any student.',
          unknown
        });
      }
      const course = await Course.create({
        code, name, lecturer: req.user.id, students: students.map((s) => s._id)
      });
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/courses - lecturers see their courses, students see enrolled courses
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filter = req.user.role === 'lecturer' ? { lecturer: req.user.id } : { students: req.user.id };
    const courses = await Course.find(filter).populate('students', 'name regNumber');
    res.json({ success: true, count: courses.length, data: courses });
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:id/sessions (lecturer) - list sessions of a course
router.get(
  '/:id/sessions',
  authenticate,
  requireRole('lecturer'),
  [param('id').isMongoId().withMessage('Invalid course id.')],
  validate,
  async (req, res, next) => {
    try {//This ensures that a lecturer dosnot retrieve another lecturer's class sessions
      const course = await Course.findById(req.params.id);
      if(!course){
        return res.status(404).json({
          succes:false,
          message:'Course not found.'
        });
      }
      if(String(course.lecturer)!==req.user.id){
        return res.status(403).json({
          success:false,
          mesage:'This is not your course.'
        });
      }
      const sessions = awaits Sessions.find({course:course._id})
      .sort({date:-1});
      res.json({
        success:true,
        count:sessions.length,
        data:sessions
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/courses/:id/report (lecturer) - attendance % per student + eligibility flag
router.get(
  '/:id/report',
  authenticate,
  requireRole('lecturer'),
  [param('id').isMongoId().withMessage('Invalid course id.')],
  validate,
  async (req, res, next) => {
    try {
      const course = await Course.findById(req.params.id).populate('students', 'name regNumber');
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      if (String(course.lecturer) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'This is not your course.' });
      }

      const totalSessions = await Session.countDocuments({ course: course._id });
      const records = await Attendance.find({ course: course._id });
      const threshold = THRESHOLD();

      const report = course.students.map((s) => {
        const mine = records.filter((r) => String(r.student) === String(s._id));
        const attended = mine.filter((r) => r.status === 'present' || r.status === 'late').length;
        const percentage = totalSessions ? Math.round((attended / totalSessions) * 100) : 0;
        return {
          studentId: s._id,
          name: s.name,
          regNumber: s.regNumber,
          attended,
          totalSessions,
          percentage,
          belowThreshold: totalSessions > 0 && percentage < threshold
        };
      });

      res.json({
        success: true,
        course: { id: course._id, code: course.code, name: course.name },
        threshold,
        totalSessions,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
