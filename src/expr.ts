import {isArray, isObject, SignalRef} from 'vega';
import {signalRefOrValue} from './compile/common';
import {Dict, keys} from './util';
import {SubstituteType} from './vega.schema';

export interface ExprRef {
  /**
   * Vega expression (which can refer to Vega-Lite parameters).
   */
  expr: string;
}

export function isExprRef(o: any): o is ExprRef {
  return o && !!o['expr'];
}

export type SubstituteSignalWithExpr<T> = SubstituteType<T, SignalRef, ExprRef | SignalRef>;

export function deepReplaceExprRef<T>(o: T): SubstituteType<T, ExprRef, SignalRef> {
  if (isExprRef(o)) {
    const {expr, ...rest} = o;
    return {
      signal: expr,
      ...deepReplaceExprRef(rest)
    } as any;
  }

  if (isArray(o)) {
    return o.map(deepReplaceExprRef) as any;
  }

  if (isObject(o)) {
    const r: Dict<any> = {};
    for (const [k, v] of Object.entries(o)) {
      if (k === 'values') {
        // ignore iterating into data
        r[k] = v;
      } else {
        r[k] = deepReplaceExprRef(v);
      }
    }
    return r as any;
  }

  return o as any;
}

// TODO: remove
export function replaceExprRef<T extends Dict<any>>(index: T) {
  const props = keys(index || {});
  const newIndex: Dict<any> = {};
  for (const prop of props) {
    newIndex[prop] = signalRefOrValue(index[prop]);
  }
  return newIndex as MappedExclude<T, ExprRef>;
}

export type MappedExclude<T, E> = {
  [P in keyof T]: Exclude<T[P], E>;
};
