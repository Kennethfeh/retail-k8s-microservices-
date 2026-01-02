const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const fetch = require('node-fetch');
const { once } = require('node:events');
const { createApp } = require('./server');

const listen = async (t, app) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  return request(server);
};

test('aggregate endpoint returns merged payload', async (t) => {
  const mockFetch = async (url) => {
    if (url.includes('service1')) {
      return { json: async () => ({ service: 'service1' }) };
    }
    return { json: async () => ({ service: 'service2' }) };
  };
  const agent = await listen(t, createApp(mockFetch));
  const res = await agent.get('/api/aggregate');
  assert.equal(res.status, 200);
  assert.equal(res.body.gateway, 'ok');
  assert.equal(res.body.service1.service, 'service1');
});

test('health endpoint works', async (t) => {
  const agent = await listen(t, createApp(fetch));
  const res = await agent.get('/healthz');
  assert.equal(res.status, 200);
  assert.equal(res.body.service, 'gateway');
});
