const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

const state = {
  code: null,
  role: null,
  room: null,
  peer: null,
  channel: null,
  events: null
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  attachEvents();
  init();
});

function cacheElements() {
  [
    "startView",
    "roomView",
    "intentInput",
    "createRoom",
    "roomIntent",
    "statusBadge",
    "inviteBox",
    "inviteLink",
    "copyInvite",
    "joinRoom",
    "messages",
    "messageForm",
    "messageInput",
    "sendMessage",
    "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function attachEvents() {
  els.createRoom.addEventListener("click", createRoom);
  els.copyInvite.addEventListener("click", () => copyText(els.inviteLink.value, "已复制链接"));
  els.joinRoom.addEventListener("click", joinRoom);
  els.messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });
}

async function init() {
  if (!("RTCPeerConnection" in window)) {
    setStatus("浏览器不支持 WebRTC", false);
    return;
  }

  const code = getRoomCodeFromUrl();
  if (!code) return;

  state.code = code;
  state.role = new URLSearchParams(window.location.search).get("role") === "host" ? "host" : "guest";
  state.room = await api(`/api/rooms/${code}`);
  showRoom();

  if (state.role === "host") {
    els.inviteBox.classList.remove("hidden");
    els.inviteLink.value = inviteUrl(code);
    connectAsHost();
  } else {
    els.joinRoom.classList.remove("hidden");
    setStatus("准备加入", false);
  }
}

async function createRoom() {
  try {
    const intent = els.intentInput.value.trim() || els.intentInput.placeholder;
    const room = await api("/api/rooms", {
      method: "POST",
      body: { intent, scene: "simple", hostName: "发起人" }
    });

    state.code = room.code;
    state.role = "host";
    state.room = room;
    window.history.replaceState(null, "", `/room/${room.code}?role=host`);
    showRoom();
    els.inviteBox.classList.remove("hidden");
    els.inviteLink.value = inviteUrl(room.code);
    connectAsHost();
    showToast("链接已创建");
  } catch (error) {
    showError(error);
  }
}

async function joinRoom() {
  try {
    await api(`/api/rooms/${state.code}/join`, {
      method: "POST",
      body: { name: "对方" }
    });
    els.joinRoom.classList.add("hidden");
    connectAsGuest();
    showToast("正在连接");
  } catch (error) {
    showError(error);
  }
}

function showRoom() {
  els.startView.classList.add("hidden");
  els.roomView.classList.remove("hidden");
  els.roomIntent.textContent = state.room.intent;
  setStatus(state.role === "host" ? "等待对方打开链接" : "点击进入聊天", false);
}

async function connectAsHost() {
  resetConnection();
  subscribeSignals("host");
  const peer = createPeer();
  const channel = peer.createDataChannel("chat");
  setupChannel(channel);
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  await waitForIceGathering(peer);
  await sendSignal("host", "guest", "offer", peer.localDescription);
}

function connectAsGuest() {
  resetConnection();
  subscribeSignals("guest");
  setStatus("等待发起方在线", false);
}

function createPeer() {
  const peer = new RTCPeerConnection({ iceServers });
  state.peer = peer;
  peer.addEventListener("connectionstatechange", () => {
    if (peer.connectionState === "connected") {
      setStatus("P2P 已连接", true);
      setChatEnabled(true);
    } else if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
      setStatus("连接断开", false);
      setChatEnabled(false);
    } else {
      setStatus("正在连接", false);
    }
  });
  return peer;
}

function setupChannel(channel) {
  state.channel = channel;
  channel.addEventListener("open", () => {
    setStatus("P2P 已连接", true);
    setChatEnabled(true);
    addSystemMessage("已连接，可以开始聊。");
  });
  channel.addEventListener("message", (event) => addMessage("peer", event.data));
  channel.addEventListener("close", () => {
    setStatus("连接断开", false);
    setChatEnabled(false);
  });
}

function subscribeSignals(peerName) {
  if (state.events) state.events.close();
  state.events = new EventSource(`/api/rooms/${state.code}/events?peer=${peerName}`);
  state.events.addEventListener("signal", async (event) => {
    const message = JSON.parse(event.data);
    await handleSignal(message);
  });
  state.events.addEventListener("peer-joined", () => addSystemMessage("对方已打开链接。"));
  state.events.addEventListener("error", () => setStatus("信令重连中", false));
}

async function handleSignal(message) {
  if (message.type === "offer") {
    const peer = createPeer();
    peer.addEventListener("datachannel", (event) => setupChannel(event.channel));
    await peer.setRemoteDescription(message.payload);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitForIceGathering(peer);
    await sendSignal("guest", "host", "answer", peer.localDescription);
    return;
  }

  if (message.type === "answer" && state.peer) {
    await state.peer.setRemoteDescription(message.payload);
  }
}

async function sendSignal(from, to, type, payload) {
  await api(`/api/rooms/${state.code}/signal`, {
    method: "POST",
    body: { from, to, type, payload }
  });
}

function sendMessage() {
  const text = els.messageInput.value.trim();
  if (!text || state.channel?.readyState !== "open") return;
  state.channel.send(text);
  addMessage("me", text);
  els.messageInput.value = "";
}

function resetConnection() {
  if (state.events) state.events.close();
  if (state.channel) state.channel.close();
  if (state.peer) state.peer.close();
  state.events = null;
  state.channel = null;
  state.peer = null;
  setChatEnabled(false);
}

function setChatEnabled(enabled) {
  els.messageInput.disabled = !enabled;
  els.sendMessage.disabled = !enabled;
}

function waitForIceGathering(peer) {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(done, 2500);
    peer.addEventListener("icegatheringstatechange", () => {
      if (peer.iceGatheringState === "complete") done();
    });
    function done() {
      window.clearTimeout(timeout);
      resolve();
    }
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch {
    showToast("复制失败，请手动复制");
  }
}

function getRoomCodeFromUrl() {
  const match = window.location.pathname.match(/^\/room\/([a-z0-9-]+)$/i);
  return match ? match[1].toUpperCase() : null;
}

function inviteUrl(code) {
  return `${window.location.origin}/room/${code}`;
}

function setStatus(text, connected) {
  els.statusBadge.textContent = text;
  els.statusBadge.classList.toggle("connected", connected);
}

function addMessage(type, text) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  els.messages.appendChild(node);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function addSystemMessage(text) {
  const node = document.createElement("div");
  node.className = "system-message";
  node.textContent = text;
  els.messages.appendChild(node);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function showError(error) {
  console.error(error);
  showToast(error.message || "操作失败");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 1600);
}
