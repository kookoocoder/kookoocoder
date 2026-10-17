"use strict";

// Personal details come from the supplied LinkedIn profile; stack entries were
// checked against public repository manifests, not GitHub language-byte totals.
module.exports = {
  displayName: "PREETAM GAIKWAD",
  handle: "kookoocoder",
  hackathonWins: 5,
  introduction: "I build full-stack products, privacy-first tools, and machine-learning pipelines with Team Knull. From keeping sensitive prompts on-device to making long application forms resumable, I like software that solves a real problem—not just a demo that looks the part.",
  background: [
    "**5× hackathon winner** · Project Manager & Team Lead · Team Knull.",
    "Pursuing **BTech CSE at MIT**, alongside studies at **IIT Madras**.",
    "**CSI Executive Member** · Chhatrapati Sambhajinagar, Maharashtra, India.",
  ],
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/preetam-gaikwad-64a1b135b/" },
    { label: "Instagram", url: "https://www.instagram.com/build.preetam/" },
    { label: "Explore my repositories", url: "https://github.com/kookoocoder?tab=repositories" },
  ],
  projects: [
    {
      repo: "prompt_filter", title: "Prompt Filter", tag: "LOCAL-FIRST PRIVACY",
      description: "Clean sensitive information from a prompt before it leaves your machine. A local-first sanitizer built around privacy at the point of input.",
      stack: "Python · FastAPI · TypeScript",
    },
    {
      repo: "visual-guard", title: "Visual Guard", tag: "ON-DEVICE REDACTION",
      description: "A browser-extension privacy layer for on-device text and image redaction. Brings document and vision tooling closer to the user, rather than sending everything away.",
      stack: "JavaScript · Transformers.js · Tesseract.js",
    },
    {
      repo: "paisa_ai_model", title: "Paisa AI Model", tag: "APPLIED MACHINE LEARNING",
      description: "A checkpointed training pipeline: OHLCV data → feature engineering → Optuna search → XGBoost / LightGBM → ARIMA → evaluation → packaged artifacts. Runs on Modal; training-only, not an inference API.",
      stack: "Python · Modal · Optuna · XGBoost · LightGBM",
    },
    {
      repo: "safetyiq", title: "SafetyIQ", tag: "INDUSTRIAL SAFETY",
      description: "Compound risk detection for industrial environments. Connects a TypeScript application with local AI and inference tooling to explore combined risks, not just isolated signals.",
      stack: "Next.js · TypeScript · ONNX Runtime · LM Studio",
    },
    {
      repo: "sahaj-visa", title: "Sahaj Visa", tag: "CIVIC-TECH PROTOTYPE",
      description: "An independent e-Tourist Visa prototype with autosave, resumable forms, deterministic checks, an audit log, and a status timeline. Payments and government integrations are mocked; no real visa is issued.",
      stack: "TypeScript · Next.js",
    },
    {
      repo: "paisa", title: "Paisa", tag: "PAPER-TRADING RESEARCH",
      description: "An India-focused intraday paper-trading research harness with an autonomous replay dashboard. Research and simulation—not a claim of profitable live trading.",
      stack: "Python · pandas · scikit-learn",
    },
  ],
  stack: [
    ["Languages", "TypeScript, JavaScript, Python, SQL, Clarity"],
    ["Web & interfaces", "React, Next.js, Tailwind CSS, Vite, shadcn/ui, Framer Motion"],
    ["APIs & data", "FastAPI, Pydantic, PostgreSQL, Prisma, Supabase, Convex, Redis"],
    ["ML & research", "pandas, NumPy, scikit-learn, XGBoost, LightGBM, ARIMA, Optuna, Modal"],
    ["AI & privacy", "MCP, Vercel AI SDK, ONNX Runtime, Transformers.js, Tesseract.js"],
    ["Blockchain", "Clarity / Stacks, Clarinet SDK"],
    ["Testing & delivery", "pytest, Vitest, Node.js test runner, Git, GitHub Actions"],
  ],
  languageColors: {
    TypeScript: "#00d9ff", Python: "#ff2bd6", JavaScript: "#e7cf64",
    CSS: "#9c85f6", HTML: "#ed946b", Clarity: "#65d995",
    "Jupyter Notebook": "#6d92e8",
  },
};
