#!/usr/bin/env node
// Fetches live GitHub data for the profile README generator and writes tools/data.json

const fs = require("fs");
const path = require("path");

const LOGIN = process.env.PROFILE_LOGIN || "kookoocoder";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("Missing GH_TOKEN / GITHUB_TOKEN env var.");
  process.exit(1);
}

const GQL_URL = "https://api.github.com/graphql";
const REST_URL = "https://api.github.com";

async function gql(query, variables) {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

async function rest(pathname) {
  const res = await fetch(`${REST_URL}${pathname}`, {
    headers: {
      Authorization: `bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    throw new Error(`REST ${pathname} failed: ${res.status}`);
  }
  return res.json();
}

function computeStreaks(weeks) {
  const days = [];
  for (const w of weeks) {
    for (const d of w.contributionDays) {
      days.push(d);
    }
  }
  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  let longest = 0;
  let running = 0;
  let busiest = days[0];

  for (const d of days) {
    if (d.contributionCount > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
    if (d.contributionCount > (busiest?.contributionCount ?? -1)) {
      busiest = d;
    }
  }

  // current streak: walk backwards from the most recent day
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) {
      current += 1;
    } else {
      // allow "today" to be a zero-contribution day without breaking the streak
      if (i === days.length - 1) continue;
      break;
    }
  }

  return { longest, current, busiest, days };
}

async function main() {
  const userData = await gql(
    `
    query($login: String!) {
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
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
          totalCount
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
  `,
    { login: LOGIN }
  );

  const user = userData.user;
  const cal = user.contributionsCollection.contributionCalendar;
  const streaks = computeStreaks(cal.weeks);

  const repoNames = user.repositories.nodes.map((r) => r.name);
  const languageBytes = {};
  for (const name of repoNames) {
    try {
      const langs = await rest(`/repos/${LOGIN}/${name}/languages`);
      for (const [lang, bytes] of Object.entries(langs)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
    } catch (e) {
      console.error(`skip languages for ${name}: ${e.message}`);
    }
  }

  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);
  const languagePct = Object.entries(languageBytes)
    .map(([name, bytes]) => ({ name, bytes, pct: totalBytes ? (bytes / totalBytes) * 100 : 0 }))
    .sort((a, b) => b.bytes - a.bytes);

  const totalStars = user.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
  const totalForks = user.repositories.nodes.reduce((a, r) => a + r.forkCount, 0);

  const data = {
    fetchedAt: new Date().toISOString(),
    login: user.login,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    following: user.following.totalCount,
    totalRepos: user.repositories.totalCount,
    totalStars,
    totalForks,
    contributions: {
      total: cal.totalContributions,
      commits: user.contributionsCollection.totalCommitContributions,
      pullRequests: user.contributionsCollection.totalPullRequestContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      repositoriesContributedTo: user.contributionsCollection.totalRepositoryContributions,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      busiestDay: streaks.busiest,
      weeks: cal.weeks,
    },
    languages: languagePct,
    repos: user.repositories.nodes
      .map((r) => ({
        name: r.name,
        description: r.description,
        stars: r.stargazerCount,
        forks: r.forkCount,
        url: r.url,
        pushedAt: r.pushedAt,
        language: r.primaryLanguage?.name || null,
      }))
      .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)),
  };

  fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data, null, 2));
  console.log("Wrote tools/data.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
