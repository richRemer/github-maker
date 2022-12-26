import bytesized from "bytesized";

export default function body({
  limit=bytesized("20 KiB")
}={}) {
  return function body(req, res, next) {
    const chunks = [];
    let length = 0;

    req.rawBody = undefined;
    req.setEncoding("utf8");

    req.on("data", chunk => {
      chunks.push(chunk);
      length += chunk.length;

      if (length > limit) {
        res.sendStatus(413);
      }
    });

    req.on("end", () => {
      req.rawBody = chunks.join("");
      next();
    });
  };
}
