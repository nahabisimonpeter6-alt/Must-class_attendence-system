const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

function withServer(run) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      try {
        const { port } = server.address();
        await run(`http://127.0.0.1:${port}`);
        server.close();
        resolve();
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}

test('the app boots and GET /api/health responds', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });
});

test('unknown API routes return a JSON 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/does-not-exist`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
