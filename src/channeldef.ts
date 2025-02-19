import {Gradient, ScaleType, SignalRef, Text, TimeFormatSpecifier} from 'vega';
import {isArray, isBoolean, isNumber, isString} from 'vega-util';
import {Aggregate, isAggregateOp, isArgmaxDef, isArgminDef, isCountingAggregateOp} from './aggregate';
import {Axis} from './axis';
import {autoMaxBins, Bin, BinParams, binToString, isBinned, isBinning} from './bin';
import {
  ANGLE,
  Channel,
  COLOR,
  COLUMN,
  DESCRIPTION,
  DETAIL,
  ExtendedChannel,
  FACET,
  FILL,
  FILLOPACITY,
  getSizeChannel,
  HREF,
  isScaleChannel,
  isSecondaryRangeChannel,
  isXorY,
  KEY,
  LATITUDE,
  LATITUDE2,
  LONGITUDE,
  LONGITUDE2,
  OPACITY,
  ORDER,
  PolarPositionScaleChannel,
  PositionScaleChannel,
  RADIUS,
  RADIUS2,
  ROW,
  SHAPE,
  SIZE,
  STROKE,
  STROKEDASH,
  STROKEOPACITY,
  STROKEWIDTH,
  TEXT,
  THETA,
  THETA2,
  TIME,
  TOOLTIP,
  URL,
  X,
  X2,
  XOFFSET,
  Y,
  Y2,
  YOFFSET
} from './channel';
import {getMarkConfig, getMarkPropOrConfig} from './compile/common';
import {isCustomFormatType} from './compile/format';
import {CompositeAggregate} from './compositemark';
import {Config} from './config';
import {DateTime, dateTimeToExpr, isDateTime} from './datetime';
import {Encoding} from './encoding';
import {ExprRef, isExprRef} from './expr';
import {Guide, GuideEncodingConditionalValueDef, TitleMixins} from './guide';
import {ImputeParams} from './impute';
import {Legend} from './legend';
import * as log from './log';
import {LogicalComposition} from './logical';
import {isRectBasedMark, Mark, MarkDef, RelativeBandSize} from './mark';
import {ParameterPredicate, Predicate} from './predicate';
import {hasDiscreteDomain, isContinuousToDiscrete, Scale, SCALE_CATEGORY_INDEX} from './scale';
import {isSortByChannel, Sort, SortOrder} from './sort';
import {isFacetFieldDef} from './spec/facet';
import {StackOffset} from './stack';
import {
  BinnedTimeUnit,
  getTimeUnitParts,
  isBinnedTimeUnit,
  isLocalSingleTimeUnit,
  normalizeTimeUnit,
  TimeUnit,
  TimeUnitParams,
  timeUnitToString
} from './timeunit';
import {AggregatedFieldDef, WindowFieldDef} from './transform';
import {getFullName, QUANTITATIVE, StandardType, Type} from './type';
import {
  Dict,
  flatAccessWithDatum,
  getFirstDefined,
  hasProperty,
  internalField,
  omit,
  removePathFromField,
  replacePathInField,
  stringify,
  titleCase
} from './util';
import {isSignalRef} from './vega.schema';

export type PrimitiveValue = number | string | boolean | null;

export type Value<ES extends ExprRef | SignalRef = ExprRef | SignalRef> =
  | PrimitiveValue
  | number[]
  | Gradient
  | Text
  | ES;

/**
 * Definition object for a constant value (primitive value or gradient definition) of an encoding channel.
 */
export interface ValueDef<V extends Value = Value> {
  /**
   * A constant value in visual domain (e.g., `"red"` / `"#0099ff"` / [gradient definition](https://vega.github.io/vega-lite/docs/types.html#gradient) for color, values between `0` to `1` for opacity).
   */
  value: V;
}

export type PositionValueDef = ValueDef<number | 'width' | 'height' | ExprRef | SignalRef>;
export type NumericValueDef = ValueDef<number | ExprRef | SignalRef>;

/**
 * A ValueDef with Condition<ValueDef | FieldDef> where either the condition or the value are optional.
 * {
 *   condition: {field: ...} | {value: ...},
 *   value: ...,
 * }
 */

/**
 * @minProperties 1
 */
export type ValueDefWithCondition<F extends FieldDef<any> | DatumDef<any>, V extends Value = Value> = Partial<
  ValueDef<V | ExprRef | SignalRef>
> & {
  /**
   * A field definition or one or more value definition(s) with a parameter predicate.
   */
  condition?:
    | Conditional<F>
    | Conditional<ValueDef<V | ExprRef | SignalRef>>
    | Conditional<ValueDef<V | ExprRef | SignalRef>>[];
};

export type StringValueDefWithCondition<F extends Field, T extends Type = StandardType> = ValueDefWithCondition<
  MarkPropFieldOrDatumDef<F, T>,
  string | null
>;
export type TypeForShape = 'nominal' | 'ordinal' | 'geojson';

export type ConditionalTemplate = FieldDef<any> | DatumDef | ValueDef<any> | ExprRef | SignalRef;

export type Conditional<CD extends ConditionalTemplate> = ConditionalPredicate<CD> | ConditionalParameter<CD>;

export type ConditionalPredicate<CD extends ConditionalTemplate> = {
  /**
   * Predicate for triggering the condition
   */
  test: LogicalComposition<Predicate>;
} & CD;

export type ConditionalParameter<CD extends ConditionalTemplate> = ParameterPredicate & CD;

export function isConditionalParameter<T extends ConditionalTemplate>(c: Conditional<T>): c is ConditionalParameter<T> {
  return hasProperty(c, 'param');
}

export interface ConditionValueDefMixins<V extends Value = Value> {
  /**
   * One or more value definition(s) with [a parameter or a test predicate](https://vega.github.io/vega-lite/docs/condition.html).
   *
   * __Note:__ A field definition's `condition` property can only contain [conditional value definitions](https://vega.github.io/vega-lite/docs/condition.html#value)
   * since Vega-Lite only allows at most one encoded field per encoding channel.
   */
  condition?: Conditional<ValueDef<V>> | Conditional<ValueDef<V>>[];
}

/**
 * A FieldDef with Condition<ValueDef>
 * {
 *   condition: {value: ...},
 *   field: ...,
 *   ...
 * }
 */

export type FieldOrDatumDefWithCondition<F extends FieldDef<any, any> | DatumDef<any>, V extends Value = Value> = F &
  ConditionValueDefMixins<V | ExprRef | SignalRef>;

export type MarkPropDef<F extends Field, V extends Value, T extends Type = StandardType> =
  | FieldOrDatumDefWithCondition<MarkPropFieldDef<F, T>, V>
  | FieldOrDatumDefWithCondition<DatumDef<F>, V>
  | ValueDefWithCondition<MarkPropFieldOrDatumDef<F, T>, V>;

export type ColorDef<F extends Field> = MarkPropDef<F, Gradient | string | null>;
export type NumericMarkPropDef<F extends Field> = MarkPropDef<F, number>;

export type NumericArrayMarkPropDef<F extends Field> = MarkPropDef<F, number[]>;

export type ShapeDef<F extends Field> = MarkPropDef<F, string | null, TypeForShape>;

export type StringFieldDefWithCondition<F extends Field> = FieldOrDatumDefWithCondition<StringFieldDef<F>, string>;
export type TextDef<F extends Field> =
  | FieldOrDatumDefWithCondition<StringFieldDef<F>, Text>
  | FieldOrDatumDefWithCondition<StringDatumDef<F>, Text>
  | ValueDefWithCondition<StringFieldDef<F>, Text>;

/**
 * A ValueDef with optional Condition<ValueDef | FieldDef>
 * {
 *   condition: {field: ...} | {value: ...},
 *   value: ...,
 * }
 */

/**
 * Reference to a repeated value.
 */
export interface RepeatRef {
  repeat: 'row' | 'column' | 'repeat' | 'layer';
}

export type FieldName = string;
export type Field = FieldName | RepeatRef;

export function isRepeatRef(field: Field | any): field is RepeatRef {
  return !isString(field) && hasProperty(field, 'repeat');
}

/** @@hidden */
export type HiddenCompositeAggregate = CompositeAggregate;

export interface FieldDefBase<F, B extends Bin = Bin> extends BandMixins {
  /**
   * __Required.__ A string defining the name of the field from which to pull a data value
   * or an object defining iterated values from the [`repeat`](https://vega.github.io/vega-lite/docs/repeat.html) operator.
   *
   * __See also:__ [`field`](https://vega.github.io/vega-lite/docs/field.html) documentation.
   *
   * __Notes:__
   * 1)  Dots (`.`) and brackets (`[` and `]`) can be used to access nested objects (e.g., `"field": "foo.bar"` and `"field": "foo['bar']"`).
   * If field names contain dots or brackets but are not nested, you can use `\\` to escape dots and brackets (e.g., `"a\\.b"` and `"a\\[0\\]"`).
   * See more details about escaping in the [field documentation](https://vega.github.io/vega-lite/docs/field.html).
   * 2) `field` is not required if `aggregate` is `count`.
   */
  field?: F;

  // function

  /**
   * Time unit (e.g., `year`, `yearmonth`, `month`, `hours`) for a temporal field.
   * or [a temporal field that gets casted as ordinal](https://vega.github.io/vega-lite/docs/type.html#cast).
   *
   * __Default value:__ `undefined` (None)
   *
   * __See also:__ [`timeUnit`](https://vega.github.io/vega-lite/docs/timeunit.html) documentation.
   */
  timeUnit?: TimeUnit | BinnedTimeUnit | TimeUnitParams;

  /**
   * Aggregation function for the field
   * (e.g., `"mean"`, `"sum"`, `"median"`, `"min"`, `"max"`, `"count"`).
   *
   * __Default value:__ `undefined` (None)
   *
   * __See also:__ [`aggregate`](https://vega.github.io/vega-lite/docs/aggregate.html) documentation.
   */
  aggregate?: Aggregate | HiddenCompositeAggregate;

  /**
   * A flag for binning a `quantitative` field, [an object defining binning parameters](https://vega.github.io/vega-lite/docs/bin.html#bin-parameters), or indicating that the data for `x` or `y` channel are binned before they are imported into Vega-Lite (`"binned"`).
   *
   * - If `true`, default [binning parameters](https://vega.github.io/vega-lite/docs/bin.html#bin-parameters) will be applied.
   *
   * - If `"binned"`, this indicates that the data for the `x` (or `y`) channel are already binned. You can map the bin-start field to `x` (or `y`) and the bin-end field to `x2` (or `y2`). The scale and axis will be formatted similar to binning in Vega-Lite.  To adjust the axis ticks based on the bin step, you can also set the axis's [`tickMinStep`](https://vega.github.io/vega-lite/docs/axis.html#ticks) property.
   *
   * __Default value:__ `false`
   *
   * __See also:__ [`bin`](https://vega.github.io/vega-lite/docs/bin.html) documentation.
   */
  bin?: B;
}

export function toFieldDefBase(fieldDef: FieldDef<string>): FieldDefBase<string> {
  const {field, timeUnit, bin, aggregate} = fieldDef;
  return {
    ...(timeUnit ? {timeUnit} : {}),
    ...(bin ? {bin} : {}),
    ...(aggregate ? {aggregate} : {}),
    field
  };
}

export interface TypeMixins<T extends Type> {
  /**
   * The type of measurement (`"quantitative"`, `"temporal"`, `"ordinal"`, or `"nominal"`) for the encoded field or constant value (`datum`).
   * It can also be a `"geojson"` type for encoding ['geoshape'](https://vega.github.io/vega-lite/docs/geoshape.html).
   *
   * Vega-Lite automatically infers data types in many cases as discussed below. However, type is required for a field if:
   * (1) the field is not nominal and the field encoding has no specified `aggregate` (except `argmin` and `argmax`), `bin`, scale type, custom `sort` order, nor `timeUnit`
   * or (2) if you wish to use an ordinal scale for a field with `bin` or `timeUnit`.
   *
   * __Default value:__
   *
   * 1) For a data `field`, `"nominal"` is the default data type unless the field encoding has `aggregate`, `channel`, `bin`, scale type, `sort`, or `timeUnit` that satisfies the following criteria:
   * - `"quantitative"` is the default type if (1) the encoded field contains `bin` or `aggregate` except `"argmin"` and `"argmax"`, (2) the encoding channel is `latitude` or `longitude` channel or (3) if the specified scale type is [a quantitative scale](https://vega.github.io/vega-lite/docs/scale.html#type).
   * - `"temporal"` is the default type if (1) the encoded field contains `timeUnit` or (2) the specified scale type is a time or utc scale
   * - `"ordinal"` is the default type if (1) the encoded field contains a [custom `sort` order](https://vega.github.io/vega-lite/docs/sort.html#specifying-custom-sort-order), (2) the specified scale type is an ordinal/point/band scale, or (3) the encoding channel is `order`.
   *
   * 2) For a constant value in data domain (`datum`):
   * - `"quantitative"` if the datum is a number
   * - `"nominal"` if the datum is a string
   * - `"temporal"` if the datum is [a date time object](https://vega.github.io/vega-lite/docs/datetime.html)
   *
   * __Note:__
   * - Data `type` describes the semantics of the data rather than the primitive data types (number, string, etc.). The same primitive data type can have different types of measurement. For example, numeric data can represent quantitative, ordinal, or nominal data.
   * - Data values for a temporal field can be either a date-time string (e.g., `"2015-03-07 12:32:17"`, `"17:01"`, `"2015-03-16"`. `"2015"`) or a timestamp number (e.g., `1552199579097`).
   * - When using with [`bin`](https://vega.github.io/vega-lite/docs/bin.html), the `type` property can be either `"quantitative"` (for using a linear bin scale) or [`"ordinal"` (for using an ordinal bin scale)](https://vega.github.io/vega-lite/docs/type.html#cast-bin).
   * - When using with [`timeUnit`](https://vega.github.io/vega-lite/docs/timeunit.html), the `type` property can be either `"temporal"` (default, for using a temporal scale) or [`"ordinal"` (for using an ordinal scale)](https://vega.github.io/vega-lite/docs/type.html#cast-bin).
   * - When using with [`aggregate`](https://vega.github.io/vega-lite/docs/aggregate.html), the `type` property refers to the post-aggregation data type. For example, we can calculate count `distinct` of a categorical field `"cat"` using `{"aggregate": "distinct", "field": "cat"}`. The `"type"` of the aggregate output is `"quantitative"`.
   * - Secondary channels (e.g., `x2`, `y2`, `xError`, `yError`) do not have `type` as they must have exactly the same type as their primary channels (e.g., `x`, `y`).
   *
   * __See also:__ [`type`](https://vega.github.io/vega-lite/docs/type.html) documentation.
   */
  type?: T;
}

/**
 *  Definition object for a data field, its type and transformation of an encoding channel.
 */
export type TypedFieldDef<
  F extends Field,
  T extends Type = any,
  B extends Bin = boolean | BinParams | 'binned' | null // This is equivalent to Bin but we use the full form so the docs has detailed types
> = FieldDefBase<F, B> & TitleMixins & TypeMixins<T>;

export interface SortableFieldDef<
  F extends Field,
  T extends Type = StandardType,
  B extends Bin = boolean | BinParams | null
> extends TypedFieldDef<F, T, B> {
  /**
   * Sort order for the encoded field.
   *
   * For continuous fields (quantitative or temporal), `sort` can be either `"ascending"` or `"descending"`.
   *
   * For discrete fields, `sort` can be one of the following:
   * - `"ascending"` or `"descending"` -- for sorting by the values' natural order in JavaScript.
   * - [A string indicating an encoding channel name to sort by](https://vega.github.io/vega-lite/docs/sort.html#sort-by-encoding) (e.g., `"x"` or `"y"`) with an optional minus prefix for descending sort (e.g., `"-x"` to sort by x-field, descending). This channel string is short-form of [a sort-by-encoding definition](https://vega.github.io/vega-lite/docs/sort.html#sort-by-encoding). For example, `"sort": "-x"` is equivalent to `"sort": {"encoding": "x", "order": "descending"}`.
   * - [A sort field definition](https://vega.github.io/vega-lite/docs/sort.html#sort-field) for sorting by another field.
   * - [An array specifying the field values in preferred order](https://vega.github.io/vega-lite/docs/sort.html#sort-array). In this case, the sort order will obey the values in the array, followed by any unspecified values in their original order. For discrete time field, values in the sort array can be [date-time definition objects](types#datetime). In addition, for time units `"month"` and `"day"`, the values can be the month or day names (case insensitive) or their 3-letter initials (e.g., `"Mon"`, `"Tue"`).
   * - `null` indicating no sort.
   *
   * __Default value:__ `"ascending"`
   *
   * __Note:__ `null` and sorting by another channel is not supported for `row` and `column`.
   *
   * __See also:__ [`sort`](https://vega.github.io/vega-lite/docs/sort.html) documentation.
   */
  sort?: Sort<F>;
}

export function isSortableFieldDef<F extends Field>(fieldDef: FieldDef<F>): fieldDef is SortableFieldDef<F> {
  return hasProperty(fieldDef, 'sort');
}

export type ScaleFieldDef<
  F extends Field,
  T extends Type = StandardType,
  B extends Bin = boolean | BinParams | null
> = SortableFieldDef<F, T, B> & ScaleMixins;

export interface ScaleMixins {
  /**
   * An object defining properties of the channel's scale, which is the function that transforms values in the data domain (numbers, dates, strings, etc) to visual values (pixels, colors, sizes) of the encoding channels.
   *
   * If `null`, the scale will be [disabled and the data value will be directly encoded](https://vega.github.io/vega-lite/docs/scale.html#disable).
   *
   * __Default value:__ If undefined, default [scale properties](https://vega.github.io/vega-lite/docs/scale.html) are applied.
   *
   * __See also:__ [`scale`](https://vega.github.io/vega-lite/docs/scale.html) documentation.
   */
  scale?: Scale | null;
}

export type OffsetDef<F extends Field, T extends Type = StandardType> =
  | ScaleFieldDef<F, T>
  | ScaleDatumDef<F>
  | ValueDef<number>;

export interface DatumDef<
  F extends Field = string,
  V extends PrimitiveValue | DateTime | ExprRef | SignalRef = PrimitiveValue | DateTime | ExprRef | SignalRef
> extends Partial<TypeMixins<Type>>,
    BandMixins,
    TitleMixins {
  /**
   * A constant value in data domain.
   */
  datum?: F extends RepeatRef ? V | RepeatRef : V;
  // only apply Repeatref if field (F) can be RepeatRef
  // FIXME(https://github.com/microsoft/TypeScript/issues/37586):
  // `F extends RepeatRef` probably should be `RepeatRef extends F` but there is likely a bug in TS.
}

export type Format = string | TimeFormatSpecifier | Dict<unknown>;

export interface FormatMixins {
  /**
   * The text format specifier for formatting number and date/time in labels of guides (axes, legends, headers) and text marks.
   *
   * If the format type is `"number"` (e.g., for quantitative fields), this is a D3's [number format pattern string](https://github.com/d3/d3-format#locale_format).
   *
   * If the format type is `"time"` (e.g., for temporal fields), this is either:
   *   a) D3's [time format pattern](https://d3js.org/d3-time-format#locale_format) if you desire to set a static time format.
   *
   *   b) [dynamic time format specifier object](https://vega.github.io/vega-lite/docs/format.html#dynamic-time-format) if you desire to set a dynamic time format that uses different formats depending on the granularity of the input date (e.g., if the date lies on a year, month, date, hour, etc. boundary).
   *
   * When used with a [custom `formatType`](https://vega.github.io/vega-lite/docs/config.html#custom-format-type), this value will be passed as `format` alongside `datum.value` to the registered function.
   *
   * __Default value:__  Derived from [numberFormat](https://vega.github.io/vega-lite/docs/config.html#format) config for number format and from [timeFormat](https://vega.github.io/vega-lite/docs/config.html#format) config for time format.
   */
  format?: Format;

  /**
   * The format type for labels. One of `"number"`, `"time"`, or a [registered custom format type](https://vega.github.io/vega-lite/docs/config.html#custom-format-type).
   *
   * __Default value:__
   * - `"time"` for temporal fields and ordinal and nominal fields with `timeUnit`.
   * - `"number"` for quantitative fields as well as ordinal and nominal fields without `timeUnit`.
   */
  formatType?: 'number' | 'time' | string;
}

export type StringDatumDef<F extends Field = string> = DatumDef<F> & FormatMixins;

export type ScaleDatumDef<F extends Field = string> = ScaleMixins & DatumDef<F>;

/**
 * A field definition of a secondary channel that shares a scale with another primary channel. For example, `x2`, `xError` and `xError2` share the same scale with `x`.
 */
export type SecondaryFieldDef<F extends Field> = FieldDefBase<F, null> & TitleMixins; // x2/y2 shouldn't have bin, but we keep bin property for simplicity of the codebase.

export type Position2Def<F extends Field> = SecondaryFieldDef<F> | DatumDef<F> | PositionValueDef;

export type SecondaryChannelDef<F extends Field> = Encoding<F>['x2' | 'y2'];

/**
 * Field Def without scale (and without bin: "binned" support).
 */
export type FieldDefWithoutScale<F extends Field, T extends Type = StandardType> = TypedFieldDef<F, T>;

export type LatLongFieldDef<F extends Field> = FieldDefBase<F, null> &
  TitleMixins &
  Partial<TypeMixins<'quantitative'>>; // Lat long shouldn't have bin, but we keep bin property for simplicity of the codebase.

export type LatLongDef<F extends Field> = LatLongFieldDef<F> | DatumDef<F>;

export type PositionFieldDefBase<F extends Field> = ScaleFieldDef<
  F,
  StandardType,
  boolean | BinParams | 'binned' | null // This is equivalent to Bin but we use the full form so the docs has detailed types
> &
  PositionBaseMixins;

export type PositionDatumDefBase<F extends Field> = ScaleDatumDef<F> & PositionBaseMixins;

export interface PositionBaseMixins {
  /**
   * Type of stacking offset if the field should be stacked.
   * `stack` is only applicable for `x`, `y`, `theta`, and `radius` channels with continuous domains.
   * For example, `stack` of `y` can be used to customize stacking for a vertical bar chart.
   *
   * `stack` can be one of the following values:
   * - `"zero"` or `true`: stacking with baseline offset at zero value of the scale (for creating typical stacked [bar](https://vega.github.io/vega-lite/docs/stack.html#bar) and [area](https://vega.github.io/vega-lite/docs/stack.html#area) chart).
   * - `"normalize"` - stacking with normalized domain (for creating [normalized stacked bar and area charts](https://vega.github.io/vega-lite/docs/stack.html#normalized) and pie charts [with percentage tooltip](https://vega.github.io/vega-lite/docs/arc.html#tooltip)). <br/>
   * -`"center"` - stacking with center baseline (for [streamgraph](https://vega.github.io/vega-lite/docs/stack.html#streamgraph)).
   * - `null` or `false` - No-stacking. This will produce layered [bar](https://vega.github.io/vega-lite/docs/stack.html#layered-bar-chart) and area chart.
   *
   * __Default value:__ `zero` for plots with all of the following conditions are true:
   * (1) the mark is `bar`, `area`, or `arc`;
   * (2) the stacked measure channel (x or y) has a linear scale;
   * (3) At least one of non-position channels mapped to an unaggregated field that is different from x and y. Otherwise, `null` by default.
   *
   * __See also:__ [`stack`](https://vega.github.io/vega-lite/docs/stack.html) documentation.
   */
  stack?: StackOffset | null | boolean;
}

export interface BandMixins {
  /**
   * Relative position on a band of a stacked, binned, time unit, or band scale. For example, the marks will be positioned at the beginning of the band if set to `0`, and at the middle of the band if set to `0.5`.
   *
   * @minimum 0
   * @maximum 1
   */
  bandPosition?: number;
}

export type PositionFieldDef<F extends Field> = PositionFieldDefBase<F> & PositionMixins;

export type PositionDatumDef<F extends Field> = PositionDatumDefBase<F> & PositionMixins;

export type PositionDef<F extends Field> = PositionFieldDef<F> | PositionDatumDef<F> | PositionValueDef;

export interface PositionMixins {
  /**
   * An object defining properties of axis's gridlines, ticks and labels.
   * If `null`, the axis for the encoding channel will be removed.
   *
   * __Default value:__ If undefined, default [axis properties](https://vega.github.io/vega-lite/docs/axis.html) are applied.
   *
   * __See also:__ [`axis`](https://vega.github.io/vega-lite/docs/axis.html) documentation.
   */
  axis?: Axis<ExprRef | SignalRef> | null;

  /**
   * An object defining the properties of the Impute Operation to be applied.
   * The field value of the other positional channel is taken as `key` of the `Impute` Operation.
   * The field of the `color` channel if specified is used as `groupby` of the `Impute` Operation.
   *
   * __See also:__ [`impute`](https://vega.github.io/vega-lite/docs/impute.html) documentation.
   */
  impute?: ImputeParams | null;
}

export type PolarDef<F extends Field> = PositionFieldDefBase<F> | PositionDatumDefBase<F> | PositionValueDef;

export type TimeDef<F extends Field> = TimeFieldDef<F>;
export interface TimeMixins {
  /*
  Optional. A boolean flag. When rescale is true, scale domains update according to the subset of data inside the current keyframe. When rescale is false, scale domains are generated from the entire dataset.

  __Default value:__ `false`
  */
  rescale?: boolean;
}
export type TimeFieldDef<F extends Field> = ScaleFieldDef<F, StandardType> & TimeMixins;

export function getBandPosition({
  fieldDef,
  fieldDef2,
  markDef: mark,
  config
}: {
  fieldDef: FieldDef<string> | DatumDef;
  fieldDef2?: SecondaryChannelDef<string>;
  markDef: MarkDef<Mark, SignalRef>;
  config: Config<SignalRef>;
}): number {
  if (isFieldOrDatumDef(fieldDef) && fieldDef.bandPosition !== undefined) {
    return fieldDef.bandPosition;
  }
  if (isFieldDef(fieldDef)) {
    const {timeUnit, bin} = fieldDef;
    if (timeUnit && !fieldDef2) {
      return getMarkConfig('timeUnitBandPosition', mark, config);
    } else if (isBinning(bin)) {
      return 0.5;
    }
  }

  return undefined;
}

export function getBandSize({
  channel,
  fieldDef,
  fieldDef2,
  markDef: mark,
  config,
  scaleType,
  useVlSizeChannel
}: {
  channel: PositionScaleChannel | PolarPositionScaleChannel;
  fieldDef: ChannelDef<string>;
  fieldDef2?: SecondaryChannelDef<string>;
  markDef: MarkDef<Mark, SignalRef>;
  config: Config<SignalRef>;
  scaleType: ScaleType;
  useVlSizeChannel?: boolean;
}): number | RelativeBandSize | SignalRef {
  const sizeChannel = getSizeChannel(channel);
  const size = getMarkPropOrConfig(useVlSizeChannel ? 'size' : sizeChannel, mark, config, {
    vgChannel: sizeChannel
  });

  if (size !== undefined) {
    return size;
  }

  if (isFieldDef(fieldDef)) {
    const {timeUnit, bin} = fieldDef;

    if (timeUnit && !fieldDef2) {
      return {band: getMarkConfig('timeUnitBandSize', mark, config)};
    } else if (isBinning(bin) && !hasDiscreteDomain(scaleType)) {
      return {band: 1};
    }
  }

  if (isRectBasedMark(mark.type)) {
    if (scaleType) {
      if (hasDiscreteDomain(scaleType)) {
        return config[mark.type]?.discreteBandSize || {band: 1};
      } else {
        return config[mark.type]?.continuousBandSize;
      }
    }
    return config[mark.type]?.discreteBandSize;
  }

  return undefined;
}

export function hasBandEnd(
  fieldDef: FieldDef<string>,
  fieldDef2: SecondaryChannelDef<string>,
  markDef: MarkDef<Mark, SignalRef>,
  config: Config<SignalRef>
): boolean {
  if (isBinning(fieldDef.bin) || (fieldDef.timeUnit && isTypedFieldDef(fieldDef) && fieldDef.type === 'temporal')) {
    // Need to check bandPosition because non-rect marks (e.g., point) with timeUnit
    // doesn't have to use bandEnd if there is no bandPosition.
    return getBandPosition({fieldDef, fieldDef2, markDef, config}) !== undefined;
  }
  return false;
}

/**
 * Field definition of a mark property, which can contain a legend.
 */
export type MarkPropFieldDef<F extends Field, T extends Type = Type> = ScaleFieldDef<F, T, boolean | BinParams | null> &
  LegendMixins;

export type MarkPropDatumDef<F extends Field> = LegendMixins & ScaleDatumDef<F>;

export type MarkPropFieldOrDatumDef<F extends Field, T extends Type = Type> =
  | MarkPropFieldDef<F, T>
  | MarkPropDatumDef<F>;

export interface LegendMixins {
  /**
   * An object defining properties of the legend.
   * If `null`, the legend for the encoding channel will be removed.
   *
   * __Default value:__ If undefined, default [legend properties](https://vega.github.io/vega-lite/docs/legend.html) are applied.
   *
   * __See also:__ [`legend`](https://vega.github.io/vega-lite/docs/legend.html) documentation.
   */
  legend?: Legend<ExprRef | SignalRef> | null;
}

// Detail

// Order Path have no scale

export type OrderFieldDef<F extends Field> = FieldDefWithoutScale<F> & OrderOnlyDef;

export interface OrderOnlyDef {
  /**
   * The sort order. One of `"ascending"` (default) or `"descending"`.
   */
  sort?: SortOrder;
}

export function isOrderOnlyDef<F extends Field>(
  orderDef: OrderFieldDef<F> | OrderFieldDef<F>[] | OrderValueDef | OrderOnlyDef
): orderDef is OrderOnlyDef {
  return hasProperty(orderDef, 'sort') && !hasProperty(orderDef, 'field');
}

export type OrderValueDef = ConditionValueDefMixins<number> & NumericValueDef;

export interface StringFieldDef<F extends Field> extends FieldDefWithoutScale<F, StandardType>, FormatMixins {}

export type FieldDef<F extends Field, T extends Type = any> = SecondaryFieldDef<F> | TypedFieldDef<F, T>;
export type ChannelDef<F extends Field = string> = Encoding<F>[keyof Encoding<F>];

export function isConditionalDef<CD extends ChannelDef<any> | GuideEncodingConditionalValueDef | ExprRef | SignalRef>(
  channelDef: CD
): channelDef is CD & {condition: Conditional<any>} {
  return hasProperty(channelDef, 'condition');
}

/**
 * Return if a channelDef is a ConditionalValueDef with ConditionFieldDef
 */
export function hasConditionalFieldDef<F extends Field>(
  channelDef: Partial<ChannelDef<F>>
): channelDef is {condition: Conditional<TypedFieldDef<F>>} {
  const condition = (channelDef as any)?.['condition'];
  return !!condition && !isArray(condition) && isFieldDef(condition);
}

export function hasConditionalFieldOrDatumDef<F extends Field>(
  channelDef: ChannelDef<F>
): channelDef is {condition: Conditional<TypedFieldDef<F>>} {
  const condition = (channelDef as any)?.['condition'];
  return !!condition && !isArray(condition) && isFieldOrDatumDef(condition);
}

export function hasConditionalValueDef<F extends Field>(
  channelDef: ChannelDef<F>
): channelDef is ValueDef<any> & {condition: Conditional<ValueDef<any>> | Conditional<ValueDef<any>>[]} {
  const condition = (channelDef as any)?.['condition'];
  return !!condition && (isArray(condition) || isValueDef(condition));
}

export function isFieldDef<F extends Field>(
  channelDef: Partial<ChannelDef<F>> | FieldDefBase<F> | DatumDef<F, any>
): channelDef is FieldDefBase<F> | TypedFieldDef<F> | SecondaryFieldDef<F> {
  return hasProperty(channelDef, 'field') || (channelDef as any)?.aggregate === 'count';
}

export function channelDefType<F extends Field>(channelDef: ChannelDef<F>): Type | undefined {
  return (channelDef as any)?.['type'];
}

export function isDatumDef<F extends Field>(
  channelDef: Partial<ChannelDef<F>> | FieldDefBase<F> | DatumDef<F, any>
): channelDef is DatumDef<F, any> {
  return hasProperty(channelDef, 'datum');
}

export function isContinuousFieldOrDatumDef<F extends Field>(
  cd: ChannelDef<F>
): cd is TypedFieldDef<F> | DatumDef<F, number> {
  // TODO: make datum support DateTime object
  return (isTypedFieldDef(cd) && !isDiscrete(cd)) || isNumericDataDef(cd);
}

export function isUnbinnedQuantitativeFieldOrDatumDef<F extends Field>(cd: ChannelDef<F>) {
  // TODO: make datum support DateTime object
  return (isTypedFieldDef(cd) && cd.type === 'quantitative' && !cd.bin) || isNumericDataDef(cd);
}

export function isNumericDataDef<F extends Field>(cd: ChannelDef<F>): cd is DatumDef<F, number> {
  return isDatumDef(cd) && isNumber(cd.datum);
}

export function isFieldOrDatumDef<F extends Field>(
  channelDef: Partial<ChannelDef<F>>
): channelDef is FieldDef<F, any> | DatumDef<F> {
  return isFieldDef(channelDef) || isDatumDef(channelDef);
}

export function isTypedFieldDef<F extends Field>(channelDef: ChannelDef<F>): channelDef is TypedFieldDef<F> {
  return (
    channelDef &&
    (hasProperty(channelDef, 'field') || (channelDef as any)['aggregate'] === 'count') &&
    hasProperty(channelDef, 'type')
  );
}

export function isValueDef<F extends Field>(channelDef: Partial<ChannelDef<F>>): channelDef is ValueDef<any> {
  return hasProperty(channelDef, 'value');
}

export function isScaleFieldDef<F extends Field>(channelDef: ChannelDef<F>): channelDef is ScaleFieldDef<F> {
  return hasProperty(channelDef, 'scale') || hasProperty(channelDef, 'sort');
}

export function isPositionFieldOrDatumDef<F extends Field>(
  channelDef: ChannelDef<F>
): channelDef is PositionFieldDef<F> | PositionDatumDef<F> {
  return hasProperty(channelDef, 'axis') || hasProperty(channelDef, 'stack') || hasProperty(channelDef, 'impute');
}

export function isMarkPropFieldOrDatumDef<F extends Field>(
  channelDef: ChannelDef<F>
): channelDef is MarkPropFieldDef<F, any> | MarkPropDatumDef<F> {
  return hasProperty(channelDef, 'legend');
}

export function isStringFieldOrDatumDef<F extends Field>(
  channelDef: ChannelDef<F>
): channelDef is StringFieldDef<F> | StringDatumDef<F> {
  return hasProperty(channelDef, 'format') || hasProperty(channelDef, 'formatType');
}

export function toStringFieldDef<F extends Field>(fieldDef: FieldDef<F>): StringFieldDef<F> {
  // omit properties that don't exist in string field defs
  return omit(fieldDef, ['legend', 'axis', 'header', 'scale'] as any[]);
}

export interface FieldRefOption {
  /** Exclude bin, aggregate, timeUnit */
  nofn?: boolean;
  /** Wrap the field with datum, parent, or datum.datum (e.g., datum['...'] for Vega Expression */
  expr?: 'datum' | 'parent' | 'datum.datum';
  /** Prepend fn with custom function prefix */
  prefix?: string;
  /** Append suffix to the field ref for bin (default='start') */
  binSuffix?: 'end' | 'range' | 'mid';
  /** Append suffix to the field ref (general) */
  suffix?: string;
  /**
   * Use the field name for `as` in a transform.
   * We will not escape nested accesses because Vega transform outputs cannot be nested.
   */
  forAs?: boolean;
}

function isOpFieldDef(
  fieldDef: FieldDefBase<string> | WindowFieldDef | AggregatedFieldDef
): fieldDef is WindowFieldDef | AggregatedFieldDef {
  return hasProperty(fieldDef, 'op');
}

/**
 * Get a Vega field reference from a Vega-Lite field def.
 */
export function vgField(
  fieldDef: FieldDefBase<string> | WindowFieldDef | AggregatedFieldDef,
  opt: FieldRefOption = {}
): string {
  let field = fieldDef.field;
  const prefix = opt.prefix;
  let suffix = opt.suffix;

  let argAccessor = ''; // for accessing argmin/argmax field at the end without getting escaped

  if (isCount(fieldDef)) {
    field = internalField('count');
  } else {
    let fn: string;

    if (!opt.nofn) {
      if (isOpFieldDef(fieldDef)) {
        fn = fieldDef.op;
      } else {
        const {bin, aggregate, timeUnit} = fieldDef;
        if (isBinning(bin)) {
          fn = binToString(bin);
          suffix = (opt.binSuffix ?? '') + (opt.suffix ?? '');
        } else if (aggregate) {
          if (isArgmaxDef(aggregate)) {
            argAccessor = `["${field}"]`;
            field = `argmax_${aggregate.argmax}`;
          } else if (isArgminDef(aggregate)) {
            argAccessor = `["${field}"]`;
            field = `argmin_${aggregate.argmin}`;
          } else {
            fn = String(aggregate);
          }
        } else if (timeUnit && !isBinnedTimeUnit(timeUnit)) {
          fn = timeUnitToString(timeUnit);
          suffix = ((!['range', 'mid'].includes(opt.binSuffix) && opt.binSuffix) || '') + (opt.suffix ?? '');
        }
      }
    }

    if (fn) {
      field = field ? `${fn}_${field}` : fn;
    }
  }

  if (suffix) {
    field = `${field}_${suffix}`;
  }

  if (prefix) {
    field = `${prefix}_${field}`;
  }

  if (opt.forAs) {
    return removePathFromField(field);
  } else if (opt.expr) {
    // Expression to access flattened field. No need to escape dots.
    return flatAccessWithDatum(field, opt.expr) + argAccessor;
  } else {
    // We flattened all fields so paths should have become dot.
    return replacePathInField(field) + argAccessor;
  }
}

export function isDiscrete(def: TypedFieldDef<Field> | DatumDef<any, any>) {
  switch (def.type) {
    case 'nominal':
    case 'ordinal':
    case 'geojson':
      return true;
    case 'quantitative':
      return isFieldDef(def) && !!def.bin;
    case 'temporal':
      return false;
  }
  throw new Error(log.message.invalidFieldType(def.type));
}

export function isDiscretizing(def: TypedFieldDef<Field> | DatumDef<any, any>) {
  return isScaleFieldDef(def) && isContinuousToDiscrete(def.scale?.type);
}

export function isCount(fieldDef: FieldDefBase<Field>) {
  return fieldDef.aggregate === 'count';
}

export type FieldTitleFormatter = (fieldDef: FieldDefBase<string>, config: Config) => string;

export function verbalTitleFormatter(fieldDef: FieldDefBase<string>, config: Config) {
  const {field, bin, timeUnit, aggregate} = fieldDef;
  if (aggregate === 'count') {
    return config.countTitle;
  } else if (isBinning(bin)) {
    return `${field} (binned)`;
  } else if (timeUnit && !isBinnedTimeUnit(timeUnit)) {
    const unit = normalizeTimeUnit(timeUnit)?.unit;
    if (unit) {
      return `${field} (${getTimeUnitParts(unit).join('-')})`;
    }
  } else if (aggregate) {
    if (isArgmaxDef(aggregate)) {
      return `${field} for max ${aggregate.argmax}`;
    } else if (isArgminDef(aggregate)) {
      return `${field} for min ${aggregate.argmin}`;
    } else {
      return `${titleCase(aggregate)} of ${field}`;
    }
  }
  return field;
}

export function functionalTitleFormatter(fieldDef: FieldDefBase<string>) {
  const {aggregate, bin, timeUnit, field} = fieldDef;
  if (isArgmaxDef(aggregate)) {
    return `${field} for argmax(${aggregate.argmax})`;
  } else if (isArgminDef(aggregate)) {
    return `${field} for argmin(${aggregate.argmin})`;
  }

  const timeUnitParams = timeUnit && !isBinnedTimeUnit(timeUnit) ? normalizeTimeUnit(timeUnit) : undefined;

  const fn = aggregate || timeUnitParams?.unit || (timeUnitParams?.maxbins && 'timeunit') || (isBinning(bin) && 'bin');
  return fn ? `${fn.toUpperCase()}(${field})` : field;
}

export const defaultTitleFormatter: FieldTitleFormatter = (fieldDef: FieldDefBase<string>, config: Config) => {
  switch (config.fieldTitle) {
    case 'plain':
      return fieldDef.field;
    case 'functional':
      return functionalTitleFormatter(fieldDef);
    default:
      return verbalTitleFormatter(fieldDef, config);
  }
};

let titleFormatter = defaultTitleFormatter;

export function setTitleFormatter(formatter: FieldTitleFormatter) {
  titleFormatter = formatter;
}

export function resetTitleFormatter() {
  setTitleFormatter(defaultTitleFormatter);
}

export function title(
  fieldOrDatumDef: TypedFieldDef<string> | SecondaryFieldDef<string> | DatumDef,
  config: Config,
  {allowDisabling, includeDefault = true}: {allowDisabling: boolean; includeDefault?: boolean}
) {
  const guideTitle = getGuide(fieldOrDatumDef)?.title;

  if (!isFieldDef(fieldOrDatumDef)) {
    return guideTitle ?? fieldOrDatumDef.title;
  }
  const fieldDef = fieldOrDatumDef;

  const def = includeDefault ? defaultTitle(fieldDef, config) : undefined;

  if (allowDisabling) {
    return getFirstDefined(guideTitle, fieldDef.title, def);
  } else {
    return guideTitle ?? fieldDef.title ?? def;
  }
}

export function getGuide(fieldDef: TypedFieldDef<string> | SecondaryFieldDef<string> | DatumDef): Guide {
  if (isPositionFieldOrDatumDef(fieldDef) && fieldDef.axis) {
    return fieldDef.axis;
  } else if (isMarkPropFieldOrDatumDef(fieldDef) && fieldDef.legend) {
    return fieldDef.legend;
  } else if (isFacetFieldDef(fieldDef) && fieldDef.header) {
    return fieldDef.header;
  }
  return undefined;
}

export function defaultTitle(fieldDef: FieldDefBase<string>, config: Config) {
  return titleFormatter(fieldDef, config);
}

export function getFormatMixins(fieldDef: TypedFieldDef<string> | DatumDef) {
  if (isStringFieldOrDatumDef(fieldDef)) {
    const {format, formatType} = fieldDef;
    return {format, formatType};
  } else {
    const guide = getGuide(fieldDef) ?? {};
    const {format, formatType} = guide;
    return {format, formatType};
  }
}

export function defaultType<T extends TypedFieldDef<Field>>(fieldDef: T, channel: ExtendedChannel): Type {
  switch (channel) {
    case 'latitude':
    case 'longitude':
      return 'quantitative';

    case 'row':
    case 'column':
    case 'facet':
    case 'shape':
    case 'strokeDash':
      return 'nominal';

    case 'order':
      return 'ordinal';
  }

  if (isSortableFieldDef(fieldDef) && isArray(fieldDef.sort)) {
    return 'ordinal';
  }

  const {aggregate, bin, timeUnit} = fieldDef;
  if (timeUnit) {
    return 'temporal';
  }

  if (bin || (aggregate && !isArgmaxDef(aggregate) && !isArgminDef(aggregate))) {
    return 'quantitative';
  }

  if (isScaleFieldDef(fieldDef) && fieldDef.scale?.type) {
    switch (SCALE_CATEGORY_INDEX[fieldDef.scale.type]) {
      case 'numeric':
      case 'discretizing':
        return 'quantitative';
      case 'time':
        return 'temporal';
    }
  }

  return 'nominal';
}

/**
 * Returns the fieldDef -- either from the outer channelDef or from the condition of channelDef.
 * @param channelDef
 */

export function getFieldDef<F extends Field>(channelDef: ChannelDef<F>): FieldDef<F> {
  if (isFieldDef(channelDef)) {
    return channelDef;
  } else if (hasConditionalFieldDef(channelDef)) {
    return channelDef.condition;
  }
  return undefined;
}

export function getFieldOrDatumDef<F extends Field = string, CD extends ChannelDef<F> = ChannelDef<F>>(
  channelDef: CD
): FieldDef<F> | DatumDef<F> {
  if (isFieldOrDatumDef<F>(channelDef)) {
    return channelDef;
  } else if (hasConditionalFieldOrDatumDef(channelDef)) {
    return channelDef.condition;
  }
  return undefined;
}

/**
 * Convert type to full, lowercase type, or augment the fieldDef with a default type if missing.
 */
export function initChannelDef(
  channelDef: ChannelDef<string>,
  channel: ExtendedChannel,
  config: Config,
  opt: {compositeMark?: boolean} = {}
): ChannelDef<string> {
  if (isString(channelDef) || isNumber(channelDef) || isBoolean(channelDef)) {
    const primitiveType = isString(channelDef) ? 'string' : isNumber(channelDef) ? 'number' : 'boolean';
    log.warn(log.message.primitiveChannelDef(channel, primitiveType, channelDef));
    return {value: channelDef} as ValueDef<any>;
  }

  // If a fieldDef contains a field, we need type.
  if (isFieldOrDatumDef(channelDef)) {
    return initFieldOrDatumDef(channelDef, channel, config, opt);
  } else if (hasConditionalFieldOrDatumDef(channelDef)) {
    return {
      ...channelDef,
      // Need to cast as normalizeFieldDef normally return FieldDef, but here we know that it is definitely Condition<FieldDef>
      condition: initFieldOrDatumDef(channelDef.condition, channel, config, opt) as Conditional<TypedFieldDef<string>>
    };
  }
  return channelDef;
}

export function initFieldOrDatumDef(
  fd: FieldDef<string, any> | DatumDef,
  channel: ExtendedChannel,
  config: Config,
  opt: {compositeMark?: boolean}
): FieldDef<string, any> | DatumDef {
  if (isStringFieldOrDatumDef(fd)) {
    const {format, formatType, ...rest} = fd;
    if (isCustomFormatType(formatType) && !config.customFormatTypes) {
      log.warn(log.message.customFormatTypeNotAllowed(channel));
      return initFieldOrDatumDef(rest, channel, config, opt);
    }
  } else {
    const guideType = isPositionFieldOrDatumDef(fd)
      ? 'axis'
      : isMarkPropFieldOrDatumDef(fd)
        ? 'legend'
        : isFacetFieldDef(fd)
          ? 'header'
          : null;
    if (guideType && (fd as any)[guideType]) {
      const {format, formatType, ...newGuide} = (fd as any)[guideType];
      if (isCustomFormatType(formatType) && !config.customFormatTypes) {
        log.warn(log.message.customFormatTypeNotAllowed(channel));
        return initFieldOrDatumDef({...fd, [guideType]: newGuide}, channel, config, opt);
      }
    }
  }

  if (isFieldDef(fd)) {
    return initFieldDef(fd, channel, opt);
  }
  return initDatumDef(fd);
}

function initDatumDef(datumDef: DatumDef): DatumDef {
  let type = datumDef['type'];
  if (type) {
    return datumDef;
  }
  const {datum} = datumDef;
  type = isNumber(datum) ? 'quantitative' : isString(datum) ? 'nominal' : isDateTime(datum) ? 'temporal' : undefined;

  return {...datumDef, type};
}

export function initFieldDef(
  fd: FieldDef<string, any>,
  channel: ExtendedChannel,
  {compositeMark = false}: {compositeMark?: boolean} = {}
) {
  const {aggregate, timeUnit, bin, field} = fd;
  const fieldDef = {...fd};

  // Drop invalid aggregate
  if (!compositeMark && aggregate && !isAggregateOp(aggregate) && !isArgmaxDef(aggregate) && !isArgminDef(aggregate)) {
    log.warn(log.message.invalidAggregate(aggregate));
    delete fieldDef.aggregate;
  }

  // Normalize Time Unit
  if (timeUnit) {
    fieldDef.timeUnit = normalizeTimeUnit(timeUnit);
  }

  if (field) {
    fieldDef.field = `${field}`;
  }

  // Normalize bin
  if (isBinning(bin)) {
    fieldDef.bin = normalizeBin(bin, channel);
  }

  if (isBinned(bin) && !isXorY(channel)) {
    log.warn(log.message.channelShouldNotBeUsedForBinned(channel));
  }

  // Normalize Type
  if (isTypedFieldDef(fieldDef)) {
    const {type} = fieldDef;
    const fullType = getFullName(type);
    if (type !== fullType) {
      // convert short type to full type
      fieldDef.type = fullType;
    }
    if (type !== 'quantitative') {
      if (isCountingAggregateOp(aggregate)) {
        log.warn(log.message.invalidFieldTypeForCountAggregate(type, aggregate));
        fieldDef.type = 'quantitative';
      }
    }
  } else if (!isSecondaryRangeChannel(channel)) {
    // If type is empty / invalid, then augment with default type
    const newType = defaultType(fieldDef as TypedFieldDef<any>, channel);
    (fieldDef as any)['type'] = newType;
  }

  if (isTypedFieldDef(fieldDef)) {
    const {compatible, warning} = channelCompatibility(fieldDef, channel) || {};
    if (compatible === false) {
      log.warn(warning);
    }
  }

  if (isSortableFieldDef(fieldDef) && isString(fieldDef.sort)) {
    const {sort} = fieldDef;
    if (isSortByChannel(sort)) {
      return {
        ...fieldDef,
        sort: {encoding: sort}
      };
    }
    const sub = sort.substring(1);
    if (sort.charAt(0) === '-' && isSortByChannel(sub)) {
      return {
        ...fieldDef,
        sort: {encoding: sub, order: 'descending'}
      };
    }
  }

  if (isFacetFieldDef(fieldDef)) {
    const {header} = fieldDef;
    if (header) {
      const {orient, ...rest} = header;
      if (orient) {
        return {
          ...fieldDef,
          header: {
            ...rest,
            labelOrient: header.labelOrient || orient,
            titleOrient: header.titleOrient || orient
          }
        };
      }
    }
  }

  return fieldDef;
}

export function normalizeBin(bin: BinParams | boolean | 'binned', channel?: ExtendedChannel) {
  if (isBoolean(bin)) {
    return {maxbins: autoMaxBins(channel)};
  } else if (bin === 'binned') {
    return {
      binned: true
    };
  } else if (!bin.maxbins && !bin.step) {
    return {...bin, maxbins: autoMaxBins(channel)};
  } else {
    return bin;
  }
}

const COMPATIBLE = {compatible: true};
export function channelCompatibility(
  fieldDef: TypedFieldDef<Field>,
  channel: ExtendedChannel
): {compatible: boolean; warning?: string} {
  const type = fieldDef.type;

  if (type === 'geojson' && channel !== 'shape') {
    return {
      compatible: false,
      warning: `Channel ${channel} should not be used with a geojson data.`
    };
  }

  switch (channel) {
    case ROW:
    case COLUMN:
    case FACET:
      if (!isDiscrete(fieldDef)) {
        return {
          compatible: false,
          warning: log.message.channelShouldBeDiscrete(channel)
        };
      }
      return COMPATIBLE;

    case X:
    case Y:
    case XOFFSET:
    case YOFFSET:
    case COLOR:
    case FILL:
    case STROKE:
    case TEXT:
    case DETAIL:
    case KEY:
    case TOOLTIP:
    case HREF:
    case URL:
    case ANGLE:
    case THETA:
    case RADIUS:
    case DESCRIPTION:
      return COMPATIBLE;

    case LONGITUDE:
    case LONGITUDE2:
    case LATITUDE:
    case LATITUDE2:
      if (type !== QUANTITATIVE) {
        return {
          compatible: false,
          warning: `Channel ${channel} should be used with a quantitative field only, not ${fieldDef.type} field.`
        };
      }
      return COMPATIBLE;

    case OPACITY:
    case FILLOPACITY:
    case STROKEOPACITY:
    case STROKEWIDTH:
    case SIZE:
    case THETA2:
    case RADIUS2:
    case X2:
    case Y2:
    case TIME:
      if (type === 'nominal' && !(fieldDef as any)['sort']) {
        return {
          compatible: false,
          warning: `Channel ${channel} should not be used with an unsorted discrete field.`
        };
      }
      return COMPATIBLE;

    case SHAPE:
    case STROKEDASH:
      if (!isDiscrete(fieldDef) && !isDiscretizing(fieldDef)) {
        return {
          compatible: false,
          warning: log.message.channelShouldBeDiscreteOrDiscretizing(channel)
        };
      }
      return COMPATIBLE;

    case ORDER:
      if (fieldDef.type === 'nominal' && !('sort' in fieldDef)) {
        return {
          compatible: false,
          warning: `Channel order is inappropriate for nominal field, which has no inherent order.`
        };
      }
      return COMPATIBLE;
  }
}

/**
 * Check if the field def uses a time format or does not use any format but is temporal
 * (this does not cover field defs that are temporal but use a number format).
 */
export function isFieldOrDatumDefForTimeFormat(fieldOrDatumDef: FieldDef<string> | DatumDef): boolean {
  const {formatType} = getFormatMixins(fieldOrDatumDef);
  return formatType === 'time' || (!formatType && isTemporalFieldDef(fieldOrDatumDef));
}

/**
 * Check if field def has type `temporal`. If you want to also cover field defs that use a time format, use `isFieldOrDatumDefForTimeFormat`.
 */
export function isTemporalFieldDef(def: FieldDef<any> | DatumDef): boolean {
  return def && ((def as any)['type'] === 'temporal' || (isFieldDef(def) && !!def.timeUnit));
}

/**
 * Getting a value associated with a fielddef.
 * Convert the value to Vega expression if applicable (for datetime object, or string if the field def is temporal or has timeUnit)
 */
export function valueExpr(
  v: number | string | boolean | DateTime | ExprRef | SignalRef | number[],
  {
    timeUnit,
    type,
    wrapTime,
    undefinedIfExprNotRequired
  }: {
    timeUnit: TimeUnit | TimeUnitParams;
    type?: Type;
    wrapTime?: boolean;
    undefinedIfExprNotRequired?: boolean;
  }
): string {
  const unit = timeUnit && normalizeTimeUnit(timeUnit)?.unit;
  let isTime = unit || type === 'temporal';

  let expr;
  if (isExprRef(v)) {
    expr = v.expr;
  } else if (isSignalRef(v)) {
    expr = v.signal;
  } else if (isDateTime(v)) {
    isTime = true;
    expr = dateTimeToExpr(v);
  } else if (isString(v) || isNumber(v)) {
    if (isTime) {
      expr = `datetime(${stringify(v)})`;

      if (isLocalSingleTimeUnit(unit)) {
        // for single timeUnit, we will use dateTimeToExpr to convert number/string to match the timeUnit
        if ((isNumber(v) && v < 10000) || (isString(v) && isNaN(Date.parse(v)))) {
          expr = dateTimeToExpr({[unit]: v});
        }
      }
    }
  }
  if (expr) {
    return wrapTime && isTime ? `time(${expr})` : expr;
  }
  // number or boolean or normal string
  return undefinedIfExprNotRequired ? undefined : stringify(v);
}

/**
 * Standardize value array -- convert each value to Vega expression if applicable
 */
export function valueArray(
  fieldOrDatumDef: TypedFieldDef<string> | DatumDef,
  values: (number | string | boolean | DateTime)[]
) {
  const {type} = fieldOrDatumDef;
  return values.map(v => {
    const timeUnit =
      isFieldDef(fieldOrDatumDef) && !isBinnedTimeUnit(fieldOrDatumDef.timeUnit) ? fieldOrDatumDef.timeUnit : undefined;
    const expr = valueExpr(v, {
      timeUnit,
      type,
      undefinedIfExprNotRequired: true
    });
    // return signal for the expression if we need an expression
    if (expr !== undefined) {
      return {signal: expr};
    }
    // otherwise just return the original value
    return v;
  });
}

/**
 * Checks whether a fieldDef for a particular channel requires a computed bin range.
 */
export function binRequiresRange(fieldDef: FieldDef<string>, channel: Channel): boolean {
  if (!isBinning(fieldDef.bin)) {
    console.warn('Only call this method for binned field defs.');
    return false;
  }

  // We need the range only when the user explicitly forces a binned field to be use discrete scale. In this case, bin range is used in axis and legend labels.
  // We could check whether the axis or legend exists (not disabled) but that seems overkill.
  return isScaleChannel(channel) && ['ordinal', 'nominal'].includes((fieldDef as ScaleFieldDef<string>).type);
}
