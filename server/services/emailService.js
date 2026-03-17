const sgMail = require('@sendgrid/mail');

// Initialize SendGrid API Key from environment variables
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[Email Service] WARNING: SENDGRID_API_KEY is not set in environment variables');
}

/**
 * Standard Email Layout Wrapper
 */
const getEmailLayout = ({ title, body, actionLink, actionText }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3498db;">
        <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">PayMate</h1>
      </div>
      
      <div style="padding: 25px 15px; color: #34495e; line-height: 1.6;">
        <h2 style="color: #2c3e50; margin-top: 0;">${title}</h2>
        <div style="font-size: 16px;">${body}</div>
        
        ${actionLink ? `
          <div style="text-align: center; margin-top: 35px;">
            <a href="${actionLink}" style="background-color: #3498db; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">
              ${actionText || 'Click Here'}
            </a>
          </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #7f8c8d; margin-top: 30px;">
        <p style="margin: 5px 0;">This is an automated message from PayMate.</p>
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} InvoiceMate. All rights reserved.</p>
      </div>
    </div>
  `;
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
