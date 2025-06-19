// Sender API operations

import { BaseApiClient } from './base-client.js';
import { 
  CreateSenderData, 
  UpdateSenderData,
  SendersResponse,
  SenderResponse,
  CreateSenderResponse
} from '../types/cakemail-types.js';

export class SenderApi extends BaseApiClient {

  async getSenders(): Promise<SendersResponse> {
    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';
    
    return this.makeRequest(`/brands/default/senders${query}`);
  }

  async createSender(data: CreateSenderData): Promise<CreateSenderResponse> {
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    const senderData = {
      name: data.name,
      email: data.email,
      language: data.language || 'en_US',
    };

    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';

    return this.makeRequest(`/brands/default/senders${query}`, {
      method: 'POST',
      body: JSON.stringify(senderData)
    });
  }

  async getSender(senderId: string): Promise<SenderResponse> {
    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';
    
    return this.makeRequest(`/brands/default/senders/${senderId}${query}`);
  }

  async updateSender(senderId: string, data: UpdateSenderData): Promise<SenderResponse> {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    const updateData: Record<string, any> = {
      name: data.name,
      email: data.email,
      language: data.language,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';

    return this.makeRequest(`/brands/default/senders/${senderId}${query}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  async deleteSender(senderId: string): Promise<{ success: true; status: number }> {
    const accountId = await this.getCurrentAccountId();
    const query = accountId ? `?account_id=${accountId}` : '';
    
    return this.makeRequest(`/brands/default/senders/${senderId}${query}`, { 
      method: 'DELETE' 
    });
  }

  // Helper methods
  async findSenderByEmail(email: string): Promise<any | null> {
    const response = await this.getSenders();
    const sender = response.data?.find(s => s.email === email);
    return sender || null;
  }

  async ensureSenderExists(email: string, name: string, language?: string): Promise<any> {
    // Check if sender already exists
    const existing = await this.findSenderByEmail(email);
    if (existing) {
      return existing;
    }

    // Create new sender
    const createData: CreateSenderData = { email, name };
    if (language !== undefined) {
      createData.language = language;
    }
    const response = await this.createSender(createData);
    return response.data;
  }

  async getDefaultSender(): Promise<any | null> {
    const response = await this.getSenders();
    if (!response.data || response.data.length === 0) {
      return null;
    }

    // Look for a sender marked as default
    const defaultSender = response.data.find(s => (s as any).is_default === true);
    if (defaultSender) {
      return defaultSender;
    }

    // Return the first sender if no default is set
    return response.data[0];
  }
}
