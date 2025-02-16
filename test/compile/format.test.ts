import {PositionDatumDef, vgField} from '../../src/channeldef';
import {
  formatSignalRef,
  guideFormat,
  guideFormatType,
  numberFormat,
  timeFormatExpression,
  timeFormat
} from '../../src/compile/format';
import {defaultConfig} from '../../src/config';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL} from '../../src/type';

describe('Format', () => {
  describe('timeFormatExpression()', () => {
    it('should get the right time expression for month', () => {
      const fieldDef = {timeUnit: 'month', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression({
        field: vgField(fieldDef, {expr: 'datum'}),
        timeUnit: 'month',
        rawTimeFormat: defaultConfig.timeFormat
      });
      expect(expression).toBe(
        'timeFormat(datum["month_a"], timeUnitSpecifier(["month"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "}))'
      );
    });

    it('should get the right time expression for yearmonth with custom format', () => {
      const fieldDef = {timeUnit: 'yearmonth', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression({
        field: vgField(fieldDef, {expr: 'datum'}),
        timeUnit: 'month',
        format: '%Y',
        rawTimeFormat: defaultConfig.timeFormat
      });
      expect(expression).toBe(`timeFormat(datum["yearmonth_a"], "%Y")`);
    });

    it('should get the right time expression for quarter', () => {
      const fieldDef = {timeUnit: 'quarter', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression({
        field: vgField(fieldDef, {expr: 'datum'}),
        timeUnit: 'quarter',
        rawTimeFormat: defaultConfig.timeFormat
      });
      expect(expression).toBe(
        'timeFormat(datum["quarter_a"], timeUnitSpecifier(["quarter"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "}))'
      );
    });

    it('should get the right time expression for yearquarter', () => {
      const expression = timeFormatExpression({
        field: 'datum["data"]',
        timeUnit: 'yearquarter',
        rawTimeFormat: defaultConfig.timeFormat
      });
      expect(expression).toBe(
        'timeFormat(datum["data"], timeUnitSpecifier(["year","quarter"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "}))'
      );
    });

    it('should get the right time expression for yearmonth with custom format and utc scale type', () => {
      const fieldDef = {timeUnit: 'yearmonth', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression({
        field: vgField(fieldDef, {expr: 'datum'}),
        timeUnit: 'month',
        format: '%Y',
        rawTimeFormat: defaultConfig.timeFormat,
        isUTCScale: true
      });
      expect(expression).toBe(`utcFormat(datum["yearmonth_a"], "%Y")`);
    });

    it('should get the right time expression for with a custom timeFormatType', () => {
      const fieldDef = {field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression({
        field: vgField(fieldDef, {expr: 'datum'}),
        format: '%Y',
        formatType: 'customFormat'
      });
      expect(expression).toBe(`customFormat(datum["a"], "%Y")`);
    });

    it('should prefer timeUnit over timeFormatType', () => {
      const fieldDef = {field: 'a', type: TEMPORAL, timeUnit: 'date'} as const;
      const expression = timeFormatExpression({
        field: vgField(fieldDef, {expr: 'datum'}),
        format: '%Y',
        timeUnit: 'date',
        formatType: 'customFormat'
      });
      expect(expression).toBe(`timeFormat(datum["date_a"], "%Y")`);
    });
  });

  describe('timeFormat()', () => {
    it('returns the specifiedFormat if it exists', () => {
      const formatted = timeFormat({specifiedFormat: 'abc', config: {}});
      expect(formatted).toBe('abc');
    });

    it('returns the the formatted timeUnitExpression', () => {
      const formatted = timeFormat({timeUnit: 'date', config: {}});
      expect(formatted).toEqual({
        signal: 'timeUnitSpecifier(["date"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "})'
      });
    });

    it('omits the timeFormat when isAxis and no specifiedFormat', () => {
      const formatted = timeFormat({config: {timeFormat: '%y'}, isAxis: true});
      expect(formatted).toBeUndefined();
    });

    it('returns the timeFormat when !isAxis and no specifiedFormat', () => {
      const formatted = timeFormat({config: {timeFormat: '%y'}, isAxis: false});
      expect(formatted).toBe('%y');
    });
  });

  describe('numberFormat()', () => {
    it('should use number format for quantitative scale', () => {
      expect(numberFormat({type: QUANTITATIVE, config: {numberFormat: 'd'}})).toBe('d');
    });

    it('should use normalized number format for quantitative scale with stack: "normalize"', () => {
      expect(
        numberFormat({
          type: QUANTITATIVE,
          config: {numberFormat: 'd', normalizedNumberFormat: 'c'},
          normalizeStack: true
        })
      ).toBe('c');
    });

    it('should use number format for ordinal and nominal data but don not use config', () => {
      for (const type of [ORDINAL, NOMINAL]) {
        expect(numberFormat({type, config: {numberFormat: 'd'}})).toBeUndefined();
        expect(numberFormat({type, specifiedFormat: 'd', config: {numberFormat: 'd'}})).toBe('d');
      }
    });

    it('should support empty number format', () => {
      expect(numberFormat({type: QUANTITATIVE, config: {numberFormat: ''}})).toBe('');
    });

    it('should use format if provided', () => {
      expect(numberFormat({type: QUANTITATIVE, specifiedFormat: 'a', config: {}})).toBe('a');
    });

    it('should not use number format for binned quantitative scale', () => {
      expect(numberFormat({type: QUANTITATIVE, config: {}})).toBeUndefined();
    });

    it('should not use number format for temporal scale', () => {
      expect(numberFormat({type: TEMPORAL, config: {}})).toBeUndefined();
      expect(numberFormat({type: ORDINAL, config: {}})).toBeUndefined();
    });
  });

  describe('formatSignalRef()', () => {
    it('should format ordinal field defs if format is present', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {field: 'foo', type: 'ordinal'},
          format: '.2f',
          formatType: undefined,
          expr: 'parent',
          config: {}
        })
      ).toEqual({
        signal: 'format(parent["foo"], ".2f")'
      });
    });

    it('correctly formats binned field defs if custom format config is present', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {bin: true, field: 'foo', type: 'quantitative'},
          format: undefined,
          formatType: undefined,
          expr: 'parent',
          config: {numberFormat: 'abc', numberFormatType: 'customFormatter'}
        })
      ).toEqual({
        signal:
          '!isValid(parent["bin_maxbins_10_foo"]) || !isFinite(+parent["bin_maxbins_10_foo"]) ? "null" : format(parent["bin_maxbins_10_foo"], "abc") + " – " + format(parent["bin_maxbins_10_foo_end"], "abc")'
      });
    });

    it('should format datumDef if format is present', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {datum: 200, type: 'quantitative'},
          format: '.2f',
          formatType: undefined,
          expr: 'parent',
          config: {}
        })
      ).toEqual({
        signal: 'format(200, ".2f")'
      });
    });

    it('should use a custom formatter datumDef if formatType is present', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {datum: 200, type: 'quantitative'},
          format: 'abc',
          formatType: 'customFormatter',
          expr: 'parent',
          config: {}
        })
      ).toEqual({
        signal: 'customFormatter(200, "abc")'
      });
    });

    it('should use a custom formatter datumDef if config.numberFormatType is present', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {datum: 200, type: 'quantitative'},
          format: undefined,
          formatType: undefined,
          expr: 'parent',
          config: {numberFormat: 'abc', numberFormatType: 'customFormatter', customFormatTypes: true}
        })
      ).toEqual({
        signal: 'customFormatter(200, "abc")'
      });
    });

    it('should use a custom formatter datumDef if config.timeFormatType is present', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {field: 'date', type: 'temporal'},
          format: undefined,
          formatType: undefined,
          expr: 'parent',
          config: {timeFormat: 'abc', timeFormatType: 'customFormatter', customFormatTypes: true}
        })
      ).toEqual({
        signal: 'customFormatter(parent["date"], "abc")'
      });
    });

    it('should use a custom formatter datumDef if config.normalizedNumberFormatType is present and stack is normalized', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {datum: 200, type: 'quantitative'},
          format: undefined,
          formatType: undefined,
          expr: 'parent',
          normalizeStack: true,
          config: {
            normalizedNumberFormat: 'abc',
            normalizedNumberFormatType: 'customFormatter',
            customFormatTypes: true
          }
        })
      ).toEqual({
        signal: 'customFormatter(200, "abc")'
      });
    });

    it('should prefer normalizedNumberFormat over numberFormat when stack is normalized', () => {
      expect(
        formatSignalRef({
          fieldOrDatumDef: {datum: 200, type: 'quantitative'},
          format: undefined,
          formatType: undefined,
          expr: 'parent',
          normalizeStack: true,
          config: {
            numberFormat: 'def',
            numberFormatType: 'customFormatter2',
            normalizedNumberFormat: 'abc',
            normalizedNumberFormatType: 'customFormatter',
            customFormatTypes: true
          }
        })
      ).toEqual({
        signal: 'customFormatter(200, "abc")'
      });
    });
  });

  describe('guideFormat', () => {
    it('returns undefined for custom formatType', () => {
      const format = guideFormat({datum: 200, type: 'quantitative'}, 'quantitative', 'abc', 'custom', {}, false);
      expect(format).toBeUndefined();
    });

    it('returns undefined for custom formatType in the config', () => {
      const format = guideFormat(
        {datum: 200, type: 'quantitative'},
        'quantitative',
        undefined,
        undefined,
        {numberFormat: 'abc', numberFormatType: 'customFormatter', customFormatTypes: true},
        false
      );
      expect(format).toBeUndefined();
    });

    it('returns undefined for normalized field if custom normalizedNumberFormatType is in the config', () => {
      const format = guideFormat(
        {datum: 200, type: 'quantitative', stack: 'normalize'} as PositionDatumDef<string>,
        'quantitative',
        undefined,
        undefined,
        {normalizedNumberFormat: 'abc', normalizedNumberFormatType: 'customFormatter', customFormatTypes: true},
        false
      );
      expect(format).toBeUndefined();
    });

    it('returns undefined for a field if custom timeFormatType is in the config', () => {
      const format = guideFormat(
        {datum: 200, type: 'temporal'},
        'temporal',
        undefined,
        undefined,
        {timeFormat: 'abc', timeFormatType: 'customFormatter', customFormatTypes: true},
        false
      );
      expect(format).toBeUndefined();
    });

    it('Prefers timeUnit to timeFormatType', () => {
      const format = guideFormat(
        {field: 'x', type: 'temporal', timeUnit: 'hours'},
        'temporal',
        undefined,
        undefined,
        {timeFormat: 'abc', timeFormatType: 'customFormatter', customFormatTypes: true},
        false
      );
      expect(format).toEqual({
        signal: 'timeUnitSpecifier(["hours"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "})'
      });
    });

    it('returns format as normalizedNumberFormatType it is not in the config', () => {
      const format = guideFormat(
        {datum: 200, type: 'quantitative', stack: 'normalize'} as PositionDatumDef<string>,
        'quantitative',
        undefined,
        undefined,
        {normalizedNumberFormat: 'abc'},
        false
      );
      expect(format).toBe('abc');
    });
  });

  describe('guideFormatType()', () => {
    it('should return existing format type', () => {
      expect(guideFormatType('number', {field: ' foo', type: 'quantitative'}, 'ordinal')).toBe('number');
      expect(guideFormatType('time', {field: ' foo', type: 'quantitative'}, 'ordinal')).toBe('time');
    });

    it('should return utc for utc time units', () => {
      expect(
        guideFormatType('', {field: ' foo', type: 'ordinal', timeUnit: {utc: true, unit: 'year'}}, 'ordinal')
      ).toBe('utc');
    });
  });
});
