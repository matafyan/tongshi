const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT || 4176);
const rooms = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/rooms") {
      return createRoom(req, res);
    }

    const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{5,8})(?:\/(join|signal|events))?$/i);
    if (roomMatch) {
      const code = roomMatch[1].toUpperCase();
      const action = roomMatch[2] || "";
      if (req.method === "GET" && !action) return getRoom(res, code);
      if (req.method === "POST" && action === "join") return joinRoom(req, res, code);
      if (req.method === "POST" && action === "signal") return relaySignal(req, res, code);
      if (req.method === "GET" && action === "events") return streamEvents(req, res, code, url);
    }

    if (req.method === "GET" && /^\/room\/[A-Z0-9]{5,8}$/i.test(url.pathname)) {
      return serveFile(res, "index.html");
    }

    if (req.method === "GET") {
      const filePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
      return serveFile(res, filePath);
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(port, () => {
  console.log(`Duo room server running at http://localhost:${port}`);
});

function createRoom(req, res) {
  readBody(req)
    .then((body) => {
      const code = createCode();
      const room = {
        code,
        scene: body.scene === "split" ? "split" : "game",
        intent: String(body.intent || "一起连线确认").slice(0, 180),
        hostName: String(body.hostName || "发起人").slice(0, 18),
        guestLabel: "",
        createdAt: Date.now(),
        clients: new Map(),
        backlog: []
      };
      rooms.set(code, room);
      sendJson(res, 201, publicRoom(room));
    })
    .catch(() => sendJson(res, 400, { error: "Bad request" }));
}

function getRoom(res, code) {
  const room = rooms.get(code);
  if (!room) return sendJson(res, 404, { error: "房间不存在或已过期" });
  sendJson(res, 200, publicRoom(room));
}

function joinRoom(req, res, code) {
  const room = rooms.get(code);
  if (!room) return sendJson(res, 404, { error: "房间不存在或已过期" });

  readBody(req)
    .then((body) => {
      room.guestLabel = String(body.name || "对方").slice(0, 18);
      sendEvent(room, "host", "peer-joined", { name: room.guestLabel });
      sendJson(res, 200, publicRoom(room));
    })
    .catch(() => sendJson(res, 400, { error: "Bad request" }));
}

function relaySignal(req, res, code) {
  const room = rooms.get(code);
  if (!room) return sendJson(res, 404, { error: "房间不存在或已过期" });

  readBody(req)
    .then((body) => {
      const message = {
        from: body.from === "guest" ? "guest" : "host",
        to: body.to === "host" ? "host" : "guest",
        type: String(body.type || ""),
        payload: body.payload || null,
        createdAt: Date.now()
      };
      room.backlog = room.backlog.filter(
        (item) => !(item.to === message.to && item.from === message.from && item.type === message.type)
      );
      room.backlog.push(message);
      room.backlog = room.backlog.slice(-20);
      sendEvent(room, message.to, "signal", message);
      sendJson(res, 200, { ok: true });
    })
    .catch(() => sendJson(res, 400, { error: "Bad request" }));
}

function streamEvents(req, res, code, url) {
  const room = rooms.get(code);
  if (!room) {
    res.writeHead(404);
    res.end();
    return;
  }

  const peer = url.searchParams.get("peer") === "guest" ? "guest" : "host";
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });
  res.write(": connected\n\n");

  room.clients.set(peer, res);
  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 25000);
  room.backlog
    .filter((message) => message.to === peer)
    .forEach((message) => writeEvent(res, "signal", message));

  req.on("close", () => {
    clearInterval(heartbeat);
    if (room.clients.get(peer) === res) room.clients.delete(peer);
  });
}

function sendEvent(room, peer, event, data) {
  const client = room.clients.get(peer);
  if (client) writeEvent(client, event, data);
}

function writeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function serveFile(res, filePath) {
  const normalized = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const absolute = path.join(root, normalized);
  if (!absolute.startsWith(root)) return sendJson(res, 403, { error: "Forbidden" });

  fs.readFile(absolute, (error, data) => {
    if (error) return sendJson(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": mime[path.extname(absolute)] || "application/octet-stream" });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function publicRoom(room) {
  return {
    code: room.code,
    scene: room.scene,
    intent: room.intent,
    hostName: room.hostName,
    guestLabel: room.guestLabel,
    createdAt: room.createdAt
  };
}

function createCode() {
  let code = "";
  do {
    code = crypto.randomBytes(4).toString("base64url").replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  } while (code.length < 6 || rooms.has(code));
  return code;
}

setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}, 1000 * 60 * 10);
