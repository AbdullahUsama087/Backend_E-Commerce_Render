import nodemailer from "nodemailer";

async function sendEmailService({
  to = "",
  subject = "Hello",
  message = "",
  attachments = [],
} = {}) {
  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: "abdoosama087@gmail.com",
      pass: "szpo rcxf mbwh gwip",
    },
  });

  const emailInfo = await transporter.sendMail({
    from: '"Online Shopping 👻" <abdoosama087@gmail.com>',
    to,
    subject,
    html: message,
    attachments,
  });
  console.log(emailInfo);
  if (emailInfo.accepted.length) {
    true;
  } else {
    false;
  }
}

export default sendEmailService;
