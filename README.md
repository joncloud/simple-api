# Simple Typescript API Server and Client

This project is an experimental simple API, which exposes a server and client package.

## Requirements

* Node.js 18

## Server

The server package is built on top of `express`, and leverages `zod` for declaring types for validation.

### Launching the server

```bash
cd packages/server
npm run start
```

## Client

The client package is built by generating Typescript types from the server using `zod-to-ts`, and leverages the type system to expose a factory that creates functions for making strongly typed calls into the server. The resulting function will optionally take parameters based on how the client API is defined:

  1. The route to the API
  2. The method to invoke on the API (GET, POST, etc.)
  3. For methods that define a body - The content type of the request
  4. For methods that define a body, headers or query arguments - An object that includes each of those as fields
  5. An optional remaining argument for any additional `RequestInit` arguments excluding those that have already been specified.

### Creating an API

Creating an API requires two things:

* A generic argument, which defines the API schema
* A parameter, which defines the root URL of the API

```typescript
import { api } from './api';

export type HelloApi =
  {
    'hello': {
      get: {
        query: { name: string },
        ok: { message: string },
        err: { message: string },
      },
    },
  }

const rootUrl = 'http://localhost:3000';
const hello = api<HelloApi>(rootUrl, { });
```

### Invoking the API

When invoking the API the return result includes a tuple with the following entries:

1. The partial type expected when the server responds with an ok status code
2. The partial type expected when the server responds with a non-ok status code
3. The raw response (with the body already read)

```typescript
const [ok, err, res] = await hello('hello', 'get', {
  query: { name: 'get query' },
});
if (ok) {
  console.log('great job!', ok.message);
} else if (err) {
  console.error('uh oh!', err.message);
}
console.debug('http status', res.status);
```

Perform type checking against `ok` and `err` to determine what the server responded with. The API will never return both a non-null `ok` and `err`.

### Raw response access

APIs include a `raw` function, which provides typed access to the parameters, but does not attempt to perform any additional processing on top of the `Response`.

```typescript
const res = await hello.raw('hello', 'get', {
  query: { name: 'get query' },
});
console.log('http body', await res.text());
console.debug('http status', res.status);
```

### Running tests

```bash
cd packages/client
npm run test
```
