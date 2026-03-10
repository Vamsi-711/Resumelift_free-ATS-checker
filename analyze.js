const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    res.status(500).json({ error: { message: "API key not configured on server." } });
    return;
  }

  try {
    const { messages } = req.body;

    const postData = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages,
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = "";
        apiRes.on("data", chunk => { data += chunk; });
        apiRes.on("end", () => resolve({ status: apiRes.statusCode, body: data }));
      });
      apiReq.on("error", reject);
      apiReq.write(postData);
      apiReq.end();
    });

    res.status(response.status).json(JSON.parse(response.body));
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
};
