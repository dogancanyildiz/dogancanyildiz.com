#!/usr/bin/env node
// Derives the next semantic version from the Conventional Commits made since
// the last v* tag, renders the release notes and, on request, prepends the
// entry to CHANGELOG.md. No dependencies on purpose: this runs in CI right
// after `npm ci` but must also work from a bare checkout.
//
// Usage:
//   node scripts/release-version.mjs                       # print JSON, write nothing
//   node scripts/release-version.mjs --dry-run             # same, explicit
//   node scripts/release-version.mjs --print-notes         # include the notes in the JSON
//   node scripts/release-version.mjs --notes-out notes.md  # also write the notes
//   node scripts/release-version.mjs --version 1.0.0       # force the version
//   node scripts/release-version.mjs --write-changelog     # prepend to CHANGELOG.md
//   node scripts/release-version.mjs --write-changelog --version 0.2.0 \
//     --notes-in notes.md --previous-tag v0.1.0            # reuse rendered notes
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const changelogPath = resolve(repoRoot, "CHANGELOG.md");
const packageJsonPath = resolve(repoRoot, "package.json");

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SUBJECT = /^([a-zA-Z]+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/;

// Which commit types move which part of the version. Everything that is not
// listed here (chore, docs, ci, test, style, build, revert, a plain subject)
// is release neutral: it shows up in the notes but never cuts a version on
// its own.
const MINOR_TYPES = new Set(["feat"]);
const PATCH_TYPES = new Set(["fix", "perf", "refactor"]);

const BUMP_RANK = { patch: 1, minor: 2, major: 3 };

/**
 * Splits a commit subject into its Conventional Commits parts. A subject that
 * does not follow the convention keeps its raw text and gets a null type.
 */
export function parseCommitSubject(subject) {
  const trimmed = String(subject ?? "").trim();
  const match = SUBJECT.exec(trimmed);
  if (!match) {
    return {
      type: null,
      scope: null,
      breaking: false,
      description: trimmed,
    };
  }
  return {
    type: match[1].toLowerCase(),
    scope: match[2] ? match[2].trim() : null,
    breaking: Boolean(match[3]),
    description: match[4].trim(),
  };
}

/**
 * Normalizes a raw `git log` record into the shape the rest of the script
 * works with. `BREAKING CHANGE:` anywhere in the body is as breaking as the
 * `!` marker in the subject.
 */
export function parseCommit(commit) {
  const parsed = parseCommitSubject(commit.subject);
  const body = String(commit.body ?? "");
  const breakingInBody = /^BREAKING[ -]CHANGE:/m.test(body);
  return {
    sha: String(commit.sha ?? ""),
    shortSha: String(commit.sha ?? "").slice(0, 7),
    subject: String(commit.subject ?? "").trim(),
    type: parsed.type,
    scope: parsed.scope,
    description: parsed.description,
    breaking: parsed.breaking || breakingInBody,
  };
}

/**
 * Returns "major", "minor", "patch" or null when nothing in the range is
 * worth a release.
 */
export function decideBump(commits) {
  let bump = null;
  for (const raw of commits) {
    const commit = raw.type === undefined ? parseCommit(raw) : raw;
    let candidate = null;
    if (commit.breaking) {
      candidate = "major";
    } else if (commit.type && MINOR_TYPES.has(commit.type)) {
      candidate = "minor";
    } else if (commit.type && PATCH_TYPES.has(commit.type)) {
      candidate = "patch";
    }
    if (candidate && (!bump || BUMP_RANK[candidate] > BUMP_RANK[bump])) {
      bump = candidate;
    }
  }
  return bump;
}

export function bumpVersion(version, bump) {
  const match = SEMVER.exec(String(version));
  if (!match) {
    throw new Error(`not a semantic version: ${version}`);
  }
  const [major, minor, patch] = match.slice(1).map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  throw new Error(`unknown bump: ${bump}`);
}

export function groupCommits(commits) {
  const groups = { features: [], fixes: [], other: [] };
  for (const raw of commits) {
    const commit = raw.type === undefined ? parseCommit(raw) : raw;
    if (commit.type === "feat") groups.features.push(commit);
    else if (commit.type === "fix") groups.fixes.push(commit);
    else groups.other.push(commit);
  }
  return groups;
}

export function formatCommitLine(commit) {
  const parts = [];
  if (commit.breaking) parts.push("**BREAKING**");
  if (commit.scope) parts.push(`**${commit.scope}**:`);
  parts.push(commit.description || commit.subject);
  return `- \`${commit.shortSha}\` ${parts.join(" ")}`;
}

export function compareUrl({ repoUrl, previousTag, tag }) {
  if (!repoUrl) return null;
  if (previousTag) return `${repoUrl}/compare/${previousTag}...${tag}`;
  return `${repoUrl}/commits/${tag}`;
}

/**
 * Renders the grouped body used both by the GitHub Release and by the
 * CHANGELOG entry. Empty groups are dropped instead of printing a heading
 * with nothing under it.
 */
export function renderNotes({ commits, tag, previousTag, repoUrl }) {
  const groups = groupCommits(commits);
  const sections = [
    ["Features", groups.features],
    ["Fixes", groups.fixes],
    ["Other", groups.other],
  ];
  const blocks = [];
  for (const [title, list] of sections) {
    if (list.length === 0) continue;
    blocks.push(`### ${title}\n\n${list.map(formatCommitLine).join("\n")}`);
  }
  if (blocks.length === 0) {
    blocks.push("No commits since the previous release.");
  }
  const url = compareUrl({ repoUrl, previousTag, tag });
  if (url) {
    const label = previousTag ? `${previousTag}...${tag}` : tag;
    blocks.push(`**Full changelog**: [${label}](${url})`);
  }
  return `${blocks.join("\n\n")}\n`;
}

/**
 * Prepends a released version to a Keep a Changelog document, right below the
 * Unreleased heading, and refreshes the link references at the bottom.
 */
export function insertChangelogEntry(
  changelog,
  { version, date, notes, repoUrl, previousTag, tag }
) {
  const entry = `## [${version}] - ${date}\n\n${notes.trim()}\n`;
  const unreleased = /^## \[Unreleased\].*$/m.exec(changelog);
  if (!unreleased) {
    throw new Error("CHANGELOG.md has no '## [Unreleased]' heading");
  }
  if (
    new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m").test(
      changelog
    )
  ) {
    return changelog;
  }
  const headingEnd = unreleased.index + unreleased[0].length;
  const rest = changelog.slice(headingEnd);
  // Keep whatever sits under Unreleased where it is; the new version block
  // goes in front of the first following version heading, or at the end.
  const nextVersionHeading = /^## \[\d+\.\d+\.\d+\]/m.exec(rest);
  const linkRefs = /^\[Unreleased\]:/m.exec(rest);
  const cutRelative =
    nextVersionHeading?.index ?? linkRefs?.index ?? rest.length;
  const head = changelog.slice(0, headingEnd) + rest.slice(0, cutRelative);
  const tail = rest.slice(cutRelative);
  let result = `${head.replace(/\s+$/, "")}\n\n${entry}\n${tail.replace(/^\n+/, "")}`;

  if (repoUrl) {
    const url = compareUrl({ repoUrl, previousTag, tag });
    result = result.replace(
      /^\[Unreleased\]:.*$/m,
      `[Unreleased]: ${repoUrl}/compare/${tag}...HEAD`
    );
    if (
      !new RegExp(`^\\[${version.replace(/\./g, "\\.")}\\]:`, "m").test(result)
    ) {
      result = result.replace(
        /^\[Unreleased\]:.*$/m,
        (line) => `${line}\n[${version}]: ${url}`
      );
    }
  }
  return result.replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}

// Picks the highest released version by semver, not by branch reachability.
// A tag lives on main the moment the release workflow pushes it; a checkout
// of dev can be behind that push for as long as the sync pull request sits
// unmerged, so filtering with `--merged HEAD` used to hide the newest tag on
// every branch except main.
export function pickHighestTag(tags) {
  let best = null;
  let bestParts = null;
  for (const tag of tags) {
    const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
    if (!match) continue;
    const parts = [Number(match[1]), Number(match[2]), Number(match[3])];
    const isHigher =
      !bestParts ||
      parts[0] > bestParts[0] ||
      (parts[0] === bestParts[0] && parts[1] > bestParts[1]) ||
      (parts[0] === bestParts[0] &&
        parts[1] === bestParts[1] &&
        parts[2] > bestParts[2]);
    if (isHigher) {
      best = tag;
      bestParts = parts;
    }
  }
  return best;
}

function lastReleaseTag() {
  let tags = "";
  try {
    tags = git(["tag", "--list", "v[0-9]*.[0-9]*.[0-9]*"]);
  } catch {
    return null;
  }
  return pickHighestTag(tags.split("\n").filter(Boolean));
}

function currentBranch() {
  try {
    return git(["rev-parse", "--abbrev-ref", "HEAD"]);
  } catch {
    return null;
  }
}

function commitsSince(tag) {
  const range = tag ? [`${tag}..HEAD`] : [];
  const raw = git([
    "log",
    "--no-merges",
    "--format=%H%x1f%s%x1f%b%x1e",
    ...range,
  ]);
  return raw
    .split("\x1e")
    .map((record) => record.replace(/^\n+/, ""))
    .filter((record) => record.trim().length > 0)
    .map((record) => {
      const [sha, subject, body] = record.split("\x1f");
      return parseCommit({ sha, subject, body });
    });
}

function detectRepoUrl() {
  const server = process.env.GITHUB_SERVER_URL;
  const slug = process.env.GITHUB_REPOSITORY;
  if (server && slug) return `${server.replace(/\/$/, "")}/${slug}`;
  let remote = "";
  try {
    remote = git(["remote", "get-url", "origin"]);
  } catch {
    return null;
  }
  const ssh = /^git@([^:]+):(.+?)(?:\.git)?$/.exec(remote);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  const https = /^https?:\/\/(.+?)(?:\.git)?$/.exec(remote);
  if (https) return `https://${https[1]}`;
  return null;
}

function packageVersion() {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (!SEMVER.test(String(pkg.version))) {
    throw new Error(
      `package.json version is not a semantic version: ${pkg.version}`
    );
  }
  return pkg.version;
}

export function parseArgs(argv) {
  const options = {
    dryRun: false,
    printNotes: false,
    writeChangelog: false,
    version: null,
    notesOut: null,
    notesIn: null,
    previousTag: null,
    date: null,
  };
  const takesValue = new Set([
    "--version",
    "--notes-out",
    "--notes-in",
    "--previous-tag",
    "--date",
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = takesValue.has(flag) ? argv[(i += 1)] : null;
    if (takesValue.has(flag) && value === undefined) {
      throw new Error(`${flag} needs a value`);
    }
    switch (flag) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--print-notes":
        options.printNotes = true;
        break;
      case "--write-changelog":
        options.writeChangelog = true;
        break;
      case "--version":
        if (!SEMVER.test(value)) {
          throw new Error(`--version must look like 1.2.3, got: ${value}`);
        }
        options.version = value;
        break;
      case "--notes-out":
        options.notesOut = value;
        break;
      case "--notes-in":
        options.notesIn = value;
        break;
      case "--previous-tag":
        options.previousTag = value || null;
        break;
      case "--date":
        options.date = value;
        break;
      default:
        throw new Error(`unknown flag: ${flag}`);
    }
  }
  return options;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function main(argv) {
  const options = parseArgs(argv);
  const repoUrl = detectRepoUrl();

  // Reuse mode: the notes were rendered on the release commit and are being
  // replayed onto another branch, so git history must not be consulted again.
  if (options.notesIn) {
    if (!options.version) {
      throw new Error("--notes-in requires --version");
    }
    const notes = readFileSync(options.notesIn, "utf8");
    const tag = `v${options.version}`;
    const result = {
      previousTag: options.previousTag,
      currentVersion: null,
      bump: null,
      shouldRelease: true,
      version: options.version,
      tag,
      commitCount: null,
      compareUrl: compareUrl({
        repoUrl,
        previousTag: options.previousTag,
        tag,
      }),
      notes: options.printNotes ? notes : null,
    };
    if (options.writeChangelog && !options.dryRun) {
      writeChangelog({ ...result, options, repoUrl, notes });
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (!options.previousTag) {
    const branch = currentBranch();
    if (branch && branch !== "main" && branch !== "HEAD") {
      console.error(
        `Warning: running on branch "${branch}", not main. The previous ` +
          `tag is the newest release across the whole repository, so the ` +
          `commit range below may include commits that already shipped on ` +
          `main and have not reached this branch yet.`
      );
    }
  }

  const previousTag = options.previousTag ?? lastReleaseTag();
  const currentVersion = previousTag
    ? previousTag.replace(/^v/, "")
    : packageVersion();
  const commits = commitsSince(previousTag);
  const bump = decideBump(commits);
  const version =
    options.version ?? (bump ? bumpVersion(currentVersion, bump) : null);
  const shouldRelease = Boolean(version);
  const tag = version ? `v${version}` : null;
  const notes = shouldRelease
    ? renderNotes({ commits, tag, previousTag, repoUrl })
    : "";

  const result = {
    previousTag,
    currentVersion,
    bump,
    shouldRelease,
    version,
    tag,
    commitCount: commits.length,
    compareUrl: shouldRelease
      ? compareUrl({ repoUrl, previousTag, tag })
      : null,
    // The notes can run to hundreds of lines; they stay out of the JSON
    // unless they were asked for, and go to --notes-out for real use.
    notes: options.printNotes ? notes : null,
  };

  if (shouldRelease && options.notesOut && !options.dryRun) {
    writeFileSync(options.notesOut, notes, "utf8");
  }
  if (shouldRelease && options.writeChangelog && !options.dryRun) {
    writeChangelog({ ...result, options, repoUrl, notes });
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function writeChangelog({
  version,
  tag,
  previousTag,
  options,
  repoUrl,
  notes,
}) {
  if (!existsSync(changelogPath)) {
    throw new Error("CHANGELOG.md not found");
  }
  const changelog = readFileSync(changelogPath, "utf8");
  const next = insertChangelogEntry(changelog, {
    version,
    date: options.date ?? today(),
    notes,
    repoUrl,
    previousTag,
    tag,
  });
  writeFileSync(changelogPath, next, "utf8");
}

const invokedDirectly =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
