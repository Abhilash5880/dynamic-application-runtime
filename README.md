# Config-Driven Dynamic Application Builder

A config-first system that converts JSON configuration into a fully functioning runtime application: UI (forms & tables), backend APIs (dynamic CRUD routes), and a database schema (Prisma → PostgreSQL). Instead of hardcoding entities, relationships, forms, or endpoints, you declare intent in configuration and the system generates the runtime app from that single source of truth: config → runtime app generation.

---

Table of contents
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
- [Folder Structure](#folder-structure)
- [Example Configuration](#example-configuration)
- [CSV Import / Export Flow](#csv-import--export-flow)
- [Localization System](#localization-system)
- [Setup Instructions](#setup-instructions)
- [Environment Variables (.env.example)](#environment-variables-envexample)
- [Design Decisions](#design-decisions)
- [Challenges & Solutions](#challenges--solutions)
- [Future Improvements](#future-improvements)
- [Demo / Example Outputs](#demo--example-outputs)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- Dynamic UI rendering (forms + tables) from config
- Dynamic API generation (Next.js App Router dynamic routes)
- Config-based database schema generation (Prisma)
- Full CRUD support for all configured entities
- CSV import/export pipeline with validation
- Validation with Zod (config → validators)
- Localization / multi-language support driven by config
- Error handling and graceful degradation for imperfect configs
- Extensible engine modules (parser, schema-generator, api-generator, ui-renderer)

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js (App Router), React, TypeScript | Dynamic UI, server components, routing |
| State / Utilities | React Context, hooks | Locale handling, config runtime state |
| Backend | Next.js (server functions), TypeScript | Dynamic API layer and request handling |
| ORM | Prisma | Schema generation, migrations, DB access |
| Database | PostgreSQL (supabase) | Production-ready relational storage |
| Validation | Zod | Runtime config and request validation |
| Styling | Tailwind CSS | Utility-first styling for components |
| CSV | Node streams / parsers | Import/export pipelines with validation |
| Deployment | Vercel / Supabase / any Node host | Host frontend + serverless API + DB |

---

## System Architecture

**High-level flow**

Configuration (JSON)
	↓
`config-parser` (validate + normalize)
	↓
`schema-generator` → Prisma schema → migrations → Database
	↓
`api-generator` (dynamic route handlers)
	↓
`ui-renderer` (forms, tables)
	↓
End-user (CRUD interactions → DB)

Flow diagram (ASCII)

```
JSON Config
	 ↓
Config Parser (validate, normalize)
	 ↓
Schema Generator → Prisma schema → Database (Postgres)
	 ↓
API Layer (dynamic Next.js routes / server handlers)
	 ↓
UI Renderer (forms, tables) — runtime React components
	 ↓
User Actions (CRUD, CSV import/export, translations)
```

---

## How It Works (Step-by-step)

1. Config input
	 - Author writes a JSON config describing entities, fields, UI hints, validation, list views, CSV mappings, and localization keys.
2. Parsing & validation
	 - `config-parser` validates the JSON against a master Zod schema to ensure stable inputs and provide meaningful errors.
3. Schema generation
	 - `schema-generator` maps config types to Prisma types and emits a `schema.prisma` model for each entity. Optionally runs `prisma migrate` to keep DB in sync.
4. API generation
	 - `api-generator` produces dynamic API handlers that enforce validation (Zod) and map HTTP operations to database operations (Prisma).
5. UI rendering
	 - `ui-renderer` consumes the normalized config at runtime and renders form fields, table columns, filters, and actions dynamically.
6. User interaction (CRUD)
	 - Frontend forms call the dynamic API endpoints. The API performs validation and persistence with Prisma.
7. CSV pipeline
	 - Import: CSV → parser → map to configured fields → Zod validation → upsert/insert to DB.
	 - Export: Query DB → map fields → generate CSV with header mapping from config.

---

## Folder Structure

```
src/
	app/                # Next.js App Router entries
	components/         # UI building blocks (forms, table cells, inputs)
	config/             # Example configs & templates
	contexts/           # Locale, config context providers
	engine/             # Core: config-parser, schema-generator, api-generator, ui-renderer
	features/
		csv/              # CSV parsing and export utilities
		localization/     # i18n helpers
	lib/                # Auth, prisma client, shared utilities
```

Purpose summary:
- `app/`: route handlers, pages and server components for runtime app
- `components/`: composable UI components referenced by `ui-renderer`
- `config/`: example JSON specs and templates for entity declarations
- `contexts/`: runtime providers such as Locale and Config contexts
- `engine/`: the essential runtime code that turns config into schema, API, and UI
- `features/csv`: import/export pipeline and validation glue
- `lib/`: thin wrappers for Prisma, auth, and environment utilities

---

## Example Configuration

Below is a compact example config showing a `Product` entity. This demonstrates how fields map to DB, UI, and validation.

Example (clean JSON):

```json
{
	"entities": [
		{
			"name": "Product",
			"table": "product",
			"listView": ["id", "name", "price", "inStock"],
			"csv": {
				"headers": ["id", "name", "price", "inStock"],
				"uniqueBy": ["id"]
			},
			"fields": [
				{
					"name": "id",
					"type": "uuid",
					"primary": true,
					"default": "uuid()",
					"ui": { "component": "hidden" }
				},
				{
					"name": "name",
					"type": "string",
					"label": { "en": "Name", "es": "Nombre" },
					"ui": { "component": "text", "required": true },
					"validation": { "minLength": 1, "maxLength": 255 }
				},
				{
					"name": "price",
					"type": "number",
					"ui": { "component": "number", "step": 0.01 },
					"validation": { "min": 0 }
				},
				{
					"name": "inStock",
					"type": "boolean",
					"ui": { "component": "checkbox" },
					"default": false
				},
				{
					"name": "createdAt",
					"type": "datetime",
					"ui": { "component": "readonly" },
					"default": "now()"
				}
			]
		}
	],
	"locales": ["en", "es"]
}
```

Mapping notes
- DB: `type: "string" | "number" | "boolean" | "uuid" | "datetime"` → Prisma model types (String, Float/Int, Boolean, DateTime).
- UI: `ui.component` → input renderer (`text`, `number`, `select`, `date`, `checkbox`, `textarea`).
- Validation: config `validation` maps to Zod validators automatically: e.g., `minLength` → `z.string().min()`.

Prisma model snippet generated:

```prisma
model Product {
	id        String   @id @default(uuid())
	name      String
	price     Float?
	inStock   Boolean  @default(false)
	createdAt DateTime @default(now())
}
```

---

## CSV Import / Export Flow

Import (CSV → DB)
1. Upload CSV file or drop into import UI.
2. CSV parser reads rows and maps columns using the entity's `csv.headers` mapping.
3. For each row:
	 - Normalize types (strings → numbers, booleans, dates).
	 - Validate using the per-entity Zod schema generated from config.
	 - Upsert or insert into DB (using `uniqueBy` keys from config).
4. Produce a report: success count, failures (with row + errors), skipped rows.

Export (DB → CSV)
1. User selects entity and view filters.
2. System queries the DB based on filters and selected `listView` fields.
3. Map queried fields to CSV headers (config-driven) and stream the CSV to the client.

Recommended patterns
- Stream processing to keep memory usage low for large files.
- Produce detailed row-level error reporting for users to fix upstream CSV problems.
- Provide a dry-run mode for import to preview validation issues.

---

## Localization System

Localization is config-aware and runtime-driven:
- Config may include `label` objects per field: e.g., `"label": { "en": "Name", "es": "Nombre" }`.
- The UI reads the current locale from a `LocaleContext` and resolves labels, placeholders, help text, and option labels dynamically.
- For static UI text (buttons, toasts, errors) the app uses locale resource bundles (JSON) keyed by the same translation keys used in config.
- During rendering, the `ui-renderer` picks translations in this order:
	1. Field-level translation in config
	2. Entity-level or global translation resources
	3. Fallback to default language

Localization example (snippet):

```json
{
	"translations": {
		"en": {
			"product.name": "Name",
			"product.price": "Price"
		},
		"es": {
			"product.name": "Nombre",
			"product.price": "Precio"
		}
	}
}
```

---

## Setup Instructions

1. Clone repository
```bash
git clone <repo-url>
cd <project-folder>
```

2. Install dependencies
```bash
# npm
npm install
# or pnpm
pnpm install
```

3. Create environment file
```bash
cp .env.example .env
# Fill in the variables below (.env.example provided)
```

4. Generate Prisma client and run migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start development server
```bash
npm run dev
# or
pnpm dev
```

6. Access the app
- Open `http://localhost:3000` and load a config (or use a sample config in `config/`).

Optional
- Seed DB: `node prisma/seed.js` (if seed script provided)
- Run CSV import via UI or a CLI helper shipped in `features/csv/` (if available).

---

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key

# Next / App
NEXT_PUBLIC_APP_NAME="Config App Builder"
NEXTAUTH_SECRET="a very secret value"

# Optional: analytics / SENTRY / other integrations
SENTRY_DSN=
```

---

## Design Decisions

- Config-driven approach
	- Single source of truth for UI, API, and schema reduces duplication and speeds iteration.
- Prisma for schema generation
	- Strong type-safety, migrations toolchain, and first-class TypeScript client.
- Next.js App Router & dynamic routes
	- Server + client co-location, simple server handlers for dynamic route generation.
- Zod for validation
	- Deterministic, composable runtime validation and type inference.
- CSV support as a first-class feature
	- Real-world data ingestion/export demands robust CSV tooling integrated close to the config.
- Tailwind CSS
	- Rapid UI development with consistent utility classes, works well with generated components.

---

## Challenges & Solutions

- Handling invalid configs
	- Solution: strict master Zod schema for configs, with clear error messages and line/field pointers.
- Dynamic typing / Type inference
	- Solution: config → Zod schema generator → TypeScript types where possible; generated types are validated at runtime.
- Evolving schema (add/remove fields)
	- Solution: generate Prisma migrations and provide safe migration options (nullable by default for new fields, deprecation flags).
- CSV data variability
	- Solution: flexible CSV mapping defined in config, normalizers per-type, and a dry-run validation mode.

---

## Future Improvements

- Role-Based Access Control (RBAC) integrated into config (per-entity, per-field access rules).
- Visual config editor (drag-and-drop) that emits JSON config and previews UI live.
- Versioned config deployments and rollbacks.
- GraphQL layer generation from config (optional).
- Richer field types (rich text, file uploads, relationships builder UI).
- Dashboard for observing import jobs, failed rows, and schema change history.

---

## Demo / Example Outputs

Example list view (CSV-style preview):

| id | name         | price | inStock |
|----|--------------|-------|---------|
| 1  | "Sprocket"   | 12.50 | true    |
| 2  | "Gizmo"      | 7.99  | false   |

Example form (auto-rendered by `ui-renderer`):
- `Name` (text, required)
- `Price` (number, step=0.01)
- `In Stock` (checkbox)
- `Save` / `Cancel` actions, handled by generated API endpoints.

(For screenshots, embed images into README or link to the deployed demo.)

---

## Contributing

- Follow the repository contribution guidelines.
- Draft a config and add it under `config/examples/` to demonstrate a new entity.
- Add tests for `config-parser` and `schema-generator` to ensure stable transformation rules.
- Open issues for requested field types, UI components, or improved localization flows.

---

## License

This project is provided under the MIT license. See LICENSE file for details.

---
