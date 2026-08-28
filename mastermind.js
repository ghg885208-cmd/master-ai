/* =========================================
   MASTER AI — MASTERMIND + MEMORY + VOICE
   File: mastermind.js
========================================= */

"use strict";

const MASTER_AI_ENGINE = {

  /* =====================================
     SYSTEM MODES
  ===================================== */

  modes: {
    conversation: true,
    analysis: true,
    mastermind: true,
    creative: true,
    coding: true,
    planning: true,
    problemSolving: true,
    futureThinking: true,
    attachmentAnalysis: true,
    memory: true,
    preview: true,
    voice: true
  },


  /* =====================================
     MEMORY
  ===================================== */

  memoryKey: "master_ai_memory",

  getMemory() {
    try {
      return JSON.parse(
        localStorage.getItem(this.memoryKey)
      ) || this.getEmptyMemory();
    } catch {
      return this.getEmptyMemory();
    }
  },


  getEmptyMemory() {
    return {
      user: {},
      facts: [],
      preferences: [],
      projects: [],
      conversations: []
    };
  },


  saveMemory(memory) {
    try {
      localStorage.setItem(
        this.memoryKey,
        JSON.stringify(memory)
      );
    } catch (error) {
      console.warn(
        "MASTER memory save failed:",
        error
      );
    }
  },


  remember(type, value) {

    const memory =
      this.getMemory();

    if (!memory[type]) {
      memory[type] = [];
    }


    if (Array.isArray(memory[type])) {

      const exists =
        memory[type].some(item =>
          JSON.stringify(item) ===
          JSON.stringify(value)
        );

      if (!exists) {

        memory[type].push(value);

        /*
          Memory limit:
          Browser storage ko unnecessarily
          fill hone se bachata hai.
        */

        if (
          memory[type].length > 100
        ) {
          memory[type] =
            memory[type].slice(-100);
        }

      }

    } else {

      memory[type] = value;

    }


    this.saveMemory(memory);
  },


  clearMemory() {

    try {

      localStorage.removeItem(
        this.memoryKey
      );

      return true;

    } catch {

      return false;

    }

  },


  /* =====================================
     MEMORY ANALYSIS
  ===================================== */

  analyseForMemory(text) {

    if (
      typeof text !== "string"
    ) return;


    const lower =
      text.toLowerCase().trim();


    /* NAME */

    if (
      lower.includes("mera naam") ||
      lower.includes("my name")
    ) {

      this.remember(
        "facts",
        {
          type: "identity",
          value: text,
          time: Date.now()
        }
      );

    }


    /* LIKES */

    if (
      lower.includes("mujhe pasand") ||
      lower.includes("i like") ||
      lower.includes("i love") ||
      lower.includes("mujhe achha lagta")
    ) {

      this.remember(
        "preferences",
        {
          value: text,
          time: Date.now()
        }
      );

    }


    /* PROJECTS */

    if (
      lower.includes("mera project") ||
      lower.includes("my project") ||
      lower.includes("website bana") ||
      lower.includes("app bana")
    ) {

      this.remember(
        "projects",
        {
          value: text,
          time: Date.now()
        }
      );

    }


    /* GENERAL FACTS */

    if (
      lower.includes("main ") ||
      lower.includes("i am ") ||
      lower.includes("i'm ")
    ) {

      this.remember(
        "facts",
        {
          type: "user_statement",
          value: text,
          time: Date.now()
        }
      );

    }

  },


  /* =====================================
     MEMORY CONTEXT
  ===================================== */

  getMemoryContext() {

    const memory =
      this.getMemory();

    const parts = [];


    if (
      memory.facts &&
      memory.facts.length
    ) {

      parts.push(
        "REMEMBERED FACTS:\n" +

        memory.facts
          .slice(-20)
          .map(
            item =>
              item.value || ""
          )
          .join("\n")
      );

    }


    if (
      memory.preferences &&
      memory.preferences.length
    ) {

      parts.push(
        "USER PREFERENCES:\n" +

        memory.preferences
          .slice(-20)
          .map(
            item =>
              item.value || ""
          )
          .join("\n")
      );

    }


    if (
      memory.projects &&
      memory.projects.length
    ) {

      parts.push(
        "USER PROJECTS:\n" +

        memory.projects
          .slice(-15)
          .map(
            item =>
              item.value || ""
          )
          .join("\n")
      );

    }


    return parts.join("\n\n");

  },


  /* =====================================
     MASTERMIND INSTRUCTIONS
  ===================================== */

  createMastermindInstructions() {

    return `

MASTERMIND SYSTEM IS ACTIVE.

Before answering:

1. Understand what the user actually wants.
2. Identify the real problem.
3. Check assumptions.
4. Look for missing information.
5. Consider multiple possibilities.
6. Compare useful options.
7. Consider short-term consequences.
8. Consider long-term consequences.
9. Identify important risks.
10. Do not pretend certainty.
11. Give a practical recommendation.

FOR DECISIONS:

Analyse:

- Option A
- Option B
- Other useful options
- What happens if the user chooses each option
- What happens if the user chooses nothing
- Short-term effects
- Long-term effects
- Risks
- Benefits

Do not expose hidden chain-of-thought.

Instead provide:

- Key considerations
- Clear comparison
- Important risks
- Final recommendation

`;

  },


  /* =====================================
     MAIN SYSTEM PROMPT
  ===================================== */

  buildSystemPrompt() {

    const memory =
      this.getMemoryContext();


    return `

You are MASTER AI.

You are a personal AI workspace.

All capabilities work together
simultaneously.

ACTIVE CAPABILITIES:

- Conversation
- Deep analysis
- Mastermind decision support
- Problem solving
- Creative thinking
- Planning
- Coding support
- Project analysis
- Future consequence analysis
- Attachment awareness
- Memory context
- Clear explanations

IMPORTANT:

Do not unnecessarily announce modes.

Do not pretend that multiple external
AI providers answered unless the system
actually called them.

Do not claim actions were completed
unless they were actually completed.

Your answers should be:

- Accurate
- Clear
- Direct
- Useful
- Honest about uncertainty

LANGUAGE:

The user may speak:

- Hindi
- Hinglish
- English

Reply naturally in the user's language.

${this.createMastermindInstructions()}

USER MEMORY CONTEXT:

${memory || "No saved user memory yet."}

`;

  },


  /* =====================================
     REQUEST ANALYSIS
  ===================================== */

  analyseRequest(text) {

    const lower =
      String(text)
        .toLowerCase();


    return {

      wantsDecision:

        lower.includes("option") ||
        lower.includes("choose") ||
        lower.includes("kya hoga") ||
        lower.includes("kaunsa") ||
        lower.includes("which"),


      wantsCoding:

        lower.includes("code") ||
        lower.includes("javascript") ||
        lower.includes("html") ||
        lower.includes("css") ||
        lower.includes("python") ||
        lower.includes("bug"),


      wantsPlanning:

        lower.includes("plan") ||
        lower.includes("future") ||
        lower.includes("roadmap") ||
        lower.includes("strategy"),


      wantsCreative:

        lower.includes("idea") ||
        lower.includes("creative") ||
        lower.includes("design"),


      wantsAnalysis: true

    };

  },


  /* =====================================
     PREPARE MESSAGE
  ===================================== */

  prepareMessage(text) {

    this.analyseForMemory(
      text
    );


    const analysis =
      this.analyseRequest(
        text
      );


    /*
      Recent conversation memory.
    */

    this.remember(
      "conversations",
      {
        role: "user",
        content: text,
        time: Date.now()
      }
    );


    return {

      text,

      analysis,

      timestamp:
        new Date()
          .toISOString()

    };

  },


  /* =====================================
     API MESSAGE BUILDER
  ===================================== */

  buildMessages(
    history,
    userText
  ) {

    const prepared =
      this.prepareMessage(
        userText
      );


    const systemPrompt =
      this.buildSystemPrompt();


    const messages = [

      {
        role: "system",
        content: systemPrompt
      }

    ];


    if (
      Array.isArray(history)
    ) {

      history
        .slice(-30)
        .forEach(message => {

          if (
            !message ||
            !message.content
          ) return;


          messages.push({

            role:

              message.role ===
              "assistant"

                ? "assistant"

                : "user",


            content:
              String(
                message.content
              )

          });

        });

    }


    messages.push({

      role: "user",

      content:
        prepared.text

    });


    return messages;

  },


  /* =====================================
     SAVE AI RESPONSE
  ===================================== */

  rememberAssistantResponse(text) {

    if (
      !text ||
      typeof text !== "string"
    ) return;


    this.remember(
      "conversations",
      {
        role: "assistant",
        content: text,
        time: Date.now()
      }
    );

  },


  /* =====================================
     VOICE SYSTEM
  ===================================== */

  voice: {

    recognition: null,

    isListening: false,

    isSpeaking: false,

    supported:
      false,


    init() {

      const Recognition =

        window.SpeechRecognition ||

        window.webkitSpeechRecognition;


      if (!Recognition) {

        console.warn(
          "Speech recognition not supported."
        );

        this.supported = false;

        return false;

      }


      this.recognition =
        new Recognition();


      this.recognition.continuous =
        false;


      this.recognition.interimResults =
        true;


      this.recognition.lang =
        "hi-IN";


      this.recognition.maxAlternatives =
        1;


      this.recognition.onstart =
        () => {

          this.isListening =
            true;


          document.dispatchEvent(

            new CustomEvent(
              "masterVoiceStart"
            )

          );

        };


      this.recognition.onresult =
        event => {

          let finalText = "";

          let interimText = "";


          for (

            let i =
              event.resultIndex;

            i <
              event.results.length;

            i++

          ) {

            const result =
              event.results[i];


            const transcript =
              result[0].transcript;


            if (
              result.isFinal
            ) {

              finalText +=
                transcript;

            } else {

              interimText +=
                transcript;

            }

          }


          document.dispatchEvent(

            new CustomEvent(

              "masterVoiceResult",

              {

                detail: {

                  finalText,

                  interimText

                }

              }

            )

          );


          if (
            finalText.trim()
          ) {

            document.dispatchEvent(

              new CustomEvent(

                "masterVoiceFinal",

                {

                  detail: {

                    text:
                      finalText.trim()

                  }

                }

              )

            );

          }

        };


      this.recognition.onerror =
        event => {

          this.isListening =
            false;


          document.dispatchEvent(

            new CustomEvent(

              "masterVoiceError",

              {

                detail: {

                  error:
                    event.error

                }

              }

            )

          );

        };


      this.recognition.onend =
        () => {

          this.isListening =
            false;


          document.dispatchEvent(

            new CustomEvent(
              "masterVoiceEnd"
            )

          );

        };


      this.supported =
        true;


      return true;

    },


    startListening(
      language = "hi-IN"
    ) {

      if (
        !this.recognition
      ) {

        this.init();

      }


      if (
        !this.recognition
      ) {

        return false;

      }


      if (
        this.isListening
      ) {

        return true;

      }


      try {

        this.recognition.lang =
          language;


        this.recognition.start();


        return true;

      } catch (
        error
      ) {

        console.warn(
          error
        );

        return false;

      }

    },


    stopListening() {

      if (
        this.recognition &&
        this.isListening
      ) {

        try {

          this.recognition.stop();

        } catch (
          error
        ) {

          console.warn(
            error
          );

        }

      }

    },


    speak(
      text,
      options = {}
    ) {

      if (
        !(
          "speechSynthesis" in
          window
        )
      ) {

        return false;

      }


      window.speechSynthesis.cancel();


      const utterance =

        new SpeechSynthesisUtterance(
          String(text)
        );


      utterance.lang =
        options.lang ||
        "hi-IN";


      utterance.rate =
        options.rate ||
        1;


      utterance.pitch =
        options.pitch ||
        1;


      utterance.volume =
        options.volume ??
        1;


      utterance.onstart =
        () => {

          this.isSpeaking =
            true;


          document.dispatchEvent(

            new CustomEvent(
              "masterSpeechStart"
            )

          );

        };


      utterance.onend =
        () => {

          this.isSpeaking =
            false;


          document.dispatchEvent(

            new CustomEvent(
              "masterSpeechEnd"
            )

          );

        };


      utterance.onerror =
        () => {

          this.isSpeaking =
            false;

        };


      window.speechSynthesis.speak(
        utterance
      );


      return true;

    },


    stopSpeaking() {

      if (
        "speechSynthesis" in
        window
      ) {

        window.speechSynthesis.cancel();

      }


      this.isSpeaking =
        false;

    }

  },


  /* =====================================
     VOICE CIRCLE EVENTS
  ===================================== */

  initVoiceCircle() {

    /*
      HTML me future voice button:

      #voiceButton

      Voice circle:

      #voiceCircle

      Status:

      #voiceStatus
    */


    const voiceButton =

      document.getElementById(
        "voiceButton"
      );


    const voiceCircle =

      document.getElementById(
        "voiceCircle"
      );


    const voiceStatus =

      document.getElementById(
        "voiceStatus"
      );


    if (
      !voiceButton
    ) {

      return;

    }


    this.voice.init();


    voiceButton.addEventListener(

      "click",

      () => {

        if (
          this.voice.isListening
        ) {

          this.voice.stopListening();

        } else {

          this.voice.startListening(
            "hi-IN"
          );

        }

      }

    );


    document.addEventListener(

      "masterVoiceStart",

      () => {

        voiceCircle?.classList.add(
          "listening"
        );


        if (
          voiceStatus
        ) {

          voiceStatus.textContent =
            "Listening...";

        }

      }

    );


    document.addEventListener(

      "masterVoiceEnd",

      () => {

        voiceCircle?.classList.remove(
          "listening"
        );


        if (
          voiceStatus
        ) {

          voiceStatus.textContent =
            "Tap to speak";

        }

      }

    );


    document.addEventListener(

      "masterSpeechStart",

      () => {

        voiceCircle?.classList.add(
          "speaking"
        );


        if (
          voiceStatus
        ) {

          voiceStatus.textContent =
            "MASTER is speaking...";

        }

      }

    );


    document.addEventListener(

      "masterSpeechEnd",

      () => {

        voiceCircle?.classList.remove(
          "speaking"
        );


        if (
          voiceStatus
        ) {

          voiceStatus.textContent =
            "Tap to speak";

        }

      }

    );

  }

};


/* =========================================
   GLOBAL ACCESS
========================================= */

window.MASTER_AI_ENGINE =
  MASTER_AI_ENGINE;


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    MASTER_AI_ENGINE
      .voice
      .init();


    MASTER_AI_ENGINE
      .initVoiceCircle();

  }

);
