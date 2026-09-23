const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  if (!to) {
    console.warn(`Email notification skipped: recipient is missing for "${subject}".`);
    return false;
  }
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.warn(`Email notification skipped for ${to}: SMTP_HOST, SMTP_USER and SMTP_PASS are not configured.`);
    return false;
  }

  const result = await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
  console.log(`Email notification sent to ${to}: ${result.messageId}`);
  return true;
};

const isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

module.exports = { sendEmail, isEmailConfigured };
