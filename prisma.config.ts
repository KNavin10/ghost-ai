import "dotenv/config";
import { config as loadEnvFile } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    loadEnvFile({ path: file, override: true });
  }
}

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
