const fetch = require("node-fetch");

module.exports = async function (req, res) {
  if (req.query.token !== process.env.APPROVAL_TOKEN) {
    return res.status(403).send("Invalid token");
  }

  const response = await fetch(
    `https://api.github.com/repos/${process.env.REPO}/actions/workflows/destroy.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { approved: "yes" },
      }),
    }
  );

  if (response.ok) {
    res.send("Terraform destroy triggered.");
  } else {
    const error = await response.text();
    res.status(500).send("Failed to trigger destroy: " + error);
  }
};
