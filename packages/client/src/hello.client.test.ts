import assert from 'assert';
import express, { Express } from 'express';
import { Server } from 'http';
import { describe, it, before, after } from 'mocha';

import { createClient } from './hello.client';
import { createServer } from '../../server/src/hello.server';

describe('hello.client', () => {
  let app: Express;
  let server: Server;
  const hello = createClient('http://localhost:3000');
  before((done) => {
    app = express();
    app.use((_req, res, next) => {
      res.set('connection', 'close');
      next();
    });
    createServer(app);
    server = app.listen(3000, done);
  });

  after(function (done) {
    this.timeout(5000);
    server.close(done);
  });

  describe('GET /hello?name=', () => {
    it('invoke ok', async () => {
      const [ok, err, res] = await hello('hello', 'get', {
        query: { name: 'get query' },
      });

      assert(ok);
      assert.strictEqual(ok.message, 'hello get query');
      assert.strictEqual(err, null);
      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('invoke err', async () => {
      const [ok, err, res] = await hello('hello', 'get', {
        query: { name: '' },
      });

      assert.strictEqual(ok, null);
      assert(err);
      assert.strictEqual(err.message, 'missing query .name');
      assert(!res.ok);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('raw', async () => {
      const res = await hello.raw('hello', 'get', {
        query: { name: 'get query' },
      });

      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.strictEqual(await res.text(), '{"message":"hello get query"}');
    });
  });

  describe('POST /hello', () => {
    it('invoke ok', async () => {
      const [ok, err, res] = await hello('hello', 'post', {
        contentType: 'json',
        body: { name: 'post json' },
      });

      assert(ok);
      assert.strictEqual(ok.message, 'hello post json');
      assert.strictEqual(err, null);
      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('invoke err', async () => {
      const [ok, err, res] = await hello('hello', 'post', {
        contentType: 'json',
        body: { name: '' },
      });

      assert.strictEqual(ok, null);
      assert(err);
      assert.strictEqual(err.message, 'missing body .name');
      assert(!res.ok);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('raw', async () => {
      const res = await hello.raw('hello', 'post', {
        contentType: 'json',
        body: { name: 'post json' },
      });

      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.strictEqual(await res.text(), '{"message":"hello post json"}');
    });
  });

  describe('GET /hello/:name', () => {
    it('invoke ok', async () => {
      const [ok, err, res] = await hello('hello/get route', 'get');

      assert(ok);
      assert.strictEqual(ok.message, 'hello get route');
      assert.strictEqual(err, null);
      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('raw', async () => {
      const res = await hello.raw('hello/get route', 'get');

      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.strictEqual(await res.text(), '{"message":"hello get route"}');
    });
  });

  describe('GET /secure/hello?name=', () => {
    it('invoke ok', async () => {
      const [ok, err, res] = await hello('secure/hello', 'get', {
        headers: {
          authorization: 'Bearer secret',
        },
        query: { name: 'get query secure' },
      });

      assert(ok);
      assert.strictEqual(ok.message, 'hello get query secure');
      assert.strictEqual(err, null);
      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('invoke err', async () => {
      const [ok, err, res] = await hello('secure/hello', 'get', {
        headers: {
          authorization: 'Bearer invalid',
        },
        query: { name: 'get query secure' },
      });

      assert.strictEqual(ok, null);
      assert(err);
      assert.strictEqual(err.message, 'forbidden');
      assert(!res.ok);
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    });

    it('raw', async () => {
      const res = await hello.raw('secure/hello', 'get', {
        headers: {
          authorization: 'Bearer secret',
        },
        query: { name: 'get query secure' },
      });

      assert(res.ok);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.strictEqual(await res.text(), '{"message":"hello get query secure"}');
    });
  });
});
