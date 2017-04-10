import {AxisConfig} from './axis';
import {defaultLegendConfig, LegendConfig} from './legend';
import {BarConfig, MarkConfig, TextConfig, TickConfig} from './mark';
import * as mark from './mark';
import {defaultScaleConfig, ScaleConfig} from './scale';
import {defaultConfig as defaultSelectionConfig, SelectionConfig} from './selection';
import {StackOffset} from './stack';
import {TopLevelProperties} from './toplevelprops';
import {duplicate, mergeDeep} from './util';
import {VgRangeScheme} from './vega.schema';

export interface CellConfig {
  width?: number;
  height?: number;

  clip?: boolean;

  // FILL_STROKE_CONFIG
  /**
   * The fill color.
   */
  fill?: string;

  /** The fill opacity (value between [0,1]). */
  fillOpacity?: number;

  /** The stroke color. */
  stroke?: string;

  /** The stroke opacity (value between [0,1]). */
  strokeOpacity?: number;

  /** The stroke width, in pixels. */
  strokeWidth?: number;

  /** An array of alternating stroke, space lengths for creating dashed or dotted lines. */
  strokeDash?: number[];

  /** The offset (in pixels) into which to begin drawing with the stroke dash array. */
  strokeDashOffset?: number;
}

export const defaultCellConfig: CellConfig = {
  width: 200,
  height: 200,
  fill: 'transparent'
};

export const defaultFacetCellConfig: CellConfig = {
  stroke: '#ccc',
  strokeWidth: 1
};

export interface FacetConfig {
  /** Facet Axis Config */
  axis?: AxisConfig;

  /** Facet Grid Config */
  grid?: FacetGridConfig;

  /** Facet Cell Config */
  cell?: CellConfig;
}

export interface FacetGridConfig {
  color?: string;
  opacity?: number;
  offset?: number;
}

const defaultFacetGridConfig: FacetGridConfig = {
  color: '#000000',
  opacity: 0.4,
  offset: 0
};

export const defaultFacetConfig: FacetConfig = {
  axis: {},
  grid: defaultFacetGridConfig,
  cell: defaultFacetCellConfig
};

export type AreaOverlay = 'line' | 'linepoint' | 'none';

export interface OverlayConfig {
  /**
   * Whether to overlay line with point.
   */
  line?: boolean;

  /**
   * Type of overlay for area mark (line or linepoint)
   */
  area?: AreaOverlay;
}

export const defaultOverlayConfig: OverlayConfig = {
  line: false
};

export type RangeConfig = (number|string)[] | VgRangeScheme | {step: number};

export interface Config  extends TopLevelProperties {
  // TODO: add this back once we have top-down layout approach
  // width?: number;
  // height?: number;

  /**
   * D3 Number format for axis labels and text tables. For example "s" for SI units.
   */
  numberFormat?: string;

  /**
   * Default datetime format for axis and legend labels. The format can be set directly on each axis and legend.
   */
  timeFormat?: string;

  /**
   * Default maximum number of bins for binned variables.
   * @minimum 0
   * @TJS-type integer
   */
  maxbins?: number;

  /**
   * Default axis and legend title for count fields.
   * @type {string}
   */
  countTitle?: string;

  /** Cell Config */
  cell?: CellConfig;

  /** Default stack offset for stackable mark. */
  stack?: StackOffset;

  /** Mark Config */
  mark?: MarkConfig;

  // MARK-SPECIFIC CONFIGS
  /** Area-Specific Config */
  area?: MarkConfig;

  /** Bar-Specific Config */
  bar?: BarConfig;

  /** Circle-Specific Config */
  circle?: MarkConfig;

  /** Line-Specific Config */
  line?: MarkConfig;

  /** Point-Specific Config */
  point?: MarkConfig;

  /** Rect-Specific Config */
  rect?: MarkConfig;

  /** Rule-Specific Config */
  rule?: MarkConfig;

  /** Square-Specific Config */
  square?: MarkConfig;

  /** Text-Specific Config */
  text?: TextConfig;

  /** Tick-Specific Config */
  tick?: TickConfig;

  // OTHER CONFIG

  // FIXME: move this to line/area
  /** Mark Overlay Config */
  overlay?: OverlayConfig;

  /** Scale Config */
  scale?: ScaleConfig;

  /**
   * Scale range config, or properties defining named range arrays
   * that can be used within scale range definitions
   * (such as `{"type": "ordinal", "range": "category"}`).
   * For default range that Vega-Lite adopts from Vega, see https://github.com/vega/vega-parser#scale-range-properties.
   */
  range?: {[name: string]: RangeConfig};

  /** Generic axis config. */
  axis?: AxisConfig;

  /**
   * X-axis specific config.
   */
  axisX?: AxisConfig;

  /**
   * Y-axis specific config.
   */
  axisY?: AxisConfig;

  /**
   * Specific axis config for y-axis along the left edge of the chart.
   */
  axisLeft?: AxisConfig;

  /**
   * Specific axis config for y-axis along the right edge of the chart.
   */
  axisRight?: AxisConfig;

  /**
   * Specific axis config for x-axis along the top edge of the chart.
   */
  axisTop?: AxisConfig;

  /**
   * Specific axis config for x-axis along the bottom edge of the chart.
   */
  axixBottom?: AxisConfig;

  /**
   * Specific axis config for axes with "band" scales.
   */
  axisBand?: AxisConfig;

  /** Legend Config */
  legend?: LegendConfig;

  /** Facet Config */
  facet?: FacetConfig;

  /** Selection Config */
  selection?: SelectionConfig;

  /** Filter all null values. */
  filterInvalid?: boolean;

  // Support arbitrary key for role config
  // Note: Technically, the type for role config should be `MarkConfig`.
  // However, Typescript requires that the index type must be compatible with all other properties.
  // Basically, it will complain that `legend: LegendConfig` is not an instance of `MarkConfig`
  // Thus, we have to use `any` here.
  [role: string]: any;
}

export const defaultConfig: Config = {
  padding: 5,
  numberFormat: 's',
  timeFormat: '%b %d, %Y',
  maxbins: 10,
  countTitle: 'Number of Records',

  cell: defaultCellConfig,

  mark: mark.defaultMarkConfig,
  area: {},
  bar: mark.defaultBarConfig,
  circle: {},
  line: {},
  point: {},
  rect: {},
  rule: {},
  square: {},
  text: mark.defaultTextConfig,
  tick: mark.defaultTickConfig,

  overlay: defaultOverlayConfig,
  scale: defaultScaleConfig,
  axis: {},
  axisX: {},
  axisY: {},
  axisLeft: {},
  axisRight: {},
  axisTop: {},
  axisBottom: {},
  axisBand: {},
  legend: defaultLegendConfig,

  facet: defaultFacetConfig,

  selection: defaultSelectionConfig,
};

export function initConfig(config: Config) {
  return mergeDeep(duplicate(defaultConfig), config);
}
