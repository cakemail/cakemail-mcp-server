#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

import { CakemailAPI } from './cakemail-api.js';
import { allTools } from './config/tools.js';
import { handleToolCall } from './handlers/index.js';
import logger from './utils/logger.js';

const server = new Server(
  {
    name: 'cakemail-mcp-server',
    version: '1.9.0', // List management integration
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize API
const email = process.env.CAKEMAIL_EMAIL;
const password = process.env.CAKEMAIL_PASSWORD;

if (!email || !password) {
  console.error('CAKEMAIL_EMAIL and CAKEMAIL_PASSWORD environment variables are required');
  process.exit(1);
}

const api = new CakemailAPI({ 
  email, 
  password,
  circuitBreaker: { 
    enabled: true,
    failureThreshold: 5,
    resetTimeout: 60000
  }
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await handleToolCall(request, api);
});

// Start the server
async function main() {
  logger.info('Logger test: MCP server starting');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Cakemail MCP Server running on stdio');
}

main().catch((error) => {
  logger.error({ err: error }, 'Server failed to start');
  process.exit(1);
});
