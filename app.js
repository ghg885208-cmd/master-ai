const input = document.querySelector(".input-wrap input");
const sendButton = document.querySelector(".send");
const chat = document.querySelector(".chat");
const newChatButton = document.querySelector(".new-chat");

const attachButton = document.querySelector(".attach");
const fileInput = document.querySelector("#fileInput");
const attachmentName = document.querySelector(".attachment-name");

const menuButton = document.querySelector("#menuButton");
const sidebar = document.querySelector("#sidebar");


let selectedFile = null;


/* ADD MESSAGE */

function addMessage(text, sender, fileName = "") {

  const message = document.createElement("div");

  message.className = `message ${sender}`;


  if (sender === "user") {

    message.textContent = text;

  } else {

    message.innerHTML =
      `<strong>MASTER</strong><br>${text}`;

  }


  if (fileName) {

    const note = document.createElement("span");

    note.className = "file-note";

    note.textContent = `📎 ${fileName}`;

    message.appendChild(note);

  }


  chat.appendChild(message);

  chat.scrollTop = chat.scrollHeight;

}


/* SEND MESSAGE */

function sendMessage() {

  const text = input.value.trim();


  if (!text && !selectedFile) return;


  const welcome = document.querySelector(".welcome");

  if (welcome) {

    welcome.remove();

  }


  const fileName =
    selectedFile ? selectedFile.name : "";


  addMessage(
    text || "Attached a file",
    "user",
    fileName
  );


  input.value = "";


  selectedFile = null;


  fileInput.value = "";


  attachmentName.textContent = "";


  attachmentName.classList.remove("show");


  setTimeout(() => {

    addMessage(

      "I'm currently running in prototype mode. AI responses will be connected in the next phase.",

      "master"

    );

  }, 500);

}


/* SEND BUTTON */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* ENTER KEY */

input.addEventListener(
  "keydown",

  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* ATTACH FILE */

attachButton.addEventListener(
  "click",

  () => {

    fileInput.click();

  }
);


fileInput.addEventListener(
  "change",

  () => {

    selectedFile =
      fileInput.files[0] || null;


    if (selectedFile) {

      attachmentName.textContent =
        `Attached: ${selectedFile.name}`;


      attachmentName.classList.add("show");

    } else {

      attachmentName.textContent = "";


      attachmentName.classList.remove("show");

    }

  }
);


/* NEW CHAT */

newChatButton.addEventListener(
  "click",

  () => {

    chat.innerHTML = `

      <div class="welcome">

        <h1>
          New conversation
        </h1>

        <p>
          What would you like to work on?
        </p>

      </div>

    `;


    selectedFile = null;


    fileInput.value = "";


    attachmentName.textContent = "";


    attachmentName.classList.remove("show");


    input.focus();


    if (
      window.innerWidth <= 800
    ) {

      sidebar.classList.remove("open");

    }

  }
);


/* MOBILE MENU */

menuButton.addEventListener(
  "click",

  () => {

    sidebar.classList.toggle("open");

  }
);


/* CLOSE MENU */

document.addEventListener(
  "click",

  (event) => {

    if (

      window.innerWidth <= 800 &&

      sidebar.classList.contains("open") &&

      !sidebar.contains(event.target) &&

      !menuButton.contains(event.target)

    ) {

      sidebar.classList.remove("open");

    }

  }
);
