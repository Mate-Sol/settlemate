const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PSPProfile = require('../models/PSPProfile');
const mongoose = require('mongoose'); // Ensure mongoose is imported


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
    // 1. Start the session
    const session = await mongoose.startSession();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2. Start the transaction
      session.startTransaction();

      const {
        email, password, name, companyName,
        // Additional company info
        registrationNo, country, yearEstablished,
        contactName, contactEmail, contactPhone,
        uboDetails, pepExposure,
        // Business operations
        sector, transactionVolume, keyProducts, topCustomers, topSuppliers,
        // Financial info
        annualRevenue, rolledOutCreditLines, primaryBank, currentAllocation,
        walletAddress, projectedRevenue, profitMargin, monthlyCashFlow, defaultHistory
      } = req.body;

      // Check if user exists
      // Note: Passing session here ensures read consistency within the transaction
      let user = await User.findOne({ email }).session(session);

      if (user) {
        // We must abort here because we are returning early
        await session.abortTransaction();
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user instance
      user = new User({
        email,
        passwordHash,
        name,
        role: 'PSP'
      });

      // 3. Save User with the session
      await user.save({ session });

      // Create PSP profile instance
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
        rolledOutCreditLines: rolledOutCreditLines ? parseFloat(rolledOutCreditLines) : undefined,
        primaryBank,
        currentAllocation: currentAllocation ? parseFloat(currentAllocation) : undefined,
        walletAddress,
        projectedRevenue: projectedRevenue ? parseFloat(projectedRevenue) : undefined,
        profitMargin: profitMargin ? parseFloat(profitMargin) : undefined,
        monthlyCashFlow: monthlyCashFlow ? parseFloat(monthlyCashFlow) : undefined,
        defaultHistory,
        creditLineStatus: 'None'
      });

      // 4. Save Profile with the session
      await pspProfile.save({ session });

      // 5. Commit the transaction (Make changes permanent)
      await session.commitTransaction();

      // Generate JWT (Operations outside DB don't need the session)
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
      // 6. Abort transaction on error (Revert changes)
      // This undoes user.save() if pspProfile.save() failed
      await session.abortTransaction();

      console.error("Transaction Aborted:", error);
      res.status(500).json({ message: 'Server error' });

    } finally {
      // 7. End the session regardless of success or failure
      session.endSession();
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

      let creditLineStatus = null;
      let isExpired = false;
      if (user.role === 'PSP') {
        const profile = await PSPProfile.findOne({ userId: user._id });
        if (profile) {
          creditLineStatus = profile.creditLineStatus;

          // Check for expiry if they have a pool
          if (profile.assignedPoolAddress) {
            const contractService = require('../services/contractService');
            const expiryInfo = await contractService.getRemainingDays(profile.assignedPoolAddress);
            if (expiryInfo.success && expiryInfo.isExpired) {
              isExpired = true;
            }
          }
        } else {
          creditLineStatus = 'None';
        }
      }

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          creditLineStatus, // Added to facilitate redirection
          isExpired // Added to facilitate redirection
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
