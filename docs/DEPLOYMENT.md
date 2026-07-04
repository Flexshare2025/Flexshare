# Deployment

FlexShare was designed for AWS-oriented deployment, but automated deployment is currently disabled to avoid accidental cloud changes during review.

## Current Status

- GitHub Actions workflow files remain in `.github/workflows/`.
- Workflow contents are commented out.
- Public demo infrastructure may be offline because of budget limits.

## Front-End Deployment Model

The front end builds static assets with Vite:

```bash
cd web
npm install
npm run build
```

The generated `web/dist/` directory can be hosted on:

- AWS S3 static hosting.
- CloudFront in front of S3.
- Any static hosting provider.

Required local environment variable:

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Backend Deployment Model

The backend is a Spring Boot service:

```bash
cd backend
mvn -pl member-service -am clean package
java -jar member-service/target/member-service-*.jar
```

Expected backing services:

- MySQL 8+
- Redis 6+
- Mail provider configuration
- Optional AWS Secrets Manager configuration

## Environment and Secrets

Do not commit credentials. Use environment variables, AWS Secrets Manager, or a secure runtime configuration mechanism for:

- Database credentials.
- Redis host and password.
- Mail credentials.
- AWS access details.
- Google Maps API keys.

## Re-Enabling GitHub Actions

Before re-enabling workflows:

1. Review `.github/workflows/` line by line.
2. Confirm repository secrets are present and scoped correctly.
3. Replace any broad IAM user credentials with least-privilege roles where possible.
4. Run build and lint jobs without deployment first.
5. Re-enable deployment only after cloud target resources are verified.
