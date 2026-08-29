/* =========================================
   MASTER AI — API CONFIG
   Single source of truth for provider metadata.
   NEVER put a real secret key literal in this file.
   The user's key lives only in localStorage, set via Settings UI.
========================================= */

const MASTER_API_CONFIG = {

  providers: {
    deepseek: {
      label: "DeepSeek",
      url: "https://api.deepseek.com/chat/completions",
      defaultModel: "deepseek-chat"
    },
    openai: {
      label: "OpenAI",
      url: "https://api.openai.com/v1/chat/completions",
      defaultModel: "gpt-4o-mini"
    },
    gemini: {
      label: "Google Gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      defaultModel: "gemini-2.0-flash"
    },
    custom: {
      label: "Custom API",
      url: "",
      defaultModel: ""
    }
  },

  STORAGE_KEY: "master_ai_provider_config",

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("MASTER_API_CONFIG: could not read stored config", e);
    }
    const fallback = this.providers.deepseek;
    return {
      provider: "deepseek",
      url: fallback.url,
      model: fallback.defaultModel,
      apiKey: ""
    };
  },

  save(cfg) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cfg));
      return true;
    } catch (e) {
      console.warn("MASTER_API_CONFIG: could not save config", e);
      return false;
    }
  },

  clearKey() {
    const cfg = this.load();
    cfg.apiKey = "";
    this.save(cfg);
  }

};

/*
  SECURITY NOTE (do not remove):
  This prototype calls the AI provider directly from the browser using
  the key stored in localStorage. That means the key is visible to
  anyone with access to this browser/device and is sent directly from
  the client on every request. This is acceptable ONLY for a private,
  personal prototype you control.

  [NEEDS BACKEND] For real production use (shared devices, public
  hosting, mobile app store release), replace the direct fetch in
  app.js with a call to your own backend endpoint, and move the
  provider API key into that backend's environment variables/secrets.
  The frontend should then never see the real key at all.
*/
