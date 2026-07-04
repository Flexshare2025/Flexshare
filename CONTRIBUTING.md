# Contributing

Thanks for taking the time to improve FlexShare. This repository is organized as a project portfolio, so contributions should prioritize clarity, safety, and reviewability.

## Development Principles

- Keep changes scoped to one concern at a time.
- Prefer readable, maintainable code over clever shortcuts.
- Avoid committing secrets, local `.env` files, generated build outputs, or cloud credentials.
- Update documentation when a change affects setup, deployment, security, or public APIs.
- Preserve legacy coursework artifacts unless the change explicitly migrates them.

## Local Setup

Front end:

```bash
cd web
npm install
npm run dev
```

Backend:

```bash
cd backend
mvn -pl member-service -am spring-boot:run
```

## Pull Request Checklist

- The change has a clear purpose and short summary.
- Front-end changes have been linted or manually reviewed.
- Backend changes compile locally where Maven is available.
- Documentation was updated when behavior or setup changed.
- No secrets, access keys, tokens, or personal credentials were added.

## Branching

Use short, descriptive branch names:

```text
feature/route-matching
fix/login-session
docs/project-readme
```

## Reporting Issues

Please include:

- What happened.
- What you expected to happen.
- Steps to reproduce.
- Screenshots or logs if useful.
- Environment details, such as browser, Node version, Java version, or OS.
