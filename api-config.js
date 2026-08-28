/* =========================================
   MASTER AI — API CONFIGURATION
   Multi-Provider + Future Ready
========================================= */

const MASTER_API_CONFIG = {

  /* ---------------------------------------
     ACTIVE PROVIDER
  --------------------------------------- */

  activeProvider: "deepseek",


  /* ---------------------------------------
     API PROVIDERS
  --------------------------------------- */

  providers: {

    deepseek: {
      id: "deepseek",
      name: "DeepSeek",
      enabled: true,

      apiUrl:
        "https://api.deepseek.com/chat/completions",

      model:
        "deepseek-v4-flash",

      apiKey: ""
    },


    openai: {
      id: "openai",
      name: "OpenAI",
      enabled: true,

      apiUrl: "",

      model: "",

      apiKey: ""
    },


    gemini: {
      id: "gemini",
      name: "Google Gemini",
      enabled: true,

      apiUrl: "",

      model: "",

      apiKey: ""
    },


    claude: {
      id: "claude",
      name: "Claude",
      enabled: true,

      apiUrl: "",

      model: "",

      apiKey: ""
    },


    custom: {
      id: "custom",
      name: "Custom API",
      enabled: true,

      apiUrl: "",

      model: "",

      apiKey: ""
    }

  },


  /* ---------------------------------------
     MASTER MODES
  --------------------------------------- */

  modes: {

    normal: {
      enabled: true,
      name: "Normal"
    },

    mastermind: {
      enabled: true,
      name: "Mastermind"
    },

    creative: {
      enabled: true,
      name: "Creative"
    },

    coding: {
      enabled: true,
      name: "Coding"
    },

    analysis: {
      enabled: true,
      name: "Analysis"
    },

    planning: {
      enabled: true,
      name: "Planning"
    }

  },


  /* ---------------------------------------
     FUTURE MODULES
  --------------------------------------- */

  modules: {

    /* Chat */

    chat: true,

    memory: true,

    conversationHistory: true,


    /* Files */

    attachments: true,

    multipleAttachments: true,

    fileAnalysis: true,


    /* Projects */

    projects: true,

    workspace: true,


    /* AI */

    multiProvider: true,

    modelSwitcher: true,

    apiManager: true,


    /* Mastermind */

    mastermind: true,

    deepAnalysis: true,

    decisionAnalysis: true,

    possibilities: true,

    consequences: true,

    alternatives: true,

    futureScenarios: true,


    /* Creative */

    imageGeneration: false,

    editing: true,


    /* 3D */

    threeD: true,

    threeDModeling: true,

    threeDPreview: true,


    /* Device Hub */

    deviceHub: true,

    automationCenter: true,

    deviceControl: false,


    /* Preview */

    preview: true,

    livePreview: true

  },


  /* ---------------------------------------
     MASTER SYSTEM
  --------------------------------------- */

  system: {

    name: "MASTER",

    version: "1.0.0",

    personalAI: true,

    adminMode: true

  }

};


/* =========================================
   API STORAGE
========================================= */

const MASTER_STORAGE_KEY =
  "MASTER_AI_PROVIDER_CONFIG";


function saveMasterApiConfig() {

  try {

    localStorage.setItem(

      MASTER_STORAGE_KEY,

      JSON.stringify({
        activeProvider:
          MASTER_API_CONFIG.activeProvider,

        providers:
          MASTER_API_CONFIG.providers
      })

    );

    return true;

  } catch (error) {

    console.error(
      "MASTER API config save failed:",
      error
    );

    return false;
  }

}


function loadMasterApiConfig() {

  try {

    const saved =
      localStorage.getItem(
        MASTER_STORAGE_KEY
      );


    if (!saved) {

      return false;
    }


    const data =
      JSON.parse(saved);


    if (data.activeProvider) {

      MASTER_API_CONFIG.activeProvider =
        data.activeProvider;
    }


    if (data.providers) {

      Object.keys(
        data.providers
      ).forEach((providerId) => {

        if (
          MASTER_API_CONFIG.providers[
            providerId
          ]
        ) {

          Object.assign(

            MASTER_API_CONFIG.providers[
              providerId
            ],

            data.providers[
              providerId
            ]

          );

        }

      });

    }


    return true;

  } catch (error) {

    console.error(
      "MASTER API config load failed:",
      error
    );

    return false;
  }

}


/* =========================================
   PROVIDER HELPERS
========================================= */

function getActiveProvider() {

  return MASTER_API_CONFIG.providers[
    MASTER_API_CONFIG.activeProvider
  ];

}


function setActiveProvider(
  providerId
) {

  if (
    !MASTER_API_CONFIG.providers[
      providerId
    ]
  ) {

    return false;

  }


  MASTER_API_CONFIG.activeProvider =
    providerId;


  saveMasterApiConfig();


  return true;
}


function updateProvider(
  providerId,
  data
) {

  if (
    !MASTER_API_CONFIG.providers[
      providerId
    ]
  ) {

    return false;

  }


  Object.assign(

    MASTER_API_CONFIG.providers[
      providerId
    ],

    data

  );


  saveMasterApiConfig();


  return true;
}


/* =========================================
   ADD NEW PROVIDER
   Future API expansion
========================================= */

function addProvider(
  providerId,
  providerData
) {

  if (
    !providerId ||
    typeof providerData !== "object"
  ) {

    return false;

  }


  MASTER_API_CONFIG.providers[
    providerId
  ] = {

    id: providerId,

    name:
      providerData.name ||
      providerId,

    enabled:
      providerData.enabled ??
      true,

    apiUrl:
      providerData.apiUrl ||
      "",

    model:
      providerData.model ||
      "",

    apiKey:
      providerData.apiKey ||
      ""

  };


  saveMasterApiConfig();


  return true;
}


/* =========================================
   GLOBAL ACCESS
========================================= */

window.MASTER_API_CONFIG =
  MASTER_API_CONFIG;


window.saveMasterApiConfig =
  saveMasterApiConfig;


window.loadMasterApiConfig =
  loadMasterApiConfig;


window.getActiveProvider =
  getActiveProvider;


window.setActiveProvider =
  setActiveProvider;


window.updateProvider =
  updateProvider;


window.addProvider =
  addProvider;


/* =========================================
   LOAD SAVED CONFIG
========================================= */

loadMasterApiConfig();
