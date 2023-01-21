import assert from 'assert';
import { describe, it } from 'mocha';

import {
  createQueryString,
  getContentType,
  hasNonNullObjectField,
  hasNonNullStringField,
  valueIsEncodable
} from './api';

describe('api', () => {
  describe('valueIsEncodable', () => {
    const testCase = (valueName: string, value: unknown, expected: boolean) => {
      it(`should return ${expected}, given ${valueName}`, () => {
        const actual = valueIsEncodable(value);
        assert.strictEqual(actual, expected);
      });
    };
    testCase('string', 'abc', true);
    testCase('number', 123, true);
    testCase('boolean', false, true);
    testCase('object', { }, false);
    testCase('array', [], false);
    testCase('Date', new Date(), false);
  });

  describe('createQueryString', () => {
    it('should return empty, given null o', () => {
      const o = null;

      const actual = createQueryString(o);
      const expected = '';

      assert.strictEqual(actual, expected);
    });

    it('should return empty, given undefined o', () => {
      const o = undefined;

      const actual = createQueryString(o);
      const expected = '';

      assert.strictEqual(actual, expected);
    });

    it('should return empty, given string o', () => {
      const o = 'abc';

      const actual = createQueryString(o);
      const expected = '';

      assert.strictEqual(actual, expected);
    });

    it('should return encoded components, given object o', () => {
      const o = {
        'foo bar': 'abc 123'
      };

      const actual = createQueryString(o);
      const expected = '?foo%20bar=abc%20123'

      assert.strictEqual(actual, expected);
    });

    it('should return joined components by &, given multi field object o', () => {
      const o = {
        foo: 'abc',
        bar: '123',
      };

      const actual = createQueryString(o);
      const expected = '?foo=abc&bar=123'

      assert.strictEqual(actual, expected);
    });
  });

  describe('hasNonNullStringField', () => {
    it('should return false, given undefined o', () => {
      const key = 'abc';
      const o = undefined;

      const actual = hasNonNullStringField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given key is not in o', () => {
      const key = 'abc';
      const o = { };

      const actual = hasNonNullStringField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given o[key] is not a string', () => {
      const key = 'abc';
      const o = { [key]: { } };

      const actual = hasNonNullStringField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given o[key] is null', () => {
      const key = 'abc';
      const o = { [key]: null };

      const actual = hasNonNullStringField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given o[key] is a string', () => {
      const key = 'abc';
      const o = { [key]: 'def' };

      const actual = hasNonNullStringField(key, o);
      const expected = true;

      assert.strictEqual(actual, expected);
    });
  });

  describe('hasNonNullObjectField', () => {
    it('should return false, given undefined o', () => {
      const key = 'abc';
      const o = undefined;

      const actual = hasNonNullObjectField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given key is not in o', () => {
      const key = 'abc';
      const o = { };

      const actual = hasNonNullObjectField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given o[key] is not a string', () => {
      const key = 'abc';
      const o = { [key]: 'def' };

      const actual = hasNonNullObjectField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given o[key] is null', () => {
      const key = 'abc';
      const o = { [key]: null };

      const actual = hasNonNullObjectField(key, o);
      const expected = false;

      assert.strictEqual(actual, expected);
    });

    it('should return false, given o[key] is a string', () => {
      const key = 'abc';
      const o = { [key]: { } };

      const actual = hasNonNullObjectField(key, o);
      const expected = true;

      assert.strictEqual(actual, expected);
    });
  });

  describe('getContentType', () => {
    it('should return contentType, given no slash in contentType', () => {
      const contentType = 'test';

      const expected = contentType;
      const actual = getContentType(contentType);

      assert.strictEqual(actual, expected);
    });

    it('should return subtype of contentType, given no semicolon in contentType', () => {
      const contentType = 'test/tset';

      const expected = 'tset';
      const actual = getContentType(contentType);

      assert.strictEqual(actual, expected);
    });

    it('should return subtype of contentType exluding params, given semicolon in contentType', () => {
      const contentType = 'test/tset;foo=bar;lorem=ipsum';

      const expected = 'tset';
      const actual = getContentType(contentType);

      assert.strictEqual(actual, expected);
    });
  });
});
