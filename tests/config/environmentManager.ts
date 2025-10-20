import * as fs from 'fs';
import * as path from 'path';

export type Environment = 'local' | 'qa' | 'staging' | 'production';

interface EnvironmentConfig {
  environment: Environment;
  baseURL: string;
  apiTimeout: number;
  retryCount: number;
  headless: boolean;
  slowMo: number;
  testUserEmailPrefix: string;
  testUserPassword: string;
  reportTitle: string;
  slackChannel: string;
  enableScreenshots: boolean;
  enableVideos: boolean;
  enableTraces: boolean;
}

/**
 * 🌍 Environment Manager
 * 
 * Handles loading, validation, and switching between different environments
 * Supports: local, qa, staging, production
 */
class EnvironmentManager {
  private currentEnvironment: Environment = 'staging';
  private configCache: Map<Environment, EnvironmentConfig> = new Map();

  /**
   * Initialize environment from ENV variable or default to staging
   */
  initialize(): void {
    const env = (process.env.TEST_ENV || process.env.ENVIRONMENT || 'staging').toLowerCase();
    
    if (!['local', 'qa', 'staging', 'production'].includes(env)) {
      console.warn(`⚠️  Invalid environment: ${env}. Defaulting to staging`);
      this.currentEnvironment = 'staging';
    } else {
      this.currentEnvironment = env as Environment;
    }

    console.log(`✓ Environment initialized: ${this.currentEnvironment}`);
  }

  /**
   * Get configuration for an environment
   */
  getConfig(env?: Environment): EnvironmentConfig {
    const environment = env || this.currentEnvironment;

    // Return cached config if available
    if (this.configCache.has(environment)) {
      return this.configCache.get(environment)!;
    }

    // Load from .env file
    const config = this.loadEnvironmentFile(environment);
    this.configCache.set(environment, config);
    
    return config;
  }

  /**
   * Load environment from .env file
   */
  private loadEnvironmentFile(environment: Environment): EnvironmentConfig {
    const envPath = path.join(__dirname, '../../..', 'environments', `${environment}.env`);

    if (!fs.existsSync(envPath)) {
      throw new Error(`❌ Environment file not found: ${envPath}`);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = this.parseEnvFile(envContent);

    // Validate required variables
    const required = ['BASE_URL', 'API_TIMEOUT', 'TEST_USER_EMAIL_PREFIX', 'TEST_USER_PASSWORD'];
    for (const key of required) {
      if (!envVars[key]) {
        throw new Error(`❌ Missing required env variable: ${key} in ${environment}.env`);
      }
    }

    return {
      environment,
      baseURL: envVars.BASE_URL,
      apiTimeout: parseInt(envVars.API_TIMEOUT || '30000', 10),
      retryCount: parseInt(envVars.RETRY_COUNT || '1', 10),
      headless: envVars.HEADLESS !== 'false',
      slowMo: parseInt(envVars.SLOW_MO || '0', 10),
      testUserEmailPrefix: envVars.TEST_USER_EMAIL_PREFIX,
      testUserPassword: envVars.TEST_USER_PASSWORD,
      reportTitle: envVars.REPORT_TITLE || `${environment} Test Results`,
      slackChannel: envVars.SLACK_CHANNEL || '#tests',
      enableScreenshots: envVars.ENABLE_SCREENSHOTS === 'true',
      enableVideos: envVars.ENABLE_VIDEOS === 'true',
      enableTraces: envVars.ENABLE_TRACES === 'true',
    };
  }

  /**
   * Parse .env file content
   */
  private parseEnvFile(content: string): Record<string, string> {
    const vars: Record<string, string> = {};

    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();

      if (key) {
        vars[key] = value;
      }
    });

    return vars;
  }

  /**
   * Set current environment
   */
  setEnvironment(environment: Environment): void {
    if (!['local', 'qa', 'staging', 'production'].includes(environment)) {
      throw new Error(`❌ Invalid environment: ${environment}`);
    }
    this.currentEnvironment = environment;
    console.log(`✓ Environment switched to: ${environment}`);
  }

  /**
   * Get current environment name
   */
  getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironment(environment?: Environment): Promise<boolean> {
    const env = environment || this.currentEnvironment;
    const config = this.getConfig(env);

    console.log(`\n🔍 Validating ${env} environment...`);
    console.log(`   Base URL: ${config.baseURL}`);
    console.log(`   Timeout: ${config.apiTimeout}ms`);
    console.log(`   Retries: ${config.retryCount}`);
    console.log(`   Headless: ${config.headless}`);
    console.log(`   ✓ Configuration valid`);

    return true;
  }

  /**
   * Log environment info
   */
  logEnvironmentInfo(): void {
    const config = this.getConfig();
    
    console.log('\n📋 Environment Configuration:');
    console.log('═══════════════════════════════════════');
    console.log(`Environment:     ${config.environment.toUpperCase()}`);
    console.log(`Base URL:        ${config.baseURL}`);
    console.log(`API Timeout:     ${config.apiTimeout}ms`);
    console.log(`Retries:         ${config.retryCount}`);
    console.log(`Headless:        ${config.headless}`);
    console.log(`Screenshots:     ${config.enableScreenshots}`);
    console.log(`Videos:          ${config.enableVideos}`);
    console.log(`Traces:          ${config.enableTraces}`);
    console.log('═══════════════════════════════════════\n');
  }
}

// Export singleton instance
export const environmentManager = new EnvironmentManager();

// Initialize on import
environmentManager.initialize();

// Export convenience functions
export function getEnvironmentConfig(env?: Environment): EnvironmentConfig {
  return environmentManager.getConfig(env);
}

export function setEnvironment(environment: Environment): void {
  environmentManager.setEnvironment(environment);
}

export function getCurrentEnvironment(): Environment {
  return environmentManager.getCurrentEnvironment();
}
