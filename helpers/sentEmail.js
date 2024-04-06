const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: 'smtp.gmail.com',
    port:process.env.EmailPort,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

const sendOtpEmail = async (email,subject , message) => {
  const mailOptions = {
    from: process.env.Email,
    to: email,
    subject: subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendOtpEmail };