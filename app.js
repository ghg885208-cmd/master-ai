/* =========================
   MASTER — APP
========================= */

/* =========================
   AI PROVIDERS
========================= */

const AI_PROVIDERS = {
  deepseek: {
    name: "DeepSeek",
    apiKey: "sk-7f4c469fbe6b4f3ba1a8196f0cbc1b92",
    endpoint: "https://api.deepseek.com/chat/completions",
    model: "deepseek-v4-flash",
    enabled: true
  },

  // FUTURE PROVIDERS
  openai: {
    name: "OpenAI",
    apiKey: "",
    endpoint: "",
    model: "",
    enabled: false
  },

  gemini: {
    name: "Gemini",
    apiKey: "",
    endpoint: "",
    model: "",
    enabled: false
  },

  claude: {
    name: "Claude",
    apiKey: "",
    endpoint: "",
    model: "",
    enabled: false
  }
};


/* =========================
   SETTINGS
========================= */

const ACTIVE_PROVIDER = "deepseek";

const SYSTEM_PROMPT = `
You are MASTER, a helpful personal AI workspace.

You help with:
- General questions
- Coding
- Websites
- Writing
- Research planning
- Projects
- Problem solving

Be clear and useful.
Remember the context provided in the current conversation.
`;


/* =========================
   ELEMENTS
========================= */

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


/* =========================
   DATA
========================= */

let chats =
  JSON.parse(
    localStorage.getItem("masterChats")
  ) || [];

let projects =
  JSON.parse(
    localStorage.getItem("masterProjects")
  ) || [];

let currentChatId =
  localStorage.getItem("masterCurrentChat")
  || null;

let selectedFiles = [];

let isGenerating = false;


/* =========================
   SAVE DATA
========================= */

function saveData() {

  localStorage.setItem(
    "masterChats",
    JSON.stringify(chats)
  );

  localStorage.setItem(
    "masterProjects",
    JSON.stringify(projects)
  );

  localStorage.setItem(
    "masterCurrentChat",
    currentChatId || ""
  );

}


/* =========================
   CREATE ID
========================= */

function createId() {

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9)
  );

}


/* =========================
   CREATE CHAT
========================= */

function createChat(title = "New Chat") {

  const newChat = {

    id: createId(),

    title: title,

    messages: [],

    createdAt: Date.now(),

    updatedAt: Date.now()

  };


  chats.unshift(newChat);

  currentChatId = newChat.id;


  saveData();

  renderHistory();

  renderCurrentChat();


  return newChat;

}


/* =========================
   GET CURRENT CHAT
========================= */

function getCurrentChat() {

  return chats.find(
    item => item.id === currentChatId
  );

}


/* =========================
   RENDER HISTORY
========================= */

function renderHistory() {

  if (!historyList) return;


  historyList.innerHTML = "";


  chats.forEach(chatItem => {

    const button =
      document.createElement("button");


    button.className =
      "history-item";


    if (
      chatItem.id === currentChatId
    ) {

      button.classList.add("active");

    }


    button.textContent =
      chatItem.title || "New Chat";


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

  });

}


/* =========================
   RENDER CURRENT CHAT
========================= */

function renderCurrentChat() {

  if (!chat) return;


  chat.innerHTML = "";


  const currentChat =
    getCurrentChat();


  if (!currentChat) {

    chat.innerHTML = `

      <div class="welcome">

        <h1>How can I help?</h1>

        <p>
          I'm MASTER, your personal AI workspace.
        </p>

      </div>

    `;


    if (chatTitle) {

      chatTitle.textContent =
        "MASTER";

    }


    return;

  }


  if (chatTitle) {

    chatTitle.textContent =
      currentChat.title;

  }


  if (
    currentChat.messages.length === 0
  ) {

    chat.innerHTML = `

      <div class="welcome">

        <h1>How can I help?</h1>

        <p>
          Start a conversation with MASTER.
        </p>

      </div>

    `;


    return;

  }


  currentChat.messages.forEach(
    messageData => {

      addMessageToScreen(
        messageData.text,
        messageData.sender,
        messageData.files || []
      );

    }
  );


  scrollChatToBottom();

}


/* =========================
   ADD MESSAGE TO SCREEN
========================= */

function addMessageToScreen(
  text,
  sender,
  files = []
) {

  if (!chat) return null;


  const message =
    document.createElement("div");


  message.className =
    `message ${sender}`;


  if (sender === "master") {

    const name =
      document.createElement("strong");


    name.textContent =
      "MASTER";


    const breakLine =
      document.createElement("br");


    const content =
      document.createElement("span");


    content.textContent =
      text;


    message.appendChild(name);

    message.appendChild(breakLine);

    message.appendChild(content);

  } else {

    message.textContent =
      text;

  }


  if (files.length > 0) {

    files.forEach(
      fileName => {

        const note =
          document.createElement("span");


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


/* =========================
   SAVE MESSAGE
========================= */

function saveMessage(
  text,
  sender,
  files = []
) {

  let currentChat =
    getCurrentChat();


  if (!currentChat) {

    currentChat =
      createChat();

  }


  const message = {

    id: createId(),

    text: text,

    sender: sender,

    files: files,

    createdAt: Date.now()

  };


  currentChat.messages.push(
    message
  );


  currentChat.updatedAt =
    Date.now();


  /* First user message
     becomes chat title */

  if (
    sender === "user" &&
    currentChat.messages.filter(
      message =>
        message.sender === "user"
    ).length === 1
  ) {

    const cleanTitle =
      text.trim() ||
      "File Conversation";


    currentChat.title =
      cleanTitle.slice(0, 32);

  }


  saveData();

  renderHistory();


  return message;

}


/* =========================
   BUILD AI MESSAGES
========================= */

function buildAIMessages() {

  const currentChat =
    getCurrentChat();


  const messages = [

    {
      role: "system",

      content:
        SYSTEM_PROMPT
    }

  ];


  if (!currentChat) {

    return messages;

  }


  currentChat.messages.forEach(
    message => {

      if (
        message.sender === "user"
      ) {

        messages.push({

          role: "user",

          content:
            message.text

        });

      }


      if (
        message.sender === "master"
      ) {

        messages.push({

          role: "assistant",

          content:
            message.text

        });

      }

    }
  );


  return messages;

}


/* =========================
   GET ACTIVE PROVIDER
========================= */

function getActiveProvider() {

  return AI_PROVIDERS[
    ACTIVE_PROVIDER
  ];

}


/* =========================
   CALL AI
========================= */

async function callAI() {

  const provider =
    getActiveProvider();


  if (!provider) {

    throw new Error(
      "AI provider not found."
    );

  }


  if (
    !provider.enabled
  ) {

    throw new Error(
      "AI provider is disabled."
    );

  }


  if (
    !provider.apiKey ||
    provider.apiKey.includes(
      "PASTE_YOUR"
    )
  ) {

    throw new Error(
      "API key is missing."
    );

  }


  const messages =
    buildAIMessages();


  const response =
    await fetch(
      provider.endpoint,

      {

        method: "POST",


        headers: {

          "Content-Type":
            "application/json",


          "Authorization":
            `Bearer ${provider.apiKey}`

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


  if (!response.ok) {

    let errorText =
      "API request failed.";


    try {

      const errorData =
        await response.json();


      errorText =
        errorData.error?.message ||
        errorText;

    } catch (error) {}


    throw new Error(
      errorText
    );

  }


  const data =
    await response.json();


  const answer =
    data?.choices?.[0]
      ?.message
      ?.content;


  if (!answer) {

    throw new Error(
      "AI returned an empty response."
    );

  }


  return answer;

}


/* =========================
   LOADING MESSAGE
========================= */

function addLoadingMessage() {

  const message =
    document.createElement("div");


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


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  if (isGenerating) {

    return;

  }


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


  input.value = "";


  selectedFiles = [];


  if (fileInput) {

    fileInput.value = "";

  }


  if (attachmentName) {

    attachmentName.textContent =
      "";


    attachmentName.classList.remove(
      "show"
    );

  }


  scrollChatToBottom();


  isGenerating = true;


  if (sendButton) {

    sendButton.disabled =
      true;

  }


  const loadingMessage =
    add
