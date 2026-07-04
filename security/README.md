# Security Implementation

This directory contains FlexShare security planning material, IAM policies, trust policies, and AWS permission references.

## Security Objectives

- Apply least privilege for all cloud roles.
- Separate backend, frontend, and security responsibilities.
- Require MFA for privileged operations.
- Protect root account usage.
- Encrypt managed service data where supported.
- Keep logs and monitoring available for audit and troubleshooting.

## IAM Design

The project separates responsibilities through dedicated IAM roles:

| Role | Purpose |
| --- | --- |
| `Backend_Role` | Backend service and deployment permissions |
| `Frontend_Role` | Static hosting and front-end deployment permissions |
| `Security_Role` | Audit, monitoring, and security review permissions |

Trust policies are used to control which identities can assume each role. IAM users are expected to manage their own password and MFA settings, then assume the appropriate role instead of receiving broad direct permissions.

## MFA and Root Account Protection

- MFA should be enabled for all IAM users.
- MFA should be enabled for the AWS root account.
- Root account use should be limited to account-level administrative tasks only.
- Day-to-day operations should use role-based access.

## Service-Level Controls

### Lambda

Prototype Lambda functions include:

- `sqsToCache`
- `getGPS`
- `cacheToDynamo`
- `gpsCollector`

Recommended controls:

- Grant each function only the permissions it needs.
- Use CloudWatch log groups for runtime visibility.
- Store environment variables securely.
- Avoid embedding credentials in function code or deployment packages.

### DynamoDB

- Enable encryption at rest.
- Enable point-in-time recovery when data protection is required.
- Restrict table access by role and purpose.

### SQS

- Enable encryption at rest.
- Use appropriate message retention.
- Scope producers and consumers separately where possible.

### CloudWatch

- Keep log groups organized by service.
- Avoid logging secrets, tokens, passwords, or personally sensitive data.
- Use logs for troubleshooting and audit support.

### Load Balancer and HTTPS

The original project used HTTP during testing because no production domain was available. A production deployment should use:

- HTTPS at the edge.
- Valid certificates.
- Secure cookie settings.
- Domain-aware CORS configuration.

## Backup and Billing

- Use billing alerts and budget controls for cloud resources.
- Protect billing and account administration with MFA.
- Use managed backup features, such as DynamoDB point-in-time recovery, where appropriate.

## Security Principles Applied

- Least privilege.
- Role separation.
- MFA enforcement.
- Root account minimization.
- Encryption where supported.
- Monitoring and logging.
- Recovery planning through retention and backup settings.

## Production Review Notes

Before reuse in production, review every policy JSON file in this directory. Coursework permissions and prototype policies may need to be narrowed for a real deployment.
