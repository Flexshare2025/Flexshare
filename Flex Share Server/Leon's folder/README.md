
# Flexshare Backend
## Framework Diagram
<img width="1503" height="1005" alt="Flexshare Architecture" src="https://github.com/user-attachments/assets/06eff430-6751-4a56-ba56-53db7d01db8b" />

## Introduction

This project is a **Spring Boot 3.0** application developed as the backend server for the FlexShare system.

FlexShare is designed as a "private bus" service that provides a reliable, safe, and efficient way for users to share transport routes, with a distributed, cloud-ready backend that supports scalability and high availability.

### Goals

The backend server is designed with the following overall goals:
**Provide secure user management**, including registration, login, and authentication.
**Handle schedules and routes** with high reliability and concurrency control.
**Ensure a distributed, non-state (stateless) architecture** so the system can scale easily in a cloud environment.
**Support transaction management** and data storage using both SQL (**MySQL**) and NoSQL (**Redis**) databases.
**Prepare for future payment and billing features** (not yet implemented).
**Centralized Configuration Based on Cloud Services.

### Architecture Highlights

The design employs a **stateless architecture** for service distribution. We combine **MySQL** for relational data (e.g., user profiles, schedules) and **Redis** for fast, high-concurrency operations.

To improve **concurrency** and **reliability**:
* A **distributed session mechanism** is built with Redis to allow **Single Sign-On (SSO)**.
* A **distributed lock** is implemented using Redis to prevent data conflicts when multiple users update schedules simultaneously.
* A **GEO data structure** is utilized for quickly matching route points with user locations.
* The system is integrated with an **AWS Load Balancer** via a health check API.
* **GitHub Actions** are used for Continuous Integration and Deployment (CI/CD).



---

## Technologies Used

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | Java | 17 | Core programming language |
| **Framework** | Spring Boot | 3.0 | Application framework |
| **Build** | Maven | 3.8+ | Dependency management and build automation |
| **Database (SQL)** | MySQL | 8.0+ | Persistent storage for relational data |
| **Database (NoSQL)** | Redis | 6.0+ | Caching, session management, distributed locks, GEO data |
| **Deployment** | AWS Load Balancer | - | Health check integration |
| **CI/CD** | GitHub Actions | - | Automated build and testing |

---

## Features

### 1. User Module

* **User Creation:** Built with MyBatis Plus and MySQL. Registration includes **email verification** for security.
* **User Authorization & Login:** Features a robust, distributed session design based on Redis key-value storage, supporting **Single Sign-On (SSO)**.
* **Security:** User data (passwords) is secured with **salted encryption**.

### 2. Schedule Module

* **Concurrency Control:** Uses a **distributed lock** (Redis-based) to prevent race conditions during schedule creation, subscription, and update.
* **Geo-based Scheduling:** Implemented with Redis's efficient **GEO data structure** for splitting and quickly matching route points by location.

### 3. System & Security

* **Health Check:** Integrated API endpoint for **AWS Load Balancer** health checks.
* **CORS Filter:** Implemented a Cross-Origin Resource Sharing filter to protect APIs.
* **Authentication:** Email login with verification ensures safe access, single-point loggin, session expire and auto update.

---

## Project Structure

```

flexshare-backend/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/jl/flexshare/
│   │   │   ├── FlexShareApplication.java
│   │   │   ├── config/        \# App configuration (CORS, Redis, Security)
│   │   │   ├── controller/    \# REST controllers
│   │   │   ├── entity/        \# Data models (MySQL/Redis)
│   │   │   ├── exception/     \# Custom exception handling
│   │   │   ├── filter/        \# Security filters (e.g., Auth, CORS)
│   │   │   ├── listener/      \# Redis key expiration listeners (for sessions)
│   │   │   ├── lock/          \# Distributed lock implementation with Redis
│   │   │   ├── mapper/        \# MyBatis mappers for MySQL interaction
│   │   │   ├── result/        \# Standardized result wrapper for API responses
│   │   │   ├── service/       \# Business service interfaces
│   │   │   ├── imply/         \# Service implementations
│   │   │   ├── utils/         \# General utility functions
│   │   │   └── validation/    \# Request validation groups
│   │   └── resources/
│   │       ├── application.yml  \# Spring Boot configuration
│   │       └── mysql.sql        \# Initial database schema and data
│   └── test/java/com/flexshare/
│       └── MemberTest.java      \# Unit/Integration tests
└── target/ (build output)

````

---

## Setup Instructions

### Prerequisites

You must have the following installed and running:
* **Java 17+**
* **Maven 3.8+**
* **MySQL 8.0+**
* **Redis 6.0+**

### Steps

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Flexshare2025/Flexshare (change to your github acc firstly)
    cd FlexShare Server
    ```

2.  **Database Setup:**
    * Start your MySQL and Redis servers.
    * Update the `src/main/resources/application.yml` file with your database connection details (MySQL and Redis).
    * Initialize your MySQL database using the schema in `src/main/resources/mysql.sql`.

3.  **Run the Application:**

    **Option A: Run directly with Maven**
    ```bash
    mvn spring-boot:run
    ```

    **Option B: Build and run the JAR file**
    ```bash
    mvn clean package
    java -jar target/member-service-1.0-SNAPSHOT.jar
    ```

---

## CI/CD with GitHub Actions

This project uses **GitHub Actions** for automated deployment.

A workflow is configured to run automatically on every push to the repository. This workflow builds the project, runs tests, and ensures the code is always validated before deployment.

---

## License

This project is intended for **learning purposes and coursework**.
````
