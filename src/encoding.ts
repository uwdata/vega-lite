// utility for encoding mapping
import {FieldDef, PositionFieldDef, LegendFieldDef, OrderFieldDef, ValueDef, TextFieldDef, isFieldDef, ChannelDef, isValueDef, normalize, ConditionalValueDef} from './fielddef';
import {Channel, CHANNELS, supportMark} from './channel';
import {Facet} from './facet';
import {isArray, some, duplicate} from './util';
import {Mark} from './mark';
import * as log from './log';

export interface Encoding {
  /**
   * X coordinates for `point`, `circle`, `square`,
   * `line`, `rule`, `text`, and `tick`
   * (or to width and height for `bar` and `area` marks).
   */
  x?: PositionFieldDef | ValueDef<number>;

  /**
   * Y coordinates for `point`, `circle`, `square`,
   * `line`, `rule`, `text`, and `tick`
   * (or to width and height for `bar` and `area` marks).
   */
  y?: PositionFieldDef | ValueDef<number>;

  /**
   * X2 coordinates for ranged `bar`, `rule`, `area`
   */
  x2?: FieldDef | ValueDef<number>;

  /**
   * Y2 coordinates for ranged `bar`, `rule`, `area`
   */
  y2?: FieldDef | ValueDef<number>;

  /**
   * Color of the marks – either fill or stroke color based on mark type.
   * (By default, fill color for `area`, `bar`, `tick`, `text`, `circle`, and `square` /
   * stroke color for `line` and `point`.)
   */
  color?: LegendFieldDef<string> | ConditionalValueDef<string>;

  /**
   * Opacity of the marks – either can be a value or in a range.
   */
  opacity?: LegendFieldDef<number> | ConditionalValueDef<number>;

  /**
   * Size of the mark.
   * - For `point`, `square` and `circle`
   * – the symbol size, or pixel area of the mark.
   * - For `bar` and `tick` – the bar and tick's size.
   * - For `text` – the text's font size.
   * - Size is currently unsupported for `line` and `area`.
   */
  size?: LegendFieldDef<number> | ConditionalValueDef<number>;

  /**
   * The symbol's shape (only for `point` marks). The supported values are
   * `"circle"` (default), `"square"`, `"cross"`, `"diamond"`, `"triangle-up"`,
   * or `"triangle-down"`, or else a custom SVG path string.
   */
  shape?: LegendFieldDef<string> | ConditionalValueDef<string>; // TODO: maybe distinguish ordinal-only

  /**
   * Additional levels of detail for grouping data in aggregate views and
   * in line and area marks without mapping data to a specific visual channel.
   */
  detail?: FieldDef | FieldDef[];

  /**
   * Text of the `text` mark.
   */
  text?: TextFieldDef | ConditionalValueDef<string|number>;

  /**
   * Anchor position of the `label` mark.
   */
  anchor?: FieldDef | ValueDef<string>;

  /**
   * Offset of the `label` mark from the mark its labeling.
   */
  offset?: FieldDef | ValueDef<number|string>;

  /**
   * stack order for stacked marks or order of data points in line marks.
   */
  order?: OrderFieldDef | OrderFieldDef[];
}

export interface EncodingWithFacet extends Encoding, Facet {}

export function channelHasField(encoding: EncodingWithFacet, channel: Channel): boolean {
  const channelDef = encoding && encoding[channel];
  if (channelDef) {
    if (isArray(channelDef)) {
      return some(channelDef, (fieldDef) => !!fieldDef.field);
    } else {
      return isFieldDef(channelDef);
    }
  }
  return false;
}

export function isAggregate(encoding: EncodingWithFacet) {
  return some(CHANNELS, (channel) => {
    if (channelHasField(encoding, channel)) {
      const channelDef = encoding[channel];
      if (isArray(channelDef)) {
        return some(channelDef, (fieldDef) => !!fieldDef.aggregate);
      } else {
        return isFieldDef(channelDef) && !!channelDef.aggregate;
      }
    }
    return false;
  });
}

export function dropInvalidFieldDefs(mark: Mark, encoding: Encoding): Encoding {

  // clone to prevent side effect to the original spec
  encoding = duplicate(encoding);

  Object.keys(encoding).forEach((channel: Channel) => {
    if (!supportMark(channel, mark)) {
      // Drop unsupported channel

      log.warn(log.message.incompatibleChannel(channel, mark));
      delete encoding[channel];
      return;
    }

    // Drop line's size if the field is aggregated.
    if (channel === 'size' && mark === 'line') {
      const channelDef = encoding[channel];
      if (isFieldDef(channelDef) && channelDef.aggregate) {
        log.warn(log.message.incompatibleChannel(channel, mark, 'when the field is aggregated.'));
        delete encoding[channel];
      }
      return;
    }

    if (isArray(encoding[channel])) {
      // Array of fieldDefs for detail channel (or production rule)
      encoding[channel] = encoding[channel].reduce((channelDefs: ChannelDef[], channelDef: ChannelDef) => {
        if (!isFieldDef(channelDef) && !isValueDef(channelDef)) { // TODO: datum
          log.warn(log.message.emptyFieldDef(channelDef, channel));
        } else {
          channelDefs.push(normalize(channelDef, channel));
        }
        return channelDefs;
      }, []);
    } else {
      const fieldDef = encoding[channel];
      if (fieldDef.field === undefined && fieldDef.value === undefined) { // TODO: datum
        log.warn(log.message.emptyFieldDef(fieldDef, channel));
        delete encoding[channel];
        return;
      }
      normalize(fieldDef, channel);
    }
  });
  return encoding;
}


export function isRanged(encoding: EncodingWithFacet) {
  return encoding && ((!!encoding.x && !!encoding.x2) || (!!encoding.y && !!encoding.y2));
}

export function fieldDefs(encoding: EncodingWithFacet): FieldDef[] {
  let arr: FieldDef[] = [];
  CHANNELS.forEach(function(channel) {
    if (channelHasField(encoding, channel)) {
      const channelDef = encoding[channel];
      (isArray(channelDef) ? channelDef : [channelDef]).forEach((fieldDef) => {
        arr.push(fieldDef);
      });
    }
  });
  return arr;
};

export function forEach(mapping: any,
    f: (fd: FieldDef, c: Channel) => void,
    thisArg?: any) {
  if (!mapping) {
    return;
  }

  Object.keys(mapping).forEach((c: any) => {
    const channel: Channel = c;
    if (isArray(mapping[channel])) {
      mapping[channel].forEach(function(channelDef: ChannelDef) {
        f.call(thisArg, channelDef, channel);
      });
    } else {
      f.call(thisArg, mapping[channel], channel);
    }
  });
}

export function reduce<T, U>(mapping: U,
    f: (acc: any, fd: FieldDef, c: Channel) => U,
    init: T, thisArg?: any) {
  if (!mapping) {
    return init;
  }

  return Object.keys(mapping).reduce((r: T, c: any) => {
    const channel: Channel = c;
    if (isArray(mapping[channel])) {
      return mapping[channel].reduce(function(r1: T, channelDef: ChannelDef) {
        return f.call(thisArg, r1, channelDef, channel);
      }, r);
    } else {
      return f.call(thisArg, r, mapping[channel], channel);
    }
  }, init);
}
