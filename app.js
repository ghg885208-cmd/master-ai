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

  /* =====================================
     STATE
  ===================================== */

  const state = {
    chats: loadJSON(CHATS_KEY, []),
    projects: loadJSON(PROJECTS_KEY, []),
    activeChatId: null,
    attachments: [],   // { name, size, type, textContent|null }
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
    providerSelect: el("providerSelect"),
    apiUrlInput: el("apiUrlInput"),
    modelInput: el("modelInput"),
    apiKeyInput: el("apiKeyInput"),
    saveProviderButton: el("saveProviderButton"),
    settingsStatus: el("settingsStatus"),
    clearMemoryButton: el("clearMemoryButton"),

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

    chat.messages.forEach(msg => dom.chat.appendChild(buildMessageBubble(msg.role, msg.content)));
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

  function buildMessageBubble(role, content) {
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

    chat.messages.push({ role: "user", content: text || "(attachment only)" });
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

      const replyText = await callAI(messages);

      loadingBubble.remove();
      chat.messages.push({ role: "assistant", content: replyText });
      saveChats();
      renderActiveChat();

      window.MASTER_AI_ENGINE?.rememberAssistantResponse(replyText);
      maybeUpdatePreview(replyText);

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
     AI CALL
     [WORKING NOW] direct browser -> provider call using the key from
     Settings (localStorage only). [NEEDS BACKEND] before any public/
     production deployment — see api-config.js security note.
  ===================================== */

  async function callAI(messages) {
    const cfg = MASTER_API_CONFIG.load();

    if (!cfg.apiKey) {
      throw new Error("No API key set. Open Settings and paste your API key first.");
    }
    if (!cfg.url) {
      throw new Error("No API URL configured. Check Settings.");
    }

    const response = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${errBody.slice(0, 200) || response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) throw new Error("Provider returned no content — check the model name in Settings.");
    return content;
  }

  /* =====================================
     ATTACHMENTS
     [WORKING NOW] for plain-text-like files (txt, md, js, css, html,
     json, csv) — their content is read and included.
     [NEEDS EXTERNAL API] for real PDF/image/document analysis — that
     is NOT implemented here, filenames are just noted so the model
     knows a file exists but its contents are not deeply parsed.
  ===================================== */

  const TEXT_LIKE_EXT = ["txt", "md", "js", "css", "html", "json", "csv", "py", "ts", "jsx", "tsx"];
  const MAX_FILES = 6;
  const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB per file, avoids freezing the UI

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

  function renderAttachmentChips() {
    if (!dom.attachmentName) return;
    dom.attachmentName.innerHTML = "";

    state.attachments.forEach((att, idx) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = att.name + (att.error ? ` (${att.error})` : "");

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
      if (att.textContent) return `[Attached file: ${att.name}]\n${att.textContent}`;
      return `[Attached file: ${att.name} — binary/unsupported type, content not analyzed]`;
    }).join("\n\n");
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
      const cfg = {
        provider: dom.providerSelect.value,
        url: dom.apiUrlInput.value.trim(),
        model: dom.modelInput.value.trim(),
        apiKey: dom.apiKeyInput.value.trim() || MASTER_API_CONFIG.load().apiKey
      };

      const ok = MASTER_API_CONFIG.save(cfg);
      dom.settingsStatus.textContent = ok ? "Saved. This key is stored only in this browser." : "Could not save — storage may be full or blocked.";
      dom.settingsStatus.className = "settings-status " + (ok ? "success" : "error");
      dom.apiKeyInput.value = "";
    });

    dom.clearMemoryButton?.addEventListener("click", () => {
      const ok = window.MASTER_AI_ENGINE?.clearMemory();
      dom.settingsStatus.textContent = ok ? "Memory cleared." : "Nothing to clear.";
      dom.settingsStatus.className = "settings-status success";
    });
  }

  function openSettings() {
    const cfg = MASTER_API_CONFIG.load();
    dom.providerSelect.value = cfg.provider || "deepseek";
    dom.apiUrlInput.value = cfg.url || "";
    dom.modelInput.value = cfg.model || "";
    dom.apiKeyInput.value = "";
    dom.settingsStatus.textContent = cfg.apiKey ? "API key is set." : "No API key set yet.";
    dom.settingsStatus.className = "settings-status";

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
     MISC HELPERS
  ===================================== */

  function setStatus(text) {
    if (dom.connectionStatus) dom.connectionStatus.textContent = text;
  }

  function cryptoId() {
    return (crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  }

})();
