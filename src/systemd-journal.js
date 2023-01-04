import {runLines} from "github-maker";

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
