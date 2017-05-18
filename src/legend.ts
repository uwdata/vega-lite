import {DateTime} from './datetime';
import {Guide, VlOnlyGuideConfig} from './guide';
import {VgLegendBase, VgLegendConfig, VgLegendEncode} from './vega.schema';

export interface LegendConfig extends VgLegendConfig, VlOnlyGuideConfig {}

/**
 * Properties of a legend or boolean flag for determining whether to show it.
 */
export interface Legend extends VgLegendBase, Guide {
  /**
   * Optional mark definitions for custom legend encoding.
   */
  encode?: VgLegendEncode;

  /**
   * The desired number of tick values for quantitative legends.
   */
  tickCount?: number;

  /**
   * Explicitly set the visible legend values.
   */
  values?: number[] | string[] | DateTime[];

  /**
   * The type of the legend. Use `symbol` to create a discrete legend and `gradient` for a continuous color gradient.
   */
  type?: 'symbol' | 'gradient';

  /**
   * A non-positive integer indicating z-index of the legend.
   * If zindex is 0, legend should be drawn behind all chart elements.
   * To put them in front, use zindex = 1.
   * @TJS-type integer
   * @minimum 0
   */
  zindex?: number;
}

export const defaultLegendConfig: LegendConfig = {
  orient: undefined, // implicitly "right"
};

export const LEGEND_PROPERTIES:(keyof Legend)[] = ['entryPadding', 'format', 'offset', 'orient', 'tickCount', 'title', 'type', 'values' ,'zindex'];
