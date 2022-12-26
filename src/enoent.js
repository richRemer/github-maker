export default function enoent(err) {
  if (err.code === "ENOENT") {
    return false;
  } else {
    throw err;
  }
}
