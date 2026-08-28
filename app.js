/* =========================================
   MASTER AI — COMPLETE APP
========================================= */

"use strict";

/* =========================================
   CONFIG
========================================= */

const DEFAULT_CONFIG = {
  activeProvider: "deepseek",

  providers: {
    deepseek: {
      name: "DeepSeek",
      enabled: true,
      apiUrl: "https://api.deepseek.com/chat/completions",
      model: "deepseek-v4-flash",
      apiKey: ""
    },

    openai: {
      name: "OpenAI",
      enabled: false,
      apiUrl: "",
      model: "",
      apiKey: ""
    },

    gemini: {
      name: "Google Gemini",
      enabled: false,
      apiUrl: "",
      model: "",
      apiKey: ""
    },

    custom: {
      name: "Custom API",
      enabled: false,
      apiUrl: "",
      model: "",
      apiKey: ""
    }
  }
};

const STORAGE_KEYS = {
  config: "master_ai_config",
  chats: "master_ai_chats",
  currentChat: "master_ai_current_chat"
};


/* =========================================
   SYSTEM INSTRUCTIONS
========================================= */

const MASTER_SYSTEM_PROMPT = `
You are MASTER AI.

Your job is to help the user accurately and clearly.

CORE BEHAVIOR:
- Understand the user's real goal before answering.
- Analyse the problem carefully.
- Consider alternatives when useful.
- Point out weak assumptions and risks.
- Give a direct, clear final answer.
- Do not pretend to have capabilities you do not actually have.
- If information is uncertain, say so.

MASTERMIND ANALYSIS:
When the user is making a decision:
1. Understand the goal.
2. Analyse Option A.
3. Analyse Option B and other alternatives.
4. Consider possible consequences.
5. Consider short-term and long-term effects.
6. Identify risks and missing information.
7. Recommend the strongest option with reasons.

ALL MODES WORK TOGETHER:
- conversation
- problem solving
- planning
- analysis
- creative thinking
- coding support
- attachment analysis
- future planning
- mastermind reasoning

Respond naturally. Do not unnecessarily mention internal modes.

The user may communicate in Hindi, Hinglish or English.
Match the user's language when possible.
`;


/* =========================================
   STATE
========================================= */

let config = loadConfig();

let chats = loadChats();

let currentChatId =
  localStorage.getItem(STORAGE_KEYS.currentChat) ||
  null;

let selectedFiles = [];

let isSending = false;

let recognition = null;

let isListening = false;

let liveActive = false;


/* =========================================
   DOM HELPER
========================================= */

const $ = (selector) => document.querySelector(selector);

const getElement = (...selectors) => {
  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (element) return element;
  }

  return null;
};


/* =========================================
   DOM ELEMENTS
========================================= */

const elements = {

  sidebar:
    getElement(".sidebar"),

  sidebarOverlay:
    getElement(".sidebar-overlay"),

  menuButton:
    getElement(
      "#menuButton",
      ".menu-button"
    ),

  chat:
    getElement(
      "#chat",
      ".chat"
    ),

  messageInput:
    getElement(
      "#messageInput",
      "textarea[name='message']"
    ),

  sendButton:
    getElement(
      "#sendButton",
      ".send"
    ),

  attachButton:
    getElement(
      "#attachButton",
      ".attach"
    ),

  fileInput:
    getElement(
      "#fileInput",
      "input[type='file']"
    ),

  attachmentName:
    getElement(
      "#attachmentName",
      ".attachment-name"
    ),

  newChatButton:
    getElement(
      "#newChatButton",
      ".new-chat"
    ),

  historyList:
    getElement(
      "#historyList",
      ".history-list"
    ),

  projectList:
    getElement(
      "#projectList",
      ".project-list"
    ),

  createProjectButton:
    getElement(
      "#createProjectButton",
      ".create-project"
    ),

  settingsButton:
    getElement(
      "#settingsButton",
      ".settings-button"
    ),

  settingsModal:
    getElement(
      "#settingsModal"
    ),

  closeSettingsButton:
    getElement(
      "#closeSettingsButton"
    ),

  providerSelect:
    getElement(
      "#providerSelect"
    ),

  apiKeyInput:
    getElement(
      "#apiKeyInput"
    ),

  apiUrlInput:
    getElement(
      "#apiUrlInput"
    ),

  modelInput:
    getElement(
      "#modelInput"
    ),

  saveProviderButton:
    getElement(
      "#saveProviderButton",
      ".save-provider"
    ),

  settingsStatus:
    getElement(
      "#settingsStatus",
      ".settings-status"
    ),

  preview:
    getElement(
      "#preview",
      ".preview"
    ),

  previewClear:
    getElement(
      "#previewClear",
      ".canvas-clear"
    ),

  micButton:
    getElement(
      "#micButton",
      ".mic-button"
    ),

  liveButton:
    getElement(
      "#liveButton",
      "#masterLiveButton"
    ),

  liveModal:
    getElement(
      "#liveModal"
    ),

  liveClose:
    getElement(
      "#liveClose"
    ),

  liveOrb:
    getElement(
      "#liveOrb",
      ".live-orb"
    ),

  liveStatus:
    getElement(
      "#liveStatus",
      ".live-status"
    ),

  liveTranscript:
    getElement(
      "#liveTranscript",
      ".live-transcript"
    ),

  liveStop:
    getElement(
      "#liveStop"
    ),

  status:
    getElement(
      ".status",
      "#status"
    )
};


/* =========================================
   STORAGE
========================================= */

function loadConfig() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEYS.config
      );

    if (!saved) {
      return structuredClone(
        DEFAULT_CONFIG
      );
    }

    const parsed =
      JSON.parse(saved);

    return mergeConfig(
      structuredClone(DEFAULT_CONFIG),
      parsed
    );

  } catch (error) {

    console.warn(
      "Could not load config:",
      error
    );

    return structuredClone(
      DEFAULT_CONFIG
    );
  }
}


function mergeConfig(
  base,
  saved
) {

  if (!saved) return base;

  return {
    ...base,
    ...saved,

    providers: {
      ...base.providers,
      ...(saved.providers || {})
    }
  };
}


function saveConfig() {

  try {

    localStorage.setItem(
      STORAGE_KEYS.config,
      JSON.stringify(config)
    );

  } catch (error) {

    console.error(
      "Config save failed:",
      error
    );
  }
}


function loadChats() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEYS.chats
      );

    if (!saved) return [];

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    return [];
  }
}


function saveChats() {

  try {

    localStorage.setItem(
      STORAGE_KEYS.chats,
      JSON.stringify(chats)
    );

  } catch (error) {

    console.error(
      "Chat save failed:",
      error
    );
  }
}


/* =========================================
   CHAT MANAGEMENT
========================================= */

function createChat() {

  const chat = {

    id:
      "chat_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2),

    title: "New Chat",

    createdAt:
      new Date().toISOString(),

    messages: []
  };

  chats.unshift(chat);

  currentChatId = chat.id;

  localStorage.setItem(
    STORAGE_KEYS.currentChat,
    currentChatId
  );

  saveChats();

  return chat;
}


function getCurrentChat() {

  let chat =
    chats.find(
      item =>
        item.id === currentChatId
    );

  if (!chat) {

    chat = createChat();
  }

  return chat;
}


function setCurrentChat(id) {

  const chat =
    chats.find(
      item => item.id === id
    );

  if (!chat) return;

  currentChatId = id;

  localStorage.setItem(
    STORAGE_KEYS.currentChat,
    currentChatId
  );

  renderChat();

  renderHistory();

  closeSidebar();
}


/* =========================================
   HISTORY
========================================= */

function renderHistory() {

  if (!elements.historyList) return;

  elements.historyList.innerHTML = "";

  chats.forEach(chat => {

    const button =
      document.createElement("button");

    button.className =
      "history-item";

    if (
      chat.id === currentChatId
    ) {

      button.classList.add(
        "active"
      );
    }

    button.textContent =
      chat.title ||
      "New Chat";

    button.addEventListener(
      "click",
      () => {
        setCurrentChat(
          chat.id
        );
      }
    );

    elements.historyList.appendChild(
      button
    );
  });
}


/* =========================================
   RENDER CHAT
========================================= */

function renderChat() {

  if (!elements.chat) return;

  const chat =
    getCurrentChat();

  elements.chat.innerHTML = "";

  if (
    !chat.messages ||
    chat.messages.length === 0
  ) {

    renderWelcome();

    return;
  }

  chat.messages.forEach(
    message => {

      addMessageToDOM(
        message.role,
        message.content,
        message.attachments || []
      );
    }
  );

  scrollChatToBottom();
}


function renderWelcome() {

  if (!elements.chat) return;

  const welcome =
    document.createElement("div");

  welcome.className =
    "welcome";

  welcome.innerHTML = `
    <div class="master-orb small-orb">
      <div class="orb-ring ring-one"></div>
      <div class="orb-ring ring-two"></div>
      <div class="orb-core">M</div>
    </div>

    <h1>MASTER AI</h1>

    <p>
      Ask anything. Type normally or use
      MASTER LIVE for voice conversation.
    </p>

    <div class="capability-grid">

      <button
        class="capability-card"
        data-prompt="Help me analyse a decision with multiple options."
      >
        <span>🧠</span>
        Mastermind Analysis
      </button>

      <button
        class="capability-card"
        data-prompt="Help me plan my project step by step."
      >
        <span>📋</span>
        Planning
      </button>

      <button
        class="capability-card"
        data-prompt="Help me solve a difficult problem."
      >
        <span>⚙️</span>
        Problem Solving
      </button>

      <button
        class="capability-card"
        data-prompt="Help me generate creative ideas."
      >
        <span>✨</span>
        Creative Thinking
      </button>

    </div>
  `;

  elements.chat.appendChild(
    welcome
  );

  welcome
    .querySelectorAll(
      "[data-prompt]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (
            elements.messageInput
          ) {

            elements.messageInput.value =
              button.dataset.prompt;

            autoResizeInput();

            elements.messageInput.focus();
          }
        }
      );
    });
}


/* =========================================
   MESSAGE DOM
========================================= */

function addMessageToDOM(
  role,
  content,
  attachments = []
) {

  if (!elements.chat) return;

  const message =
    document.createElement("div");

  message.className =
    `message ${
      role === "user"
        ? "user"
        : "master"
    }`;

  if (role !== "user") {

    const label =
      document.createElement("strong");

    label.textContent =
      "MASTER AI";

    message.appendChild(label);

    message.appendChild(
      document.createElement("br")
    );
  }

  const text =
    document.createElement("span");

  text.textContent =
    content || "";

  message.appendChild(text);

  if (
    attachments &&
    attachments.length
  ) {

    attachments.forEach(file => {

      const note =
        document.createElement("span");

      note.className =
        "file-note";

      note.textContent =
        `📎 ${file.name}`;

      message.appendChild(note);
    });
  }

  elements.chat.appendChild(
    message
  );

  scrollChatToBottom();

  return message;
}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessage(
  role,
  content,
  attachments = []
) {

  const chat =
    getCurrentChat();

  chat.messages.push({

    role,
    content,

    attachments:
      attachments.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      })),

    time:
      new Date().toISOString()
  });

  if (
    role === "user" &&
    chat.messages.length === 1
  ) {

    chat.title =
      content
        .trim()
        .slice(0, 40) ||
      "New Chat";
  }

  saveChats();

  renderHistory();

  return chat.messages[
    chat.messages.length - 1
  ];
}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage(
  forcedText = null
) {

  if (isSending) return;

  const inputText =
    forcedText !== null
      ? forcedText
      : (
          elements.messageInput?.value ||
          ""
        );

  const text =
    inputText.trim();

  if (
    !text &&
    selectedFiles.length === 0
  ) {

    return;
  }

  const files =
    [...selectedFiles];

  clearWelcomeIfNeeded();

  addMessageToDOM(
    "user",
    text,
    files
  );

  addMessage(
    "user",
    text,
    files
  );

  if (
    elements.messageInput
  ) {

    elements.messageInput.value = "";

    autoResizeInput();
  }

  clearAttachments();

  isSending = true;

  setSendingState(true);

  const loading =
    addLoadingMessage();

  try {

    const reply =
      await callAI(
        text,
        files
      );

    loading.remove();

    addMessageToDOM(
      "assistant",
      reply
    );

    addMessage(
      "assistant",
      reply
    );

    if (liveActive) {

      speakText(reply);
    }

  } catch (error) {

    console.error(error);

    loading.remove();

    const errorText =
      getReadableError(
        error
      );

    addMessageToDOM(
      "assistant",
      errorText
    );

  } finally {

    isSending = false;

    setSendingState(false);

    scrollChatToBottom();
  }
}


/* =========================================
   AI API
========================================= */

async function callAI(
  userText,
  files
) {

  const provider =
    config.providers[
      config.activeProvider
    ];

  if (!provider) {

    throw new Error(
      "No API provider selected."
    );
  }

  if (
    !provider.apiKey ||
    !provider.apiKey.trim()
  ) {

    throw new Error(
      "API key not configured. Open Settings and add your API key."
    );
  }

  if (
    !provider.apiUrl ||
    !provider.model
  ) {

    throw new Error(
      "API URL or model is missing."
    );
  }

  const chat =
    getCurrentChat();

  const history =
    chat.messages
      .slice(-20)
      .map(message => ({

        role:
          message.role === "assistant"
            ? "assistant"
            : "user",

        content:
          message.content
      }));

  const attachmentInfo =
    files.length
      ? "\n\nAttached files:\n" +
        files
          .map(file =>
            `- ${file.name} (${file.type || "unknown"})`
          )
          .join("\n")
      : "";

  const messages = [

    {
      role: "system",
      content:
        MASTER_SYSTEM_PROMPT
    },

    ...history.slice(0, -1),

    {
      role: "user",
      content:
        userText +
        attachmentInfo
    }
  ];

  const requestBody = {

    model:
      provider.model,

    messages,

    stream: false
  };


  /*
    DeepSeek thinking support.
    If another provider is selected,
    this field is not automatically added.
  */

  if (
    config.activeProvider ===
    "deepseek"
  ) {

    requestBody.thinking = {
      type: "enabled"
    };

    requestBody.reasoning_effort =
      "high";
  }


  const response =
    await fetch(
      provider.apiUrl,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${provider.apiKey}`
        },

        body:
          JSON.stringify(
            requestBody
          )
      }
    );

  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `API Error ${response.status}: ${errorText}`
    );
  }

  const data =
    await response.json();

  const answer =
    data?.choices?.[0]
      ?.message?.content;

  if (!answer) {

    throw new Error(
      "The AI returned an empty response."
    );
  }

  return answer;
}


/* =========================================
   LOADING MESSAGE
========================================= */

function addLoadingMessage() {

  if (!elements.chat) {

    return {
      remove() {}
    };
  }

  const message =
    document.createElement("div");

  message.className =
    "message master loading-message";

  message.textContent =
    "MASTER AI is analysing...";

  elements.chat.appendChild(
    message
  );

  scrollChatToBottom();

  return message;
}


/* =========================================
   ERROR TEXT
========================================= */

function getReadableError(
  error
) {

  const message =
    error?.message || "";

  if (
    message.includes(
      "API key"
    )
  ) {

    return (
      "API key missing or invalid. " +
      "Open Settings and check the provider configuration."
    );
  }

  if (
    message.includes(
      "Failed to fetch"
    )
  ) {

    return (
      "Connection failed. Check your internet connection, API URL, and whether the API allows browser requests."
    );
  }

  return (
    "Something went wrong:\n" +
    message
  );
}


/* =========================================
   SEND STATE
========================================= */

function setSendingState(
  sending
) {

  if (
    elements.sendButton
  ) {

    elements.sendButton.disabled =
      sending;
  }

  if (
    elements.messageInput
  ) {

    elements.messageInput.disabled =
      sending;
  }

  if (
    elements.status
  ) {

    elements.status.textContent =
      sending
        ? "Thinking..."
        : "Ready";
  }
}


/* =========================================
   INPUT
========================================= */

function autoResizeInput() {

  const input =
    elements.messageInput;

  if (!input) return;

  input.style.height = "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      150
    ) + "px";
}


/* =========================================
   ATTACHMENTS
========================================= */

function handleFiles(
  fileList
) {

  if (!fileList) return;

  const incoming =
    Array.from(fileList);

  const existingKeys =
    new Set(
      selectedFiles.map(
        file =>
          `${file.name}_${file.size}_${file.lastModified}`
      )
    );

  incoming.forEach(file => {

    const key =
      `${file.name}_${file.size}_${file.lastModified}`;

    if (
      !existingKeys.has(key)
    ) {

      selectedFiles.push(file);

      existingKeys.add(key);
    }
  });

  renderAttachments();
}


function renderAttachments() {

  if (
    !elements.attachmentName
  ) return;

  if (
    selectedFiles.length === 0
  ) {

    elements.attachmentName.textContent =
      "";

    elements.attachmentName.classList.remove(
      "show"
    );

    return;
  }

  elements.attachmentName.textContent =
    selectedFiles
      .map(
        (file, index) =>
          `${index + 1}. ${file.name}`
      )
      .join("\n");

  elements.attachmentName.classList.add(
    "show"
  );
}


function clearAttachments() {

  selectedFiles = [];

  if (
    elements.fileInput
  ) {

    elements.fileInput.value = "";
  }

  renderAttachments();
}


/* =========================================
   SIDEBAR
========================================= */

function openSidebar() {

  elements.sidebar?.classList.add(
    "open"
  );

  elements.sidebarOverlay?.classList.add(
    "show"
  );
}


function closeSidebar() {

  elements.sidebar?.classList.remove(
    "open"
  );

  elements.sidebarOverlay?.classList.remove(
    "show"
  );
}


/* =========================================
   SETTINGS
========================================= */

function openSettings() {

  if (!elements.settingsModal)
    return;

  fillSettingsForm();

  elements.settingsModal.classList.add(
    "show"
  );
}


function closeSettings() {

  elements.settingsModal?.classList.remove(
    "show"
  );
}


function fillSettingsForm() {

  const provider =
    config.providers[
      config.activeProvider
    ];

  if (
    elements.providerSelect
  ) {

    elements.providerSelect.value =
      config.activeProvider;
  }

  if (
    elements.apiKeyInput
  ) {

    elements.apiKeyInput.value =
      provider?.apiKey || "";
  }

  if (
    elements.apiUrlInput
  ) {

    elements.apiUrlInput.value =
      provider?.apiUrl || "";
  }

  if (
    elements.modelInput
  ) {

    elements.modelInput.value =
      provider?.model || "";
  }
}


function saveSettings() {

  const providerName =
    elements.providerSelect?.value ||
    config.activeProvider;

  if (
    !config.providers[
      providerName
    ]
  ) {

    config.providers[
      providerName
    ] = {

      name:
        providerName,

      enabled: true,

      apiUrl: "",

      model: "",

      apiKey: ""
    };
  }

  config.activeProvider =
    providerName;

  const provider =
    config.providers[
      providerName
    ];

  if (
    elements.apiKeyInput
  ) {

    provider.apiKey =
      elements.apiKeyInput.value.trim();
  }

  if (
    elements.apiUrlInput
  ) {

    provider.apiUrl =
      elements.apiUrlInput.value.trim();
  }

  if (
    elements.modelInput
  ) {

    provider.model =
      elements.modelInput.value.trim();
  }

  provider.enabled = true;

  saveConfig();

  if (
    elements.settingsStatus
  ) {

    elements.settingsStatus.textContent =
      "Settings saved.";
  }

  setTimeout(() => {

    if (
      elements.settingsStatus
    ) {

      elements.settingsStatus.textContent =
        "";
    }

  }, 2500);
}


/* =========================================
   PROVIDER CHANGE
========================================= */

function updateProviderForm() {

  const name =
    elements.providerSelect?.value;

  if (!name) return;

  if (
    !config.providers[name]
  ) {

    config.providers[name] = {

      name,

      enabled: true,

      apiUrl: "",

      model: "",

      apiKey: ""
    };
  }

  const provider =
    config.providers[name];

  if (
    elements.apiKeyInput
  ) {

    elements.apiKeyInput.value =
      provider.apiKey || "";
  }

  if (
    elements.apiUrlInput
  ) {

    elements.apiUrlInput.value =
      provider.apiUrl || "";
  }

  if (
    elements.modelInput
  ) {

    elements.modelInput.value =
      provider.model || "";
  }
}


/* =========================================
   PREVIEW
========================================= */

function clearPreview() {

  if (!elements.preview)
    return;

  elements.preview.innerHTML = `
    <div class="preview-empty">
      <div class="preview-icon">◈</div>
      <strong>Preview</strong>
      <p>
        Generated previews will appear here.
      </p>
    </div>
  `;
}


/* =========================================
   MASTER LIVE
========================================= */

function openLive() {

  if (!elements.liveModal) {

    alert(
      "MASTER LIVE HTML elements are missing."
    );

    return;
  }

  liveActive = true;

  elements.liveModal.classList.add(
    "show"
  );

  setLiveStatus(
    "Tap the circle and start speaking."
  );
}


function closeLive() {

  liveActive = false;

  stopListening();

  stopSpeaking();

  elements.liveModal?.classList.remove(
    "show"
  );

  elements.liveOrb?.classList.remove(
    "listening",
    "thinking",
    "speaking"
  );

  setLiveStatus(
    "MASTER LIVE stopped."
  );
}


function setLiveStatus(text) {

  if (
    elements.liveStatus
  ) {

    elements.liveStatus.textContent =
      text;
  }
}


function updateLiveTranscript(
  text
) {

  if (
    elements.liveTranscript
  ) {

    elements.liveTranscript.textContent =
      text;
  }
}


/* =========================================
   SPEECH RECOGNITION
========================================= */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    console.warn(
      "Speech recognition is not supported."
    );

    return;
  }

  recognition =
    new SpeechRecognition();

  recognition.continuous =
    false;

  recognition.interimResults =
    true;

  recognition.lang =
    navigator.language ||
    "en-IN";


  recognition.onstart = () => {

    isListening = true;

    elements.liveOrb?.classList.add(
      "listening"
    );

    setLiveStatus(
      "Listening..."
    );
  };


  recognition.onresult =
    event => {

      let finalText = "";

      let interimText = "";

      for (
        let i =
          event.resultIndex;
        i <
          event.results.length;
        i++
      ) {

        const result =
          event.results[i];

        if (
          result.isFinal
        ) {

          finalText +=
            result[0].transcript;

        } else {

          interimText +=
            result[0].transcript;
        }
      }

      updateLiveTranscript(
        finalText ||
        interimText
      );

      if (
        finalText.trim()
      ) {

        if (
          elements.messageInput
        ) {

          elements.messageInput.value =
            finalText.trim();

          autoResizeInput();
        }

        elements.liveOrb?.classList.remove(
          "listening"
        );

        elements.liveOrb?.classList.add(
          "thinking"
        );

        setLiveStatus(
          "MASTER AI is analysing..."
        );

        sendMessage(
          finalText.trim()
        );
      }
    };


  recognition.onerror =
    event => {

      console.warn(
        "Speech recognition error:",
        event.error
      );

      isListening = false;

      elements.liveOrb?.classList.remove(
        "listening"
      );

      setLiveStatus(
        "Voice error: " +
        event.error
      );
    };


  recognition.onend = () => {

    isListening = false;

    elements.liveOrb?.classList.remove(
      "listening"
    );
  };
}


function startListening() {

  if (!recognition) {

    alert(
      "Speech recognition is not supported in this browser."
    );

    return;
  }

  if (isListening) {

    stopListening();

    return;
  }

  try {

    recognition.start();

  } catch (error) {

    console.warn(error);
  }
}


function stopListening() {

  if (!recognition) return;

  try {

    recognition.stop();

  } catch (error) {

    /* ignore */
  }

  isListening = false;

  elements.liveOrb?.classList.remove(
    "listening"
  );
}


/* =========================================
   TEXT TO SPEECH
========================================= */

function speakText(
  text
) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;
  }

  stopSpeaking();

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    navigator.language ||
    "en-IN";

  utterance.rate = 1;

  utterance.onstart = () => {

    elements.liveOrb?.classList.remove(
      "thinking"
    );

    elements.liveOrb?.classList.add(
      "speaking"
    );

    setLiveStatus(
      "MASTER AI is speaking..."
    );
  };


  utterance.onend = () => {

    elements.liveOrb?.classList.remove(
      "speaking"
    );

    setLiveStatus(
      "Tap the circle to speak again."
    );
  };


  speechSynthesis.speak(
    utterance
  );
}


function stopSpeaking() {

  if (
    "speechSynthesis" in window
  ) {

    speechSynthesis.cancel();
  }

  elements.liveOrb?.classList.remove(
    "speaking"
  );
}


/* =========================================
   WELCOME CLEANUP
========================================= */

function clearWelcomeIfNeeded() {

  const welcome =
    elements.chat?.querySelector(
      ".welcome"
    );

  if (welcome) {

    welcome.remove();
  }
}


/* =========================================
   SCROLL
========================================= */

function scrollChatToBottom() {

  if (!elements.chat) return;

  requestAnimationFrame(() => {

    elements.chat.scrollTop =
      elements.chat.scrollHeight;
  });
}


/* =========================================
   NEW CHAT
========================================= */

function startNewChat() {

  createChat();

  renderChat();

  renderHistory();

  closeSidebar();

  elements.messageInput?.focus();
}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

  elements.menuButton?.addEventListener(
    "click",
    () => {

      if (
        elements.sidebar?.classList.contains(
          "open"
        )
      ) {

        closeSidebar();

      } else {

        openSidebar();
      }
    }
  );


  elements.sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
  );


  elements.newChatButton?.addEventListener(
    "click",
    startNewChat
  );


  elements.sendButton?.addEventListener(
    "click",
    () => sendMessage()
  );


  elements.messageInput?.addEventListener(
    "input",
    autoResizeInput
  );


  elements.messageInput?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }
    }
  );


  elements.attachButton?.addEventListener(
    "click",
    () => {

      elements.fileInput?.click();
    }
  );


  elements.fileInput?.addEventListener(
    "change",
    event => {

      handleFiles(
        event.target.files
      );
    }
  );


  elements.settingsButton?.addEventListener(
    "click",
    openSettings
  );


  elements.closeSettingsButton?.addEventListener(
    "click",
    closeSettings
  );


  elements.settingsModal?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        elements.settingsModal
      ) {

        closeSettings();
      }
    }
  );


  elements.providerSelect?.addEventListener(
    "change",
    updateProviderForm
  );


  elements.saveProviderButton?.addEventListener(
    "click",
    saveSettings
  );


  elements.previewClear?.addEventListener(
    "click",
    clearPreview
  );


  elements.micButton?.addEventListener(
    "click",
    startListening
  );


  elements.liveButton?.addEventListener(
    "click",
    openLive
  );


  elements.liveClose?.addEventListener(
    "click",
    closeLive
  );


  elements.liveStop?.addEventListener(
    "click",
    closeLive
  );


  elements.liveOrb?.addEventListener(
    "click",
    startListening
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth > 800
      ) {

        closeSidebar();
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeSidebar();

        closeSettings();

        if (liveActive) {

          closeLive();
        }
      }
    }
  );
}


/* =========================================
   PROJECTS
========================================= */

function setupProjects() {

  elements.createProjectButton?.addEventListener(
    "click",
    () => {

      const name =
        prompt(
          "Project name:"
        );

      if (!name?.trim())
        return;

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "project-item";

      button.textContent =
        name.trim();

      elements.projectList?.appendChild(
        button
      );
    }
  );
}


/* =========================================
   INITIALIZATION
========================================= */

function initialize() {

  getCurrentChat();

  renderChat();

  renderHistory();

  renderAttachments();

  clearPreview();

  setupSpeechRecognition();

  setupEvents();

  setupProjects();

  autoResizeInput();

  window.MASTER_AI = {

    get config() {
      return config;
    },

    get chats() {
      return chats;
    },

    createChat,

    sendMessage,

    openSettings,

    openLive,

    startListening
  };

  console.log(
    "MASTER AI initialized."
  );
}


/* =========================================
   START
========================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();
}
