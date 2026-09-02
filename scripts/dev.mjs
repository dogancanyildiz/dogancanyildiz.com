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
  { name: "velite", child: velite, done: false, killTimer: null },
  { name: "next", child: next, done: false, killTimer: null },
];

let shuttingDown = false;
let exitCode = 0;

// How long a child gets to honour SIGTERM/SIGINT before it is killed
// outright. Without this, a child that ignores the signal would hang this
// wrapper forever: everything below sends one signal and then waits on the
// exit events. Overridable so tests/scripts/dev.test.ts does not have to sit
// through the real grace period.
const killTimeoutMs = Number(
  process.env.PORTFOLIO_DEV_KILL_TIMEOUT_MS ?? "5000"
);

/** True once a child process has actually stopped running. */
function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function signalChild(entry, signal) {
  if (entry.done || hasExited(entry.child)) {
    return;
  }
  entry.child.kill(signal);

  if (entry.killTimer !== null || !(killTimeoutMs > 0)) {
    return;
  }
  entry.killTimer = setTimeout(() => {
    if (!entry.done && !hasExited(entry.child)) {
      console.error(
        `[dev] ${entry.name} ignored ${signal} for ${killTimeoutMs}ms, sending SIGKILL`
      );
      entry.child.kill("SIGKILL");
    }
  }, killTimeoutMs);
  // Never let the escalation timer be the reason this process stays alive.
  entry.killTimer.unref();
}

function terminateOthers(except) {
  for (const entry of children) {
    if (entry !== except) {
      signalChild(entry, "SIGTERM");
    }
  }
}

function forwardSignal(signal) {
  shuttingDown = true;
  for (const entry of children) {
    signalChild(entry, signal);
  }
}

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

let settled = 0;
function onChildDone(entry, code) {
  // "error" and "exit" can both fire for the same child (a spawn that fails
  // outright emits "error", and Node makes no promise that no exit style
  // event follows). Counting such a child twice would let settled reach
  // children.length while the sibling is still running, and this process
  // would exit and orphan it, which is the exact failure F-088 was about.
  if (entry.done) {
    return;
  }
  entry.done = true;
  if (entry.killTimer !== null) {
    clearTimeout(entry.killTimer);
    entry.killTimer = null;
  }
  settled += 1;

  // The first child to stop decides the outcome: its exit code (or, if it
  // was killed by a signal instead of exiting on its own, code 1) becomes
  // this process's exit code, and every other child is torn down with it so
  // neither velite nor next can outlive its sibling.
  if (!shuttingDown) {
    shuttingDown = true;
    exitCode = code !== null ? code : 1;
    terminateOthers(entry);
  }

  if (settled === children.length) {
    process.exit(exitCode);
  }
}

for (const entry of children) {
  entry.child.on("error", (error) => {
    console.error(`[dev] failed to start ${entry.name}: ${error.message}`);
    onChildDone(entry, 1);
  });
  entry.child.on("exit", (code) => onChildDone(entry, code));
}
