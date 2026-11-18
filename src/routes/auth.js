const router = require('express').Router();
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// Letters, digits and . _ / - only, so a registration number such as 2025/BSE/173/PS is a valid username.
const USERNAME_RE = /^[A-Za-z0-9._\/-]{3,40}$/;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  role: u.role,
  username: u.username,
  regNumber: u.regNumber,
  passwordIsDefault: !!u.passwordIsDefault
});

// POST /api/auth/login - students log in with their registration number as username (and, at first, as password)
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ username: req.body.username.trim().toLowerCase() });
      const ok = user && (await bcrypt.compare(req.body.password, user.password));
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Wrong username or password.' });
      }
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      res.json({ success: true, token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/auth/account - any logged-in user (student or lecturer) changes their own username and/or password
router.put(
  '/account',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Enter your current password.'),
    body('newUsername').optional({ values: 'falsy' }).trim().matches(USERNAME_RE)
      .withMessage('Username must be 3 to 40 characters: letters, numbers and . _ / - only (no spaces).'),
    body('newPassword').optional({ values: 'falsy' }).isLength({ min: 6, max: 72 })
      .withMessage('New password must be 6 to 72 characters.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;
      if (!newUsername && !newPassword) {
        return res.status(400).json({ success: false, message: 'Enter a new username, a new password, or both.' });
      }

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ success: false, message: 'Current password is wrong.' });
      }

      const changes = [];
      if (newUsername && newUsername.toLowerCase() !== user.username) {
        const wanted = newUsername.toLowerCase();
        // Not taken as a username, and not someone else's registration number
        const clash = await User.findOne({
          _id: { $ne: user._id },
          $or: [{ username: wanted }, { regNumber: new RegExp('^' + escapeRegex(wanted) + '$', 'i') }]
        });
        if (clash) {
          return res.status(409).json({ success: false, message: 'That username is already taken. Choose another.' });
        }
        user.username = wanted;
        changes.push('username');
      }
      if (newPassword) {
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordIsDefault = false;
        changes.push('password');
      }
      if (!changes.length) {
        return res.status(400).json({ success: false, message: 'Nothing to change: that is already your username.' });
      }

      try {
        await user.save();
      } catch (err) {
        // Two people claimed the same username at the same moment
        if (err.code === 11000) {
          return res.status(409).json({ success: false, message: 'That username is already taken. Choose another.' });
        }
        throw err;
      }
      res.json({
        success: true,
        message: `Your ${changes.join(' and ')} ${changes.length > 1 ? 'were' : 'was'} updated.`,
        user: publicUser(user)
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
