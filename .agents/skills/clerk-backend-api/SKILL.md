---
name: clerk-backend-api
description: "Clerk backend REST API"
argument-hint: "[endpointOrTag] [method]"
allowed-tools: Bash, Read, Grep, Skill, WebFetch
---

## Options context

User Prompt: $ARGUMENTS

## API specs context

Before doing anything, fetch the available spec versions and tags by running:

```bash
bash scripts/api-specs-context.sh
```

Use the output to determine the latest version and available tags.

**Caching:** If you already fetched the spec context earlier in this conversation, do NOT fetch it again. Reuse the version and tags from the previous call.

## Rules

- Always disregard endpoints/schemas related to `platform`.
- Always confirm before performing write requests.
- For write operations (POST/PUT/PATCH/DELETE), check if `CLERK_BAPI_SCOPES` includes the required scope. If not, ask the user upfront: "This is a write/delete operation and your current scopes don't allow it. Run with --admin to bypass?" Do NOT attempt the request first and fail — ask before executing.

## Modes

Determine the active mode based on the user prompt in [Options context](#options-context):

| Mode      | Trigger                                                                                     | Behavior                             |
| --------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| `help`    | Prompt is empty, or contains only `help` / `-h` / `--help`                                  | Print usage examples (step 0)        |
| `browse`  | Prompt is `tags`, or a tag name (e.g. `Users`)                                              | List all tags or endpoints for a tag |
| `execute` | Specific endpoint (e.g. `GET /users`) or natural language action (e.g. "get user john_doe") | Look up endpoint, execute request    |
| `detail`  | Endpoint + `help` / `-h` / `--help` (e.g. `GET /users help`)                                | Show endpoint schema, don't execute  |

## Your Task

Use the **LATEST VERSION** from [API specs context](#api-specs-context) by default. If the user specifies a different version (e.g. `--version 2024-10-01`), use that version instead.

Determine the active mode, then follow the applicable steps below.

---

### 0. Print usage

**Modes:** `help` only — **Skip** for `browse`, `execute`, and `detail`.

Print the following examples to the user verbatim:

```
Browse
  /clerk-backend-api tags                         — list all tags
  /clerk-backend-api Users                        — browse endpoints for the Users tag
  /clerk-backend-api Users version 2025-11-10.yml — browse using a different version

Execute
  /clerk-backend-api GET /users             — fetch all users
  /clerk-backend-api get user john_doe      — natural language works too
  /clerk-backend-api POST /invitations      — create an invitation

Inspect
  /clerk-backend-api GET /users help        — show endpoint schema without executing
  /clerk-backend-api POST /invitations -h   — view request/response details

Options
  --admin                            — bypass scope restrictions for write/delete
  --version [date], version [date]   — use a specific spec version
  --help, -h, help                   — inspect endpoint instead of executing
```

Stop here.

---

### 1. Fetch tags

**Modes:** `browse` (when prompt is `tags` or no tag specified) — **Skip** for `help`, `execute`, and `detail`.

If using a non-latest version, fetch tags for that version:

```bash
curl -s https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/${version_name} | node scripts/extract-tags.js
```

Otherwise, use the **TAGS** already in [API specs context](#api-specs-context).

Share tags in a table and prompt the user to select a query.

---

### 2. Fetch tag endpoints

**Modes:** `browse` (when a tag name is provided) — **Skip** for `help`, `execute`, and `detail`.

Fetch all endpoints for the identified tag:

```bash
curl -s https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/${version_name} | bash scripts/extract-tag-endpoints.sh "${tag_name}"
```

Share the results (endpoints, schemas, parameters) with the user.

---

### 3. Fetch endpoint detail

**Modes:** `execute`, `detail` — **Skip** for `help` and `browse`.

For natural language prompts in `execute` mode, first identify the matching endpoint by searching the tags in context. Fetch tag endpoints if needed to resolve the exact path and method.

Extract the full endpoint definition:

```bash
curl -s https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/${version_name} | bash scripts/extract-endpoint-detail.sh "${path}" "${method}"
```

- `${path}` — e.g. `/users/{user_id}`
- `${method}` — lowercase, e.g. `get`

**`detail` mode:** Share the endpoint definition and schemas with the user. Stop here.

**`execute` mode:** Continue to step 4.

---

### 4. Execute request

**Modes:** `execute` only.

Use the endpoint definition from step 3 to build the request:

1. Identify required and optional parameters from the spec.
2. Ask the user for any required path/query/body parameters.
3. Execute via the request script:

```bash
bash scripts/execute-request.sh [--admin] ${METHOD} "${path}" ['${body_json}']
```

- `--admin` — pass this if the user confirmed admin bypass (see Rules)
- `${METHOD}` — uppercase HTTP method
- `${path}` — resolved path with parameters filled in (e.g. `/users/user_abc123`)
- `${body_json}` — optional JSON body for POST/PUT/PATCH

4. Share the response with the user.
