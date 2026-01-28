const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PSPProfile = require('../models/PSPProfile');

// @route   POST /api/auth/register
// @desc    Register new PSP user
// @access  Public
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('companyName').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        email, 
        password, 
        name, 
        companyName,
        // Additional company info
        registrationNo,
        country,
        yearEstablished,
        contactName,
        contactEmail,
        contactPhone,
        uboDetails,
        pepExposure,
        // Business operations
        sector,
        transactionVolume,
        keyProducts,
        topCustomers,
        topSuppliers,
        // Financial info
        annualRevenue,
        outstandingLoans,
        bankName,
        bankAccountNo,
        swiftCode,
        defaultHistory
      } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      user = new User({
        email,
        passwordHash,
        name,
        role: 'PSP'
      });

      await user.save();

      // Create PSP profile with all collected data
      const pspProfile = new PSPProfile({
        userId: user._id,
        companyName,
        registrationNo,
        country,
        yearEstablished: yearEstablished ? parseInt(yearEstablished) : undefined,
        keyContact: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone
        },
        uboDetails,
        pepExposure: pepExposure || false,
        sector,
        keyProducts: keyProducts || [],
        topCustomers: topCustomers || [],
        topSuppliers: topSuppliers || [],
        transactionVolume,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        outstandingLoans: outstandingLoans ? parseFloat(outstandingLoans) : undefined,
        bankAccount: {
          bankName,
          accountNumber: bankAccountNo,
          swiftCode
        },
        defaultHistory,
        creditLineStatus: 'None'
      });

      await pspProfile.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
