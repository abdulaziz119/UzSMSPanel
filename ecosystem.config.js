module.exports = {
  apps: [
    {
      name: 'fix-back-frontend-dev',
      script: 'dist/src/frontend/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4141,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4141,
      },
      error_file: './logs/frontend-dev-err.log',
      out_file: './logs/frontend-dev-out.log',
      log_file: './logs/frontend-dev-combined.log',
      time: true
    },
    {
      name: 'fix-back-dashboard-dev',
      script: 'dist/src/dashboard/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4040,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4040,
      },
      error_file: './logs/dashboard-dev-err.log',
      out_file: './logs/dashboard-dev-out.log',
      log_file: './logs/dashboard-dev-combined.log',
      time: true
    }
  ],

  deploy: {
    development: {
      user: 'ubuntu',
      host: ['62.113.58.93'],
      ref: 'origin/abdulaziz',
      repo: 'https://github.com/abdulaziz119/fix-back.git',
      path: '/var/www/fix-back-dev',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env development && pm2 save',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
