"use strict";

const FONT = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";
const COLORS = {
  bg: "#03040a", panel: "#050a12", panelAlt: "#07121d",
  border: "#163a4a", borderBright: "#00d9ff", cyan: "#00d9ff",
  green: "#65d995", magenta: "#ff2bd6", amber: "#f2c66d",
  textPrimary: "#edfaff", textDim: "#9aafbf", textFaint: "#627f94",
};

function esc(value) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svgDoc(width, height, body, { title = "Kookoocoder terminal", description = "", extraDefs = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc>
<defs>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#00d9ff" stroke-opacity=".035"/></pattern>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".17"/></pattern>
  <filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
${extraDefs}
</defs>
<style>
text{font-family:${FONT}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes signal{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes glitch{0%,94%,100%{transform:translate(0,0)}95%{transform:translate(3px,-1px)}97%{transform:translate(-2px,0)}}
.cursor{animation:blink 1.1s step-end infinite}.signal{animation:signal 3s ease-in-out infinite}.glitch{animation:glitch 8s linear infinite}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect width="${width}" height="${height}" fill="${COLORS.bg}"/>
<rect x="16" width="${width - 32}" height="${height}" fill="url(#grid)"/>
${body}
</svg>\n`;
}

function framePanel(width, height, { top = false, bottom = false } = {}) {
  return `<path d="M16 0V${height}M${width - 16} 0V${height}" fill="none" stroke="${COLORS.cyan}" stroke-opacity=".6"/>
${top ? `<path d="M16 16H${width - 16}M16 0V16M${width - 16} 0V16" fill="none" stroke="${COLORS.cyan}"/><path d="M8 34V8H34M${width - 34} 8H${width - 8}V34" fill="none" stroke="${COLORS.cyan}" stroke-width="2"/>` : ""}
${bottom ? `<path d="M16 ${height - 16}H${width - 16}M8 ${height - 34}V${height - 8}H34M${width - 34} ${height - 8}H${width - 8}V${height - 34}" fill="none" stroke="${COLORS.cyan}"/>` : ""}`;
}

function sectionHeading(x, y, { label, number, prompt }) {
  return `<text x="${x}" y="${y}" font-size="18" font-weight="700" fill="${COLORS.textPrimary}"><tspan fill="${COLORS.cyan}">~/</tspan>${esc(label)}</text>
<text x="852" y="${y}" text-anchor="end" font-size="10" fill="${COLORS.textFaint}">// ${esc(number)}</text>
<path d="M${x} ${y + 12}H852" stroke="${COLORS.border}"/>
${prompt ? `<text x="${x}" y="${y + 35}" font-size="12" fill="${COLORS.textDim}"><tspan fill="${COLORS.green}">$</tspan> ${esc(prompt)}</text>` : ""}`;
}

module.exports = { FONT, COLORS, esc, svgDoc, framePanel, sectionHeading };
