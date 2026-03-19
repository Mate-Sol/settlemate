const sgMail = require('@sendgrid/mail');

// Initialize SendGrid API Key from environment variables
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[Email Service] WARNING: SENDGRID_API_KEY is not set in environment variables');
}

/**
 * Standard Email Layout Wrapper (DeFa Purple Premium theme)
 */
const getEmailLayout = ({ title, body, actionLink, actionText }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      background-color: #1D0B13; /* Very dark black-purple */
      font-family: Arial, Helvetica, sans-serif;
      color: #e2d5f8;
    }
    a {
      color: #ff6bcc;
      text-decoration: none;
    }
    .container {
      width: 95%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #40192A; /* Deep premium wine-purple */
      border-dash: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .header {
      text-align: center;
      padding: 30px;
      background-color: #2b111c; /* Slightly darker frame header */
      border-bottom: 4px solid #411A2B;
    }
    .header img {
      display: block;
      margin: auto;
      width: 180px;
    }
    .content {
      padding: 30px 25px;
      line-height: 1.6em;
      text-align: left;
    }
    .content h2 {
      color: #ffffff;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .content p {
      font-size: 16px;
      color: #ebdffc;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: #9b8ecf;
    }
  </style>
</head>
<body>
  <table role="presentation" style="width: 100%; padding: 0; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <div class="container">
          <div class="header">
            <img src="http://localhost:5000/public/logo.png" style="width: 140px;" alt="PayMate Logo">
          </div>

          <div class="content">
            <h2>${title}</h2>
            <div style="font-size: 16px;">${body}</div>

            ${actionLink ? `
              <div style="text-align: center; margin-top: 35px;">
                <a href="${actionLink}" style="background: linear-gradient(135deg, #c84f83 0%, #411A2B 100%); color: #ffffff; text-decoration: none; padding: 13px 40px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(200, 79, 131, 0.25);">
                  ${actionText || 'Proceed'}
                </a>
              </div>
            ` : ''}

            <p style="margin-top: 35px; font-size: 15px; color: #ebdffc; line-height: 1.5;">Regards,<br><strong>PayMate Team</strong></p>
          </div>
        </div>

        <div class="footer">
          &copy; ${new Date().getFullYear()} DeFa. All rights reserved.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send an email using SendGrid
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - Custom HTML content (optional)
 * @param {String} options.title - Layout Title (optional if html provided)
 * @param {String} options.body - Layout Body (optional if html provided)
 * @param {String} options.actionLink - Link button (optional)
 * @param {String} options.actionText - Button text (optional)
 * @param {String} options.text - Text fallback content (optional)
 */
const sendEmail = async ({ to, subject, html, title, body, actionLink, actionText, text }) => {
  try {
    // Generate layout if custom title and body are provided
    const finalHtml = html || getEmailLayout({ title, body, actionLink, actionText });

    const msg = {
      to,
      from: process.env.FROM_EMAIL || 'no-reply@paymate.com', // Must be verified in SendGrid
      subject,
      text: text || finalHtml.replace(/<[^>]*>?/gm, ''), // Strips HTML tags for text fallback
      html: finalHtml
    };

    if (!process.env.SENDGRID_API_KEY) {
      console.log(`[Email Service] [DRY RUN] Would send email to ${to}: ${subject}`);
      return { success: true, dryRun: true };
    }

    const response = await sgMail.send(msg);
    console.log(`[Email Service] Email sent to ${to}: ${subject}`);
    return { success: true, response };
  } catch (error) {
    console.error(`[Email Service] Error sending email to ${to}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail
};
