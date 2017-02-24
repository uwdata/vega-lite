import {DateTime} from './datetime';
import {VgAxisEncode, VgAxisBase, VgAxisConfig} from './vega.schema';

export type AxisOrient = 'top' | 'right' | 'left' | 'bottom';

export interface AxisConfig extends VgAxisConfig, VlOnlyAxisBase {
  /**
   * Whether month names and weekday names should be abbreviated.
   */
  shortTimeLabels?: boolean;
}

export const defaultAxisConfig: AxisConfig = {
  labelMaxLength: 25,
};

export const defaultFacetAxisConfig: AxisConfig = {
  domainWidth: 0,
};

export interface Axis extends VgAxisBase, VlOnlyAxisBase {
  /**
   * The padding, in pixels, between axis and text labels.
   */
  labelPadding?: number;

  /**
   * The formatting pattern for axis labels.
   */
  format?: string; // default value determined by config.format anyway

  /**
   * The orientation of the axis. One of top, bottom, left or right. The orientation can be used to further specialize the axis type (e.g., a y axis oriented for the right edge of the chart).
   */
  orient?: AxisOrient;

  /**
   * The offset, in pixels, by which to displace the axis from the edge of the enclosing group or data rectangle.
   */
  offset?: number;

  // FIXME: Add Description
  position?: number;

  /**
   * A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are "nice" (multiples of 2, 5, 10) and lie within the underlying scale's range.
   * @minimum 0
   * @TJS-type integer
   */
  tickCount?: number;

  /**
   * A title for the axis. Shows field name and its function by default.
   */
  title?: string;

  values?: number[] | DateTime[];

  /**
   * A non-positive integer indicating z-index of the axis.
   * If zindex is 0, axes should be drawn behind all chart elements.
   * To put them in front, use zindex = 1.
   * @TJS-type integer
   * @minimum 0
   */
  zindex?: number;

  /**
   * Optional mark definitions for custom axis encoding.
   */
  encode?: VgAxisEncode;
}


/**
 * Base object for properties that are shared between Axis and Axis Config.
 * These properties are not in Vega Axis and Axis Config.
 */
export interface VlOnlyAxisBase {
  /**
   * Truncate labels that are too long.
   * @minimum 1
   * @TJS-type integer
   */
  labelMaxLength?: number;
}

export const AXIS_PROPERTIES:(keyof Axis)[] = [
  // a) properties with special rules (so it has axis[property] methods) -- call rule functions
  'domain', 'format', 'labels', 'grid', 'orient', 'ticks', 'tickSize', 'tickCount',  'title', 'values', 'zindex',
  // b) properties without rules, only produce default values in the schema, or explicit value if specified
    'labelPadding', 'maxExtent', 'minExtent', 'offset', 'position', 'tickSize', 'titlePadding'
];

export const VL_ONLY_AXIS_PROPERTIES:(keyof VlOnlyAxisBase)[] = ['labelMaxLength'];
