import {isObject, isString} from 'vega-util';
import {DateTime, DateTimeExpr, dateTimeExprToExpr, dateTimeToExpr} from './datetime';
import {accessPathWithDatum, keys, stringify, varName} from './util';
import {hasOwnProperty} from 'vega';

/** Time Unit that only corresponds to only one part of Date objects. */
export const LOCAL_SINGLE_TIMEUNIT_INDEX = {
  year: 1,
  quarter: 1,
  month: 1,
  week: 1,
  day: 1,
  dayofyear: 1,
  date: 1,
  hours: 1,
  minutes: 1,
  seconds: 1,
  milliseconds: 1
} as const;

export type LocalSingleTimeUnit = keyof typeof LOCAL_SINGLE_TIMEUNIT_INDEX;

export const TIMEUNIT_PARTS = keys(LOCAL_SINGLE_TIMEUNIT_INDEX);

export function isLocalSingleTimeUnit(timeUnit: string): timeUnit is LocalSingleTimeUnit {
  return hasOwnProperty(LOCAL_SINGLE_TIMEUNIT_INDEX, timeUnit);
}

export const UTC_SINGLE_TIMEUNIT_INDEX = {
  utcyear: 1,
  utcquarter: 1,
  utcmonth: 1,
  utcweek: 1,
  utcday: 1,
  utcdayofyear: 1,
  utcdate: 1,
  utchours: 1,
  utcminutes: 1,
  utcseconds: 1,
  utcmilliseconds: 1
} as const;

export type UtcSingleTimeUnit = keyof typeof UTC_SINGLE_TIMEUNIT_INDEX;

export type SingleTimeUnit = LocalSingleTimeUnit | UtcSingleTimeUnit;

export const LOCAL_MULTI_TIMEUNIT_INDEX = {
  yearquarter: 1,
  yearquartermonth: 1,

  yearmonth: 1,
  yearmonthdate: 1,
  yearmonthdatehours: 1,
  yearmonthdatehoursminutes: 1,
  yearmonthdatehoursminutesseconds: 1,

  yearweek: 1,
  yearweekday: 1,
  yearweekdayhours: 1,
  yearweekdayhoursminutes: 1,
  yearweekdayhoursminutesseconds: 1,

  yeardayofyear: 1,

  quartermonth: 1,

  monthdate: 1,
  monthdatehours: 1,
  monthdatehoursminutes: 1,
  monthdatehoursminutesseconds: 1,

  weekday: 1,
  weekdayhours: 1,
  weekdayhoursminutes: 1,
  weekdayhoursminutesseconds: 1,

  dayhours: 1,
  dayhoursminutes: 1,
  dayhoursminutesseconds: 1,

  hoursminutes: 1,
  hoursminutesseconds: 1,

  minutesseconds: 1,

  secondsmilliseconds: 1
} as const;

export type LocalMultiTimeUnit = keyof typeof LOCAL_MULTI_TIMEUNIT_INDEX;

const BINNED_LOCAL_TIMEUNIT_INDEX = {
  binnedyear: 1,
  binnedyearquarter: 1,
  binnedyearquartermonth: 1,

  binnedyearmonth: 1,
  binnedyearmonthdate: 1,
  binnedyearmonthdatehours: 1,
  binnedyearmonthdatehoursminutes: 1,
  binnedyearmonthdatehoursminutesseconds: 1,

  binnedyearweek: 1,
  binnedyearweekday: 1,
  binnedyearweekdayhours: 1,
  binnedyearweekdayhoursminutes: 1,
  binnedyearweekdayhoursminutesseconds: 1,

  binnedyeardayofyear: 1
} as const;

type BinnedLocalTimeUnit = keyof typeof BINNED_LOCAL_TIMEUNIT_INDEX;

const BINNED_UTC_TIMEUNIT_INDEX = {
  binnedutcyear: 1,
  binnedutcyearquarter: 1,
  binnedutcyearquartermonth: 1,

  binnedutcyearmonth: 1,
  binnedutcyearmonthdate: 1,
  binnedutcyearmonthdatehours: 1,
  binnedutcyearmonthdatehoursminutes: 1,
  binnedutcyearmonthdatehoursminutesseconds: 1,

  binnedutcyearweek: 1,
  binnedutcyearweekday: 1,
  binnedutcyearweekdayhours: 1,
  binnedutcyearweekdayhoursminutes: 1,
  binnedutcyearweekdayhoursminutesseconds: 1,

  binnedutcyeardayofyear: 1
};

export const BINNED_TIMEUNIT_INDEX = {
  ...BINNED_LOCAL_TIMEUNIT_INDEX,
  ...BINNED_UTC_TIMEUNIT_INDEX
};

type BinnedUtcTimeUnit = keyof typeof BINNED_UTC_TIMEUNIT_INDEX;

export type BinnedTimeUnit = BinnedLocalTimeUnit | BinnedUtcTimeUnit;

export function isBinnedTimeUnit(
  timeUnit: TimeUnit | BinnedTimeUnit | TimeUnitParams | undefined
): timeUnit is BinnedTimeUnit | TimeUnitParams {
  if (isObject(timeUnit)) {
    return timeUnit.binned;
  }
  return isBinnedTimeUnitString(timeUnit);
}

export function isBinnedTimeUnitString(timeUnit: TimeUnit | BinnedTimeUnit | undefined): timeUnit is BinnedTimeUnit {
  return timeUnit?.startsWith('binned');
}

export const UTC_MULTI_TIMEUNIT_INDEX = {
  utcyearquarter: 1,
  utcyearquartermonth: 1,

  utcyearmonth: 1,
  utcyearmonthdate: 1,
  utcyearmonthdatehours: 1,
  utcyearmonthdatehoursminutes: 1,
  utcyearmonthdatehoursminutesseconds: 1,

  utcyearweek: 1,
  utcyearweekday: 1,
  utcyearweekdayhours: 1,
  utcyearweekdayhoursminutes: 1,
  utcyearweekdayhoursminutesseconds: 1,

  utcyeardayofyear: 1,

  utcquartermonth: 1,

  utcmonthdate: 1,
  utcmonthdatehours: 1,
  utcmonthdatehoursminutes: 1,
  utcmonthdatehoursminutesseconds: 1,

  utcweekday: 1,
  utcweekdayhours: 1,
  utcweekdayhoursminutes: 1,
  utcweekdayhoursminutesseconds: 1,

  utcdayhours: 1,
  utcdayhoursminutes: 1,
  utcdayhoursminutesseconds: 1,

  utchoursminutes: 1,
  utchoursminutesseconds: 1,

  utcminutesseconds: 1,

  utcsecondsmilliseconds: 1
} as const;

export type UtcMultiTimeUnit = keyof typeof UTC_MULTI_TIMEUNIT_INDEX;

export type MultiTimeUnit = LocalMultiTimeUnit | UtcMultiTimeUnit;

export type LocalTimeUnit = LocalSingleTimeUnit | LocalMultiTimeUnit;
export type UtcTimeUnit = UtcSingleTimeUnit | UtcMultiTimeUnit;

export function isUTCTimeUnit(t: string): t is UtcTimeUnit {
  return t.startsWith('utc');
}

export function getLocalTimeUnitFromUTCTimeUnit(t: UtcTimeUnit): LocalTimeUnit {
  return t.substring(3) as LocalTimeUnit;
}

export type TimeUnit = SingleTimeUnit | MultiTimeUnit;

export type TimeUnitFormat =
  | 'year'
  | 'year-month'
  | 'year-month-date'
  | 'quarter'
  | 'month'
  | 'date'
  | 'week'
  | 'day'
  | 'hours'
  | 'hours-minutes'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';

export interface TimeUnitTransformParams {
  /**
   * Defines how date-time values should be binned.
   */
  unit?: TimeUnit;

  /**
   * If no `unit` is specified, maxbins is used to infer time units.
   */
  maxbins?: number;

  /**
   * The number of steps between bins, in terms of the least
   * significant unit provided.
   */
  step?: number;

  /**
   * True to use UTC timezone. Equivalent to using a `utc` prefixed `TimeUnit`.
   */
  utc?: boolean;
}

/**
 * Time Unit Params for encoding predicate, which can specified if the data is  already "binned".
 */
export interface TimeUnitParams extends TimeUnitTransformParams {
  /**
   * Whether the data has already been binned to this time unit.
   * If true, Vega-Lite will only format the data, marks, and guides,
   * without applying the timeUnit transform to re-bin the data again.
   */
  binned?: boolean;
}

// matches vega time unit format specifier
export type TimeFormatConfig = Partial<Record<TimeUnitFormat, string>>;

// In order of increasing specificity
export const VEGALITE_TIMEFORMAT: TimeFormatConfig = {
  'year-month': '%b %Y ',
  'year-month-date': '%b %d, %Y '
};

export function getTimeUnitParts(timeUnit: TimeUnit): LocalSingleTimeUnit[] {
  return TIMEUNIT_PARTS.filter(part => containsTimeUnit(timeUnit, part));
}

export function getSmallestTimeUnitPart(timeUnit: TimeUnit): LocalSingleTimeUnit {
  const parts = getTimeUnitParts(timeUnit);
  return parts[parts.length - 1];
}

/** Returns true if fullTimeUnit contains the timeUnit, false otherwise. */
export function containsTimeUnit(fullTimeUnit: TimeUnit, timeUnit: TimeUnit) {
  const index = fullTimeUnit.indexOf(timeUnit);

  if (index < 0) {
    return false;
  }

  // exclude milliseconds
  if (index > 0 && timeUnit === 'seconds' && fullTimeUnit.charAt(index - 1) === 'i') {
    return false;
  }

  // exclude dayofyear
  if (fullTimeUnit.length > index + 3 && timeUnit === 'day' && fullTimeUnit.charAt(index + 3) === 'o') {
    return false;
  }
  if (index > 0 && timeUnit === 'year' && fullTimeUnit.charAt(index - 1) === 'f') {
    return false;
  }

  return true;
}

/**
 * Returns Vega expression for a given timeUnit and fieldRef
 */
export function fieldExpr(fullTimeUnit: TimeUnit, field: string, {end}: {end: boolean} = {end: false}): string {
  const fieldRef = accessPathWithDatum(field);

  const utc = isUTCTimeUnit(fullTimeUnit) ? 'utc' : '';

  function func(timeUnit: TimeUnit) {
    if (timeUnit === 'quarter') {
      // quarter starting at 0 (0,3,6,9).
      return `(${utc}quarter(${fieldRef})-1)`;
    } else {
      return `${utc}${timeUnit}(${fieldRef})`;
    }
  }

  let lastTimeUnit: TimeUnit;

  const dateExpr: DateTimeExpr = {};

  for (const part of TIMEUNIT_PARTS) {
    if (containsTimeUnit(fullTimeUnit, part)) {
      (dateExpr as any)[part] = func(part);
      lastTimeUnit = part;
    }
  }

  if (end) {
    (dateExpr as any)[lastTimeUnit] += '+1';
  }

  return dateTimeExprToExpr(dateExpr);
}

export function timeUnitSpecifierExpression(timeUnit: TimeUnit, {isAxis}: {isAxis: boolean}): string {
  if (!timeUnit) {
    return undefined;
  }

  const timeUnitParts = getTimeUnitParts(timeUnit);
  if (isAxis) {
    if (timeUnitParts.includes('year') && !timeUnitParts.includes('week')) {
      // If the timeUnit includes year (meaning it's a chronological timeUnit (aka datetime truncation),
      // then the default axis format is actually pretty smart.
      return undefined;
    }
  }

  return `timeUnitSpecifier(${stringify(timeUnitParts)}, ${stringify(VEGALITE_TIMEFORMAT)})`;
}

/**
 * Returns the signal expression used for axis labels for a time unit.
 */
export function formatExpression(timeUnit: TimeUnit, field: string, isUTCScale: boolean): string {
  if (!timeUnit) {
    return undefined;
  }

  const expr = timeUnitSpecifierExpression(timeUnit, {isAxis: false});

  // We only use utcFormat for utc scale
  // For utc time units, the data is already converted as a part of timeUnit transform.
  // Thus, utc time units should use timeFormat to avoid shifting the time twice.
  const utc = isUTCScale || isUTCTimeUnit(timeUnit);

  return `${utc ? 'utc' : 'time'}Format(${field}, ${expr})`;
}

export function normalizeTimeUnit(timeUnit: TimeUnit | BinnedTimeUnit | TimeUnitParams): TimeUnitParams {
  if (!timeUnit) {
    return undefined;
  }

  let params: TimeUnitParams;
  if (isString(timeUnit)) {
    if (isBinnedTimeUnitString(timeUnit)) {
      params = {
        unit: timeUnit.substring(6) as TimeUnit,
        binned: true
      };
    } else {
      params = {
        unit: timeUnit
      };
    }
  } else if (isObject(timeUnit)) {
    params = {
      ...timeUnit,
      ...(timeUnit.unit ? {unit: timeUnit.unit} : {})
    };
  }

  if (isUTCTimeUnit(params.unit)) {
    params.utc = true;
    params.unit = getLocalTimeUnitFromUTCTimeUnit(params.unit);
  }

  return params;
}

export function timeUnitToString(tu: TimeUnit | TimeUnitTransformParams) {
  const {utc, ...rest} = normalizeTimeUnit(tu);

  if (rest.unit) {
    return (
      (utc ? 'utc' : '') +
      keys(rest)
        .map(p => varName(`${p === 'unit' ? '' : `_${p}_`}${rest[p]}`))
        .join('')
    );
  } else {
    // when maxbins is specified instead of units
    return (
      (utc ? 'utc' : '') +
      'timeunit' +
      keys(rest)
        .map(p => varName(`_${p}_${rest[p]}`))
        .join('')
    );
  }
}

export function durationExpr(
  timeUnit: TimeUnit | BinnedTimeUnit | TimeUnitTransformParams,
  wrap: (x: string) => string = x => x
) {
  const normalizedTimeUnit = normalizeTimeUnit(timeUnit);
  const smallestUnitPart = getSmallestTimeUnitPart(normalizedTimeUnit.unit);
  if (smallestUnitPart && smallestUnitPart !== 'day') {
    const startDate: DateTime = {
      year: 2001, // pick a non-leap year
      month: 1,
      date: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    };
    const {step, part} = getDateTimePartAndStep(smallestUnitPart, normalizedTimeUnit.step);
    const endDate: DateTime = {
      ...startDate,
      [part]: +startDate[part] + step
    };

    // Calculate timestamp duration for the smallest unit listed
    return `${wrap(dateTimeToExpr(endDate))} - ${wrap(dateTimeToExpr(startDate))}`;
  }
  return undefined;
}

const DATE_PARTS = {
  year: 1,
  month: 1,
  date: 1,
  hours: 1,
  minutes: 1,
  seconds: 1,
  milliseconds: 1
} as const;

type DatePart = keyof typeof DATE_PARTS;

export function isDatePart(timeUnit: LocalSingleTimeUnit): timeUnit is DatePart {
  return hasOwnProperty(DATE_PARTS, timeUnit);
}

export function getDateTimePartAndStep(
  timeUnit: LocalSingleTimeUnit,
  step = 1
): {
  part: keyof DateTime;
  step: number;
} {
  if (isDatePart(timeUnit)) {
    return {part: timeUnit, step};
  }
  switch (timeUnit) {
    case 'day':
    case 'dayofyear':
      return {part: 'date', step};
    case 'quarter':
      return {part: 'month', step: step * 3};
    case 'week':
      return {part: 'date', step: step * 7};
  }
}
