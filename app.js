/* =========================================
   MASTER AI — MAIN APPLICATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================
     ELEMENTS
  ======================================= */

  const chat =
    document.getElementById("chat");

  const messageInput =
    document.getElementById("messageInput");

  const sendButton =
    document.getElementById("sendButton");

  const newChatButton =
    document.getElementById("newChatButton");

  const menuButton =
    document.getElementById("menuButton");

  const sidebar =
    document.getElementById("sidebar");

  const settingsButton =
    document.getElementById("settingsButton");

  const settingsModal =
    document.getElementById("settingsModal");

  const closeSettingsButton =
    document.getElementById(
      "closeSettingsButton"
    );

  const providerSelect =
    document.getElementById("providerSelect");

  const providerApiKey =
    document.getElementById(
      "providerApiKey"
    );

  const providerEndpoint =
    document.getElementById(
      "providerEndpoint"
    );

  const providerModel =
    document.getElementById(
      "providerModel"
    );

  const saveProviderButton =
    document.getElementById(
      "saveProviderButton"
    );

  const settingsStatus =
    document.getElementById(
      "settingsStatus"
    );

  const attachButton =
    document.getElementById(
      "attachButton"
    );

  const fileInput =
    document.getElementById(
      "fileInput"
    );

  const attachmentName =
    document.getElementById(
      "attachmentName"
    );

  const historyList =
    document.getElementById(
      "historyList"
    );

  const createProjectButton =
    document.getElementById(
      "createProjectButton"
    );

  const projectModal =
    document.getElementById(
      "projectModal"
    );

  const projectNameInput =
    document.getElementById(
      "projectNameInput"
    );

  const cancelProjectButton =
    document.getElementById(
      "cancelProjectButton"
    );

  const confirmProjectButton =
    document.getElementById(
      "confirmProjectButton"
    );

  const projectList =
    document.getElementById(
      "projectList"
    );


  /* =======================================
     STATE
  ======================================= */

  let selectedFiles = [];

  let conversation = [];


  /* =======================================
     SYSTEM PROMPT
  ======================================= */

  const MASTER_SYSTEM_PROMPT = `
You are MASTER, a personal AI workspace.

Your capabilities currently include:
- conversation
- analysis
- coding assistance
- planning
- creative work
- project assistance
- decision analysis

MASTER has a special Mastermind approach.

When the user asks for an important decision,
analyze:

1. The user's goal
2. Available options
3. Advantages
4. Disadvantages
5. Risks
6. Consequences
7. Alternative possibilities
8. Short-term effects
9. Long-term effects
10. What happens if the user chooses nothing
11. What information is missing
12. A practical recommendation

Do not pretend that unavailable modules such as
full device control, 3D generation, camera access,
or phone automation are currently active.

Be honest about what is actually possible.
  `.trim();


  /* =======================================
     WELCOME
  ======================================= */

  function removeWelcome() {

    const welcome =
      document.querySelector(".welcome");

    if (welcome) {
      welcome.remove();
    }

  }


  /* =======================================
     MESSAGE UI
  ======================================= */

  function addMessage(
    text,
    sender
  ) {

    removeWelcome();

    const message =
      document.createElement("div");

    message.className =
      `message ${sender}`;

    if (sender === "master") {

      const title =
        document.createElement("strong");

      title.textContent =
        "MASTER";

      message.appendChild(title);

      message.appendChild(
        document.createElement("br")
      );

    }


    const content =
      document.createElement("div");

    content.textContent = text;

    message.appendChild(content);


    chat.appendChild(message);

    chat.scrollTop =
      chat.scrollHeight;


    return message;

  }


  function addLoadingMessage() {

    const message =
      document.createElement("div");

    message.className =
      "message master loading-message";

    message.textContent =
      "MASTER is thinking...";

    chat.appendChild(message);

    chat.scrollTop =
      chat.scrollHeight;


    return message;

  }


  /* =======================================
     SETTINGS
  ======================================= */

  function openSettings() {

    if (!settingsModal) {
      return;
    }


    if (
      typeof window.loadMasterApiConfig ===
      "function"
    ) {

      window.loadMasterApiConfig();

    }


    loadProviderIntoSettings();


    settingsModal.classList.add(
      "show"
    );

  }


  function closeSettings() {

    if (!settingsModal) {
      return;
    }


    settingsModal.classList.remove(
      "show"
    );

  }


  function loadProviderIntoSettings() {

    if (
      !window.MASTER_API_CONFIG
    ) {
      return;
    }


    const config =
      window.MASTER_API_CONFIG;


    const providerId =
      config.activeProvider;


    const provider =
      config.providers[
        providerId
      ];


    if (!provider) {
      return;
    }


    providerSelect.value =
      providerId;

    providerApiKey.value =
      provider.apiKey || "";

    providerEndpoint.value =
      provider.apiUrl || "";

    providerModel.value =
      provider.model || "";

  }


  function saveProviderSettings() {

    if (
      !window.MASTER_API_CONFIG
    ) {

      showSettingsStatus(
        "API configuration file was not loaded."
      );

      return;

    }


    const providerId =
      providerSelect.value;


    if (
      !window.MASTER_API_CONFIG
        .providers[providerId]
    ) {

      showSettingsStatus(
        "Unknown provider."
      );

      return;

    }


    if (
      typeof window.setActiveProvider ===
      "function"
    ) {

      window.setActiveProvider(
        providerId
      );

    }


    if (
      typeof window.updateProvider ===
      "function"
    ) {

      window.updateProvider(
        providerId,
        {

          apiKey:
            providerApiKey.value.trim(),

          apiUrl:
            providerEndpoint.value.trim(),

          model:
            providerModel.value.trim()

        }
      );

    }


    if (
      typeof window.saveMasterApiConfig ===
      "function"
    ) {

      window.saveMasterApiConfig();

    }


    showSettingsStatus(
      "Provider saved successfully."
    );

  }


  function showSettingsStatus(
    text
  ) {

    if (!settingsStatus) {
      return;
    }


    settingsStatus.textContent =
      text;


    setTimeout(() => {

      if (
        settingsStatus.textContent === text
      ) {

        settingsStatus.textContent =
          "";

      }

    }, 3000);

  }


  /* =======================================
     PROVIDER CHANGE
  ======================================= */

  function changeProvider() {

    const providerId =
      providerSelect.value;


    if (
      !window.MASTER_API_CONFIG
    ) {
      return;
    }


    const provider =
      window.MASTER_API_CONFIG
        .providers[
          providerId
        ];


    if (!provider) {
      return;
    }


    providerApiKey.value =
      provider.apiKey || "";

    providerEndpoint.value =
      provider.apiUrl || "";

    providerModel.value =
      provider.model || "";


    if (
      providerId === "deepseek" &&
      !providerEndpoint.value
    ) {

      providerEndpoint.value =
        "https://api.deepseek.com/chat/completions";

    }


    if (
      providerId === "deepseek" &&
      !providerModel.value
    ) {

      providerModel.value =
        "deepseek-v4-flash";

    }

  }


  /* =======================================
     API CALL
  ======================================= */

  async function askAI(
    userMessage
  ) {

    if (
      !window.MASTER_API_CONFIG
    ) {

      throw new Error(
        "api-config.js was not loaded."
      );

    }


    const provider =
      window.getActiveProvider
        ? window.getActiveProvider()
        : window.MASTER_API_CONFIG
            .providers[
              window.MASTER_API_CONFIG
                .activeProvider
            ];


    if (!provider) {

      throw new Error(
        "No active AI provider."
      );

    }


    if (!provider.apiKey) {

      throw new Error(
        "No API key saved. Open Settings and add your API key."
      );

    }


    if (!provider.apiUrl) {

      throw new Error(
        "No API endpoint saved."
      );

    }


    if (!provider.model) {

      throw new Error(
        "No AI model selected."
      );

    }


    const messages = [

      {
        role: "system",

        content:
          MASTER_SYSTEM_PROMPT
      },


      ...conversation,

      {
        role: "user",

        content:
          userMessage
      }

    ];


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
            JSON.stringify({

              model:
                provider.model,

              messages:
                messages,

              temperature:
                0.7,

              stream:
                false

            })

        }
      );


    if (!response.ok) {

      let errorText =
        `API error: ${response.status}`;


      try {

        const errorData =
          await response.json();


        errorText =
          errorData?.error?.message ||
          errorText;

      } catch (error) {

        /* Ignore JSON parse error */

      }


      throw new Error(
        errorText
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


  /* =======================================
     SEND MESSAGE
  ======================================= */

  async function sendMessage() {

    const text =
      messageInput.value.trim();


    if (!text) {
      return;
    }


    addMessage(
      text,
      "user"
    );


    conversation.push({

      role: "user",

      content: text

    });


    saveHistoryItem(
      text
    );


    messageInput.value =
      "";


    const loading =
      addLoadingMessage();


    sendButton.disabled =
      true;


    try {

      const answer =
        await askAI(
          text
        );


      loading.remove();


      addMessage(
        answer,
        "master"
      );


      conversation.push({

        role: "assistant",

        content: answer

      });


    } catch (error) {

      loading.remove();


      addMessage(

        `Error: ${error.message}`,

        "master"

      );

    } finally {

      sendButton.disabled =
        false;

      messageInput.focus();

    }

  }


  /* =======================================
     NEW CHAT
  ======================================= */

  function newChat() {

    conversation = [];


    selectedFiles = [];


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


    updateAttachmentDisplay();


    messageInput.value =
      "";


    messageInput.focus();

  }


  /* =======================================
     FILE ATTACHMENTS
  ======================================= */

  function updateAttachmentDisplay() {

    if (!attachmentName) {
      return;
    }


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


    const names =
      selectedFiles
        .map(
          file => file.name
        )
        .join(", ");


    attachmentName.textContent =
      `${selectedFiles.length} file(s): ${names}`;


    attachmentName.classList.add(
      "show"
    );

  }


  function handleFiles(
    files
  ) {

    const newFiles =
      Array.from(files);


    selectedFiles = [

      ...selectedFiles,

      ...newFiles

    ];


    updateAttachmentDisplay();

  }


  /* =======================================
     HISTORY
  ======================================= */

  function saveHistoryItem(
    text
  ) {

    if (!historyList) {
      return;
    }


    const item =
      document.createElement(
        "button"
      );


    item.type =
      "button";


    item.className =
      "history-item";


    item.textContent =
      text.length > 45
        ? `${text.slice(0, 45)}...`
        : text;


    item.addEventListener(
      "click",
      () => {

        messageInput.value =
          text;

        messageInput.focus();

      }
    );


    historyList.prepend(
      item
    );

  }


  /* =======================================
     PROJECTS
  ======================================= */

  function openProjectModal() {

    if (!projectModal) {
      return;
    }


    projectModal.classList.add(
      "show"
    );


    projectNameInput.focus();

  }


  function closeProjectModal() {

    if (!projectModal) {
      return;
    }


    projectModal.classList.remove(
      "show"
    );

  }


  function createProject() {

    const name =
      projectNameInput.value.trim();


    if (!name) {
      return;
    }


    const project =
      document.createElement(
        "button"
      );


    project.type =
      "button";


    project.className =
      "project-item";


    project.textContent =
      name;


    projectList.appendChild(
      project
    );


    projectNameInput.value =
      "";


    closeProjectModal();

  }


  /* =======================================
     EVENT LISTENERS
  ======================================= */

  if (sendButton) {

    sendButton.addEventListener(
      "click",
      sendMessage
    );

  }


  if (messageInput) {

    messageInput.addEventListener(

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


  if (newChatButton) {

    newChatButton.addEventListener(
      "click",
      newChat
    );

  }


  if (menuButton) {

    menuButton.addEventListener(

      "click",

      () => {

        sidebar.classList.toggle(
          "open"
        );

      }

    );

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


  if (saveProviderButton) {

    saveProviderButton.addEventListener(
      "click",
      saveProviderSettings
    );

  }


  if (providerSelect) {

    providerSelect.addEventListener(
      "change",
      changeProvider
    );

  }


  if (attachButton) {

    attachButton.addEventListener(

      "click",

      () => {

        fileInput.click();

      }

    );

  }


  if (fileInput) {

    fileInput.addEventListener(

      "change",

      event => {

        handleFiles(
          event.target.files
        );

      }

    );

  }


  if (createProjectButton) {

    createProjectButton.addEventListener(
      "click",
      openProjectModal
    );

  }


  if (cancelProjectButton) {

    cancelProjectButton.addEventListener(
      "click",
      closeProjectModal
    );

  }


  if (confirmProjectButton) {

    confirmProjectButton.addEventListener(
      "click",
      createProject
    );

  }


  /* Close modals on outside click */

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


  if (projectModal) {

    projectModal.addEventListener(

      "click",

      event => {

        if (
          event.target ===
          projectModal
        ) {

          closeProjectModal();

        }

      }

    );

  }


  console.log(
    "MASTER AI loaded successfully."
  );

});
