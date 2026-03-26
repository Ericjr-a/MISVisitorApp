import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.example.com",
  port: 587,
  //secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async () => {
  try {
    const info = await transporter.sendMail({
      from: `"Richard" <${process.env.EMAIL_USER}>`,
      to: "<seyramx1@gmail.com>",
      subject: "Password Reset",
      text: `Click the following link to reset your password: http://localhost:3000/reset-password?token=${resetToken}`,
    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default transporter;
