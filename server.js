const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── PUT YOUR FREE GROQ API KEY HERE ────────────────────────────────────────
// Get it FREE at: https://console.groq.com → API Keys → Create API Key
// No credit card needed! Works in India!
const GROQ_API_KEY = "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";
// ────────────────────────────────────────────────────────────────────────────

const PORT = 3000;

const MIME = {
  ".html": "text/html",
  ".css":  "text/css",
  ".js":   "application/javascript",
  ".json": "application/json",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // ── /api/analyze ────────────────────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/analyze") {
    let raw = "";
    req.on("data", c => { raw += c; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(raw);

        // Extract prompt text from messages
        let promptText = "";
        const msgContent = payload.messages[0].content;
        if (typeof msgContent === "string") {
          promptText = msgContent;
        } else if (Array.isArray(msgContent)) {
          promptText = msgContent.map(p => p.text || "").join("\n");
        }

        if (!promptText) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "Empty prompt" } }));
          return;
        }

        // Groq request — uses OpenAI-compatible API
        const groqBody = JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert ATS resume analyst. Always respond with valid JSON only. No markdown, no backticks, no extra text — just the raw JSON object."
            },
            {
              role: "user",
              content: promptText
            }
          ],
          temperature: 0.3,
          max_tokens: 2048
        });

        const options = {
          hostname: "api.groq.com",
          path: "/openai/v1/chat/completions",
          method: "POST",
          headers: {
            "Content-Type":   "application/json",
            "Authorization":  "Bearer " + GROQ_API_KEY,
            "Content-Length": Buffer.byteLength(groqBody),
          },
        };

        console.log("→ Sending to Groq, prompt length:", promptText.length);

        const apiReq = https.request(options, (apiRes) => {
          let data = "";
          apiRes.on("data", c => { data += c; });
          apiRes.on("end", () => {
            console.log("← Groq status:", apiRes.statusCode);

            let parsed;
            try { parsed = JSON.parse(data); }
            catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: { message: "Bad JSON from Groq: " + data.slice(0, 200) } }));
              return;
            }

            // Groq error
            if (parsed.error) {
              console.error("Groq error:", parsed.error.message);
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: { message: parsed.error.message } }));
              return;
            }

            // Extract text from Groq response
            const text = parsed?.choices?.[0]?.message?.content || "";

            if (!text) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: { message: "No response from Groq" } }));
              return;
            }

            console.log("✓ Got response, length:", text.length);

            // Return in the same shape the frontend expects
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ content: [{ type: "text", text }] }));
          });
        });

        apiReq.on("error", (e) => {
          console.error("HTTPS error:", e.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: e.message } }));
        });

        apiReq.write(groqBody);
        apiReq.end();

      } catch (e) {
        console.error("Parse error:", e.message);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "Bad request: " + e.message } }));
      }
    });
    return;
  }

  // ── Static files ─────────────────────────────────────────────────────────────
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("\n✅  ResuméLift is running!");
  console.log("👉  Open: http://localhost:" + PORT + "\n");
});
