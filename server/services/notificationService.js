const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' or another service (Brevo/SendGrid)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendAlert = async (type, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `Attendance System Alert: ${type}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <h2 style="color: #d9534f;">System Alert: ${type}</h2>
          <p style="font-size: 16px;">${message}</p>
          <hr />
          <p style="font-size: 12px; color: #888;">This is an automated message from the AI Attendance Management System.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Alert sent: ${type}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
