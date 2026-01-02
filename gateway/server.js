const express = require('express');
const fetch = require('node-fetch');

const service1Url = process.env.SERVICE1_URL || 'http://service1:4001/api/service1';
const service2Url = process.env.SERVICE2_URL || 'http://service2:4002/api/service2';

const createApp = (httpClient = fetch) => {
  const app = express();

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
  });

  app.get('/api/aggregate', async (_req, res) => {
    try {
      const [s1, s2] = await Promise.all([
        httpClient(service1Url).then((r) => r.json()),
        httpClient(service2Url).then((r) => r.json())
      ]);
      res.json({ gateway: 'ok', service1: s1, service2: s2 });
    } catch (err) {
      console.error('Aggregation error', err);
      res.status(502).json({ error: 'Upstream failure' });
    }
  });

  return app;
};

const port = process.env.PORT || 4000;

if (require.main === module) {
  const app = createApp();
  app.listen(port, () => {
    console.info(`gateway listening on port ${port}`);
  });
}

module.exports = { createApp };
