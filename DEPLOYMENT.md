# AI-Amazona Deployment Guide

This document outlines the steps required to deploy the AI-Amazona e-commerce application to a production environment.

## Prerequisites

- Node.js v20 or later
- PostgreSQL database
- Git
- AWS account (for S3 storage and optional hosting)
- Stripe account (for payments)
- Uploadthing account (for file uploads)
- Resend account (for emails)

## Environment Setup

1. Clone the repository
   ```bash
   git clone https://github.com/username/ai-amazona.git
   cd ai-amazona
   ```

2. Create a production environment file
   Copy the `.env.production` template file and fill in the required values:
   ```bash
   cp .env.example .env.production
   ```

   Edit the `.env.production` file with your production values:
   - Database connection string
   - Authentication secret
   - API keys (Uploadthing, Resend, Stripe)
   - Other service credentials

3. Install dependencies
   ```bash
   npm ci
   ```

4. Build the application
   ```bash
   npm run build
   ```

## Database Setup

1. Set up a PostgreSQL database (recommended hosting options: AWS RDS, Digital Ocean Managed Database, or Neon)

2. Run database migrations
   ```bash
   npx prisma migrate deploy
   ```

3. (Optional) Seed initial data
   ```bash
   npx prisma db seed
   ```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. Install Vercel CLI
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel
   ```bash
   vercel --prod
   ```

3. Configure environment variables in the Vercel dashboard

### Option 2: Self-hosted server (VPS)

1. Set up a VPS (AWS EC2, Digital Ocean Droplet, etc.)

2. Install Node.js and PM2
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   npm install -g pm2
   ```

3. Create a PM2 ecosystem file `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: "ai-amazona",
       script: "server/socketServer.js",
       env_production: {
         NODE_ENV: "production",
         PORT: 3000
       },
       instances: "max",
       exec_mode: "cluster",
       max_memory_restart: "500M"
     }]
   }
   ```

4. Deploy and start the application
   ```bash
   # Copy files to server (example)
   rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server:/path/to/app/

   # SSH into server
   ssh user@your-server

   # Navigate to app directory
   cd /path/to/app

   # Install dependencies
   npm ci

   # Build the application
   npm run build

   # Start the application with PM2
   pm2 start ecosystem.config.js --env production
   ```

5. Set up Nginx as a reverse proxy (optional)
   ```bash
   sudo apt-get install nginx
   ```

   Create an Nginx configuration file:
   ```
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. Set up SSL with Let's Encrypt
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: Docker Deployment

1. Build the Docker image
   ```bash
   docker build -t ai-amazona .
   ```

2. Run the container
   ```bash
   docker run -d -p 3000:3000 --name ai-amazona \
     --env-file .env.production \
     ai-amazona
   ```

## CI/CD Setup

1. Ensure GitHub repository has the following secrets configured:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `UPLOADTHING_TOKEN`
   - `UPLOADTHING_SECRET`
   - `RESEND_API_KEY`
   - `SENDER_EMAIL`
   - Deployment credentials (SSH keys, etc.)

2. GitHub Actions workflow is already set up in `.github/workflows/main.yml`

3. For automatic deployments, ensure your hosting provider is connected to GitHub 
   (Vercel/Netlify) or set up deployment keys for self-hosted options.

## Monitoring

1. Set up Sentry for error tracking
   - Create a Sentry account and project
   - Add your Sentry DSN to `.env.production`

2. Add health checks
   Create a `/api/health` endpoint that returns the application status.

3. Set up uptime monitoring (e.g., UptimeRobot, Pingdom, or AWS CloudWatch)

## Backup Strategy

1. Configure database backups
   - Use the backup script in `backup.config.js`
   - Set up cron jobs for regular backups:
     ```
     # Daily backup at 1:00 AM
     0 1 * * * node /path/to/app/backup.config.js --type=daily
     
     # Weekly backup at 2:00 AM on Sundays
     0 2 * * 0 node /path/to/app/backup.config.js --type=weekly
     
     # Monthly backup at 3:00 AM on the 1st of each month
     0 3 1 * * node /path/to/app/backup.config.js --type=monthly
     ```

2. Configure S3 for backup storage
   - Create an S3 bucket for backups
   - Set the following environment variables:
     ```
     S3_BACKUP_ENABLED=true
     S3_BACKUP_BUCKET=your-backup-bucket
     S3_BACKUP_REGION=your-bucket-region
     ```

3. Test the backup and restore process
   ```bash
   # Test backup
   node backup.config.js --type=daily
   
   # Test restore (from the most recent backup)
   # The specific restore command depends on your database type
   ```

## Security Considerations

1. Enable rate limiting for API endpoints
2. Configure CORS properly
3. Implement security headers
4. Regularly update dependencies
5. Set up automatic security scanning
6. Configure proper authentication and authorization

## Performance Optimization

1. Enable caching where appropriate
2. Ensure images are optimized
3. Implement code splitting
4. Configure CDN for static assets
5. Set up database query optimization

## Support and Maintenance

1. Set up logging and monitoring alerts
2. Create a rollback plan for failed deployments
3. Document common troubleshooting steps
4. Establish a regular update schedule

## Further Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Production Checklist](https://www.prisma.io/docs/guides/deployment/deployment)
- [Stripe Production Checklist](https://stripe.com/docs/development/checklist) 