// ABOUTME: Reads the Cakemail credential from the environment: a PAT first, else email and password.
// ABOUTME: Keeps the account password out of agent configs while existing password configs keep working.

export type CakemailCredentials =
  | { apiKey: string }
  | { email: string; password: string };

export function resolveCredentials(env: Record<string, string | undefined>): CakemailCredentials {
  const apiKey = env.CAKEMAIL_API_KEY;
  if (apiKey) {
    return { apiKey };
  }

  const email = env.CAKEMAIL_EMAIL;
  const password = env.CAKEMAIL_PASSWORD;
  if (email && password) {
    return { email, password };
  }

  throw new Error(
    'CAKEMAIL_API_KEY is required: set it to a Personal Access Token (ck_pat_…) created with POST /users/self/pats'
  );
}
