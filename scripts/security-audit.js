/**
 * Security Audit Script for AI Amazona
 * This script checks for common security issues in the codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Configuration
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const ENV_FILE_PATH = path.join(WORKSPACE_ROOT, '.env');
const SECURITY_HEADERS = [
  'X-XSS-Protection',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'X-Frame-Options',
  'Strict-Transport-Security',
  'Content-Security-Policy'
];

// Result object
const auditResults = {
  timestamp: new Date().toISOString(),
  npmAudit: {},
  environmentChecks: {
    envFileExists: false,
    envExampleExists: false,
    envInGitignore: false
  },
  securityHeaders: {},
  apiSecurity: {
    csrfProtection: false,
    rateLimiting: false,
    inputValidation: false,
    secureCookies: false
  },
  authSecurity: {
    passwordHashing: false,
    secureJWT: false,
    mfaSupport: false
  },
  dataSecurity: {
    sanitization: false,
    sqlInjectionPrevention: false
  },
  vulnerableDependencies: [],
  sensitiveExposure: [],
  miscIssues: []
};

// Run npm audit
function runNpmAudit() {
  console.log('Running npm audit...');
  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    auditResults.npmAudit = JSON.parse(auditOutput);
    console.log('npm audit completed.');
  } catch (error) {
    if (error.stdout) {
      try {
        auditResults.npmAudit = JSON.parse(error.stdout);
        console.log('npm audit completed with issues.');
      } catch (parseError) {
        console.error('Failed to parse npm audit output:', parseError);
        auditResults.npmAudit = { error: 'Failed to parse npm audit output' };
      }
    } else {
      console.error('Failed to run npm audit:', error);
      auditResults.npmAudit = { error: 'Failed to run npm audit' };
    }
  }
}

// Check environment files
function checkEnvironmentFiles() {
  console.log('Checking environment files...');
  
  // Check if .env file exists
  auditResults.environmentChecks.envFileExists = fs.existsSync(ENV_FILE_PATH);
  
  // Check if .env.example file exists
  auditResults.environmentChecks.envExampleExists = fs.existsSync(path.join(WORKSPACE_ROOT, '.env.example'));
  
  // Check if .env is in .gitignore
  try {
    const gitignore = fs.readFileSync(path.join(WORKSPACE_ROOT, '.gitignore'), 'utf8');
    auditResults.environmentChecks.envInGitignore = gitignore.includes('.env');
  } catch (error) {
    console.error('Error checking .gitignore:', error);
  }
  
  // Check for sensitive data in .env file
  if (auditResults.environmentChecks.envFileExists) {
    try {
      const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      const envVars = dotenv.parse(envContent);
      
      // Define sensitive key patterns
      const sensitiveKeyPatterns = [
        'SECRET',
        'KEY',
        'PASSWORD',
        'TOKEN',
        'AUTH',
        'CREDENTIAL',
        'STRIPE',
        'SENDGRID',
        'TWILIO',
        'AWS'
      ];
      
      // Check for sensitive keys
      Object.keys(envVars).forEach(key => {
        const value = envVars[key];
        if (value && value.length > 0) {
          const isSensitive = sensitiveKeyPatterns.some(pattern => 
            key.toUpperCase().includes(pattern)
          );
          
          if (isSensitive) {
            auditResults.sensitiveExposure.push({
              file: '.env',
              key: key,
              isMasked: value === '[REDACTED]' || value.includes('*****')
            });
          }
        }
      });
    } catch (error) {
      console.error('Error reading .env file:', error);
    }
  }
  
  console.log('Environment file check completed.');
}

// Check for security headers in middleware.ts
function checkSecurityHeaders() {
  console.log('Checking security headers...');
  
  const middlewarePath = path.join(WORKSPACE_ROOT, 'middleware.ts');
  
  if (fs.existsSync(middlewarePath)) {
    try {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      
      SECURITY_HEADERS.forEach(header => {
        auditResults.securityHeaders[header] = middlewareContent.includes(header);
      });
    } catch (error) {
      console.error('Error reading middleware file:', error);
    }
  } else {
    console.log('middleware.ts not found');
    SECURITY_HEADERS.forEach(header => {
      auditResults.securityHeaders[header] = false;
    });
  }
  
  console.log('Security header check completed.');
}

// Check for CSRF protection
function checkCsrfProtection() {
  console.log('Checking CSRF protection...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check if any CSRF packages are installed
    auditResults.apiSecurity.csrfProtection = Object.keys(dependencies).some(dep => 
      dep === 'csrf' || dep === 'csurf' || dep.includes('csrf')
    );
    
    // Check code for CSRF token usage
    const apiDirPath = path.join(WORKSPACE_ROOT, 'app', 'api');
    if (fs.existsSync(apiDirPath)) {
      const apiFiles = walkDirectory(apiDirPath);
      auditResults.apiSecurity.csrfProtection = auditResults.apiSecurity.csrfProtection || 
        apiFiles.some(file => {
          const content = fs.readFileSync(file, 'utf8');
          return content.includes('csrf') || content.includes('CSRF') || content.includes('xsrf') || content.includes('XSRF');
        });
    }
  } catch (error) {
    console.error('Error checking CSRF protection:', error);
  }
  
  console.log('CSRF protection check completed.');
}

// Check for rate limiting
function checkRateLimiting() {
  console.log('Checking rate limiting...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check if any rate limiting packages are installed
    auditResults.apiSecurity.rateLimiting = Object.keys(dependencies).some(dep => 
      dep.includes('rate-limit') || dep.includes('ratelimit')
    );
    
    // Check for rate limiting implementation in code
    const middlewarePath = path.join(WORKSPACE_ROOT, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      auditResults.apiSecurity.rateLimiting = auditResults.apiSecurity.rateLimiting || 
        middlewareContent.includes('rate') && middlewareContent.includes('limit');
    }
  } catch (error) {
    console.error('Error checking rate limiting:', error);
  }
  
  console.log('Rate limiting check completed.');
}

// Check for input validation
function checkInputValidation() {
  console.log('Checking input validation...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check if validation packages are installed
    auditResults.apiSecurity.inputValidation = Object.keys(dependencies).some(dep => 
      dep === 'zod' || dep === 'joi' || dep === 'yup' || dep.includes('validator')
    );
    
    // Check for input validation in code
    const apiDirPath = path.join(WORKSPACE_ROOT, 'app', 'api');
    if (fs.existsSync(apiDirPath)) {
      const apiFiles = walkDirectory(apiDirPath);
      let validationCount = 0;
      
      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (
          content.includes('validate') || 
          content.includes('schema') || 
          content.includes('z.object') || 
          content.includes('sanitize')
        ) {
          validationCount++;
        }
      });
      
      // If at least half of API files have validation
      if (apiFiles.length > 0 && validationCount / apiFiles.length >= 0.5) {
        auditResults.apiSecurity.inputValidation = true;
      }
    }
  } catch (error) {
    console.error('Error checking input validation:', error);
  }
  
  console.log('Input validation check completed.');
}

// Check for secure password hashing
function checkPasswordHashing() {
  console.log('Checking password hashing...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check if bcrypt or similar is installed
    auditResults.authSecurity.passwordHashing = Object.keys(dependencies).some(dep => 
      dep === 'bcrypt' || dep === 'bcryptjs' || dep === 'argon2'
    );
    
    // Check for hashing implementation in code
    if (auditResults.authSecurity.passwordHashing) {
      // Check if salt rounds are properly set
      const srcFiles = walkDirectory(WORKSPACE_ROOT, ['.js', '.ts', '.tsx']);
      const hashingImplementations = srcFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('bcrypt.hash') || content.includes('bcrypt.hashSync');
      });
      
      // Check if the implementations use a sufficient number of salt rounds
      let hasSufficientSaltRounds = false;
      for (const file of hashingImplementations) {
        const content = fs.readFileSync(file, 'utf8');
        const saltRoundsMatch = content.match(/salt(Rounds|rounds|Round|round)\s*=\s*(\d+)/);
        if (saltRoundsMatch && parseInt(saltRoundsMatch[2]) >= 10) {
          hasSufficientSaltRounds = true;
          break;
        }
      }
      
      // Update password hashing result
      auditResults.authSecurity.passwordHashing = hasSufficientSaltRounds;
      if (!hasSufficientSaltRounds && hashingImplementations.length > 0) {
        auditResults.miscIssues.push({
          type: 'passwordHashing',
          message: 'Password hashing implementation found, but salt rounds may not be sufficient (should be >= 10)'
        });
      }
    }
  } catch (error) {
    console.error('Error checking password hashing:', error);
  }
  
  console.log('Password hashing check completed.');
}

// Check for secure cookies
function checkSecureCookies() {
  console.log('Checking secure cookies...');
  
  try {
    const authConfigPath = path.join(WORKSPACE_ROOT, 'auth.config.ts');
    if (fs.existsSync(authConfigPath)) {
      const authConfig = fs.readFileSync(authConfigPath, 'utf8');
      auditResults.apiSecurity.secureCookies = 
        authConfig.includes('secure: true') && 
        authConfig.includes('httpOnly: true');
    }
  } catch (error) {
    console.error('Error checking secure cookies:', error);
  }
  
  console.log('Secure cookies check completed.');
}

// Check for data sanitization
function checkDataSanitization() {
  console.log('Checking data sanitization...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check if sanitization packages are installed
    auditResults.dataSecurity.sanitization = Object.keys(dependencies).some(dep => 
      dep.includes('sanitize') || dep.includes('xss') || dep.includes('escape')
    );
    
    // If sanitization package is found, check for actual usage in code
    if (auditResults.dataSecurity.sanitization) {
      const srcFiles = walkDirectory(WORKSPACE_ROOT, ['.js', '.ts', '.tsx']);
      const sanitizationUsage = srcFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('sanitize') || content.includes('sanitizeHtml') || content.includes('escape');
      });
      
      auditResults.dataSecurity.sanitization = sanitizationUsage;
    }
  } catch (error) {
    console.error('Error checking data sanitization:', error);
  }
  
  console.log('Data sanitization check completed.');
}

// Check for SQL injection prevention
function checkSqlInjectionPrevention() {
  console.log('Checking SQL injection prevention...');
  
  try {
    // Check if ORM is used (Prisma in this case)
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check if Prisma or similar ORM is installed
    auditResults.dataSecurity.sqlInjectionPrevention = Object.keys(dependencies).some(dep => 
      dep === '@prisma/client' || dep.includes('sequelize') || dep.includes('typeorm')
    );
    
    // If no ORM, check for parameterized queries
    if (!auditResults.dataSecurity.sqlInjectionPrevention) {
      const srcFiles = walkDirectory(WORKSPACE_ROOT, ['.js', '.ts', '.tsx']);
      const parameterizedQueries = srcFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('?') && content.includes('query') && content.includes('params');
      });
      
      auditResults.dataSecurity.sqlInjectionPrevention = parameterizedQueries;
    }
  } catch (error) {
    console.error('Error checking SQL injection prevention:', error);
  }
  
  console.log('SQL injection prevention check completed.');
}

// Utility function to walk directory recursively
function walkDirectory(dir, extensions = null) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== '.next') {
      // Recursively walk through directories
      results = results.concat(walkDirectory(filePath, extensions));
    } else {
      // Check file extension if specified
      if (!extensions || extensions.some(ext => filePath.endsWith(ext))) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Main function to run all checks
async function runSecurityAudit() {
  console.log('Starting security audit...');
  
  runNpmAudit();
  checkEnvironmentFiles();
  checkSecurityHeaders();
  checkCsrfProtection();
  checkRateLimiting();
  checkInputValidation();
  checkPasswordHashing();
  checkSecureCookies();
  checkDataSanitization();
  checkSqlInjectionPrevention();
  
  // Save results to file
  const resultsPath = path.join(WORKSPACE_ROOT, 'security-audit.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
  
  console.log(`Security audit completed. Results saved to ${resultsPath}`);
  
  // Log summary to console
  console.log('\nSecurity Audit Summary:');
  console.log('-----------------------');
  
  // NPM audit summary
  if (auditResults.npmAudit.metadata) {
    const { metadata } = auditResults.npmAudit;
    console.log('NPM dependencies:');
    console.log(`  Vulnerabilities: ${metadata.vulnerabilities.total || 0} total`);
    if (metadata.vulnerabilities.total > 0) {
      console.log(`    Critical: ${metadata.vulnerabilities.critical || 0}`);
      console.log(`    High: ${metadata.vulnerabilities.high || 0}`);
      console.log(`    Moderate: ${metadata.vulnerabilities.moderate || 0}`);
      console.log(`    Low: ${metadata.vulnerabilities.low || 0}`);
    }
  }
  
  // Environment checks
  console.log('\nEnvironment files:');
  console.log(`  .env file exists: ${auditResults.environmentChecks.envFileExists}`);
  console.log(`  .env example exists: ${auditResults.environmentChecks.envExampleExists}`);
  console.log(`  .env in gitignore: ${auditResults.environmentChecks.envInGitignore}`);
  
  // Security headers
  console.log('\nSecurity headers:');
  Object.entries(auditResults.securityHeaders).forEach(([header, implemented]) => {
    console.log(`  ${header}: ${implemented}`);
  });
  
  // API security
  console.log('\nAPI security:');
  Object.entries(auditResults.apiSecurity).forEach(([check, implemented]) => {
    console.log(`  ${check}: ${implemented}`);
  });
  
  // Auth security
  console.log('\nAuth security:');
  Object.entries(auditResults.authSecurity).forEach(([check, implemented]) => {
    console.log(`  ${check}: ${implemented}`);
  });
  
  // Data security
  console.log('\nData security:');
  Object.entries(auditResults.dataSecurity).forEach(([check, implemented]) => {
    console.log(`  ${check}: ${implemented}`);
  });
  
  // Sensitive exposure
  if (auditResults.sensitiveExposure.length > 0) {
    console.log('\nSensitive information exposure:');
    auditResults.sensitiveExposure.forEach(item => {
      console.log(`  ${item.file}: ${item.key} (${item.isMasked ? 'masked' : 'exposed'})`);
    });
  }
  
  // Misc issues
  if (auditResults.miscIssues.length > 0) {
    console.log('\nOther issues:');
    auditResults.miscIssues.forEach(issue => {
      console.log(`  ${issue.type}: ${issue.message}`);
    });
  }
}

// Run the audit
runSecurityAudit(); 