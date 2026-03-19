const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

router.get('/trigger-all-emails', async (req, res) => {
  const testEmail = req.query.email || 'hussnain@maildrop.cc';
  const results = [];

  const trigger = async (name, payload) => {
    try {
      await sendEmail(payload);
      results.push({ name, status: 'success' });
    } catch (err) {
      results.push({ name, status: 'failed', error: err.message });
    }
  };

  console.log(`[Test API] Triggering all email flows to: ${testEmail}`);

  // 1. Welcome Email
  await trigger('Welcome Email', {
    to: testEmail,
    subject: 'Welcome to PayMate!',
    title: 'Welcome to PayMate!',
    body: '<p>Your registration for <strong>Demo Company</strong> was successful.</p><p>To start using our services, please log in and complete your profile request for a financing limit.</p>',
    actionLink: 'https://paymate.com/login',
    actionText: 'Go to Dashboard'
  });

  // 2. Admin Registration Alert
  await trigger('Admin Registration Alert', {
    to: testEmail,
    subject: 'New PSP Registration - Action Required',
    title: 'New PSP Registration',
    body: '<p>A new PSP <strong>Demo Company</strong> has registered and needs profile verification review.</p>',
    actionLink: 'https://paymate.com/admin',
    actionText: 'Review Request'
  });

  // 3. Request Approved
  await trigger('Request Approved', {
    to: testEmail,
    subject: 'Credit Line Request Approved',
    title: 'Congratulations!',
    body: `<p>Your Credit Line request for <strong>Demo Company</strong> has been approved.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 5px 0;"><strong>Approved Amount:</strong> $100,000</p>
             <p style="margin: 5px 0;"><strong>Duration:</strong> 90 days</p>
           </div>
           <p>You can now log in to request drawdowns (financing) against your available limit.</p>`,
    actionLink: 'https://paymate.com/login',
    actionText: 'Go to Dashboard'
  });

  // 4. Request Rejected
  await trigger('Request Rejected', {
    to: testEmail,
    subject: 'Request Status Update',
    title: 'Request Update',
    body: `<p>Your credit line request for <strong>Demo Company</strong> has been reviewed and rejected.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Reason/Notes:</p>
                     <p style="margin: 0; color: #ebdffc;">Missing necessary document verification data.</p>
           </div>`
  });

  // 5. Information Required
  await trigger('Information Required', {
    to: testEmail,
    subject: 'Action Required: Request Information Needed',
    title: 'Information Required',
    body: `<p>We need additional information to process your request for <strong>Demo Company</strong>.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Message from Reviewer:</p>
                     <p style="margin: 0; color: #ebdffc;">Please upload your latest bank statements.</p>
           </div>`,
    actionLink: 'https://paymate.com/login',
    actionText: 'Go to Dashboard'
  });

  // 6. Financing Request Rejection
  await trigger('Financing Request Rejection', {
    to: testEmail,
    subject: 'Financing Request Rejected',
    title: 'Financing Request Rejected',
    body: `<p>Your financing request for order <strong>#12345</strong> has been rejected.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Reason:</p>
                     <p style="margin: 0; color: #ebdffc;">Insufficient credit balance.</p>
           </div>`
  });

  // 7. Funds Disbursed Success
  await trigger('Funds Disbursed Success', {
    to: testEmail,
    subject: 'Funds Disbursed Successfully!',
    title: 'Funds Disbursed',
    body: `<p>Great news! The drawdown request for order <strong>#12345</strong> has been executed successfully on-chain.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 5px 0;"><strong>Amount:</strong> $5,000</p>
             <p style="margin: 5px 0;"><strong>Transaction Hash:</strong> <span style="font-family: monospace;">0x7123abcd...</span></p>
           </div>`
  });

  // 8. Disbursement Failure Alarm
  await trigger('Disbursement Failure Alarm', {
    to: testEmail,
    subject: 'CRITICAL: Disbursement Failure Alert',
    title: 'CRITICAL: Disbursement Failed',
    body: `<p>On-chain disbursement has failed for request ID <strong>#12345</strong>.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">PSP:</p>
                     <p style="margin: 0; color: #ebdffc;">Demo Company</p>
             <p style="margin: 0 0 5px 0; font-weight: bold; color: #ffffff;">Error Message:</p>
                     <p style="margin: 0; color: #ebdffc;">Smart contract reverted with Out Of Gas</p>
           </div>`
  });

  // 9. Repayment Received
  await trigger('Repayment Received', {
    to: testEmail,
    subject: 'Repayment Received - Confirmation',
    title: 'Repayment Received',
    body: `<p>We have successfully processed your repayment for order <strong>#12345</strong>.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 5px 0;"><strong>Principal:</strong> $4,900</p>
             <p style="margin: 5px 0;"><strong>Interest Paid:</strong> $100</p>
           </div>
           <p>Your available credit line has been restored.</p>`
  });

  // 10. Maintenance Charge Created
  await trigger('Maintenance Charge Created', {
    to: testEmail,
    subject: 'New Credit Line Maintenance Charge',
    title: 'New Maintenance Charge',
    body: `<p>A new maintenance charge has been generated for <strong>Demo Company</strong>.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 5px 0;"><strong>Amount:</strong> $500.00</p>
             <p style="margin: 5px 0;"><strong>Due Date:</strong> 2026-03-20</p>
           </div>`
  });

  // 11. Maintenance Charge Overdue
  await trigger('Maintenance Charge Overdue', {
    to: testEmail,
    subject: 'URGENT: Maintenance Charge Overdue',
    title: 'Maintenance Charge Overdue',
    body: `<p>Your maintenance charge for <strong>Demo Company</strong> is overdue.</p>
           <div style="background-color: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.05);">
             <p style="margin: 5px 0;"><strong>Amount:</strong> $500.00</p>
           </div>
           <p>Please log in and settle the invoice immediately.</p>`
  });

  res.json({ results });
});

module.exports = router;
