import {getSecondaryRangeChannel, PositionScaleChannel} from '../../channel';
import {channelDefType, getFieldOrDatumDef, isPositionFieldOrDatumDef} from '../../channeldef';
import {formatCustomType, isCustomFormatType} from '../format';
import {UnitModel} from '../unit';

export function labels(model: UnitModel, channel: PositionScaleChannel, specifiedLabelsSpec: any) {
  const {encoding, config} = model;

  const fieldOrDatumDef =
    getFieldOrDatumDef<string>(encoding[channel]) ?? getFieldOrDatumDef(encoding[getSecondaryRangeChannel(channel)]);
  const axis = model.axis(channel) || {};
  const {format, formatType} = axis;

  if (isCustomFormatType(formatType)) {
    return {
      text: formatCustomType({
        fieldOrDatumDef,
        field: 'datum.value',
        format,
        formatType,
        config
      }),
      ...specifiedLabelsSpec
    };
  } else if (format === undefined && formatType === undefined && config.customFormatTypes) {
    if (channelDefType(fieldOrDatumDef) === 'quantitative') {
      if (
        isPositionFieldOrDatumDef(fieldOrDatumDef) &&
        fieldOrDatumDef.stack === 'normalize' &&
        config.normalizedNumberFormatType
      ) {
        return {
          text: formatCustomType({
            fieldOrDatumDef,
            field: 'datum.value',
            format: config.normalizedNumberFormat,
            formatType: config.normalizedNumberFormatType,
            config
          }),
          ...specifiedLabelsSpec
        };
      } else if (config.numberFormatType) {
        return {
          text: formatCustomType({
            fieldOrDatumDef,
            field: 'datum.value',
            format: config.numberFormat,
            formatType: config.numberFormatType,
            config
          }),
          ...specifiedLabelsSpec
        };
      }
    }
    if (channelDefType(fieldOrDatumDef) === 'temporal') {
      return {
        text: formatCustomType({
          fieldOrDatumDef,
          field: 'datum.value',
          format: config.timeFormat,
          formatType: config.timeFormatType,
          config
        }),
        ...specifiedLabelsSpec
      };
    }
  }
  return specifiedLabelsSpec;
}
