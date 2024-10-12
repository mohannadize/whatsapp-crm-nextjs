// @ts-nocheck
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const cron = require("node-cron");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.NEXTAUTH_URL ?? "localhost";
const port = process.env.PORT ?? 80;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let isProcessing = false;

// eslint-disable-next-line @typescript-eslint/no-misused-promises
cron.schedule("*/2 * * * *", async () => {
  if (isProcessing) {
    return;
  }
  isProcessing = true;
  console.log("Running cron job");
  try {
    await fetch(`http://${hostname}:${port}/api/cron`, {
      method: "POST",
      body: JSON.stringify({
        password: process.env.CRON_PASSWORD,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      timeout: Infinity,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    });
  } catch (err) {
    console.error("Cron job failed:", err.message);
  }
  isProcessing = false;
});

app.prepare().then(() => {
  createServer((req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      if (req.url) {
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;

        if (pathname === "/a") {
          app.render(req, res, "/a", query);
        } else if (pathname === "/b") {
          app.render(req, res, "/b", query);
        } else {
          handle(req, res, parsedUrl);
        }
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
