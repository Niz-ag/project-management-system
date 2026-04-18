import { text } from "express";
import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Manager",
      link: "projectmanagerlink.com",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_TRAP_HOST,
    port: process.env.MAIL_TRAP_PORT,
    auth: {
      user: process.env.MAIL_TRAP_USERNAME,
      pass: process.env.MAIL_TRAP_PASSWORD,
    },
  });

  const mail = {
    from: "mail.projectmanagerlink.com",
    to: options.mail,
    subject: options.mail,
    text: emailTextual,
    html: emailHTML,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("ERROR:", error);
    console.error(
      "EMAIL SERVICE HAS FAILED. check for the credentials in the .env file",
    );
  }
};

const emailVerificationMailContent = (username, emailVerificationUrl) => {
  return {
    body: {
      name: "username",
      intro: "We are glad to invite you to our platform",
      action: {
        instructions: "Click on the following button to verify",
        button: {
          color: "#04adc7",
          text: "Click here",
          link: emailVerificationUrl,
        },
      },
      outro: "For any queries, reach us at xyz@abc.com",
    },
  };
};

const forgotPasswordMailContent = (username, forgotPasswordUrl) => {
  return {
    body: {
      name: "username",
      intro: "We got your request for password reset of your account",
      action: {
        instructions: "Click on the following button to reset",
        button: {
          color: "#04c735",
          text: "Click here",
          link: forgotPasswordUrl,
        },
      },
      outro: "For any queries, reach us at xyz@abc.com",
    },
  };
};

export { emailVerificationMailContent, forgotPasswordMailContent, sendMail };
