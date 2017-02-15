/*
 * Constants and utilities for encoding channels (Visual variables)
 * such as 'x', 'y', 'color'.
 */
import {Encoding} from './encoding';
import {Facet} from './facet';
import {Mark} from './mark';
import {RangeType} from './compile/scale/type';
import {ScaleType, SCALE_TYPES} from './scale';
import {contains, toSet, without} from './util';

export namespace Channel {
  // Facet
  export const ROW: 'row' = 'row';
  export const COLUMN: 'column' = 'column';

  // Position
  export const X: 'x' = 'x';
  export const Y: 'y' = 'y';
  export const X2: 'x2' = 'x2';
  export const Y2: 'y2' = 'y2';

  // Mark property with scale
  export const COLOR: 'color' = 'color';
  export const SHAPE: 'shape' = 'shape';
  export const SIZE: 'size' = 'size';
  export const OPACITY: 'opacity' = 'opacity';

  // Non-scale channel
  export const TEXT: 'text' = 'text';
  export const ORDER: 'order' = 'order';
  export const DETAIL: 'detail' = 'detail';
  export const OFFSET: 'offset' = 'offset';
  export const ANCHOR: 'anchor' = 'anchor';
}

export type Channel = keyof Encoding | keyof Facet;

export const X = Channel.X;
export const Y = Channel.Y;
export const X2 = Channel.X2;
export const Y2 = Channel.Y2;
export const ROW = Channel.ROW;
export const COLUMN = Channel.COLUMN;
export const SHAPE = Channel.SHAPE;
export const SIZE = Channel.SIZE;
export const COLOR = Channel.COLOR;
export const TEXT = Channel.TEXT;
export const DETAIL = Channel.DETAIL;
export const ANCHOR = Channel.ANCHOR;
export const OFFSET = Channel.OFFSET;
export const ORDER = Channel.ORDER;
export const OPACITY = Channel.OPACITY;

export const CHANNELS = [X, Y, X2, Y2, ROW, COLUMN, SIZE, SHAPE, COLOR, ORDER, OPACITY, OFFSET, ANCHOR, TEXT, DETAIL];

// CHANNELS without COLUMN, ROW
export const UNIT_CHANNELS = [X, Y, X2, Y2, SIZE, SHAPE, COLOR, ORDER, OPACITY, OFFSET, ANCHOR, TEXT, DETAIL];

// UNIT_CHANNELS without X2, Y2, ORDER, DETAIL, TEXT
export const UNIT_SCALE_CHANNELS = [X, Y, SIZE, SHAPE, COLOR, OPACITY];

// UNIT_SCALE_CHANNELS with ROW, COLUMN
export const SCALE_CHANNELS = [X, Y, SIZE, SHAPE, COLOR, OPACITY, ROW, COLUMN];

// UNIT_CHANNELS without X, Y, X2, Y2;
// FIXME: does ANCHOR and OFFSET belong here
export const NONSPATIAL_CHANNELS = [SIZE, SHAPE, COLOR, ORDER, OPACITY, TEXT, DETAIL];

// UNIT_SCALE_CHANNELS without X, Y;
export const NONSPATIAL_SCALE_CHANNELS = [SIZE, SHAPE, COLOR, OPACITY];

/** Channels that can serve as groupings for stacked charts. */
// FIXME: does ANCHOR and OFFSET belong here
export const STACK_GROUP_CHANNELS = [COLOR, DETAIL, ORDER, OPACITY, SIZE];

export interface SupportedMark {
  point?: boolean;
  tick?: boolean;
  rule?: boolean;
  circle?: boolean;
  square?: boolean;
  bar?: boolean;
  rect?: boolean;
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
  return mark in getSupportedMark(channel);
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
    case ORDER:    // TODO: revise (order might not support rect, which is not stackable?)
    case OPACITY:
    case ROW:
    case COLUMN:
      return { // all marks
        point: true, tick: true, rule: true, circle: true, square: true,
        bar: true, rect: true, line: true, area: true, label: true, text: true
      };
    case X2:
    case Y2:
      return {
        rule: true, bar: true, rect: true, area: true
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
    case ORDER:
    case DETAIL:
      return {
        measure: true,
        dimension: true
      };
    case ROW:
    case ANCHOR:
    case COLUMN:
    case SHAPE:
      return {
        measure: false,
        dimension: true
      };
    case OFFSET:
    case X2:
    case Y2:
    case SIZE:
    case TEXT:
      return {
        measure: true,
        dimension: false
      };
  }
  throw new Error('Invalid encoding channel ' + channel);
}

export function hasScale(channel: Channel) {
  return contains(SCALE_CHANNELS, channel);
}

// Position does not work with ordinal (lookup) scale and sequential (which is only for color)
const POSITION_SCALE_TYPE_INDEX = toSet(without(SCALE_TYPES, ['ordinal', 'sequential'] as ScaleType[]));

export function supportScaleType(channel: Channel, scaleType: ScaleType): boolean {
  switch (channel) {
    case ROW:
    case COLUMN:
      return scaleType === 'band'; // row / column currently supports band only
    case X:
    case Y:
    case SIZE: // TODO: size and opacity can support ordinal with more modification
    case OPACITY:
      // Although it generally doesn't make sense to use band with size and opacity,
      // it can also work since we use band: 0.5 to get midpoint.
      return scaleType in POSITION_SCALE_TYPE_INDEX;
    case COLOR:
      return scaleType !== 'band';    // band does not make sense with color
    case SHAPE:
      return scaleType === 'ordinal'; // shape = lookup only
  }
  /* istanbul ignore next: it should never reach here */
  return false;
}

export function getRangeType(channel: Channel): RangeType {
  switch (channel) {
    case X:
    case Y:
    case ROW:
    case COLUMN:
    case SIZE:
    case OPACITY:
      return 'continuous';

    case SHAPE:
      return 'discrete';

    // Color can be either continuous or discrete, depending on scale type.
    case COLOR:
      return 'flexible';

    // No scale, no range type.
    case X2:
    case Y2:
    case ANCHOR:
    case OFFSET:
    case DETAIL:
    case TEXT:
    case ORDER:
      return undefined;
  }
  /* istanbul ignore next: should never reach here. */
  throw new Error('getRangeType not implemented for ' + channel);
}
