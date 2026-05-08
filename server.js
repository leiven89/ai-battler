const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const COHERE_CHAT_URL = "https://api.cohere.com/v2/chat";
const DEFAULT_MODEL = process.env.COHERE_MODEL_DEFAULT || "command-r-plus-08-2024";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/cohere/chat") {
      return await handleCohereChat(req, res);
    }

    if (req.method === "POST" && req.url === "/api/cohere/test") {
      return await handleCohereTest(req, res);
    }

    if (req.method === "GET" && req.url === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        hasApiKey: Boolean(process.env.COHERE_API_KEY),
        model: DEFAULT_MODEL,
      });
    }

    return serveStatic(req, res);
  } catch (error) {
    return sendJson(res, 500, { message: error.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`OC BATTLE LINK server running on http://localhost:${PORT}`);
});

async function handleCohereChat(req, res) {
  if (!process.env.COHERE_API_KEY) {
    return sendJson(res, 500, {
      message: "COHERE_API_KEY がサーバーに設定されていません",
    });
  }

  const body = await readJsonBody(req);
  const model = normalizeText(body.model) || DEFAULT_MODEL;
  const temperature = clampNumber(body.temperature, 0, 2, 0.7);
  const maxTokens = clampNumber(body.maxTokens, 100, 4000, 900);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const responseSchema = body.responseSchema && typeof body.responseSchema === "object"
    ? body.responseSchema
    : null;

  const payload = {
    stream: false,
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
    response_format: {
      type: "json_object",
      ...(responseSchema ? { schema: responseSchema } : {}),
    },
  };

  const cohereResponse = await fetch(COHERE_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
      "X-Client-Name": "oc-battle-link-proxy",
    },
    body: JSON.stringify(payload),
  });

  const coherePayload = await cohereResponse.json().catch(() => ({}));
  if (!cohereResponse.ok) {
    return sendJson(res, cohereResponse.status, {
      message: extractCohereError(coherePayload) || "Cohere API request failed",
    });
  }

  const text = coherePayload?.message?.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    return sendJson(res, 502, { message: "Cohere response にテキストがありません" });
  }

  return sendJson(res, 200, { text });
}

async function handleCohereTest(req, res) {
  if (!process.env.COHERE_API_KEY) {
    return sendJson(res, 500, {
      message: "COHERE_API_KEY がサーバーに設定されていません",
    });
  }

  const body = await readJsonBody(req);
  const model = normalizeText(body.model) || DEFAULT_MODEL;

  const cohereResponse = await fetch(COHERE_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
      "X-Client-Name": "oc-battle-link-proxy-test",
    },
    body: JSON.stringify({
      stream: false,
      model,
      temperature: 0.2,
      max_tokens: 120,
      messages: [
        { role: "system", content: "Return only a JSON object." },
        { role: "user", content: 'Generate a JSON object with {"status":"ok","message":"connected"}.' },
      ],
      response_format: {
        type: "json_object",
        schema: {
          type: "object",
          required: ["status", "message"],
          properties: {
            status: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    }),
  });

  const coherePayload = await cohereResponse.json().catch(() => ({}));
  if (!cohereResponse.ok) {
    return sendJson(res, cohereResponse.status, {
      message: extractCohereError(coherePayload) || "Cohere API request failed",
    });
  }

  return sendJson(res, 200, {
    ok: true,
    model,
    message: "connected",
  });
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    return sendJson(res, 403, { message: "Forbidden" });
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      return sendFile(path.join(ROOT, "index.html"), res);
    }
    return sendFile(filePath, res);
  });
}

function sendFile(filePath, res) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, statusCode, payload) {
  const text = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function extractCohereError(payload) {
  return payload?.message || payload?.error?.message || payload?.error || "";
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const text = fs.readFileSync(filePath, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}
