import {Orientation, SignalRef, Text} from 'vega';
import {isArray, isBoolean, isString} from 'vega-util';
import {CompositeMark, CompositeMarkDef} from '.';
import {
  Field,
  FieldDefBase,
  isContinuousFieldOrDatumDef,
  isFieldDef,
  isFieldOrDatumDefForTimeFormat,
  PositionFieldDef,
  SecondaryFieldDef,
  StringFieldDef,
  StringFieldDefWithCondition,
  StringValueDefWithCondition
} from '../channeldef';
import {Encoding, fieldDefs} from '../encoding';
import * as log from '../log';
import {ColorMixins, GenericMarkDef, isMarkDef, Mark, MarkConfig, MarkDef} from '../mark';
import {GenericUnitSpec, NormalizedUnitSpec} from '../spec';
import {getFirstDefined, hash, unique, omit, isEmpty} from '../util';
import {isSignalRef} from '../vega.schema';
import {toStringFieldDef} from './../channeldef';

export type PartsMixins<P extends string> = Partial<Record<P, boolean | MarkConfig>>;

export type GenericCompositeMarkDef<T> = GenericMarkDef<T> &
  ColorMixins & {
    /**
     * The opacity (value between [0,1]) of the mark.
     */
    opacity?: number;

    /**
     * Whether a composite mark be clipped to the enclosing group’s width and height.
     */
    clip?: boolean;
  };

export interface CompositeMarkTooltipSummary {
  /**
   * The prefix of the field to be shown in tooltip
   */
  fieldPrefix: string;

  /**
   * The title prefix to show, corresponding to the field with field prefix `fieldPrefix`
   */
  titlePrefix: Text | SignalRef;
}

export function filterTooltipWithAggregatedField<F extends Field>(
  oldEncoding: Encoding<F>
): {
  customTooltipWithoutAggregatedField?:
    | StringFieldDefWithCondition<F>
    | StringValueDefWithCondition<F>
    | StringFieldDef<F>[];
  filteredEncoding: Encoding<F>;
} {
  const {tooltip, ...filteredEncoding} = oldEncoding;
  if (!tooltip) {
    return {filteredEncoding};
  }

  let customTooltipWithAggregatedField:
    | StringFieldDefWithCondition<F>
    | StringValueDefWithCondition<F>
    | StringFieldDef<F>[];
  let customTooltipWithoutAggregatedField:
    | StringFieldDefWithCondition<F>
    | StringValueDefWithCondition<F>
    | StringFieldDef<F>[];

  if (isArray(tooltip)) {
    for (const t of tooltip) {
      if (t.aggregate) {
        if (!customTooltipWithAggregatedField) {
          customTooltipWithAggregatedField = [];
        }
        (customTooltipWithAggregatedField as StringFieldDef<F>[]).push(t);
      } else {
        if (!customTooltipWithoutAggregatedField) {
          customTooltipWithoutAggregatedField = [];
        }
        (customTooltipWithoutAggregatedField as StringFieldDef<F>[]).push(t);
      }
    }

    if (customTooltipWithAggregatedField) {
      (filteredEncoding as Encoding<F>).tooltip = customTooltipWithAggregatedField;
    }
  } else {
    if (tooltip['aggregate']) {
      (filteredEncoding as Encoding<F>).tooltip = tooltip;
    } else {
      customTooltipWithoutAggregatedField = tooltip;
    }
  }

  if (isArray(customTooltipWithoutAggregatedField) && customTooltipWithoutAggregatedField.length === 1) {
    customTooltipWithoutAggregatedField = customTooltipWithoutAggregatedField[0];
  }
  return {customTooltipWithoutAggregatedField, filteredEncoding};
}

export function getCompositeMarkTooltip(
  tooltipSummary: CompositeMarkTooltipSummary[],
  continuousAxisChannelDef: PositionFieldDef<string>,
  encodingWithoutContinuousAxis: Encoding<string>,
  withFieldName = true
): Encoding<string> {
  if ('tooltip' in encodingWithoutContinuousAxis) {
    return {tooltip: encodingWithoutContinuousAxis.tooltip};
  }

  const fiveSummaryTooltip: StringFieldDef<string>[] = tooltipSummary.map(
    ({fieldPrefix, titlePrefix}): StringFieldDef<string> => {
      const mainTitle = withFieldName ? ` of ${getTitle(continuousAxisChannelDef)}` : '';
      return {
        field: fieldPrefix + continuousAxisChannelDef.field,
        type: continuousAxisChannelDef.type,
        title: isSignalRef(titlePrefix) ? {signal: titlePrefix + `"${escape(mainTitle)}"`} : titlePrefix + mainTitle
      };
    }
  );

  const tooltipFieldDefs = fieldDefs(encodingWithoutContinuousAxis).map(toStringFieldDef);

  return {
    tooltip: [
      ...fiveSummaryTooltip,
      // need to cast because TextFieldDef supports fewer types of bin
      ...unique(tooltipFieldDefs, hash)
    ]
  };
}

export function getTitle(continuousAxisChannelDef: PositionFieldDef<string>) {
  const {axis, title, field} = continuousAxisChannelDef;
  return getFirstDefined(axis?.title, title, field);
}

export function makeCompositeAggregatePartFactory<P extends PartsMixins<any>>(
  compositeMarkDef: GenericCompositeMarkDef<any> & P,
  continuousAxis: 'x' | 'y',
  continuousAxisChannelDef: PositionFieldDef<string>,
  sharedEncoding: Encoding<string>,
  compositeMarkConfig: P
) {
  const {scale, axis} = continuousAxisChannelDef;

  return ({
    partName,
    mark,
    positionPrefix,
    endPositionPrefix = undefined,
    aria,
    extraEncoding = {}
  }: {
    partName: keyof P;
    mark: Mark | MarkDef;
    positionPrefix: string;
    endPositionPrefix?: string;
    aria?: boolean;
    extraEncoding?: Encoding<string>;
  }) => {
    const title = getTitle(continuousAxisChannelDef);
    const axisWithoutTitle = omit(axis, ['title']);

    return partLayerMixins<P>(compositeMarkDef, partName, compositeMarkConfig, aria, {
      mark, // TODO better remove this method and just have mark as a parameter of the method
      encoding: {
        [continuousAxis]: {
          field: positionPrefix + '_' + continuousAxisChannelDef.field,
          type: continuousAxisChannelDef.type,
          ...(title !== undefined ? {title} : {}),
          ...(scale !== undefined ? {scale} : {}),
          // add axis without title since we already added the title above
          ...(isEmpty(axisWithoutTitle) ? {} : {axis: axisWithoutTitle})
        },
        ...(isString(endPositionPrefix)
          ? {
              [continuousAxis + '2']: {
                field: endPositionPrefix + '_' + continuousAxisChannelDef.field
              }
            }
          : {}),
        ...sharedEncoding,
        ...extraEncoding
      }
    });
  };
}

export function partLayerMixins<P extends PartsMixins<any>>(
  markDef: GenericCompositeMarkDef<any> & P,
  part: keyof P,
  compositeMarkConfig: P,
  aria: boolean,
  partBaseSpec: NormalizedUnitSpec
): NormalizedUnitSpec[] {
  const {clip, color, opacity} = markDef;

  const mark = markDef.type;

  if (markDef[part] || (markDef[part] === undefined && compositeMarkConfig[part])) {
    return [
      {
        ...partBaseSpec,
        mark: {
          ...(compositeMarkConfig[part] as MarkConfig),
          ...(clip ? {clip} : {}),
          ...(color ? {color} : {}),
          ...(opacity ? {opacity} : {}),
          ...(isMarkDef(partBaseSpec.mark) ? partBaseSpec.mark : {type: partBaseSpec.mark}),
          style: `${mark}-${part}`,
          ...(isBoolean(markDef[part]) ? {} : (markDef[part] as MarkConfig)),
          ...(aria === false ? {aria} : {})
        }
      }
    ];
  }
  return [];
}

export function compositeMarkContinuousAxis<M extends CompositeMark>(
  spec: GenericUnitSpec<Encoding<string>, CompositeMark | CompositeMarkDef>,
  orient: Orientation,
  compositeMark: M
): {
  continuousAxisChannelDef: PositionFieldDef<string>;
  continuousAxisChannelDef2: SecondaryFieldDef<string>;
  continuousAxisChannelDefError: SecondaryFieldDef<string>;
  continuousAxisChannelDefError2: SecondaryFieldDef<string>;
  continuousAxis: 'x' | 'y';
} {
  const {encoding} = spec;
  const continuousAxis: 'x' | 'y' = orient === 'vertical' ? 'y' : 'x';

  const continuousAxisChannelDef = encoding[continuousAxis] as PositionFieldDef<string>; // Safe to cast because if x is not continuous fielddef, the orient would not be horizontal.
  const continuousAxisChannelDef2 = encoding[continuousAxis + '2'] as SecondaryFieldDef<string>;
  const continuousAxisChannelDefError = encoding[continuousAxis + 'Error'] as SecondaryFieldDef<string>;
  const continuousAxisChannelDefError2 = encoding[continuousAxis + 'Error2'] as SecondaryFieldDef<string>;

  return {
    continuousAxisChannelDef: filterAggregateFromChannelDef(continuousAxisChannelDef, compositeMark),
    continuousAxisChannelDef2: filterAggregateFromChannelDef(continuousAxisChannelDef2, compositeMark),
    continuousAxisChannelDefError: filterAggregateFromChannelDef(continuousAxisChannelDefError, compositeMark),
    continuousAxisChannelDefError2: filterAggregateFromChannelDef(continuousAxisChannelDefError2, compositeMark),
    continuousAxis
  };
}

function filterAggregateFromChannelDef<M extends CompositeMark, F extends FieldDefBase<string>>(
  continuousAxisChannelDef: F,
  compositeMark: M
): F {
  if (continuousAxisChannelDef && continuousAxisChannelDef.aggregate) {
    const {aggregate, ...continuousAxisWithoutAggregate} = continuousAxisChannelDef;
    if (aggregate !== compositeMark) {
      log.warn(log.message.errorBarContinuousAxisHasCustomizedAggregate(aggregate, compositeMark));
    }
    return continuousAxisWithoutAggregate as F;
  } else {
    return continuousAxisChannelDef;
  }
}

export function compositeMarkOrient<M extends CompositeMark>(
  spec: GenericUnitSpec<Encoding<string>, CompositeMark | CompositeMarkDef>,
  compositeMark: M
): Orientation {
  const {mark, encoding} = spec;
  const {x, y} = encoding;

  if (isMarkDef(mark) && mark.orient) {
    return mark.orient;
  }

  if (isContinuousFieldOrDatumDef(x)) {
    // x is continuous
    if (isContinuousFieldOrDatumDef(y)) {
      // both x and y are continuous
      const xAggregate = isFieldDef(x) && x.aggregate;
      const yAggregate = isFieldDef(y) && y.aggregate;

      if (!xAggregate && yAggregate === compositeMark) {
        return 'vertical';
      } else if (!yAggregate && xAggregate === compositeMark) {
        return 'horizontal';
      } else if (xAggregate === compositeMark && yAggregate === compositeMark) {
        throw new Error('Both x and y cannot have aggregate');
      } else {
        if (isFieldOrDatumDefForTimeFormat(y) && !isFieldOrDatumDefForTimeFormat(x)) {
          // y is temporal but x is not
          return 'horizontal';
        }

        // default orientation for two continuous
        return 'vertical';
      }
    }

    return 'horizontal';
  } else if (isContinuousFieldOrDatumDef(y)) {
    // y is continuous but x is not
    return 'vertical';
  } else {
    // Neither x nor y is continuous.
    throw new Error(`Need a valid continuous axis for ${compositeMark}s`);
  }
}
