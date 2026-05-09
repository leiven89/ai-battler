const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const COHERE_CHAT_URL = "https://api.cohere.com/v2/chat";
const DEFAULT_MODEL = process.env.COHERE_MODEL_DEFAULT || "command-r-plus-08-2024";
const COMMUNITY_FILE = path.join(ROOT, "community-data.json");

const FIREBASE_PROJECT_ID = normalizeText(process.env.FIREBASE_PROJECT_ID);
const FIREBASE_CLIENT_EMAIL = normalizeText(process.env.FIREBASE_CLIENT_EMAIL);
const FIREBASE_PRIVATE_KEY = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
const FIRESTORE_CHARACTERS_COLLECTION = normalizeText(process.env.FIRESTORE_CHARACTERS_COLLECTION) || "communityCharacters";
const FIRESTORE_POSTS_COLLECTION = normalizeText(process.env.FIRESTORE_POSTS_COLLECTION) || "communityPosts";
const FIRESTORE_BASE_URL = FIREBASE_PROJECT_ID
  ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`
  : "";
const FIREBASE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIREBASE_SCOPE = "https://www.googleapis.com/auth/datastore";

let firebaseTokenCache = {
  accessToken: "",
  expiresAt: 0,
};

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
        communityBackend: getCommunityBackendMode(),
        firebaseConfigured: isFirebaseConfigured(),
      });
    }

    if (req.method === "GET" && req.url === "/api/community") {
      return await handleCommunitySnapshot(res);
    }

    if (req.method === "POST" && req.url === "/api/community/character/publish") {
      return await handleCommunityCharacterPublish(req, res);
    }

    if (req.method === "POST" && req.url === "/api/community/post/publish") {
      return await handleCommunityPostPublish(req, res);
    }

    if (req.method === "POST" && req.url === "/api/community/post/comment") {
      return await handleCommunityPostComment(req, res);
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
      message: "COHERE_API_KEY is not configured on the server.",
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
    return sendJson(res, 502, { message: "Cohere response did not include text content." });
  }

  return sendJson(res, 200, { text });
}

async function handleCohereTest(req, res) {
  if (!process.env.COHERE_API_KEY) {
    return sendJson(res, 500, {
      message: "COHERE_API_KEY is not configured on the server.",
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

async function handleCommunitySnapshot(res) {
  const store = await getCommunityStore();
  return sendJson(res, 200, {
    ok: true,
    backend: getCommunityBackendMode(),
    updatedAt: store.updatedAt,
    characters: store.characters,
    posts: store.posts,
  });
}

async function handleCommunityCharacterPublish(req, res) {
  const body = await readJsonBody(req);
  const profileId = normalizeText(body.profileId);
  const profileName = normalizeText(body.profileName) || "Anonymous Owner";
  const character = body.character && typeof body.character === "object" ? body.character : null;

  if (!profileId || !character) {
    return sendJson(res, 400, { message: "profileId and character are required." });
  }

  const normalizedCharacter = normalizeCommunityCharacter(character);
  if (!normalizedCharacter.id || !normalizedCharacter.name) {
    return sendJson(res, 400, { message: "Published characters must include id and name." });
  }

  const entry = {
    id: sanitizeFirestoreDocId(`${profileId}__${normalizedCharacter.id}`),
    profileId,
    profileName,
    sourceCharacterId: normalizedCharacter.id,
    publishedAt: new Date().toISOString(),
    character: normalizedCharacter,
  };

  await saveCommunityCharacter(entry);
  return sendJson(res, 200, { ok: true, entry });
}

async function handleCommunityPostPublish(req, res) {
  const body = await readJsonBody(req);
  const profileId = normalizeText(body.profileId);
  const profileName = normalizeText(body.profileName) || "Anonymous Owner";
  const post = body.post && typeof body.post === "object" ? body.post : null;

  if (!profileId || !post) {
    return sendJson(res, 400, { message: "profileId and post are required." });
  }

  const normalizedPost = normalizeCommunityPost(post);
  if (!normalizedPost.authorSnapshot?.name || !normalizedPost.postText) {
    return sendJson(res, 400, { message: "Published posts must include authorSnapshot.name and postText." });
  }

  const entry = {
    id: createServerId("post"),
    profileId,
    profileName,
    publishedAt: new Date().toISOString(),
    ...normalizedPost,
  };

  await saveCommunityPost(entry);
  return sendJson(res, 200, { ok: true, entry });
}

async function handleCommunityPostComment(req, res) {
  const body = await readJsonBody(req);
  const profileId = normalizeText(body.profileId);
  const profileName = normalizeText(body.profileName) || "Anonymous Owner";
  const postId = normalizeText(body.postId);
  const comment = body.comment && typeof body.comment === "object" ? body.comment : null;

  if (!profileId || !postId || !comment) {
    return sendJson(res, 400, { message: "profileId, postId, and comment are required." });
  }

  const normalizedComment = normalizeCommunityComment(comment);
  if (!normalizedComment.commenterSnapshot?.name || !normalizedComment.text) {
    return sendJson(res, 400, { message: "Public comments must include commenterSnapshot.name and text." });
  }

  const entry = {
    id: createServerId("comment"),
    profileId,
    profileName,
    publishedAt: new Date().toISOString(),
    ...normalizedComment,
  };

  const updatedPost = await appendCommunityPostComment(postId, entry);
  return sendJson(res, 200, { ok: true, entry, post: updatedPost });
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
      } catch (_error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrivateKey(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  return text.replace(/\\n/g, "\n");
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function extractCohereError(payload) {
  return payload?.message || payload?.error?.message || payload?.error || "";
}

function isFirebaseConfigured() {
  return Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);
}

function getCommunityBackendMode() {
  return isFirebaseConfigured() ? "firebase" : "local-file";
}

async function getCommunityStore() {
  if (!isFirebaseConfigured()) {
    return readCommunityStoreFromFile();
  }

  const [characters, posts] = await Promise.all([
    listFirestoreCollection(FIRESTORE_CHARACTERS_COLLECTION),
    listFirestoreCollection(FIRESTORE_POSTS_COLLECTION),
  ]);

  const latestCharacterTime = characters.map((item) => item.publishedAt).sort().at(-1) || "";
  const latestPostTime = posts.map((item) => item.publishedAt || item.timestamp).sort().at(-1) || "";
  const updatedAt = [latestCharacterTime, latestPostTime].filter(Boolean).sort().at(-1) || new Date().toISOString();

  return {
    updatedAt,
    characters: characters.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    posts: posts.sort((a, b) => new Date(b.publishedAt || b.timestamp) - new Date(a.publishedAt || a.timestamp)),
  };
}

async function saveCommunityCharacter(entry) {
  if (!isFirebaseConfigured()) {
    const store = readCommunityStoreFromFile();
    const index = store.characters.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      store.characters[index] = entry;
    } else {
      store.characters.unshift(entry);
    }
    store.updatedAt = entry.publishedAt;
    writeCommunityStoreToFile(store);
    return;
  }

  await writeFirestoreDocument(FIRESTORE_CHARACTERS_COLLECTION, entry.id, entry);
}

async function saveCommunityPost(entry) {
  if (!isFirebaseConfigured()) {
    const store = readCommunityStoreFromFile();
    store.posts.unshift(entry);
    store.posts = store.posts.slice(0, 200);
    store.updatedAt = entry.publishedAt;
    writeCommunityStoreToFile(store);
    return;
  }

  await writeFirestoreDocument(FIRESTORE_POSTS_COLLECTION, entry.id, entry);
}

async function appendCommunityPostComment(postId, commentEntry) {
  if (!isFirebaseConfigured()) {
    const store = readCommunityStoreFromFile();
    const index = store.posts.findIndex((item) => item.id === postId);
    if (index < 0) {
      throw new Error("Community post not found.");
    }
    const nextPost = {
      ...store.posts[index],
      comments: [...(store.posts[index].comments || []), commentEntry].slice(-80),
    };
    store.posts[index] = nextPost;
    store.updatedAt = commentEntry.publishedAt;
    writeCommunityStoreToFile(store);
    return nextPost;
  }

  const existing = await readFirestoreDocument(FIRESTORE_POSTS_COLLECTION, postId);
  if (!existing) {
    throw new Error("Community post not found.");
  }

  const nextPost = {
    ...existing,
    comments: [...(existing.comments || []), commentEntry].slice(-80),
  };
  await writeFirestoreDocument(FIRESTORE_POSTS_COLLECTION, postId, nextPost);
  return nextPost;
}

function readCommunityStoreFromFile() {
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

function writeCommunityStoreToFile(store) {
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
    comments: Array.isArray(post.comments)
      ? post.comments.slice(0, 80).map((comment) => normalizeCommunityComment(comment))
      : [],
  };
}

function normalizeCommunityComment(comment) {
  return {
    commenterId: normalizeText(comment.commenterId),
    text: normalizeText(comment.text),
    timestamp: normalizeText(comment.timestamp) || new Date().toISOString(),
    delta: {
      friendship: clampNumber(comment?.delta?.friendship, -20, 20, 0),
      rivalry: clampNumber(comment?.delta?.rivalry, -20, 20, 0),
      respect: clampNumber(comment?.delta?.respect, -20, 20, 0),
      caution: clampNumber(comment?.delta?.caution, -20, 20, 0),
    },
    commenterSnapshot: {
      id: normalizeText(comment?.commenterSnapshot?.id),
      name: normalizeText(comment?.commenterSnapshot?.name),
      title: normalizeText(comment?.commenterSnapshot?.title),
      archetype: normalizeText(comment?.commenterSnapshot?.archetype) || "cool",
      tone: normalizeText(comment?.commenterSnapshot?.tone),
      faction: normalizeText(comment?.commenterSnapshot?.faction),
      imageDataUrl: normalizeImageDataUrl(comment?.commenterSnapshot?.imageDataUrl),
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

function sanitizeFirestoreDocId(value) {
  return String(value || "")
    .replaceAll("/", "_")
    .replaceAll("\\", "_")
    .replaceAll("?", "_")
    .replaceAll("#", "_")
    .replaceAll("[", "_")
    .replaceAll("]", "_")
    .slice(0, 120);
}

async function listFirestoreCollection(collectionName) {
  const response = await firebaseFetch(`${FIRESTORE_BASE_URL}/${collectionName}?pageSize=100`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractGoogleApiError(payload) || "Failed to list Firestore documents.");
  }

  return (payload.documents || []).map((document) => decodeFirestoreDocument(document));
}

async function readFirestoreDocument(collectionName, docId) {
  const safeId = sanitizeFirestoreDocId(docId);
  const response = await firebaseFetch(`${FIRESTORE_BASE_URL}/${collectionName}/${safeId}`);
  if (response.status === 404) {
    return null;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractGoogleApiError(payload) || "Failed to read Firestore document.");
  }
  return decodeFirestoreDocument(payload);
}

async function writeFirestoreDocument(collectionName, docId, data) {
  const safeId = sanitizeFirestoreDocId(docId);
  const response = await firebaseFetch(`${FIRESTORE_BASE_URL}/${collectionName}/${safeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: encodeFirestoreFields(data),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractGoogleApiError(payload) || "Failed to write Firestore document.");
  }

  return payload;
}

async function firebaseFetch(url, options = {}) {
  const accessToken = await getFirebaseAccessToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

async function getFirebaseAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (firebaseTokenCache.accessToken && firebaseTokenCache.expiresAt > now + 60) {
    return firebaseTokenCache.accessToken;
  }

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase server credentials are not configured.");
  }

  const assertion = createServiceAccountAssertion(now);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(FIREBASE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractGoogleApiError(payload) || "Failed to obtain Firebase access token.");
  }

  firebaseTokenCache = {
    accessToken: payload.access_token,
    expiresAt: now + Number(payload.expires_in || 3600),
  };
  return firebaseTokenCache.accessToken;
}

function createServiceAccountAssertion(nowInSeconds) {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: FIREBASE_SCOPE,
    aud: FIREBASE_TOKEN_URL,
    exp: nowInSeconds + 3600,
    iat: nowInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsignedToken).sign(FIREBASE_PRIVATE_KEY, "base64url");
  return `${unsignedToken}.${signature}`;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function encodeFirestoreFields(data) {
  const fields = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    fields[key] = encodeFirestoreValue(value);
  });
  return fields;
}

function encodeFirestoreValue(value) {
  if (value === null) {
    return { nullValue: null };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => encodeFirestoreValue(item)),
      },
    };
  }
  if (typeof value === "boolean") {
    return { booleanValue: value };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string") {
    return { stringValue: value };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: encodeFirestoreFields(value),
      },
    };
  }
  return { stringValue: String(value) };
}

function decodeFirestoreDocument(document) {
  return decodeFirestoreMap(document.fields || {});
}

function decodeFirestoreMap(fields) {
  const result = {};
  Object.entries(fields).forEach(([key, value]) => {
    result[key] = decodeFirestoreValue(value);
  });
  return result;
}

function decodeFirestoreValue(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("nullValue" in value) return null;
  if ("mapValue" in value) return decodeFirestoreMap(value.mapValue.fields || {});
  if ("arrayValue" in value) {
    return Array.isArray(value.arrayValue.values)
      ? value.arrayValue.values.map((item) => decodeFirestoreValue(item))
      : [];
  }
  return null;
}

function extractGoogleApiError(payload) {
  return payload?.error?.message || payload?.error_description || payload?.message || "";
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
