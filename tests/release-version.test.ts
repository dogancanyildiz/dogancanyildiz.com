import { describe, expect, it } from "vitest";

import {
  bumpVersion,
  decideBump,
  formatCommitLine,
  groupCommits,
  insertChangelogEntry,
  parseArgs,
  parseCommit,
  parseCommitSubject,
  pickHighestTag,
  renderNotes,
} from "../scripts/release-version.mjs";

const commit = (sha: string, subject: string, body = "") => ({
  sha,
  subject,
  body,
});

const repoUrl = "https://github.com/dogancanyildiz/portfolio";

describe("parseCommitSubject", () => {
  it("splits type, scope and description", () => {
    expect(parseCommitSubject("feat(release): tag on merge")).toEqual({
      type: "feat",
      scope: "release",
      breaking: false,
      description: "tag on merge",
    });
  });

  it("accepts a scopeless subject", () => {
    expect(parseCommitSubject("fix: stop the 404")).toEqual({
      type: "fix",
      scope: null,
      breaking: false,
      description: "stop the 404",
    });
  });

  it("marks the bang as breaking", () => {
    expect(parseCommitSubject("feat(api)!: drop the v1 route")).toMatchObject({
      type: "feat",
      breaking: true,
    });
  });

  it("keeps a non conventional subject as a typeless commit", () => {
    expect(parseCommitSubject("Merge pull request #6 from dev")).toEqual({
      type: null,
      scope: null,
      breaking: false,
      description: "Merge pull request #6 from dev",
    });
  });
});

describe("parseCommit", () => {
  it("treats BREAKING CHANGE in the body as breaking", () => {
    const parsed = parseCommit(
      commit(
        "1234567890abcdef",
        "refactor(env): rename the site url variable",
        "BREAKING CHANGE: NEXT_PUBLIC_SITE_URL is now required at build time."
      )
    );
    expect(parsed.breaking).toBe(true);
    expect(parsed.shortSha).toBe("1234567");
  });
});

describe("decideBump", () => {
  it("returns null when nothing in the range is releasable", () => {
    expect(
      decideBump([
        commit("aaaaaaa", "chore(deps): bump tailwindcss"),
        commit("bbbbbbb", "docs: describe the release flow"),
        commit("ccccccc", "ci: run the gate on dev"),
        commit("ddddddd", "test(content): guard against template residue"),
      ])
    ).toBeNull();
  });

  it("returns null for an empty range", () => {
    expect(decideBump([])).toBeNull();
  });

  it("returns patch for fix, perf and refactor only", () => {
    expect(
      decideBump([
        commit("aaaaaaa", "fix(blog): reject unknown locale segments"),
        commit("bbbbbbb", "perf(og): shrink the subset"),
        commit("ccccccc", "refactor(lib): split the nav helper"),
        commit("ddddddd", "docs: note the change"),
      ])
    ).toBe("patch");
  });

  it("returns minor when a feat is in the range", () => {
    expect(
      decideBump([
        commit("aaaaaaa", "fix(blog): reject unknown locale segments"),
        commit("bbbbbbb", "feat(domain): make dogancanyildiz.com primary"),
        commit("ccccccc", "chore: tidy up"),
      ])
    ).toBe("minor");
  });

  it("returns major when any commit is breaking, whatever else is there", () => {
    expect(
      decideBump([
        commit("aaaaaaa", "feat(i18n): add a third locale"),
        commit("bbbbbbb", "fix(nav): keep the switcher on prefix free urls"),
        commit("ccccccc", "refactor(api)!: drop the legacy contact payload"),
      ])
    ).toBe("major");
  });
});

describe("bumpVersion", () => {
  it("moves the right part of the version", () => {
    expect(bumpVersion("0.1.0", "minor")).toBe("0.2.0");
    expect(bumpVersion("0.2.3", "patch")).toBe("0.2.4");
    expect(bumpVersion("0.2.3", "major")).toBe("1.0.0");
    expect(bumpVersion("1.4.9", "minor")).toBe("1.5.0");
  });

  it("rejects a version that is not semantic", () => {
    expect(() => bumpVersion("v0.1", "patch")).toThrow(/semantic version/);
  });
});

describe("groupCommits and formatCommitLine", () => {
  it("splits feat, fix and everything else", () => {
    const groups = groupCommits([
      commit("aaaaaaa1", "feat(blog): add the post detail page"),
      commit("bbbbbbb1", "fix(proxy): stop /icon 404ing"),
      commit("ccccccc1", "docs: add the deploy checklist"),
    ]);
    expect(groups.features).toHaveLength(1);
    expect(groups.fixes).toHaveLength(1);
    expect(groups.other).toHaveLength(1);
  });

  it("renders the short sha, the scope and the description", () => {
    const line = formatCommitLine(
      parseCommit(commit("abcdef1234", "feat(blog): add the post detail page"))
    );
    expect(line).toBe("- `abcdef1` **blog**: add the post detail page");
  });

  it("flags a breaking commit in its line", () => {
    const line = formatCommitLine(
      parseCommit(commit("abcdef1234", "feat(api)!: drop the v1 route"))
    );
    expect(line).toContain("**BREAKING**");
  });
});

describe("renderNotes", () => {
  const notes = renderNotes({
    commits: [
      parseCommit(commit("abcdef1234", "feat(release): tag on merge to main")),
      parseCommit(commit("beefbeef99", "fix(ci): run the gate on dev")),
      parseCommit(commit("cafecafe11", "chore: tidy the workflow")),
    ],
    tag: "v0.2.0",
    previousTag: "v0.1.0",
    repoUrl,
  });

  it("groups the commits under Features, Fixes and Other", () => {
    expect(notes).toContain("### Features");
    expect(notes).toContain("### Fixes");
    expect(notes).toContain("### Other");
    expect(notes.indexOf("### Features")).toBeLessThan(
      notes.indexOf("### Fixes")
    );
  });

  it("ends with the comparison link between the two tags", () => {
    expect(notes).toContain(`${repoUrl}/compare/v0.1.0...v0.2.0`);
  });

  it("drops a group that has no commits", () => {
    const onlyFixes = renderNotes({
      commits: [parseCommit(commit("abcdef1234", "fix(ci): run on dev"))],
      tag: "v0.1.1",
      previousTag: "v0.1.0",
      repoUrl,
    });
    expect(onlyFixes).toContain("### Fixes");
    expect(onlyFixes).not.toContain("### Features");
    expect(onlyFixes).not.toContain("### Other");
  });

  it("links to the tag itself when there is no previous tag", () => {
    const first = renderNotes({
      commits: [parseCommit(commit("abcdef1234", "feat: first release"))],
      tag: "v0.2.0",
      previousTag: null,
      repoUrl,
    });
    expect(first).toContain(`${repoUrl}/commits/v0.2.0`);
  });
});

describe("insertChangelogEntry", () => {
  const changelog = [
    "# Changelog",
    "",
    "## [Unreleased]",
    "",
    "## [0.1.0] - 2026-08-27",
    "",
    "### Features",
    "",
    "- the baseline",
    "",
    `[Unreleased]: ${repoUrl}/compare/main...dev`,
    `[0.1.0]: ${repoUrl}/commits/main`,
    "",
  ].join("\n");

  const updated = insertChangelogEntry(changelog, {
    version: "0.2.0",
    date: "2026-09-01",
    notes: "### Features\n\n- `abcdef1` **release**: tag on merge to main\n",
    repoUrl,
    previousTag: "v0.1.0",
    tag: "v0.2.0",
  });

  it("puts the new version between Unreleased and the previous version", () => {
    expect(updated.indexOf("## [Unreleased]")).toBeLessThan(
      updated.indexOf("## [0.2.0] - 2026-09-01")
    );
    expect(updated.indexOf("## [0.2.0] - 2026-09-01")).toBeLessThan(
      updated.indexOf("## [0.1.0] - 2026-08-27")
    );
  });

  it("keeps the older entry untouched", () => {
    expect(updated).toContain("- the baseline");
  });

  it("repoints Unreleased at the new tag and adds the version link", () => {
    expect(updated).toContain(`[Unreleased]: ${repoUrl}/compare/v0.2.0...HEAD`);
    expect(updated).toContain(`[0.2.0]: ${repoUrl}/compare/v0.1.0...v0.2.0`);
    expect(updated).toContain(`[0.1.0]: ${repoUrl}/commits/main`);
  });

  it("is a no-op when the version is already in the file", () => {
    expect(
      insertChangelogEntry(updated, {
        version: "0.2.0",
        date: "2026-09-02",
        notes: "### Fixes\n\n- `0000000` a second run\n",
        repoUrl,
        previousTag: "v0.1.0",
        tag: "v0.2.0",
      })
    ).toBe(updated);
  });

  it("refuses a changelog without an Unreleased heading", () => {
    expect(() =>
      insertChangelogEntry("# Changelog\n", {
        version: "0.2.0",
        date: "2026-09-01",
        notes: "### Fixes\n\n- `0000000` nothing\n",
        repoUrl,
        previousTag: null,
        tag: "v0.2.0",
      })
    ).toThrow(/Unreleased/);
  });
});

describe("pickHighestTag", () => {
  it("picks the semver max, not the first tag in the list", () => {
    expect(pickHighestTag(["v0.3.0", "v0.3.1", "v0.2.0"])).toBe("v0.3.1");
  });

  it("does not depend on input order", () => {
    expect(pickHighestTag(["v1.0.0", "v0.9.9", "v10.0.0"])).toBe("v10.0.0");
  });

  it("compares minor and patch numerically, not lexically", () => {
    expect(pickHighestTag(["v0.9.0", "v0.10.0", "v0.2.0"])).toBe("v0.10.0");
  });

  it("ignores tags that are not exactly v-major.minor.patch", () => {
    expect(pickHighestTag(["v1.0.0-beta.1", "v1.0.0", "not-a-tag"])).toBe(
      "v1.0.0"
    );
  });

  it("returns null for an empty list", () => {
    expect(pickHighestTag([])).toBeNull();
  });
});

describe("parseArgs", () => {
  it("reads the release flags", () => {
    expect(
      parseArgs([
        "--write-changelog",
        "--version",
        "1.0.0",
        "--notes-out",
        "notes.md",
      ])
    ).toMatchObject({
      writeChangelog: true,
      version: "1.0.0",
      notesOut: "notes.md",
    });
  });

  it("rejects a version that is not exactly x.y.z", () => {
    expect(() => parseArgs(["--version", "v1.0"])).toThrow(/1\.2\.3/);
  });

  it("rejects an unknown flag", () => {
    expect(() => parseArgs(["--publish"])).toThrow(/unknown flag/);
  });

  it("rejects a flag whose value is missing", () => {
    expect(() => parseArgs(["--version"])).toThrow(/needs a value/);
  });
});
