const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// export the email transporter to use the same instance every time (avoid recreating reusable instances)
module.exports = {
  transporter,
};
