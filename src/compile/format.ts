import {isString} from 'vega-util';
import {isBinning} from '../bin';
import {
  channelDefType,
  DatumDef,
  FieldDef,
  isFieldDef,
  isFieldOrDatumDefForTimeFormat,
  isFieldOrDatumDefWithCustomTimeFormat,
  isScaleFieldDef,
  vgField
} from '../channeldef';
import {Config} from '../config';
import {fieldValidPredicate} from '../predicate';
import {ScaleType} from '../scale';
import {formatExpression, normalizeTimeUnit, timeUnitSpecifierExpression} from '../timeunit';
import {QUANTITATIVE, Type} from '../type';
import {TimeUnit} from './../timeunit';
import {datumDefToExpr} from './mark/encode/valueref';

export function isCustomFormatType(formatType: string, config: Config) {
  return config.customFormatTypes && formatType && formatType !== 'number' && formatType !== 'time';
}

function customFormatExpr(formatType: string, field: string, format: string | object) {
  return `${formatType}(${field}, ${JSON.stringify(format)})`;
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
  format: string | object;
  formatType: string;
  expr?: 'datum' | 'parent' | 'datum.datum';
  normalizeStack?: boolean;
  config: Config;
}) {
  if (isCustomFormatType(formatType, config)) {
    return formatCustomType({
      fieldOrDatumDef,
      format,
      formatType,
      expr,
      config
    });
  } else if (formatType) {
    formatType = undefined;
  }

  const field = fieldToFormat(fieldOrDatumDef, expr, normalizeStack);

  if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
    const signal = timeFormatExpression(
      field,
      isFieldDef(fieldOrDatumDef) ? normalizeTimeUnit(fieldOrDatumDef.timeUnit)?.unit : undefined,
      format,
      config.timeFormat,
      isScaleFieldDef(fieldOrDatumDef) && fieldOrDatumDef.scale?.type === ScaleType.UTC
    );
    return signal ? {signal} : undefined;
  }

  format = numberFormat(channelDefType(fieldOrDatumDef), format, config);
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
  format: string | object;
  formatType: string;
  expr?: 'datum' | 'parent' | 'datum.datum';
  normalizeStack?: boolean;
  config: Config;
  field?: string; // axis/legend "use datum.value"
}) {
  field = field ?? fieldToFormat(fieldOrDatumDef, expr, normalizeStack);

  if (isFieldDef(fieldOrDatumDef) && isBinning(fieldOrDatumDef.bin)) {
    const endField = vgField(fieldOrDatumDef, {expr, binSuffix: 'end'});
    return {
      signal: binFormatExpression(field, endField, format, formatType, config)
    };
  }
  return {signal: customFormatExpr(formatType, field, format)};
}

export function formatGuide(
  fieldOrDatumDef: FieldDef<string> | DatumDef<string>,
  type: Type,
  format: string | object,
  formatType: string,
  config: Config,
  omitTimeFormatConfig: boolean // axis doesn't use config.timeFormat
) {
  if (isFieldOrDatumDefWithCustomTimeFormat(fieldOrDatumDef, config)) {
    return undefined; // handled in encode block
  }

  if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
    const timeUnit = isFieldDef(fieldOrDatumDef) ? normalizeTimeUnit(fieldOrDatumDef.timeUnit)?.unit : undefined;

    return timeFormat(format as string, timeUnit, config, omitTimeFormatConfig);
  }

  return numberFormat(type, format, config);
}

/**
 * Returns number format for a fieldDef.
 */
export function numberFormat(type: Type, specifiedFormat: string | object, config: Config) {
  // Specified format in axis/legend has higher precedence than fieldDef.format
  if (isString(specifiedFormat)) {
    return specifiedFormat;
  }

  if (type === QUANTITATIVE) {
    // we only apply the default if the field is quantitative
    return config.numberFormat;
  }
  return undefined;
}

/**
 * Returns time format for a fieldDef for use in guides.
 */
export function timeFormat(specifiedFormat: string, timeUnit: TimeUnit, config: Config, omitTimeFormatConfig: boolean) {
  if (specifiedFormat) {
    return specifiedFormat;
  }

  if (timeUnit) {
    return {
      signal: timeUnitSpecifierExpression(timeUnit)
    };
  }

  return omitTimeFormatConfig ? undefined : config.timeFormat;
}

function formatExpr(field: string, format: string) {
  return `format(${field}, "${format || ''}")`;
}

function binNumberFormatExpr(field: string, format: string | object, formatType: string, config: Config) {
  if (isCustomFormatType(formatType, config)) {
    return customFormatExpr(formatType, field, format);
  }

  return formatExpr(field, (isString(format) ? format : undefined) ?? config.numberFormat);
}

export function binFormatExpression(
  startField: string,
  endField: string,
  format: string | object,
  formatType: string,
  config: Config
) {
  const start = binNumberFormatExpr(startField, format, formatType, config);
  const end = binNumberFormatExpr(endField, format, formatType, config);
  return `${fieldValidPredicate(startField, false)} ? "null" : ${start} + "${BIN_RANGE_DELIMITER}" + ${end}`;
}

/**
 * Returns the time expression used for axis/legend labels or text mark for a temporal field
 */
export function timeFormatExpression(
  field: string,
  timeUnit: TimeUnit,
  format: string | object,
  rawTimeFormat: string, // should be provided only for actual text and headers, not axis/legend labels
  isUTCScale: boolean
): string {
  if (!timeUnit || format) {
    // If there is not time unit, or if user explicitly specify format for axis/legend/text.
    format = isString(format) ? format : rawTimeFormat; // only use provided timeFormat if there is no timeUnit.
    return `${isUTCScale ? 'utc' : 'time'}Format(${field}, '${format}')`;
  } else {
    return formatExpression(timeUnit, field, isUTCScale);
  }
}
