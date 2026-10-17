// Shared cyberpunk-terminal style helpers for the SVG generator.

const FONT = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace";

const COLORS = {
  bg: "#070b11",
  panel: "#0b121a",
  panelAlt: "#0e1a22",
  border: "#1d4a4a",
  borderBright: "#2ee6d6",
  cyan: "#45f3ff",
  green: "#3dffa0",
  magenta: "#ff5ec8",
  amber: "#ffd166",
  red: "#ff5f56",
  yellow: "#ffbd2e",
  textPrimary: "#eafaf8",
  textDim: "#5f8482",
  textFaint: "#3b5856",
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDoc(width, height, body, { extraDefs = "" } = {}) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glowSoft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.panelAlt}"/>
      <stop offset="100%" stop-color="${COLORS.bg}"/>
    </linearGradient>
    ${extraDefs}
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" rx="0" fill="transparent"/>
  ${body}
</svg>`;
}

function framePanel(width, height, { radius = 10 } = {}) {
  return `
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${radius}"
        fill="url(#panelGrad)" stroke="${COLORS.border}" stroke-width="1.5"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${radius}"
        fill="none" stroke="${COLORS.borderBright}" stroke-width="0.6" opacity="0.55"/>`;
}

function trafficLights(x, y) {
  return `
  <circle cx="${x}" cy="${y}" r="4.5" fill="${COLORS.red}"/>
  <circle cx="${x + 14}" cy="${y}" r="4.5" fill="${COLORS.yellow}"/>
  <circle cx="${x + 28}" cy="${y}" r="4.5" fill="${COLORS.green}"/>`;
}

function topBar(width, { path = "", status = "ONLINE" } = {}) {
  return `
  <rect x="1" y="1" width="${width - 2}" height="28" rx="10" fill="${COLORS.panelAlt}" />
  <rect x="1" y="15" width="${width - 2}" height="14" fill="${COLORS.panelAlt}" />
  ${trafficLights(20, 15)}
  <text x="54" y="19" font-family="${FONT}" font-size="11" fill="${COLORS.textDim}">${esc(path)}</text>
  <circle cx="${width - 150}" cy="15" r="3.5" fill="${COLORS.green}"/>
  <text x="${width - 140}" y="19" font-family="${FONT}" font-size="10.5" fill="${COLORS.green}">${esc(status)}</text>
  <rect x="${width - 70}" y="7" width="54" height="16" rx="8" fill="none" stroke="${COLORS.border}" stroke-width="1"/>
  <text x="${width - 43}" y="18.5" font-family="${FONT}" font-size="8.5" fill="${COLORS.textDim}" text-anchor="middle">SYSTEMS OK</text>
  <line x1="1" y1="29" x2="${width - 1}" y2="29" stroke="${COLORS.border}" stroke-width="1"/>`;
}

function sectionHeading(x, y, { label, number, prompt }) {
  return `
  <text x="${x}" y="${y}" font-family="${FONT}" font-size="18" font-weight="700" fill="${COLORS.cyan}" filter="url(#glow)">~/${esc(label)}</text>
  <text x="${x + measureApprox("~/" + label, 18) + 34}" y="${y}" font-family="${FONT}" font-size="12" fill="${COLORS.textFaint}">[ ${number} ]</text>
  ${prompt ? `<text x="${x}" y="${y + 20}" font-family="${FONT}" font-size="12.5" fill="${COLORS.textDim}"><tspan fill="${COLORS.green}">$</tspan> ${esc(prompt)}</text>` : ""}`;
}

// crude monospace width estimate so we don't need a real text-measuring lib
function measureApprox(text, fontSize) {
  return String(text).length * fontSize * 0.62;
}

module.exports = { FONT, COLORS, esc, svgDoc, framePanel, trafficLights, topBar, sectionHeading, measureApprox };
