import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const EMAIL = process.env.MAILER_MAIL;
const PASSWORD = process.env.MAILER_PASSWORD;
const CLIENT_URL = process.env.CLIENT_URL;
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
});

const verifyMailSubject = "Verify your Email";
const text = "";

const getVerifyHtml = (token) => {
  return `
  <div style="display: flex; flex-direction: column;">
  <h2 style="margin: 10vh auto; text-align:center;">Kindly click to verify your email address</h2>
  <a
    href="${CLIENT_URL}/verifyemail/${token}"
    style="margin: 2vh auto; text-decoration: none; color: black"
  >
    <div
      style="
        background-color: yellow;
        width: 10vw;
        height: 6vh;
        display: flex;
        margin: 2vh auto;
      "
    >
      <p style="margin: auto">Verify</p>
    </div>
  </a>
  <p style="margin: 10vh auto; text-align:center;">Please do NOT reply to this email</p>
</div>

    `;
};

const resetPasswordSubject = "Reset your Password";

const getResetPasswordHtml = (token) => {
  return `
  <h2 style="margin: 10vh auto; text-align:center;">Kindly click to reset your password</h2>
  <a
    href="${CLIENT_URL}/resetpassword/${token}"
    style="margin: 2vh auto; text-decoration: none; color: black"
  >
    <div
      style="
        background-color: yellow;
        width: 10vw;
        height: 6vh;
        display: flex;
        margin: 2vh auto;
      "
    >
      <p style="margin: auto">Reset</p>
    </div>
  </a>
  <p style="margin: 10vh auto; text-align:center;">Please do NOT reply to this email</p>
    `;
};

export const sendVerifyMail = async (email, token) => {
  let mailOptions = {
    from: `"Kul Bois" <${EMAIL}>`,
    to: email,
    subject: verifyMailSubject,
    text,
    html: getVerifyHtml(token),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
};

export const sendResetPasswordMail = async (email, token) => {
  let mailOptions = {
    from: `"Kul Bois" <${EMAIL}>`,
    to: email,
    subject: resetPasswordSubject,
    text,
    html: getResetPasswordHtml(token),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
};
