import { Person, GeneralMessage } from './hello.gen';
import { api } from './api';

export type AuthRequired = { authorization: `Bearer ${string}` };

export type HelloApi =
  {
    'hello': {
      get: {
        query: Person,
        ok: GeneralMessage,
        err: GeneralMessage,
      },
      post: {
        body: ['json', Person],
        ok: GeneralMessage,
        err: GeneralMessage,
      },
    },
    [key: `hello/${Person['name']}`]: {
      get: {
        ok: GeneralMessage,
        err: GeneralMessage,
      },
    },
    'secure/hello': {
      get: {
        query: Person,
        headers: AuthRequired,
        ok: GeneralMessage,
        err: GeneralMessage,
      },
    },
  };

export const createClient = (rootUrl: string) => {
  return api<HelloApi>(rootUrl, {
    json: [
      (o: unknown) => JSON.stringify(o),
      (res: Response) => res.json(),
    ],
  });
};
