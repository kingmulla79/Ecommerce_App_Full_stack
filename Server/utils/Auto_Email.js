require("dotenv").config();
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

function sendEmail(email, subject, text) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mail_configs = {
      from: process.env.APP_EMAIL,
      to: email,
      subject: subject,
      text: text,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: `An error has occured` });
      }
      return resolve({ message: `Email sent successfully` });
    });
  });
}

function sendOTPEmail(email, subject, html) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mail_configs = {
      from: process.env.APP_EMAIL,
      to: email,
      subject: subject,
      html: html,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: `An error has occured` });
      }
      return resolve({ message: `Email sent successfully` });
    });
  });
}

module.exports = {
  sendEmail,
  sendOTPEmail,
};
