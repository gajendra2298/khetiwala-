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
      // Auto restart on file changes (for development)
      watch: false,
      // Ignore certain files
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // Restart delay
      restart_delay: 4000,
      // Max restarts per hour
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
