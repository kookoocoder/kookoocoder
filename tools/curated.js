// Hand-curated profile content that isn't derivable from the GitHub API.

module.exports = {
  displayName: "PREETAM GAIKWAD",
  handle: "kookoocoder",
  pathLabel: "~/TEAMKNULL // KOOKOOCODER",
  whoamiLines: [
    "software engineer · builder · 5x hackathon winner",
    "BTech CSE @ MIT · also studying at IIT Madras",
    "building AI agents, automation & trading infra under TEAM KNULL",
  ],
  hackathonWins: 5,
  education: "MIT (BTech CSE) + IIT Madras",

  links: [
    {
      id: "github",
      label: "GitHub",
      sub: "@kookoocoder",
      url: "https://github.com/kookoocoder",
      color: "#45f3ff",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      sub: "preetam-gaikwad",
      url: "https://www.linkedin.com/in/preetam-gaikwad-64a1b135b/",
      color: "#45f3ff",
    },
    {
      id: "instagram",
      label: "Instagram",
      sub: "@build.preetam",
      url: "https://www.instagram.com/build.preetam/",
      color: "#ff5ec8",
    },
    {
      id: "website",
      label: "Website",
      sub: "preetamgloabal.com",
      url: "https://www.preetamgloabal.com",
      color: "#3dffa0",
    },
  ],

  // repo name -> curated project-card metadata
  projects: [
    {
      repo: "paisa",
      tag: "ACTIVE",
      title: "Paisa",
      description: "No-demat India intraday paper-trading research harness with an autonomous replay dashboard.",
      langs: ["C#", "Python"],
    },
    {
      repo: "paisa_ai_model",
      tag: "ML PIPELINE",
      title: "Paisa AI Model",
      description: "Modal training pipeline for Paisa Trader v2 ML models — XGBoost, LightGBM, ARIMA.",
      langs: ["Python"],
    },
    {
      repo: "safetyiq",
      tag: "ACTIVE",
      title: "SafetyIQ",
      description: "Compound risk detection for industrial environments, surfaced in real time.",
      langs: ["TypeScript"],
    },
    {
      repo: "visual-guard",
      tag: "PRIVACY",
      title: "Visual Guard",
      description: "Client-side privacy layer browser extension with on-device text & image redaction.",
      langs: ["JavaScript"],
    },
    {
      repo: "prompt_filter",
      tag: "SECURITY",
      title: "Prompt Filter",
      description: "Local-first prompt sanitizer — cleans what you typed before it ever leaves the machine.",
      langs: ["Python"],
    },
    {
      repo: "sahaj-visa",
      tag: "HACKATHON",
      title: "Sahaj Visa",
      description: "Independent prototype reimagining the Indian e-Tourist Visa journey end to end.",
      langs: ["TypeScript"],
    },
  ],

  stack: [
    {
      label: "LANGUAGES",
      items: ["C#", "TypeScript", "JavaScript", "Python", "Kotlin", "Java", "Solidity"],
    },
    {
      label: "FRAMEWORKS",
      items: ["Next.js", "React", "Node.js", ".NET"],
    },
    {
      label: "ML / DATA",
      items: ["XGBoost", "LightGBM", "ARIMA", "Pandas"],
    },
    {
      label: "PLATFORMS",
      items: ["Git", "GitHub Actions", "Vercel", "Docker", "Figma"],
    },
    {
      label: "BLOCKCHAIN",
      items: ["Solidity", "Clarity / Stacks"],
    },
  ],

  languageColors: {
    "C#": "#45f3ff",
    TypeScript: "#3dffa0",
    Kotlin: "#ff5ec8",
    Java: "#ffd166",
    Python: "#8aa8ff",
    JavaScript: "#ffe27a",
    CSS: "#6fe3d6",
    HTML: "#ff8a65",
    "Jupyter Notebook": "#f2a65a",
    "C++": "#9d7bff",
  },
};
