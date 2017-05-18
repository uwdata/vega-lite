import {DateTime} from './datetime';
import {Guide, VlOnlyGuideConfig} from './guide';
import {VgAxisBase, VgAxisConfig, VgAxisEncode} from './vega.schema';

export type AxisOrient = 'top' | 'right' | 'left' | 'bottom';


export interface AxisConfig extends VgAxisConfig, VlOnlyGuideConfig {}

export interface Axis extends VgAxisBase, Guide {
  /**
   * The padding, in pixels, between axis and text labels.
   */
  labelPadding?: number;

  /**
   * The orientation of the axis. One of top, bottom, left or right. The orientation can be used to further specialize the axis type (e.g., a y axis oriented for the right edge of the chart).
   *
   * __Default value:__ `"x"` axis is placed on the bottom, `"y"` axis is placed on the left, `"column"`"s x-axis is placed on the top, `"row"`s y-axis is placed on the right.
   */
  orient?: AxisOrient;

  /**
   * The offset, in pixels, by which to displace the axis from the edge of the enclosing group or data rectangle.
   *
   * __Default value:__ derived from  [axis config](config.html#facet-scale-config)'s `offset` (`0` by default)
   */
  offset?: number;

  /**
   * The anchor position of the axis in pixels. For x-axis with top or bottom orientation, this sets the axis group x coordinate. For y-axis with left or right orientation, this sets the axis group y coordinate.
   *
   * __Default value__: `0`
   */
  position?: number;

  /**
   * A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are "nice" (multiples of 2, 5, 10) and lie within the underlying scale's range.
   * @minimum 0
   * @TJS-type integer
   */
  tickCount?: number;

  /**
   * Explicitly set the visible axis tick values.
   */
  values?: number[] | DateTime[];

  /**
   * A non-positive integer indicating z-index of the axis.
   * If zindex is 0, axes should be drawn behind all chart elements.
   * To put them in front, use `"zindex = 1"`.
   *
   * __Default value:__ `0` (Behind the marks.)
   *
   * @TJS-type integer
   * @minimum 0
   */
  zindex?: number;

  /**
   * Optional mark definitions for custom axis encoding.
   */
  encode?: VgAxisEncode;
}

export const AXIS_PROPERTIES:(keyof Axis)[] = [
  'domain', 'format', 'grid', 'labelPadding', 'labels', 'maxExtent', 'minExtent', 'offset', 'orient', 'position', 'tickCount', 'ticks', 'tickSize', 'title', 'titlePadding', 'values', 'zindex'
];



export interface AxisConfigMixins {
  /** Generic axis config. */
  axis?: AxisConfig;

  /**
   * X-axis specific config.
   */
  axisX?: VgAxisConfig;

  /**
   * Y-axis specific config.
   */
  axisY?: VgAxisConfig;

  /**
   * Specific axis config for y-axis along the left edge of the chart.
   */
  axisLeft?: VgAxisConfig;

  /**
   * Specific axis config for y-axis along the right edge of the chart.
   */
  axisRight?: VgAxisConfig;

  /**
   * Specific axis config for x-axis along the top edge of the chart.
   */
  axisTop?: VgAxisConfig;

  /**
   * Specific axis config for x-axis along the bottom edge of the chart.
   */
  axisBottom?: VgAxisConfig;

  /**
   * Specific axis config for axes with "band" scales.
   */
  axisBand?: VgAxisConfig;
}
