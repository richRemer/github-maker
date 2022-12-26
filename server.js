import http from "http";
import {randomBytes} from "crypto";
import express from "express";
import morgan from "morgan";
import {body, json, signed, systemdConnect, DBusError} from "github-maker";

// disable debug logs by default
if (!process.env.DEBUG) console.debug = () => {};

const app = express();
const port = process.env.GITHUB_PORT || 6549;
const secret = process.env.GITHUB_SECRET || randomBytes(16).toString("hex");
const server = http.createServer(app);
const systemd = await systemdConnect();

app.use(morgan("tiny"));
app.use(body());
app.use(json());

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

app.all("*", (req, res) => {
  res.sendStatus(404);
});

server.listen(port, function() {
  const {address, port} = this.address();
  console.info(`listening on ${address}:${port}`);
});

// check for systemd unit and warn if not found
const unit = "github-build@.service";
const state = await systemd.GetUnitFileState(unit).catch(() => false);

if (state === "enabled" || state === "disabled") {
  console.debug("github-build@.service unit verified");
} else {
  console.warn("github-build@.service unit missing or invalid");
}
