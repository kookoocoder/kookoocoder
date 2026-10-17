const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { computeStreaks, trimContributionWeeks, main } = require("./fetch-data");

const DAY = 86400000;
const today = "2026-10-17";
const now = new Date(`${today}T12:00:00Z`);
const dateAt = (offset) => new Date(Date.parse(today) + offset * DAY).toISOString().slice(0, 10);
const day = (offset, contributionCount = 1) => ({
  date: dateAt(offset), contributionCount,
  weekday: new Date(dateAt(offset)).getUTCDay(),
});
const weeksOf = (...days) => [{ contributionDays: days }];

// Importing the module must neither require a token nor start network requests.
test("empty calendar has no streaks", () => {
  assert.deepEqual(computeStreaks([], today), {
    longest: 0, current: 0, busiest: undefined, days: [],
  });
  assert.deepEqual(trimContributionWeeks([]), []);
});

test("all-zero calendar has no streaks", () => {
  const result = computeStreaks(weeksOf(day(-2, 0), day(-1, 0), day(0, 0)), today);
  assert.equal(result.current, 0);
  assert.equal(result.longest, 0);
});

test("zero today preserves yesterday's active streak", () => {
  const result = computeStreaks(weeksOf(day(-2), day(-1, 4), day(0, 0)), today);
  assert.equal(result.current, 2);
  assert.equal(result.longest, 2);
  assert.equal(result.busiest.date, dateAt(-1));
});

test("active today extends the streak and unsorted input is supported", () => {
  const result = computeStreaks(weeksOf(day(0), day(-2), day(-1)), today);
  assert.equal(result.current, 3);
  assert.equal(result.longest, 3);
});

test("trailing future zero day does not hide today's active streak", () => {
  const weeks = weeksOf(day(-1, 2), day(0, 3), day(1, 0));
  const result = computeStreaks(weeks, today);
  assert.equal(result.current, 2);
  assert.equal(result.longest, 2);
  assert.equal(result.busiest.date, today);
  assert.deepEqual(result.days.map((entry) => entry.date), [dateAt(-1), today]);
  assert.equal(trimContributionWeeks(weeks)[0].contributionDays.at(-1).date, dateAt(1));
});

test("future activity cannot extend longest or current streaks", () => {
  const result = computeStreaks(weeksOf(day(0, 3), day(1, 10), day(2, 20)), today);
  assert.equal(result.current, 1);
  assert.equal(result.longest, 1);
  assert.equal(result.busiest.date, today);
});

test("yesterday may be active when today is absent, but older activity is stale", () => {
  assert.equal(computeStreaks(weeksOf(day(-2), day(-1)), today).current, 2);
  assert.equal(computeStreaks(weeksOf(day(-3), day(-2)), today).current, 0);
});

test("zero yesterday or a missing date breaks a streak", () => {
  assert.equal(computeStreaks(weeksOf(day(-2), day(-1, 0), day(0, 0)), today).current, 0);
  const result = computeStreaks(weeksOf(day(-3), day(-2), day(0)), today);
  assert.equal(result.current, 1);
  assert.equal(result.longest, 2);
});

test("longest streak is independent of current streak", () => {
  const result = computeStreaks(weeksOf(
    day(-6), day(-5), day(-4, 7), day(-3, 0), day(-2), day(-1), day(0, 0)
  ), today);
  assert.equal(result.longest, 3);
  assert.equal(result.current, 2);
  assert.equal(result.busiest.contributionCount, 7);
});

test("trim keeps exactly the latest 365 days, preserves weeks, and does not mutate input", () => {
  const days = Array.from({ length: 372 }, (_, index) => day(index - 371));
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push({ marker: index, contributionDays: days.slice(index, index + 7) });
  }
  const original = JSON.stringify(weeks);
  const trimmed = trimContributionWeeks(weeks);
  const result = computeStreaks(weeks, today);
  assert.equal(trimmed.flatMap((week) => week.contributionDays).length, 365);
  assert.equal(result.days[0].date, dateAt(-364));
  assert.equal(result.days.at(-1).date, today);
  assert.equal(result.longest, 365);
  assert.equal(result.current, 365);
  assert.ok(trimmed.every((week) => week.contributionDays.length > 0 && "marker" in week));
  assert.equal(JSON.stringify(weeks), original);
});

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "profile-fetch-test-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const outputPath = path.join(directory, "data.json");
  fs.writeFileSync(outputPath, "previous data");
  return {
    directory, outputPath,
    // Deliberately synthetic: never read credentials or contact GitHub in tests.
    options: { login: "example", token: "test-only-token", now, outputPath },
  };
}

function repository(name) {
  return {
    name, description: name, stargazerCount: 2, forkCount: 1,
    url: `https://github.com/example/${name}`, pushedAt: now.toISOString(),
    primaryLanguage: { name: "JavaScript" },
  };
}

function response(nodes, hasNextPage = false, endCursor = null) {
  return {
    data: {
      user: {
        login: "example", name: "Example", bio: "Public profile",
        avatarUrl: "https://example.com/avatar", createdAt: "2020-01-01T00:00:00Z",
        followers: { totalCount: 3 }, following: { totalCount: 4 },
        repositories: { nodes, totalCount: 103, pageInfo: { hasNextPage, endCursor } },
        contributionsCollection: {
          totalCommitContributions: 8, totalPullRequestContributions: 2,
          totalPullRequestReviewContributions: 3, totalIssueContributions: 4,
          totalRepositoryContributions: 5,
          contributionCalendar: {
            totalContributions: 999,
            weeks: weeksOf(day(-365, 900), day(-364, 3), day(-1, 4), day(0, 2)),
          },
        },
      },
    },
  };
}
const ok = (value) => ({ ok: true, json: async () => value });

function checkTimeout(options) {
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.signal.aborted, false);
}

test("paginates public owner nonfork repos and excludes only aggregate languages", async (t) => {
  const { options, outputPath, directory } = fixture(t);
  const first = Array.from({ length: 100 }, (_, index) => repository(`repo-${index}`));
  const excluded = ["kookoocoder", "paisa", "chess-game-"].map(repository);
  const cursors = [];
  let languageCalls = 0;
  const data = await main({
    ...options,
    fetchFn: async (url, request) => {
      checkTimeout(request);
      if (url.endsWith("/graphql")) {
        const { query, variables } = JSON.parse(request.body);
        assert.match(query, /first: 100, after: \$cursor/);
        assert.match(query, /ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC/);
        assert.match(query, /contributionsCollection\s*\{/);
        cursors.push(variables.cursor);
        return ok(variables.cursor === null
          ? response(first, true, "page-2") : response(excluded));
      }
      languageCalls += 1;
      const name = url.split("/").at(-2);
      return ok(excluded.some((repo) => repo.name === name) ? { "C#": 1000000 } : { JavaScript: 10 });
    },
  });
  assert.deepEqual(cursors, [null, "page-2"]);
  assert.equal(languageCalls, 103);
  assert.equal(data.totalRepos, 103);
  assert.equal(data.totalStars, 206);
  assert.equal(data.totalForks, 103);
  assert.equal(data.repos.length, 103);
  assert.deepEqual(data.languageExclusions, excluded.map((repo) => repo.name));
  assert.deepEqual(data.languages, [{ name: "JavaScript", bytes: 1000, pct: 100 }]);
  for (const repo of data.repos) {
    assert.deepEqual(repo.languages, repo.name.startsWith("repo-") ? { JavaScript: 10 } : { "C#": 1000000 });
  }
  assert.equal(data.contributions.total, 9);
  assert.equal(data.contributions.commits, 8);
  assert.equal(data.contributions.period, "rolling last 365 days");
  assert.equal(data.contributions.weeks[0].contributionDays[0].date, dateAt(-364));
  assert.equal(data.contributions.total, data.contributions.weeks
    .flatMap((week) => week.contributionDays)
    .reduce((sum, entry) => sum + entry.contributionCount, 0));
  assert.deepEqual(JSON.parse(fs.readFileSync(outputPath, "utf8")), data);
  assert.deepEqual(fs.readdirSync(directory), ["data.json"]);
});

for (const failure of ["http", "graphql", "language", "timeout", "pagination"]) {
  test(`${failure} failure rejects and leaves previous data intact`, async (t) => {
    const { options, outputPath, directory } = fixture(t);
    await assert.rejects(main({
      ...options,
      fetchFn: async (url, request) => {
        checkTimeout(request);
        if (failure === "timeout") throw new DOMException("Request timed out", "TimeoutError");
        if (url.endsWith("/graphql")) {
          if (failure === "http") return { ok: false, status: 403 };
          if (failure === "graphql") return ok({ errors: [{ message: "Query rejected" }] });
          if (failure === "pagination") return ok(response([], true, null));
          return ok(response([repository("repo")]));
        }
        return { ok: false, status: 503 };
      },
    }), {
      message: {
        http: /GraphQL request failed: HTTP 403/,
        graphql: /GraphQL errors: Query rejected/,
        language: /REST \/repos\/example\/repo\/languages failed: HTTP 503/,
        timeout: /GraphQL request failed: Request timed out/,
        pagination: /pagination did not advance/,
      }[failure],
    });
    assert.equal(fs.readFileSync(outputPath, "utf8"), "previous data");
    assert.deepEqual(fs.readdirSync(directory), ["data.json"]);
  });
}

test("future calendar days remain persisted while streaks stop at fetchedAt today", async (t) => {
  const { options } = fixture(t);
  const payload = response([]);
  payload.data.user.contributionsCollection.contributionCalendar.weeks =
    weeksOf(day(-1, 2), day(0, 3), day(1, 0));
  const data = await main({ ...options, fetchFn: async () => ok(payload) });
  assert.equal(data.contributions.currentStreak, 2);
  assert.equal(data.contributions.longestStreak, 2);
  assert.equal(data.contributions.total, 5);
  assert.equal(data.contributions.weeks[0].contributionDays.at(-1).date, dateAt(1));
});

test("empty public repository list is supported", async (t) => {
  const { options } = fixture(t);
  const data = await main({ ...options, fetchFn: async () => ok(response([])) });
  assert.equal(data.totalRepos, 0);
  assert.equal(data.totalStars, 0);
  assert.deepEqual(data.languages, []);
});

test("each request has a 30-second timeout", async (t) => {
  const { options } = fixture(t);
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  const durations = [];
  t.mock.method(AbortSignal, "timeout", (duration) => {
    durations.push(duration);
    return timeout(duration);
  });
  await main({
    ...options,
    fetchFn: async (url) => ok(url.endsWith("/graphql")
      ? response([repository("repo")]) : { JavaScript: 10 }),
  });
  assert.deepEqual(durations, [30000, 30000]);
});

test("publishes complete JSON with a same-directory atomic rename", async (t) => {
  const { options, outputPath, directory } = fixture(t);
  const rename = fs.renameSync;
  let renamed = false;
  t.mock.method(fs, "renameSync", (source, destination) => {
    assert.equal(destination, outputPath);
    assert.equal(path.dirname(source), directory);
    assert.equal(fs.readFileSync(destination, "utf8"), "previous data");
    assert.equal(JSON.parse(fs.readFileSync(source, "utf8")).totalRepos, 0);
    renamed = true;
    rename(source, destination);
  });
  await main({ ...options, fetchFn: async () => ok(response([])) });
  assert.equal(renamed, true);
  assert.deepEqual(fs.readdirSync(directory), ["data.json"]);
});
