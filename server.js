const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const COHERE_CHAT_URL = "https://api.cohere.com/v2/chat";
const DEFAULT_MODEL = process.env.COHERE_MODEL_DEFAULT || "command-r-plus-08-2024";
const COMMUNITY_FILE = path.join(ROOT, "community-data.json");

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

    if (req.method === "GET" && req.url === "/api/community") {
      return handleCommunitySnapshot(res);
    }

    if (req.method === "POST" && req.url === "/api/community/character/publish") {
      return await handleCommunityCharacterPublish(req, res);
    }

    if (req.method === "POST" && req.url === "/api/community/post/publish") {
      return await handleCommunityPostPublish(req, res);
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

function handleCommunitySnapshot(res) {
  const store = readCommunityStore();
  return sendJson(res, 200, {
    ok: true,
    updatedAt: store.updatedAt,
    characters: store.characters,
    posts: store.posts,
  });
}

async function handleCommunityCharacterPublish(req, res) {
  const body = await readJsonBody(req);
  const profileId = normalizeText(body.profileId);
  const profileName = normalizeText(body.profileName) || "匿名オーナー";
  const character = body.character && typeof body.character === "object" ? body.character : null;

  if (!profileId || !character) {
    return sendJson(res, 400, { message: "profileId と character が必要です" });
  }

  const normalizedCharacter = normalizeCommunityCharacter(character);
  if (!normalizedCharacter.id || !normalizedCharacter.name) {
    return sendJson(res, 400, { message: "公開キャラには id と name が必要です" });
  }

  const store = readCommunityStore();
  const existingIndex = store.characters.findIndex((entry) =>
    entry.profileId === profileId && entry.sourceCharacterId === normalizedCharacter.id
  );
  const now = new Date().toISOString();
  const nextEntry = {
    id: existingIndex >= 0 ? store.characters[existingIndex].id : createServerId("char"),
    profileId,
    profileName,
    sourceCharacterId: normalizedCharacter.id,
    publishedAt: now,
    character: normalizedCharacter,
  };

  if (existingIndex >= 0) {
    store.characters[existingIndex] = nextEntry;
  } else {
    store.characters.unshift(nextEntry);
  }

  store.updatedAt = now;
  writeCommunityStore(store);
  return sendJson(res, 200, { ok: true, entry: nextEntry });
}

async function handleCommunityPostPublish(req, res) {
  const body = await readJsonBody(req);
  const profileId = normalizeText(body.profileId);
  const profileName = normalizeText(body.profileName) || "匿名オーナー";
  const post = body.post && typeof body.post === "object" ? body.post : null;

  if (!profileId || !post) {
    return sendJson(res, 400, { message: "profileId と post が必要です" });
  }

  const normalizedPost = normalizeCommunityPost(post);
  if (!normalizedPost.authorSnapshot?.name || !normalizedPost.postText) {
    return sendJson(res, 400, { message: "公開投稿には authorSnapshot.name と postText が必要です" });
  }

  const store = readCommunityStore();
  const nextEntry = {
    id: createServerId("post"),
    profileId,
    profileName,
    publishedAt: new Date().toISOString(),
    ...normalizedPost,
  };

  store.posts.unshift(nextEntry);
  store.posts = store.posts.slice(0, 200);
  store.updatedAt = nextEntry.publishedAt;
  writeCommunityStore(store);
  return sendJson(res, 200, { ok: true, entry: nextEntry });
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

function readCommunityStore() {
  if (!fs.existsSync(COMMUNITY_FILE)) {
    const initial = { updatedAt: new Date().toISOString(), characters: [], posts: [] };
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const text = fs.readFileSync(COMMUNITY_FILE, "utf8");
    const parsed = JSON.parse(text);
    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    };
  } catch (_error) {
    return { updatedAt: new Date().toISOString(), characters: [], posts: [] };
  }
}

function writeCommunityStore(store) {
  fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(store, null, 2), "utf8");
}

function normalizeCommunityCharacter(character) {
  return {
    id: normalizeText(character.id),
    name: normalizeText(character.name),
    title: normalizeText(character.title),
    age: normalizeText(character.age),
    gender: normalizeText(character.gender),
    firstPerson: normalizeText(character.firstPerson),
    secondPerson: normalizeText(character.secondPerson),
    archetype: normalizeText(character.archetype) || "cool",
    faction: normalizeText(character.faction),
    tone: normalizeText(character.tone),
    personality: normalizeText(character.personality),
    ability: normalizeText(character.ability),
    style: normalizeText(character.style),
    weakness: normalizeText(character.weakness),
    ultimate: normalizeText(character.ultimate),
    origin: normalizeText(character.origin),
    likes: normalizeText(character.likes),
    dislikes: normalizeText(character.dislikes),
    hobbies: normalizeText(character.hobbies),
    mannerisms: normalizeText(character.mannerisms),
    favoritePhrase: normalizeText(character.favoritePhrase),
    hatedPhrase: normalizeText(character.hatedPhrase),
    angerReaction: normalizeText(character.angerReaction),
    praiseReaction: normalizeText(character.praiseReaction),
    tauntReaction: normalizeText(character.tauntReaction),
    gratitudeStyle: normalizeText(character.gratitudeStyle),
    defeatStyle: normalizeText(character.defeatStyle),
    victoryStyle: normalizeText(character.victoryStyle),
    notes: normalizeText(character.notes),
    imageDataUrl: normalizeImageDataUrl(character.imageDataUrl),
    techniques: Array.isArray(character.techniques)
      ? character.techniques.slice(0, 20).map((technique) => ({
          id: normalizeText(technique.id) || createServerId("tech"),
          name: normalizeText(technique.name),
          type: normalizeText(technique.type),
          aliases: normalizeText(technique.aliases),
          staminaCost: clampNumber(technique.staminaCost, 0, 99, 0),
          power: clampNumber(technique.power, 0, 99, 0),
          effect: normalizeText(technique.effect),
          description: normalizeText(technique.description),
        }))
      : [],
    stats: {
      atk: clampNumber(character?.stats?.atk, 20, 100, 60),
      spd: clampNumber(character?.stats?.spd, 20, 100, 60),
      mind: clampNumber(character?.stats?.mind, 20, 100, 60),
      charm: clampNumber(character?.stats?.charm, 20, 100, 60),
    },
  };
}

function normalizeCommunityPost(post) {
  const tags = Array.isArray(post.tags)
    ? post.tags.map((tag) => normalizeText(tag)).filter(Boolean).slice(0, 8)
    : [];
  return {
    genre: normalizeText(post.genre) || "daily",
    mood: normalizeText(post.mood) || "bright",
    postText: normalizeText(post.postText),
    rawInput: normalizeText(post.rawInput),
    tags,
    timestamp: normalizeText(post.timestamp) || new Date().toISOString(),
    authorId: normalizeText(post.authorId),
    authorSnapshot: {
      id: normalizeText(post?.authorSnapshot?.id),
      name: normalizeText(post?.authorSnapshot?.name),
      title: normalizeText(post?.authorSnapshot?.title),
      archetype: normalizeText(post?.authorSnapshot?.archetype) || "cool",
      tone: normalizeText(post?.authorSnapshot?.tone),
      faction: normalizeText(post?.authorSnapshot?.faction),
      imageDataUrl: normalizeImageDataUrl(post?.authorSnapshot?.imageDataUrl),
    },
  };
}

function normalizeImageDataUrl(value) {
  const text = normalizeText(value);
  if (!text.startsWith("data:image/")) {
    return "";
  }
  return text.slice(0, 600_000);
}

function createServerId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
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
