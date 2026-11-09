import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  // Optional so `prisma generate` works without a DATABASE_URL (e.g. on fresh install)
  datasource: process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : {},
});
