// Transactional Email API operations - Updated for v2 API

import { BaseApiClient } from './base-client.js';
import { 
  TransactionalEmailData,
  TransactionalEmailResponse
} from '../types/cakemail-types.js';

export class TransactionalApi extends BaseApiClient {

  async sendTransactionalEmail(data: TransactionalEmailData): Promise<TransactionalEmailResponse> {
    if (!this.isValidEmail(data.to_email)) {
      throw new Error('Invalid recipient email format');
    }

    // Structure the email data according to Cakemail v2 API specification
    // Based on official docs at https://cakemail.dev/docs/getting-started-with-the-email-api
    const emailData: any = {
      email: data.to_email,
      sender: {
        id: String(data.sender_id) // Keep as string for v2 API
      },
      content: {
        type: "transactional", // Required for v2 API
        subject: data.subject,
        encoding: 'utf-8'
      }
    };

    // Add recipient name if provided
    if (data.to_name) {
      emailData.name = data.to_name;
    }

    // Add HTML content if provided
    if (data.html_content) {
      emailData.content.html = data.html_content;
    }

    // Add text content if provided
    if (data.text_content) {
      emailData.content.text = data.text_content;
    }

    // Add template if provided instead of direct content
    if (data.template_id) {
      // When using template, structure changes
      emailData.content = {
        type: "transactional",
        template: {
          id: String(data.template_id)
        },
        encoding: 'utf-8'
      };
      
      // Subject can be overridden even with template
      if (data.subject) {
        emailData.content.subject = data.subject;
      }
    }

    // v2 API requires list_id - we need to handle this
    // For transactional emails, we might need to get a default list or create one
    if (!data.list_id) {
      // Try to get a default list for transactional emails
      try {
        const lists = await this.makeRequest('/lists?per_page=1');
        if (lists.data && lists.data.length > 0) {
          emailData.list_id = String(lists.data[0].id);
          
          if (this.debugMode) {
            console.log(`[Transactional API] Using default list ID: ${emailData.list_id}`);
          }
        } else {
          throw new Error('No contact lists available. A list_id is required for v2 API. Please create a contact list first.');
        }
      } catch (error: any) {
        throw new Error(`Failed to get default list for transactional email: ${error.message}. Please provide a list_id parameter.`);
      }
    } else {
      emailData.list_id = String(data.list_id);
    }

    if (this.debugMode) {
      console.log('[Transactional API] v2 Email data:', JSON.stringify(emailData, null, 2));
    }

    // Account ID is typically not needed for v2/emails endpoint
    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';

    return this.makeRequest(`/v2/emails${query}`, {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
  }

  // Helper method to get email status using v2 API
  async getEmailStatus(emailId: string): Promise<any> {
    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';
    
    return this.makeRequest(`/v2/emails/${emailId}${query}`);
  }
}
