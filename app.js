/* =========================
   MASTER — PHASE 2
========================= */


/* ELEMENTS */

const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const chat = document.querySelector("#chat");

const newChatButton = document.querySelector("#newChatButton");

const attachButton = document.querySelector("#attachButton");
const fileInput = document.querySelector("#fileInput");
const attachmentName = document.querySelector("#attachmentName");

const menuButton = document.querySelector("#menuButton");
const sidebar = document.querySelector("#sidebar");

const historyList = document.querySelector("#historyList");
const projectList = document.querySelector("#projectList");

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


/* DATA */

let chats =
  JSON.parse(localStorage.getItem("masterChats")) || [];

let projects =
  JSON.parse(localStorage.getItem("masterProjects")) || [];

let currentChatId =
  localStorage.getItem("masterCurrentChat") || null;

let selectedFiles = [];


/* HELPERS */

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
    currentChatId
  );

}


function createId() {

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );

}


/* CREATE CHAT */

function createChat(title = "New Chat") {

  const newChat = {

    id: createId(),

    title: title,

    messages: [],

    createdAt: Date.now()

  };


  chats.unshift(newChat);

  currentChatId = newChat.id;


  saveData();


  renderHistory();

  renderCurrentChat();


  return newChat;

}


/* GET CURRENT CHAT */

function getCurrentChat() {

  return chats.find(
    chatItem =>
      chatItem.id === currentChatId
  );

}


/* RENDER HISTORY */

function renderHistory() {

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


    historyList.appendChild(button);

  });

}


/* RENDER CURRENT CHAT */

function renderCurrentChat() {

  chat.innerHTML = "";


  const currentChat =
    getCurrentChat();


  if (!currentChat) {

    chat.innerHTML = `

      <div class="welcome">

        <h1>
          How can I help?
        </h1>

        <p>
          I'm MASTER, your personal AI workspace.
          Ask, create, analyse, build and explore.
        </p>

      </div>

    `;


    chatTitle.textContent =
      "MASTER";


    return;

  }


  chatTitle.textContent =
    currentChat.title;


  if (
    currentChat.messages.length === 0
  ) {

    chat.innerHTML = `

      <div class="welcome">

        <h1>
          How can I help?
        </h1>

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


/* ADD MESSAGE TO SCREEN */

function addMessageToScreen(
  text,
  sender,
  files = []
) {

  const message =
    document.createElement("div");


  message.className =
    `message ${sender}`;


  if (
    sender === "master"
  ) {

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


  if (
    files.length > 0
  ) {

    files.forEach(
      fileName => {

        const note =
          document.createElement("span");


        note.className =
          "file-note";


        note.textContent =
          `📎 ${fileName}`;


        message.appendChild(note);

      }
    );

  }


  chat.appendChild(message);

}


/* ADD MESSAGE TO DATA */

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


  currentChat.messages.push({

    id: createId(),

    text: text,

    sender: sender,

    files: files,

    createdAt: Date.now()

  });


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

}


/* SEND MESSAGE */

function sendMessage() {

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
    document.querySelector(".welcome");


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


  fileInput.value = "";


  attachmentName.textContent = "";


  attachmentName.classList.remove(
    "show"
  );


  scrollChatToBottom();


  /* PROTOTYPE RESPONSE */

  setTimeout(() => {

    const response =

      "I'm running in prototype mode. " +
      "Real AI API responses will be connected " +
      "in the next development phase.";


    saveMessage(
      response,
      "master"
    );


    addMessageToScreen(
      response,
      "master"
    );


    scrollChatToBottom();

  }, 500);

}


/* SEND BUTTON */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* ENTER */

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


/* ATTACH FILES */

attachButton.addEventListener(
  "click",

  () => {

    fileInput.click();

  }
);


fileInput.addEventListener(
  "change",

  () => {

    selectedFiles =
      Array.from(
        fileInput.files
      );


    if (
      selectedFiles.length > 0
    ) {

      const names =
        selectedFiles
          .map(
            file => file.name
          )
          .join(", ");


      attachmentName.textContent =
        `Attached: ${names}`;


      attachmentName.classList.add(
        "show"
      );

    }

  }
);


/* NEW CHAT */

newChatButton.addEventListener(
  "click",

  () => {

    createChat();

    input.focus();

    closeMobileMenu();

  }
);


/* PROJECTS */

function renderProjects() {

  projectList.innerHTML = "";


  projects.forEach(
    project => {

      const button =
        document.createElement("button");


      button.className =
        "project-item";


      button.textContent =
        project.name;


      button.addEventListener(
        "click",

        () => {

          preview.textContent =
            `Project: ${project.name}`;


          closeMobileMenu();

        }
      );


      projectList.appendChild(
        button
      );

    }
  );

}


/* OPEN PROJECT MODAL */

createProjectButton.addEventListener(
  "click",

  () => {

    projectModal.classList.add(
      "show"
    );


    setTimeout(
      () => {

        projectNameInput.focus();

      },

      50
    );

  }
);


/* CANCEL PROJECT */

cancelProjectButton.addEventListener(
  "click",

  () => {

    projectModal.classList.remove(
      "show"
    );


    projectNameInput.value = "";

  }
);


/* CREATE PROJECT */

function createProject() {

  const name =
    projectNameInput.value.trim();


  if (!name) {

    projectNameInput.focus();

    return;

  }


  const project = {

    id: createId(),

    name: name,

    createdAt: Date.now()

  };


  projects.unshift(
    project
  );


  saveData();


  renderProjects();


  preview.textContent =
    `Project created: ${name}`;


  projectModal.classList.remove(
    "show"
  );


  projectNameInput.value = "";


  closeMobileMenu();

}


confirmProjectButton.addEventListener(
  "click",
  createProject
);


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


/* CLOSE MODAL
   WHEN CLICKING OUTSIDE */

projectModal.addEventListener(
  "click",

  event => {

    if (
      event.target === projectModal
    ) {

      projectModal.classList.remove(
        "show"
      );

    }

  }
);


/* MOBILE MENU */

menuButton.addEventListener(
  "click",

  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


function closeMobileMenu() {

  if (
    window.innerWidth <= 800
  ) {

    sidebar.classList.remove(
      "open"
    );

  }

}


/* CLICK OUTSIDE MENU */

document.addEventListener(
  "click",

  event => {

    if (

      window.innerWidth <= 800 &&

      sidebar.classList.contains(
        "open"
      ) &&

      !sidebar.contains(
        event.target
      ) &&

      !menuButton.contains(
        event.target
      )

    ) {

      sidebar.classList.remove(
        "open"
      );

    }

  }
);


/* SCROLL */

function scrollChatToBottom() {

  chat.scrollTop =
    chat.scrollHeight;

}


/* START APP */

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

}


startApp();
