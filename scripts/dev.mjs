#!/usr/bin/env node
// Runs the content watcher and the Next dev server side by side and keeps
// them coupled: "velite --watch & next dev" (the previous "dev" script)
// starts velite in the shell's background job table and never looks at it
// again, so a next dev crash (or a Ctrl-C that only the shell's foreground
// job receives) leaves velite running as an orphan that keeps watching
// content/ and writing into .velite until something notices and kills it by
// hand (F-088). This script owns both children directly: whichever one exits
// first takes the other down with it, and SIGINT/SIGTERM delivered to this
// process are forwarded to both.
//
// Bin names are resolved through the environment on purpose
// (PORTFOLIO_DEV_VELITE_BIN / PORTFOLIO_DEV_NEXT_BIN, defaulting to "velite"
// and "next") so tests/scripts/dev.test.ts can point them at fake
// executables instead of spawning the real content pipeline and dev server.
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(fileURLToPath(import.meta.url), "..", "..");

// Prepend node_modules/.bin so "velite" and "next" resolve even when this
// script runs outside "npm run dev" (npm would otherwise put that directory
// on PATH itself). A test that wants fake binaries instead puts its own
// directory earlier on PATH before spawning this script, which still wins
// because it comes first in the search order.
const binDir = join(projectRoot, "node_modules", ".bin");
const childEnv = {
  ...process.env,
  PATH: `${binDir}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`,
};

const veliteBin = process.env.PORTFOLIO_DEV_VELITE_BIN ?? "velite";
const nextBin = process.env.PORTFOLIO_DEV_NEXT_BIN ?? "next";
// Everything passed to "npm run dev -- ..." reaches next dev, matching what
// "next dev" on its own would have done with the same arguments.
const nextArgs = ["dev", ...process.argv.slice(2)];

const velite = spawn(veliteBin, ["--watch"], {
  stdio: "inherit",
  env: childEnv,
});
const next = spawn(nextBin, nextArgs, {
  stdio: "inherit",
  env: childEnv,
});

const children = [
  { name: "velite", child: velite },
  { name: "next", child: next },
];

let shuttingDown = false;
let exitCode = 0;

/** True once a child process has actually stopped running. */
function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function terminateOthers(except) {
  for (const { child } of children) {
    if (child !== except && !hasExited(child)) {
      child.kill("SIGTERM");
    }
  }
}

function forwardSignal(signal) {
  shuttingDown = true;
  for (const { child } of children) {
    if (!hasExited(child)) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

let settled = 0;
function onChildDone(name, child, code) {
  settled += 1;

  // The first child to stop decides the outcome: its exit code (or, if it
  // was killed by a signal instead of exiting on its own, code 1) becomes
  // this process's exit code, and every other child is torn down with it so
  // neither velite nor next can outlive its sibling.
  if (!shuttingDown) {
    shuttingDown = true;
    exitCode = code !== null ? code : 1;
    terminateOthers(child);
  }

  if (settled === children.length) {
    process.exit(exitCode);
  }
}

for (const { name, child } of children) {
  child.on("error", (error) => {
    console.error(`[dev] failed to start ${name}: ${error.message}`);
    onChildDone(name, child, 1);
  });
  child.on("exit", (code) => onChildDone(name, child, code));
}
