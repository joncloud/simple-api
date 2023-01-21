import express, { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { GeneralMessage, Person } from './hello.zod';

export type GeneralMessage = z.infer<typeof GeneralMessage>;
export type Person = z.infer<typeof Person>;

export const sendGeneralMessage = (res: Response, status: number, message: string) => {
  return res.status(status).json(GeneralMessage.parse({ message }));
};

export const createServer = (app: Express) => {
  const errorHandler = (fn: (req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        fn(req, res, next);
      } catch (err) {
        console.error('unexpected error', err);
        return sendGeneralMessage(res, 500, 'unexpected error');
      }
    };
  };

  app.get('/hello', errorHandler((req, res) => {
    const parse = Person.safeParse(req.query);
    if (parse.success) {
      const { name } = parse.data;
      return sendGeneralMessage(res, 200, `hello ${name}`);
    }
    return sendGeneralMessage(res, 400, 'missing query .name');
  }));

  app.get('/hello/:name', errorHandler((req, res) => {
    const parse = Person.safeParse(req.params);
    if (parse.success) {
      const { name } = parse.data;
      return sendGeneralMessage(res, 200, `hello ${name}`);
    }
    return sendGeneralMessage(res, 400, 'missing route .name');
  }));

  app.post('/hello', express.json(), errorHandler((req, res) => {
    const parse = Person.safeParse(req.body);
    if (parse.success) {
      const { name } = parse.data;
      return sendGeneralMessage(res, 200, `hello ${name}`);
    }
    return sendGeneralMessage(res, 400, 'missing body .name');
  }));

  app.get('/secure/hello', errorHandler((req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer')) {
      return sendGeneralMessage(res, 401, 'unauthorized');
    }
    if (authorization !== 'Bearer secret') {
      return sendGeneralMessage(res, 403, 'forbidden');
    }
    return next();
  }), errorHandler((req, res) => {
    const parse = Person.safeParse(req.query);
    if (parse.success) {
      const { name } = parse.data;
      return sendGeneralMessage(res, 200, `hello ${name}`);
    }
    return sendGeneralMessage(res, 400, 'missing query .name');
  }));
};
