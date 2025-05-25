const nodemailer = require("nodemailer");

module.exports = async function (req, res) {
  const token = req.body.token;
  const infra_dir = req.body.infra_dir; 
  
  if (token !== process.env.APPROVAL_TOKEN) {
    return res.status(403).send("Unauthorized");
  }

  setTimeout(async () => {
    // Include infra_dir in the approval link
    const approvalLink = `https://${process.env.DOMAIN}/trigger?token=${token}&infra_dir=${encodeURIComponent(infra_dir)}`;
    
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.yahoo.com",
      port: 465,
      secure: true,
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
      // Optional HTML version for better formatting
      // <p>Or copy this URL: ${approvalLink}</p>
      html: `
        <p>Terraform apply succeeded.</p>
        <p><a href="${approvalLink}">Click here to destroy resources</a></p>
      `
    });

    console.log("Approval Email Sent");
  }, 120000); // 2 minutes delay (120000 ms) 3600000

  res.send("Destroy email will be sent shortly");
};