# Blabber Backend

A production-ready Express.js + TypeScript + Prisma (PostgreSQL) backend boilerplate. It comes with a modular folder structure, JWT authentication, Zod request validation, a global error handler, and a Vercel deployment setup.

## Tech Stack

- **Runtime:** Node.js (>= 20) + TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL with Prisma 7 (driver adapter: `@prisma/adapter-pg`)
- **Validation:** Zod
- **Auth:** JWT (access + refresh tokens), bcryptjs
- **Bundler:** tsup (ESM output)
- **Dev runner:** tsx watch

## Project Structure

```
.
├── prisma/
│   └── schema/              # Prisma schema split into multiple files
│       ├── schema.prisma    # Generator + datasource config
│       ├── user.prisma      # User model
│       └── enums.prisma     # Role, ActiveStatus enums
├── src/
│   ├── server.ts            # Entry point — starts the server
│   ├── app.ts               # Express app, CORS, global middleware, routes
│   ├── config/              # Environment config (dotenv)
│   ├── modules/             # Feature modules (route + controller + service)
│   │   └── example/         # Example module to copy as a starting point
│   ├── middleware/          # auth, validateRequest, globalErrorHandler, routerHandler
│   ├── validations/         # Zod request schemas
│   ├── utils/               # catchAsync, sendResponse, jwt helpers
│   ├── lib/prisma.ts        # Prisma client singleton (pg adapter)
│   └── Interfaces/          # Global type augmentations (e.g. req.user)
├── generated/prisma/        # Generated Prisma client (gitignored)
├── prisma.config.ts         # Prisma 7 config (schema path + DATABASE_URL)
├── tsup.config.js           # Build config
└── vercel.json              # Vercel deployment config
```

## Prerequisites

- Node.js >= 20 (tested on v24)
- PostgreSQL (local or remote, e.g. Neon, Supabase)
- npm

## Installation

```bash
# 1. Clone and install dependencies
git clone <your-repo-url>
cd blabber-backend
npm install
```

## Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable                  | Description                             | Example                                        |
| ------------------------- | --------------------------------------- | ---------------------------------------------- |
| `PORT`                    | Server port                             | `5000`                                         |
| `APP_URL`                 | Allowed CORS origin (frontend URL)      | `http://localhost:5000`                        |
| `DATABASE_URL`            | PostgreSQL connection string            | `postgresql://user:pass@localhost:5432/mydb`   |
| `BCRYPT_SALT_ROUNDS`      | bcrypt salt rounds                      | `10`                                           |
| `JWT_ACCESS_SECRET`       | Secret for access tokens                | any long random string                         |
| `JWT_REFRESH_SECRET`      | Secret for refresh tokens               | any long random string                         |
| `JWT_ACCESS_EXPIRES_IN`   | Access token lifetime                   | `1d`                                           |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token lifetime                  | `7d`                                           |

> Use a secret generator (e.g. `openssl rand -base64 32`) for the JWT secrets.

## Database Setup

This project uses Prisma 7 with the **pg driver adapter** and a multi-file schema loaded from `prisma/schema`.

```bash
# 1. Generate the Prisma client (outputs to generated/prisma)
npx prisma generate

# 2. Create and apply the initial migration
npx prisma migrate dev --name init
```

The `User` model (with `Role` and `ActiveStatus` enums) is defined in `prisma/schema/user.prisma`. Edit the schema as needed, then run `npx prisma migrate dev` again to apply changes.

> Note: the generated client in `generated/` is gitignored — always run `npx prisma generate` after cloning and after schema changes. The `build` script does this automatically.

## Running the Server

```bash
# Development (hot reload)
npm run dev

# Build for production (generates Prisma client + bundles with tsup)
npm run build

# Start the built server
npm start
```

The server runs on `http://localhost:5000`. Verify it's up:

- `GET /` → `{ message: "Server is running", author: "Mishakt Mahabub" }`
- `GET /api/example` → sample response from the example module
- Any unknown route → 404 JSON response

## Adding a New Module

Copy the `src/modules/example` pattern — a module has three files:

1. **`<name>.route.ts`** — defines the Express router for the module
2. **`<name>.controller.ts`** — handles requests, uses `catchAsync` and `sendResponse`
3. **`<name>.services.ts`** — business logic (e.g. Prisma queries)

Then mount the router in `src/app.ts`:

```ts
import { yourRoutes } from "./modules/yourmodule/your.route";
app.use("/api/yourmodule", yourRoutes);
```

### Available Utilities

| Utility                     | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `catchAsync`                | Wrap async controllers to forward errors to the error handler |
| `sendResponse`              | Consistent JSON success response shape              |
| `jwtUtils.createToken/verifyToken` | Sign and verify JWT tokens                    |
| `validateRequest`           | Zod middleware to validate `req.body`               |
| `auth(...roles)`            | Protect routes; optionally restrict to roles        |
| `globalErrorHandler`        | Maps Prisma errors to friendly HTTP responses       |

## Authentication

JWT-based auth scaffolding is included:

- `src/utils/jwt.ts` — token creation and verification helpers
- `src/middleware/auth.ts` — middleware that reads the token from cookies or `Authorization` header, verifies it, checks role + account status, and attaches the user to `req.user`
- `src/validations/requestSchemas.ts` — Zod schemas for `register` and `login`
- `src/Interfaces/user.interface.ts` — augments Express `Request` with the `user` property

## Deployment (Vercel)

The project is configured to deploy on Vercel (`vercel.json`):

```bash
npm run build
vercel
```

Set the environment variables from `.env` in the Vercel dashboard (or use `vercel env add`). The serverless function is served from `dist/server.js`.

## Scripts

| Command            | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start dev server with hot reload (`tsx watch`) |
| `npm run build`    | Generate Prisma client and bundle with tsup   |
| `npm start`        | Run the production build (`node dist/server.js`) |
| `npx prisma studio`| Browse and edit your database in the browser  |
| `npx prisma migrate dev --name <migration>` | Create and apply a migration   |

## License

ISC
