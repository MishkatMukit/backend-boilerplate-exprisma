# Express + Prisma Backend Boilerplate

A starter for REST APIs built with **Express 5**, **TypeScript**, and **Prisma 7 (PostgreSQL)**. It comes with a modular folder structure, JWT auth middleware, Zod request validation, a global error handler, and a Vercel deployment config.

## Tech Stack

| Area       | Tool                                                  |
| ---------- | ----------------------------------------------------- |
| Runtime    | Node.js ≥ 20, TypeScript (ESM)                        |
| Framework  | Express 5                                             |
| Database   | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)          |
| Validation | Zod                                                   |
| Auth       | JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`     |
| Tooling    | `tsx` (dev), `tsup` (build)                           |

---

## Quick Start

**Prerequisites:** Node.js ≥ 20, npm, and a PostgreSQL database (local or hosted, e.g. Neon or Supabase).

```bash
# 1. Clone and install (postinstall also generates the Prisma client)
git clone <your-repo-url> my-api
cd my-api
npm install

# 2. Create your env file, then fill in DATABASE_URL and the JWT secrets
cp .env.example .env

# 3. Create the database tables
npx prisma migrate dev --name init

# 4. Start the dev server
npm run dev
```

Open `http://localhost:5000`. You should get `{ "message": "Server is running", ... }`, and `GET /api/example` should return a sample response.

---

## Environment Variables

| Variable                 | Description                                              | Example                                      |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------- |
| `NODE_ENV`               | `development` shows full error details in responses      | `development`                                |
| `PORT`                   | Server port (defaults to `5000`)                         | `5000`                                       |
| `APP_URL`                | Allowed CORS origin, which is your frontend URL          | `http://localhost:3000`                      |
| `DATABASE_URL`           | PostgreSQL connection string                             | `postgresql://user:pass@localhost:5432/mydb` |
| `BCRYPT_SALT_ROUNDS`     | bcrypt cost factor                                       | `10`                                         |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens                         | output of `openssl rand -base64 32`          |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens                        | output of `openssl rand -base64 32`          |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime                                    | `1d`                                         |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                                   | `7d`                                         |

> Set `NODE_ENV=production` when you deploy, so stack traces and internal error details are hidden.

---

## Scripts

| Command                                 | What it does                                          |
| --------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                           | Start the dev server with hot reload                  |
| `npm run build`                         | Generate the Prisma client and bundle to `dist/`      |
| `npm start`                             | Run the production build (`dist/server.js`)           |
| `npx prisma migrate dev --name <name>`  | Create and apply a migration after schema changes     |
| `npx prisma generate`                   | Regenerate the Prisma client                          |
| `npx prisma studio`                     | Browse and edit your data in the browser              |

---

## Project Structure

```
prisma/schema/            # Multi-file Prisma schema
├── schema.prisma         # Generator + datasource
├── user.prisma           # User model
└── enums.prisma          # Role, ActiveStatus
src/
├── server.ts             # Entry point: starts the HTTP server
├── app.ts                # Express app: middleware, routes, error handlers
├── generated/prisma/     # Generated Prisma client (gitignored, do not edit)
└── app/
    ├── config/           # Typed access to env variables
    ├── lib/prisma.ts     # Shared Prisma client instance
    ├── middleware/       # auth, validateRequest, globalErrorHandler, routerHandler
    ├── modules/          # One folder per feature (see "Adding a Module")
    │   └── example/
    └── utils/            # catchAsync, sendResponse, AppError, jwtUtils
prisma.config.ts          # Prisma config (schema path, DATABASE_URL)
tsup.config.js            # Build config
vercel.json               # Vercel deployment config
```

---

## Working with the Database

Models live in `prisma/schema/*.prisma`. A `User` model with `Role` (`CUSTOMER`, `ADMIN`) and `ActiveStatus` (`ACTIVE`, `SUSPENDED`) enums is included.

After you change the schema:

```bash
npx prisma migrate dev --name describe_your_change
```

This applies the migration and regenerates the client. Import the client and types like this:

```ts
import { prisma } from "../../lib/prisma";
import type { User } from "../../../generated/prisma/client";
import { Role } from "../../../generated/prisma/enums";
```

---

## Adding a Module

Each feature gets its own folder in `src/app/modules/`. Use `example/` as a template. The walkthrough below builds a `post` module and assumes you've added a `Post` model (`id`, `title`, `content?`) to the schema and migrated.

```
src/app/modules/post/
├── post.route.ts         # Router: paths + middleware
├── post.controller.ts    # Reads the request, calls the service, sends the response
├── post.services.ts      # Business logic and Prisma queries
├── post.validations.ts   # Zod schemas for request bodies
└── post.interface.ts     # TypeScript types (optional)
```

**post.validations.ts**

```ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});
```

**post.services.ts**

```ts
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";

const getById = async (id: string) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new AppError("Post not found", httpStatus.NOT_FOUND);
  return post;
};

const create = (data: { title: string; content?: string }) =>
  prisma.post.create({ data });

export const postServices = { getById, create };
```

**post.controller.ts**

```ts
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { postServices } from "./post.services";

const getById = catchAsync(async (req, res) => {
  const post = await postServices.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post retrieved",
    data: post,
  });
});

const create = catchAsync(async (req, res) => {
  const post = await postServices.create(req.body); // already validated by validateRequest
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created",
    data: post,
  });
});

export const postController = { getById, create };
```

**post.route.ts**

```ts
import { Router } from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";
import { postController } from "./post.controller";
import { createPostSchema } from "./post.validations";

const router = Router();

router.get("/:id", postController.getById);
router.post("/", auth(Role.ADMIN), validateRequest(createPostSchema), postController.create);

export const postRoutes = router;
```

**Register the router in `src/app.ts`**, above the error handlers:

```ts
import { postRoutes } from "./app/modules/post/post.route";

app.use("/api/posts", postRoutes);
```

---

## Building Blocks

| Import                                         | Use it for                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `catchAsync(fn)`                               | Wrap async controllers so thrown errors reach the global error handler     |
| `sendResponse(res, { statusCode, success, message, data, meta? })` | Send a consistent success response (`meta` is for pagination)    |
| `new AppError(message, statusCode)`            | Throw an error with a specific HTTP status                                 |
| `validateRequest(schema)`                      | Validate and clean `req.body` with a Zod schema before the controller runs |
| `auth(...roles)`                               | Require a valid JWT; optionally restrict access to the given roles         |
| `jwtUtils.createToken(payload, secret, expiresIn)` / `verifyToken(token, secret)` | Sign and verify JWTs                       |

### Response format

Success responses sent with `sendResponse`:

```json
{ "success": true, "statusCode": 200, "message": "...", "data": {}, "meta": {} }
```

Error responses from the global error handler:

```json
{ "success": false, "statusCode": 404, "name": "Error", "message": "Post not found" }
```

- **Client errors (4xx)** always show their real message, in every environment. These come from `AppError`, failed validation, auth failures, and known Prisma errors.
- **Server errors (5xx)** show their real message only when `NODE_ENV=development`. Elsewhere, `name` and `message` become `"Internal Server Error"` so internal details don't leak.
- **`error` and `stack`** are included only in development.

Validation failures return **400** with a message listing each invalid field (e.g. `title: Invalid input: expected string, received undefined`). `auth()` returns **401** for a missing, invalid or expired token, and **403** for a wrong role or a suspended account. Unknown routes return a 404 JSON response.

---

## Authentication

`auth()` reads the token from the `accessToken` cookie or from an `Authorization: Bearer <token>` header. It then checks the token's role against the allowed roles, loads the user, and rejects suspended accounts. After that, `req.user` is available (typed as `{ id, name, email, role }`):

```ts
router.get("/me", auth(), controller.getMe);                     // any logged-in user
router.delete("/:id", auth(Role.ADMIN), controller.remove);       // admins only
```

There are no register/login endpoints yet. Build them in a module with `bcryptjs` for password hashing and `jwtUtils.createToken` for issuing tokens. Include `id` and `role` in the token payload, because `auth()` reads both.

---

## Deployment

### Any Node host

```bash
npm install
npm run build
npx prisma migrate deploy   # apply migrations to the production database
npm start
```

### Vercel

`vercel.json` routes all requests to `dist/server.js`. Run `npm run build`, set every environment variable from the table above in the Vercel project settings, then deploy with `vercel`.

---

## License

ISC
