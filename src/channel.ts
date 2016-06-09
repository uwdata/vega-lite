/*
 * Constants and utilities for encoding channels (Visual variables)
 * such as 'x', 'y', 'color'.
 */

import {Mark} from './mark';
import {contains, without} from './util';

export enum Channel {
  X = 'x' as any,
  Y = 'y' as any,
  ROW = 'row' as any,
  COLUMN = 'column' as any,
  SHAPE = 'shape' as any,
  SIZE = 'size' as any,
  COLOR = 'color' as any,
  TEXT = 'text' as any,
  ANCHOR = 'anchor' as any,
  OFFSET = 'offset' as any,
  DETAIL = 'detail' as any,
  PATH = 'path' as any,
  ORDER = 'order' as any,
  OPACITY = 'opacity' as any
}

export const X = Channel.X;
export const Y = Channel.Y;
export const ROW = Channel.ROW;
export const COLUMN = Channel.COLUMN;
export const SHAPE = Channel.SHAPE;
export const SIZE = Channel.SIZE;
export const COLOR = Channel.COLOR;
export const TEXT = Channel.TEXT;
export const ANCHOR = Channel.ANCHOR;
export const OFFSET = Channel.OFFSET;
export const DETAIL = Channel.DETAIL;
export const PATH = Channel.PATH;
export const ORDER = Channel.ORDER;
export const OPACITY = Channel.OPACITY;

export const CHANNELS = [X, Y, ROW, COLUMN, SIZE, SHAPE, COLOR, PATH, ORDER, TEXT, DETAIL, ANCHOR, OFFSET];

export const UNIT_CHANNELS = without(CHANNELS, [ROW, COLUMN]);
export const UNIT_SCALE_CHANNELS = without(UNIT_CHANNELS, [PATH, ORDER, DETAIL, TEXT]);
export const NONSPATIAL_CHANNELS = without(UNIT_CHANNELS, [X, Y]);
export const NONSPATIAL_SCALE_CHANNELS = without(UNIT_SCALE_CHANNELS, [X, Y]);

export interface SupportedMark {
  point?: boolean;
  tick?: boolean;
  rule?: boolean;
  circle?: boolean;
  square?: boolean;
  bar?: boolean;
  line?: boolean;
  area?: boolean;
  text?: boolean;
  label?: boolean;
};

/**
 * Return whether a channel supports a particular mark type.
 * @param channel  channel name
 * @param mark the mark type
 * @return whether the mark supports the channel
 */
export function supportMark(channel: Channel, mark: Mark) {
  return !!getSupportedMark(channel)[mark];
}

/**
 * Return a dictionary showing whether a channel supports mark type.
 * @param channel
 * @return A dictionary mapping mark types to boolean values.
 */
export function getSupportedMark(channel: Channel): SupportedMark {
  switch (channel) {
    case X:
    case Y:
    case COLOR:
    case DETAIL:
    case ORDER:
    case OPACITY:
    case ROW:
    case COLUMN:
      return { // all marks
        point: true, tick: true, rule: true, circle: true, square: true,
        bar: true, line: true, area: true, text: true, label: true
      };
    case SIZE:
      return {
        point: true, tick: true, rule: true, circle: true, square: true,
        bar: true, text: true, label: true
      };
    case SHAPE:
      return {point: true};
    case TEXT:
      return {text: true, label: true};
    case ANCHOR:
    case OFFSET:
      return {label: true};
    case PATH:
      return {line: true};
  }
  return {};
}

export interface SupportedRole {
  measure: boolean;
  dimension: boolean;
};

/**
 * Return whether a channel supports dimension / measure role
 * @param  channel
 * @return A dictionary mapping role to boolean values.
 */
export function getSupportedRole(channel: Channel): SupportedRole {
  switch (channel) {
    case X:
    case Y:
    case COLOR:
    case OPACITY:
    case DETAIL:
    case ANCHOR:
    case OFFSET:
      return {
        measure: true,
        dimension: true
      };
    case ROW:
    case COLUMN:
    case SHAPE:
      return {
        measure: false,
        dimension: true
      };
    case SIZE:
    case TEXT:
      return {
        measure: true,
        dimension: false
      };
    case PATH:
      return {
        measure: false,
        dimension: true
      };
  }
  throw new Error('Invalid encoding channel' + channel);
}

export function hasScale(channel: Channel) {
  return !contains([DETAIL, PATH, TEXT, ORDER], channel);
}
