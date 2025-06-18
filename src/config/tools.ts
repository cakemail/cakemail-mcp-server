import { healthTools } from './health-tools.js';
import { senderTools } from './sender-tools.js';
import { campaignTools } from './campaign-tools.js';
import { subAccountTools } from './sub-account-tools.js';
import { emailTools } from './email-tools.js';
import { accountTools } from './account-tools.js';
import { reportTools } from './report-tools.js';
import { logTools } from './log-tools.js';
import { listTools } from './list-tools.js';
import { templateTools } from './template-tools.js';

export const allTools = [
  ...healthTools,
  ...senderTools,
  ...campaignTools,
  ...emailTools,
  ...logTools,
  ...reportTools,
  ...accountTools,
  // Sub-account tools are now fully implemented
  ...subAccountTools,
  // List management tools
  ...listTools,
  // Template management tools
  ...templateTools,
];

export {
  healthTools,
  senderTools,
  campaignTools,
  subAccountTools,
  emailTools,
  accountTools,
  reportTools,
  logTools,
  listTools,
  templateTools
};
