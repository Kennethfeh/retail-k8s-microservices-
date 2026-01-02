const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { once } = require('node:events');
const { createApp } = require('./server');

const listen = async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  return request(server);
};

test('service2 health works', async (t) => {
  const agent = await listen(t);
  const res = await agent.get('/healthz');
  assert.equal(res.status, 200);
  assert.equal(res.body.service, 'service2');
});

test('service2 reports uptime', async (t) => {
  const agent = await listen(t);
  const res = await agent.get('/api/service2');
  assert.equal(res.status, 200);
  assert.equal(res.body.service, 'service2');
  assert.ok(res.body.uptime >= 0);
});
