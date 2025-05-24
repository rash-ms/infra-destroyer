const nodemailer = require("nodemailer");

module.exports = async function (req, res) {
  const token = req.body.token;
  if (token !== process.env.APPROVAL_TOKEN) {
    return res.status(403).send("Unauthorized");
  }

  setTimeout(async () => {
    const approvalLink = `https://${process.env.DOMAIN}/trigger?token=${token}`;
    
    // Yahoo SMTP config
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.yahoo.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,   // e.g., yourname@yahoo.com
        pass: process.env.EMAIL_PASSWORD,   // Yahoo app password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: process.env.NOTIFY_EMAIL,
      subject: "Terraform: Click to Destroy Resources",
      text: `Terraform apply succeeded.\n\nClick here to destroy: ${approvalLink}`,
    });

    console.log("Approval email sent.");
  }, 120000); // 1 hour 3600000

  res.send("Destroy email will be sent in 1 hour");
};
