const nodemailer = require("nodemailer");

module.exports = async function (req, res) {
  const token = req.body.token;
  if (token !== process.env.APPROVAL_TOKEN) {
    return res.status(403).send("Unauthorized");
  }

  setTimeout(async () => {
    const approvalLink = `https://${process.env.DOMAIN}/trigger?token=${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: process.env.NOTIFY_EMAIL,
      subject: "Terraform: Click to Destroy Resources",
      text: `Terraform apply succeeded.\n\nClick here to destroy: ${approvalLink}`,
    });

    console.log("Approval email sent.");
  }, 3600000); // 1 hour

  res.send("Destroy email will be sent in 1 hour");
};
