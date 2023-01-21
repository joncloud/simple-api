// TODO This should go into another package

export type BodyMethods = 'post' | 'put' | 'delete' | 'patch';

export type StringKeyOf<T> = Extract<keyof T, string>;

export type ApiRoute<T, U extends keyof T> = T[U];
export type ApiMethod<T, U extends keyof T, V extends keyof ApiRoute<T, U>> = ApiRoute<T, U>[V];

export type RecursivePartial<T> =
  {
    [P in keyof T]?: RecursivePartial<T[P]>;
  };

export type ApiOk<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  ApiMethod<T, U, V> extends { ok: infer S } ? S : never;
export type ApiErr<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  ApiMethod<T, U, V> extends { err: infer F } ? F : never;

export type ApiResult<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  readonly [
    RecursivePartial<ApiOk<T, U, V>> | null,
    RecursivePartial<ApiErr<T, U, V>> | null,
    Response,
  ];

export type ApiBody<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  V extends BodyMethods
    ? ApiMethod<T, U, V> extends { body: infer B } ? B : never
    : never;

export type ApiQuery<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  ApiMethod<T, U, V> extends { query: infer Q }
    ? { query: Q }
    : { };

export type ApiHeaders<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  ApiMethod<T, U, V> extends { headers: infer H }
    ? { headers: H }
    : { };

export type ApiBodyFields<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  ApiBody<T, U, V> extends never
    ? { } // Add nothing
    : ApiBody<T, U, V> extends [infer W, infer X]
      ? { // Add content type and body
          contentType: W,
          body: X,
        }
      : { // Add just body
          body: ApiBody<T, U, V>,
        };

export type InvocationOptions<T, U extends keyof T, V extends keyof ApiRoute<T, U>> =
  ApiHeaders<T, U, V>
  & ApiQuery<T, U, V>
  & ApiBodyFields<T, U, V>;

export type FetchInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

export type InvocationArgs<T, U extends keyof T, V extends StringKeyOf<ApiRoute<T, U>>> =
  [keyof InvocationOptions<T, U, V>] extends [never]
    ? readonly [route: U, method: V, init?: FetchInit]
    : readonly [route: U, method: V, options: InvocationOptions<T, U, V>, init?: FetchInit];

export const valueIsEncodable = (value: unknown): value is string | number | boolean => {
  return typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean';
};

export const createQueryString = (o: unknown): string => {
  if (!o || typeof o !== 'object') {
    return '';
  }

  let queryString = '';
  let join = '?';
  for (const [key, value] of Object.entries(o)) {
    queryString += join;
    queryString += encodeURIComponent(key);
    queryString += '=';
    if (valueIsEncodable(value)) {
      queryString += encodeURIComponent(value);
    }
    join = '&';
  }
  return queryString;
};

export const hasNonNullStringField = <T extends string>(key: T, o: Record<string, unknown> | undefined): o is Record<T, string> => {
  if (!o) {
    return false;
  }
  if (!(key in o)) {
    return false;
  }
  const value = o[key];
  if (typeof value !== 'string') {
    return false;
  }
  return !!value;
};

export const hasNonNullObjectField = <T extends string>(key: T, o: Record<string, unknown> | undefined): o is Record<T, object> => {
  if (!o) {
    return false;
  }
  if (!(key in o)) {
    return false;
  }
  const value = o[key];
  if (typeof value !== 'object') {
    return false;
  }
  return !!value;
};

export const getContentType = (contentType: string) => {
  const slashIndex = contentType.indexOf('/');
  if (slashIndex === -1) {
    return contentType;
  }
  const semicolonIndex = contentType.indexOf(';');
  if (semicolonIndex === -1) {
    return contentType.substring(slashIndex + 1);
  }
  return contentType.substring(slashIndex + 1, semicolonIndex);
};

export type Serializer = readonly [
  to: (o: unknown) => BodyInit,
  from: (res: Response) => Promise<unknown>,
];
export type Serializers = Record<string, Serializer>;

export class MissingSerializerError extends Error {
  constructor(readonly contentType: string) {
    super(`Missing ${contentType} serializer`);
  }
};

export const api = <T>(rootUrl: string, serializers: Serializers) => {
  const serialize = (contentType: string, body: unknown) => {
    const serializer = serializers[contentType];
    if (!serializer) {
      throw new MissingSerializerError(contentType);
    }
    const [to] = serializer;
    return to(body);
  };
  const reqContentType = (contentType: string) => {
    return `application/${contentType}`;
  };
  const deserialize = async (res: Response) => {
    const contentType = getContentType(
      res.headers.get('content-type') || 'json'
    );
    const serializer = serializers[contentType];
    if (!serializer) {
      throw new MissingSerializerError(contentType);
    }
    const [, from] = serializer;
    const body = await from(res);
    return body;
  };
  const raw = async <U extends keyof T, V extends StringKeyOf<T[U]> & string>(
    ...[
      route,
      method,
      options,
      init,
    ]: InvocationArgs<T, U, V>): Promise<Response> => {
    let url = rootUrl;
    url += `/${route as string}`;
    if (hasNonNullObjectField('query', options)) {
      url += createQueryString(options.query);
    }

    const headers = {
      ...(hasNonNullObjectField('headers', options)
        ? options.headers
        : { }),
      ...(hasNonNullStringField('contentType', options)
        ? { 'content-type': reqContentType(options.contentType) }
        : { }),
    };

    const body = hasNonNullObjectField('body', options) &&
      hasNonNullStringField('contentType', options)
      ? serialize(options.contentType, options.body)
      : null;

    const res = await fetch(url, {
      ...init,
      method: method.toUpperCase(),
      body,
      headers,
    });
    return res;
  };
  const invoke = async <U extends keyof T, V extends StringKeyOf<T[U]> & string>(
    ...[
      route,
      method,
      options,
      init,
    ]: InvocationArgs<T, U, V>
  ): Promise<ApiResult<T, U, V>> => {
    // TODO share res logic with raw
    let url = rootUrl;
    url += `/${route as string}`;
    if (hasNonNullObjectField('query', options)) {
      url += createQueryString(options.query);
    }

    const headers = {
      ...(hasNonNullObjectField('headers', options)
        ? options.headers
        : { }),
      'content-type': 'application/json',
    };

    const body = hasNonNullObjectField('body', options) &&
      hasNonNullStringField('contentType', options)
      ? serialize(options.contentType, options.body)
      : null;

    const res = await fetch(url, {
      ...init,
      method: method.toUpperCase(),
      body,
      headers,
    });

    const resBody = await deserialize(res);
    if (res.ok) {
      return [resBody as RecursivePartial<ApiOk<T, U, V>>, null, res] as const;
    }
    return [null, resBody as RecursivePartial<ApiErr<T, U, V>>, res] as const;
  };
  invoke.raw = raw;
  return invoke;
};
