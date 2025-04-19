#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'security-audit.json');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, errorMessage) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    log(`${errorMessage}: ${error.message}`, colors.red);
    return error.stdout || '';
  }
}

function checkEnvFiles() {
  log('\n🔒 Checking environment files...', colors.bold + colors.blue);
  
  // Check for .env file
  if (fs.existsSync(path.join(rootDir, '.env'))) {
    log('✓ .env file found', colors.green);
    
    // Check if .env is in .gitignore
    const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
    if (gitignore.includes('.env')) {
      log('✓ .env is properly ignored in .gitignore', colors.green);
    } else {
      log('⚠️ WARNING: .env file is not listed in .gitignore!', colors.red + colors.bold);
    }
    
    // Check for environment variables with dummy/default values
    const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
    const lines = envContent.split('\n');
    const suspiciousValues = [
      'test', 'example', 'default', 'changeme', 'your_', 'sample', 'placeholder'
    ];
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        if (value) {
          suspiciousValues.forEach(term => {
            if (value.toLowerCase().includes(term)) {
              log(`⚠️ Suspicious env value found: ${key}=${value}`, colors.yellow);
            }
          });
        }
      }
    });
  } else {
    log('✓ No .env file committed to the repository (good practice)', colors.green);
  }
  
  // Check for .env.example
  if (fs.existsSync(path.join(rootDir, '.env.example'))) {
    log('✓ .env.example file found (good practice)', colors.green);
  } else {
    log('⚠️ No .env.example file found. Consider adding one as a template.', colors.yellow);
  }
}

function checkDependencyVulnerabilities() {
  log('\n🔒 Checking for dependency vulnerabilities...', colors.bold + colors.blue);
  
  const result = runCommand('npm audit --json', 'Failed to run npm audit');
  
  if (result) {
    try {
      const auditData = JSON.parse(result);
      
      if (auditData.vulnerabilities) {
        const { critical, high, moderate, low } = auditData.vulnerabilities;
        
        if (critical > 0) {
          log(`⚠️ CRITICAL: ${critical} critical vulnerabilities found!`, colors.red + colors.bold);
        }
        
        if (high > 0) {
          log(`⚠️ HIGH: ${high} high vulnerabilities found!`, colors.red);
        }
        
        if (moderate > 0) {
          log(`⚠️ MODERATE: ${moderate} moderate vulnerabilities found.`, colors.yellow);
        }
        
        if (low > 0) {
          log(`ℹ️ LOW: ${low} low vulnerabilities found.`, colors.cyan);
        }
        
        if (critical === 0 && high === 0 && moderate === 0 && low === 0) {
          log('✓ No vulnerabilities found', colors.green);
        } else {
          log('Run `npm audit fix` to attempt to fix these issues.', colors.yellow);
        }
      }
    } catch (e) {
      log(`Error parsing npm audit results: ${e.message}`, colors.red);
    }
  }
}

function checkSecrets() {
  log('\n🔒 Checking for potential secret exposure...', colors.bold + colors.blue);
  
  const patterns = [
    'password', 'secret', 'apiKey', 'apikey', 'api_key', 'token', 'auth',
    'PASSWORD', 'SECRET', 'APIKEY', 'API_KEY', 'TOKEN', 'AUTH'
  ];
  
  const excludeDirs = [
    'node_modules', '.git', '.next', 'coverage', 'dist', 'build', 'out'
  ];
  
  const validFileExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml', '.md', '.mdx',
    '.html', '.css', '.scss', '.env', '.config'
  ];
  
  const secretRegexes = [
    // API keys, tokens
    /(['"`])(?:(?:api|private|public)(?:_|-)?)?(?:key|token|secret|password|auth|credential|signin)(['"`])[^;,\s]*?['"`]/i,
    // AWS keys
    /AKIA[0-9A-Z]{16}/,
    // Bearer tokens
    /['"`]?bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*['"`]?/i,
    // Base64
    /['"`][A-Za-z0-9+/]{40,}={0,2}['"`]/
  ];
  
  let potentialSecretsFound = false;
  
  function scanFilesRecursively(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        if (!excludeDirs.includes(file.name)) {
          scanFilesRecursively(fullPath);
        }
        continue;
      }
      
      const ext = path.extname(file.name);
      if (!validFileExtensions.includes(ext)) continue;
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, i) => {
          // Skip comments
          if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
            return;
          }
          
          for (const pattern of patterns) {
            if (line.includes(pattern)) {
              for (const regex of secretRegexes) {
                const match = line.match(regex);
                if (match) {
                  log(`⚠️ Potential secret found in ${fullPath}:${i + 1}`, colors.yellow);
                  // Avoid printing the actual secret
                  log(`   ${line.replace(match[0], '[POTENTIAL SECRET REDACTED]')}`, colors.yellow);
                  potentialSecretsFound = true;
                  break;
                }
              }
            }
          }
        });
      } catch (error) {
        log(`Error reading file ${fullPath}: ${error.message}`, colors.red);
      }
    }
  }
  
  scanFilesRecursively(rootDir);
  
  if (!potentialSecretsFound) {
    log('✓ No obvious secrets found in the codebase', colors.green);
  } else {
    log('⚠️ Potential secrets were found in the codebase. Please review and secure them.', colors.yellow);
  }
}

function checkSecureHeaders() {
  log('\n🔒 Checking for secure HTTP headers...', colors.bold + colors.blue);
  
  const files = [
    path.join(rootDir, 'middleware.ts'),
    path.join(rootDir, 'next.config.ts'),
    path.join(rootDir, 'next.config.js')
  ];
  
  const securityHeaders = [
    'X-XSS-Protection',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'X-Frame-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy'
  ];
  
  let headersFound = [];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const header of securityHeaders) {
        if (content.includes(header)) {
          headersFound.push(header);
        }
      }
    }
  }
  
  const uniqueHeadersFound = [...new Set(headersFound)];
  
  for (const header of securityHeaders) {
    if (uniqueHeadersFound.includes(header)) {
      log(`✓ ${header} is set`, colors.green);
    } else {
      log(`⚠️ ${header} is not set`, colors.yellow);
    }
  }
  
  if (uniqueHeadersFound.length === 0) {
    log('⚠️ No security headers found! Consider adding them to your middleware or Next.js config.', colors.red);
  }
}

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    npmAudit: null,
    environmentChecks: {},
    securityHeaders: {}
  };
  
  try {
    // NPM audit
    const auditResult = runCommand('npm audit --json', 'Failed to run npm audit');
    if (auditResult) {
      report.npmAudit = JSON.parse(auditResult);
    }
    
    // Environment checks
    report.environmentChecks = {
      envFileExists: fs.existsSync(path.join(rootDir, '.env')),
      envExampleExists: fs.existsSync(path.join(rootDir, '.env.example')),
      envInGitignore: fs.existsSync(path.join(rootDir, '.gitignore')) ? 
        fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8').includes('.env') : false
    };
    
    // Security headers
    const files = [
      path.join(rootDir, 'middleware.ts'),
      path.join(rootDir, 'next.config.ts'),
      path.join(rootDir, 'next.config.js')
    ];
    
    const securityHeaders = [
      'X-XSS-Protection',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-Frame-Options',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];
    
    for (const header of securityHeaders) {
      report.securityHeaders[header] = false;
    }
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const header of securityHeaders) {
          if (content.includes(header)) {
            report.securityHeaders[header] = true;
          }
        }
      }
    }
    
    // Write report to file
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\nSecurity audit report saved to ${reportPath}`, colors.green);
  } catch (error) {
    log(`Failed to generate report: ${error.message}`, colors.red);
  }
}

function runAllChecks() {
  log('🔒 Starting security audit...', colors.bold + colors.magenta);
  
  checkEnvFiles();
  checkDependencyVulnerabilities();
  checkSecrets();
  checkSecureHeaders();
  generateReport();
  
  log('\n🔒 Security audit completed.', colors.bold + colors.magenta);
}

// Run all checks
runAllChecks(); 