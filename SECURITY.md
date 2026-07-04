# Security Policy

FlexShare is a coursework and portfolio project. Security reports are still welcome, especially for issues that could expose user data, credentials, cloud resources, or authentication flows.

## Supported Versions

The default branch is the only actively reviewed version.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Other branches | No |

## Reporting a Vulnerability

Do not open a public issue for sensitive security findings. Contact the maintainers privately or use GitHub private vulnerability reporting if it is enabled for the repository.

Please include:

- A concise description of the issue.
- Affected module or file path.
- Steps to reproduce.
- Potential impact.
- Suggested remediation, if known.

## Security Scope

Areas of interest include:

- Authentication and session handling.
- Password storage and reset flows.
- API authorization and data exposure.
- Redis, MySQL, and cloud configuration.
- Secrets management.
- XSS, injection, unsafe redirects, and insecure CORS behavior.

## Operational Notes

- Deployment workflows are currently disabled by comment.
- Public demo infrastructure may be offline.
- Example policies and cloud artifacts should be reviewed before reuse in production.
- Production use requires a separate security review, dependency audit, and privacy assessment.
