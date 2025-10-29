// utils/emailSender.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendPayoutNotification = async (toEmail, userName, campaignTitle, amountRaisedKobo) => {
  const amountInNaira = (amountRaisedKobo / 100).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN'
  });

  // Define a background color (e.g., a light gray or off-white)
  const backgroundColor = '#f7f7f7'; 

  const msg = {
    to: toEmail,
    from: 'akintayolanre2019@gmail.com', // Verified sender
    subject: `Payout Initiated for Campaign: ${campaignTitle}`,
    html: `
      <body style="background-color: ${backgroundColor}; margin: 0; padding: 0; font-family: sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"> 
          
          <p style="font-size: 16px; color: #333;">Dear ${userName},</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">This email confirms that the payout for your campaign, "<strong>${campaignTitle}</strong>", has been successfully initiated.</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">An amount of <strong>${amountInNaira}</strong> is being processed.</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">The funds are scheduled to be settled by Paystack to your linked bank account within the next 1-2 business days.</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">Should you have any questions, please do not hesitate to contact our support team.</p>
          <p style="font-size: 14px; color: #555; margin-top: 20px;">Sincerely,<br/>The <strong>DonateFunds</strong> Team</p>
        
        </div>
      </body>
    `,
    text: `Dear ${userName},\n\nThis email confirms... (etc.)` 
  };

  try {
    await sgMail.send(msg);
    console.log(`Payout notification email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending email via SendGrid to ${toEmail}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

module.exports = { sendPayoutNotification };