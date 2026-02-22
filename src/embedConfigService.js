// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

const auth = require(__dirname + "/authentication.js");
const config = require(__dirname + "/../config/config.json");
const utils = require(__dirname + "/utils.js");
const PowerBiReportDetails = require(__dirname + "/../models/embedReportConfig.js");
const EmbedConfig = require(__dirname + "/../models/embedConfig.js");
const fetch = require('node-fetch');

// Constants
const API_BASE_URL = "https://api.powerbi.com/v1.0/myorg";
const DATASOURCE_TYPE_ANALYSIS_SERVICES = "AnalysisServices";

/**
 * HTTP Client for Power BI API calls
 */
class PowerBIApiClient {
    static async makeRequest(url, method = 'GET', body = null) {
        const headers = await getRequestHeader();
        
        const options = {
            method,
            headers,
        };
        
        if (body) {
            options.body = JSON.stringify(body);
            options.headers['Content-Type'] = 'application/json';
        }
        
        const result = await fetch(url, options);
        
        if (!result.ok) {
            throw result;
        }
        
        return result.json();
    }
}

/**
 * Dataset Service - Single Responsibility for dataset operations
 */
class DatasetService {
    static async getAll(workspaceId) {
        const url = `${API_BASE_URL}/groups/${workspaceId}/datasets`;
        const result = await PowerBIApiClient.makeRequest(url);
        return result.value;
    }
    
    static async getDatasources(workspaceId, datasetId) {
        const url = `${API_BASE_URL}/groups/${workspaceId}/datasets/${datasetId}/datasources`;
        const result = await PowerBIApiClient.makeRequest(url);
        return result.value;
    }
    
    static findByName(datasets, name, excludeIds = []) {
        const excludeSet = new Set(excludeIds);
        const nameLower = name.toLowerCase();
        
        return datasets.filter(dataset => {
            if (excludeSet.has(dataset.id)) return false;
            
            const datasetNameLower = dataset.name.toLowerCase();
            return datasetNameLower === nameLower || 
                   datasetNameLower.includes(nameLower) || 
                   nameLower.includes(datasetNameLower);
        });
    }
}

/**
 * Analysis Services Service - Single Responsibility for AS operations
 */
class AnalysisServicesService {
    static filterDatasources(datasources) {
        return datasources.filter(ds => ds.datasourceType === DATASOURCE_TYPE_ANALYSIS_SERVICES);
    }
    
    static extractDatabaseName(datasource) {
        if (!datasource.connectionDetails) return null;
        
        const { connectionDetails } = datasource;
        return connectionDetails.database || 
               connectionDetails.path || 
               connectionDetails.catalog || 
               null;
    }
}

/**
 * Report Service - Single Responsibility for report operations
 */
class ReportService {
    static async getDetails(workspaceId, reportId) {
        const url = `${API_BASE_URL}/groups/${workspaceId}/reports/${reportId}`;
        return PowerBIApiClient.makeRequest(url);
    }
}

/**
 * Token Service - Single Responsibility for token generation
 */
class TokenService {
    static async generateEmbedToken(reportId, datasetIds, targetWorkspaceId = null) {
        const formData = {
            reports: [{ id: reportId }],
            datasets: datasetIds.map(id => ({
                id,
                xmlaPermissions: "ReadOnly"
            }))
        };
        
        if (targetWorkspaceId) {
            formData.targetWorkspaces = [{ id: targetWorkspaceId }];
        }
        
        const url = `${API_BASE_URL}/GenerateToken`;
        return PowerBIApiClient.makeRequest(url, 'POST', formData);
    }
}

/**
 * Dataset Discovery Service - Open/Closed principle for extending dataset discovery
 */
class DatasetDiscoveryService {
    static async findAdditionalDatasetIds(workspaceId, sourceDatasetId) {
        try {
            const additionalDatasetIds = [];
            
            // Get datasources for the source dataset
            const datasources = await DatasetService.getDatasources(workspaceId, sourceDatasetId);
            
            // Filter for Analysis Services datasources
            const analysisDatasources = AnalysisServicesService.filterDatasources(datasources);
            
            if (analysisDatasources.length === 0) {
                console.log(`No Analysis Services datasources found for dataset ${sourceDatasetId}`);
                return [];
            }
            
            console.log(`Found ${analysisDatasources.length} Analysis Services datasource(s)`);
            
            // Get all datasets once for efficiency
            const allDatasets = await DatasetService.getAll(workspaceId);
            
            // Process each Analysis Services datasource
            for (const datasource of analysisDatasources) {
                const databaseName = AnalysisServicesService.extractDatabaseName(datasource);
                
                if (!databaseName) {
                    console.warn("Could not extract database name from datasource");
                    continue;
                }
                
                console.log(`Found Analysis Services database: ${databaseName}`);
                
                // Find matching datasets
                const matchingDatasets = DatasetService.findByName(
                    allDatasets, 
                    databaseName, 
                    [sourceDatasetId]
                );
                
                // Add unique matching dataset IDs
                matchingDatasets.forEach(dataset => {
                    if (!additionalDatasetIds.includes(dataset.id)) {
                        additionalDatasetIds.push(dataset.id);
                        console.log(`Added matching dataset: ${dataset.name} (ID: ${dataset.id})`);
                    }
                });
            }
            
            console.log(`Total additional datasets found: ${additionalDatasetIds.length}`);
            return additionalDatasetIds;
            
        } catch (error) {
            console.error("Error finding additional dataset IDs:", error);
            return [];
        }
    }
}

/**
 * Embed Configuration Service - Dependency Inversion principle
 */
class EmbedConfigService {
    static async getEmbedInfo() {
        try {
            const embedParams = await this.getEmbedParamsForSingleReport(
                config.workspaceId, 
                config.reportId
            );
            
            return {
                accessToken: embedParams.embedToken.token,
                embedUrl: embedParams.reportsDetail,
                expiry: embedParams.embedToken.expiration,
                status: 200
            };
        } catch (err) {
            return this.handleError(err);
        }
    }
    
    static async getEmbedParamsForSingleReport(workspaceId, reportId) {
        // Get report details
        const reportJson = await ReportService.getDetails(workspaceId, reportId);
        
        // Create report configuration
        const reportDetails = new PowerBiReportDetails(
            reportJson.id, 
            reportJson.name, 
            reportJson.embedUrl
        );
        const reportEmbedConfig = new EmbedConfig();
        reportEmbedConfig.reportsDetail = [reportDetails];
        
        // Build dataset IDs list
        let datasetIds = [reportJson.datasetId];
        
        // Find and add additional datasets
        const additionalDatasetIds = await DatasetDiscoveryService.findAdditionalDatasetIds(
            workspaceId, 
            reportJson.datasetId
        );
        
        if (additionalDatasetIds.length > 0) {
            datasetIds = [...datasetIds, ...additionalDatasetIds];
        }
        
        // Generate embed token
        reportEmbedConfig.embedToken = await TokenService.generateEmbedToken(
            reportId, 
            datasetIds, 
            workspaceId
        );
        
        return reportEmbedConfig;
    }
    
    static async handleError(err) {
        let errorBody = '';
        
        try {
            if (err.json && typeof err.json === 'function') {
                errorBody = JSON.stringify(await err.json());
            } else {
                errorBody = err.message || err.toString();
            }
        } catch (jsonErr) {
            errorBody = err.message || err.toString();
        }
        
        return {
            status: err.status || 500,
            error: `Error while retrieving report embed details\r\nStatus: ${(err.status || 'Unknown')} ${(err.statusText || '')}\r\nResponse: ${errorBody}\r\nRequestId: ${err.headers?.get('requestid') || 'N/A'}`
        };
    }
}

/**
 * Legacy function for backward compatibility - delegates to new service
 */
async function getEmbedInfo() {
    return EmbedConfigService.getEmbedInfo();
}

/**
 * Legacy function for backward compatibility
 */
async function getEmbedParamsForSingleReport(workspaceId, reportId) {
    return EmbedConfigService.getEmbedParamsForSingleReport(workspaceId, reportId);
}

/**
 * Legacy function for backward compatibility
 */
async function getAdditionalDatasetId(workspaceId, sourceDatasetId) {
    // Handle both single string and array input for backward compatibility
    const datasetId = Array.isArray(sourceDatasetId) ? sourceDatasetId[0] : sourceDatasetId;
    return DatasetDiscoveryService.findAdditionalDatasetIds(workspaceId, datasetId);
}

/**
 * Legacy function for backward compatibility
 */
async function getDatasetDatasources(workspaceId, datasetId) {
    return DatasetService.getDatasources(workspaceId, datasetId);
}

/**
 * Legacy function for backward compatibility
 */
async function getAllDatasets(workspaceId) {
    return DatasetService.getAll(workspaceId);
}

/**
 * Legacy function for backward compatibility
 */
async function getEmbedTokenForSingleReportSingleWorkspace(reportId, datasetIds, targetWorkspaceId) {
    return TokenService.generateEmbedToken(reportId, datasetIds, targetWorkspaceId);
}

/**
 * Get Request header with authentication token
 */
async function getRequestHeader() {
    try {
        const tokenResponse = await auth.getAccessToken();
        const token = tokenResponse.accessToken;
        
        return {
            'Content-Type': "application/json",
            'Authorization': utils.getAuthHeader(token)
        };
    } catch (err) {
        const errorResponse = err.hasOwnProperty('error_description') && err.hasOwnProperty('error') 
            ? err.error_description 
            : err.toString();
        
        throw {
            status: 401,
            error: errorResponse
        };
    }
}

// Public API - maintains backward compatibility
module.exports = {
    getEmbedInfo,
    getEmbedParamsForSingleReport,
    getAdditionalDatasetId,
    getDatasetDatasources,
    getAllDatasets,
    getEmbedTokenForSingleReportSingleWorkspace,
    
    // Export services for testing and advanced usage
    DatasetService,
    ReportService,
    TokenService,
    DatasetDiscoveryService,
    EmbedConfigService
};