// ---- MASTER AI — frontend logic ----
// Talks to your n8n webhook. Change the URL below (or via the ⚙ settings panel)
// if your n8n webhook address ever changes.

const DEFAULT_WEBHOOK = "https://ghoppapap.app.n8n.cloud/webhook/master-agent";

const state = {
  webhook: localStorage.getItem("master.webhook") || DEFAULT_WEBHOOK,
  voice: localStorage.getItem("master.voice") || "on",
  lang: localStorage.getItem("master.lang") || "hi-IN",
  sessionId: localStorage.getItem("master.sessionId") || crypto.randomUUID(),
};
localStorage.setItem("master.sessionId", state.sessionId);

const stream = document.getElementById("stream");
const form = document.getElementById("inputForm");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const statusDot = document.getElementById("statusDot");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const webhookInput = document.getElementById("webhookInput");
const voiceToggle = document.getElementById("voiceToggle");
const langToggle = document.getElementById("langToggle");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const resetChatBtn = document.getElementById("resetChatBtn");

// ---------- rendering ----------

function addMessage(text, who, opts = {}) {
  const el = document.createElement("div");
  el.className = `msg ${who}${opts.cls ? " " + opts.cls : ""}`;
  el.textContent = text;

  const ytMatch = text.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\S*/);
  if (ytMatch) {
    el.textContent = text.replace(ytMatch[0], "").trim();
    const link = document.createElement("a");
    link.href = ytMatch[0];
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "playlink";
    link.textContent = "▶ Play";
    el.appendChild(document.createElement("br"));
    el.appendChild(link);
  }

  stream.appendChild(el);
  stream.scrollTop = stream.scrollHeight;
  return el;
}

function setStatus(mode) {
  statusDot.className = "dot" + (mode === "busy" ? " busy" : mode === "err" ? " err" : "");
}

// ---------- sending ----------

async function sendMessage(text) {
  if (!text.trim()) return;
  addMessage(text, "user");
  textInput.value = "";
  sendBtn.disabled = true;
  setStatus("busy");
  const thinkingEl = addMessage("MASTER soch raha hai…", "bot", { cls: "thinking" });

  try {
    const res = await fetch(state.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId: state.sessionId }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const reply = data.reply || data.output || data.message || JSON.stringify(data);
    thinkingEl.remove();
    addMessage(reply, "bot");
    if (state.voice === "on") speak(reply);
    setStatus("ok");
  } catch (err) {
    thinkingEl.remove();
    addMessage("Connect nahi ho paya (" + err.message + "). Settings ⚙ mein webhook URL check karo.", "bot", { cls: "error" });
    setStatus("err");
  } finally {
    sendBtn.disabled = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(textInput.value);
});

// ---------- voice input ----------

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let recording = false;

if (SpeechRecognition) {
  recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = false;

  recognizer.onresult = (e) => {
    const said = e.results[0][0].transcript;
    sendMessage(said);
  };
  recognizer.onend = () => {
    recording = false;
    micBtn.classList.remove("recording");
  };
  recognizer.onerror = () => {
    recording = false;
    micBtn.classList.remove("recording");
  };

  micBtn.addEventListener("click", () => {
    if (recording) {
      recognizer.stop();
      return;
    }
    recognizer.lang = state.lang;
    recognizer.start();
    recording = true;
    micBtn.classList.add("recording");
  });
} else {
  micBtn.style.display = "none";
}

// ---------- voice output ----------

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const clean = text.replace(/https?:\/\/\S+/g, "").trim();
  if (!clean) return;
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = state.lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ---------- settings ----------

function openSettings() {
  webhookInput.value = state.webhook;
  voiceToggle.value = state.voice;
  langToggle.value = state.lang;
  settingsModal.classList.add("open");
}
function closeSettings() {
  settingsModal.classList.remove("open");
}

settingsBtn.addEventListener("click", openSettings);
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

saveSettingsBtn.addEventListener("click", () => {
  state.webhook = webhookInput.value.trim() || DEFAULT_WEBHOOK;
  state.voice = voiceToggle.value;
  state.lang = langToggle.value;
  localStorage.setItem("master.webhook", state.webhook);
  localStorage.setItem("master.voice", state.voice);
  localStorage.setItem("master.lang", state.lang);
  closeSettings();
});

resetChatBtn.addEventListener("click", () => {
  stream.querySelectorAll(".msg").forEach((m) => m.remove());
  state.sessionId = crypto.randomUUID();
  localStorage.setItem("master.sessionId", state.sessionId);
  closeSettings();
});
