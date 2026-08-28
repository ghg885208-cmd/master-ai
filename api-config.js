/* =========================================
   MASTER AI — API CONFIGURATION
   ========================================= */

// Active API provider
const MASTER_API_CONFIG = {
  activeProvider: "deepseek",

  providers: {

    deepseek: {
      name: "DeepSeek",
      enabled: true,
      apiUrl: "https://api.deepseek.com/chat/completions",
      model: "deepseek-chat",

      /*
       IMPORTANT:
       API key अभी यहाँ मत डालना।
       GitHub Pages पर यह file public हो सकती है.

       बाद में secure API system / backend जोड़ेंगे।
      */
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

      // भविष्य में कोई भी नया API provider जोड़ सकते हैं
      apiUrl: "",
      model: "",
      apiKey: ""
    }
  },

  // भविष्य के MASTER modes
  modes: {
    normal: true,
    mastermind: true,
    creative: true,
    coding: true,
    analysis: true
  },

  // Future modules
  modules: {
    deviceHub: true,
    automationCenter: true,
    threeD: true,
    editor: true,
    attachments: true,
    projects: true,
    memory: true
  }
};


// आसान access के लिए
window.MASTER_API_CONFIG = MASTER_API_CONFIG;
