module.exports = {
  apps: [
    {
      name: "performs360-app",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      restart_delay: 5000,
    },
    {
      name: "performs360-worker",
      script: "dist/worker.js",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "256M",
      restart_delay: 5000,
    },
  ],
};
