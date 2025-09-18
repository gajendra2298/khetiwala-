# 🚀 Hostinger Deployment Guide for Khetiwala Backend

This guide will help you deploy your NestJS backend to Hostinger VPS hosting.

## 📋 Prerequisites

- Hostinger VPS account
- Domain name (optional but recommended)
- SSH access to your VPS
- Basic knowledge of Linux commands

## 🔧 Step 1: VPS Setup

### 1.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Install Node.js (LTS Version)
```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.4 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 1.5 Install MongoDB
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -

# Create MongoDB list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
apt update

# Install MongoDB
apt install -y mongodb-org

# Start MongoDB service
systemctl start mongod
systemctl enable mongod
```

### 1.6 Install Nginx (Reverse Proxy)
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 1.7 Install SSL Certificate (Let's Encrypt)
```bash
apt install certbot python3-certbot-nginx -y
```

## 📦 Step 2: Deploy Your Application

### 2.1 Create Application Directory
```bash
mkdir -p /var/www/khetiwala-backend
cd /var/www/khetiwala-backend
```

### 2.2 Upload Your Code
You can use one of these methods:

#### Method A: Git Clone (Recommended)
```bash
# Install Git
apt install git -y

# Clone your repository
git clone https://github.com/yourusername/khetiwala-backend.git .

# Or if using private repo, set up SSH keys
```

#### Method B: SCP Upload
```bash
# From your local machine
scp -r ./khetiwala-backend root@your-vps-ip:/var/www/
```

### 2.3 Install Dependencies
```bash
cd /var/www/khetiwala-backend
npm install
```

### 2.4 Build the Application
```bash
npm run build
```

## 🔐 Step 3: Environment Configuration

### 3.1 Create Production Environment File
```bash
nano /var/www/khetiwala-backend/.env
```

### 3.2 Production Environment Variables
```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/khetiwala

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES=7d
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_REFRESH_EXPIRES=30d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12
```

### 3.3 Secure Environment File
```bash
chmod 600 /var/www/khetiwala-backend/.env
chown www-data:www-data /var/www/khetiwala-backend/.env
```

## 🚀 Step 4: PM2 Configuration

### 4.1 Create PM2 Ecosystem File
```bash
nano /var/www/khetiwala-backend/ecosystem.config.js
```

### 4.2 PM2 Configuration
```javascript
module.exports = {
  apps: [
    {
      name: 'khetiwala-backend',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/pm2/khetiwala-backend-error.log',
      out_file: '/var/log/pm2/khetiwala-backend-out.log',
      log_file: '/var/log/pm2/khetiwala-backend.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
  ],
};
```

### 4.3 Start Application with PM2
```bash
cd /var/www/khetiwala-backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Step 5: Nginx Configuration

### 5.1 Create Nginx Configuration
```bash
nano /etc/nginx/sites-available/khetiwala-backend
```

### 5.2 Nginx Configuration File
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (uploads)
    location /uploads {
        alias /var/www/khetiwala-backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Documentation
    location /docs {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

### 5.3 Enable Site and Test Configuration
```bash
# Enable the site
ln -s /etc/nginx/sites-available/khetiwala-backend /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

## 🔒 Step 6: SSL Certificate Setup

### 6.1 Obtain SSL Certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6.2 Auto-renewal Setup
```bash
# Test renewal
certbot renew --dry-run

# Add to crontab for auto-renewal
crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 Step 7: Firewall Configuration

### 7.1 Configure UFW Firewall
```bash
# Install UFW
apt install ufw -y

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable
```

## 📊 Step 8: Monitoring and Logs

### 8.1 PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs khetiwala-backend

# Monitor resources
pm2 monit
```

### 8.2 Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### 8.3 Application Logs
```bash
# PM2 logs
tail -f /var/log/pm2/khetiwala-backend.log
```

## 🔄 Step 9: Deployment Script

### 9.1 Create Deployment Script
```bash
nano /var/www/khetiwala-backend/deploy.sh
```

### 9.2 Deployment Script Content
```bash
#!/bin/bash

# Khetiwala Backend Deployment Script
echo "🚀 Starting deployment..."

# Navigate to application directory
cd /var/www/khetiwala-backend

# Pull latest changes (if using Git)
# git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart khetiwala-backend

# Reload nginx
echo "🌐 Reloading nginx..."
systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌍 Application is running at: https://yourdomain.com"
echo "📚 API Documentation: https://yourdomain.com/docs"
```

### 9.3 Make Script Executable
```bash
chmod +x /var/www/khetiwala-backend/deploy.sh
```

## 🛠️ Step 10: Database Setup

### 10.1 Create Database and User
```bash
# Connect to MongoDB
mongo

# Create database and user
use khetiwala
db.createUser({
  user: "khetiwala_user",
  pwd: "your-secure-password",
  roles: [{ role: "readWrite", db: "khetiwala" }]
})
```

### 10.2 Update MongoDB Connection String
Update your `.env` file:
```env
MONGO_URI=mongodb://khetiwala_user:your-secure-password@localhost:27017/khetiwala
```

## 🔧 Step 11: Performance Optimization

### 11.1 Node.js Optimization
```bash
# Increase file descriptor limit
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

### 11.2 MongoDB Optimization
```bash
# Edit MongoDB configuration
nano /etc/mongod.conf

# Add these optimizations:
# storage:
#   wiredTiger:
#     engineConfig:
#       cacheSizeGB: 1
# systemLog:
#   destination: file
#   logAppend: true
#   path: /var/log/mongodb/mongod.log
```

## 🚨 Step 12: Backup Strategy

### 12.1 Database Backup Script
```bash
nano /var/www/khetiwala-backend/backup.sh
```

### 12.2 Backup Script Content
```bash
#!/bin/bash

# Database backup
mongodump --db khetiwala --out /var/backups/mongodb/$(date +%Y%m%d_%H%M%S)

# Application backup
tar -czf /var/backups/app/khetiwala-backend_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/khetiwala-backend

# Clean old backups (keep last 7 days)
find /var/backups -type f -mtime +7 -delete
```

### 12.3 Setup Automated Backups
```bash
# Add to crontab
crontab -e
# Add this line for daily backups at 2 AM:
# 0 2 * * * /var/www/khetiwala-backend/backup.sh
```

## ✅ Step 13: Testing Deployment

### 13.1 Test API Endpoints
```bash
# Test health endpoint
curl https://yourdomain.com/api/health

# Test API documentation
curl https://yourdomain.com/docs
```

### 13.2 Test WebSocket Connection
```bash
# Test WebSocket endpoint
wscat -c wss://yourdomain.com/socket.io/
```

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **Application won't start**
   ```bash
   pm2 logs khetiwala-backend
   ```

2. **Nginx 502 Bad Gateway**
   ```bash
   # Check if application is running
   pm2 status
   # Check nginx error logs
   tail -f /var/log/nginx/error.log
   ```

3. **SSL Certificate Issues**
   ```bash
   certbot certificates
   certbot renew --force-renewal
   ```

4. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   systemctl status mongod
   # Check MongoDB logs
   tail -f /var/log/mongodb/mongod.log
   ```

## 📞 Support

If you encounter any issues during deployment:

1. Check the logs: `pm2 logs khetiwala-backend`
2. Verify nginx configuration: `nginx -t`
3. Check firewall status: `ufw status`
4. Verify SSL certificate: `certbot certificates`

## 🎉 Congratulations!

Your Khetiwala backend is now successfully deployed on Hostinger! 

- **API Base URL**: `https://yourdomain.com/api`
- **Documentation**: `https://yourdomain.com/docs`
- **WebSocket**: `wss://yourdomain.com/socket.io/`

Next, follow the Expo integration guide to connect your mobile app to the hosted backend.
