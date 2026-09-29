import { 
  CakemailError,
  CakemailAuthenticationError,
  CakemailValidationError,
  CakemailBadRequestError,
  CakemailNotFoundError,
  CakemailRateLimitError
} from '../cakemail-api.js';
import logger from './logger.js';

export function getErrorMessage(error: unknown): string {
  if (error instanceof CakemailError) {
    return `${error.name}: ${error.message} (Status: ${error.statusCode})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Enhanced error handler for more detailed error responses
export function handleCakemailError(error: unknown) {
  // Always log errors to file
  if (error instanceof Error) {
    logger.error({ err: error, stack: error.stack }, 'Cakemail error caught');
  } else {
    logger.error({ err: error }, 'Unknown error caught');
  }
  if (error instanceof CakemailValidationError) {
    const fieldErrors = error.validationErrors.map(err => {
      const field = err.loc.join('.');
      return `${field}: ${err.msg}`;
    }).join(', ');
    
    return {
      content: [{
        type: 'text',
        text: `❌ **Validation Error**\n\nThe following fields have validation issues:\n${fieldErrors}\n\n**Fix these issues and try again.**`
      }],
      isError: true
    };
  }
  
  if (error instanceof CakemailAuthenticationError) {
    return {
      content: [{
        type: 'text',
        text: `🔐 **Authentication Error**\n\n${error.message}\n\n**Please check your CAKEMAIL_API_KEY environment variable (a Personal Access Token, ck_pat_…).**`
      }],
      isError: true
    };
  }
  
  if (error instanceof CakemailBadRequestError) {
    return {
      content: [{
        type: 'text',
        text: `❌ **Bad Request**\n\n${error.detail}\n\n**Please check your request parameters and try again.**`
      }],
      isError: true
    };
  }
  
  if (error instanceof CakemailNotFoundError) {
    return {
      content: [{
        type: 'text',
        text: `🔍 **Not Found**\n\n${error.message}\n\n**The requested resource could not be found. Please verify the ID and try again.**`
      }],
      isError: true
    };
  }
  
  if (error instanceof CakemailRateLimitError) {
    const retryMessage = error.retryAfter 
      ? `Please wait ${error.retryAfter} seconds before trying again.`
      : 'Please wait a moment before trying again.';
      
    return {
      content: [{
        type: 'text',
        text: `⏱️ **Rate Limit Exceeded**\n\n${error.message}\n\n${retryMessage}`
      }],
      isError: true
    };
  }
  
  if (error instanceof CakemailError) {
    return {
      content: [{
        type: 'text',
        text: `❌ **API Error (${error.statusCode})**\n\n${error.message}`
      }],
      isError: true
    };
  }
  
  // Fallback for unknown errors
  return {
    content: [{
      type: 'text',
      text: `❌ **Error**\n\n${getErrorMessage(error)}`
    }],
    isError: true
  };
}
