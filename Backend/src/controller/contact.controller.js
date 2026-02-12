const nodemailer = require('nodemailer');
const catchAsyncError = require('../middleware/catchAsyncError');
const ErrorHandler = require('../utils/ErrorHandler');
const { sendResponse } = require('../utils/sendResponse');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'Outlook', 'Yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email address from .env
    pass: process.env.EMAIL_PASS, // Your email password or app password from .env
  },
});

exports.sendContactEmail = catchAsyncError(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return next(new ErrorHandler('Please fill in all fields.', 400));
  }

  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: process.env.EMAIL_USER, // Recipient address (can be your own email to receive messages)
    subject: `Contact Form: ${subject}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    sendResponse(res, 200, true, 'Message sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    return next(new ErrorHandler('Failed to send message. Please try again later.', 500));
  }
});
