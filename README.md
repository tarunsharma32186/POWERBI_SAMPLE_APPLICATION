# Power BI Sample Application: AppOwnsData

This project is a sample application demonstrating how to embed Power BI reports using the App Owns Data model. It is designed to help developers understand and implement Power BI embedding in their own applications.

## Features
- Embed Power BI reports securely using service principal authentication
- Configuration-driven setup for easy customization
- Modular code structure for authentication, embedding, and utilities
- Simple web interface for viewing embedded reports

## Project Structure
```
config/               # Configuration files (e.g., config.json)
models/               # Embedding configuration models
public/               # Static assets (CSS, JS)
src/                  # Main server and logic (authentication, embedding, utils)
views/                # HTML views
package.json          # Node.js dependencies and scripts
```

## Prerequisites
- Node.js (v14 or higher recommended)
- Power BI Pro account
- Azure AD App Registration with required API permissions

## Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd AppOwnsData
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Power BI and Azure AD:**
   - Update `config/config.json` with your Azure AD and Power BI details.

4. **Run the application:**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000` by default.


## When to Use This Modified Sample
This sample is especially useful if you encounter the following scenario and error:

- **Problem:** When embedding a Power BI report that sources data from multiple semantic models and multiple databases (such as Postgres), using a service principal for authentication can result in an error message related to on-premises data gateways ("on-premise error").

- **Solution:** This code has been modified to support generating reports from multiple semantic models and Postgres databases, overcoming the limitations of the default sample. If you face on-premise gateway errors with service principal authentication in such scenarios, this implementation provides a working approach.

**Note:** If you are embedding reports with complex data sources and encounter gateway or authentication errors, review the code changes in this sample for guidance.

## Usage
- Open your browser and navigate to `http://localhost:3000` to view the embedded Power BI report.

## License
This project is provided for educational purposes and does not include a license. Please add your own license as needed.

## Acknowledgements
- [Microsoft Power BI Embedded Documentation](https://learn.microsoft.com/power-bi/developer/embedded/)

---
Feel free to customize this README for your specific use case or organization.
