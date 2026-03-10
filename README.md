# ResuméLift — ATS Score Analyzer
Buit by Vamsi Markandeya.

---

## 🚀 Run Locally (VS Code)

1. Open the `resumelift` folder in VS Code
2. Open `server.js` and paste your groq API key:
   ```js
   const Groq_API_KEY = "-YOUR-KEY-HERE";
   ```
3. Open the VS Code terminal and run:
   ```bash
   node server.js
   ```
4. Open your browser at: **http://localhost:3000**
5. Anyone on your local network can access it at `http://YOUR-IP:3000`

---

## 🌍 Deploy Free on Vercel (Public URL for everyone)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. From the `resumelift` folder, run:
   ```bash
   vercel
   ```
3. Follow the prompts (free account, no credit card needed)
4. Set your API key as an environment variable:
   ```bash
   vercel env add Groq_API_KEY
   ```
   Paste your key when prompted, select all environments.

5. Redeploy:
   ```bash
   vercel --prod
   ```
6. You'll get a public URL like `https://resumelift-xyz.vercel.app` — share with anyone! 🎉

---

## 🔑 Get an Anthropic API Key
1. Go to https://console.groq.com/
2. Sign up 
3. Go to **API Keys** → **Create Key**
4. Copy the key 

---

## 📁 Project Structure
```
resumelift/
├── index.html        ← The full website (frontend)
├── server.js         ← Local Node.js server
├── package.json      ← Project config
├── vercel.json       ← Vercel deployment config
├── api/
│   └── analyze.js    ← Vercel serverless function
└── README.md
```
