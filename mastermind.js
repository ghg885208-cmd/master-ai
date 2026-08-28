/* =========================================
   MASTER AI — MASTERMIND ENGINE
   Scenario & Decision Analysis
========================================= */

const MASTERMIND_CONFIG = {
  enabled: true,

  analysisDepth: "deep",

  perspectives: [
    "short_term",
    "long_term",
    "risks",
    "benefits",
    "alternatives",
    "opportunity_cost",
    "unknowns",
    "permissions",
    "future_outcomes"
  ]
};


/*
  MASTER MIND ANALYSIS STRUCTURE

  This module prepares a decision for
  structured AI analysis.
*/

function createMastermindRequest({
  situation = "",
  optionA = "",
  optionB = "",
  optionC = ""
}) {

  return {

    situation,

    options: {

      A: optionA,
      B: optionB,
      C: optionC

    },

    questions: [

      "What happens if option A is chosen?",

      "What happens if option B is chosen?",

      "What happens if no option is chosen?",

      "What are the short-term consequences?",

      "What are the long-term consequences?",

      "What opportunities could be lost?",

      "What new opportunities could appear?",

      "What could go wrong?",

      "What assumptions are weak?",

      "What information is missing?",

      "Are there better alternatives?",

      "What permissions or approvals are required?",

      "What happens if approval is denied?",

      "What is the safest reasonable path?",

      "What is the highest-upside path?",

      "What should not be done yet?"

    ]

  };

}


/*
  Convert a decision into an AI prompt.

  The actual AI call will be handled later
  by app.js.
*/

function buildMastermindPrompt(data) {

  return `
You are MASTER in MASTERMIND MODE.

Do not simply agree with the user's idea.

Pressure-test it.

SITUATION:
${data.situation}

OPTION A:
${data.options.A}

OPTION B:
${data.options.B}

OPTION C:
${data.options.C}

Analyse:

1. What happens if each option is chosen?
2. What happens if nothing is chosen?
3. Short-term consequences.
4. Long-term consequences.
5. Risks.
6. Benefits.
7. Hidden assumptions.
8. Missing information.
9. Better alternatives.
10. Opportunity costs.
11. Future possibilities.
12. Required permissions or approvals.
13. What happens if permission is denied?
14. Safest reasonable option.
15. Highest-upside option.
16. What should NOT be done yet.

Separate facts, assumptions and uncertainty.

Do not pretend to predict the future with certainty.
Give scenarios and probabilities only when justified.
`;

}


/*
  Make functions available globally
  for app.js.
*/

window.MASTERMIND = {

  config: MASTERMIND_CONFIG,

  createRequest:
    createMastermindRequest,

  buildPrompt:
    buildMastermindPrompt

};
