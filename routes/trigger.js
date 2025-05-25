const fetch = require("node-fetch");

module.exports = async function (req, res) {
  try {
    // Debug incoming request
    console.log("=== REQUEST DEBUG ===");
    console.log("Method:", req.method);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("User-Agent:", req.headers['user-agent']);
    console.log("Raw body:", req.body);
    console.log("Query params:", req.query);

    // Extract token and infra_dir from all possible sources
    let token, infra_dir;

    // Case 1: JSON POST (GitHub Action)
    if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
      ({ token, infra_dir } = req.body);
    }
    // Case 2: Form POST
    else if (req.method === 'POST' && req.headers['content-type']?.includes('x-www-form-urlencoded')) {
      token = req.body.token;
      infra_dir = req.body.infra_dir;
    }
    // Case 3: GET request (email link)
    else if (req.method === 'GET') {
      token = req.query.token;
      infra_dir = req.query.infra_dir;
    }
    // Case 4: Fallback parsing
    else {
      try {
        const rawData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        token = rawData?.token;
        infra_dir = rawData?.infra_dir;
      } catch (e) {
        console.log("Fallback parse error:", e);
      }
    }

    console.log("Extracted values:", { token, infra_dir });

    // Validate token
    if (!token || token !== process.env.APPROVAL_TOKEN) {
      console.error("Invalid token received");
      return res.status(403).json({
        error: "Invalid token",
        debug: {
          received_token: token,
          expected_token: process.env.APPROVAL_TOKEN,
          request_method: req.method,
          content_type: req.headers['content-type']
        }
      });
    }

    // Validate infra_dir
    if (!infra_dir) {
      console.error("Missing infra_dir");
      return res.status(400).json({
        error: "Missing infra_dir",
        debug: {
          received_body: req.body,
          query_params: req.query,
          content_type: req.headers['content-type']
        }
      });
    }

    // Trigger GitHub workflow
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
            infra_dir: infra_dir,
            environment_name: "notify-auto-approval"
          }
        }),
      }
    );

    if (!dispatchResponse.ok) {
      const error = await dispatchResponse.text();
      console.error("Failed to trigger destroy:", error);
      return res.status(500).json({
        error: "Failed to trigger destroy",
        details: error
      });
    }

    // Wait before checking run status
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Find the triggered run
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
      return res.status(500).json({
        error: "Failed to locate workflow run",
        details: error
      });
    }

    const runsData = await runsResponse.json();
    const latestRun = runsData.workflow_runs?.[0];

    // Return appropriate response based on client
    if (req.headers.accept?.includes('text/html')) {
      // Browser/email client - redirect
      const redirectUrl = latestRun?.html_url || `https://github.com/${process.env.REPO}/actions`;
      console.log("Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      // API client - return JSON
      return res.json({
        success: true,
        workflow_run: latestRun?.html_url
      });
    }

  } catch (error) {
    console.error("Unexpected error in trigger:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};