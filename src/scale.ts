import type {
  ColorScheme,
  RangeEnum,
  ScaleBins,
  ScaleInterpolateEnum,
  ScaleInterpolateParams,
  SignalRef,
  TimeInterval,
  TimeIntervalStep
} from 'vega';
import {isString, isObject} from 'vega-util';
import * as CHANNEL from './channel';
import {Channel, isColorChannel} from './channel';
import {DateTime} from './datetime';
import {ExprRef} from './expr';
import {ScaleInvalidDataConfigMixins} from './invalid';
import * as log from './log';
import {ParameterExtent} from './selection';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL, Type} from './type';
import {contains, Flag, hasProperty, keys} from './util';

export const ScaleType = {
  // Continuous - Quantitative
  LINEAR: 'linear',
  LOG: 'log',
  POW: 'pow',
  SQRT: 'sqrt',
  SYMLOG: 'symlog',

  IDENTITY: 'identity',
  SEQUENTIAL: 'sequential',

  // Continuous - Time
  TIME: 'time',
  UTC: 'utc',

  // Discretizing scales
  QUANTILE: 'quantile',
  QUANTIZE: 'quantize',
  THRESHOLD: 'threshold',
  BIN_ORDINAL: 'bin-ordinal',

  // Discrete scales
  ORDINAL: 'ordinal',
  POINT: 'point',
  BAND: 'band'
} as const;

type ValueOf<T> = T[keyof T];
export type ScaleType = ValueOf<typeof ScaleType>;

/**
 * Index for scale categories -- only scale of the same categories can be merged together.
 * Current implementation is trying to be conservative and avoid merging scale type that might not work together
 */
export const SCALE_CATEGORY_INDEX: Record<ScaleType, ScaleType | 'numeric' | 'ordinal-position' | 'discretizing'> = {
  linear: 'numeric',
  log: 'numeric',
  pow: 'numeric',
  sqrt: 'numeric',
  symlog: 'numeric',
  identity: 'numeric',
  sequential: 'numeric',
  time: 'time',
  utc: 'time',
  ordinal: 'ordinal',
  'bin-ordinal': 'bin-ordinal', // TODO: should bin-ordinal support merging with other
  point: 'ordinal-position',
  band: 'ordinal-position',
  quantile: 'discretizing',
  quantize: 'discretizing',
  threshold: 'discretizing'
};

export const SCALE_TYPES: ScaleType[] = keys(SCALE_CATEGORY_INDEX);

/**
 * Whether the two given scale types can be merged together.
 */
export function scaleCompatible(scaleType1: ScaleType, scaleType2: ScaleType) {
  const scaleCategory1 = SCALE_CATEGORY_INDEX[scaleType1];
  const scaleCategory2 = SCALE_CATEGORY_INDEX[scaleType2];
  return (
    scaleCategory1 === scaleCategory2 ||
    (scaleCategory1 === 'ordinal-position' && scaleCategory2 === 'time') ||
    (scaleCategory2 === 'ordinal-position' && scaleCategory1 === 'time')
  );
}

/**
 * Index for scale precedence -- high score = higher priority for merging.
 */
const SCALE_PRECEDENCE_INDEX: Record<ScaleType, number> = {
  // numeric
  linear: 0,
  log: 1,
  pow: 1,
  sqrt: 1,
  symlog: 1,
  identity: 1,
  sequential: 1,
  // time
  time: 0,
  utc: 0,
  // ordinal-position -- these have higher precedence than continuous scales as they support more types of data
  point: 10,
  band: 11, // band has higher precedence as it is better for interaction
  // non grouped types
  ordinal: 0,
  'bin-ordinal': 0,
  quantile: 0,
  quantize: 0,
  threshold: 0
};

/**
 * Return scale categories -- only scale of the same categories can be merged together.
 */
export function scaleTypePrecedence(scaleType: ScaleType): number {
  return SCALE_PRECEDENCE_INDEX[scaleType];
}

export const QUANTITATIVE_SCALES = new Set<ScaleType>([
  'linear',
  'log',
  'pow',
  'sqrt',
  'symlog'
]) as ReadonlySet<ScaleType>;

export const CONTINUOUS_TO_CONTINUOUS_SCALES = new Set<ScaleType>([
  ...QUANTITATIVE_SCALES,
  'time',
  'utc'
]) as ReadonlySet<ScaleType>;

export function isQuantitative(type: ScaleType): type is 'linear' | 'log' | 'pow' | 'sqrt' | 'symlog' {
  return QUANTITATIVE_SCALES.has(type);
}

export const CONTINUOUS_TO_DISCRETE_SCALES = new Set<ScaleType>([
  'quantile',
  'quantize',
  'threshold'
]) as ReadonlySet<ScaleType>;

export const CONTINUOUS_DOMAIN_SCALES = new Set<ScaleType>([
  ...CONTINUOUS_TO_CONTINUOUS_SCALES,
  ...CONTINUOUS_TO_DISCRETE_SCALES,
  'sequential',
  'identity'
]) as ReadonlySet<ScaleType>;

export const DISCRETE_DOMAIN_SCALES = new Set<ScaleType>([
  'ordinal',
  'bin-ordinal',
  'point',
  'band'
]) as ReadonlySet<ScaleType>;

export const TIME_SCALE_TYPES = new Set<ScaleType>(['time', 'utc']) as ReadonlySet<ScaleType>;

export function hasDiscreteDomain(type: ScaleType): type is 'ordinal' | 'bin-ordinal' | 'point' | 'band' {
  return DISCRETE_DOMAIN_SCALES.has(type);
}

export function hasContinuousDomain(
  type: ScaleType
): type is 'linear' | 'log' | 'pow' | 'sqrt' | 'symlog' | 'time' | 'utc' | 'quantile' | 'quantize' | 'threshold' {
  return CONTINUOUS_DOMAIN_SCALES.has(type);
}

export function isContinuousToContinuous(
  type: ScaleType
): type is 'linear' | 'log' | 'pow' | 'sqrt' | 'symlog' | 'time' | 'utc' {
  return CONTINUOUS_TO_CONTINUOUS_SCALES.has(type);
}

export function isContinuousToDiscrete(type: ScaleType): type is 'quantile' | 'quantize' | 'threshold' {
  return CONTINUOUS_TO_DISCRETE_SCALES.has(type);
}

export interface ScaleConfig<ES extends ExprRef | SignalRef> extends ScaleInvalidDataConfigMixins {
  /**
   * If true, rounds numeric output values to integers.
   * This can be helpful for snapping to the pixel grid.
   * (Only available for `x`, `y`, and `size` scales.)
   */
  round?: boolean | ES;

  /**
   * If true, values that exceed the data domain are clamped to either the minimum or maximum range value
   */
  clamp?: boolean | ES;

  /**
   * Default inner padding for `x` and `y` band scales with nested `xOffset` and `yOffset` encoding.
   *
   * __Default value:__ `0.2`
   *
   * @minimum 0
   * @maximum 1
   */
  bandWithNestedOffsetPaddingInner?: number | ES;

  /**
   * Default outer padding for `x` and `y` band scales with nested `xOffset` and `yOffset` encoding.
   *
   * __Default value:__ `0.2`
   *
   * @minimum 0
   * @maximum 1
   */
  // Note: nested offset always uses band scale, so we don't need "band" in the name for brevity.
  bandWithNestedOffsetPaddingOuter?: number | ES;

  /**
   * Default inner padding for `x` and `y` band scales.
   *
   * __Default value:__
   * - `nestedOffsetPaddingInner` for x/y scales with nested x/y offset scales.
   * - `barBandPaddingInner` for bar marks (`0.1` by default)
   * - `rectBandPaddingInner` for rect and other marks (`0` by default)
   *
   * @minimum 0
   * @maximum 1
   */
  bandPaddingInner?: number | ES;

  /**
   * Default outer padding for `x` and `y` band scales.
   *
   * __Default value:__ `paddingInner/2` (which makes _width/height = number of unique values * step_)
   *
   * @minimum 0
   * @maximum 1
   */
  bandPaddingOuter?: number | ES;

  /**
   * Default inner padding for `x` and `y` band-ordinal scales of `"bar"` marks.
   *
   * __Default value:__ `0.1`
   *
   * @minimum 0
   * @maximum 1
   */
  barBandPaddingInner?: number | ES;

  /**
   * Default inner padding for `x` and `y` band-ordinal scales of `"rect"` marks.
   *
   * __Default value:__ `0`
   *
   * @minimum 0
   * @maximum 1
   */
  rectBandPaddingInner?: number | ES;

  /**
   * Default inner padding for `x` and `y` band-ordinal scales of `"tick"` marks.
   *
   * __Default value:__ `0.25`
   *
   * @minimum 0
   * @maximum 1
   */
  tickBandPaddingInner?: number | ES;

  /**
   * Default padding inner for xOffset/yOffset's band scales.
   *
   * __Default Value:__ `0`
   */
  offsetBandPaddingInner?: number | ES;

  /**
   * Default padding outer for xOffset/yOffset's band scales.
   *
   * __Default Value:__ `0`
   */
  offsetBandPaddingOuter?: number | ES;

  /**
   * Default padding for continuous x/y scales.
   *
   * __Default:__ The bar width for continuous x-scale of a vertical bar and continuous y-scale of a horizontal bar.; `0` otherwise.
   *
   * @minimum 0
   */
  continuousPadding?: number | ES;

  /**
   * Default outer padding for `x` and `y` point-ordinal scales.
   *
   * __Default value:__ `0.5` (which makes _width/height = number of unique values * step_)
   *
   * @minimum 0
   * @maximum 1
   */
  pointPadding?: number | ES;

  /**
   * Use the source data range before aggregation as scale domain instead of aggregated data for aggregate axis.
   *
   * This is equivalent to setting `domain` to `"unaggregate"` for aggregated _quantitative_ fields by default.
   *
   * This property only works with aggregate functions that produce values within the raw data domain (`"mean"`, `"average"`, `"median"`, `"q1"`, `"q3"`, `"min"`, `"max"`). For other aggregations that produce values outside of the raw data domain (e.g. `"count"`, `"sum"`), this property is ignored.
   *
   * __Default value:__ `false`
   */
  useUnaggregatedDomain?: boolean;

  // nice should depends on type (quantitative or temporal), so
  // let's not make a config.

  // Configs for Range

  /**
   * The default max value for mapping quantitative fields to bar's size/bandSize.
   *
   * If undefined (default), we will use the axis's size (width or height) - 1.
   * @minimum 0
   */
  maxBandSize?: number;

  /**
   * The default min value for mapping quantitative fields to bar and tick's size/bandSize scale.
   *
   * __Default value:__ `2`
   *
   * @minimum 0
   */
  minBandSize?: number;

  /**
   * The default max value for mapping quantitative fields to text's size/fontSize scale.
   *
   * __Default value:__ `40`
   *
   * @minimum 0
   */
  maxFontSize?: number;

  /**
   * The default min value for mapping quantitative fields to text's size/fontSize scale.
   *
   * __Default value:__ `8`
   *
   * @minimum 0
   */
  minFontSize?: number;

  /**
   * Default minimum opacity for mapping a field to opacity.
   *
   * __Default value:__ `0.3`
   *
   * @minimum 0
   * @maximum 1
   */
  minOpacity?: number;

  /**
   * Default max opacity for mapping a field to opacity.
   *
   * __Default value:__ `0.8`
   *
   * @minimum 0
   * @maximum 1
   */
  maxOpacity?: number;

  /**
   * Default minimum value for point size scale.
   *
   * __Default value:__ `9`
   *
   * @minimum 0
   */
  minSize?: number;

  /**
   * Default max value for point size scale.
   * @minimum 0
   */
  maxSize?: number;

  /**
   * Default minimum strokeWidth for the scale of strokeWidth for rule and line marks and of size for trail marks.
   *
   * __Default value:__ `1`
   *
   * @minimum 0
   */
  minStrokeWidth?: number;

  /**
   * Default max strokeWidth for the scale of strokeWidth for rule and line marks and of size for trail marks.
   *
   * __Default value:__ `4`
   *
   * @minimum 0
   */
  maxStrokeWidth?: number;

  /**
   * Default range cardinality for [`quantile`](https://vega.github.io/vega-lite/docs/scale.html#quantile) scale.
   *
   * __Default value:__ `4`
   *
   * @minimum 0
   */
  quantileCount?: number;

  /**
   * Default range cardinality for [`quantize`](https://vega.github.io/vega-lite/docs/scale.html#quantize) scale.
   *
   * __Default value:__ `4`
   *
   * @minimum 0
   */
  quantizeCount?: number;

  /**
   * Reverse x-scale by default (useful for right-to-left charts).
   */
  xReverse?: boolean | ES;

  /**
   * Default `scale.zero` for [`continuous`](https://vega.github.io/vega-lite/docs/scale.html#continuous) scales except for (1) x/y-scales of non-ranged bar or area charts and (2) size scales.
   *
   * __Default value:__ `true`
   *
   */
  zero?: boolean;

  /**
   * Default framerate (frames per second) for [`time`](https://vega.github.io/vega-lite/docs/encoding.html#time) encoding animation [`band`](https://vega.github.io/vega-lite/docs/scale.html#band) scales.
   *
   * __Default value:__ `2`
   *
   */
  framesPerSecond?: number;

  /**
   * Default animation duration (in seconds) for [`time`](https://vega.github.io/vega-lite/docs/encoding.html#time) encodings (except for [`band`](https://vega.github.io/vega-lite/docs/scale.html#band) scales, which use `framesPerSecond` instead).
   *
   * __Default value:__ `5`
   *
   */
  animationDuration?: number;
}

export const defaultScaleConfig: ScaleConfig<SignalRef> = {
  pointPadding: 0.5,

  barBandPaddingInner: 0.1,
  rectBandPaddingInner: 0,
  tickBandPaddingInner: 0.25,

  bandWithNestedOffsetPaddingInner: 0.2,
  bandWithNestedOffsetPaddingOuter: 0.2,

  minBandSize: 2,

  minFontSize: 8,
  maxFontSize: 40,

  minOpacity: 0.3,
  maxOpacity: 0.8,

  // FIXME: revise if these *can* become ratios of width/height step
  minSize: 4, // Point size is area. For square point, 9 = 3 pixel ^ 2, not too small!

  minStrokeWidth: 1,
  maxStrokeWidth: 4,
  quantileCount: 4,
  quantizeCount: 4,

  zero: true,

  framesPerSecond: 2,
  animationDuration: 5
};

export interface SchemeParams {
  /**
   * A color scheme name for ordinal scales (e.g., `"category10"` or `"blues"`).
   *
   * For the full list of supported schemes, please refer to the [Vega Scheme](https://vega.github.io/vega/docs/schemes/#reference) reference.
   */
  name: ColorScheme | SignalRef;

  /**
   * The extent of the color range to use. For example `[0.2, 1]` will rescale the color scheme such that color values in the range _[0, 0.2)_ are excluded from the scheme.
   */
  extent?: (number | SignalRef)[] | SignalRef;

  /**
   * The number of colors to use in the scheme. This can be useful for scale types such as `"quantize"`, which use the length of the scale range to determine the number of discrete bins for the scale domain.
   */
  count?: number | SignalRef;
}

export type Domain =
  | (null | string | number | boolean | DateTime | SignalRef)[]
  | 'unaggregated'
  | ParameterExtent
  | SignalRef
  | DomainUnionWith;

export type Scheme = string | SchemeParams;

export function isExtendedScheme(scheme: Scheme | SignalRef): scheme is SchemeParams {
  return !isString(scheme) && hasProperty(scheme, 'name');
}

export function isParameterDomain(domain: Domain): domain is ParameterExtent {
  return hasProperty(domain, 'param');
}

export interface DomainUnionWith {
  /**
   * Customized domain values to be union with the field's values or explicitly defined domain.
   * Should be an array of valid scale domain values.
   */
  unionWith: (number | string | boolean | DateTime)[];
}

export function isDomainUnionWith(domain: Domain): domain is DomainUnionWith {
  return hasProperty(domain, 'unionWith');
}

export interface FieldRange {
  field: string;
}

export function isFieldRange(range: any): range is FieldRange {
  return isObject(range) && 'field' in range;
}

export interface Scale<ES extends ExprRef | SignalRef = ExprRef | SignalRef> {
  /**
   * The type of scale. Vega-Lite supports the following categories of scale types:
   *
   * 1) [**Continuous Scales**](https://vega.github.io/vega-lite/docs/scale.html#continuous) -- mapping continuous domains to continuous output ranges ([`"linear"`](https://vega.github.io/vega-lite/docs/scale.html#linear), [`"pow"`](https://vega.github.io/vega-lite/docs/scale.html#pow), [`"sqrt"`](https://vega.github.io/vega-lite/docs/scale.html#sqrt), [`"symlog"`](https://vega.github.io/vega-lite/docs/scale.html#symlog), [`"log"`](https://vega.github.io/vega-lite/docs/scale.html#log), [`"time"`](https://vega.github.io/vega-lite/docs/scale.html#time), [`"utc"`](https://vega.github.io/vega-lite/docs/scale.html#utc).
   *
   * 2) [**Discrete Scales**](https://vega.github.io/vega-lite/docs/scale.html#discrete) -- mapping discrete domains to discrete ([`"ordinal"`](https://vega.github.io/vega-lite/docs/scale.html#ordinal)) or continuous ([`"band"`](https://vega.github.io/vega-lite/docs/scale.html#band) and [`"point"`](https://vega.github.io/vega-lite/docs/scale.html#point)) output ranges.
   *
   * 3) [**Discretizing Scales**](https://vega.github.io/vega-lite/docs/scale.html#discretizing) -- mapping continuous domains to discrete output ranges [`"bin-ordinal"`](https://vega.github.io/vega-lite/docs/scale.html#bin-ordinal), [`"quantile"`](https://vega.github.io/vega-lite/docs/scale.html#quantile), [`"quantize"`](https://vega.github.io/vega-lite/docs/scale.html#quantize) and [`"threshold"`](https://vega.github.io/vega-lite/docs/scale.html#threshold).
   *
   * __Default value:__ please see the [scale type table](https://vega.github.io/vega-lite/docs/scale.html#type).
   */
  type?: ScaleType;

  /**
   * Customized domain values in the form of constant values or dynamic values driven by a parameter.
   *
   * 1) Constant `domain` for _quantitative_ fields can take one of the following forms:
   *
   * - A two-element array with minimum and maximum values. To create a diverging scale, this two-element array can be combined with the `domainMid` property.
   * - An array with more than two entries, for [Piecewise quantitative scales](https://vega.github.io/vega-lite/docs/scale.html#piecewise).
   * - A string value `"unaggregated"`, if the input field is aggregated, to indicate that the domain should include the raw data values prior to the aggregation.
   *
   * 2) Constant `domain` for _temporal_ fields can be a two-element array with minimum and maximum values, in the form of either timestamps or the [DateTime definition objects](https://vega.github.io/vega-lite/docs/types.html#datetime).
   *
   * 3) Constant `domain` for _ordinal_ and _nominal_ fields can be an array that lists valid input values.
   *
   * 4) To combine (union) specified constant domain with the field's values, `domain` can be an object with a `unionWith` property that specify constant domain to be combined. For example, `domain: {unionWith: [0, 100]}` for a quantitative scale means that the scale domain always includes `[0, 100]`, but will include other values in the fields beyond `[0, 100]`.
   *
   * 5) Domain can also takes an object defining a field or encoding of a parameter that [interactively determines](https://vega.github.io/vega-lite/docs/selection.html#scale-domains) the scale domain.
   */
  domain?:
    | (null | string | number | boolean | DateTime | ES)[]
    | 'unaggregated'
    | ParameterExtent
    | DomainUnionWith
    | ES;

  /**
   * An expression for an array of raw values that, if non-null, directly overrides the _domain_ property.
   * This is useful for supporting interactions such as panning or zooming a scale.
   * The scale may be initially determined using a data-driven domain, then modified in response to user input by setting the rawDomain value.
   */
  domainRaw?: ES;

  /**
   * Inserts a single mid-point value into a two-element domain. The mid-point value must lie between the domain minimum and maximum values. This property can be useful for setting a midpoint for [diverging color scales](https://vega.github.io/vega-lite/docs/scale.html#piecewise). The domainMid property is only intended for use with scales supporting continuous, piecewise domains.
   */
  domainMid?: number | ES;

  /**
   * Sets the maximum value in the scale domain, overriding the `domain` property. This property is only intended for use with scales having continuous domains.
   */
  domainMax?: number | DateTime | ES;

  /**
   * Sets the minimum value in the scale domain, overriding the domain property. This property is only intended for use with scales having continuous domains.
   */
  domainMin?: number | DateTime | ES;

  /**
   * If true, reverses the order of the scale range.
   * __Default value:__ `false`.
   */
  reverse?: boolean | ES;

  /**
   * The range of the scale. One of:
   *
   * - A string indicating a [pre-defined named scale range](https://vega.github.io/vega-lite/docs/scale.html#range-config) (e.g., example, `"symbol"`, or `"diverging"`).
   *
   * - For [continuous scales](https://vega.github.io/vega-lite/docs/scale.html#continuous), two-element array indicating  minimum and maximum values, or an array with more than two entries for specifying a [piecewise scale](https://vega.github.io/vega-lite/docs/scale.html#piecewise).
   *
   * - For [discrete](https://vega.github.io/vega-lite/docs/scale.html#discrete) and [discretizing](https://vega.github.io/vega-lite/docs/scale.html#discretizing) scales, an array of desired output values or an object with a `field` property representing the range values.  For example, if a field `color` contains CSS color names, we can set `range` to `{field: "color"}`.
   *
   * __Notes:__
   *
   * 1) For color scales you can also specify a color [`scheme`](https://vega.github.io/vega-lite/docs/scale.html#scheme) instead of `range`.
   *
   * 2) Any directly specified `range` for `x` and `y` channels will be ignored. Range can be customized via the view's corresponding [size](https://vega.github.io/vega-lite/docs/size.html) (`width` and `height`).
   */
  range?: RangeEnum | (number | string | number[] | ES)[] | FieldRange;

  /**
   * Sets the maximum value in the scale range, overriding the `range` property or the default range. This property is only intended for use with scales having continuous ranges.
   */
  rangeMax?: number | string | ES;

  /**
   * Sets the minimum value in the scale range, overriding the `range` property or the default range. This property is only intended for use with scales having continuous ranges.
   */
  rangeMin?: number | string | ES;

  // ordinal

  /**
   * A string indicating a color [scheme](https://vega.github.io/vega-lite/docs/scale.html#scheme) name (e.g., `"category10"` or `"blues"`) or a [scheme parameter object](https://vega.github.io/vega-lite/docs/scale.html#scheme-params).
   *
   * Discrete color schemes may be used with [discrete](https://vega.github.io/vega-lite/docs/scale.html#discrete) or [discretizing](https://vega.github.io/vega-lite/docs/scale.html#discretizing) scales. Continuous color schemes are intended for use with color scales.
   *
   * To set a custom scheme, instead set the list of values [as the scale range](https://vega.github.io/vega-lite/docs/scale.html#2-setting-the-range-property-to-an-array-of-valid-css-color-strings).
   *
   * For the full list of supported schemes, please refer to the [Vega Scheme](https://vega.github.io/vega/docs/schemes/#reference) reference.
   */
  scheme?: ColorScheme | SchemeParams | ES;

  /**
   * The alignment of the steps within the scale range.
   *
   * This value must lie in the range `[0,1]`. A value of `0.5` indicates that the steps should be centered within the range. A value of `0` or `1` may be used to shift the bands to one side, say to position them adjacent to an axis.
   *
   * __Default value:__ `0.5`
   */
  align?: number | ES;

  /**
   * Bin boundaries can be provided to scales as either an explicit array of bin boundaries or as a bin specification object. The legal values are:
   * - An [array](../types/#Array) literal of bin boundary values. For example, `[0, 5, 10, 15, 20]`. The array must include both starting and ending boundaries. The previous example uses five values to indicate a total of four bin intervals: [0-5), [5-10), [10-15), [15-20]. Array literals may include signal references as elements.
   * - A [bin specification object](https://vega.github.io/vega-lite/docs/scale.html#bins) that indicates the bin _step_ size, and optionally the _start_ and _stop_ boundaries.
   * - An array of bin boundaries over the scale domain. If provided, axes and legends will use the bin boundaries to inform the choice of tick marks and text labels.
   */
  // TODO: add - A [signal reference](../types/#Signal) that resolves to either an array or bin specification object.
  bins?: ScaleBins;

  /**
   * If `true`, rounds numeric output values to integers. This can be helpful for snapping to the pixel grid.
   *
   * __Default value:__ `false`.
   */
  round?: boolean | ES;

  /**
   * For _[continuous](https://vega.github.io/vega-lite/docs/scale.html#continuous)_ scales, expands the scale domain to accommodate the specified number of pixels on each of the scale range. The scale range must represent pixels for this parameter to function as intended. Padding adjustment is performed prior to all other adjustments, including the effects of the `zero`, `nice`, `domainMin`, and `domainMax` properties.
   *
   * For _[band](https://vega.github.io/vega-lite/docs/scale.html#band)_ scales, shortcut for setting `paddingInner` and `paddingOuter` to the same value.
   *
   * For _[point](https://vega.github.io/vega-lite/docs/scale.html#point)_ scales, alias for `paddingOuter`.
   *
   * __Default value:__ For _continuous_ scales, derived from the [scale config](https://vega.github.io/vega-lite/docs/scale.html#config)'s `continuousPadding`.
   * For _band and point_ scales, see `paddingInner` and `paddingOuter`. By default, Vega-Lite sets padding such that _width/height = number of unique values * step_.
   *
   * @minimum 0
   */
  padding?: number | ES;

  /**
   * The inner padding (spacing) within each band step of band scales, as a fraction of the step size. This value must lie in the range [0,1].
   *
   * For point scale, this property is invalid as point scales do not have internal band widths (only step sizes between bands).
   *
   * __Default value:__ derived from the [scale config](https://vega.github.io/vega-lite/docs/scale.html#config)'s `bandPaddingInner`.
   *
   * @minimum 0
   * @maximum 1
   */
  paddingInner?: number | ES;

  /**
   * The outer padding (spacing) at the ends of the range of band and point scales,
   * as a fraction of the step size. This value must lie in the range [0,1].
   *
   * __Default value:__ derived from the [scale config](https://vega.github.io/vega-lite/docs/scale.html#config)'s `bandPaddingOuter` for band scales and `pointPadding` for point scales.
   * By default, Vega-Lite sets outer padding such that _width/height = number of unique values * step_.
   *
   * @minimum 0
   * @maximum 1
   */
  paddingOuter?: number | ES;

  // typical
  /**
   * If `true`, values that exceed the data domain are clamped to either the minimum or maximum range value
   *
   * __Default value:__ derived from the [scale config](https://vega.github.io/vega-lite/docs/config.html#scale-config)'s `clamp` (`true` by default).
   */
  clamp?: boolean | ES;

  /**
   * Extending the domain so that it starts and ends on nice round values. This method typically modifies the scale’s domain, and may only extend the bounds to the nearest round value. Nicing is useful if the domain is computed from data and may be irregular. For example, for a domain of _[0.201479…, 0.996679…]_, a nice domain might be _[0.2, 1.0]_.
   *
   * For quantitative scales such as linear, `nice` can be either a boolean flag or a number. If `nice` is a number, it will represent a desired tick count. This allows greater control over the step size used to extend the bounds, guaranteeing that the returned ticks will exactly cover the domain.
   *
   * For temporal fields with time and utc scales, the `nice` value can be a string indicating the desired time interval. Legal values are `"millisecond"`, `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and `"year"`. Alternatively, `time` and `utc` scales can accept an object-valued interval specifier of the form `{"interval": "month", "step": 3}`, which includes a desired number of interval steps. Here, the domain would snap to quarter (Jan, Apr, Jul, Oct) boundaries.
   *
   * __Default value:__ `true` for unbinned _quantitative_ fields without explicit domain bounds; `false` otherwise.
   *
   */
  nice?: boolean | number | TimeInterval | TimeIntervalStep | ES;

  /**
   * The logarithm base of the `log` scale (default `10`).
   */
  base?: number | ES;

  /**
   * The exponent of the `pow` scale.
   */
  exponent?: number | ES;

  /**
   * A constant determining the slope of the symlog function around zero. Only used for `symlog` scales.
   *
   * __Default value:__ `1`
   */
  constant?: number | ES;

  /**
   * If `true`, ensures that a zero baseline value is included in the scale domain.
   *
   * __Default value:__ `true` for x and y channels if the quantitative field is not binned and no custom `domain` is provided; `false` otherwise.
   *
   * __Note:__ Log, time, and utc scales do not support `zero`.
   */
  zero?: boolean | ES;

  /**
   * The interpolation method for range values. By default, a general interpolator for numbers, dates, strings and colors (in HCL space) is used. For color ranges, this property allows interpolation in alternative color spaces. Legal values include `rgb`, `hsl`, `hsl-long`, `lab`, `hcl`, `hcl-long`, `cubehelix` and `cubehelix-long` ('-long' variants use longer paths in polar coordinate spaces). If object-valued, this property accepts an object with a string-valued _type_ property and an optional numeric _gamma_ property applicable to rgb and cubehelix interpolators. For more, see the [d3-interpolate documentation](https://github.com/d3/d3-interpolate).
   *
   * * __Default value:__ `hcl`
   */
  interpolate?: ScaleInterpolateEnum | ES | ScaleInterpolateParams;
}

const SCALE_PROPERTY_INDEX: Flag<keyof Scale<any>> = {
  type: 1,
  domain: 1,
  domainMax: 1,
  domainMin: 1,
  domainMid: 1,
  domainRaw: 1,
  align: 1,
  range: 1,
  rangeMax: 1,
  rangeMin: 1,
  scheme: 1,
  bins: 1,
  // Other properties
  reverse: 1,
  round: 1,
  // quantitative / time
  clamp: 1,
  nice: 1,
  // quantitative
  base: 1,
  exponent: 1,
  constant: 1,
  interpolate: 1,
  zero: 1, // zero depends on domain
  // band/point
  padding: 1,
  paddingInner: 1,
  paddingOuter: 1
};

export const SCALE_PROPERTIES = keys(SCALE_PROPERTY_INDEX);

const {type, domain, range, rangeMax, rangeMin, scheme, ...NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTY_INDEX} =
  SCALE_PROPERTY_INDEX;

export const NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES = keys(NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTY_INDEX);

export function scaleTypeSupportProperty(scaleType: ScaleType, propName: keyof Scale): boolean {
  switch (propName) {
    case 'type':
    case 'domain':
    case 'reverse':
    case 'range':
      return true;
    case 'scheme':
    case 'interpolate':
      return !['point', 'band', 'identity'].includes(scaleType);
    case 'bins':
      return !['point', 'band', 'identity', 'ordinal'].includes(scaleType);
    case 'round':
      return isContinuousToContinuous(scaleType) || scaleType === 'band' || scaleType === 'point';
    case 'padding':
    case 'rangeMin':
    case 'rangeMax':
      return isContinuousToContinuous(scaleType) || ['point', 'band'].includes(scaleType);
    case 'paddingOuter':
    case 'align':
      return ['point', 'band'].includes(scaleType);
    case 'paddingInner':
      return scaleType === 'band';
    case 'domainMax':
    case 'domainMid':
    case 'domainMin':
    case 'domainRaw':
    case 'clamp':
      return isContinuousToContinuous(scaleType);
    case 'nice':
      return isContinuousToContinuous(scaleType) || scaleType === 'quantize' || scaleType === 'threshold';
    case 'exponent':
      return scaleType === 'pow';
    case 'base':
      return scaleType === 'log';
    case 'constant':
      return scaleType === 'symlog';
    case 'zero':
      return (
        hasContinuousDomain(scaleType) &&
        !contains(
          [
            'log', // log scale cannot have zero value
            'time',
            'utc', // zero is not meaningful for time
            'threshold', // threshold requires custom domain so zero does not matter
            'quantile' // quantile depends on distribution so zero does not matter
          ],
          scaleType
        )
      );
  }
}

/**
 * Returns undefined if the input channel supports the input scale property name
 */
export function channelScalePropertyIncompatability(channel: Channel, propName: keyof Scale): string {
  switch (propName) {
    case 'interpolate':
    case 'scheme':
    case 'domainMid':
      if (!isColorChannel(channel)) {
        return log.message.cannotUseScalePropertyWithNonColor(propName);
      }
      return undefined;
    case 'align':
    case 'type':
    case 'bins':
    case 'domain':
    case 'domainMax':
    case 'domainMin':
    case 'domainRaw':
    case 'range':
    case 'base':
    case 'exponent':
    case 'constant':
    case 'nice':
    case 'padding':
    case 'paddingInner':
    case 'paddingOuter':
    case 'rangeMax':
    case 'rangeMin':
    case 'reverse':
    case 'round':
    case 'clamp':
    case 'zero':
      return undefined; // GOOD!
  }
}

export function scaleTypeSupportDataType(specifiedType: ScaleType, fieldDefType: Type): boolean {
  if (contains([ORDINAL, NOMINAL], fieldDefType)) {
    return specifiedType === undefined || hasDiscreteDomain(specifiedType);
  } else if (fieldDefType === TEMPORAL) {
    return contains([ScaleType.TIME, ScaleType.UTC, undefined], specifiedType);
  } else if (fieldDefType === QUANTITATIVE) {
    return isQuantitative(specifiedType) || isContinuousToDiscrete(specifiedType) || specifiedType === undefined;
  }

  return true;
}

export function channelSupportScaleType(channel: Channel, scaleType: ScaleType, hasNestedOffsetScale = false): boolean {
  if (!CHANNEL.isScaleChannel(channel)) {
    return false;
  }
  switch (channel) {
    case CHANNEL.X:
    case CHANNEL.Y:
    case CHANNEL.XOFFSET:
    case CHANNEL.YOFFSET:
    case CHANNEL.THETA:
    case CHANNEL.RADIUS:
      if (isContinuousToContinuous(scaleType)) {
        return true;
      } else if (scaleType === 'band') {
        return true;
      } else if (scaleType === 'point') {
        /*
          Point scale can't be use if the position has a nested offset scale
          because if there is a nested scale, then it's band.
        */
        return !hasNestedOffsetScale;
      }
      return false;
    case CHANNEL.TIME:
      return contains(['linear', 'band'], scaleType);
    case CHANNEL.SIZE: // TODO: size and opacity can support ordinal with more modification
    case CHANNEL.STROKEWIDTH:
    case CHANNEL.OPACITY:
    case CHANNEL.FILLOPACITY:
    case CHANNEL.STROKEOPACITY:
    case CHANNEL.ANGLE:
      // Although it generally doesn't make sense to use band with size and opacity,
      // it can also work since we use band: 0.5 to get midpoint.
      return (
        isContinuousToContinuous(scaleType) ||
        isContinuousToDiscrete(scaleType) ||
        contains(['band', 'point', 'ordinal'], scaleType)
      );
    case CHANNEL.COLOR:
    case CHANNEL.FILL:
    case CHANNEL.STROKE:
      return scaleType !== 'band'; // band does not make sense with color
    case CHANNEL.STROKEDASH:
    case CHANNEL.SHAPE:
      return scaleType === 'ordinal' || isContinuousToDiscrete(scaleType);
  }
}
