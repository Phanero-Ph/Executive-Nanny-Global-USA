// cPanel Passenger startup entry for the production Next.js server.
process.env.NODE_ENV = "production";

const { createServer } = require("node:http");
const next = require("next");

const hostname = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
    console.log(`Executive Global Nanny is listening on ${hostname}:${port}`);
  });
}).catch((error) => {
  console.error("The production web server could not start.", error);
  process.exit(1);
});
