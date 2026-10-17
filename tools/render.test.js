"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { renderCity } = require("./city");
const { renderHeader, renderStats, renderContributionCity, renderFooter, renderReadme, build } = require("./render");
const { esc } = require("./style");
const profile = require("./curated");

function fixture(length = 365) {
  const days = Array.from({ length }, (_, index) => {
    const date = new Date(Date.UTC(2025, 0, index + 1));
    return { date: date.toISOString().slice(0, 10), weekday: date.getUTCDay(), contributionCount: index % 4 ? 0 : index % 34 };
  });
  return {
    fetchedAt: "2026-01-01T03:00:00Z", totalRepos: 28,
    contributions: { total: days.reduce((sum, day) => sum + day.contributionCount, 0), currentStreak: 0, longestStreak: 8, weeks: [{ contributionDays: days }] },
    languages: [{ name: "TypeScript", pct: 72.5 }, { name: "Python", pct: 27.5 }],
  };
}

test("README has substantive Markdown and ordinary clickable project links", () => {
  const readme = renderReadme(fixture());
  assert.match(readme, /^# Preetam Gaikwad/m);
  for (const section of ["about", "activity", "selected-builds", "toolkit", "engineering-notes", "connect"]) {
    assert.ok(readme.includes(`## \`~/${section}\``));
  }
  for (const project of profile.projects) assert.ok(readme.includes(`https://github.com/kookoocoder/${project.repo}`));
  assert.ok(readme.split(/\s+/).length > 600);
  assert.equal((readme.match(/!\[/g) || []).length, 4);
  assert.ok(!readme.includes("<img"));
  assert.match(readme, /no real visa is issued/);
  assert.match(readme, /not a claim of profitable live trading/);
});

test("graphics are self-contained, accessible SVG documents", () => {
  for (const svg of [renderHeader(), renderStats(fixture()), renderContributionCity(fixture()), renderFooter()]) {
    assert.match(svg, /^<svg /);
    assert.match(svg, /role="img"/);
    assert.match(svg, /<title id="title">.+<\/title>/);
    assert.match(svg, /<desc id="desc">.+<\/desc>/);
    assert.match(svg, /<\/svg>\n$/);
    assert.ok(!svg.includes("NaN") && !svg.includes("undefined"));
    assert.ok(!/<script|<foreignObject|<image|<a\b|https?:\/\/(?!www.w3.org)/.test(svg));
  }
});

test("animations respect reduced motion and header is personalized", () => {
  const header = renderHeader();
  assert.match(header, /prefers-reduced-motion:reduce/);
  assert.match(header, /PREETAM GAIKWAD/);
  assert.ok(!header.includes("GIORGI"));
});

test("city is deterministic, blue, and maps exactly the latest 365 days", () => {
  const data = fixture(400);
  const first = renderCity(data);
  assert.deepEqual(first, renderCity(data));
  assert.equal((first.body.match(/data-city-day=/g) || []).length, 365);
  assert.ok(!first.body.includes('data-city-day="2025-01-01"'));
  assert.match(first.body, /city-wall-left/);
  assert.match(first.body, /city-roof/);
  assert.match(first.body, /365 days mapped/);
});

test("city handles zero activity, missing days, empty data, and invalid inputs", () => {
  for (const data of [{}, { contributions: { weeks: [] } }, { contributions: { weeks: [{ contributionDays: [{ date: "not a date", contributionCount: 10 }] }] } }]) {
    const city = renderCity(data);
    assert.match(city.body, /Awaiting contribution calendar/);
    assert.ok(!city.body.includes("NaN"));
  }
});

test("dynamic SVG values are XML escaped", () => {
  assert.equal(esc('<tag a="x">&\u0000'), "&lt;tag a=&quot;x&quot;&gt;&amp;");
  const data = fixture();
  data.languages = [{ name: 'A&B <"language">', pct: 100 }];
  assert.match(renderStats(data), /A&amp;B &lt;&quot;language&quot;&gt;/);
});

test("stats support an empty language breakdown", () => {
  const data = fixture();
  data.languages = [];
  assert.ok(!renderStats(data).includes("NaN"));
});

test("build writes the README and exactly four referenced SVG assets", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kookoo-profile-"));
  try {
    build(fixture(), root);
    const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
    const images = [...readme.matchAll(/!\[[^\]]*\]\(\.\/([^)]*)\)/g)];
    for (const image of images) assert.ok(fs.existsSync(path.join(root, image[1])));
    assert.equal(fs.readdirSync(path.join(root, "assets")).length, 4);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
