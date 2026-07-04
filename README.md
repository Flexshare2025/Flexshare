# FlexShare

FlexShare is a cloud-ready carpooling platform designed for short-distance route sharing in New Zealand. Drivers publish planned routes with available seats, while passengers search for compatible routes and join at matched waypoints.

The product model is closer to a lightweight "private bus" than a traditional taxi-style rideshare: drivers follow their own route, and passengers join route segments that already fit their travel needs.

## Project Status

This repository is maintained as a coursework and portfolio project. The previous hosted demo may be offline because of cloud budget limits, but the codebase and documentation remain available for review.

GitHub Actions deployment workflows are currently disabled by comment so the repository can be reviewed safely without triggering AWS deployments.

## Highlights

- Mobile-first React front end with Google Maps route selection and trip views.
- Spring Boot backend with user, schedule, authentication, and matching APIs.
- Redis-backed session storage, distributed locking, and GEO route matching.
- MySQL persistence for member data.
- AWS-oriented deployment design with S3, EC2, Load Balancer, SQS, DynamoDB, Lambda, and CloudWatch references.
- Dedicated security documentation covering IAM, MFA, monitoring, encryption, and backup practices.

## Repository Layout

```text
.
|-- .github/                         # Disabled workflows and GitHub community files
|-- docs/                            # Polished project documentation and review guide
|-- backend/                         # Spring Boot backend workspace
|-- web/                             # Vite + React front-end application
|-- cloud-prototypes/                # AWS Lambda / queue prototype utilities
|-- security/                        # IAM policies and security implementation notes
|-- project-docs/                    # Original project meeting notes and final artifacts
|-- LICENSE
|-- NOTICE
|-- CONTRIBUTING.md
|-- CODE_OF_CONDUCT.md
|-- SECURITY.md
`-- README.md
```

The repository uses normalized folder names for easier review and navigation. Start with `docs/PROJECT_STRUCTURE.md` for a complete map.

## Tech Stack

| Area | Technology |
| --- | --- |
| Front end | React, Vite, JavaScript, SCSS, Google Maps APIs |
| Backend | Java 17, Spring Boot 3, Maven, MyBatis-Plus |
| Data | MySQL, Redis |
| Cloud design | AWS S3, EC2, Load Balancer, SQS, DynamoDB, Lambda, CloudWatch |
| Security | Spring Security, BCrypt, Redis sessions, IAM role separation |

## Quick Start

### Front End

```bash
cd web
npm install
npm run dev
```

Create `web/.env.local` before running maps locally:

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Backend

```bash
cd backend
mvn -pl member-service -am spring-boot:run
```

The backend expects MySQL, Redis, and application configuration to be available. See `backend/README.md` for details.

## Documentation

- `docs/PROJECT_STRUCTURE.md` - repository map and ownership notes.
- `docs/ARCHITECTURE.md` - system architecture, data stores, and core flows.
- `docs/DEPLOYMENT.md` - deployment model and disabled CI/CD notes.
- `docs/OPEN_SOURCE.md` - license, third-party usage, and attribution guidance.
- `web/README.md` - front-end setup and conventions.
- `backend/README.md` - backend setup and service notes.
- `security/README.md` - cloud security implementation overview.

## Demo References

- Driver demo: <https://www.youtube.com/shorts/QHrtSEZEEe8>
- Passenger demo: <https://www.youtube.com/shorts/aGSRnuGI79M>

## Open Source

This project is released under the MIT License. See `LICENSE` for the license text and `NOTICE` for attribution notes.

The repository may contain coursework, prototype, and reference materials. Production use requires an independent security, privacy, dependency, and infrastructure review.
