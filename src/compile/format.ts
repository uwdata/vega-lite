import type {SignalRef} from 'vega';
import {isString} from 'vega-util';
import {isBinning} from '../bin';
import {
  channelDefType,
  DatumDef,
  FieldDef,
  Format,
  isFieldDef,
  isFieldOrDatumDefForTimeFormat,
  isPositionFieldOrDatumDef,
  isScaleFieldDef,
  vgField
} from '../channeldef';
import {Config} from '../config';
import {fieldValidPredicate} from '../predicate';
import {ScaleType} from '../scale';
import {formatExpression, normalizeTimeUnit, timeUnitSpecifierExpression} from '../timeunit';
import {QUANTITATIVE, Type} from '../type';
import {stringify} from '../util';
import {isSignalRef} from '../vega.schema';
import {TimeUnit} from './../timeunit';
import {datumDefToExpr} from './mark/encode/valueref';

export function isCustomFormatType(formatType: string) {
  return formatType && formatType !== 'number' && formatType !== 'time';
}

function customFormatExpr(formatType: string, field: string, format: Format) {
  return `${formatType}(${field}${format ? `, ${stringify(format)}` : ''})`;
}

export const BIN_RANGE_DELIMITER = ' \u2013 ';

export function formatSignalRef({
  fieldOrDatumDef,
  format,
  formatType,
  expr,
  normalizeStack,
  config
}: {
  fieldOrDatumDef: FieldDef<string> | DatumDef<string>;
  format: Format;
  formatType: string;
  expr?: 'datum' | 'parent' | 'datum.datum';
  normalizeStack?: boolean;
  config: Config;
}) {
  if (isCustomFormatType(formatType)) {
    return formatCustomType({
      fieldOrDatumDef,
      format,
      formatType,
      expr,
      config
    });
  }

  const field = fieldToFormat(fieldOrDatumDef, expr, normalizeStack);
  const type = channelDefType(fieldOrDatumDef);

  if (format === undefined && formatType === undefined && config.customFormatTypes) {
    if (type === 'quantitative') {
      if (normalizeStack && config.normalizedNumberFormatType)
        return formatCustomType({
          fieldOrDatumDef,
          format: config.normalizedNumberFormat,
          formatType: config.normalizedNumberFormatType,
          expr,
          config
        });
      if (config.numberFormatType) {
        return formatCustomType({
          fieldOrDatumDef,
          format: config.numberFormat,
          formatType: config.numberFormatType,
          expr,
          config
        });
      }
    }
    if (
      type === 'temporal' &&
      config.timeFormatType &&
      isFieldDef(fieldOrDatumDef) &&
      fieldOrDatumDef.timeUnit === undefined
    ) {
      return formatCustomType({
        fieldOrDatumDef,
        format: config.timeFormat,
        formatType: config.timeFormatType,
        expr,
        config
      });
    }
  }

  if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
    const signal = timeFormatExpression({
      field,
      timeUnit: isFieldDef(fieldOrDatumDef) ? normalizeTimeUnit(fieldOrDatumDef.timeUnit)?.unit : undefined,
      format,
      formatType: config.timeFormatType,
      rawTimeFormat: config.timeFormat,
      isUTCScale: isScaleFieldDef(fieldOrDatumDef) && fieldOrDatumDef.scale?.type === ScaleType.UTC
    });
    return signal ? {signal} : undefined;
  }

  format = numberFormat({type, specifiedFormat: format, config, normalizeStack});
  if (isFieldDef(fieldOrDatumDef) && isBinning(fieldOrDatumDef.bin)) {
    const endField = vgField(fieldOrDatumDef, {expr, binSuffix: 'end'});
    return {
      signal: binFormatExpression(field, endField, format, formatType, config)
    };
  } else if (format || channelDefType(fieldOrDatumDef) === 'quantitative') {
    return {
      signal: `${formatExpr(field, format)}`
    };
  } else {
    return {signal: `isValid(${field}) ? ${field} : ""+${field}`};
  }
}

function fieldToFormat(
  fieldOrDatumDef: FieldDef<string> | DatumDef<string>,
  expr: 'datum' | 'parent' | 'datum.datum',
  normalizeStack: boolean
) {
  if (isFieldDef(fieldOrDatumDef)) {
    if (normalizeStack) {
      return `${vgField(fieldOrDatumDef, {expr, suffix: 'end'})}-${vgField(fieldOrDatumDef, {
        expr,
        suffix: 'start'
      })}`;
    } else {
      return vgField(fieldOrDatumDef, {expr});
    }
  } else {
    return datumDefToExpr(fieldOrDatumDef);
  }
}

export function formatCustomType({
  fieldOrDatumDef,
  format,
  formatType,
  expr,
  normalizeStack,
  config,
  field
}: {
  fieldOrDatumDef: FieldDef<string> | DatumDef<string>;
  format: Format;
  formatType: string;
  expr?: 'datum' | 'parent' | 'datum.datum';
  normalizeStack?: boolean;
  config: Config;
  field?: string; // axis/legend "use datum.value"
}) {
  field ??= fieldToFormat(fieldOrDatumDef, expr, normalizeStack);

  if (
    field !== 'datum.value' && // For axis/legend, we can't correctly know the end of the bin from `datum`
    isFieldDef(fieldOrDatumDef) &&
    isBinning(fieldOrDatumDef.bin)
  ) {
    const endField = vgField(fieldOrDatumDef, {expr, binSuffix: 'end'});
    return {
      signal: binFormatExpression(field, endField, format, formatType, config)
    };
  }
  return {signal: customFormatExpr(formatType, field, format)};
}

export function guideFormat(
  fieldOrDatumDef: FieldDef<string> | DatumDef<string>,
  type: Type,
  format: Format,
  formatType: string | SignalRef,
  config: Config,
  isAxis: boolean
) {
  if (isString(formatType) && isCustomFormatType(formatType)) {
    return undefined; // handled in encode block
  } else if (format === undefined && formatType === undefined && config.customFormatTypes) {
    if (channelDefType(fieldOrDatumDef) === 'quantitative') {
      if (
        config.normalizedNumberFormatType &&
        isPositionFieldOrDatumDef(fieldOrDatumDef) &&
        fieldOrDatumDef.stack === 'normalize'
      ) {
        return undefined; // handled in encode block
      }
      if (config.numberFormatType) {
        return undefined; // handled in encode block
      }
    }
  }

  if (
    isPositionFieldOrDatumDef(fieldOrDatumDef) &&
    fieldOrDatumDef.stack === 'normalize' &&
    config.normalizedNumberFormat
  ) {
    return numberFormat({
      type: 'quantitative',
      config,
      normalizeStack: true
    });
  }

  if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
    const timeUnit = isFieldDef(fieldOrDatumDef) ? normalizeTimeUnit(fieldOrDatumDef.timeUnit)?.unit : undefined;
    if (timeUnit === undefined && config.customFormatTypes && config.timeFormatType) {
      return undefined; // hanlded in encode block
    }

    return timeFormat({specifiedFormat: format as string, timeUnit, config, isAxis});
  }

  return numberFormat({type, specifiedFormat: format, config});
}

export function guideFormatType(
  formatType: string | SignalRef,
  fieldOrDatumDef: FieldDef<string> | DatumDef<string>,
  scaleType: ScaleType
) {
  if (formatType && (isSignalRef(formatType) || formatType === 'number' || formatType === 'time')) {
    return formatType;
  }
  if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef) && scaleType !== 'time' && scaleType !== 'utc') {
    return isFieldDef(fieldOrDatumDef) && normalizeTimeUnit(fieldOrDatumDef?.timeUnit)?.utc ? 'utc' : 'time';
  }
  return undefined;
}

/**
 * Returns number format for a fieldDef.
 */
export function numberFormat({
  type,
  specifiedFormat,
  config,
  normalizeStack
}: {
  type: Type;
  specifiedFormat?: Format;
  config: Config;
  normalizeStack?: boolean;
}) {
  // Specified format in axis/legend has higher precedence than fieldDef.format
  if (isString(specifiedFormat)) {
    return specifiedFormat;
  }

  if (type === QUANTITATIVE) {
    // we only apply the default if the field is quantitative
    return normalizeStack ? config.normalizedNumberFormat : config.numberFormat;
  }
  return undefined;
}

/**
 * Returns time format for a fieldDef for use in guides.
 */
export function timeFormat({
  specifiedFormat,
  timeUnit,
  config,
  isAxis
}: {
  specifiedFormat?: string;
  timeUnit?: TimeUnit;
  config: Config;
  isAxis?: boolean;
}) {
  if (specifiedFormat) {
    return specifiedFormat;
  }

  if (timeUnit) {
    return {
      signal: timeUnitSpecifierExpression(timeUnit, {isAxis})
    };
  }

  // axis doesn't use config.timeFormat
  return isAxis ? undefined : config.timeFormat;
}

function formatExpr(field: string, format: string) {
  return `format(${field}, "${format || ''}")`;
}

function binNumberFormatExpr(field: string, format: Format, formatType: string, config: Config) {
  if (isCustomFormatType(formatType)) {
    return customFormatExpr(formatType, field, format);
  }

  return formatExpr(field, (isString(format) ? format : undefined) ?? config.numberFormat);
}

export function binFormatExpression(
  startField: string,
  endField: string,
  format: Format,
  formatType: string,
  config: Config
): string {
  if (format === undefined && formatType === undefined && config.customFormatTypes && config.numberFormatType) {
    return binFormatExpression(startField, endField, config.numberFormat, config.numberFormatType, config);
  }
  const start = binNumberFormatExpr(startField, format, formatType, config);
  const end = binNumberFormatExpr(endField, format, formatType, config);
  return `${fieldValidPredicate(startField, false)} ? "null" : ${start} + "${BIN_RANGE_DELIMITER}" + ${end}`;
}

/**
 * Returns the time expression used for axis/legend labels or text mark for a temporal field
 */
export function timeFormatExpression({
  field,
  timeUnit,
  format,
  formatType,
  rawTimeFormat,
  isUTCScale
}: {
  field: string;
  timeUnit?: TimeUnit;
  format?: Format;
  formatType?: string;
  rawTimeFormat?: string; // should be provided only for actual text and headers, not axis/legend labels
  isUTCScale?: boolean;
}): string {
  if (!timeUnit || format) {
    // If there is no time unit, or if user explicitly specifies format for axis/legend/text.
    if (!timeUnit && formatType) {
      return `${formatType}(${field}, ${stringify(format)})`;
    }
    format = isString(format) ? format : rawTimeFormat; // only use provided timeFormat if there is no timeUnit.
    return `${isUTCScale ? 'utc' : 'time'}Format(${field}, ${stringify(format)})`;
  } else {
    return formatExpression(timeUnit, field, isUTCScale);
  }
}
