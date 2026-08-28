const input = document.querySelector("input");
const sendButton = document.querySelector(".send");
const chat = document.querySelector(".chat");
const newChatButton = document.querySelector(".new-chat");

function addMessage(text, sender) {
  const message = document.createElement("div");

  message.style.maxWidth = "700px";
  message.style.margin = "15px auto";
  message.style.padding = "14px 16px";
  message.style.borderRadius = "12px";
  message.style.lineHeight = "1.5";

  if (sender === "user") {
    message.style.background = "#27272b";
    message.style.textAlign = "right";
  } else {
    message.style.background = "#18181b";
    message.innerHTML = "<strong>MASTER</strong><br>" + text;
  }

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  const welcome = document.querySelector(".welcome");

  if (welcome) {
    welcome.remove();
  }

  addMessage(text, "user");

  input.value = "";

  setTimeout(() => {
    addMessage(
      "I'm currently running in prototype mode. AI responses will be connected in the next phase.",
      "master"
    );
  }, 500);
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

newChatButton.addEventListener("click", () => {
  chat.innerHTML = `
    <div class="welcome">
      <h1>New conversation</h1>
      <p>What would you like to work on?</p>
    </div>
  `;

  input.focus();
});
