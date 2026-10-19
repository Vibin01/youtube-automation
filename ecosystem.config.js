// PM2 Process Configuration for Ubuntu / Debian Linux VPS
module.exports = {
  apps: [
    {
      name: "autotube-web",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      restart_delay: 4000,
      max_restarts: 10,
    },
    {
      name: "autotube-daily-scheduler",
      script: "npx",
      args: "tsx src/worker/daily-scheduler.ts",
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
