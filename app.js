/* =========================================
   MASTER AI — APP.JS
   UI wiring + chat flow + settings + projects + attachments
========================================= */

"use strict";

(() => {

  /* =====================================
     STORAGE KEYS
  ===================================== */

  const CHATS_KEY = "master_ai_chats";
  const PROJECTS_KEY = "master_ai_projects";
  const TOOLS_KEY = "master_ai_tools";
  const INTEGRATIONS_KEY = "master_ai_integrations";

  /* =====================================
     STATE
  ===================================== */

  const state = {
    chats: loadJSON(CHATS_KEY, []),
    projects: loadJSON(PROJECTS_KEY, []),
    tools: loadJSON(TOOLS_KEY, []),
    activeChatId: null,
    attachments: [],   // { name, size, type, textContent|imageDataUrl|videoFrames|null }
    voiceModeActive: false
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveChats() { localStorage.setItem(CHATS_KEY, JSON.stringify(state.chats)); }
  function saveProjects() { localStorage.setItem(PROJECTS_KEY, JSON.stringify(state.projects)); }
  function saveTools() { localStorage.setItem(TOOLS_KEY, JSON.stringify(state.tools)); }

  /* =====================================
     DOM REFS
  ===================================== */

  const el = id => document.getElementById(id);

  const dom = {
    sidebar: el("sidebar"),
    sidebarOverlay: el("sidebarOverlay"),
    menuButton: el("menuButton"),
    newChatButton: el("newChatButton"),
    historyList: el("historyList"),
    projectList: el("projectList"),
    createProjectButton: el("createProjectButton"),
    settingsButton: el("settingsButton"),

    chat: el("chat"),
    welcomeScreen: el("welcomeScreen"),

    canvasPanel: el("canvasPanel"),
    preview: el("preview"),
    previewClear: el("previewClear"),

    messageInput: el("messageInput"),
    sendButton: el("sendButton"),
    attachButton: el("attachButton"),
    fileInput: el("fileInput"),
    attachmentName: el("attachmentName"),
    micButton: el("micButton"),

    connectionStatus: el("connectionStatus"),

    // settings modal
    settingsModal: el("settingsModal"),
    closeSettingsButton: el("closeSettingsButton"),
    providerList: el("providerList"),
    providerSelect: el("providerSelect"),
    apiUrlInput: el("apiUrlInput"),
    modelInput: el("modelInput"),
    apiKeyInput: el("apiKeyInput"),
    saveProviderButton: el("saveProviderButton"),
    settingsStatus: el("settingsStatus"),
    clearMemoryButton: el("clearMemoryButton"),
    toolsList: el("toolsList"),
    telegramTokenInput: el("telegramTokenInput"),
    telegramChatIdInput: el("telegramChatIdInput"),
    telegramEnabledCheckbox: el("telegramEnabledCheckbox"),
    saveIntegrationsButton: el("saveIntegrationsButton"),

    // project modal
    projectModal: el("projectModal"),
    projectNameInput: el("projectNameInput"),
    cancelProjectButton: el("cancelProjectButton"),
    saveProjectButton: el("saveProjectButton"),

    // live voice modal (elements themselves are bound inside mastermind.js,
    // app.js only needs the final-transcript + speak hookup)
    liveModal: el("liveModal")
  };

  /* =====================================
     INIT
  ===================================== */

  document.addEventListener("DOMContentLoaded", () => {
    if (!state.chats.length) {
      createNewChat();
    } else {
      state.activeChatId = state.chats[state.chats.length - 1].id;
    }

    renderHistory();
    renderProjects();
    renderActiveChat();

    wireSidebar();
    wireChatInput();
    wireAttachments();
    wireSettings();
    wireProjects();
    wirePreview();

    // MASTER_AI_ENGINE builds the live modal's own listening/speaking UI;
    // app.js just needs to react when a voice utterance is finalized.
    if (window.MASTER_AI_ENGINE) {
      MASTER_AI_ENGINE.initLiveVoice();
      wireLiveVoicePipeline();
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }

    setStatus("Ready");
  });

  /* =====================================
     SIDEBAR
  ===================================== */

  function wireSidebar() {
    dom.menuButton?.addEventListener("click", () => toggleSidebar(true));
    dom.sidebarOverlay?.addEventListener("click", () => toggleSidebar(false));

    dom.newChatButton?.addEventListener("click", () => {
      createNewChat();
      renderHistory();
      renderActiveChat();
      toggleSidebar(false);
    });

    dom.settingsButton?.addEventListener("click", openSettings);
  }

  function toggleSidebar(open) {
    dom.sidebar?.classList.toggle("open", open);
    dom.sidebarOverlay?.classList.toggle("show", open);
  }

  function renderHistory() {
    if (!dom.historyList) return;
    dom.historyList.innerHTML = "";

    [...state.chats].reverse().forEach(chat => {
      const btn = document.createElement("button");
      btn.className = "history-item" + (chat.id === state.activeChatId ? " active" : "");
      btn.type = "button";
      btn.textContent = chat.title || "New chat";
      btn.addEventListener("click", () => {
        state.activeChatId = chat.id;
        renderHistory();
        renderActiveChat();
        toggleSidebar(false);
      });
      dom.historyList.appendChild(btn);
    });
  }

  /* =====================================
     PROJECTS
  ===================================== */

  function wireProjects() {
    dom.createProjectButton?.addEventListener("click", () => {
      dom.projectNameInput.value = "";
      dom.projectModal.classList.add("show");
      dom.projectModal.setAttribute("aria-hidden", "false");
    });

    dom.cancelProjectButton?.addEventListener("click", closeProjectModal);

    dom.saveProjectButton?.addEventListener("click", () => {
      const name = dom.projectNameInput.value.trim();
      if (!name) return;

      state.projects.push({ id: cryptoId(), name, createdAt: Date.now() });
      saveProjects();
      renderProjects();
      closeProjectModal();
    });
  }

  function closeProjectModal() {
    dom.projectModal.classList.remove("show");
    dom.projectModal.setAttribute("aria-hidden", "true");
  }

  function renderProjects() {
    if (!dom.projectList) return;
    dom.projectList.innerHTML = "";

    state.projects.forEach(project => {
      const btn = document.createElement("button");
      btn.className = "project-item";
      btn.type = "button";
      btn.textContent = project.name;
      dom.projectList.appendChild(btn);
    });
  }

  /* =====================================
     CHAT — CREATE / RENDER
  ===================================== */

  function createNewChat() {
    const chat = { id: cryptoId(), title: "New chat", messages: [], createdAt: Date.now() };
    state.chats.push(chat);
    state.activeChatId = chat.id;
    saveChats();
  }

  function getActiveChat() {
    return state.chats.find(c => c.id === state.activeChatId);
  }

  function renderActiveChat() {
    const chat = getActiveChat();
    if (!chat || !dom.chat) return;

    dom.chat.innerHTML = "";

    if (!chat.messages.length) {
      dom.chat.appendChild(buildWelcomeScreen());
      return;
    }

    chat.messages.forEach(msg => dom.chat.appendChild(buildMessageBubble(msg.role, msg.content, msg.attachments)));
    scrollChatToBottom();
  }

  function buildWelcomeScreen() {
    const wrap = document.createElement("div");
    wrap.className = "welcome";
    wrap.innerHTML = `
      <div class="master-orb"><div class="orb-ring"></div><div class="orb-ring ring-two"></div><div class="orb-core">M</div></div>
      <h1>MASTER AI</h1>
      <p>Type a message, attach a file, or tap the mic for MASTER Live.</p>
      <div class="capability-grid">
        <div class="capability-card"><span>🧠</span>Mastermind decisions — weighs options, risks, and consequences</div>
        <div class="capability-card"><span>💻</span>Coding help — debugging, explanations, snippets</div>
        <div class="capability-card"><span>🗂️</span>Projects — group chats and files together</div>
        <div class="capability-card"><span>🎙️</span>Live voice — talk and hear MASTER reply</div>
      </div>
    `;
    return wrap;
  }

  function buildMessageBubble(role, content, attachments) {
    const div = document.createElement("div");
    div.className = "message " + (role === "user" ? "user" : "master");

    if (role !== "user") {
      const label = document.createElement("strong");
      label.textContent = "MASTER AI";
      div.appendChild(label);
    }

    const body = document.createElement("span");
    body.textContent = content;
    div.appendChild(body);

    if (Array.isArray(attachments) && attachments.length) {
      const note = document.createElement("span");
      note.className = "file-note";
      note.textContent = "📎 " + attachments.join(", ");
      div.appendChild(note);
    }

    if (role !== "user") {
      const codeMatch = content.match(/```([\w-]*)\n([\s\S]*?)```/);
      if (codeMatch) {
        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "save-tool-btn";
        saveBtn.textContent = "🔧 Save as Tool";
        saveBtn.addEventListener("click", () => {
          const name = window.prompt("Tool ka naam?", "My Tool");
          if (!name) return;
          state.tools.push({
            id: cryptoId(),
            name,
            language: codeMatch[1] || "text",
            code: codeMatch[2],
            createdAt: Date.now()
          });
          saveTools();
          renderToolsList();
          saveBtn.textContent = "✅ Saved (dekho Settings > My AI Tools)";
          saveBtn.disabled = true;
        });
        div.appendChild(saveBtn);
      }
    }

    return div;
  }

  function buildLoadingBubble() {
    const div = document.createElement("div");
    div.className = "message master loading";
    div.innerHTML = `<strong>MASTER AI</strong><span class="dots"><span></span><span></span><span></span></span>`;
    return div;
  }

  function scrollChatToBottom() {
    if (dom.chat) dom.chat.scrollTop = dom.chat.scrollHeight;
  }

  /* =====================================
     CHAT INPUT / SEND FLOW
  ===================================== */

  function wireChatInput() {
    dom.sendButton?.addEventListener("click", () => handleSend());

    dom.messageInput?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  async function handleSend(voiceText) {
    const text = (voiceText ?? dom.messageInput.value).trim();
    if (!text && !state.attachments.length) return;

    const chat = getActiveChat();
    if (!chat) return;

    const attachmentSummary = buildAttachmentSummary();
    const fullUserText = attachmentSummary ? `${text}\n\n${attachmentSummary}` : text;
    const attachedNames = state.attachments.map(a => a.name);
    const imageParts = collectImageParts();

    chat.messages.push({ role: "user", content: text || "(attachment only)", attachments: attachedNames });
    if (chat.messages.length === 1) chat.title = text.slice(0, 40) || "Attachment";

    renderActiveChat();
    if (!voiceText) dom.messageInput.value = "";
    clearAttachments();
    saveChats();
    renderHistory();

    const loadingBubble = buildLoadingBubble();
    dom.chat.appendChild(loadingBubble);
    scrollChatToBottom();
    setStatus("Thinking...");

    try {
      const historyForApi = chat.messages.slice(0, -1); // everything before this new user turn
      const messages = window.MASTER_AI_ENGINE
        ? MASTER_AI_ENGINE.buildMessages(historyForApi, fullUserText)
        : [{ role: "user", content: fullUserText }];

      // [WORKING NOW, provider-dependent] If photos/video frames were attached,
      // send them as real vision content alongside the text. Works only if the
      // ENABLED provider's model actually supports images (Gemini/GPT-4o class
      // models do; some text-only models like base DeepSeek-chat may ignore
      // or error on this — that is a provider limitation, not faked here.
      if (imageParts.length) {
        const last = messages[messages.length - 1];
        last.content = [
          { type: "text", text: last.content },
          ...imageParts.map(url => ({ type: "image_url", image_url: { url } }))
        ];
      }

      const replyText = await callAI(messages);

      loadingBubble.remove();
      chat.messages.push({ role: "assistant", content: replyText });
      saveChats();
      renderActiveChat();

      window.MASTER_AI_ENGINE?.rememberAssistantResponse(replyText);
      maybeUpdatePreview(replyText);
      maybeSendToTelegram(replyText);

      if (state.voiceModeActive) {
        MASTER_AI_ENGINE.voice.speak(replyText, { lang: "hi-IN" });
      }

      setStatus("Ready");
    } catch (err) {
      loadingBubble.remove();
      const message = err && err.message ? err.message : "Something went wrong.";
      chat.messages.push({ role: "assistant", content: `⚠️ ${message}` });
      saveChats();
      renderActiveChat();
      setStatus("Error");
    }
  }

  /* =====================================
     AI CALL — MULTI PROVIDER + REAL SYNTHESIS
     [WORKING NOW]
     1. Every provider added in Settings is queried in parallel.
     2. If only one answered, its answer is returned directly.
     3. If 2+ answered, their answers are sent to one more real API
        call (a "synthesis" pass) that is explicitly told to compare
        them, resolve disagreements, drop anything unsupported, and
        return ONE final accurate answer. This is an actual extra
        API call — not a fake merge — so it does cost one more
        request each time multiple providers respond.
     If the synthesis call itself fails, we fall back to showing the
     raw labeled answers so nothing silently disappears.
  ===================================== */

  async function callAI(messages) {
    const profiles = MASTER_API_CONFIG.getEnabledProfiles();

    if (!profiles.length) {
      throw new Error("No provider with a key added. Open Settings and add one.");
    }

    const results = await Promise.allSettled(profiles.map(p => callSingleProvider(p, messages)));

    const successes = [];
    const failures = [];

    results.forEach((res, i) => {
      const label = profiles[i].label || profiles[i].provider;
      if (res.status === "fulfilled") successes.push({ label, text: res.value });
      else failures.push({ label, error: res.reason?.message || "failed" });
    });

    if (!successes.length) {
      throw new Error(failures.map(f => `${f.label}: ${f.error}`).join(" | "));
    }

    if (successes.length === 1) {
      let text = successes[0].text;
      if (failures.length) text += "\n\n" + failures.map(f => `⚠️ ${f.label} failed: ${f.error}`).join("\n");
      return text;
    }

    // 2+ answers — actually cross-check and synthesize one final answer.
    const lastContent = messages[messages.length - 1]?.content;
    const questionText = typeof lastContent === "string"
      ? lastContent
      : (Array.isArray(lastContent) ? (lastContent.find(p => p.type === "text")?.text || "") : "");
    const synthesizer = profiles.find(p => (p.label || p.provider) === successes[0].label) || profiles[0];

    try {
      const finalAnswer = await callSingleProvider(synthesizer, buildSynthesisMessages(questionText, successes));
      let note = failures.length ? "\n\n" + failures.map(f => `⚠️ ${f.label} failed: ${f.error}`).join("\n") : "";
      return finalAnswer + note;
    } catch (err) {
      // Synthesis call failed — be honest, fall back to raw labeled answers.
      let fallback = successes.map(s => `【${s.label}】\n${s.text}`).join("\n\n---\n\n");
      fallback += `\n\n⚠️ Could not cross-check/combine these (${err.message}) — showing each provider's raw answer instead.`;
      return fallback;
    }
  }

  function buildSynthesisMessages(question, successes) {
    const answersBlock = successes.map((s, i) => `Answer ${i + 1} (from ${s.label}):\n${s.text}`).join("\n\n");

    return [
      {
        role: "system",
        content: "You are a careful fact-checking editor. You will be given a question and several AI-generated answers to it from different models. Compare them, verify consistency, resolve contradictions, discard anything incorrect or unsupported, and produce ONE final, accurate, well-organized answer. Do not mention 'Answer 1 / Answer 2' or the model names in your final reply — just answer the question directly, correctly, and clearly. Reply in the same language as the question."
      },
      {
        role: "user",
        content: `Original question:\n${question}\n\n${answersBlock}\n\nNow give me the one final, accurate, cross-checked answer.`
      }
    ];
  }

  async function callSingleProvider(profile, messages) {
    const response = await fetch(profile.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${profile.apiKey}`
      },
      body: JSON.stringify({
        model: profile.model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`${response.status}: ${errBody.slice(0, 150) || response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty response — check model name");
    return content;
  }

  /* =====================================
     ATTACHMENTS
     [WORKING NOW] text-like files (txt, md, js, css, html, json, csv) — full
     content read and included.
     [WORKING NOW, provider-dependent] images — sent as real vision content to
     the AI (base64), so photos are genuinely analyzed IF the enabled model
     supports images (Gemini / GPT-4o class models do).
     [WORKING NOW, best-effort] video — NOT full video understanding. A small
     number of frames (default 4) are sampled evenly across the clip and sent
     as images, so the AI can describe what happens at those moments. This is
     frame sampling, not continuous frame-by-frame playback analysis — being
     upfront about that limit rather than overclaiming.
     [NEEDS EXTERNAL API] real PDF text/table extraction — not implemented,
     filename is passed along but content isn't parsed.
  ===================================== */

  const TEXT_LIKE_EXT = ["txt", "md", "js", "css", "html", "json", "csv", "py", "ts", "jsx", "tsx"];
  const MAX_FILES = 6;
  const MAX_FILE_BYTES = 2 * 1024 * 1024;      // 2MB for text-like files
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;     // 5MB per image
  const MAX_VIDEO_BYTES = 20 * 1024 * 1024;    // 20MB per video, avoids freezing the UI
  const VIDEO_FRAME_COUNT = 4;

  function wireAttachments() {
    dom.attachButton?.addEventListener("click", () => dom.fileInput.click());

    dom.fileInput?.addEventListener("change", async () => {
      const files = Array.from(dom.fileInput.files || []);
      dom.fileInput.value = "";

      for (const file of files) {
        if (state.attachments.length >= MAX_FILES) {
          setStatus(`Max ${MAX_FILES} attachments`);
          break;
        }

        if (file.type.startsWith("image/")) {
          if (file.size > MAX_IMAGE_BYTES) {
            state.attachments.push({ name: file.name, size: file.size, type: file.type, error: "image too large (5MB limit)" });
          } else {
            try {
              const imageDataUrl = await readFileAsDataURL(file);
              state.attachments.push({ name: file.name, size: file.size, type: file.type, imageDataUrl });
            } catch {
              state.attachments.push({ name: file.name, size: file.size, type: file.type, error: "could not read image" });
            }
          }
          continue;
        }

        if (file.type.startsWith("video/")) {
          if (file.size > MAX_VIDEO_BYTES) {
            state.attachments.push({ name: file.name, size: file.size, type: file.type, error: "video too large (20MB limit)" });
          } else {
            setStatus("Sampling video frames...");
            try {
              const videoFrames = await extractVideoFrames(file, VIDEO_FRAME_COUNT);
              state.attachments.push({ name: file.name, size: file.size, type: file.type, videoFrames });
            } catch {
              state.attachments.push({ name: file.name, size: file.size, type: file.type, error: "could not sample frames" });
            }
            setStatus("Ready");
          }
          continue;
        }

        if (file.size > MAX_FILE_BYTES) {
          state.attachments.push({ name: file.name, size: file.size, type: file.type, textContent: null, error: "too large (2MB limit)" });
          continue;
        }

        const ext = (file.name.split(".").pop() || "").toLowerCase();
        let textContent = null;

        if (TEXT_LIKE_EXT.includes(ext)) {
          try {
            textContent = await readFileAsText(file);
            if (textContent.length > 8000) textContent = textContent.slice(0, 8000) + "\n...(truncated)";
          } catch {
            textContent = null;
          }
        }

        state.attachments.push({ name: file.name, size: file.size, type: file.type, textContent });
      }

      renderAttachmentChips();
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function waitForSeek(video, time) {
    return new Promise(resolve => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = time;
    });
  }

  async function extractVideoFrames(file, frameCount) {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error("video metadata failed"));
    });

    const scale = Math.min(1, 640 / (video.videoWidth || 640));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((video.videoWidth || 640) * scale));
    canvas.height = Math.max(1, Math.round((video.videoHeight || 360) * scale));
    const ctx = canvas.getContext("2d");

    const duration = video.duration && isFinite(video.duration) ? video.duration : 1;
    const frames = [];

    for (let i = 0; i < frameCount; i++) {
      const t = Math.min(duration - 0.05, (duration * (i + 0.5)) / frameCount);
      await waitForSeek(video, Math.max(0, t));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.6));
    }

    URL.revokeObjectURL(video.src);
    return frames;
  }

  function renderAttachmentChips() {
    if (!dom.attachmentName) return;
    dom.attachmentName.innerHTML = "";

    state.attachments.forEach((att, idx) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      let label = att.name;
      if (att.error) label += ` (${att.error})`;
      else if (att.imageDataUrl) label = "🖼 " + label;
      else if (att.videoFrames) label = `🎞 ${label} (${att.videoFrames.length} frames)`;
      chip.textContent = label;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        state.attachments.splice(idx, 1);
        renderAttachmentChips();
      });

      chip.appendChild(removeBtn);
      dom.attachmentName.appendChild(chip);
    });
  }

  function buildAttachmentSummary() {
    if (!state.attachments.length) return "";

    return state.attachments.map(att => {
      if (att.error) return `[Attached file: ${att.name} — could not be read: ${att.error}]`;
      if (att.imageDataUrl) return `[Attached image: ${att.name} — sent for real visual analysis]`;
      if (att.videoFrames) return `[Attached video: ${att.name} — ${att.videoFrames.length} sampled frames sent for visual analysis]`;
      if (att.textContent) return `[Attached file: ${att.name}]\n${att.textContent}`;
      return `[Attached file: ${att.name} — binary/unsupported type, content not analyzed]`;
    }).join("\n\n");
  }

  function collectImageParts() {
    const parts = [];
    state.attachments.forEach(att => {
      if (att.imageDataUrl) parts.push(att.imageDataUrl);
      if (Array.isArray(att.videoFrames)) parts.push(...att.videoFrames);
    });
    return parts;
  }

  function clearAttachments() {
    state.attachments = [];
    renderAttachmentChips();
  }

  /* =====================================
     PREVIEW / CANVAS PANEL
  ===================================== */

  function wirePreview() {
    dom.previewClear?.addEventListener("click", () => {
      dom.preview.textContent = "Preview output will appear here.";
      dom.canvasPanel.classList.remove("show");
    });
  }

  function maybeUpdatePreview(replyText) {
    const codeMatch = replyText.match(/```[\w-]*\n([\s\S]*?)```/);
    if (!codeMatch) return;

    dom.preview.textContent = codeMatch[1];
    dom.canvasPanel.classList.add("show");
  }

  /* =====================================
     SETTINGS MODAL
  ===================================== */

  function wireSettings() {
    dom.closeSettingsButton?.addEventListener("click", closeSettings);

    dom.providerSelect?.addEventListener("change", () => {
      const meta = MASTER_API_CONFIG.providers[dom.providerSelect.value];
      if (!meta) return;
      dom.apiUrlInput.value = meta.url;
      dom.modelInput.value = meta.defaultModel;
    });

    dom.saveProviderButton?.addEventListener("click", () => {
      const provider = dom.providerSelect.value;
      const url = dom.apiUrlInput.value.trim();
      const model = dom.modelInput.value.trim();
      const apiKey = dom.apiKeyInput.value.trim();

      if (!url || !apiKey) {
        dom.settingsStatus.textContent = "URL aur API key dono chahiye.";
        dom.settingsStatus.className = "settings-status error";
        return;
      }

      MASTER_API_CONFIG.addProfile({
        provider,
        label: MASTER_API_CONFIG.providers[provider]?.label || provider,
        url,
        model,
        apiKey
      });

      dom.apiKeyInput.value = "";
      dom.settingsStatus.textContent = "Provider added and enabled.";
      dom.settingsStatus.className = "settings-status success";
      renderProviderList();
    });

    dom.clearMemoryButton?.addEventListener("click", () => {
      const ok = window.MASTER_AI_ENGINE?.clearMemory();
      dom.settingsStatus.textContent = ok ? "Memory cleared." : "Nothing to clear.";
      dom.settingsStatus.className = "settings-status success";
    });

    dom.saveIntegrationsButton?.addEventListener("click", () => {
      const integrations = {
        telegramToken: dom.telegramTokenInput.value.trim(),
        telegramChatId: dom.telegramChatIdInput.value.trim(),
        telegramEnabled: dom.telegramEnabledCheckbox.checked
      };
      localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(integrations));
      dom.settingsStatus.textContent = "Integrations saved.";
      dom.settingsStatus.className = "settings-status success";
    });
  }

  function renderToolsList() {
    if (!dom.toolsList) return;
    dom.toolsList.innerHTML = "";

    if (!state.tools.length) {
      dom.toolsList.innerHTML = '<div class="settings-note">Abhi koi tool save nahi hua. Chat mein jab MASTER AI code de, uske niche "🔧 Save as Tool" dabana — yahan aa jayega.</div>';
      return;
    }

    state.tools.forEach(tool => {
      const row = document.createElement("div");
      row.className = "provider-item";

      const info = document.createElement("div");
      info.className = "provider-info";
      info.innerHTML = `<div class="provider-name">${escapeHtml(tool.name)}</div><div class="provider-meta">${escapeHtml(tool.language)} · saved code, not auto-run</div>`;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "provider-remove";
      copyBtn.textContent = "📋";
      copyBtn.title = "Copy code";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard?.writeText(tool.code).catch(() => {});
        copyBtn.textContent = "✅";
        setTimeout(() => { copyBtn.textContent = "📋"; }, 1500);
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "provider-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        state.tools = state.tools.filter(t => t.id !== tool.id);
        saveTools();
        renderToolsList();
      });

      row.appendChild(info);
      row.appendChild(copyBtn);
      row.appendChild(removeBtn);
      dom.toolsList.appendChild(row);
    });
  }

  function renderProviderList() {
    if (!dom.providerList) return;
    dom.providerList.innerHTML = "";

    const profiles = MASTER_API_CONFIG.loadProfiles();

    profiles.forEach(profile => {
      const row = document.createElement("div");
      row.className = "provider-item";

      const dot = document.createElement("span");
      dot.className = "provider-active-dot";
      dot.title = "Active";

      const info = document.createElement("div");
      info.className = "provider-info";
      info.innerHTML = `<div class="provider-name">${escapeHtml(profile.label || profile.provider)}</div><div class="provider-meta">${escapeHtml(profile.model || "")}</div>`;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "provider-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        MASTER_API_CONFIG.removeProfile(profile.id);
        renderProviderList();
      });

      row.appendChild(dot);
      row.appendChild(info);
      row.appendChild(removeBtn);
      dom.providerList.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function openSettings() {
    dom.providerSelect.value = "deepseek";
    const meta = MASTER_API_CONFIG.providers.deepseek;
    dom.apiUrlInput.value = meta.url;
    dom.modelInput.value = meta.defaultModel;
    dom.apiKeyInput.value = "";

    const enabledCount = MASTER_API_CONFIG.getEnabledProfiles().length;
    dom.settingsStatus.textContent = enabledCount
      ? `${enabledCount} provider(s) active — running together automatically.`
      : "No provider added yet.";
    dom.settingsStatus.className = "settings-status";

    renderProviderList();
    renderToolsList();

    const integrations = loadJSON(INTEGRATIONS_KEY, {});
    dom.telegramTokenInput.value = integrations.telegramToken || "";
    dom.telegramChatIdInput.value = integrations.telegramChatId || "";
    dom.telegramEnabledCheckbox.checked = !!integrations.telegramEnabled;

    dom.settingsModal.classList.add("show");
    dom.settingsModal.setAttribute("aria-hidden", "false");
    toggleSidebar(false);
  }

  function closeSettings() {
    dom.settingsModal.classList.remove("show");
    dom.settingsModal.setAttribute("aria-hidden", "true");
  }

  /* =====================================
     LIVE VOICE -> CHAT PIPELINE
     mastermind.js handles the modal's visual states (listening/
     speaking/orb). app.js only needs to know when the user finished
     talking, so the transcript actually reaches the AI.
  ===================================== */

  function wireLiveVoicePipeline() {
    document.addEventListener("masterVoiceStart", () => { state.voiceModeActive = true; });

    document.addEventListener("masterVoiceFinal", e => {
      const text = e.detail?.text;
      if (text) handleSend(text);
    });

    dom.liveModal?.addEventListener("transitionend", () => {}); // no-op, placeholder for future animation hooks
  }

  /* =====================================
     TELEGRAM INTEGRATION
     [WORKING NOW] Sends every AI reply to your Telegram chat, directly from
     the browser, using the Telegram Bot API. Only sends — this app cannot
     listen for messages you send back in Telegram while the tab is closed,
     since that needs a server running all the time. Set up token/chat id
     in Settings > Integrations.
  ===================================== */

  async function maybeSendToTelegram(text) {
    const integrations = loadJSON(INTEGRATIONS_KEY, {});
    if (!integrations.telegramEnabled || !integrations.telegramToken || !integrations.telegramChatId) return;

    try {
      await fetch(`https://api.telegram.org/bot${integrations.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: integrations.telegramChatId, text: text.slice(0, 4000) })
      });
    } catch (e) {
      console.warn("Telegram send failed:", e);
    }
  }

  /* =====================================
     MISC HELPERS
  ===================================== */

  function setStatus(text) {
    if (dom.connectionStatus) dom.connectionStatus.textContent = text;
  }

  function cryptoId() {
    return (crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  }

})();
