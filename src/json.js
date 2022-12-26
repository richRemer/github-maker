export default function json() {
  return function json(req, res, next) {
    if (req.is("application/json")) {
      if (req.rawBody) {
        try {
          req.body = JSON.parse(req.rawBody);
          return next();
        } catch (err) {
          // let this fall through to send 400 response
        }
      }

      res.sendStatus(400);
    } else {
      next();
    }
  };
}
