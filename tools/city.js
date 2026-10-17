"use strict";

const FONT = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace";
const DAY = 86400000;
const HEIGHT = 520;

function esc(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hash(text) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

const n = (value) => Number(value.toFixed(2));
const points = (vertices) => vertices.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
const polygon = (vertices, attributes) => `<polygon points="${points(vertices)}" ${attributes}/>`;

function calendar(data) {
  const days = new Map();
  const weeks = data?.contributions?.weeks;
  for (const week of Array.isArray(weeks) ? weeks : []) {
    for (const day of Array.isArray(week?.contributionDays) ? week.contributionDays : []) {
      const date = String(day?.date ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const time = Date.parse(`${date}T00:00:00Z`);
      if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) continue;
      const count = Number(day.contributionCount);
      days.set(date, {
        date,
        time,
        count: Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0,
        weekday: new Date(time).getUTCDay(),
      });
    }
  }
  const sorted = [...days.values()].sort((a, b) => a.time - b.time);
  const latest = sorted[sorted.length - 1]?.time;
  return sorted.filter((day) => day.time > latest - 365 * DAY);
}

function renderCity(data) {
  const days = calendar(data);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const busiest = days.reduce((best, day) => (!best || day.count > best.count ? day : best), null);
  const maximum = Math.max(1, busiest?.count || 0);
  const firstSunday = days.length ? days[0].time - days[0].weekday * DAY : 0;
  const weekCount = days.length ? Math.floor((days[days.length - 1].time - firstSunday) / (7 * DAY)) + 1 : 53;
  const columns = Math.ceil(weekCount / 3);
  const rows = 23;
  const stepX = 808 / (columns + rows + 4);
  const stepY = 4.9;
  const originX = 450 - (columns - rows) * stepX / 2;
  const originY = 232;
  const project = (col, row) => [originX + (col - row) * stepX, originY + (col + row) * stepY];
  const parts = [];

  // All definitions are local to this fragment; no dependency on the parent SVG's filters.
  parts.push(`<defs>
    <linearGradient id="city-wall-left" x1="0" y1="0" x2="0.4" y2="1">
      <stop stop-color="#0755ac"/><stop offset="0.45" stop-color="#032554"/><stop offset="1" stop-color="#010a1d"/>
    </linearGradient>
    <linearGradient id="city-wall-right" x1="1" y1="0" x2="0" y2="1">
      <stop stop-color="#0876d5"/><stop offset="0.55" stop-color="#063775"/><stop offset="1" stop-color="#020f2b"/>
    </linearGradient>
    <linearGradient id="city-roof" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#087bdb"/><stop offset="1" stop-color="#54edff"/>
    </linearGradient>
    <radialGradient id="city-haze">
      <stop stop-color="#063b83" stop-opacity="0.38"/><stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="city-light" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="1.4"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="city-bounds"><rect x="28" y="66" width="844" height="393"/></clipPath>
  </defs>
  <rect x="28" y="0" width="844" height="${HEIGHT}" fill="#000000"/>
  <g font-family="${FONT}">
    <text x="36" y="32" fill="#a4d7ed" font-size="14" font-weight="600" letter-spacing="2.4">CONTRIBUTION CITY</text>
    <text x="36" y="52" fill="#446478" font-size="9" letter-spacing="1.4">NIGHT SHIFT / LAST 365 DAYS / ONE ADDRESS PER DAY</text>
    <path d="M36 65H864" stroke="#0a2039"/>
  </g>
  <g clip-path="url(#city-bounds)">
    <ellipse cx="456" cy="295" rx="410" ry="171" fill="url(#city-haze)"/>`);

  for (let index = 0; index < 38; index++) {
    const seed = hash(`city-star-${index}`);
    const x = 55 + seed % 785;
    const y = 82 + (seed >>> 10) % 114;
    parts.push(`<circle cx="${x}" cy="${y}" r="${index % 9 === 0 ? 1 : 0.55}" fill="#86bddd" opacity="${0.15 + (seed % 4) * 0.09}"/>`);
  }
  parts.push(`<path d="M802 91 A20 20 0 1 0 821 122 A22 22 0 0 1 802 91Z" fill="#b5efff" filter="url(#city-light)"/>
    <path d="M784 143H836" stroke="#10283b" stroke-width="0.6"/>`);

  const floor = [project(-1, -1), project(columns + 1, -1), project(columns + 1, rows + 1), project(-1, rows + 1)];
  parts.push(polygon(floor, 'fill="#010710" stroke="#0a3b60" stroke-width="0.8"'));
  for (let col = -1; col <= columns + 1; col++) {
    parts.push(`<polyline points="${points([project(col, -1), project(col, rows + 1)])}" fill="none" stroke="#093354" stroke-width="0.55" opacity="0.65"/>`);
  }
  for (let row = -1; row <= rows + 1; row++) {
    parts.push(`<polyline points="${points([project(-1, row), project(columns + 1, row)])}" fill="none" stroke="${row === 7 || row === 15 ? "#126ca1" : "#093354"}" stroke-width="${row === 7 || row === 15 ? 1 : 0.55}" opacity="0.65"/>`);
  }

  const cells = days.map((day) => {
    const week = Math.floor((day.time - firstSunday) / (7 * DAY));
    return { ...day, col: week % columns, row: day.weekday + Math.floor(week / columns) * 8 };
  });
  // Increasing ground-plane depth is the painter's order for both visible facades.
  cells.sort((a, b) => a.col + a.row - b.col - b.row || a.row - b.row);

  for (const cell of cells) {
    const [x, y] = project(cell.col + 0.5, cell.row + 0.5);
    const seed = hash(cell.date);
    const w = stepX * (cell.count ? 0.76 + (seed % 4) * 0.025 : 0.83);
    const d = stepY * w / stepX;
    const h = cell.count ? 15 + 137 * Math.pow(cell.count / maximum, 0.58) : 1.5;
    const roofY = y - h;
    const roof = [[x, roofY - d], [x + w, roofY], [x, roofY + d], [x - w, roofY]];
    parts.push(`<g data-city-day="${esc(cell.date)}"><title>${esc(cell.date)}: ${cell.count} contribution${cell.count === 1 ? "" : "s"}</title>`);
    if (!cell.count) {
      parts.push(polygon([[x - w, roofY], [x, roofY + d], [x, y + d], [x - w, y]], 'fill="#04132a"'));
      parts.push(polygon([[x, roofY + d], [x + w, roofY], [x + w, y], [x, y + d]], 'fill="#061d36"'));
      parts.push(polygon(roof, 'fill="#061629" stroke="#103d60" stroke-width="0.5"'));
    } else {
      parts.push(polygon([[x - w, roofY], [x, roofY + d], [x, y + d], [x - w, y]], 'fill="url(#city-wall-left)" stroke="#0a4481" stroke-width="0.45"'));
      parts.push(polygon([[x, roofY + d], [x + w, roofY], [x + w, y], [x, y + d]], 'fill="url(#city-wall-right)" stroke="#0b5396" stroke-width="0.45"'));
      // Window quads follow the facade's isometric slope, not the screen's horizontal.
      const lit = [];
      const dim = [];
      for (const side of [-1, 1]) {
        for (let floorY = 6; floorY < h - 4; floorY += 6) {
          for (let column = 0; column < 3; column++) {
            const u = 0.13 + column * 0.29;
            const v = u + 0.15;
            const top = roofY + d + floorY;
            const vertices = [[x + side * w * u, top - d * u], [x + side * w * v, top - d * v], [x + side * w * v, top - d * v + 1.65], [x + side * w * u, top - d * u + 1.65]];
            const on = hash(`${cell.date}/${side}/${floorY}/${column}`) % 10 < 6;
            (on ? lit : dim).push(`M${points(vertices).replace(/ /g, "L")}Z`);
          }
        }
      }
      parts.push(`<path d="${dim.join("")}" fill="#0a3d63"/>`);
      parts.push(`<path d="${lit.join("")}" fill="${seed % 3 ? "#57d9ff" : "#b1f5ff"}" opacity="0.85"/>`);
      parts.push(`<path d="M${n(x)},${n(roofY + d)}V${n(y + d)}" stroke="#1699ed" stroke-width="0.65" opacity="0.7"/>`);
      parts.push(polygon(roof, 'fill="url(#city-roof)" stroke="#63e5ff" stroke-width="0.65"'));
      parts.push(`<polyline points="${points([[x - w, roofY], [x, roofY - d], [x + w, roofY]])}" fill="none" stroke="#8af5ff" stroke-width="0.8"/>`);
      if (h > 65) {
        const rw = w * 0.36;
        const rd = d * 0.36;
        parts.push(polygon([[x, roofY - rd - 3], [x + rw, roofY - 3], [x, roofY + rd - 3], [x - rw, roofY - 3]], 'fill="#063c77" stroke="#2aa5db" stroke-width="0.5"'));
        if (seed % 3 === 0) {
          parts.push(`<path d="M${n(x)},${n(roofY - 3)}v-11" stroke="#339dd4" stroke-width="0.8"/><circle cx="${n(x)}" cy="${n(roofY - 14)}" r="1" fill="#b3f8ff" filter="url(#city-light)"/>`);
        }
      }
    }
    parts.push("</g>");
  }

  if (!days.length) {
    parts.push(`<text x="450" y="299" text-anchor="middle" font-family="${FONT}" font-size="12" fill="#6593af">Awaiting contribution calendar</text>`);
  }
  parts.push(`</g>
    <g font-family="${FONT}" font-size="10">
      <path d="M36 468H864" stroke="#0c253d"/>
      <text x="36" y="490" fill="#749bb3"><tspan fill="#c1edff">${esc(total.toLocaleString("en-US"))}</tspan> contributions <tspan fill="#355c77">/</tspan> ${days.length} days mapped</text>
      <text x="864" y="490" text-anchor="end" fill="#749bb3">${busiest ? `busiest ${esc(busiest.date)} <tspan fill="#355c77">/</tspan> <tspan fill="#a4eaff">${esc(busiest.count.toLocaleString("en-US"))}</tspan>` : "busiest —"}</text>
      <text x="36" y="508" fill="#35536b" font-size="8" letter-spacing="1.1">${days.length ? `${esc(days[0].date)} — ${esc(days[days.length - 1].date)}` : "NO CALENDAR DATA"}</text>
      <text x="864" y="508" text-anchor="end" fill="#35536b" font-size="8" letter-spacing="1.1">HEIGHT = DAILY CONTRIBUTIONS</text>
    </g>`);
  return { body: parts.join("\n"), height: HEIGHT };
}

module.exports = { renderCity };
