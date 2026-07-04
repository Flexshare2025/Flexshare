# FlexShare Backend

This directory contains the Spring Boot backend workspace for FlexShare. The main service is `member-service`, which provides user management, schedule management, authentication, Redis-backed session handling, and GEO route matching.

## Module Layout

```text
backend/
|-- .idea/                 # IDE project metadata retained for historical compatibility
|-- pom.xml
|-- member-service/
|   |-- pom.xml
|   |-- src/main/java/com/jl/flexshare/
|   |   |-- FlexShareApplication.java
|   |   `-- member/
|   |       |-- component/     # Security entry points and framework components
|   |       |-- config/        # Redis, security, CORS, and app configuration
|   |       |-- controller/    # REST API controllers
|   |       |-- entity/        # Request and domain models
|   |       |-- exception/     # Global exception handling
|   |       |-- filter/        # Request filters and authentication checks
|   |       |-- listener/      # Redis expiration listeners
|   |       |-- lock/          # Redis distributed lock annotation/aspect
|   |       |-- mapper/        # MyBatis-Plus mappers
|   |       |-- result/        # Standard API response objects
|   |       |-- service/       # Business services
|   |       |-- utils/         # Utility functions
|   |       `-- validation/    # Validation groups
|   `-- src/main/resources/
|       |-- application.yml
|       `-- mysql.sql
`-- README.md
```

## Tech Stack

- Java 17
- Spring Boot 3
- Maven
- MyBatis-Plus
- MySQL
- Redis
- Spring Security
- Lombok
- Jakarta Validation

## Responsibilities

- Register users with email verification.
- Authenticate users and manage session tokens.
- Enforce single-login sessions through Redis.
- Create, list, match, book, and cancel ride schedules.
- Use Redis GEO indexes to match passengers with route points.
- Use Redis locks to reduce schedule race conditions.
- Provide standardized API responses and centralized exception handling.

## Local Run

Prerequisites:

- Java 17+
- Maven 3.8+
- MySQL 8+
- Redis 6+

Run:

```bash
cd backend
mvn -pl member-service -am spring-boot:run
```

Build:

```bash
mvn -pl member-service -am clean package
```

## Configuration

The service reads configuration from `member-service/src/main/resources/application.yml` and optional external secret providers.

Do not commit real credentials. Use environment variables, AWS Secrets Manager, or deployment-specific secret stores for:

- MySQL connection values.
- Redis host, port, and password.
- Mail credentials.
- AWS credentials and resource identifiers.

## API Areas

| Area | Path Prefix | Description |
| --- | --- | --- |
| Users | `/users` | Register, login, reset password, email verification |
| Schedules | `/schedules` | Create, match, book, cancel, terminate, and list schedules |
| Health | `/health` | Health check endpoint for runtime monitoring |

## Security Notes

- Passwords are hashed with BCrypt.
- Session tokens are stored and refreshed through Redis.
- Global exception handling avoids exposing internal stack traces to API callers.
- Security headers are applied by request filters.
- Deployment workflows are currently disabled by comment in `.github/workflows/`.

## Production Checklist

Before production use:

- Add integration tests for authentication and booking concurrency.
- Run dependency vulnerability scanning.
- Review Redis lock behavior under load.
- Review CORS, cookie, and session settings for the target domain.
- Move all secrets out of local YAML files.
- Enable HTTPS and secure cookie settings.
