/* =========================================
   MASTER AI — API CONFIG
   Supports MULTIPLE provider profiles so more than one AI can be
   queried in the background. Single-source-of-truth for provider
   metadata. NEVER put a real secret key literal in this file.
   Keys live only in localStorage, set via Settings UI.
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
      defaultModel: "gemini-3.6-flash"
    },
    custom: {
      label: "Custom API",
      url: "",
      defaultModel: ""
    }
  },

  // Google/OpenAI deprecate model names over time. Instead of you having to
  // manually fix this every few months, old saved model names are silently
  // upgraded to the current one when profiles are loaded.
  MODEL_ALIASES: {
    "gemini-2.0-flash": "gemini-3.6-flash",
    "gemini-2.5-flash": "gemini-3.6-flash",
    "gemini-pro": "gemini-3.6-flash"
  },

  OLD_STORAGE_KEY: "master_ai_provider_config",   // legacy single-profile key
  PROFILES_KEY: "master_ai_provider_profiles",     // new multi-profile key

  /* ---------- multi-profile API ---------- */

  loadProfiles() {
    try {
      const raw = localStorage.getItem(this.PROFILES_KEY);
      if (raw) {
        const profiles = JSON.parse(raw);
        return this._migrateModelNames(profiles);
      }
    } catch (e) {
      console.warn("MASTER_API_CONFIG: could not read profiles", e);
    }

    // Migrate an old single-config save into the new list format, once.
    const legacy = this._loadLegacySingle();
    if (legacy && legacy.apiKey) {
      const migrated = [{
        id: "migrated_" + Date.now(),
        provider: legacy.provider,
        label: this.providers[legacy.provider]?.label || legacy.provider,
        url: legacy.url,
        model: legacy.model,
        apiKey: legacy.apiKey,
        enabled: true
      }];
      this.saveProfiles(migrated);
      return migrated;
    }

    return [];
  },

  saveProfiles(profiles) {
    try {
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
      return true;
    } catch (e) {
      console.warn("MASTER_API_CONFIG: could not save profiles", e);
      return false;
    }
  },

  addProfile(profile) {
    const profiles = this.loadProfiles();
    profiles.push({
      id: "p_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      enabled: true,
      ...profile
    });
    this.saveProfiles(profiles);
    return profiles;
  },

  removeProfile(id) {
    const profiles = this.loadProfiles().filter(p => p.id !== id);
    this.saveProfiles(profiles);
    return profiles;
  },

  toggleProfile(id, enabled) {
    const profiles = this.loadProfiles();
    const target = profiles.find(p => p.id === id);
    if (target) target.enabled = enabled;
    this.saveProfiles(profiles);
    return profiles;
  },

  getEnabledProfiles() {
    // Every added provider with a key runs automatically, always —
    // no per-session toggling needed.
    return this.loadProfiles().filter(p => p.apiKey && p.url);
  },

  clearAllKeys() {
    this.saveProfiles([]);
    try { localStorage.removeItem(this.OLD_STORAGE_KEY); } catch {}
  },

  /* ---------- legacy single-config read (for migration only) ---------- */

  _loadLegacySingle() {
    try {
      const raw = localStorage.getItem(this.OLD_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  _migrateModelNames(profiles) {
    let changed = false;
    profiles.forEach(p => {
      if (this.MODEL_ALIASES[p.model]) {
        p.model = this.MODEL_ALIASES[p.model];
        changed = true;
      }
    });
    if (changed) this.saveProfiles(profiles);
    return profiles;
  }

};

/*
  SECURITY NOTE (do not remove):
  This prototype calls AI providers directly from the browser using
  keys stored in localStorage. That means every key is visible to
  anyone with access to this browser/device and is sent directly from
  the client on every request. This is acceptable ONLY for a private,
  personal prototype you control.

  [NEEDS BACKEND] For real production use (shared devices, public
  hosting, mobile app store release), replace the direct fetches in
  app.js with calls to your own backend endpoint, and move provider
  API keys into that backend's environment variables/secrets. The
  frontend should then never see any real key at all.
*/

