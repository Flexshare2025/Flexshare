# Project Structure

FlexShare uses normalized top-level folders so reviewers can quickly identify the front end, backend, cloud prototypes, security material, and project documentation.

```text
.
|-- .github/
|   |-- workflows/                 # Deployment workflows, currently disabled by comment
|   |-- ISSUE_TEMPLATE/            # Issue templates
|   `-- pull_request_template.md   # Pull request review template
|-- docs/                          # Professional project documentation
|-- backend/                       # Spring Boot backend parent Maven project
|   `-- member-service/            # User, schedule, auth, Redis, and MySQL service
|-- web/                           # Vite + React front-end app
|-- cloud-prototypes/              # AWS Lambda, SQS, Redis, and DynamoDB prototype scripts
|-- security/                      # IAM policies, trust policies, and security notes
|-- project-docs/                  # Original project submissions and meeting documents
|-- LICENSE
|-- NOTICE
|-- CONTRIBUTING.md
|-- SECURITY.md
`-- README.md
```

## Module Summary

| Path | Purpose | Review Notes |
| --- | --- | --- |
| `web/` | Front-end application | Main UI implementation, mobile-first pages, map integration |
| `backend/member-service/` | Backend API | Spring Boot service for users, schedules, Redis sessions, and route matching |
| `cloud-prototypes/` | Cloud prototypes | Lambda and queue integration experiments |
| `security/` | Security artifacts | IAM roles, permissions, and security posture notes |
| `project-docs/` | Historical documentation | Meeting minutes, final project files, and original submission material |
| `.github/workflows/` | Automation | Workflows are intentionally commented out to prevent accidental deployments |

## Naming Standard

Top-level directories use lowercase kebab-case names where practical. Historical coursework material remains available, but it is grouped under professional directory names for easier review.
