import http from "http";
import {join} from "path";
import {randomBytes} from "crypto";
import express from "express";
import morgan from "morgan";
import escape from "systemd-escape";
import {body, json, signed, url} from "github-maker";
import {log, invocations, systemdConnect, DBusError} from "github-maker";

// disable debug logs by default
if (!process.env.DEBUG) console.debug = () => {};

const pub = new URL("pub", import.meta.url).pathname;
const app = express();
const port = process.env.GITHUB_PORT || 6549;
const secret = process.env.GITHUB_SECRET || randomBytes(16).toString("hex");
const server = http.createServer(app);
const systemd = await systemdConnect();

app.use(morgan("tiny"));
app.use(body());
app.use(json());
app.use(url());

app.get("/", (req, res) => {
  res.sendFile(join(pub, "index.html"));
});

app.post("/", signed(secret), async (req, res) => {
  const repo = req.body?.repository?.full_name;

  if (repo) {
    const instance = repo.replace(/\//g, "-");
    const unit = `github-build@${instance}.service`;
    const state = await systemd.GetUnitFileState(unit).catch(err => {
      if (err.dbusName === DBusError.FileNotFound) return false;
      else throw err;
    });

    // unit should exist and must be enabled
    if (state === "enabled") {
      console.info(repo, "build triggered");
      console.debug(repo, "starting unit", unit);
      await systemd.StartUnit(unit);
    } else {
      console.debug(repo, "project missing or disabled");
    }
  }

  res.sendStatus(204);
});

app.all("/", (req, res) => {
  res.set("Allow", "POST");
  res.sendStatus(405);
});

app.get("/:org/:repo/logs", async (req, res) => {
  const ids = [];
  const {org, repo} = req.params;
  const instance = escape(`${org}/${repo}`);
  const unit = `github-build@${instance}.service`;

  res.set("Content-Type", "text/uri-list");

  for await (const id of invocations(unit)) {
    res.write(new URL(`log/${id}`, req.fullURL()) + "\r\n");
  }

  res.end();
});

app.get("/:org/:repo/log/:id", async (req, res) => {
  const {id, org, repo} = req.params;
  const instance = escape(`${org}/${repo}`);
  const unit = `github-build@${instance}.service`;

  res.set("Content-Type", "application/x-ndjson");

  for await (const entry of log(id)) {
    // only deliver logs for the appropriate unit
    if (entry._SYSTEMD_UNIT === unit) {
      res.write(JSON.stringify(entry) + "\n");
    }
  }

  res.end();
});

app.all("*", (req, res) => {
  res.sendStatus(404);
});

server.listen(port, function() {
  const {address, port} = this.address();
  console.info(`listening on ${address}:${port}`);
});

// check for systemd unit and warn if not found
const unit = "github-build@nonce.service";
const state = await systemd.GetUnitFileState(unit).catch(() => false);

if (state === "enabled" || state === "disabled") {
  console.debug("github-build@.service unit verified");
} else {
  console.warn("github-build@.service unit missing or invalid");
}
