const express = require('express');

const createApp = () => {
  const app = express();

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'service1' });
  });

  app.get('/api/service1', (_req, res) => {
    res.json({
      service: 'service1',
      message: process.env.SERVICE1_MESSAGE || 'Service1 responding',
      timestamp: new Date().toISOString()
    });
  });

  return app;
};

const port = process.env.PORT || 4001;

if (require.main === module) {
  const app = createApp();
  app.listen(port, () => {
    console.info(`service1 listening on port ${port}`);
  });
}

module.exports = { createApp };
