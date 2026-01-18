/**
 * Environment Variables Validation and Access
 * Validates required environment variables and provides type-safe access
 */

interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  nodeEnv: string;
  isProd: boolean;
  isDev: boolean;
}

/**
 * Required environment variables
 */
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
] as const;

/**
 * Optional environment variables with defaults
 */
const optionalEnvVars = {
  NODE_ENV: 'development',
} as const;

/**
 * Validate that all required environment variables are set
 */
function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missing.join('\n')}`;
    console.error(errorMessage);

    // In development, show helpful error
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ef4444;
        color: white;
        padding: 1rem;
        z-index: 99999;
        font-family: monospace;
        font-size: 14px;
      `;
      errorDiv.innerHTML = `
        <strong>⚠️ Environment Configuration Error</strong><br/>
        Missing required environment variables:<br/>
        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
          ${missing.map(v => `<li>${v}</li>`).join('')}
        </ul>
        <small>Create or update .env.local file in the project root.</small>
      `;
      document.body.appendChild(errorDiv);
    }

    throw new Error(errorMessage);
  }
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Validate and create environment configuration
 */
function createEnvConfig(): EnvironmentConfig {
  // In Next.js, NEXT_PUBLIC_* variables are replaced by webpack at build time
  // We need to access them directly as string literals for webpack to replace them
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
  const NODE_ENV_VAR = process.env.NODE_ENV || 'development';

  // Only validate if values are actually missing
  if (!API_URL || !WS_URL) {
    const missing = [];
    if (!API_URL) missing.push('NEXT_PUBLIC_API_URL');
    if (!WS_URL) missing.push('NEXT_PUBLIC_WS_URL');

    const errorMessage = `Missing required environment variables:\n${missing.join('\n')}`;
    console.error(errorMessage);

    // In development, show helpful error
    if (typeof window !== 'undefined' && NODE_ENV_VAR === 'development') {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ef4444;
        color: white;
        padding: 1rem;
        z-index: 99999;
        font-family: monospace;
        font-size: 14px;
      `;
      errorDiv.innerHTML = `
        <strong>⚠️ Environment Configuration Error</strong><br/>
        Missing required environment variables:<br/>
        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
          ${missing.map(v => `<li>${v}</li>`).join('')}
        </ul>
        <small>Create or update .env.local file in the project root.</small>
      `;
      document.body.appendChild(errorDiv);
    }

    throw new Error(errorMessage);
  }

  return {
    apiUrl: API_URL,
    wsUrl: WS_URL,
    nodeEnv: NODE_ENV_VAR,
    isProd: NODE_ENV_VAR === 'production',
    isDev: NODE_ENV_VAR === 'development',
  };
}

/**
 * Validated and typed environment configuration
 */
export const env: EnvironmentConfig = createEnvConfig();

/**
 * Check if environment is properly configured
 */
export function isEnvConfigured(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvInfo() {
  return {
    apiUrl: env.apiUrl,
    wsUrl: env.wsUrl,
    nodeEnv: env.nodeEnv,
    isProd: env.isProd,
    isDev: env.isDev,
    allEnvVars: Object.keys(process.env).filter(key =>
      key.startsWith('NEXT_PUBLIC_')
    ),
  };
}

// Log environment configuration in development
if (env.isDev && typeof window !== 'undefined') {
  console.log('🔧 Environment Configuration:', {
    apiUrl: env.apiUrl,
    wsUrl: env.wsUrl,
    nodeEnv: env.nodeEnv,
  });
}
