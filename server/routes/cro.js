const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const PSPProfile = require('../models/PSPProfile');
const contractService = require('../services/contractService');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const User = require('../models/User');

// Apply authentication and CRO authorization to all routes
router.use(authMiddleware);
router.use(authorizeRoles('CRO'));

// @route   GET /api/cro/applications
// @desc    Get all pending applications
// @access  Private (CRO only)
router.get('/applications', async (req, res) => {
  try {
    const { status } = req.query;

    const query = status ? { creditLineStatus: status } : {};
    const applications = await PSPProfile.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cro/applications/:id
// @desc    Get application by ID
// @access  Private (CRO only)
router.get('/applications/:id', async (req, res) => {
  try {
    const application = await PSPProfile.findById(req.params.id)
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Fetch associated documents
    const FinancingDocument = require('../models/FinancingDocument');
    const documents = await FinancingDocument.find({ pspId: application._id })
      .select('-fileContent'); // Exclude heavy content for list, will fetch separately if needed or include if small

    // Convert to plain object to add documents
    const appObj = application.toObject();
    appObj.documents = documents;

    res.json(appObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cro/documents/:id
// @desc    Get document content (base64)
// @access  Private (CRO only)
router.get('/documents/:id', async (req, res) => {
  try {
    const FinancingDocument = require('../models/FinancingDocument');
    const document = await FinancingDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      name: document.name,
      fileType: document.fileType,
      fileContent: document.fileContent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cro/applications/:id/approve
// @desc    Approve application and deploy smart contract
// @access  Private (CRO only)
router.post('/applications/:id/approve', async (req, res) => {
  try {
    const { approvedAmount, approvedDuration, walletAddress, notes } = req.body;

    const profile = await PSPProfile.findById(req.params.id).populate('userId');

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (profile.creditLineStatus !== 'Pending' && profile.creditLineStatus !== 'NeedMoreInfo') {
      return res.status(400).json({ message: 'Application is not pending' });
    }

    // Deploy CreditLinePool contract
    console.log('Deploying CreditLinePool contract for PSP:', walletAddress);

    const utilizedBips = parseInt(process.env.DEFAULT_UTILIZED_BIPS) || 5;
    const unutilizedBips = parseInt(process.env.DEFAULT_UNUTILIZED_BIPS) || 1;

    // Send response immediately - don't wait for funding
    res.json({
      message: 'Application approved and contract deployed',
      profile,
    });

    const deployResult = await contractService.deployCreditLinePool(
      walletAddress,
      approvedAmount,
      approvedDuration,
      utilizedBips,
      unutilizedBips
    );

    // if (!deployResult.success) {
    //   return res.status(500).json({ 
    //     message: 'Failed to deploy contract', 
    //     error: deployResult.error 
    //   });
    // }

    // Update profile immediately
    profile.creditLineStatus = 'Approved';
    profile.approvedAmount = approvedAmount;
    profile.approvedDuration = approvedDuration;
    profile.utilizedBips = utilizedBips;
    profile.unutilizedBips = unutilizedBips;
    profile.walletAddress = walletAddress;
    profile.assignedPoolAddress = deployResult.contractAddress;

    await profile.save();

    // Trigger Notifications & Emails
    try {
      if (profile.userId) {
        await createNotification(profile.userId._id, {
          title: 'Application Approved!',
          message: `Your credit line of $${approvedAmount.toLocaleString()} has been approved.`,
          type: 'success'
        });

        await sendEmail({
          to: profile.userId.email,
          subject: 'Credit Line Application Approved',
          title: 'Congratulations!',
          body: `<p>Your financing limit application for <strong>${profile.companyName}</strong> has been approved.</p>
                 <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                   <p style="margin: 5px 0;"><strong>Approved Amount:</strong> $${approvedAmount.toLocaleString()}</p>
                   <p style="margin: 5px 0;"><strong>Duration:</strong> ${approvedDuration} days</p>
                 </div>
                 <p>You can now log in to request drawdowns (financing) against your available limit.</p>`,
          actionLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
          actionText: 'Go to Dashboard'
        });
      }
    } catch (notifyError) {
      console.error('Failed to send approval notifications:', notifyError);
    }



    // Fund the pool asynchronously (in background)
    console.log('Funding pool with USD-DF in background...');
    contractService.fundPool(
      deployResult.contractAddress,
      approvedAmount
    ).then(fundResult => {
      if (fundResult.success) {
        console.log('✅ Pool funded successfully:', fundResult.transactionHash);
      } else {
        console.error('❌ Failed to fund pool:', fundResult.error);
        console.log('Admin can fund manually later using fundPool function');
      }
    }).catch(error => {
      console.error('❌ Pool funding error:', error);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/cro/applications/:id/reject
// @desc    Reject application
// @access  Private (CRO only)
router.post('/applications/:id/reject', async (req, res) => {
  try {
    const { notes } = req.body;

    const profile = await PSPProfile.findById(req.params.id).populate('userId');

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    profile.creditLineStatus = 'Rejected';
    await profile.save();

    // Trigger Notifications & Emails
    try {
      if (profile.userId) {
        await createNotification(profile.userId._id, {
          title: 'Application Update (Rejected)',
          message: `Your application has been rejected. Notes: ${notes || 'No notes provided.'}`,
          type: 'danger'
        });

        await sendEmail({
          to: profile.userId.email,
          subject: 'Application Status Update',
          title: 'Application Update',
          body: `<p>Your credit line application for <strong>${profile.companyName}</strong> has been reviewed and rejected.</p>
                 <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                   <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Reason/Notes:</p>
                     <p style="margin: 0; color: #ebdffc;">${notes || 'Please contact support for more details.'}</p>
                 </div>`
        });
      }
    } catch (notifyError) {
      console.error('Failed to send rejection notifications:', notifyError);
    }

    res.json({ message: 'Application rejected', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cro/applications/:id/request-info
// @desc    Request additional information
// @access  Private (CRO only)
router.post('/applications/:id/request-info', async (req, res) => {
  try {
    const { notes } = req.body;

    const profile = await PSPProfile.findById(req.params.id).populate('userId');

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    profile.creditLineStatus = 'NeedMoreInfo';
    profile.cadMessage = notes || 'Additional information required.';
    // profile.approvedAmount = 0; // Reset credit line
    await profile.save();

    // Trigger Notifications & Emails
    try {
      if (profile.userId) {
        await createNotification(profile.userId._id, {
          title: 'Information Required',
          message: `Additional information is required for your application. Notes: ${notes || 'No notes provided.'}`,
          type: 'warning'
        });

        await sendEmail({
          to: profile.userId.email,
          subject: 'Action Required: Application Information Needed',
          title: 'Information Required',
          body: `<p>We need additional information to process your application for <strong>${profile.companyName}</strong>.</p>
                 <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
                   <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Message from Reviewer:</p>
                     <p style="margin: 0; color: #ebdffc;">${notes || 'Please check your dashboard.'}</p>
                 </div>
                 <p>Please log in and update your profile or upload the requested documents.</p>`,
          actionLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
          actionText: 'Go to Dashboard'
        });
      }
    } catch (notifyError) {
      console.error('Failed to send request-info notifications:', notifyError);
    }

    res.json({ message: 'Additional information requested', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cro/applications/:id/score
// @desc    Save/update credit scoring for an application
// @access  Private (CRO only)
router.post('/applications/:id/score', async (req, res) => {
  try {
    const { criteriaScores, totalScore, percentage, rating } = req.body;

    const profile = await PSPProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    profile.creditScoring = {
      criteriaScores,
      totalScore,
      percentage,
      rating,
      updatedAt: Date.now()
    };

    // Explicitly mark as modified for Mixed type
    profile.markModified('creditScoring');

    await profile.save();

    res.json({ message: 'Credit score updated successfully', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cro/stats
// @desc    Get CRO dashboard statistics
// @access  Private (CRO only)
router.get('/stats', async (req, res) => {
  try {
    const pendingCount = await PSPProfile.countDocuments({ creditLineStatus: 'Pending' });
    const approvedCount = await PSPProfile.countDocuments({ creditLineStatus: 'Approved' });
    const rejectedCount = await PSPProfile.countDocuments({ creditLineStatus: 'Rejected' });

    res.json({
      pendingApplications: pendingCount,
      activeLines: approvedCount,
      rejectedApplications: rejectedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cro/applications/:id/upload-document
// @desc    Upload a document for an application (CRO)
// @access  Private (CRO only)
router.post('/applications/:id/upload-document', async (req, res) => {
  try {
    const { category, documentType, name, fileContent, fileType, fileSize } = req.body;

    const profile = await PSPProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const FinancingDocument = require('../models/FinancingDocument');
    const document = new FinancingDocument({
      pspId: profile._id,
      category: category || 'Credit Report', // Default category for CRO uploads
      documentType: documentType || 'Review Report',
      name,
      fileContent,
      fileType,
      fileSize,
      uploadedAt: Date.now()
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
