// Shared TypeScript interfaces for Cakemail API

export interface CakemailConfig {
  // A Personal Access Token (ck_pat_…), sent as-is as the Bearer credential.
  // When set, email/password are ignored and /token is never called.
  apiKey?: string;
  email?: string;
  password?: string;
  baseUrl?: string;
  debug?: boolean;
}

export interface CakemailToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  accounts: number[];
}

export interface CakemailErrorResponse {
  error: string;
  error_description?: string;
  message?: string;
}

// Generic API response structure (kept for backward compatibility)
export interface ApiResponse<T = any> {
  data?: T;
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
  meta?: any;
}

// Specific response types matching OpenAPI specification
export interface CampaignsResponse {
  data: Campaign[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface CampaignResponse {
  data: Campaign;
}

export interface CreateCampaignResponse {
  data: Campaign;
}

export interface PatchCampaignResponse {
  data: Campaign;
}

export interface DeleteCampaignResponse {
  data: {
    id: number;
    deleted: boolean;
  };
}

// Contact and List specific responses
export interface ContactsResponse {
  data: Contact[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface ContactResponse {
  data: Contact;
}

export interface CreateContactResponse {
  data: Contact;
}

export interface ListsResponse {
  data: ContactList[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface ListResponse {
  data: ContactList;
}

export interface CreateListResponse {
  data: ContactList;
}

// Sender specific responses
export interface SendersResponse {
  data: Sender[];
}

export interface SenderResponse {
  data: Sender;
}

export interface CreateSenderResponse {
  data: Sender;
}

// Template specific responses
export interface TemplatesResponse {
  data: Template[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface TemplateResponse {
  data: Template;
}

export interface CreateTemplateResponse {
  data: Template;
}

// Email API responses - Updated for v2 API (renamed from Transactional)
export interface EmailResponse {
  email: string;
  object: string;
  submitted: boolean;
  data: {
    id: string;
    status: 'submitted' | 'queued' | 'delivered' | 'rejected' | 'error' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'global_unsubscribe';
    metadata?: any;
  };
}

// Email status response for v2 API
export interface EmailStatusResponse {
  data: {
    id: string;
    status: 'submitted' | 'queued' | 'delivered' | 'rejected' | 'error' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'global_unsubscribe';
    email: string;
    to_name?: string;
    sender_id?: string;
    subject?: string;
    submitted_on?: string;
    delivered_on?: string;
    opened_on?: string;
    clicked_on?: string;
    bounced_on?: string;
    rejected_reason?: string;
    error_message?: string;
    metadata?: any;
    [key: string]: any;
  };
}

// Email API Logs Response
export interface EmailAPILogEntry {
  id: string;
  email_id: string;
  type: 'submitted' | 'queued' | 'delivered' | 'rejected' | 'error' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'global_unsubscribe';
  time: number;
  submitted_time?: number;
  provider?: string;
  metadata?: any;
  [key: string]: any;
}

export interface EmailAPILogsResponse {
  data: EmailAPILogEntry[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

// Email API Stats Response
export interface EmailAPIStatsEntry {
  time: number;
  submitted?: number;
  queued?: number;
  delivered?: number;
  rejected?: number;
  error?: number;
  open?: number;
  click?: number;
  bounce?: number;
  spam?: number;
  unsubscribe?: number;
  global_unsubscribe?: number;
  [key: string]: any;
}

export interface EmailAPIStatsResponse {
  data: EmailAPIStatsEntry[];
  interval?: 'hour' | 'day' | 'week' | 'month';
  start_time?: number;
  end_time?: number;
}


// Account responses
export interface AccountResponse {
  data: {
    id: number;
    name: string;
    email: string;
    type?: string;
    [key: string]: any;
  };
}

export interface PatchAccountResponse {
  data: {
    id: number;
    name: string;
    email: string;
    type?: string;
    [key: string]: any;
  };
}

// Sub-Account specific types and responses
export interface SubAccount {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  type?: 'organization' | 'individual';
  partner_account_id?: number;
  created_on?: string;
  updated_on?: string;
  verified?: boolean;
  company?: string;
  language?: string;
  timezone?: string;
  country?: string;
  phone?: string;
  website?: string;
  description?: string;
  [key: string]: any;
}

export interface SubAccountsResponse {
  data: SubAccount[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface SubAccountResponse {
  data: SubAccount;
}

export interface CreateSubAccountResponse {
  data: SubAccount;
}

export interface PatchSubAccountResponse {
  data: SubAccount;
}

export interface DeleteSubAccountResponse {
  data: {
    id: string;
    deleted: boolean;
  };
}

export interface SuspendSubAccountResponse {
  id: string;
  object: string;
  suspended: boolean;
  data: {
    id: string;
    status: 'suspended';
    suspended_on: string;
  };
}

export interface UnsuspendSubAccountResponse {
  id: string;
  object: string;
  unsuspended: boolean;
  data: {
    id: string;
    status: 'active';
    unsuspended_on: string;
  };
}

export interface ConfirmSubAccountResponse {
  data: SubAccount;
}

export interface ResendSubAccountVerificationResponse {
  object: string;
  verification_resent: boolean;
}

// Sub-Account input data interfaces
export interface CreateSubAccountData {
  name: string;
  email: string;
  password: string;
  company?: string | undefined;
  language?: string | undefined;
  timezone?: string | undefined;
  country?: string | undefined;
  phone?: string | undefined;
  website?: string | undefined;
  description?: string | undefined;
  [key: string]: any;
}

export interface UpdateSubAccountData {
  name?: string;
  email?: string;
  company?: string;
  language?: string;
  timezone?: string;
  country?: string;
  phone?: string;
  website?: string;
  description?: string;
  [key: string]: any;
}

export interface ConfirmSubAccountData {
  confirmation_code: string;
  password?: string | undefined;
}

export interface ResendVerificationEmailData {
  email: string;
}

export interface ConvertSubAccountData {
  migrate_owner?: boolean;
}

// Reports API types
export interface CampaignStats {
  sent_count?: number;
  delivered_count?: number;
  bounce_count?: number;
  hard_bounce_count?: number;
  soft_bounce_count?: number;
  open_count?: number;
  unique_open_count?: number;
  open_rate?: number;
  click_count?: number;
  unique_click_count?: number;
  click_rate?: number;
  unsubscribe_count?: number;
  unsubscribe_rate?: number;
  spam_complaint_count?: number;
  spam_complaint_rate?: number;
  delivery_rate?: number;
  [key: string]: any;
}

export interface CampaignLinkStats {
  link: string;
  unique: number;
  total: number;
  [key: string]: any;
}

export interface EmailStats {
  sent_count?: number;
  delivered_count?: number;
  bounce_count?: number;
  open_count?: number;
  click_count?: number;
  spam_complaint_count?: number;
  [key: string]: any;
}

export interface ListStats {
  subscriber_count?: number;
  active_count?: number;
  unsubscribed_count?: number;
  bounced_count?: number;
  growth_rate?: number;
  [key: string]: any;
}

export interface AccountStats {
  campaigns_sent?: number;
  emails_sent?: number;
  total_opens?: number;
  total_clicks?: number;
  total_bounces?: number;
  total_unsubscribes?: number;
  [key: string]: any;
}

export interface ActionStats {
  executions?: number;
  success_rate?: number;
  average_duration?: number;
  [key: string]: any;
}

export interface CampaignReportExport {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  created_on?: string;
  completed_on?: string;
  download_url?: string;
  [key: string]: any;
}

export interface SuppressedEmailsExport {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  description?: string;
  created_on?: string;
  completed_on?: string;
  download_url?: string;
  [key: string]: any;
}

// Report Response Types
export interface CampaignStatsResponse {
  data: CampaignStats;
}

export interface CampaignLinksStatsResponse {
  data: CampaignLinkStats[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface EmailStatsResponse {
  data: EmailStats;
}

export interface ListStatsResponse {
  data: ListStats;
}

export interface AccountStatsResponse {
  data: AccountStats;
}

export interface ActionStatsResponse {
  data: ActionStats;
}

export interface CampaignsReportsExportsResponse {
  data: CampaignReportExport[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface CreateCampaignReportExportResponse {
  data: CampaignReportExport;
}

export interface GetCampaignReportExportResponse {
  data: CampaignReportExport;
}

export interface DeleteCampaignReportExportResponse {
  data: {
    id: string;
    deleted: boolean;
  };
}

export interface DownloadCampaignReportExportResponse {
  data: {
    download_url: string;
    expires_at?: string;
  };
}

export interface SuppressedEmailsExportsResponse {
  data: SuppressedEmailsExport[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface CreateSuppressedEmailsExportResponse {
  data: SuppressedEmailsExport;
}

export interface GetSuppressedEmailsExportResponse {
  data: SuppressedEmailsExport;
}

export interface DeleteSuppressedEmailsExportResponse {
  data: {
    id: string;
    deleted: boolean;
  };
}

export interface DownloadSuppressedEmailsExportResponse {
  data: {
    download_url: string;
    expires_at?: string;
  };
}

// Report Input Data Types
export interface CreateCampaignReportExportData {
  campaign_ids?: string[];
  start_date?: string;
  end_date?: string;
  format?: 'csv' | 'xlsx';
  fields?: string[];
  [key: string]: any;
}

export interface ReportFilters {
  status?: string;
  progress?: string;
  [key: string]: any;
}

export interface SubAccountFilters {
  name?: string | undefined;
  status?: 'pending' | 'active' | 'suspended' | 'inactive' | undefined;
  type?: 'organization' | 'individual' | undefined;
  partner_account_id?: number | undefined;
}

// Error response types from OpenAPI spec
export interface HTTPBadRequestError {
  detail: string;
}

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationErrorDetail[];
}

export interface PaginationParams {
  page?: number | undefined;
  per_page?: number | undefined;
  with_count?: boolean | undefined;
}

export interface SortParams {
  sort?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
}

// Campaign related interfaces
export interface Campaign {
  id: number;
  name: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  status?: 'active' | 'delivering' | 'delivered' | 'archived' | 'deleted' | 'incomplete' | 'scheduled';
  list_id?: number;
  sender_id?: number;
  from_name?: string;
  reply_to?: string;
  created_on?: string;
  updated_on?: string;
  scheduled_for?: string;
  scheduled_on?: string;
  type?: string;
}

export interface CreateCampaignData {
  name: string;
  subject?: string;
  html_content?: string | undefined;
  text_content?: string | undefined;
  json_content?: any; // For BEEeditor JSON format
  list_id?: string | number;
  sender_id?: string | number;
  from_name?: string | undefined;
  reply_to?: string | undefined;
  template_id?: string | number;
  content_type?: 'html' | 'text' | 'bee' | 'custom';
}

export interface UpdateCampaignData {
  name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  from_name?: string;
  reply_to?: string;
}

export interface CampaignFilters {
  status?: string | undefined;
  name?: string | undefined;
  type?: string | undefined;
  list_id?: string | undefined;
}

// Contact and List interfaces
export interface Contact {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  subscribed_on?: string;
  custom_fields?: Record<string, any>;
}

export interface CreateContactData {
  email: string;
  first_name?: string;
  last_name?: string;
  list_id: string | number;
  custom_fields?: Record<string, any>;
}

export interface UpdateContactData {
  email?: string;
  first_name?: string;
  last_name?: string;
  custom_fields?: Record<string, any>;
}

export interface ContactList {
  id: number;
  name: string;
  description?: string;
  language?: string;
  created_on?: string;
  updated_on?: string;
}

export interface CreateListData {
  name: string;
  description?: string;
  language?: string;
}

export interface UpdateListData {
  name?: string;
  description?: string;
  language?: string;
}

// Sender interfaces
export interface Sender {
  id: number;
  name: string;
  email: string;
  language?: string;
  verified?: boolean;
  confirmed?: boolean;
  created_on?: string;
}

export interface CreateSenderData {
  name: string;
  email: string;
  language?: string;
}

export interface UpdateSenderData {
  name?: string;
  email?: string;
  language?: string;
}

// Template interfaces - Updated to match OpenAPI spec
export interface TemplateContent {
  type: 'html' | 'text' | 'bee' | 'custom';
  subject?: string;
  html?: string;
  text?: string;
  json?: any;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  created_on?: number;
  updated_on?: number;
  tags?: string[];
  is_owner?: boolean;
  sharing?: {
    shared: boolean;
    accounts?: any[];
    automatic?: boolean;
  };
  thumbnail?: string; // deprecated
  thumbnail_url?: string;
  content: TemplateContent;
  // Legacy fields for backward compatibility
  subject?: string;
  html_content?: string;
  text_content?: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  content?: TemplateContent;
  tags?: string[];
  account_id?: number;
  // Legacy fields for backward compatibility
  subject?: string;
  html_content?: string;
  text_content?: string;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  content?: TemplateContent;
  tags?: string[];
  account_id?: number;
  // Legacy fields for backward compatibility
  subject?: string;
  html_content?: string;
  text_content?: string;
}

// Email API v2 Enhanced Types
export type LogTypeV2 = 'all' | 'submitted' | 'queued' | 'delivered' | 'rejected' | 'error' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'global_unsubscribe';

export type EmailStatus = 'submitted' | 'queued' | 'delivered' | 'rejected' | 'error' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'global_unsubscribe';

export type IntervalEnum = 'hour' | 'day' | 'week' | 'month';

/**
 * Request schema for POST /v2/emails
 * Matches the complete v2 API specification
 */
export interface SubmitEmailRequest {
  sender: {
    id: string;
    name?: string;
  };
  content: {
    subject: string;
    html?: string;
    text?: string;
    template?: {
      id: number;
    };
    encoding?: string;
    custom_attributes?: Array<{
      name: string;
      value: string;
    }>;
    type?: 'marketing' | 'transactional';
    markup?: Record<string, any>;
  };
  email: string;
  list_id?: number;
  contact_id?: number;
  tags?: string[];
  tracking?: {
    opens?: boolean;
    clicks_html?: boolean;
    clicks_text?: boolean;
  };
  additional_headers?: Array<{
    name: string;
    value: string;
  }>;
  attachment?: Array<{
    filename: string;
    type: string;
    content: string;
  }>;
}

/**
 * Response schema for POST /v2/emails
 * Matches the SubmitEmailResponse schema from OpenAPI spec
 */
export interface SubmitEmailResponse {
  email: string;
  object: string;
  submitted: boolean;
  data: {
    id: string;
    status: EmailStatus;
    metadata?: any;
  };
}

/**
 * Response schema for GET /v2/emails/{email_id}
 * Matches the GetEmailResponse schema from OpenAPI spec
 */
export interface GetEmailResponse {
  data: {
    id: string;
    status: EmailStatus;
    email: string;
    to_name?: string;
    sender_id?: string;
    subject?: string;
    submitted_on?: string;
    delivered_on?: string;
    opened_on?: string;
    clicked_on?: string;
    bounced_on?: string;
    rejected_reason?: string;
    error_message?: string;
    metadata?: any;
    [key: string]: any;
  };
}

/**
 * Enhanced Email API Log Entry
 * Updated to match v2 API specification
 */
export interface EmailAPILogEntryV2 {
  id: string;
  email_id: string;
  type: LogTypeV2;
  time: number;
  submitted_time?: number;
  provider?: string;
  metadata?: any;
  additional_info?: any;
  link_id?: string;
  contact_id?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Enhanced Email API Logs Response
 */
export interface EmailAPILogsResponseV2 {
  data: EmailAPILogEntryV2[];
  pagination?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

/**
 * Enhanced Email API Stats Entry
 */
export interface EmailAPIStatsEntryV2 {
  time: number;
  submitted?: number;
  queued?: number;
  delivered?: number;
  rejected?: number;
  error?: number;
  open?: number;
  click?: number;
  bounce?: number;
  spam?: number;
  unsubscribe?: number;
  global_unsubscribe?: number;
  [key: string]: any;
}

/**
 * Enhanced Email API Stats Response
 */
export interface EmailAPIStatsResponseV2 {
  data: EmailAPIStatsEntryV2[];
  interval?: IntervalEnum;
  start_time?: number;
  end_time?: number;
}

/**
 * Filter condition for recursive filtering
 */
export interface FilterCondition {
  operator: 'and' | 'or' | 'not' | 'is';
  value: string | FilterCondition[];
}

/**
 * Email log analysis result
 */
export interface EmailLogAnalysis {
  totalEvents: number;
  eventBreakdown: Record<string, number>;
  deliveryRate: number;
  engagementRate: number;
  issueRate: number;
  recommendations: string[];
}

/**
 * Smart filter types for common use cases
 */
export type SmartFilterType = 'engagement' | 'critical_issues' | 'temporary_failures' | 'list_cleanup';

/**
 * Email API Error with additional context
 */
export interface EmailAPIErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
}

// Email API interfaces - Updated for v2 API to match complete specification
export interface EmailData {
  // Required fields
  email: string; // Recipient email
  sender: {
    id: string;
    name?: string;
  };
  content: {
    subject: string;
    html?: string;
    text?: string;
    template?: {
      id: number;
    };
    encoding?: string;
    custom_attributes?: Array<{
      name: string;
      value: string;
    }>;
    type?: 'marketing' | 'transactional';
    markup?: Record<string, any>;
  };
  
  // Optional fields
  list_id?: number;
  contact_id?: number;
  tags?: string[];
  tracking?: {
    opens?: boolean;
    clicks_html?: boolean;
    clicks_text?: boolean;
  };
  additional_headers?: Array<{
    name: string;
    value: string;
  }>;
  attachment?: Array<{
    filename: string;
    type: string;
    content: string;
  }>;
}



// Response type aliases (schema-based)
export type EmailResponseType = SubmitEmailResponse;
export type EmailStatusResponseType = GetEmailResponse;



// Unified log and stats responses
export type EmailAPILogsResponseUnified = EmailAPILogsResponse;
export type EmailAPIStatsResponseUnified = EmailStatsResponse;

// Specific method parameter interfaces for strict type checking
export interface GetCampaignsParams extends PaginationParams, SortParams, CampaignFilters {
  account_id?: number | undefined;
}

export interface ListSubAccountsParams {
  partner_account_id?: number | undefined;
  recursive?: boolean | undefined;
  filters?: SubAccountFilters;
  pagination?: PaginationParams;
  sort?: SortParams;
}

export interface CreateSubAccountOptions {
  partner_account_id?: number | undefined;
  skip_verification?: boolean | undefined;
}

export interface WorkflowActionLogsParams {
  account_id?: number | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
  with_count?: boolean | undefined;
  start_time?: number | undefined;
  end_time?: number | undefined;
  filter?: string | undefined;
}

export interface WorkflowLogsParams {
  account_id?: number | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
  with_count?: boolean | undefined;
  sort?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
  start_time?: number | undefined;
  end_time?: number | undefined;
  filter?: string | undefined;
}

export interface TransactionalEmailLogsParams {
  log_type?: string | undefined;
  account_id?: number | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
  with_count?: boolean | undefined;
  sort?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
  start_time?: number | undefined;
  end_time?: number | undefined;
  filter?: string | undefined;
  email_id?: string | undefined;
  sender_id?: string | undefined;
  status?: string | undefined;
}

export interface ListLogsParams {
  account_id?: number | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
  with_count?: boolean | undefined;
  start_time?: number | undefined;
  end_time?: number | undefined;
  filter?: string | undefined;
}

export interface DebugLogsAccessParams {
  campaign_id?: string | undefined;
  workflow_id?: string | undefined;
}

// Campaign request types matching exact API specification
export interface CreateCampaignRequest {
  name: string;
  // Audience fields
  list_id?: string | number;
  segment_id?: string | number;
  // Sender fields
  sender_id?: string | number;
  from_name?: string;
  reply_to?: string;
  // Content fields
  subject?: string;
  html_content?: string;
  text_content?: string;
  json_content?: any; // For BEEeditor JSON format
  template_id?: string | number;
  blueprint_id?: string | number;
  content_type?: 'html' | 'text' | 'bee' | 'custom';
  encoding?: string;
  default_unsubscribe_link?: boolean;
  // Tracking fields
  tracking?: {
    opens?: boolean;
    clicks_html?: boolean;
    clicks_text?: boolean;
    additional_params?: string;
  };
}

export interface UpdateCampaignRequest {
  name?: string;
  // Sender fields
  sender_id?: string | number;
  from_name?: string;
  reply_to?: string;
  // Content fields
  subject?: string;
  html_content?: string;
  text_content?: string;
  json_content?: any; // For BEEeditor JSON format
  template_id?: string | number;
  blueprint_id?: string | number;
  content_type?: 'html' | 'text' | 'bee' | 'custom';
  encoding?: string;
  default_unsubscribe_link?: boolean;
  // Tracking fields
  tracking?: {
    opens?: boolean;
    clicks_html?: boolean;
    clicks_text?: boolean;
    additional_params?: string;
  };
}

export interface ScheduleCampaignRequest {
  scheduled_for?: string;
}

export interface SendTestEmailRequest {
  emails: string[];
}

// Missing parameter types for Email API
export interface EmailLogsParams {
  email_id?: string;
  start_time?: number;
  end_time?: number;
  log_type?: 'all' | 'submitted' | 'queued' | 'delivered' | 'rejected' | 'error' | 'open' | 'click' | 'bounce' | 'spam' | 'unsubscribe' | 'global_unsubscribe';
  page?: number;
  per_page?: number;
  sort?: string;
  iso_time?: boolean;
  providers?: string;
  tags?: string;
}

export interface EmailStatsParams {
  start_time?: number;
  end_time?: number;
  interval?: IntervalEnum;
  iso_time?: boolean;
  providers?: string;
  tags?: string;
}




