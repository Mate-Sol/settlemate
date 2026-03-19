const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PSPProfile = require('../models/PSPProfile');
const mongoose = require('mongoose'); // Ensure mongoose is imported
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const ExternalPSPUser = require('../models/ExternalPSPUser'); // Third-party partner model


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

      // Trigger Notifications and Emails (After commit to ensure DB consistency)
      try {
        // 1. Notify the PSP User (Welcome)
        await createNotification(user._id, {
          title: 'Welcome to PayMate!',
          message: 'Your account has been created successfully. Please apply for a credit line to get started.',
          type: 'success'
        });

        await sendEmail({
          to: user.email,
          subject: 'Welcome to PayMate!',
          title: `Welcome to PayMate, ${name}!`,
          body: `<p>Your registration for <strong>${companyName}</strong> was successful.</p>
                 <p>To start using our services, please log in and complete your profile application for a financing limit.</p>`,
          actionLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
          actionText: 'Go to Dashboard'
        });

        // 2. Notify Admins (CRO / CFO)
        const admins = await User.find({ role: { $in: ['CRO', 'CFO'] } });
        for (const admin of admins) {
          await createNotification(admin._id, {
            title: 'New PSP Registered',
            message: `${companyName} has just registered in the system and is pending review.`,
            type: 'info'
          });

          await sendEmail({
            to: admin.email,
            subject: 'New PSP Registration - Action Required',
            title: 'New PSP Registration',
            body: `<p>A new PSP <strong>${companyName}</strong> has registered and needs profile verification review.</p>`
          });
        }
      } catch (notifyError) {
        console.error('Failed to send registration notifications:', notifyError);
        // We do not fail the request if notifications fail
      }

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


// =============================================================================
// THIRD-PARTY / PARTNER AUTHENTICATION
// =============================================================================

// @route   POST /api/auth/third-party/login
// @desc    Login for third-party partners (External PSPs)
// @access  Public
// @returns { token, apiKey, companyName }
router.post('/third-party/login',
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

      // Find partner in ExternalPSPUser collection
      const partner = await ExternalPSPUser.findOne({ email });
      if (!partner) {
        return res.status(401).json({ message: 'Invalid partner credentials' });
      }

      // Check if partner account is active
      if (partner.isActive === false) {
        return res.status(403).json({ message: 'Partner account is deactivated' });
      }

      // Validate password using the model method
      const isMatch = await partner.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid partner credentials' });
      }

      // Generate JWT for the partner
      // We include partner ID and a specific role to distinguish from internal users
      const token = jwt.sign(
        { 
          partnerId: partner._id, 
          role: 'EXTERNAL_PSP_PARTNER',
          company: partner.companyName 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // Partners usually get longer-lived sessions or manage their own keys
      );

      res.json({
        success: true,
        message: 'Partner authenticated successfully',
        token,           // The JWT access token
        apiKey: partner.apiKey, // The API key they can use for subsequent webhook/API calls
        companyName: partner.companyName
      });

    } catch (error) {
      console.error('[Auth] Third-party login error:', error);
      res.status(500).json({ message: 'Server error during partner authentication' });
    }
  }
);

module.exports = router;
