// PM2 process manager config. Run with `npx pm2 start ecosystem.config.js`.
module.exports = {
  apps: [
    {
      name: "project-management", // process name shown in `pm2 list`/`pm2 logs`
      script: "npm",
      args: "run dev", // PM2 runs `npm run dev` as the managed process
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
