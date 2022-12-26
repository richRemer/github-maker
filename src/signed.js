import {createHmac} from "crypto";

export default function signed(secret) {
  return function signed(req, res, next) {
    const hmac = createHmac("sha256", secret);
    const digest = hmac.update(req.rawBody, "utf8").digest("hex");
    const signature = req.get("X-Hub-Signature-256");

    if (signature === `sha256=${digest}`) {
      next();
    } else if (signature) {
      res.sendStatus(403);
    } else {
      res.sendStatus(401);
    }
  };
}
