/// <reference path="../typings/datalib.d.ts"/>
/// <reference path="../typings/json-stable-stringify.d.ts"/>

import * as stringify from 'json-stable-stringify';
export {keys, extend, duplicate, isArray, vals, truncate, toMap, isObject, isString, isNumber, isBoolean} from 'datalib/src/util';
import {duplicate as _duplicate} from 'datalib/src/util';
export {range} from 'datalib/src/generate';

import {isString, isNumber, isBoolean} from 'datalib/src/util';

/**
 * Creates an object composed of the picked object properties.
 *
 * Example:  (from lodash)
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 * pick(object, ['a', 'c']);
 * // → { 'a': 1, 'c': 3 }
 *
 */
export function pick(obj: any, props: string[]) {
  let copy = {};
  props.forEach((prop) => {
    if (obj.hasOwnProperty(prop)) {
      copy[prop] = obj[prop];
    }
  });
  return copy;
}

/**
 * The opposite of _.pick; this method creates an object composed of the own
 * and inherited enumerable string keyed properties of object that are not omitted.
 */
export function omit(obj: any, props: string[]) {
  let copy = _duplicate(obj);
  props.forEach((prop) => {
    delete copy[prop];
  });
  return copy;
}

export function stableStringify(a: any) {
  if (isString(a) || isNumber(a) || isBoolean(a)) {
    return String(a);
  }
  return stringify(a);
}

export function contains<T>(array: Array<T>, item: T) {
  return array.indexOf(item) > -1;
}

/** Returns the array without the elements in item */
export function without<T>(array: Array<T>, excludedItems: Array<T>) {
  return array.filter(function(item) {
    return !contains(excludedItems, item);
  });
}

export function union<T>(array: Array<T>, other: Array<T>) {
  return array.concat(without(other, array));
}

export function forEach(obj, f: (a, d, k, o) => any, thisArg?) {
  if (obj.forEach) {
    obj.forEach.call(thisArg, f);
  } else {
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        f.call(thisArg, obj[k], k, obj);
      }
    }
  }
}

export function reduce(obj, f: (a, i, d, k, o) => any, init, thisArg?) {
  if (obj.reduce) {
    return obj.reduce.call(thisArg, f, init);
  } else {
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        init = f.call(thisArg, init, obj[k], k, obj);
      }
    }
    return init;
  }
}

export function map<T>(obj, f: (a, d, k, o) => T, thisArg?): T[] {
  if (obj.map) {
    return obj.map.call(thisArg, f);
  } else {
    let output = [];
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        output.push(f.call(thisArg, obj[k], k, obj));
      }
    }
    return output;
  }
}

/**
 * Returns true if any item returns true.
 */
export function some<T>(arr: Array<T>, f: (d: T, k?, i?) => boolean) {
  let i = 0;
  for (let k = 0; k<arr.length; k++) {
    if (f(arr[k], k, i++)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if all items return true.
 */
export function every<T>(arr: Array<T>, f: (d: T, k?, i?) => boolean) {
  let i = 0;
  for (let k = 0; k<arr.length; k++) {
    if (!f(arr[k], k, i++)) {
      return false;
    }
  }
  return true;
}

export function flatten(arrays: any[]) {
  return [].concat.apply([], arrays);
}

export function mergeDeep(dest, ...src: any[]) {
  for (let i = 0; i < src.length; i++) {
    dest = deepMerge_(dest, src[i]);
  }
  return dest;
};

/**
 * recursively merges src into dest
 */
function deepMerge_(dest, src) {
  if (typeof src !== 'object' || src === null) {
    return dest;
  }

  for (let p in src) {
    if (!src.hasOwnProperty(p)) {
      continue;
    }
    if (src[p] === undefined) {
      continue;
    }
    if (typeof src[p] !== 'object' || src[p] === null) {
      dest[p] = src[p];
    } else if (typeof dest[p] !== 'object' || dest[p] === null) {
      dest[p] = mergeDeep(src[p].constructor === Array ? [] : {}, src[p]);
    } else {
      mergeDeep(dest[p], src[p]);
    }
  }
  return dest;
}

// FIXME remove this
import * as dlBin from 'datalib/src/bins/bins';
export function getbins(stats, maxbins) {
  return dlBin({
    min: stats.min,
    max: stats.max,
    maxbins: maxbins
  });
}

/**
 * Returns true if all items are the same.
 */
export function allSame<T>(values: T[], f?: (item: T) => string | number | boolean) {
  if (values.length < 2) {
    return true;
  }
  let v, i;
  const first = f ? f(values[0]) : values[0];
  for (i = 1; i < values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v !== first) {
      return false;
    }
  }
  return true;
}

/**
 * Makes an array unique.
 */
export function unique<T>(values: T[], f?: (item: T) => string | number | boolean): T[] {
  let results = [];
  let u = {}, v, i;
  for (i = 0; i < values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) {
      continue;
    }
    u[v] = 1;
    results.push(values[i]);
  }
  return results;
};

export function warning(message: any) {
  console.warn('[VL Warning]', message);
}

export function error(message: any) {
  console.error('[VL Error]', message);
}

export interface Dict<T> {
  [key: string]: T;
}

export type StringSet = Dict<boolean>;

/**
 * Returns true if the two dicitonaries disagree. Applies only to defined values.
 */
export function differ<T>(dict: Dict<T>, other: Dict<T>) {
  for (let key in dict) {
    if (dict.hasOwnProperty(key)) {
      if (other[key] && dict[key] && other[key] !== dict[key]) {
        return true;
      }
    }
  }
  return false;
}
