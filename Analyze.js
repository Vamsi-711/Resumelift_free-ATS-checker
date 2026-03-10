const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: { message: "Method not allowed" } }); return; }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    res.status(500).json({ error: { message: "GROQ_API_KEY not set on server." } });
    return;
  }

  try {
    const { messages } = req.body;

    let promptText = "";
    const msgContent = messages[0].content;
    if (typeof msgContent === "string") promptText = msgContent;
    else if (Array.isArray(msgContent)) promptText = msgContent.map(p => p.text || "").join("\n");

    const groqBody = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS resume analyst. Always respond with valid JSON only. No markdown, no backticks, no extra text — just the raw JSON object."
        },
        { role: "user", content: promptText }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + GROQ_API_KEY,
          "Content-Length": Buffer.byteLength(groqBody),
        },
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = "";
        apiRes.on("data", c => { data += c; });
        apiRes.on("end", () => resolve({ status: apiRes.statusCode, body: data }));
      });
      apiReq.on("error", reject);
      apiReq.write(groqBody);
      apiReq.end();
    });

    const parsed = JSON.parse(response.body);

    if (parsed.error) {
      res.status(400).json({ error: { message: parsed.error.message } });
      return;
    }

    const text = parsed?.choices?.[0]?.message?.content || "";
    res.status(200).json({ content: [{ type: "text", text }] });

  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
};
