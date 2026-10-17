#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { COLORS: C, esc, svgDoc, framePanel, sectionHeading } = require("./style");
const { renderCity } = require("./city");
const profile = require("./curated");

const ROOT = path.resolve(__dirname, "..");
const WIDTH = 900;
const number = value => Number(value || 0).toLocaleString("en-US");

function renderHeader() {
  const height = 300;
  const name = esc(profile.displayName);
  const body = `
${framePanel(WIDTH, height, { top: true })}
<rect x="17" y="17" width="866" height="32" fill="${C.cyan}" opacity=".065"/>
<path d="M16 49H884" stroke="${C.cyan}" stroke-opacity=".4"/>
<text x="36" y="38" fill="${C.cyan}" font-size="11" letter-spacing="1.2">SYS://TEAM-KNULL / NODE:KOOKOOCODER</text>
<circle cx="652" cy="33" r="3" fill="${C.green}" class="signal"/>
<text x="668" y="37" fill="${C.textDim}" font-size="9" letter-spacing="1">ONLINE / THINK. CREATE. SOLVE.</text>
<text x="48" y="87" font-size="13" fill="${C.textDim}"><tspan fill="${C.green}">$</tspan> whoami</text>
<g font-size="48" font-weight="800" letter-spacing="1.6">
  <text x="51" y="146" fill="${C.magenta}" opacity=".65" class="glitch">${name}</text>
  <text x="46" y="146" fill="${C.cyan}" opacity=".8">${name}</text>
  <text x="48" y="146" fill="${C.textPrimary}">${name}</text>
</g>
<text x="48" y="181" font-size="13" fill="${C.textDim}"><tspan fill="${C.cyan}">&gt;&gt;</tspan> full-stack builder / project manager / team lead</text>
<text x="48" y="205" font-size="13" fill="${C.textDim}"><tspan fill="${C.cyan}">&gt;&gt;</tspan> ${profile.hackathonWins}x hackathon winner / MIT BTech CSE / IIT Madras</text>
<text x="48" y="229" font-size="13" fill="${C.textDim}"><tspan fill="${C.cyan}">&gt;&gt;</tspan> privacy-first tools + applied ML under <tspan fill="${C.cyan}">TEAM KNULL</tspan></text>
<text x="48" y="268" font-size="13" fill="${C.green}">$</text>
<rect x="66" y="256" width="9" height="15" fill="${C.cyan}" class="cursor"/>
<rect x="17" y="50" width="866" height="250" fill="url(#scan)" pointer-events="none"/>`;
  return svgDoc(WIDTH, height, body, {
    title: "Preetam Gaikwad / kookoocoder",
    description: "Think. Create. Solve. Full-stack builder, project manager and team lead. 5x hackathon winner. MIT BTech CSE and IIT Madras. Team Knull.",
  });
}

function renderStats(data) {
  const height = 342;
  const metrics = [
    ["CONTRIBUTIONS", number(data.contributions.total), "last 365 days"],
    ["PUBLIC REPOS", number(data.totalRepos), "original + imported"],
    ["CURRENT STREAK", `${data.contributions.currentStreak}d`, `best ${data.contributions.longestStreak}d / 365d`],
    ["HACKATHON WINS", String(profile.hackathonWins), "build under pressure"],
  ];
  const cards = metrics.map(([label, value, caption], index) => {
    const x = 48 + index * 204;
    return `<path d="M${x} 92H${x + 188}V176H${x}Z" fill="${C.panel}" stroke="${C.border}"/>
<path d="M${x} 106V92H${x + 22}" fill="none" stroke="${C.cyan}"/>
<text x="${x + 12}" y="111" fill="${C.textDim}" font-size="9" letter-spacing=".7">${esc(label)}</text>
<text x="${x + 12}" y="143" fill="${C.cyan}" font-size="28" font-weight="700">${esc(value)}</text>
<text x="${x + 12}" y="162" fill="${C.textFaint}" font-size="9">${esc(caption)}</text>`;
  }).join("\n");
  const top = data.languages.slice(0, 5);
  let cursor = 48;
  const segments = top.map(language => {
    const width = 804 * language.pct / 100;
    const segment = `<rect x="${cursor}" y="224" width="${width}" height="7" fill="${profile.languageColors[language.name] || C.textDim}"/>`;
    cursor += width;
    return segment;
  }).join("\n");
  const legend = top.map((language, index) => {
    const x = 48 + (index % 3) * 268;
    const y = 253 + Math.floor(index / 3) * 24;
    return `<rect x="${x}" y="${y - 7}" width="6" height="6" fill="${profile.languageColors[language.name] || C.textDim}"/>
<text x="${x + 14}" y="${y}" font-size="11" fill="${C.textDim}">${esc(language.name)} <tspan fill="${C.textPrimary}">${language.pct.toFixed(1)}%</tspan></text>`;
  }).join("\n");
  const body = `${framePanel(WIDTH, height)}
${sectionHeading(48, 32, { label: "telemetry", number: "01", prompt: "gh profile --public --window 365d" })}
${cards}
<text x="48" y="208" font-size="10" letter-spacing="1" fill="${C.textDim}">LANGUAGE MIX / SELECTED PUBLIC REPOSITORIES / BY BYTES</text>
<rect x="48" y="224" width="804" height="7" fill="${C.border}"/>
${segments}${legend}
<text x="48" y="310" font-size="9" fill="${C.textFaint}">Excludes profile graphics and repositories containing bundled upstream code.</text>
<text x="852" y="330" font-size="8" fill="${C.textFaint}" text-anchor="end">SNAPSHOT ${esc(data.fetchedAt.slice(0, 10))} UTC / NOT A SKILL RANKING</text>`;
  return svgDoc(WIDTH, height, body, {
    title: "Kookoocoder / live GitHub telemetry",
    description: `${number(data.contributions.total)} contributions in the last 365 days; ${data.totalRepos} public non-fork repositories; current streak ${data.contributions.currentStreak} days. ${profile.hackathonWins} hackathon wins. Language totals exclude bundled upstream repositories and profile graphics.`,
  });
}

function renderContributionCity(data) {
  const city = renderCity(data);
  return svgDoc(WIDTH, city.height, `${framePanel(WIDTH, city.height)}${city.body}`, {
    title: "Kookoocoder / contribution city",
    description: "A blue and cyan isometric night skyline generated from the latest 365 contribution days. Each address is a day; building heights represent contributions, not artificial activity.",
  });
}

function renderFooter() {
  const height = 100;
  return svgDoc(WIDTH, height, `${framePanel(WIDTH, height, { bottom: true })}
<text x="48" y="30" font-size="12" fill="${C.green}">$ <tspan fill="${C.textDim}">exit</tspan></text>
<text x="48" y="55" font-size="12" fill="${C.textDim}">connection to <tspan fill="${C.cyan}">kookoocoder</tspan> closed. // KEEP BUILDING.</text>`, {
    title: "Keep building", description: "Think. Create. Solve.",
  });
}

function renderReadme(data) {
  const projects = profile.projects.map(project => `### [${project.title} ↗](https://github.com/${profile.handle}/${project.repo})

\`${project.tag}\`

${project.description}

**Built with:** ${project.stack}.
`).join("\n");
  const links = profile.links.map(link => `[${link.label}](${link.url})`).join(" · ");
  return `<!-- Profile source: tools/curated.js + tools/render.js. Generated graphics complement the written content below. -->

![Preetam Gaikwad — kookoocoder. Think. Create. Solve.](./assets/header.svg)

# Preetam Gaikwad · \`kookoocoder\`

**Think. Create. Solve.**

${profile.introduction}

${links}

## \`~/about\`

${profile.background.map(line => `- ${line}`).join("\n")}

I work across product and implementation: understanding the problem, coordinating the build, and connecting the interface to the data and logic behind it. My projects explore privacy, industrial safety, civic-tech, and market research.

## \`~/activity\`

![GitHub telemetry: contributions, public repositories, streaks, hackathon wins, and language mix.](./assets/stats.svg)

![A blue isometric contribution city generated from my latest 365 days of GitHub activity.](./assets/contribution-city.svg)

The skyline is built from my real contribution calendar. **One address per day; taller buildings mean more contributions.** The dashboard refreshes daily through GitHub Actions—no external stats-card service.

## \`~/selected-builds\`

${projects}
## \`~/toolkit\`

Tools represented in my public projects—not a claim of equal expertise in every dependency.

| Area | Technologies |
| :--- | :--- |
${profile.stack.map(([area, tools]) => `| **${area}** | ${tools} |`).join("\n")}

**Stack evidence:** [web](https://github.com/kookoocoder/WebSynx/blob/main/package.json) · [APIs](https://github.com/kookoocoder/prompt_filter/blob/main/pyproject.toml) · [ML training](https://github.com/kookoocoder/paisa_ai_model/blob/main/pyproject.toml) · [vision](https://github.com/kookoocoder/visual-guard/blob/main/package.json) · [Stacks](https://github.com/kookoocoder/stack-web3/blob/main/package.json).

## \`~/engineering-notes\`

- **Privacy before transmission.** Clean sensitive inputs and process locally when the problem allows it.
- **Recovery is a feature.** Resumable forms and checkpointed training runs solve different versions of the same problem: lost progress.
- **Keep the claims honest.** Paper trading is research. A prototype is a prototype. The useful part should speak for itself.
- **Build beyond the happy path.** State transitions, validation, and failure handling belong to the product, not the backlog.

## \`~/more-experiments\`

- [**A.R.T.I.S**](https://github.com/kookoocoder/A.R.T.I.S) — Automated Response Technology for Information and Solutions.
- [**Auto Review Bot**](https://github.com/kookoocoder/auto-review-bot) — static QR codes with rotating review-text pools.
- [**Data Cleaning Demo**](https://github.com/kookoocoder/dwv-data-cleaning-demo) — cleaning messy CSV data in Python or Google Colab.
- [**Stack Web3**](https://github.com/kookoocoder/stack-web3) — smart-contract development with Clarity on Stacks.

## \`~/connect\`

Building something in **privacy, applied AI, full-stack development, or blockchain**? Let's talk on [LinkedIn](https://www.linkedin.com/in/preetam-gaikwad-64a1b135b/). Follow the work on [Instagram](https://www.instagram.com/build.preetam/).

<details>
<summary>How this profile is coded</summary>

The README contains real, selectable text. The terminal header, telemetry, and city are custom SVGs generated with dependency-free Node.js—not screenshots or third-party badge widgets. GitHub READMEs don't run custom CSS or JavaScript, so SVG handles the visual effects while Markdown handles the content and links.

- \`tools/curated.js\` — personal copy, projects, and verified toolkit.
- \`tools/fetch-data.js\` — paginated public repository data and the contribution calendar.
- \`tools/render.js\` + \`tools/style.js\` — README and terminal artwork.
- \`tools/city.js\` — deterministic isometric geometry, windows, and lighting.
- \`node --test tools/*.test.js\` — generator regression tests.

Language mix excludes \`paisa\` (bundled StockSharp sources), \`chess-game-\` (upstream Session Android code), and this profile's generated graphics. Repository presence or byte count alone doesn't establish authorship or proficiency.

Visual direction inspired by [Giorgi Kobaidze's terminal profile](https://github.com/georgekobaidze). This implementation and all profile copy are personalized for kookoocoder.

</details>

![Connection to kookoocoder closed. Keep building.](./assets/footer.svg)
`;
}

function build(data, root = ROOT) {
  const out = path.join(root, "assets");
  fs.mkdirSync(out, { recursive: true });
  const assets = {
    "header.svg": renderHeader(), "stats.svg": renderStats(data),
    "contribution-city.svg": renderContributionCity(data), "footer.svg": renderFooter(),
  };
  for (const [name, svg] of Object.entries(assets)) fs.writeFileSync(path.join(out, name), svg);
  fs.writeFileSync(path.join(root, "README.md"), renderReadme(data));
  console.log(`Rendered ${Object.keys(assets).length} SVGs and the written README.`);
}

if (require.main === module) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
  build(data);
}

module.exports = { renderHeader, renderStats, renderContributionCity, renderFooter, renderReadme, build };
