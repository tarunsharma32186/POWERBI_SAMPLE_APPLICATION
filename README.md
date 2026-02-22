# Power BI AppOwnsData Sample Application

## Overview

This application demonstrates embedding Power BI reports using the AppOwnsData model. It supports reports based on multiple semantic models and external databases (e.g., PostgreSQL), and addresses common issues encountered with service principal authentication and on-premise data sources.

---

## Features

- Embed Power BI reports with multiple semantic models
- Support for external databases (PostgreSQL)
- Dynamic configuration (no static IDs)
- Enhanced error handling for on-premise data sources

---

## Technical Implementation Steps

### 1. Configuration Setup

- All environment-specific values (clientId, workspaceId, reportId, database credentials) are stored in `config/config.json`.
- No static IDs are used in the source code.

### 2. Authentication

- Azure AD authentication is implemented using a service principal.
- Access tokens are acquired for Power BI REST API calls.

### 3. Fetching Report and Dataset Details

- The application retrieves report and dataset information from Power BI using REST API endpoints.
- Supports multiple semantic models and databases.

### 4. Embed Token Generation

- The application authenticates with Azure AD and obtains an access token.
- It calls the Power BI REST API `GenerateToken` endpoint, specifying all required reports, datasets, and workspaces in the payload.
- All relevant dataset IDs and report IDs are included, allowing the embed token to grant access to multiple semantic models.
- For external databases (e.g., PostgreSQL), dataset connection details are configured in Power BI, and the service principal is granted necessary permissions.
- The generated embed token is used in the frontend to securely embed the report.

### 5. Handling On-Premise Data Source Errors

- When using multiple semantic models and on-premise data sources with a service principal, Power BI may return an "on-premise error" due to gateway or permission issues.
- The application detects this error by checking API responses and embed process results.
- To resolve:
  - The service principal is mapped in the Power BI gateway and given access to all required data sources.
  - All necessary dataset IDs are included in the embed token request.
  - Error messages and logging are implemented to identify problematic data sources or gateways.
- This enables successful embedding of reports with both cloud and on-premise sources.

### 6. Embedding the Report

- The Power BI JavaScript SDK is used to embed the report in the frontend.
- The embed token and report configuration are passed to the SDK.

### 7. Error Handling and Logging

- Comprehensive error handling is implemented for authentication, token generation, and report embedding.
- Clear logging is provided for troubleshooting.

### 8. Dynamic Configuration

- All IDs and credentials are dynamically loaded from configuration files.
- No static IDs are present in the source code.

---

## Usage

1. Update `config/config.json` with your environment-specific values.
2. Run the application.
3. Access the embedded Power BI report in your browser.

---

## Troubleshooting

- If you encounter "on-premise error" messages, ensure your service principal is mapped in the Power BI gateway and has access to all required data sources.
- Check logs for detailed error information.

---

## License

This project is for educational and demonstration purposes.
