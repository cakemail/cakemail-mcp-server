// Base API client with authentication and core request handling

import fetch, { RequestInit, Response } from 'node-fetch';
import { CakemailConfig, CakemailToken } from '../types/cakemail-types.js';
import { 
  CakemailError as CakemailApiError,
  CakemailAuthenticationError,
  createCakemailError
} from '../types/errors.js';
import {
  RetryManager,
  RateLimiter,
  CircuitBreaker,
  RequestQueue,
  withTimeout,
  RetryConfig,
  RateLimitConfig,
  DEFAULT_RATE_LIMIT_CONFIG
} from '../types/retry.js';
import {
  PaginatedIterator,
  PaginationFactory,
  UnifiedPaginationOptions,
  PaginatedResult,
  IteratorOptions
} from '../utils/pagination/index.js';
import { CakemailNetworkError } from '../types/errors.js';
import logger from '../utils/logger.js';

export interface EnhancedCakemailConfig extends CakemailConfig {
  retry?: Partial<RetryConfig>;
  rateLimit?: Partial<RateLimitConfig>;
  timeout?: number; // milliseconds
  maxConcurrentRequests?: number;
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeout: number;
  };
}

export class BaseApiClient {
  protected config: EnhancedCakemailConfig;
  protected token: CakemailToken | null = null;
  protected mockToken: CakemailToken | null = null;
  protected tokenExpiry: Date | null = null;
  protected baseUrl: string;
  protected debugMode: boolean;
  protected currentAccountId: number | null = null;
  
  // Rate limiting and retry components
  protected retryManager: RetryManager;
  protected rateLimiter: RateLimiter | null = null;
  protected circuitBreaker: CircuitBreaker | null = null;
  protected requestQueue: RequestQueue;
  protected timeout: number;

  constructor(config: EnhancedCakemailConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.cakemail.dev';
    this.debugMode = config.debug || process.env.CAKEMAIL_DEBUG === 'true';
    this.timeout = config.timeout || 30000; // 30 second default timeout
    
    // Initialize retry manager
    this.retryManager = new RetryManager(config.retry, this.debugMode);
    
    // Initialize rate limiter if enabled
    const rateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config.rateLimit };
    if (rateLimitConfig.enabled) {
      this.rateLimiter = new RateLimiter(rateLimitConfig);
    }
    
    // Initialize circuit breaker if enabled
    const circuitBreakerConfig = {
      enabled: false, // Default to disabled unless explicitly enabled
      failureThreshold: 5,
      resetTimeout: 60000,
      ...config.circuitBreaker
    };
    if (circuitBreakerConfig.enabled) {
      this.circuitBreaker = new CircuitBreaker(
        circuitBreakerConfig.failureThreshold,
        circuitBreakerConfig.resetTimeout,
        this.debugMode
      );
    }
    
    // Initialize request queue
    this.requestQueue = new RequestQueue(config.maxConcurrentRequests || 10);
  }

  async authenticate(): Promise<void> {
    // A PAT is already the bearer credential; there is nothing to exchange.
    if (this.config.apiKey) {
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // Try refresh token first if available and not expired
        if (this.token?.refresh_token && this.tokenExpiry && new Date() < new Date(this.tokenExpiry.getTime() - 300000)) {
          try {
            await this.refreshToken();
            return;
          } catch (error) {
            if (this.debugMode) {
              logger.info(`Refresh token failed (attempt ${retryCount + 1}), falling back to password authentication`);
            }
          }
        }

        // Password authentication with retry logic
        await this.passwordAuthenticate();
        return;
        
      } catch (error) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        if (this.debugMode) {
          logger.info(`Authentication attempt ${retryCount} failed, retrying...`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }

  private async passwordAuthenticate(): Promise<void> {
    if (!this.config.email || !this.config.password) {
      throw new CakemailAuthenticationError('No credentials configured: set a PAT (apiKey) or email and password');
    }

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: this.config.email,
        password: this.config.password,
        scopes: 'user' // Request appropriate scopes
      }).toString()
    });

    if (!response.ok) {
      const errorBody = await this.parseErrorResponse(response);
      throw new CakemailAuthenticationError(
        `Authentication failed (${response.status}): ${errorBody?.error_description || errorBody?.message || errorBody?.error || response.statusText}`,
        errorBody
      );
    }

    const tokenData = await response.json() as CakemailToken;
    this.token = tokenData;
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000) - 60000); // 1 minute buffer
    
    if (this.debugMode) {
      logger.info(`[Cakemail API] Token obtained, expires at: ${this.tokenExpiry.toISOString()}`);
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.token?.refresh_token) {
      throw new CakemailAuthenticationError('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token
      }).toString()
    });

    if (!response.ok) {
      const errorBody = await this.parseErrorResponse(response);
      
      // If refresh fails due to invalid refresh token, clear it and force password auth
      if (response.status === 401 || response.status === 403) {
        this.token = null;
        this.tokenExpiry = null;
        throw new CakemailAuthenticationError(
          'Refresh token invalid, password authentication required',
          errorBody
        );
      }
      
      throw new CakemailAuthenticationError(
        `Token refresh failed (${response.status}): ${response.statusText}`,
        errorBody
      );
    }

    const tokenData = await response.json() as CakemailToken;
    this.token = tokenData;
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000) - 60000);
    
    if (this.debugMode) {
      logger.info(`[Cakemail API] Token refreshed, expires at: ${this.tokenExpiry.toISOString()}`);
    }
  }

  // Helper method to parse error responses consistently
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return { detail: text || response.statusText };
        }
      }
    } catch {
      return { detail: response.statusText };
    }
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Ensure we have a valid token before making the request
    await this.ensureValidToken();
    
    const operation = async () => {
      // Apply rate limiting
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }
      
      return this.executeRequest(endpoint, options);
    };
    
    // Add to request queue to manage concurrency
    return this.requestQueue.add(async () => {
      // Apply circuit breaker if enabled
      if (this.circuitBreaker) {
        return this.circuitBreaker.execute(
          () => this.retryManager.executeWithRetry(operation, `${options.method || 'GET'} ${endpoint}`),
          `API request to ${endpoint}`
        );
      } else {
        return this.retryManager.executeWithRetry(operation, `${options.method || 'GET'} ${endpoint}`);
      }
    });
  }
  
  private async executeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Use mock token in test environment if available, then a PAT, then the password-grant token
    const accessToken = this.mockToken?.access_token || this.config.apiKey || this.token?.access_token;
    if (!accessToken) {
      throw new CakemailAuthenticationError('No authentication token available');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    if (this.debugMode) {
      logger.info(`[Cakemail API] ${method} ${url}`);
      if (options.body) {
        logger.info(`[Cakemail API] Request body:`, options.body);
      }
    }

    let response: Response;
    try {
      // Add timeout to the request
      const fetchPromise = fetch(url, {
        ...options,
        headers
      });
      
      response = await withTimeout(
        fetchPromise, 
        this.timeout, 
        `Request to ${endpoint} timed out after ${this.timeout}ms`
      );
    } catch (error) {
      // Handle network errors (fetch rejections)
      if (this.debugMode) {
        logger.error(`[Cakemail API] Network error for ${method} ${endpoint}:`, error);
      }
      
      // If it's already a CakemailNetworkError, re-throw it
      if (error instanceof CakemailNetworkError) {
        throw error;
      }
      
      // Otherwise, wrap it in a CakemailNetworkError
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CakemailNetworkError(`Network error: ${errorMessage}`, error as Error);
    }

    if (this.debugMode) {
      logger.info(`[Cakemail API] Response: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorResponse(response);
      
      if (this.debugMode) {
        logger.error(`[Cakemail API] Error response:`, {
          status: response.status,
          statusText: response.statusText,
          endpoint: `${method} ${endpoint}`,
          errorBody
        });
      }
      
      throw createCakemailError(response, errorBody);
    }

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      
      if (this.debugMode) {
        logger.info(`[Cakemail API] Response data:`, {
          hasData: !!(result as any).data,
          dataType: typeof (result as any).data,
          dataLength: Array.isArray((result as any).data) ? (result as any).data.length : 'N/A',
          pagination: (result as any).pagination || 'None'
        });
      }
      
      return result;
    }
    
    return { success: true, status: response.status };
  }

  // Get current account ID for proper scoping
  protected async getCurrentAccountId(): Promise<number | undefined> {
    if (this.currentAccountId) {
      return this.currentAccountId;
    }

    try {
      const account = await this.makeRequest('/accounts/self');
      this.currentAccountId = account.data?.id || null;
      return this.currentAccountId || undefined;
    } catch (error: any) {
      if (this.debugMode) {
        logger.warn('[Cakemail API] Could not fetch account ID:', error.message);
      }
      return undefined;
    }
  }

  // Utility methods
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  // Enhanced token status checking
  public getTokenStatus(): {
    hasToken: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
    timeUntilExpiry: number | null; // milliseconds
    needsRefresh: boolean;
    tokenType: string | null;
    hasRefreshToken: boolean;
  } {
    // A PAT has no refresh token and no client-side expiry; a revoked or expired PAT surfaces as a 401
    if (this.config.apiKey) {
      return {
        hasToken: true,
        isExpired: false,
        expiresAt: null,
        timeUntilExpiry: null,
        needsRefresh: false,
        tokenType: 'Bearer',
        hasRefreshToken: false
      };
    }

    const now = new Date();
    const hasToken = !!this.token?.access_token;
    const isExpired = this.tokenExpiry ? now >= this.tokenExpiry : !hasToken;
    const timeUntilExpiry = this.tokenExpiry ? this.tokenExpiry.getTime() - now.getTime() : null;
    const needsRefresh = hasToken && this.tokenExpiry ? 
      now >= new Date(this.tokenExpiry.getTime() - 300000) : // Refresh 5 minutes before expiry
      !hasToken;

    return {
      hasToken,
      isExpired,
      expiresAt: this.tokenExpiry,
      timeUntilExpiry,
      needsRefresh,
      tokenType: this.token?.token_type || null,
      hasRefreshToken: !!this.token?.refresh_token
    };
  }

  // Manual token refresh with better error handling
  public async forceRefreshToken(): Promise<{
    success: boolean;
    newToken: Partial<CakemailToken> | null;
    previousExpiry: Date | null;
    newExpiry: Date | null;
    error?: string;
  }> {
    const previousExpiry = this.tokenExpiry;
    
    try {
      await this.refreshToken();
      return {
        success: true,
        newToken: this.token ? {
          token_type: this.token.token_type,
          expires_in: this.token.expires_in,
          // Don't expose actual tokens for security
        } : null,
        previousExpiry,
        newExpiry: this.tokenExpiry
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        newToken: null,
        previousExpiry,
        newExpiry: this.tokenExpiry,
        error: errorMessage
      };
    }
  }

  // Validate token by making a test API call
  public async validateToken(): Promise<{
    isValid: boolean;
    statusCode?: number;
    error?: string;
    accountInfo?: any;
  }> {
    try {
      // Use a lightweight endpoint to test token validity
      const response = await this.makeRequest('/accounts/self');
      return {
        isValid: true,
        statusCode: 200,
        accountInfo: {
          id: response.data?.id,
          email: response.data?.email,
          name: response.data?.name
        }
      };
    } catch (error: any) {
      return {
        isValid: false,
        statusCode: error.statusCode || 0,
        error: error.message || String(error)
      };
    }
  }

  // Get token scopes and permissions
  public getTokenScopes(): {
    accounts: number[];
    scopes: string | null;
    permissions: string[];
  } {
    return {
      accounts: this.token?.accounts || [],
      scopes: null, // The API doesn't directly expose scopes in the token response
      permissions: this.inferPermissionsFromAccounts()
    };
  }

  // Infer permissions based on available accounts
  private inferPermissionsFromAccounts(): string[] {
    const permissions: string[] = [];
    
    if (this.token?.accounts && this.token.accounts.length > 0) {
      permissions.push('account_access');
      permissions.push('email_send');
      permissions.push('campaign_management');
      permissions.push('contact_management');
      permissions.push('list_management');
      permissions.push('template_management');
      permissions.push('analytics_access');
    }
    
    return permissions;
  }

  // Auto-refresh token before requests if needed
  protected async ensureValidToken(): Promise<void> {
    // Skip token refresh in test environment if mock token is set, or when a PAT is the credential
    if (this.mockToken || this.config.apiKey) {
      return;
    }
    
    const status = this.getTokenStatus();
    
    if (!status.hasToken || status.isExpired) {
      await this.authenticate();
    } else if (status.needsRefresh && status.hasRefreshToken) {
      try {
        await this.refreshToken();
      } catch (error) {
        // If refresh fails, fall back to full authentication
        await this.authenticate();
      }
    }
  }
  
  // Method to set mock token for testing
  public setMockToken(token: CakemailToken): void {
    this.mockToken = token;
  }

  // Enhanced health check with proper error handling and retry logic
  async healthCheck() {
    try {
      // Test account access with retry logic
      const account = await this.makeRequest('/accounts/self');
      
      // Get component status for debugging
      const componentStatus = {
        retryManager: this.retryManager.getConfig(),
        rateLimiter: this.rateLimiter ? 'enabled' : 'disabled',
        circuitBreaker: this.circuitBreaker ? this.circuitBreaker.getState() : 'disabled',
        requestQueue: this.requestQueue.getStats(),
        timeout: this.timeout
      };
      
      return { 
        status: 'healthy', 
        authenticated: true,
        accountId: account.data?.id,
        apiCompliance: 'v1.18.25',
        components: componentStatus
      };
    } catch (error: any) {
      if (error instanceof CakemailApiError) {
        return { 
          status: 'unhealthy', 
          error: error.message,
          errorType: error.name,
          statusCode: error.statusCode,
          authenticated: error.statusCode !== 401,
          components: {
            circuitBreaker: this.circuitBreaker ? this.circuitBreaker.getState() : 'disabled',
            requestQueue: this.requestQueue.getStats()
          }
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        status: 'unhealthy', 
        error: errorMessage,
        errorType: 'UnknownError',
        authenticated: false,
        components: {
          circuitBreaker: this.circuitBreaker ? this.circuitBreaker.getState() : 'disabled',
          requestQueue: this.requestQueue.getStats()
        }
      };
    }
  }
  
  // Methods to configure retry and rate limiting at runtime
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryManager.updateConfig(config);
  }
  
  getRetryConfig(): RetryConfig {
    return this.retryManager.getConfig();
  }
  
  getCircuitBreakerState() {
    return this.circuitBreaker ? this.circuitBreaker.getState() : null;
  }
  
  getRequestQueueStats() {
    return this.requestQueue.getStats();
  }

  // Unified pagination support methods
  protected async fetchPaginated<T>(
    endpoint: string,
    endpointName: string,
    options: UnifiedPaginationOptions = {},
    additionalParams: Record<string, any> = {}
  ): Promise<PaginatedResult<T>> {
    const manager = PaginationFactory.createManager(endpointName);
    const params = { ...manager.buildQueryParams(options), ...additionalParams };
    
    const query = Object.keys(params).length > 0 ? `?${new URLSearchParams(params)}` : '';
    const response = await this.makeRequest(`${endpoint}${query}`, {
      method: 'GET'
    });
    
    return manager.parseResponse<T>(response);
  }

  protected createIterator<T>(
    endpoint: string,
    endpointName: string,
    options: IteratorOptions = {},
    additionalParams: Record<string, any> = {}
  ): PaginatedIterator<T> {
    return PaginationFactory.createIterator<T>(
      endpointName,
      (params) => {
        const queryParams = { ...params, ...additionalParams };
        const query = Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams)}` : '';
        return this.makeRequest(`${endpoint}${query}`);
      },
      options
    );
  }

  protected createRobustIterator<T>(
    endpoint: string,
    endpointName: string,
    options: IteratorOptions & {
      onError?: (error: Error, attempt: number) => void;
      validateResponse?: (response: any) => boolean;
    } = {},
    additionalParams: Record<string, any> = {}
  ): PaginatedIterator<T> {
    return PaginationFactory.createRobustIterator<T>(
      endpointName,
      (params) => {
        const queryParams = { ...params, ...additionalParams };
        const query = Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams)}` : '';
        return this.makeRequest(`${endpoint}${query}`);
      },
      options
    );
  }

  // Helper method to get all items from an endpoint with automatic pagination
  protected async getAllItems<T>(
    endpoint: string,
    endpointName: string,
    options: IteratorOptions = {},
    additionalParams: Record<string, any> = {}
  ): Promise<T[]> {
    const iterator = this.createIterator<T>(endpoint, endpointName, options, additionalParams);
    return iterator.toArray();
  }

  // Helper method to process items in batches
  protected async processBatches<T>(
    endpoint: string,
    endpointName: string,
    processor: (batch: T[]) => Promise<void>,
    options: IteratorOptions = {},
    additionalParams: Record<string, any> = {}
  ): Promise<void> {
    const iterator = this.createIterator<T>(endpoint, endpointName, options, additionalParams);
    for await (const batch of iterator.batches()) {
      await processor(batch);
    }
  }
}
