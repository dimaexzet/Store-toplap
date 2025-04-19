// Backup configuration for automated database backups
// This file defines backup strategies and schedules

/**
 * Database backup configuration
 * 
 * This script can be used with cron jobs or other scheduling tools to
 * perform automated database backups. It supports:
 * 
 * 1. Daily incremental backups
 * 2. Weekly full backups
 * 3. Monthly archive backups
 * 
 * Example usage with cron:
 * 0 1 * * * node /path/to/app/backup.config.js --type=daily
 * 0 2 * * 0 node /path/to/app/backup.config.js --type=weekly
 * 0 3 1 * * node /path/to/app/backup.config.js --type=monthly
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env.production' });

// Configuration
const config = {
  backupDir: process.env.BACKUP_DIR || './backups',
  databaseUrl: process.env.DATABASE_URL,
  retentionPolicy: {
    daily: 7,    // Keep daily backups for 7 days
    weekly: 4,   // Keep weekly backups for 4 weeks
    monthly: 12, // Keep monthly backups for 12 months
  },
  // S3 configuration for offsite storage
  s3: {
    enabled: process.env.S3_BACKUP_ENABLED === 'true',
    bucket: process.env.S3_BACKUP_BUCKET,
    region: process.env.S3_BACKUP_REGION || 'us-east-1',
  },
};

// Create backup directories if they don't exist
function createBackupDirs() {
  const dirs = ['daily', 'weekly', 'monthly'].map(type => 
    path.join(config.backupDir, type)
  );
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created backup directory: ${dir}`);
    }
  });
}

// Perform database backup
async function backupDatabase(type) {
  if (!config.databaseUrl) {
    console.error('Database URL not configured');
    process.exit(1);
  }
  
  // Extract database type from connection string
  const dbType = config.databaseUrl.split(':')[0];
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, type, `${type}-backup-${timestamp}`);
  
  try {
    let command;
    
    // Different backup command based on database type
    if (dbType.includes('postgres')) {
      command = `pg_dump "${config.databaseUrl}" -F c -f "${backupPath}.pgdump"`;
    } else if (dbType.includes('mysql')) {
      command = `mysqldump --result-file="${backupPath}.sql" --single-transaction --quick --skip-extended-insert "${config.databaseUrl}"`;
    } else if (dbType.includes('sqlite')) {
      const dbPath = config.databaseUrl.replace('sqlite://', '');
      command = `sqlite3 "${dbPath}" ".backup '${backupPath}.sqlite'"`;
    } else {
      console.error(`Unsupported database type: ${dbType}`);
      process.exit(1);
    }
    
    console.log(`Starting ${type} backup...`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup error: ${error.message}`);
        return;
      }
      
      console.log(`Backup completed: ${backupPath}`);
      
      // Upload to S3 if enabled
      if (config.s3.enabled) {
        uploadToS3(backupPath, type);
      }
      
      // Apply retention policy
      cleanupOldBackups(type);
    });
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

// Upload backup to S3
function uploadToS3(backupPath, type) {
  // S3 upload code would go here
  // This would typically use the AWS SDK
  console.log(`[Mock] Uploading backup to S3 bucket: ${config.s3.bucket}/${type}/`);
}

// Clean up old backups according to retention policy
function cleanupOldBackups(type) {
  const backupDir = path.join(config.backupDir, type);
  const retention = config.retentionPolicy[type];
  
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error(`Error reading backup directory: ${err}`);
      return;
    }
    
    // Sort files by date (oldest first)
    const sortedFiles = files.sort();
    
    // Delete oldest files if we have more than retention policy
    if (sortedFiles.length > retention) {
      const filesToDelete = sortedFiles.slice(0, sortedFiles.length - retention);
      
      filesToDelete.forEach(file => {
        const filePath = path.join(backupDir, file);
        fs.unlink(filePath, err => {
          if (err) {
            console.error(`Error deleting old backup: ${err}`);
          } else {
            console.log(`Deleted old backup: ${filePath}`);
          }
        });
      });
    }
  });
}

// Main execution
function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let backupType = 'daily'; // Default to daily backup
  
  // Extract backup type from arguments
  const typeArg = args.find(arg => arg.startsWith('--type='));
  if (typeArg) {
    backupType = typeArg.split('=')[1];
  }
  
  // Validate backup type
  if (!['daily', 'weekly', 'monthly'].includes(backupType)) {
    console.error(`Invalid backup type: ${backupType}. Must be daily, weekly, or monthly.`);
    process.exit(1);
  }
  
  createBackupDirs();
  backupDatabase(backupType);
}

// Run if script is executed directly
if (require.main === module) {
  main();
}

// Export functions for programmatic use
module.exports = {
  backupDatabase,
  cleanupOldBackups,
}; 