import type {AggregateOp} from 'vega';
import {array, isArray} from 'vega-util';
import {isArgmaxDef, isArgminDef} from './aggregate';
import {isBinned, isBinning} from './bin';
import {
  ANGLE,
  Channel,
  CHANNELS,
  COLOR,
  DESCRIPTION,
  DETAIL,
  FILL,
  FILLOPACITY,
  getMainChannelFromOffsetChannel,
  getOffsetScaleChannel,
  HREF,
  isChannel,
  isNonPositionScaleChannel,
  isSecondaryRangeChannel,
  isXorY,
  isXorYOffset,
  KEY,
  LATITUDE,
  LATITUDE2,
  LONGITUDE,
  LONGITUDE2,
  OPACITY,
  ORDER,
  RADIUS,
  RADIUS2,
  SHAPE,
  SIZE,
  STROKE,
  STROKEDASH,
  STROKEOPACITY,
  STROKEWIDTH,
  supportMark,
  TEXT,
  THETA,
  THETA2,
  TIME,
  TOOLTIP,
  UNIT_CHANNELS,
  URL,
  X,
  X2,
  XOFFSET,
  Y,
  Y2,
  YOFFSET
} from './channel';
import {
  binRequiresRange,
  ChannelDef,
  ColorDef,
  Field,
  FieldDef,
  FieldDefWithoutScale,
  getFieldDef,
  getGuide,
  hasConditionalFieldDef,
  hasConditionalFieldOrDatumDef,
  initChannelDef,
  initFieldDef,
  isConditionalDef,
  isDatumDef,
  isFieldDef,
  isOrderOnlyDef,
  isTypedFieldDef,
  isValueDef,
  LatLongDef,
  NumericArrayMarkPropDef,
  NumericMarkPropDef,
  OffsetDef,
  OrderFieldDef,
  OrderOnlyDef,
  OrderValueDef,
  PolarDef,
  Position2Def,
  PositionDef,
  SecondaryFieldDef,
  ShapeDef,
  StringFieldDef,
  StringFieldDefWithCondition,
  StringValueDefWithCondition,
  TextDef,
  TimeDef,
  title,
  TypedFieldDef,
  vgField
} from './channeldef';
import {Config} from './config';
import * as log from './log';
import {Mark} from './mark';
import {EncodingFacetMapping} from './spec/facet';
import {AggregatedFieldDef, BinTransform, TimeUnitTransform} from './transform';
import {isContinuous, isDiscrete, QUANTITATIVE, TEMPORAL} from './type';
import {keys, some} from './util';
import {isSignalRef} from './vega.schema';
import {isBinnedTimeUnit} from './timeunit';

export interface Encoding<F extends Field> {
  /**
   * X coordinates of the marks, or width of horizontal `"bar"` and `"area"` without specified `x2` or `width`.
   *
   * The `value` of this channel can be a number or a string `"width"` for the width of the plot.
   */
  x?: PositionDef<F>;

  /**
   * Y coordinates of the marks, or height of vertical `"bar"` and `"area"` without specified `y2` or `height`.
   *
   * The `value` of this channel can be a number or a string `"height"` for the height of the plot.
   */
  y?: PositionDef<F>;

  /**
   * Offset of x-position of the marks
   */
  xOffset?: OffsetDef<F>;

  /**
   * Offset of y-position of the marks
   */
  yOffset?: OffsetDef<F>;

  /**
   * X2 coordinates for ranged `"area"`, `"bar"`, `"rect"`, and  `"rule"`.
   *
   * The `value` of this channel can be a number or a string `"width"` for the width of the plot.
   */
  // TODO: Ham need to add default behavior
  // `x2` cannot have type as it should have the same type as `x`
  x2?: Position2Def<F>;

  /**
   * Y2 coordinates for ranged `"area"`, `"bar"`, `"rect"`, and  `"rule"`.
   *
   * The `value` of this channel can be a number or a string `"height"` for the height of the plot.
   */
  // TODO: Ham need to add default behavior
  // `y2` cannot have type as it should have the same type as `y`
  y2?: Position2Def<F>;

  /**
   * Longitude position of geographically projected marks.
   */
  longitude?: LatLongDef<F>;

  /**
   * Latitude position of geographically projected marks.
   */
  latitude?: LatLongDef<F>;

  /**
   * Longitude-2 position for geographically projected ranged `"area"`, `"bar"`, `"rect"`, and  `"rule"`.
   */
  // `longitude2` cannot have type as it should have the same type as `longitude`
  longitude2?: Position2Def<F>;

  /**
   * Latitude-2 position for geographically projected ranged `"area"`, `"bar"`, `"rect"`, and  `"rule"`.
   */
  // `latitude2` cannot have type as it should have the same type as `latitude`
  latitude2?: Position2Def<F>;

  /**
   * - For arc marks, the arc length in radians if theta2 is not specified, otherwise the start arc angle. (A value of 0 indicates up or “north”, increasing values proceed clockwise.)
   *
   * - For text marks, polar coordinate angle in radians.
   */
  theta?: PolarDef<F>;

  /**
   * The end angle of arc marks in radians. A value of 0 indicates up or “north”, increasing values proceed clockwise.
   */
  theta2?: Position2Def<F>;

  /**
   * The outer radius in pixels of arc marks.
   */

  radius?: PolarDef<F>;

  /**
   * The inner radius in pixels of arc marks.
   */
  radius2?: Position2Def<F>;

  /**
   * Time position of animated marks.
   */
  time?: TimeDef<F>;

  /**
   * Color of the marks – either fill or stroke color based on  the `filled` property of mark definition.
   * By default, `color` represents fill color for `"area"`, `"bar"`, `"tick"`,
   * `"text"`, `"trail"`, `"circle"`, and `"square"` / stroke color for `"line"` and `"point"`.
   *
   * __Default value:__ If undefined, the default color depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `color` property.
   *
   * _Note:_
   * 1) For fine-grained control over both fill and stroke colors of the marks, please use the `fill` and `stroke` channels. The `fill` or `stroke` encodings have higher precedence than `color`, thus may override the `color` encoding if conflicting encodings are specified.
   * 2) See the scale documentation for more information about customizing [color scheme](https://vega.github.io/vega-lite/docs/scale.html#scheme).
   */
  color?: ColorDef<F>;

  /**
   * Fill color of the marks.
   * __Default value:__ If undefined, the default color depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `color` property.
   *
   * _Note:_ The `fill` encoding has higher precedence than `color`, thus may override the `color` encoding if conflicting encodings are specified.
   */
  fill?: ColorDef<F>;

  /**
   * Stroke color of the marks.
   * __Default value:__ If undefined, the default color depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `color` property.
   *
   * _Note:_ The `stroke` encoding has higher precedence than `color`, thus may override the `color` encoding if conflicting encodings are specified.
   */

  stroke?: ColorDef<F>;

  /**
   * Opacity of the marks.
   *
   * __Default value:__ If undefined, the default opacity depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `opacity` property.
   */
  opacity?: NumericMarkPropDef<F>;

  /**
   * Fill opacity of the marks.
   *
   * __Default value:__ If undefined, the default opacity depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `fillOpacity` property.
   */
  fillOpacity?: NumericMarkPropDef<F>;

  /**
   * Stroke opacity of the marks.
   *
   * __Default value:__ If undefined, the default opacity depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `strokeOpacity` property.
   */
  strokeOpacity?: NumericMarkPropDef<F>;

  /**
   * Stroke width of the marks.
   *
   * __Default value:__ If undefined, the default stroke width depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#mark-config)'s `strokeWidth` property.
   */
  strokeWidth?: NumericMarkPropDef<F>;

  /**
   * Stroke dash of the marks.
   *
   * __Default value:__ `[1,0]` (No dash).
   */
  strokeDash?: NumericArrayMarkPropDef<F>;

  /**
   * Size of the mark.
   * - For `"point"`, `"square"` and `"circle"`, – the symbol size, or pixel area of the mark.
   * - For `"bar"` and `"tick"` – the bar and tick's size.
   * - For `"text"` – the text's font size.
   * - Size is unsupported for `"line"`, `"area"`, and `"rect"`. (Use `"trail"` instead of line with varying size)
   */
  size?: NumericMarkPropDef<F>;

  /**
   * Rotation angle of point and text marks.
   */
  angle?: NumericMarkPropDef<F>;

  /**
   * Shape of the mark.
   *
   * 1. For `point` marks the supported values include:
   *   - plotting shapes: `"circle"`, `"square"`, `"cross"`, `"diamond"`, `"triangle-up"`, `"triangle-down"`, `"triangle-right"`, or `"triangle-left"`.
   *   - the line symbol `"stroke"`
   *   - centered directional shapes `"arrow"`, `"wedge"`, or `"triangle"`
   *   - a custom [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) (For correct sizing, custom shape paths should be defined within a square bounding box with coordinates ranging from -1 to 1 along both the x and y dimensions.)
   *
   * 2. For `geoshape` marks it should be a field definition of the geojson data
   *
   * __Default value:__ If undefined, the default shape depends on [mark config](https://vega.github.io/vega-lite/docs/config.html#point-config)'s `shape` property. (`"circle"` if unset.)
   */
  shape?: ShapeDef<F>;
  /**
   * Additional levels of detail for grouping data in aggregate views and
   * in line, trail, and area marks without mapping data to a specific visual channel.
   */
  detail?: FieldDefWithoutScale<F> | FieldDefWithoutScale<F>[];

  /**
   * A data field to use as a unique key for data binding. When a visualization’s data is updated, the key value will be used to match data elements to existing mark instances. Use a key channel to enable object constancy for transitions over dynamic data.
   */
  key?: FieldDefWithoutScale<F>;

  /**
   * Text of the `text` mark.
   */
  text?: TextDef<F>;

  /**
   * The tooltip text to show upon mouse hover. Specifying `tooltip` encoding overrides [the `tooltip` property in the mark definition](https://vega.github.io/vega-lite/docs/mark.html#mark-def).
   *
   * See the [`tooltip`](https://vega.github.io/vega-lite/docs/tooltip.html) documentation for a detailed discussion about tooltip in Vega-Lite.
   */
  tooltip?: StringFieldDefWithCondition<F> | StringValueDefWithCondition<F> | StringFieldDef<F>[] | null;

  /**
   * A URL to load upon mouse click.
   */
  href?: StringFieldDefWithCondition<F> | StringValueDefWithCondition<F>;

  /**
   * The URL of an image mark.
   */
  url?: StringFieldDefWithCondition<F> | StringValueDefWithCondition<F>;

  /**
   * A text description of this mark for ARIA accessibility (SVG output only). For SVG output the `"aria-label"` attribute will be set to this description.
   */
  description?: StringFieldDefWithCondition<F> | StringValueDefWithCondition<F>;

  /**
   * Order of the marks.
   * - For stacked marks, this `order` channel encodes [stack order](https://vega.github.io/vega-lite/docs/stack.html#order).
   * - For line and trail marks, this `order` channel encodes order of data points in the lines. This can be useful for creating [a connected scatterplot](https://vega.github.io/vega-lite/examples/connected_scatterplot.html). Setting `order` to `{"value": null}` makes the line marks use the original order in the data sources.
   * - Otherwise, this `order` channel encodes layer order of the marks.
   *
   * __Note__: In aggregate plots, `order` field should be `aggregate`d to avoid creating additional aggregation grouping.
   */
  order?: OrderFieldDef<F> | OrderFieldDef<F>[] | OrderValueDef | OrderOnlyDef;
}

export interface EncodingWithFacet<F extends Field> extends Encoding<F>, EncodingFacetMapping<F> {}

export function channelHasField<F extends Field>(
  encoding: EncodingWithFacet<F>,
  channel: keyof EncodingWithFacet<F>
): boolean {
  const channelDef = encoding?.[channel];
  if (channelDef) {
    if (isArray(channelDef)) {
      return some(channelDef, fieldDef => !!fieldDef.field);
    } else {
      return isFieldDef(channelDef) || hasConditionalFieldDef<Field>(channelDef);
    }
  }
  return false;
}

export function channelHasFieldOrDatum<F extends Field>(
  encoding: EncodingWithFacet<F>,
  channel: keyof EncodingWithFacet<F>
): boolean {
  const channelDef = encoding?.[channel];
  if (channelDef) {
    if (isArray(channelDef)) {
      return some(channelDef, fieldDef => !!fieldDef.field);
    } else {
      return isFieldDef(channelDef) || isDatumDef(channelDef) || hasConditionalFieldOrDatumDef<Field>(channelDef);
    }
  }
  return false;
}

export function channelHasNestedOffsetScale<F extends Field>(
  encoding: EncodingWithFacet<F>,
  channel: keyof EncodingWithFacet<F>
): boolean {
  if (isXorY(channel)) {
    const fieldDef = encoding[channel];
    if (
      (isFieldDef(fieldDef) || isDatumDef(fieldDef)) &&
      (isDiscrete(fieldDef.type) || (isFieldDef(fieldDef) && fieldDef.timeUnit))
    ) {
      const offsetChannel = getOffsetScaleChannel(channel);
      return channelHasFieldOrDatum(encoding, offsetChannel);
    }
  }
  return false;
}

export function isAggregate(encoding: EncodingWithFacet<any>) {
  return some(CHANNELS, channel => {
    if (channelHasField(encoding, channel)) {
      const channelDef = encoding[channel];
      if (isArray(channelDef)) {
        return some(channelDef, fieldDef => !!fieldDef.aggregate);
      } else {
        const fieldDef = getFieldDef(channelDef);
        return fieldDef && !!fieldDef.aggregate;
      }
    }
    return false;
  });
}

export function extractTransformsFromEncoding(oldEncoding: Encoding<any>, config: Config) {
  const groupby: string[] = [];
  const bins: BinTransform[] = [];
  const timeUnits: TimeUnitTransform[] = [];
  const aggregate: AggregatedFieldDef[] = [];
  const encoding: Encoding<string> = {};

  forEach(oldEncoding, (channelDef, channel) => {
    // Extract potential embedded transformations along with remaining properties
    if (isFieldDef(channelDef)) {
      const {field, aggregate: aggOp, bin, timeUnit, ...remaining} = channelDef;
      if (aggOp || timeUnit || bin) {
        const guide = getGuide(channelDef);
        const isTitleDefined = guide?.title;
        let newField = vgField(channelDef, {forAs: true});
        const newFieldDef: FieldDef<string> = {
          // Only add title if it doesn't exist
          ...(isTitleDefined ? [] : {title: title(channelDef, config, {allowDisabling: true})}),
          ...remaining,
          // Always overwrite field
          field: newField
        };

        if (aggOp) {
          let op: AggregateOp;

          if (isArgmaxDef(aggOp)) {
            op = 'argmax';
            newField = vgField({op: 'argmax', field: aggOp.argmax}, {forAs: true});
            newFieldDef.field = `${newField}.${field}`;
          } else if (isArgminDef(aggOp)) {
            op = 'argmin';
            newField = vgField({op: 'argmin', field: aggOp.argmin}, {forAs: true});
            newFieldDef.field = `${newField}.${field}`;
          } else if (aggOp !== 'boxplot' && aggOp !== 'errorbar' && aggOp !== 'errorband') {
            op = aggOp;
          }

          if (op) {
            const aggregateEntry: AggregatedFieldDef = {
              op,
              as: newField
            };
            if (field) {
              aggregateEntry.field = field;
            }
            aggregate.push(aggregateEntry);
          }
        } else {
          groupby.push(newField);
          if (isTypedFieldDef(channelDef) && isBinning(bin)) {
            bins.push({bin, field, as: newField});
            // Add additional groupbys for range and end of bins
            groupby.push(vgField(channelDef, {binSuffix: 'end'}));
            if (binRequiresRange(channelDef, channel)) {
              groupby.push(vgField(channelDef, {binSuffix: 'range'}));
            }
            // Create accompanying 'x2' or 'y2' field if channel is 'x' or 'y' respectively
            if (isXorY(channel)) {
              const secondaryChannel: SecondaryFieldDef<string> = {
                field: `${newField}_end`
              };
              encoding[`${channel}2`] = secondaryChannel;
            }
            newFieldDef.bin = 'binned';
            if (!isSecondaryRangeChannel(channel)) {
              (newFieldDef as any)['type'] = QUANTITATIVE;
            }
          } else if (timeUnit && !isBinnedTimeUnit(timeUnit)) {
            timeUnits.push({
              timeUnit,
              field,
              as: newField
            });

            // define the format type for later compilation
            const formatType = isTypedFieldDef(channelDef) && channelDef.type !== TEMPORAL && 'time';
            if (formatType) {
              if (channel === TEXT || channel === TOOLTIP) {
                (newFieldDef as any)['formatType'] = formatType;
              } else if (isNonPositionScaleChannel(channel)) {
                (newFieldDef as any)['legend'] = {
                  formatType,
                  ...(newFieldDef as any)['legend']
                };
              } else if (isXorY(channel)) {
                (newFieldDef as any)['axis'] = {
                  formatType,
                  ...(newFieldDef as any)['axis']
                };
              }
            }
          }
        }

        // now the field should refer to post-transformed field instead
        (encoding as any)[channel as any] = newFieldDef;
      } else {
        groupby.push(field);
        (encoding as any)[channel as any] = oldEncoding[channel];
      }
    } else {
      // For value def / signal ref / datum def, just copy
      (encoding as any)[channel as any] = oldEncoding[channel];
    }
  });

  return {
    bins,
    timeUnits,
    aggregate,
    groupby,
    encoding
  };
}

export function markChannelCompatible(encoding: Encoding<string>, channel: Channel, mark: Mark) {
  const markSupported = supportMark(channel, mark);
  if (!markSupported) {
    return false;
  } else if (markSupported === 'binned') {
    const primaryFieldDef = encoding[channel === X2 ? X : Y];

    // circle, point, square and tick only support x2/y2 when their corresponding x/y fieldDef
    // has "binned" data and thus need x2/y2 to specify the bin-end field.
    if (isFieldDef(primaryFieldDef) && isFieldDef(encoding[channel]) && isBinned(primaryFieldDef.bin)) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

export function initEncoding(
  encoding: Encoding<string>,
  mark: Mark,
  filled: boolean,
  config: Config
): Encoding<string> {
  const normalizedEncoding: Encoding<string> = {};
  for (const key of keys(encoding)) {
    if (!isChannel(key)) {
      // Drop invalid channel
      log.warn(log.message.invalidEncodingChannel(key));
    }
  }

  for (let channel of UNIT_CHANNELS) {
    if (!encoding[channel]) {
      continue;
    }

    const channelDef = encoding[channel];
    if (isXorYOffset(channel)) {
      const mainChannel = getMainChannelFromOffsetChannel(channel);

      const positionDef = normalizedEncoding[mainChannel];
      if (isFieldDef(positionDef)) {
        if (isContinuous(positionDef.type)) {
          if (isFieldDef(channelDef) && !positionDef.timeUnit) {
            // TODO: nesting continuous field instead continuous field should
            // behave like offsetting the data in data domain
            log.warn(log.message.offsetNestedInsideContinuousPositionScaleDropped(mainChannel));
            continue;
          }
        }
      }
    }

    if (channel === 'angle' && mark === 'arc' && !encoding.theta) {
      log.warn(log.message.REPLACE_ANGLE_WITH_THETA);
      channel = THETA;
    }

    if (!markChannelCompatible(encoding, channel, mark)) {
      // Drop unsupported channel
      log.warn(log.message.incompatibleChannel(channel, mark));
      continue;
    }

    // Drop line's size if the field is aggregated.
    if (channel === SIZE && mark === 'line') {
      const fieldDef = getFieldDef(encoding[channel]);
      if (fieldDef?.aggregate) {
        log.warn(log.message.LINE_WITH_VARYING_SIZE);
        continue;
      }
    }
    // Drop color if either fill or stroke is specified

    if (channel === COLOR && (filled ? 'fill' in encoding : 'stroke' in encoding)) {
      log.warn(log.message.droppingColor('encoding', {fill: 'fill' in encoding, stroke: 'stroke' in encoding}));
      continue;
    }

    if (
      channel === DETAIL ||
      (channel === ORDER && !isArray(channelDef) && !isValueDef(channelDef)) ||
      (channel === TOOLTIP && isArray(channelDef))
    ) {
      if (channelDef) {
        if (channel === ORDER) {
          const def = encoding[channel];
          if (isOrderOnlyDef(def)) {
            normalizedEncoding[channel] = def;
            continue;
          }
        }
        // Array of fieldDefs for detail channel (or production rule)
        (normalizedEncoding[channel] as any) = array(channelDef).reduce(
          (defs: FieldDef<string>[], fieldDef: FieldDef<string>) => {
            if (!isFieldDef(fieldDef)) {
              log.warn(log.message.emptyFieldDef(fieldDef, channel));
            } else {
              defs.push(initFieldDef(fieldDef, channel));
            }
            return defs;
          },
          []
        );
      }
    } else {
      if (channel === TOOLTIP && channelDef === null) {
        // Preserve null so we can use it to disable tooltip
        normalizedEncoding[channel] = null;
      } else if (
        !isFieldDef(channelDef) &&
        !isDatumDef(channelDef) &&
        !isValueDef(channelDef) &&
        !isConditionalDef(channelDef) &&
        !isSignalRef(channelDef)
      ) {
        log.warn(log.message.emptyFieldDef(channelDef, channel));
        continue;
      }

      (normalizedEncoding as any)[channel as any] = initChannelDef(channelDef as ChannelDef, channel, config);
    }
  }
  return normalizedEncoding;
}

/**
 * For composite marks, we have to call initChannelDef during init so we can infer types earlier.
 */
export function normalizeEncoding(encoding: Encoding<string>, config: Config): Encoding<string> {
  const normalizedEncoding: Encoding<string> = {};

  for (const channel of keys(encoding)) {
    const newChannelDef = initChannelDef(encoding[channel], channel, config, {compositeMark: true});
    (normalizedEncoding as any)[channel as any] = newChannelDef;
  }

  return normalizedEncoding;
}

export function fieldDefs<F extends Field>(encoding: EncodingWithFacet<F>): FieldDef<F>[] {
  const arr: FieldDef<F>[] = [];
  for (const channel of keys(encoding)) {
    if (channelHasField(encoding, channel)) {
      const channelDef = encoding[channel];
      const channelDefArray = array(channelDef);
      for (const def of channelDefArray) {
        if (isFieldDef(def)) {
          arr.push(def);
        } else if (hasConditionalFieldDef<F>(def)) {
          arr.push(def.condition);
        }
      }
    }
  }
  return arr;
}

export function forEach<U extends Record<any, any>>(
  mapping: U,
  f: (cd: ChannelDef, c: keyof U) => void,
  thisArg?: any
) {
  if (!mapping) {
    return;
  }

  for (const channel of keys(mapping)) {
    const el = mapping[channel];
    if (isArray(el)) {
      for (const channelDef of el as unknown[]) {
        f.call(thisArg, channelDef, channel);
      }
    } else {
      f.call(thisArg, el, channel);
    }
  }
}

export function reduce<T, U extends Record<any, any>>(
  mapping: U,
  f: (acc: any, fd: TypedFieldDef<string>, c: keyof U) => U,
  init: T,
  thisArg?: any
) {
  if (!mapping) {
    return init;
  }

  return keys(mapping).reduce((r, channel) => {
    const map = mapping[channel];
    if (isArray(map)) {
      return map.reduce((r1: T, channelDef: ChannelDef) => {
        return f.call(thisArg, r1, channelDef, channel);
      }, r);
    } else {
      return f.call(thisArg, r, map, channel);
    }
  }, init);
}

/**
 * Returns list of path grouping fields for the given encoding
 */
export function pathGroupingFields(mark: Mark, encoding: Encoding<string>): string[] {
  return keys(encoding).reduce((details, channel) => {
    switch (channel) {
      // x, y, x2, y2, lat, long, lat1, long2, order, tooltip, href, aria label, cursor should not cause lines to group
      case X:
      case Y:
      case HREF:
      case DESCRIPTION:
      case URL:
      case X2:
      case Y2:
      case XOFFSET:
      case YOFFSET:
      case THETA:
      case THETA2:
      case RADIUS:
      case RADIUS2:
      case TIME:
      // falls through

      case LATITUDE:
      case LONGITUDE:
      case LATITUDE2:
      case LONGITUDE2:
      // TODO: case 'cursor':

      // text, shape, shouldn't be a part of line/trail/area [falls through]
      case TEXT:
      case SHAPE:
      case ANGLE:
      // falls through

      // tooltip fields should not be added to group by [falls through]
      case TOOLTIP:
        return details;

      case ORDER:
        // order should not group line / trail
        if (mark === 'line' || mark === 'trail') {
          return details;
        }
      // but order should group area for stacking (falls through)

      case DETAIL:
      case KEY: {
        const channelDef = encoding[channel];
        if (isArray(channelDef) || isFieldDef(channelDef)) {
          for (const fieldDef of array(channelDef)) {
            if (!fieldDef.aggregate) {
              details.push(vgField(fieldDef, {}));
            }
          }
        }
        return details;
      }

      case SIZE:
        if (mark === 'trail') {
          // For trail, size should not group trail lines.
          return details;
        }
      // For line, size should group lines.

      // falls through
      case COLOR:
      case FILL:
      case STROKE:
      case OPACITY:
      case FILLOPACITY:
      case STROKEOPACITY:
      case STROKEDASH:
      case STROKEWIDTH: {
        // TODO strokeDashOffset:
        // falls through

        const fieldDef = getFieldDef<string>(encoding[channel]);
        if (fieldDef && !fieldDef.aggregate) {
          details.push(vgField(fieldDef, {}));
        }
        return details;
      }
    }
  }, []);
}
