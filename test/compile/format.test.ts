import {vgField} from '../../src/channeldef';
import {
  formatSignalRef,
  guideFormat,
  guideFormatType,
  numberFormat,
  timeFormatExpression
} from '../../src/compile/format';
import {defaultConfig} from '../../src/config';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL} from '../../src/type';

describe('Format', () => {
  describe('timeFormatExpression()', () => {
    it('should get the right time expression for month', () => {
      const fieldDef = {timeUnit: 'month', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression(
        vgField(fieldDef, {expr: 'datum'}),
        'month',
        undefined,
        defaultConfig.timeFormat,
        false
      );
      expect(expression).toBe(
        'timeFormat(datum["month_a"], timeUnitSpecifier(["month"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "}))'
      );
    });

    it('should get the right time expression for yearmonth with custom format', () => {
      const fieldDef = {timeUnit: 'yearmonth', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression(
        vgField(fieldDef, {expr: 'datum'}),
        'month',
        '%Y',
        defaultConfig.timeFormat,
        false
      );
      expect(expression).toBe(`timeFormat(datum["yearmonth_a"], '%Y')`);
    });

    it('should get the right time expression for quarter', () => {
      const fieldDef = {timeUnit: 'quarter', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression(
        vgField(fieldDef, {expr: 'datum'}),
        'quarter',
        undefined,
        defaultConfig.timeFormat,
        false
      );
      expect(expression).toBe(
        'timeFormat(datum["quarter_a"], timeUnitSpecifier(["quarter"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "}))'
      );
    });

    it('should get the right time expression for yearquarter', () => {
      const expression = timeFormatExpression(
        'datum["data"]',
        'yearquarter',
        undefined,
        defaultConfig.timeFormat,
        false
      );
      expect(expression).toBe(
        'timeFormat(datum["data"], timeUnitSpecifier(["year","quarter"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "}))'
      );
    });

    it('should get the right time expression for yearmonth with custom format and utc scale type', () => {
      const fieldDef = {timeUnit: 'yearmonth', field: 'a', type: TEMPORAL} as const;
      const expression = timeFormatExpression(
        vgField(fieldDef, {expr: 'datum'}),
        'month',
        '%Y',
        defaultConfig.timeFormat,
        true
      );
      expect(expression).toBe(`utcFormat(datum["yearmonth_a"], '%Y')`);
    });
  });

  describe('numberFormat()', () => {
    it('should use number format for quantitative scale', () => {
      expect(numberFormat(QUANTITATIVE, undefined, {numberFormat: 'd'})).toBe('d');
    });

    it('should use number format for ordinal and nominal data but don not use config', () => {
      for (const type of [ORDINAL, NOMINAL]) {
        expect(numberFormat(type, undefined, {numberFormat: 'd'})).toBeUndefined();
        expect(numberFormat(type, 'd', {numberFormat: 'd'})).toBe('d');
      }
    });

    it('should support empty number format', () => {
      expect(numberFormat(QUANTITATIVE, undefined, {numberFormat: ''})).toBe('');
    });

    it('should use format if provided', () => {
      expect(numberFormat(QUANTITATIVE, 'a', {})).toBe('a');
    });

    it('should not use number format for binned quantitative scale', () => {
      expect(numberFormat(QUANTITATIVE, undefined, {})).toBeUndefined();
    });

    it('should not use number format for temporal scale', () => {
      expect(numberFormat(TEMPORAL, undefined, {})).toBeUndefined();
      expect(numberFormat(ORDINAL, undefined, {})).toBeUndefined();
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
