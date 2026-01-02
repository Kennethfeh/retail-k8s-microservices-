const express = require('express');

const createApp = () => {
  const app = express();

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'service2' });
  });

  app.get('/api/service2', (_req, res) => {
    res.json({
      service: 'service2',
      status: 'green',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  return app;
};

const port = process.env.PORT || 4002;

if (require.main === module) {
  const app = createApp();
  app.listen(port, () => {
    console.info(`service2 listening on port ${port}`);
  });
}

module.exports = { createApp };
