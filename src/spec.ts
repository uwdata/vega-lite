/* Utilities for a Vega-Lite specificiation */

import {FieldDef} from './fielddef';
// Package of defining Vega-lite Specification's json schema

import {Config} from './config';
import {Data} from './data';
import {Encoding} from './encoding';
import {Facet} from './facet';
import {Mark} from './mark';
import {Transform} from './transform';

import {COLOR, SHAPE} from './channel';
import * as vlEncoding from './encoding';
import {BAR, AREA} from './mark';
import {duplicate} from './util';

export interface BaseSpec {
  name?: string;
  description?: string;
  data?: Data;
  transform?: Transform;
  config?: Config;
}

/**
 * Schema for a single Vega-Lite specification.
 *
 * Note: the spec could contain facet.
 *
 * @required ["mark", "encoding"]
 */
export interface SingleSpec extends BaseSpec {
  /**
   * A name for the specification. The name is used to annotate marks, scale names, and more.
   */
  mark: Mark;
  encoding: Encoding;
}

export interface FacetSpec extends BaseSpec {
  facet: Facet;
  // FIXME: Ideally FacetSpec but this leads to infinite loop in generating schema
  spec: SingleSpec;
}

export type Spec = SingleSpec | FacetSpec;

// TODO: add vl.spec.validate & move stuff from vl.validate to here

export function alwaysNoOcclusion(spec: SingleSpec): boolean {
  // FIXME raw OxQ with # of rows = # of O
  return vlEncoding.isAggregate(spec.encoding);
}

export function fieldDefs(spec: SingleSpec): FieldDef[] {
  // TODO: refactor this once we have composition
  return vlEncoding.fieldDefs(spec.encoding);
};

export function getCleanSpec(spec: SingleSpec): SingleSpec {
  // TODO: move toSpec to here!
  return spec;
}

export function isStack(spec: SingleSpec): boolean {
  return (vlEncoding.has(spec.encoding, COLOR) || vlEncoding.has(spec.encoding, SHAPE)) &&
    (spec.mark === BAR || spec.mark === AREA) &&
    (!spec.config || !spec.config.mark.stacked !== false) &&
    vlEncoding.isAggregate(spec.encoding);
}

// TODO revise
export function transpose(spec: SingleSpec): SingleSpec {
  const oldenc = spec.encoding;
  let encoding = duplicate(spec.encoding);
  encoding.x = oldenc.y;
  encoding.y = oldenc.x;
  encoding.row = oldenc.column;
  encoding.column = oldenc.row;
  spec.encoding = encoding;
  return spec;
}
