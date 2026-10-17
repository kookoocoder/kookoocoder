#!/usr/bin/env node
// Fetches public GitHub data for the profile README generator and writes tools/data.json.

const fs = require("fs");
const path = require("path");

const DAY = 86400000;
const LANGUAGE_EXCLUSIONS = ["kookoocoder", "paisa", "chess-game-"];

function trimContributionWeeks(weeks) {
  const days = weeks.flatMap((week) => week.contributionDays);
  const latest = Math.max(...days.map((day) => Date.parse(day.date)));
  return weeks
    .map((week) => ({
      ...week,
      contributionDays: week.contributionDays.filter(
        (day) => Date.parse(day.date) > latest - 365 * DAY
      ),
    }))
    .filter((week) => week.contributionDays.length);
}

function computeStreaks(weeks, today = new Date().toISOString().slice(0, 10)) {
  const days = trimContributionWeeks(weeks)
    .flatMap((week) => week.contributionDays)
    .filter((day) => day.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let running = 0;
  let busiest;
  let previous;

  for (const day of days) {
    if (day.contributionCount > 0) {
      running = previous && Date.parse(day.date) - Date.parse(previous.date) === DAY
        ? running + 1 : 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
    if (!busiest || day.contributionCount > busiest.contributionCount) busiest = day;
    previous = day;
  }

  // Today may still be empty, but missing dates and older gaps break a streak.
  let expected = Date.parse(today);
  let index = days.length - 1;
  if (!days[index] || days[index].date !== today || days[index].contributionCount === 0) {
    if (days[index]?.date === today) index -= 1;
    expected -= DAY;
  }
  let current = 0;
  for (; index >= 0; index -= 1) {
    const day = days[index];
    if (Date.parse(day.date) !== expected || day.contributionCount <= 0) break;
    current += 1;
    expected -= DAY;
  }
  return { longest, current, busiest, days };
}

function createClient(token, fetchFn) {
  async function request(url, options, label) {
    try {
      const response = await fetchFn(url, {
        ...options,
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      // Do not include request headers or response bodies in failure diagnostics.
      const message = String(error.message).split(token).join("[redacted]");
      throw new Error(`${label} failed: ${message}`);
    }
  }
  return {
    async gql(query, variables) {
      const json = await request("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      }, "GraphQL request");
      if (json.errors?.length) {
        const message = json.errors.map((error) => error.message).join("; ");
        throw new Error(`GraphQL errors: ${message.split(token).join("[redacted]")}`);
      }
      if (!json.data?.user) throw new Error("GraphQL response missing user data");
      return json.data;
    },
    rest(pathname) {
      return request(`https://api.github.com${pathname}`, {
        headers: {
          Authorization: `bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }, `REST ${pathname}`);
    },
  };
}

async function main({
  login = process.env.PROFILE_LOGIN || "kookoocoder",
  token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
  fetchFn = globalThis.fetch,
  outputPath = path.join(__dirname, "data.json"),
  now = new Date(),
} = {}) {
  if (!token) throw new Error("Missing GH_TOKEN / GITHUB_TOKEN env var.");
  const { gql, rest } = createClient(token, fetchFn);
  const query = `
    query($login: String!, $cursor: String) {
      user(login: $login) {
        login
        name
        bio
        avatarUrl
        createdAt
        followers { totalCount }
        following { totalCount }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          totalRepositoryContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                weekday
              }
            }
          }
        }
        repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes {
            name
            description
            stargazerCount
            forkCount
            url
            pushedAt
            primaryLanguage { name }
          }
        }
      }
    }
  `;
  let user;
  let cursor = null;
  const repos = [];
  do {
    const page = await gql(query, { login, cursor });
    user ||= page.user;
    repos.push(...page.user.repositories.nodes);
    const { hasNextPage, endCursor } = page.user.repositories.pageInfo;
    if (hasNextPage && (!endCursor || endCursor === cursor)) {
      throw new Error("GraphQL repository pagination did not advance");
    }
    cursor = hasNextPage ? endCursor : null;
  } while (cursor);

  const weeks = trimContributionWeeks(user.contributionsCollection.contributionCalendar.weeks);
  const streaks = computeStreaks(weeks, now.toISOString().slice(0, 10));
  const languageBytes = {};
  for (const repo of repos) {
    repo.languages = await rest(`/repos/${encodeURIComponent(login)}/${encodeURIComponent(repo.name)}/languages`);
    if (LANGUAGE_EXCLUSIONS.includes(repo.name.toLowerCase())) continue;
    for (const [language, bytes] of Object.entries(repo.languages)) {
      languageBytes[language] = (languageBytes[language] || 0) + bytes;
    }
  }

  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);
  const languagePct = Object.entries(languageBytes)
    .map(([name, bytes]) => ({ name, bytes, pct: totalBytes ? (bytes / totalBytes) * 100 : 0 }))
    .sort((a, b) => b.bytes - a.bytes);

  const data = {
    fetchedAt: now.toISOString(),
    login: user.login,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    following: user.following.totalCount,
    totalRepos: repos.length,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forkCount, 0),
    contributions: {
      period: "rolling last 365 days",
      total: weeks.flatMap((week) => week.contributionDays)
        .reduce((sum, day) => sum + day.contributionCount, 0),
      commits: user.contributionsCollection.totalCommitContributions,
      pullRequests: user.contributionsCollection.totalPullRequestContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      repositoriesContributedTo: user.contributionsCollection.totalRepositoryContributions,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      busiestDay: streaks.busiest,
      weeks,
    },
    languageExclusions: [...LANGUAGE_EXCLUSIONS],
    languages: languagePct,
    repos: repos
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        url: repo.url,
        pushedAt: repo.pushedAt,
        language: repo.primaryLanguage?.name || null,
        languages: repo.languages,
      }))
      .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)),
  };

  const temporaryPath = `${outputPath}.${process.pid}.${require("crypto").randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), { flag: "wx" });
    fs.renameSync(temporaryPath, outputPath);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
  console.log("Wrote tools/data.json");
  return data;
}

module.exports = { computeStreaks, trimContributionWeeks, main };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
