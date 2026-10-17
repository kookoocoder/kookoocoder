#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { FONT, COLORS, esc, svgDoc, framePanel, topBar, sectionHeading, measureApprox } = require("./style");
const curated = require("./curated");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const OUT_DIR = path.join(__dirname, "..", "assets");
const WIDTH = 900;

function writeAsset(name, svg) {
  fs.writeFileSync(path.join(OUT_DIR, name), svg.trim() + "\n");
  console.log("wrote", name);
}

function panel(x, y, w, h, extra = {}) {
  return framePanel(w, h, extra).replace(/x="1"/g, `x="${x + 1}"`);
}

// ---------- header.svg ----------
function renderHeader() {
  const h = 238;
  const body = `
  ${panel(0, 0, WIDTH, h)}
  ${topBar(WIDTH, { path: curated.pathLabel, status: "ONLINE" })}
  <text x="28" y="56" font-family="${FONT}" font-size="13.5" fill="${COLORS.textDim}"><tspan fill="${COLORS.green}">$</tspan> whoami</text>
  <text x="28" y="104" font-family="${FONT}" font-size="40" font-weight="700" letter-spacing="2" fill="${COLORS.cyan}" filter="url(#glow)">${esc(curated.displayName)}</text>
  ${curated.whoamiLines
    .map(
      (line, i) =>
        `<text x="28" y="${132 + i * 21}" font-family="${FONT}" font-size="13" fill="${COLORS.textDim}"><tspan fill="${COLORS.green}">//</tspan> ${esc(line)}</text>`
    )
    .join("\n  ")}
  <rect x="28" y="${132 + curated.whoamiLines.length * 21 + 6}" width="8" height="14" fill="${COLORS.cyan}" opacity="0.85"/>
  `;
  return svgDoc(WIDTH, h, body);
}

// ---------- links.svg ----------
function renderLinks() {
  const headH = 64;
  const btnH = 68;
  const gap = 14;
  const n = curated.links.length;
  const btnW = (WIDTH - 56 - gap * (n - 1)) / n;
  const h = headH + btnH + 30;

  const buttons = curated.links
    .map((link, i) => {
      const x = 28 + i * (btnW + gap);
      const y = headH + 10;
      return `
      <a href="${esc(link.url)}" target="_blank">
      <rect x="${x}" y="${y}" width="${btnW}" height="${btnH}" rx="9" fill="${COLORS.panelAlt}" stroke="${link.color}" stroke-width="1.3" opacity="0.95"/>
      <circle cx="${x + 20}" cy="${y + btnH / 2}" r="4" fill="${link.color}"/>
      <text x="${x + 34}" y="${y + btnH / 2 - 4}" font-family="${FONT}" font-size="13" font-weight="700" fill="${COLORS.textPrimary}">${esc(link.label)}</text>
      <text x="${x + 34}" y="${y + btnH / 2 + 14}" font-family="${FONT}" font-size="10.5" fill="${COLORS.textDim}">${esc(link.sub)}</text>
      </a>`;
    })
    .join("\n");

  const body = `
  ${panel(0, 0, WIDTH, h)}
  ${sectionHeading(28, 34, { label: "links", number: "01", prompt: `ping ${curated.handle} --all-channels` })}
  ${buttons}
  `;
  return svgDoc(WIDTH, h, body);
}

// ---------- stats.svg ----------
function statCard(x, y, w, h, { label, value, sub, color }) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${COLORS.panelAlt}" stroke="${COLORS.border}" stroke-width="1"/>
  <text x="${x + 14}" y="${y + 22}" font-family="${FONT}" font-size="10" letter-spacing="1" fill="${COLORS.textDim}">${esc(label)}</text>
  <text x="${x + 14}" y="${y + h - 16}" font-family="${FONT}" font-size="26" font-weight="700" fill="${color}">${esc(value)}</text>
  ${sub ? `<text x="${x + w - 12}" y="${y + h - 16}" font-family="${FONT}" font-size="10" fill="${COLORS.textFaint}" text-anchor="end">${esc(sub)}</text>` : ""}
  `;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function renderStats() {
  const headH = 60;
  const row1Y = headH + 10;
  const row1H = 76;
  const row2Y = row1Y + row1H + 14;
  const row2H = 58;
  const langY = row2Y + row2H + 24;
  const langH = 54;
  const h = langY + langH + 24;

  const cardGap = 14;
  const card1W = (WIDTH - 56 - cardGap * 3) / 4;

  const row1 = [
    { label: "TOTAL STARS", value: String(data.totalStars), sub: "across all repos", color: COLORS.amber },
    { label: "CONTRIBUTIONS", value: String(data.contributions.total), sub: "last 365 days", color: COLORS.cyan },
    { label: "COMMITS", value: String(data.contributions.commits), sub: "this year", color: COLORS.green },
    {
      label: "CURRENT STREAK",
      value: `${data.contributions.currentStreak}d`,
      sub: `longest: ${data.contributions.longestStreak}d`,
      color: COLORS.magenta,
    },
  ];

  const row2 = [
    { label: "FOLLOWERS", value: String(data.followers) },
    { label: "REPOSITORIES", value: String(data.totalRepos) },
    { label: "MEMBER SINCE", value: fmtDate(data.createdAt) },
    { label: "HACKATHON WINS", value: String(curated.hackathonWins) },
  ];

  const row1Svg = row1.map((c, i) => statCard(28 + i * (card1W + cardGap), row1Y, card1W, row1H, c)).join("\n");
  const card2W = (WIDTH - 56 - cardGap * 3) / 4;
  const row2Svg = row2
    .map((c, i) => statCard(28 + i * (card2W + cardGap), row2Y, card2W, row2H, { ...c, color: COLORS.textPrimary }))
    .join("\n");

  const top = data.languages.slice(0, 5);
  const otherPct = Math.max(0, 100 - top.reduce((a, l) => a + l.pct, 0));
  const barW = WIDTH - 56;
  let cursor = 0;
  const segments = top
    .map((l) => {
      const w = (l.pct / 100) * barW;
      const seg = `<rect x="${28 + cursor}" y="${langY + 18}" width="${w}" height="10" fill="${curated.languageColors[l.name] || COLORS.textDim}"/>`;
      cursor += w;
      return seg;
    })
    .join("\n");
  const otherSeg = `<rect x="${28 + cursor}" y="${langY + 18}" width="${barW - cursor}" height="10" fill="${COLORS.textFaint}"/>`;

  const legend = top
    .map((l, i) => {
      const x = 28 + i * 160;
      const y = langY + 44;
      return `<circle cx="${x}" cy="${y - 4}" r="4" fill="${curated.languageColors[l.name] || COLORS.textDim}"/>
      <text x="${x + 10}" y="${y}" font-family="${FONT}" font-size="10.5" fill="${COLORS.textDim}">${esc(l.name)} ${l.pct.toFixed(1)}%</text>`;
    })
    .join("\n");

  const body = `
  ${panel(0, 0, WIDTH, h)}
  ${sectionHeading(28, 34, { label: "stats", number: "02", prompt: `gh stats --user ${curated.handle} --all-channels` })}
  ${row1Svg}
  ${row2Svg}
  <text x="28" y="${langY + 8}" font-family="${FONT}" font-size="10" letter-spacing="1" fill="${COLORS.textDim}">TOP LANGUAGES (BY BYTES)</text>
  <rect x="28" y="${langY + 18}" width="${barW}" height="10" rx="5" fill="${COLORS.panelAlt}"/>
  ${segments}
  ${otherSeg}
  ${legend}
  `;
  return svgDoc(WIDTH, h, body);
}

// ---------- contribution-city.svg ----------
function levelColor(count) {
  if (count === 0) return "#132226";
  if (count <= 2) return "#136a62";
  if (count <= 5) return "#1fae8e";
  if (count <= 9) return "#3dffa0";
  return "#c8fff0";
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * factor)));
  g = Math.max(0, Math.min(255, Math.round(g * factor)));
  b = Math.max(0, Math.min(255, Math.round(b * factor)));
  return `rgb(${r},${g},${b})`;
}

function renderContributionCity() {
  const weeks = data.contributions.weeks;
  const N = Math.min(26, weeks.length);
  const recentWeeks = weeks.slice(weeks.length - N);

  const tileW = 22;
  const tileH = 12;
  const maxH = 70;

  const cells = [];
  recentWeeks.forEach((w, col) => {
    w.contributionDays.forEach((d) => {
      const row = d.weekday;
      cells.push({ col, row, count: d.contributionCount, date: d.date });
    });
  });

  let periodTotal = 0;
  let busiest = cells[0];
  for (const c of cells) {
    periodTotal += c.count;
    if (c.count > (busiest?.count ?? -1)) busiest = c;
  }

  const isoX = (col, row) => (col - row) * (tileW / 2);
  const isoY = (col, row) => (col + row) * (tileH / 2);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const c of cells) {
    const x = isoX(c.col, c.row);
    const y = isoY(c.col, c.row);
    const bh = c.count === 0 ? 2 : Math.min(4 + c.count * 2.4, maxH);
    minX = Math.min(minX, x - tileW / 2);
    maxX = Math.max(maxX, x + tileW / 2);
    minY = Math.min(minY, y - bh);
    maxY = Math.max(maxY, y + tileH);
  }

  const cityW = maxX - minX;
  const cityH = maxY - minY;
  const headH = 58;
  const cityTop = headH + 20;
  const h = cityTop + cityH + 50;
  const originX = WIDTH / 2 - (minX + maxX) / 2;
  const originY = cityTop - minY;

  cells.sort((a, b) => a.col + a.row - (b.col + b.row));

  const buildings = cells
    .map((c) => {
      const x = isoX(c.col, c.row) + originX;
      const y = isoY(c.col, c.row) + originY;
      const bh = c.count === 0 ? 2 : Math.min(4 + c.count * 2.4, maxH);
      const base = levelColor(c.count);
      const top = base;
      const right = shade(base, 0.72);
      const left = shade(base, 0.48);

      const topPts = [
        [x, y - bh],
        [x + tileW / 2, y + tileH / 2 - bh],
        [x, y + tileH - bh],
        [x - tileW / 2, y + tileH / 2 - bh],
      ];
      const rightPts = [
        [x, y + tileH - bh],
        [x + tileW / 2, y + tileH / 2 - bh],
        [x + tileW / 2, y + tileH / 2],
        [x, y + tileH],
      ];
      const leftPts = [
        [x, y + tileH - bh],
        [x - tileW / 2, y + tileH / 2 - bh],
        [x - tileW / 2, y + tileH / 2],
        [x, y + tileH],
      ];
      const pts = (arr) => arr.map((p) => p.join(",")).join(" ");
      const glow = c.count > 9 ? ` filter="url(#glow)"` : "";
      return `<polygon points="${pts(topPts)}" fill="${top}"${glow}/><polygon points="${pts(rightPts)}" fill="${right}"/><polygon points="${pts(leftPts)}" fill="${left}"/>`;
    })
    .join("\n");

  const moonX = WIDTH - 70;
  const moonY = headH + 24;

  const busyDate = busiest ? new Date(busiest.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  const body = `
  ${panel(0, 0, WIDTH, h)}
  ${sectionHeading(28, 34, { label: "contribution-city", number: "03", prompt: "render-city --last 26w # one building per day" })}
  <circle cx="${moonX}" cy="${moonY}" r="11" fill="#eaf6ff" opacity="0.9" filter="url(#glowSoft)"/>
  <circle cx="${moonX + 4}" cy="${moonY - 3}" r="10" fill="${COLORS.bg}"/>
  ${buildings}
  <text x="28" y="${h - 26}" font-family="${FONT}" font-size="11" fill="${COLORS.textDim}">${periodTotal} contributions &#183; last ${N} weeks &#183; busiest day ${esc(busyDate)} with ${busiest ? busiest.count : 0}</text>
  <text x="${WIDTH - 196}" y="${h - 24}" font-family="${FONT}" font-size="10" fill="${COLORS.textFaint}" text-anchor="end">quiet</text>
  ${[0, 1, 2, 3, 4].map((i) => `<rect x="${WIDTH - 180 + i * 16}" y="${h - 32}" width="12" height="12" rx="2" fill="${levelColor([0, 1, 3, 6, 12][i])}"/>`).join("")}
  <text x="${WIDTH - 28}" y="${h - 24}" font-family="${FONT}" font-size="10" fill="${COLORS.textFaint}" text-anchor="end">busiest</text>
  `;
  return svgDoc(WIDTH, h, body);
}

// ---------- projects.svg ----------
function renderProjects() {
  const headH = 60;
  const cols = 2;
  const gap = 16;
  const cardW = (WIDTH - 56 - gap) / cols;
  const cardH = 128;
  const rows = Math.ceil(curated.projects.length / cols);
  const h = headH + rows * cardH + (rows - 1) * gap + 34;

  const byName = Object.fromEntries(data.repos.map((r) => [r.name, r]));

  const tagColor = {
    ACTIVE: COLORS.green,
    "ML PIPELINE": COLORS.cyan,
    PRIVACY: COLORS.magenta,
    SECURITY: COLORS.amber,
    HACKATHON: COLORS.magenta,
  };

  const cards = curated.projects
    .map((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 28 + col * (cardW + gap);
      const y = headH + 10 + row * (cardH + gap);
      const repoInfo = byName[p.repo] || {};
      const stars = repoInfo.stars || 0;
      const color = tagColor[p.tag] || COLORS.cyan;

      const words = p.description.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        if ((line + " " + word).trim().length > 46) {
          lines.push(line.trim());
          line = word;
        } else {
          line = (line + " " + word).trim();
        }
      }
      if (line) lines.push(line);

      return `
      <a href="https://github.com/${curated.handle}/${esc(p.repo)}" target="_blank">
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="9" fill="${COLORS.panelAlt}" stroke="${COLORS.border}" stroke-width="1.2"/>
      <rect x="${x + 14}" y="${y + 14}" width="${measureApprox(p.tag, 9.5) + 16}" height="18" rx="9" fill="none" stroke="${color}" stroke-width="1"/>
      <text x="${x + 22}" y="${y + 26.5}" font-family="${FONT}" font-size="9.5" fill="${color}">${esc(p.tag)}</text>
      <text x="${x + 14}" y="${y + 52}" font-family="${FONT}" font-size="15" font-weight="700" fill="${COLORS.textPrimary}">${esc(p.title)}</text>
      ${lines
        .slice(0, 3)
        .map((l, li) => `<text x="${x + 14}" y="${y + 70 + li * 14}" font-family="${FONT}" font-size="10.5" fill="${COLORS.textDim}">${esc(l)}</text>`)
        .join("\n")}
      <text x="${x + 14}" y="${y + cardH - 14}" font-family="${FONT}" font-size="10" fill="${COLORS.textFaint}">${esc(p.langs.join(" / "))}</text>
      ${stars > 0 ? `<text x="${x + cardW - 14}" y="${y + cardH - 14}" font-family="${FONT}" font-size="10" fill="${COLORS.amber}" text-anchor="end">&#9733; ${stars}</text>` : ""}
      </a>`;
    })
    .join("\n");

  const body = `
  ${panel(0, 0, WIDTH, h)}
  ${sectionHeading(28, 34, { label: "projects", number: "04", prompt: `ls -l ~/projects` })}
  ${cards}
  `;
  return svgDoc(WIDTH, h, body);
}

// ---------- stack.svg ----------
function renderStack() {
  const headH = 60;
  const rowGap = 16;
  const rowH = 36;
  const h = headH + curated.stack.length * (rowH + rowGap) + 10;

  const rows = curated.stack
    .map((cat, i) => {
      const y = headH + 14 + i * (rowH + rowGap);
      const labelW = 120;
      let cursor = 28 + labelW;
      const badges = cat.items
        .map((item) => {
          const w = measureApprox(item, 11) + 22;
          const svg = `<rect x="${cursor}" y="${y}" width="${w}" height="24" rx="6" fill="${COLORS.panelAlt}" stroke="${COLORS.border}" stroke-width="1"/>
          <text x="${cursor + w / 2}" y="${y + 16}" font-family="${FONT}" font-size="11" fill="${COLORS.textPrimary}" text-anchor="middle">${esc(item)}</text>`;
          cursor += w + 10;
          return svg;
        })
        .join("\n");
      return `
      <text x="28" y="${y + 16}" font-family="${FONT}" font-size="10.5" letter-spacing="1" fill="${COLORS.green}">${esc(cat.label)}</text>
      ${badges}`;
    })
    .join("\n");

  const body = `
  ${panel(0, 0, WIDTH, h)}
  ${sectionHeading(28, 34, { label: "stack", number: "05", prompt: "scan --loadout --top-level" })}
  ${rows}
  `;
  return svgDoc(WIDTH, h, body);
}

// ---------- footer.svg ----------
function renderFooter() {
  const h = 92;
  const body = `
  ${panel(0, 0, WIDTH, h)}
  <text x="${WIDTH / 2}" y="36" font-family="${FONT}" font-size="13" fill="${COLORS.textDim}" text-anchor="middle"><tspan fill="${COLORS.green}">$</tspan> exit</text>
  <text x="${WIDTH / 2}" y="62" font-family="${FONT}" font-size="14" fill="${COLORS.cyan}" text-anchor="middle" filter="url(#glow)">connection closed.</text>
  `;
  return svgDoc(WIDTH, h, body);
}

function main() {
  writeAsset("header.svg", renderHeader());
  writeAsset("links.svg", renderLinks());
  writeAsset("stats.svg", renderStats());
  writeAsset("contribution-city.svg", renderContributionCity());
  writeAsset("projects.svg", renderProjects());
  writeAsset("stack.svg", renderStack());
  writeAsset("footer.svg", renderFooter());
}

main();
