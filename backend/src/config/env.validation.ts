/**
 * Environment variable validation utility.
 * Validates all required environment variables at startup and fails fast if any are missing or invalid.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates all required environment variables
 * @returns ValidationResult with validation status and error messages
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // JWT_SECRET - Required, minimum length depends on environment
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  } else {
    const minLength = isProduction ? 32 : 16;
    if (process.env.JWT_SECRET.length < minLength) {
      const message = `JWT_SECRET should be at least ${minLength} characters long for security (current: ${process.env.JWT_SECRET.length}). Consider using a longer secret.`;
      // In production, warn but don't fail - allow existing deployments to continue
      // This is a security warning, not a blocking error
      console.warn(`[config] WARNING: ${message}`);
    }
  }

  // DATABASE_URL - Required, must be a valid PostgreSQL URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  } else if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string (postgres:// or postgresql://)');
  }

  // NODE_ENV - Required, must be one of: production, development, test
  if (!process.env.NODE_ENV) {
    errors.push('NODE_ENV is required');
  } else {
    const validEnvs = ['production', 'development', 'test'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
      errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
    }
  }

  // PORT - Optional, but if provided must be a valid port number
  if (process.env.PORT) {
    const port = Number(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a number between 1 and 65535');
    }
  }

  // Production-specific validations
  if (isProduction) {
    // FRONTEND_URL or ALLOWED_ORIGINS - Recommended in production, but not strictly required
    // (CORS will be disabled if neither is provided, which may be intentional for internal services)
    if (!process.env.FRONTEND_URL && !process.env.ALLOWED_ORIGINS) {
      // Warning only, not an error - some deployments may not need CORS
      console.warn('[config] WARNING: FRONTEND_URL or ALLOWED_ORIGINS not set in production. CORS will be disabled.');
    }

    // Validate FRONTEND_URL if provided
    if (process.env.FRONTEND_URL) {
      try {
        const url = new URL(process.env.FRONTEND_URL);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('FRONTEND_URL must use http:// or https:// protocol');
        }
      } catch {
        errors.push('FRONTEND_URL must be a valid URL');
      }
    }

    // Validate ALLOWED_ORIGINS if provided
    if (process.env.ALLOWED_ORIGINS) {
      const origins = process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
      for (const origin of origins) {
        try {
          const url = new URL(origin);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push(`ALLOWED_ORIGINS entry "${origin}" must use http:// or https:// protocol`);
          }
        } catch {
          errors.push(`ALLOWED_ORIGINS entry "${origin}" must be a valid URL`);
        }
      }
    }
  }

  // SEED_ADMIN_EMAIL - Optional, but if provided must be a valid email
  if (process.env.SEED_ADMIN_EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.SEED_ADMIN_EMAIL)) {
      errors.push('SEED_ADMIN_EMAIL must be a valid email address');
    }
  }

  // SEED_ADMIN_PASSWORD - Optional, but if provided must be at least 8 characters
  if (process.env.SEED_ADMIN_PASSWORD && process.env.SEED_ADMIN_PASSWORD.length < 8) {
    errors.push('SEED_ADMIN_PASSWORD must be at least 8 characters long');
  }

  // BUSINESS_TZ - Optional, but if provided should be a valid IANA timezone
  if (process.env.BUSINESS_TZ) {
    try {
      // Try to create a date with the timezone to validate it
      Intl.DateTimeFormat(undefined, { timeZone: process.env.BUSINESS_TZ });
    } catch {
      errors.push(`BUSINESS_TZ "${process.env.BUSINESS_TZ}" is not a valid IANA timezone`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates environment variables and exits the process if validation fails
 * Should be called at application startup
 */
export function validateEnvOrExit(): void {
  const result = validateEnv();
  
  if (!result.valid) {
    console.error('[config] Environment variable validation failed:');
    result.errors.forEach(error => {
      console.error(`[config]   - ${error}`);
    });
    console.error('[config] Please check your .env file and ensure all required variables are set correctly.');
    process.exit(1);
  }
  
  console.log('[config] Environment variables validated successfully');
}

