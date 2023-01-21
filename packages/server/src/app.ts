import express from 'express';

import { createServer } from './hello.server';

const app = express();
createServer(app);
app.listen(3000, () => {
  console.log('listening on http://*:3000');
});
