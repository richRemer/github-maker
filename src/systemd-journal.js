import {spawn} from "child_process";

const INVOCATION_ID = "_SYSTEMD_INVOCATION_ID";

export async function *log(invocation) {
  const cmd = "journalctl";
  const args = [`${INVOCATION_ID}=${invocation}`, "-o", "json"];

  for await (const entry of runLines(cmd, args)) {
    yield JSON.parse(entry);
  }
}

export async function *invocations(unit) {
  const cmd = "journalctl";
  const args = ["-u", unit, "-o", "cat", "--output-fields", INVOCATION_ID];
  const invocations = new Set();

  for await (const id of runLines(cmd, args)) {
    if (!invocations.has(id)) {
      invocations.add(id);
      yield id;
    }
  }
}

async function *runLines(cmd, args) {
  let line;
  let lines = [];
  let buffer = "", ready;
  let linesReady, throwError;

  const child = spawn(cmd, args);

  child.on("error", err => throwError(err));
  child.on("close", () => { if (buffer) linesReady([buffer]); linesReady(); });

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", data => {
    const chunks = data.split("\n");

    lines = [buffer + chunks[0], ...chunks.slice(1)];
    buffer = lines.pop();

    if (lines.length) {
      linesReady(lines);
    }
  });

  while ((ready = await waitForLines())) {
    yield* ready;
  }

  async function waitForLines() {
    return new Promise((resolve, reject) => {
      linesReady = resolve;
      throwError = reject;
    });
  }
}
