# 🔒 Security Implementation – FlexShare

The Security Implementation of Flexshare is highlighted below:
---

## 1. IAM Design
- **IAM Roles** created for each team:
  - `Backend_Role` – strictly backend privileges (no EC2 termination, no Lambda creation).  
  - `Frontend_Role` – permissions only for S3 hosting and distribution setup.  
  - `Security_Role` – auditing and monitoring access.  
- **Trust policies** ensure roles can only be assumed by allowed users.  
- **IAM Users** created with:
  - Self-management only (password + MFA).  
  - No direct AWS resource access — they must assume a role.

---

## 2. MFA & Root Protection
- **MFA required** for all IAM users before assuming roles.  
- **Root account protected with MFA**.  
- Direct root usage avoided; root reserved for account-level tasks only.  

---

## 3. Lambda & Service-Level Security
- **Lambda functions** (sqsToCache, getGPS, cacheToDynamo, gpsCollector):
  - Each attached to the **minimum IAM policy** required to function.  
  - Configured with **CloudWatch Log Groups** for monitoring and debugging.  
  - Environment variables protected with **encryption at rest (AWS-managed KMS)**.  
- **DynamoDB**:
  - **Point-in-Time Recovery (PITR)** enabled (20 days).  
  - Encrypted at rest with AWS-managed keys.  
- **SQS**:
  - Encrypted at rest with AWS-managed keys.  
  - Retention set to 7 days.  
- **CloudWatch**:
  - Log groups created and structured per function.  
  - Streams configured for clean, non-verbose logs.  
- **Elastic Load Balancer (ELB)**:
  - Deployed over **HTTP only for testing** (no domain).  
  - Future-ready for **HTTPS + CloudFront** integration if deployed.  

---

## 4. Backup & Billing Setup
- **Consolidated billing** within one AWS account for visibility and control.  
- Billing MFA enforced, root protected.  
- Backup coverage:
  - DynamoDB PITR (20 days).  
  - SQS message retention (7 days).  

---

## 5. Security Principles Followed
- **Least Privilege** – no overbroad admin rights.  
- **Multi-Factor Authentication** – enforced everywhere.  
- **Role Separation** – backend, frontend, and security responsibilities isolated.  
- **Root Safety** – locked down with MFA, minimal use.  
- **Encryption Everywhere** – Lambda env vars, DynamoDB, SQS all encrypted.  
- **Monitoring & Logs** – CloudWatch logging enabled.  
- **Resilience** – PITR and retention to recover from failures.
- **CIA** – Ensured Confidentiality & Integrity with minimal compromise on availability.
