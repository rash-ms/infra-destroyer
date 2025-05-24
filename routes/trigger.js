const fetch = require("node-fetch");

module.exports = async function (req, res) {
  const { token, infra_dir } = req.body;

  // Debug the token mismatch
  console.log("Received token:", `"${token}"`);
  console.log("Expected token:", `"${process.env.APPROVAL_TOKEN}"`);
  console.log("Match:", token === process.env.APPROVAL_TOKEN);

  if (token !== process.env.APPROVAL_TOKEN) {
    return res.status(403).send("Invalid token");
  }

  // Step 1: Trigger the destroy workflow
  const dispatchResponse = await fetch(
    `https://api.github.com/repos/${process.env.REPO}/actions/workflows/aws-infra-destroyer.yaml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          approved: "yes",
          infra_dir: infra_dir || "fallback/default",
          environment_name: "notify-auto-approval"
        }
      }),
    }
  );

  if (!dispatchResponse.ok) {
    const error = await dispatchResponse.text();
    console.error("Failed to trigger destroy:", error);
    return res.status(500).send("Failed to trigger destroy: " + error);
  }

  // Step 2: Wait a bit before fetching the new run
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay

  // Step 3: Fetch the most recent runs for this workflow
  const runsResponse = await fetch(
    `https://api.github.com/repos/${process.env.REPO}/actions/workflows/aws-infra-destroyer.yaml/runs?event=workflow_dispatch&per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        Accept: "application/vnd.github+json",
      }
    }
  );

  if (!runsResponse.ok) {
    const error = await runsResponse.text();
    console.error("Failed to fetch workflow runs:", error);
    return res.status(500).send("Failed to locate workflow run: " + error);
  }

  const runsData = await runsResponse.json();
  const latestRun = runsData.workflow_runs?.[0];

  if (latestRun && latestRun.html_url) {
    console.log("Redirecting to workflow run:", latestRun.html_url);
    return res.redirect(latestRun.html_url);
  } else {
    return res.redirect(`https://github.com/${process.env.REPO}/actions`);
  }
};
