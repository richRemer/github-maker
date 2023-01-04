import {spawn} from "child_process";

/**
 * Execute a command in a child process and iterate over the lines printed to
 * STDOUT.
 * @param {string} cmd
 * @param {string[]} args
 */
export default async function *runLines(cmd, args) {
  let line, ready, linesReady, throwError;
  let lines = [];
  let buffer = "";

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
