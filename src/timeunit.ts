
export enum TimeUnit {
    YEAR = 'year' as any,
    MONTH = 'month' as any,
    DAY = 'day' as any,
    DATE = 'date' as any,
    HOURS = 'hours' as any,
    MINUTES = 'minutes' as any,
    SECONDS = 'seconds' as any,
    MILLISECONDS = 'milliseconds' as any,
    YEARMONTH = 'yearmonth' as any,
    YEARMONTHDAY = 'yearmonthday' as any,
    YEARMONTHDATE = 'yearmonthdate' as any,
    YEARDAY = 'yearday' as any,
    YEARDATE = 'yeardate' as any,
    YEARMONTHDAYHOURS = 'yearmonthdayhours' as any,
    YEARMONTHDAYHOURSMINUTES = 'yearmonthdayhoursminutes' as any,
    YEARMONTHDAYHOURSMINUTESSECONDS = 'yearmonthdayhoursminutesseconds' as any,
    HOURSMINUTES = 'hoursminutes' as any,
    HOURSMINUTESSECONDS = 'hoursminutesseconds' as any,
    MINUTESSECONDS = 'minutesseconds' as any,
    SECONDSMILLISECONDS = 'secondsmilliseconds' as any,
    QUARTER = 'quarter' as any,
    YEARQUARTER = 'yearquarter' as any,
    QUARTERMONTH = 'quartermonth' as any,
    YEARQUARTERMONTH = 'yearquartermonth' as any,
}

export const TIMEUNITS = [
    TimeUnit.YEAR,
    TimeUnit.MONTH,
    TimeUnit.DAY,
    TimeUnit.DATE,
    TimeUnit.HOURS,
    TimeUnit.MINUTES,
    TimeUnit.SECONDS,
    TimeUnit.MILLISECONDS,
    TimeUnit.YEARMONTH,
    TimeUnit.YEARMONTHDAY,
    TimeUnit.YEARMONTHDATE,
    TimeUnit.YEARDAY,
    TimeUnit.YEARDATE,
    TimeUnit.YEARMONTHDAYHOURS,
    TimeUnit.YEARMONTHDAYHOURSMINUTES,
    TimeUnit.YEARMONTHDAYHOURSMINUTESSECONDS,
    TimeUnit.HOURSMINUTES,
    TimeUnit.HOURSMINUTESSECONDS,
    TimeUnit.MINUTESSECONDS,
    TimeUnit.SECONDSMILLISECONDS,
    TimeUnit.QUARTER,
    TimeUnit.YEARQUARTER,
    TimeUnit.QUARTERMONTH,
    TimeUnit.YEARQUARTERMONTH,
];

/** returns the template name used for axis labels for a time unit */
export function format(timeUnit: TimeUnit, abbreviated = false, field='datum.data'): string {
  if (!timeUnit) {
    return undefined;
  }

  let dateComponents = [];

  if (containsTimeUnit(timeUnit, TimeUnit.YEAR)) {
    dateComponents.push(abbreviated ? '%y' : '%Y');
  }

  if (containsTimeUnit(timeUnit, TimeUnit.QUARTER)) {
   // special template for quarter
   dateComponents.push('\'}}Q{{' + field + ' | quarter}}{{' + field + ' | time:\'');
  }

  if (containsTimeUnit(timeUnit, TimeUnit.MONTH)) {
    dateComponents.push(abbreviated ? '%b' : '%B');
  }

  if (containsTimeUnit(timeUnit, TimeUnit.DAY)) {
    dateComponents.push(abbreviated ? '%a' : '%A');
  } else if (containsTimeUnit(timeUnit, TimeUnit.DATE)) {
    dateComponents.push('%d');
  }

  let timeComponents = [];

  if (containsTimeUnit(timeUnit, TimeUnit.HOURS)) {
    timeComponents.push('%H');
  }
  if (containsTimeUnit(timeUnit, TimeUnit.MINUTES)) {
    timeComponents.push('%M');
  }
  if (containsTimeUnit(timeUnit, TimeUnit.SECONDS)) {
    timeComponents.push('%S');
  }
  if (containsTimeUnit(timeUnit, TimeUnit.MILLISECONDS)) {
    timeComponents.push('%L');
  }

  let out = [];
  if (dateComponents.length > 0) {
    out.push(dateComponents.join('-'));
  }
  if (timeComponents.length > 0) {
    out.push(timeComponents.join(':'));
  }

  if (out.length > 0) {
  // clean up quarter formatting remainders
   const template = '{{' + field + ' | time:\'' + out.join(' ') + '\'}}';
   return template.replace(new RegExp('{{' + field + ' \\| time:\'\'}}', 'g'), '');
  } else {
   return undefined;
  }
}

/** Returns true if container contains the containee, false otherwise. */
export function containsTimeUnit(fullTimeUnit: TimeUnit, timeUnit: TimeUnit) {
  let containerStr = fullTimeUnit.toString();
  let containeeStr = timeUnit.toString();
  return containerStr.indexOf(containeeStr) > -1;
}
