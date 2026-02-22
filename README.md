# 📊 Power BI – Embedded Reporting Sample Application

## Overview

This project demonstrates secure embedding of Power BI reports using the **POWERBI_SAMPLE_APPLICATION** model with Azure AD Service Principal authentication.

It supports:

- Multiple semantic models (datasets)
- External databases (PostgreSQL)
- On-premise data sources via Power BI Gateway
- Dynamic configuration (no hardcoded IDs)
- Production-style error handling & logging

The goal of this application is to showcase real-world embedding scenarios and handle common authentication and gateway challenges.

---

## Architecture Flow
<img width="1536" height="1024" alt="powerbirepo" src="https://github.com/user-attachments/assets/983b4e99-bee5-4db5-b775-9ab6833f353f" />

---

## Authentication

- Uses Azure AD **Service Principal**
- Access tokens acquired for Power BI REST API
- No credentials hardcoded in source code
- Fully environment-driven configuration

---

## Configuration Management

All environment-specific values are stored in:
config/config.json

Configuration includes:

- clientId
- tenantId
- clientSecret
- workspaceId
- reportId
- datasetIds
- database connection details

✔ No static IDs in source code  
✔ Easily configurable across environments  

---

## Embed Token Generation (Multi-Dataset Support)

The application:

1. Authenticates with Azure AD.
2. Retrieves report and dataset metadata via Power BI REST API.
3. Calls the `GenerateToken` endpoint.
4. Includes:
   - Multiple dataset IDs
   - Report IDs
   - Workspace IDs
5. Generates an embed token that grants access to multiple semantic models.

This enables embedding reports connected to:

- Cloud data sources
- PostgreSQL
- On-premise data sources via Gateway

---

## Handling On-Premise Gateway Errors

When embedding reports using service principals with on-premise data sources, Power BI may return:

> "On-premise data gateway error"

This project resolves that by:

- Mapping the service principal in the Power BI Gateway
- Granting access to all required data sources
- Including all necessary dataset IDs in embed token payload
- Implementing structured error handling & logging

This ensures successful embedding across hybrid environments.

---

## Frontend Embedding

- Uses Power BI JavaScript SDK
- Securely passes embed token
- Dynamically loads report configuration
- Handles embed lifecycle events and errors

---

## Tech Stack

- Node.js
- Azure AD (Service Principal Authentication)
- Power BI REST API
- Power BI JavaScript SDK
- PostgreSQL
- JSON-based configuration

---

## How to Run

1. Clone the repository: git clone <your-repo-url>
2. Install dependencies: npm install
3. Update `config/config.json` with your environment values.
4. Start the server: npm start
5. Open the application in your browser to view the embedded report.

---

## Key Highlights

- Secure AppOwnsData implementation
- Multi-dataset embed token generation
- Hybrid (cloud + on-premise) support
- Gateway troubleshooting handling
- Production-style configuration management
- Clean separation of authentication and embedding logic

---

## Learning Outcomes

- Understanding Power BI embedding architecture
- Service principal authentication flow
- Handling semantic models and dataset relationships
- Resolving gateway-based authentication errors
- Secure backend token generation patterns

---

## License

This project is intended for educational and demonstration purposes.
