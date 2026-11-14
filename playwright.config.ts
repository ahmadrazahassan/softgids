import { defineConfig } from "@playwright/test";

const PORT = 4330;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Browser tests for affiliate tracking. They run against the production build,
 * because the whole question is what the browser does with the HTML we ship.
 *
 * Every request to an affiliate tracking domain is aborted inside the tests
 * themselves, so running these never sends a real click to Impact.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  // Discovery walks the sitemap looking for a monetised page, and the first
  // request also waits on the production server warming up.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "off",
  },
  webServer: {
    // Spawned via node rather than the npx shim: Node 24 on Windows refuses to
    // spawn a .cmd without a shell.
    command: `node node_modules/next/dist/bin/next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
