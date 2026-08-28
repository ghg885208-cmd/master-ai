/* =========================================
   MASTER AI — MAIN APP
========================================= */

const DEFAULT_SYSTEM_PROMPT = `
You are MASTER, a personal AI assistant.

Be helpful, clear and honest.
Do not blindly agree with the user.
Analyse important decisions carefully.

You can help with:
- Questions
- Coding
- Websites
- Projects
- Writing
- Planning
- Analysis
- Creative work
- 3D modelling planning
- Editing planning

If MASTERMIND MODE is requested, deeply analyse:
- Option A
- Option B
- Alternatives
- Choosing nothing
- Short-term outcomes
- Long-term possibilities
- Risks
- Benefits
- Opportunity costs
- Missing information
- Permissions or approvals
- What could happen if approval is denied

Separate facts from assumptions.
Do not claim to predict the future with certainty.
`;


/* =========================================
   ELEMENTS
========================================= */

const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const chat = document.querySelector("#chat");

const newChatButton =
  document.querySelector("#newChatButton");

const attachButton =
  document.querySelector("#attachButton");

const fileInput =
  document.querySelector("#fileInput");

const attachmentName =
  document.querySelector("#attachmentName");

const menuButton =
  document.querySelector("#menuButton");

const sidebar =
  document.querySelector("#sidebar");

const historyList =
  document.querySelector("#historyList");

const projectList =
  document.querySelector("#projectList");

const createProjectButton =
  document.querySelector("#createProjectButton");

const projectModal =
  document.querySelector("#projectModal");

const projectNameInput =
  document.querySelector("#projectNameInput");

const cancelProjectButton =
  document.querySelector("#cancelProjectButton");

const confirmProjectButton =
  document.querySelector("#confirmProjectButton");

const chatTitle =
  document.querySelector("#chatTitle");

const preview =
  document.querySelector("#preview");

const settingsButton =
  document.querySelector("#settingsButton");

const settingsModal =
  document.querySelector("#settingsModal");

const closeSettingsButton =
  document.querySelector("#closeSettingsButton");

const providerSelect =
  document.querySelector("#providerSelect");

const providerApiKey =
  document.querySelector("#providerApiKey");

const providerEndpoint =
  document.querySelector("#providerEndpoint");

const providerModel =
  document.querySelector("#providerModel");

const saveProviderButton =
  document.querySelector("#saveProviderButton");

const settingsStatus =
  document.querySelector("#settingsStatus");


/* =========================================
   DATA
========================================= */

let chats =
  loadStorage("masterChats", []);

let projects =
  loadStorage("masterProjects", []);

let currentChatId =
  localStorage.getItem("masterCurrentChat") ||
  null;

let selectedFiles = [];

let isGenerating = false;


/* =========================================
   PROVIDERS
========================================= */

const FALLBACK_PROVIDERS = {

  deepseek: {
    name: "DeepSeek",
    apiKey: "",
    apiUrl: "https://api.deepseek.com/chat/completions",
    endpoint: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    enabled: true
  },

  openai: {
    name: "OpenAI",
    apiKey: "",
    apiUrl: "",
    endpoint: "",
    model: "",
    enabled: false
  },

  gemini: {
    name: "Gemini",
    apiKey: "",
    apiUrl: "",
    endpoint: "",
    model: "",
    enabled: false
  },

  claude: {
    name: "Claude",
    apiKey: "",
    apiUrl: "",
    endpoint: "",
    model: "",
    enabled: false
  },

  custom: {
    name: "Custom API",
    apiKey: "",
    apiUrl: "",
    endpoint: "",
    model: "",
    enabled: false
  }

};


/* =========================================
   LOCAL STORAGE HELPER
========================================= */

function loadStorage(key, fallback) {

  try {

    const saved =
      localStorage.getItem(key);

    return saved
      ? JSON.parse(saved)
      : fallback;

  } catch (error) {

    console.warn(
      "Storage load failed:",
      key,
      error
    );

    return fallback;

  }

}


function saveStorage(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (error) {

    console.warn(
      "Storage save failed:",
      key,
      error
    );

  }

}


/* =========================================
   PROVIDER STORAGE
========================================= */

function getProviders() {

  const providers =
    JSON.parse(
      JSON.stringify(FALLBACK_PROVIDERS)
    );


  /*
    api-config.js configuration
  */

  if (
    window.MASTER_API_CONFIG &&
    window.MASTER_API_CONFIG.providers
  ) {

    Object.assign(
      providers,
      window.MASTER_API_CONFIG.providers
    );

  }


  /*
    User saved provider settings
  */

  const saved =
    loadStorage(
      "masterProviders",
      {}
    );


  Object.keys(saved).forEach(
    id => {

      providers[id] = {

        ...(providers[id] || {}),

        ...saved[id]

      };

    }
  );


  return providers;

}


function getActiveProviderId() {

  const saved =
    localStorage.getItem(
      "masterActiveProvider"
    );


  if (saved) {

    return saved;

  }


  if (
    window.MASTER_API_CONFIG &&
    window.MASTER_API_CONFIG.activeProvider
  ) {

    return window.MASTER_API_CONFIG
      .activeProvider;

  }


  return "deepseek";

}


function setActiveProvider(id) {

  localStorage.setItem(
    "masterActiveProvider",
    id
  );

}


function saveProvider(
  id,
  config
) {

  const saved =
    loadStorage(
      "masterProviders",
      {}
    );


  saved[id] = {

    ...(saved[id] || {}),

    ...config

  };


  saveStorage(
    "masterProviders",
    saved
  );

}


/* =========================================
   SAVE APP DATA
========================================= */

function saveData() {

  saveStorage(
    "masterChats",
    chats
  );


  saveStorage(
    "masterProjects",
    projects
  );


  localStorage.setItem(
    "masterCurrentChat",
    currentChatId || ""
  );

}


/* =========================================
   CREATE ID
========================================= */

function createId() {

  return (

    Date.now().toString(36) +

    Math.random()
      .toString(36)
      .slice(2, 9)

  );

}


/* =========================================
   CHAT SYSTEM
========================================= */

function createChat(
  title = "New Chat"
) {

  const newChat = {

    id:
      createId(),

    title:
      title,

    messages:
      [],

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()

  };


  chats.unshift(
    newChat
  );


  currentChatId =
    newChat.id;


  saveData();

  renderHistory();

  renderCurrentChat();


  return newChat;

}


function getCurrentChat() {

  return chats.find(

    item =>
      item.id === currentChatId

  );

}


/* =========================================
   HISTORY
========================================= */

function renderHistory() {

  if (!historyList) return;


  historyList.innerHTML =
    "";


  chats.forEach(
    chatItem => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "history-item";


      if (
        chatItem.id ===
        currentChatId
      ) {

        button.classList.add(
          "active"
        );

      }


      button.textContent =
        chatItem.title ||
        "New Chat";


      button.addEventListener(

        "click",

        () => {

          currentChatId =
            chatItem.id;


          saveData();

          renderHistory();

          renderCurrentChat();

          closeMobileMenu();

        }

      );


      historyList.appendChild(
        button
      );

    }
  );

}


/* =========================================
   RENDER CHAT
========================================= */

function renderCurrentChat() {

  if (!chat) return;


  chat.innerHTML =
    "";


  const current =
    getCurrentChat();


  if (!current) {

    renderWelcome();

    return;

  }


  if (chatTitle) {

    chatTitle.textContent =
      current.title ||
      "MASTER";

  }


  if (
    current.messages.length === 0
  ) {

    renderWelcome();

    return;

  }


  current.messages.forEach(
    message => {

      addMessageToScreen(

        message.text,

        message.sender,

        message.files || []

      );

    }
  );


  scrollChatToBottom();

}


function renderWelcome() {

  if (!chat) return;


  chat.innerHTML = `

    <div class="welcome">

      <h1>
        How can I help?
      </h1>

      <p>
        I'm MASTER, your personal AI workspace.
      </p>

    </div>

  `;

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessageToScreen(
  text,
  sender,
  files = []
) {

  if (!chat) return;


  const message =
    document.createElement(
      "div"
    );


  message.className =
    `message ${sender}`;


  if (
    sender === "master"
  ) {

    const name =
      document.createElement(
        "strong"
      );


    name.textContent =
      "MASTER";


    const content =
      document.createElement(
        "div"
      );


    content.textContent =
      text;


    message.appendChild(
      name
    );


    message.appendChild(
      document.createElement("br")
    );


    message.appendChild(
      content
    );

  } else {

    const content =
      document.createElement(
        "div"
      );


    content.textContent =
      text;


    message.appendChild(
      content
    );

  }


  if (
    files.length > 0
  ) {

    files.forEach(
      fileName => {

        const note =
          document.createElement(
            "span"
          );


        note.className =
          "file-note";


        note.textContent =
          `📎 ${fileName}`;


        message.appendChild(
          note
        );

      }
    );

  }


  chat.appendChild(
    message
  );


  return message;

}


/* =========================================
   SAVE MESSAGE
========================================= */

function saveMessage(
  text,
  sender,
  files = []
) {

  let current =
    getCurrentChat();


  if (!current) {

    current =
      createChat();

  }


  current.messages.push({

    id:
      createId(),

    text:
      text,

    sender:
      sender,

    files:
      files,

    createdAt:
      Date.now()

  });


  current.updatedAt =
    Date.now();


  const userMessages =
    current.messages.filter(

      message =>
        message.sender === "user"

    );


  if (
    sender === "user" &&
    userMessages.length === 1
  ) {

    current.title =
      (
        text ||
        "File Conversation"
      )
        .trim()
        .slice(0, 32);

  }


  saveData();

  renderHistory();

}


/* =========================================
   BUILD AI MESSAGES
========================================= */

function buildAIMessages() {

  const current =
    getCurrentChat();


  const messages = [

    {

      role:
        "system",

      content:
        DEFAULT_SYSTEM_PROMPT

    }

  ];


  if (!current) {

    return messages;

  }


  /*
    Limit conversation sent to API
    so very long history does not
    grow forever.
  */

  const recentMessages =
    current.messages.slice(-30);


  recentMessages.forEach(
    message => {

      messages.push({

        role:

          message.sender === "master"
            ? "assistant"
            : "user",


        content:

          message.text

      });

    }
  );


  return messages;

}


/* =========================================
   API CALL
========================================= */

async function callAI() {

  const providers =
    getProviders();


  const activeId =
    getActiveProviderId();


  const provider =
    providers[activeId];


  if (!provider) {

    throw new Error(
      "Selected AI provider was not found."
    );

  }


  if (
    provider.enabled === false
  ) {

    throw new Error(
      "Selected AI provider is disabled."
    );

  }


  const apiKey =
    provider.apiKey;


  const endpoint =
    provider.endpoint ||
    provider.apiUrl;


  if (!apiKey) {

    throw new Error(
      "API key is missing. Open Settings and add it."
    );

  }


  if (!endpoint) {

    throw new Error(
      "API endpoint is missing."
    );

  }


  if (!provider.model) {

    throw new Error(
      "AI model is missing."
    );

  }


  const messages =
    buildAIMessages();


  /*
    OpenAI-compatible format.
    Custom providers may require
    their own adapter later.
  */

  const response =
    await fetch(

      endpoint,

      {

        method:
          "POST",


        headers: {

          "Content-Type":
            "application/json",


          "Authorization":
            `Bearer ${apiKey}`

        },


        body:

          JSON.stringify({

            model:
              provider.model,

            messages:
              messages,

            stream:
              false

          })

      }

    );


  let data;


  try {

    data =
      await response.json();

  } catch (error) {

    throw new Error(
      "The API returned an invalid response."
    );

  }


  if (!response.ok) {

    throw new Error(

      data?.error?.message ||

      data?.message ||

      "API request failed."

    );

  }


  const answer =

    data?.choices?.[0]
      ?.message
      ?.content ||

    data?.output_text ||

    data?.response;


  if (!answer) {

    throw new Error(
      "AI returned an empty response."
    );

  }


  return answer;

}


/* =========================================
   LOADING MESSAGE
========================================= */

function addLoadingMessage() {

  if (!chat) return null;


  const message =
    document.createElement(
      "div"
    );


  message.className =
    "message master loading-message";


  message.textContent =
    "MASTER is thinking…";


  chat.appendChild(
    message
  );


  scrollChatToBottom();


  return message;

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

  if (
    isGenerating
  ) return;


  if (!input) return;


  const text =
    input.value.trim();


  const fileNames =
    selectedFiles.map(
      file => file.name
    );


  if (
    !text &&
    fileNames.length === 0
  ) {

    return;

  }


  const welcome =
    document.querySelector(
      ".welcome"
    );


  if (welcome) {

    welcome.remove();

  }


  const messageText =
    text ||
    "Attached file(s)";


  saveMessage(

    messageText,

    "user",

    fileNames

  );


  addMessageToScreen(

    messageText,

    "user",

    fileNames

  );


  input.value =
    "";


  selectedFiles =
    [];


  if (fileInput) {

    fileInput.value =
      "";

  }


  if (attachmentName) {

    attachmentName.textContent =
      "";


    attachmentName.classList.remove(
      "show"
    );

  }


  scrollChatToBottom();


  isGenerating =
    true;


  if (sendButton) {

    sendButton.disabled =
      true;

  }


  const loadingMessage =
    addLoadingMessage();


  try {

    const answer =
      await callAI();


    if (loadingMessage) {

      loadingMessage.remove();

    }


    saveMessage(

      answer,

      "master"

    );


    addMessageToScreen(

      answer,

      "master"

    );


    scrollChatToBottom();


  } catch (error) {

    if (loadingMessage) {

      loadingMessage.remove();

    }


    const errorText =
      `Error: ${error.message}`;


    saveMessage(

      errorText,

      "master"

    );


    addMessageToScreen(

      errorText,

      "master"

    );


  } finally {

    isGenerating =
      false;


    if (sendButton) {

      sendButton.disabled =
        false;

    }

  }

}


/* =========================================
   ATTACHMENTS
========================================= */

function updateAttachmentDisplay() {

  if (!attachmentName) return;


  if (
    selectedFiles.length === 0
  ) {

    attachmentName.textContent =
      "";


    attachmentName.classList.remove(
      "show"
    );


    return;

  }


  attachmentName.textContent =

    `Attached (${selectedFiles.length}): ` +

    selectedFiles
      .map(
        file => file.name
      )
      .join(", ");


  attachmentName.classList.add(
    "show"
  );

}


if (attachButton) {

  attachButton.addEventListener(

    "click",

    () => {

      if (fileInput) {

        fileInput.click();

      }

    }

  );

}


if (fileInput) {

  fileInput.addEventListener(

    "change",

    () => {

      const newFiles =
        Array.from(
          fileInput.files || []
        );


      /*
        Prevent duplicate files.
      */

      newFiles.forEach(
        newFile => {

          const exists =
            selectedFiles.some(

              oldFile =>

                oldFile.name ===
                newFile.name &&

                oldFile.size ===
                newFile.size

            );


          if (!exists) {

            selectedFiles.push(
              newFile
            );

          }

        }
      );


      updateAttachmentDisplay();


      /*
        Reset so the same input
        can be used again.
      */

      fileInput.value =
        "";

    }

  );

}


/* =========================================
   NEW CHAT
========================================= */

if (newChatButton) {

  newChatButton.addEventListener(

    "click",

    () => {

      createChat();

      input?.focus();

      closeMobileMenu();

    }

  );

}


/* =========================================
   SEND EVENTS
========================================= */

if (sendButton) {

  sendButton.addEventListener(

    "click",

    sendMessage

  );

}


if (input) {

  input.addEventListener(

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

}


/* =========================================
   PROJECTS
========================================= */

function renderProjects() {

  if (!projectList) return;


  projectList.innerHTML =
    "";


  projects.forEach(
    project => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "project-item";


      button.textContent =
        project.name;


      button.addEventListener(

        "click",

        () => {

          if (preview) {

            preview.textContent =
              `Project: ${project.name}`;

          }


          closeMobileMenu();

        }

      );


      projectList.appendChild(
        button
      );

    }
  );

}


function createProject() {

  if (!projectNameInput) return;


  const name =
    projectNameInput.value.trim();


  if (!name) {

    projectNameInput.focus();

    return;

  }


  projects.unshift({

    id:
      createId(),

    name:
      name,

    files:
      [],

    createdAt:
      Date.now()

  });


  saveData();

  renderProjects();


  if (preview) {

    preview.textContent =
      `Project created: ${name}`;

  }


  projectNameInput.value =
    "";


  projectModal?.classList.remove(
    "show"
  );

}


if (createProjectButton) {

  createProjectButton.addEventListener(

    "click",

    () => {

      projectModal?.classList.add(
        "show"
      );


      setTimeout(

        () => {

          projectNameInput?.focus();

        },

        100

      );

    }

  );

}


if (cancelProjectButton) {

  cancelProjectButton.addEventListener(

    "click",

    () => {

      projectModal?.classList.remove(
        "show"
      );

    }

  );

}


if (confirmProjectButton) {

  confirmProjectButton.addEventListener(

    "click",

    createProject

  );

}


if (projectNameInput) {

  projectNameInput.addEventListener(

    "keydown",

    event => {

      if (
        event.key === "Enter"
      ) {

        createProject();

      }

    }

  );

}


if (projectModal) {

  projectModal.addEventListener(

    "click",

    event => {

      if (
        event.target ===
        projectModal
      ) {

        projectModal.classList.remove(
          "show"
        );

      }

    }

  );

}


/* =========================================
   SETTINGS
========================================= */

function openSettings() {

  if (!settingsModal) return;


  const providers =
    getProviders();


  const activeId =
    getActiveProviderId();


  const provider =
    providers[activeId] ||
    {};


  if (providerSelect) {

    providerSelect.value =
      activeId;

  }


  if (providerApiKey) {

    providerApiKey.value =
      provider.apiKey || "";

  }


  if (providerEndpoint) {

    providerEndpoint.value =

      provider.endpoint ||

      provider.apiUrl ||

      "";

  }


  if (providerModel) {

    providerModel.value =
      provider.model || "";

  }


  settingsModal.classList.add(
    "show"
  );

}


function closeSettings() {

  settingsModal?.classList.remove(
    "show"
  );

}


function loadSelectedProviderIntoForm() {

  if (!providerSelect) return;


  const providers =
    getProviders();


  const id =
    providerSelect.value;


  const provider =
    providers[id] ||
    {};


  if (providerApiKey) {

    providerApiKey.value =
      provider.apiKey || "";

  }


  if (providerEndpoint) {

    providerEndpoint.value =

      provider.endpoint ||

      provider.apiUrl ||

      "";

  }


  if (providerModel) {

    providerModel.value =
      provider.model || "";

  }

}


function saveSettingsProvider() {

  if (!providerSelect) return;


  const id =
    providerSelect.value;


  const providers =
    getProviders();


  const old =
    providers[id] ||
    {};


  const endpoint =
    providerEndpoint?.value.trim() ||
    "";


  saveProvider(

    id,

    {

      ...old,

      apiKey:
        providerApiKey?.value.trim() ||
        "",

      endpoint:
        endpoint,

      apiUrl:
        endpoint,

      model:
        providerModel?.value.trim() ||
        "",

      enabled:
        true

    }

  );


  setActiveProvider(
    id
  );


  if (settingsStatus) {

    settingsStatus.textContent =
      `${old.name || id} saved locally.`;

  }

}


if (settingsButton) {

  settingsButton.addEventListener(

    "click",

    openSettings

  );

}


if (closeSettingsButton) {

  closeSettingsButton.addEventListener(

    "click",

    closeSettings

  );

}


if (providerSelect) {

  providerSelect.addEventListener(

    "change",

    loadSelectedProviderIntoForm

  );

}


if (saveProviderButton) {

  saveProviderButton.addEventListener(

    "click",

    saveSettingsProvider

  );

}


if (settingsModal) {

  settingsModal.addEventListener(

    "click",

    event => {

      if (
        event.target ===
        settingsModal
      ) {

        closeSettings();

      }

    }

  );

}


/* =========================================
   MOBILE MENU
========================================= */

if (menuButton) {

  menuButton.addEventListener(

    "click",

    event => {

      event.stopPropagation();

      sidebar?.classList.toggle(
        "open"
      );

    }

  );

}


function closeMobileMenu() {

  if (

    window.innerWidth <= 800 &&

    sidebar

  ) {

    sidebar.classList.remove(
      "open"
    );

  }

}


document.addEventListener(

  "click",

  event => {

    if (

      window.innerWidth <= 800 &&

      sidebar?.classList.contains(
        "open"
      ) &&

      !sidebar.contains(
        event.target
      ) &&

      !menuButton?.contains(
        event.target
      )

    ) {

      sidebar.classList.remove(
        "open"
      );

    }

  }

);


/* =========================================
   DEVICE HUB — BASIC WEB CAPABILITIES

   Full phone control requires a native
   Android app and supported permissions.
========================================= */

const MASTER_DEVICE_HUB = {

  camera:
    !!navigator.mediaDevices,

  location:
    "geolocation" in navigator,

  notifications:
    "Notification" in window,

  files:
    true,

  automations:
    []

};


function addAutomation(
  name,
  trigger,
  action
) {

  const automation = {

    id:
      createId(),

    name:
      name,

    trigger:
      trigger,

    action:
      action,

    enabled:
      false,

    createdAt:
      Date.now()

  };


  MASTER_DEVICE_HUB
    .automations
    .push(automation);


  saveStorage(

    "masterAutomations",

    MASTER_DEVICE_HUB
      .automations

  );


  return automation;

}


MASTER_DEVICE_HUB.automations =
  loadStorage(
    "masterAutomations",
    []
  );


window.MASTER_DEVICE_HUB =
  MASTER_DEVICE_HUB;


window.MASTER_ADD_AUTOMATION =
  addAutomation;


/* =========================================
   MASTERMIND INTEGRATION
========================================= */

function isMastermindRequest(text) {

  const lower =
    text.toLowerCase();


  return (

    lower.includes(
      "mastermind"
    ) ||

    lower.includes(
      "option a"
    ) ||

    lower.includes(
      "option b"
    )

  );

}


/*
  mastermind.js can provide its
  own prompt builder.
*/

function enhanceMastermindPrompt(
  messages
) {

  if (
    !window.MASTERMIND
  ) {

    return messages;

  }


  const lastUser =
    [...messages]
      .reverse()
      .find(
        message =>
          message.role === "user"
      );


  if (
    !lastUser ||
    !isMastermindRequest(
      lastUser.content
    )
  ) {

    return messages;

  }


  messages[0].content += `

MASTERMIND MODE IS ACTIVE.

Analyse multiple possible futures.
Consider:
- choosing an option
- choosing alternatives
- delaying
- doing nothing
- permission being granted
- permission being denied
- risks and opportunity costs

Do not pretend certainty about future life events.
`;

  return messages;

}


/* =========================================
   3D MODULE PLACEHOLDER
========================================= */

window.MASTER_3D = {

  enabled:
    true,

  status:
    "Planning stage",

  capabilities: [

    "3D concept generation",

    "scene planning",

    "object specification",

    "future viewer integration"

  ]

};


/* =========================================
   EDITOR MODULE PLACEHOLDER
========================================= */

window.MASTER_EDITOR = {

  enabled:
    true,

  capabilities: [

    "Text editing",

    "Code editing",

    "Future image editing",

    "Future document editing"

  ]

};


/* =========================================
   SCROLL
========================================= */

function scrollChatToBottom() {

  if (!chat) return;


  chat.scrollTop =
    chat.scrollHeight;

}


/* =========================================
   START APP
========================================= */

function startApp() {

  if (

    chats.length === 0 ||

    !getCurrentChat()

  ) {

    createChat();

  }


  renderHistory();

  renderProjects();

  renderCurrentChat();


  console.log(
    "MASTER AI started."
  );

}


startApp();
