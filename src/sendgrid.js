import {SMTPClient} from "smtp-client";

const host = "smtp.sendgrid.net";
const port = 465;
const secure = true;
const username = "apikey";

export function emailer(from, apiKey) {
  return async function send(to, subject, body) {
    const email = buildEmail(from, to, subject, body);
    const client = new SMTPClient({host, port, secure});

    // handshake with SMTP server
    await client.connect();
    await client.greet({hostname: host});
    await client.authLogin({username, password: apiKey});

    // send email
    await client.mail({from});
    await client.rcpt({to});
    await client.data(email);

    // disconnect
    await client.quit();
  }
}

function buildEmail(from, to, subject, body) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    ...body.split("\n"),
    ""
  ].join("\r\n");
}
