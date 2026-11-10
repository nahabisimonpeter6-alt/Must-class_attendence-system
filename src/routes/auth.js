const router = require('express').Router();
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email.toLowerCase() });
      const ok = user && (await bcrypt.compare(req.body.password, user.password));
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Wrong email or password.' });
      }
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, role: user.role, regNumber: user.regNumber }
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
