# AGENTS.md

This file provides guidance for AI agents operating in this repository.

## Project Overview

Music release artists app with a monorepo structure: AdonisJS v7 API backend + React/Vite frontend.

---

## Commands

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Run TypeScript type check |
| `npm test` | Run all tests |
| `npm test -- --suite unit` | Run unit tests only |
| `npm test -- --suite functional` | Run functional tests only |
| `node ace migration:run` | Run database migrations |
| `node ace make:migration <name>` | Create new migration |
| `node ace make:controller <name>` | Create new controller |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Code Style Guidelines

### General

- No comments unless explaining complex business logic
- Prefer explicit over implicit
- Keep functions small and focused
- Use early returns to reduce nesting

### TypeScript

- Use explicit return types on public functions
- Avoid `any` — use `unknown` with type guards when type is unclear
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` assertions (`as const`) for literal values

### Backend — AdonisJS v7

#### Imports
- Use `#` subpath aliases defined in `package.json`:
  - `#models/*` → `app/models/*.js`
  - `#controllers/*` → `app/controllers/*.js`
  - `#validators/*` → `app/validators/*.js`
  - `#services/*` → `app/services/*.js`
  - `#transformers/*` → `app/transformers/*.js`
  - `#config/*` → `config/*.js`
  - `#start/*` → `start/*.js`

#### Naming Conventions
- Files: `kebab-case.ts` (e.g., `new_account_controller.ts`)
- Classes: `PascalCase` (e.g., `NewAccountController`)
- Methods: `camelCase` (e.g., `async store()`)
- Routes: `kebab-case` with hyphens (e.g., `/verify-email`)
- Route names: `camelCase` with dots (e.g., `auth.signup`)

#### Controllers
- Use `HttpContext` type for request/response injection
- Use `ctx.serialize()` with transformers for responses
- Validate input with VineJS validators via `request.validateUsing()`
- Handle errors with try/catch and logger
- Return appropriate HTTP status codes (201 for create, 200 for success)

#### Models (Lucid)
- Extend generated schema from `#database/schema`
- Use decorators: `@column()`, `@column.dateTime()`, `@manyToMany()`, `@hasMany()`
- Use computed getters for derived properties (e.g., `get initials()`)
- Always await database operations

#### Validators (VineJS)
- Use `vine.create()` for named validators
- Compose reusable rules (e.g., `const email = vine.string().email()`)
- Use `.unique()` for uniqueness validation against DB

#### Transformers
- Create transformer classes with `toObject()` and `transform()` static methods
- Use transformers in controllers: `ctx.serialize(user, { transformer: UserTransformer })`
- Or call directly: `UserTransformer.toObject(user)`

#### Error Handling
- Use try/catch with logger for external services (email, Spotify)
- Log errors with structured data: `logger.error({ err: error }, 'message')`
- Return user-friendly error messages in responses
- Never expose internal error details to clients

#### API Response Format
- All responses wrapped in `{ data: ... }` by `ApiSerializer` provider
- Controllers use `ctx.serialize()` for consistent output
- Use `response.status(code).json({ message: '...' })` for simple responses

### Frontend — React 19 + Vite

#### Imports
- Use `@/` alias for `src/` (e.g., `@/components`, `@/hooks`, `@/lib`)
- Use named exports for components: `export function ComponentName()`
- Import React explicitly only when needed (JSX transform handles most cases)

#### Naming Conventions
- Components: `PascalCase.tsx` (e.g., `LoginPage.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `use-auth.ts`)
- Utilities: `camelCase.ts` (e.g., `api.ts`)
- Types: `camelCase.ts` with type co-located or in `types/index.ts`

#### Components
- Use function components exclusively
- Destructure props in function signature
- Keep components focused — extract logic to hooks
- Use React 19 features (no manual `useEffect` cleanup for server components)

#### State Management
- Use TanStack Query (`@tanstack/react-query`) for server state
- Create query key factories for organization
- Use `useMutation` with `onSuccess`/`onSettled` callbacks
- Use `useQueryClient` for cache manipulation

#### API Client (`src/lib/api.ts`)
- Export type-safe API object with nested endpoints (e.g., `api.auth.login()`)
- Use `request<T>()` generic for typed responses
- Handle auth token with `getToken()`/`setToken()`/`removeToken()`
- Always unwrap `{ data: ... }` wrapper from responses

#### Error Handling
- Check response `ok` status, throw with message from response
- Use type guards for complex error shapes
- Display user-friendly messages (Italian in this project)
- Use TanStack Query `error` states for UI feedback

#### Styling
- Use Tailwind CSS utility classes
- Follow existing color scheme (purple accent: `#aa3bff`)
- Use `clsx` or template literals for conditional classes

---

## Testing

### Backend (Japa)

```typescript
test.group('Group Name', (group) => {
  test('should do something', async ({ client }) => {
    const response = await client.post('/api/v1/endpoint').form({ data: 'value' })
    response.assertStatus(200)
  })
})
```

- Use `client` for HTTP testing
- Chain assertions directly on response
- Test error cases (401, 422, 500)
- Use `--suite unit` or `--suite functional` to run specific tests

---

## Project Structure

```
backend/
├── app/
│   ├── controllers/          # HTTP controllers
│   ├── models/               # Lucid models
│   ├── validators/          # VineJS validators
│   ├── transformers/         # Response transformers
│   ├── services/             # Business logic services
│   └── types/                # TypeScript types
├── config/                   # AdonisJS config
├── database/
│   └── schema.ts             # Auto-generated Lucid schema
├── start/
│   ├── routes.ts             # API routes
│   └── kernel.ts             # Middleware config
├── tests/
│   ├── unit/                 # Unit tests
│   └── functional/           # Integration tests
└── providers/                # App providers

frontend/
├── src/
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities (api, query-client)
│   ├── pages/                # Page components
│   └── types/                # Shared types
├── eslint.config.js
└── vite.config.ts
```

---

## Notes

- Database is SQLite by default (`tmp/db.sqlite3`)
- API routes prefixed with `/api/v1`
- Auth uses access tokens (bearer) — check `Authorization` header
- Transformer output is wrapped in `{ data: ... }` at the API level
