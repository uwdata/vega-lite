/* tslint:disable:quotemark */

import {assert} from 'chai';

import {bandSize, type, domain, parseScaleComponent} from '../../src/compile/scale';
import {SOURCE, SUMMARY} from '../../src/data';
import {parseUnitModel} from '../util';

import * as log from '../../src/log';
import {X, Y, SHAPE, DETAIL, ROW, COLUMN} from '../../src/channel';
import {BANDSIZE_FIT, ScaleType, defaultScaleConfig} from '../../src/scale';
import {POINT, RECT, BAR, TEXT} from '../../src/mark';
import {TimeUnit} from '../../src/timeunit';
import {TEMPORAL, ORDINAL} from '../../src/type';

describe('Scale', function() {
  describe('type()', function() {
    it('should return null for channel without scale', function() {
      assert.deepEqual(
        type(undefined, {
          field: 'a',
          type: TEMPORAL,
          timeUnit: TimeUnit.YEARMONTH
        }, DETAIL, POINT, true),
        null
      );
    });

    it('should return time for most of time unit.', function() {
      // See exception in the next test)
      const TIMEUNITS = [
        TimeUnit.YEAR,
        TimeUnit.DATE,
        TimeUnit.MINUTES,
        TimeUnit.SECONDS,
        TimeUnit.MILLISECONDS,
        TimeUnit.YEARMONTH,
        TimeUnit.YEARMONTHDATE,
        TimeUnit.YEARMONTHDATEHOURS,
        TimeUnit.YEARMONTHDATEHOURSMINUTES,
        TimeUnit.YEARMONTHDATEHOURSMINUTESSECONDS,
        TimeUnit.HOURSMINUTES,
        TimeUnit.HOURSMINUTESSECONDS,
        TimeUnit.MINUTESSECONDS,
        TimeUnit.SECONDSMILLISECONDS,
        TimeUnit.YEARQUARTER,
        TimeUnit.QUARTERMONTH,
        TimeUnit.YEARQUARTERMONTH,
      ];
      for (const timeUnit of TIMEUNITS) {
        assert.deepEqual(
          type(undefined, {
            field: 'a',
            type: TEMPORAL,
            timeUnit: timeUnit
          }, Y, POINT, true),
          ScaleType.TIME
        );
      }
    });

    it('should return a discrete scale for hours, day, month, quarter for x-y', function() {
      [TimeUnit.MONTH, TimeUnit.HOURS, TimeUnit.DAY, TimeUnit.QUARTER].forEach((timeUnit) => {
        assert.deepEqual(
          type(undefined, {
            field: 'a',
            type: TEMPORAL,
            timeUnit: timeUnit
          }, Y, POINT, true),
          ScaleType.POINT
        );
      });
    });

    it('should return ordinal for shape', function() {
      assert.deepEqual(
        type(undefined, {
          field: 'a',
          type: TEMPORAL,
          timeUnit: TimeUnit.YEARMONTH
        }, SHAPE, POINT, true),
        ScaleType.ORDINAL_LOOKUP
      );
    });

    it('should return ordinal for shape even if other type is specified', function() {
      [ScaleType.LINEAR, ScaleType.BAND, ScaleType.POINT].forEach((badScaleType) => {
        log.runLocalLogger((localLogger) => {
          assert.deepEqual(
            type(badScaleType, {
              field: 'a',
              type: TEMPORAL,
              timeUnit: TimeUnit.YEARMONTH
            }, SHAPE, POINT, true),
            ScaleType.ORDINAL_LOOKUP
          );
          assert.equal(localLogger.warns[0], log.message.scaleTypeNotWorkWithChannel(SHAPE, badScaleType, ScaleType.ORDINAL_LOOKUP));
        });
      });
    });

    it('should return band for row/column', function() {
      [ROW, COLUMN].forEach((channel) => {
        assert.deepEqual(
          type(undefined, {
            field: 'a',
            type: TEMPORAL,
            timeUnit: TimeUnit.YEARMONTH
          }, channel, POINT, true),
          ScaleType.BAND
        );
      });
    });

    it('should return band for row/column even if other type is specified', function() {
      [ROW, COLUMN].forEach((channel) => {
        [ScaleType.LINEAR, ScaleType.ORDINAL_LOOKUP, ScaleType.POINT].forEach((badScaleType) => {
          log.runLocalLogger((localLogger) => {
            assert.deepEqual(
              type(badScaleType, {
                field: 'a',
                type: TEMPORAL,
                timeUnit: TimeUnit.YEARMONTH
              }, channel, POINT, true),
              ScaleType.BAND
            );
            assert.equal(localLogger.warns[0], log.message.scaleTypeNotWorkWithChannel(channel, badScaleType, ScaleType.BAND));
          });
        });
      });
    });

    it('should return band scale for ordinal X,Y when mark is rect', () => {
      [X, Y].forEach((channel) => {
        assert.equal(type(undefined, {field: 'a', type: ORDINAL}, channel, RECT, true), ScaleType.BAND);
      });
    });

    it('should return band scale for X,Y when mark is bar and bandSize is undefined (fit)', () => {
      [X, Y].forEach((channel) => {
        assert.equal(type(undefined, {field: 'a', type: ORDINAL}, channel, BAR, false), ScaleType.BAND);
      });
    });

    it('should return point scale for X,Y when mark is bar and bandSize is defined', () => {
      [X, Y].forEach((channel) => {
        assert.equal(type(undefined, {field: 'a', type: ORDINAL}, channel, BAR, true), ScaleType.POINT);
      });
    });

    it('should return point scale for X,Y when mark is point', () => {
      [X, Y].forEach((channel) => {
        assert.equal(type(undefined, {field: 'a', type: ORDINAL}, channel, POINT, true), ScaleType.POINT);
      });
    });

    it('should return point scale for X,Y when mark is point when ORDINAL SCALE TYPE is specified and throw warning', () => {
      [X, Y].forEach((channel) => {
        log.runLocalLogger((localLogger) => {
          assert.equal(type('ordinal', {field: 'a', type: ORDINAL}, channel, POINT, true), ScaleType.POINT);
          assert.equal(localLogger.warns[0], log.message.scaleTypeNotWorkWithChannel(channel, 'ordinal', 'point'));
        });
      });
    });
  });

  describe('bandSize()', () => {

    it('should return undefined if bandSize spec is fit', () => {
      const size = bandSize(BANDSIZE_FIT, 180, POINT, X, defaultScaleConfig);
      assert.deepEqual(size, undefined);
    });

    it('should return undefined if top-level size is provided for ordinal scale', () => {
      const size = bandSize(undefined, 180, POINT, X, defaultScaleConfig);
      assert.deepEqual(size, undefined);
    });

    it('should return undefined if top-level size is provided for ordinal scale and throw warning if bandSize is specified', log.wrap((logger) => {
      const size = bandSize(21, 180, POINT, X, defaultScaleConfig);
      assert.deepEqual(size, undefined);
      assert.equal(logger.warns[0], log.message.bandSizeOverridden(X));
    }));

    it('should return provided bandSize for ordinal scale', () => {
      const size = bandSize(21, undefined, POINT, X, defaultScaleConfig);
      assert.deepEqual(size, 21);
    });

    it('should return provided textBandWidth for x-ordinal scale', () => {
      const size = bandSize(undefined, undefined, TEXT, X, defaultScaleConfig);
      assert.deepEqual(size, defaultScaleConfig.textBandWidth);
    });

    it('should return provided bandSize for other ordinal scale', () => {
      const size = bandSize(undefined, undefined, POINT, X, defaultScaleConfig);
      assert.deepEqual(size, defaultScaleConfig.bandSize);
    });
  });

  describe('domain()', function() {
    it('should return domain for stack', function() {
      const model = parseUnitModel({
        mark: "bar",
        encoding: {
          y: {
            aggregate: 'sum',
            field: 'origin'
          },
          x: {field: 'x', type: "ordinal"},
          color: {field: 'color', type: "ordinal"},
          row: {field: 'row'}
        }
      });

      const _domain = domain(model.scale(Y), model, Y);

      assert.deepEqual(_domain, {
        data: 'stacked_scale',
        field: 'sum_sum_origin'
      });
    });

    describe('for quantitative', function() {
      it('should return the right domain for binned Q',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                bin: {maxbins: 15},
                field: 'origin',
                scale: {useRawDomain: true},
                type: "quantitative"
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain, {
            data: SOURCE,
            field: [
              'bin_origin_start',
              'bin_origin_end'
            ]
          });
        });

      it('should return the raw domain if useRawDomain is true for non-bin, non-sum Q',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                aggregate: 'mean',
                field: 'origin',
                scale: {useRawDomain: true},
                type: "quantitative"
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain.data, SOURCE);
        });

      it('should return the aggregate domain for sum Q',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                aggregate: 'sum',
                field: 'origin',
                scale: {useRawDomain: true},
                type: "quantitative"
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain.data, SUMMARY);
        });

      it('should return the right custom domain', () => {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              field: 'horsepower',
              type: "quantitative",
              scale: {domain: [0,200]}
            }
          }
        });
        const _domain = domain(model.scale(Y), model, Y);

        assert.deepEqual(_domain, [0, 200]);
      });

      it('should return the aggregated domain if useRawDomain is false', function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                aggregate: 'min',
                field: 'origin',
                scale: {useRawDomain: false},
                type: "quantitative"
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain.data, SUMMARY);
        });
    });

    describe('for time', function() {
      it('should return the raw domain if useRawDomain is true for raw T',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                field: 'origin',
                scale: {useRawDomain: true},
                type: "temporal"
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain.data, SOURCE);
        });

      it('should return the raw domain if useRawDomain is true for year T',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                field: 'origin',
                scale: {useRawDomain: true},
                type: "temporal",
                timeUnit: 'year'
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain.data, SOURCE);
          assert.operator(_domain.field.indexOf('year'), '>', -1);
        });

      it('should return the correct domain for month T',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                field: 'origin',
                scale: {useRawDomain: true},
                type: "temporal",
                timeUnit: 'month'
              }
            }
          });
          const _domain = domain(model.scale(Y), model, Y);

          assert.deepEqual(_domain, { data: 'source', field: 'month_origin', sort: {field: 'month_origin', op: 'min',} });
        });

        it('should return the correct domain for yearmonth T',
          function() {
            const model = parseUnitModel({
              mark: "point",
              encoding: {
                y: {
                  field: 'origin',
                  scale: {useRawDomain: true},
                  type: "temporal",
                  timeUnit: 'yearmonth'
                }
              }
            });
            const _domain = domain(model.scale(Y), model, Y);

            assert.deepEqual(_domain, {
              data: 'source', field: 'yearmonth_origin',
              sort: {field: 'yearmonth_origin', op: 'min'}
            });
          });

      it('should return the right custom domain with DateTime objects', () => {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              field: 'year',
              type: "temporal",
              scale: {domain: [{year: 1970}, {year: 1980}]}
            }
          }
        });
        const _domain = domain(model.scale(Y), model, Y);

        assert.deepEqual(_domain, [
          new Date(1970, 0, 1).getTime(),
          new Date(1980, 0, 1).getTime()
        ]);
      });
    });

    describe('for ordinal', function() {
      it('should return correct domain with the provided sort property', function() {
        const sortDef = {op: 'min' as 'min', field:'Acceleration'};
        const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: { field: 'origin', type: "ordinal", sort: sortDef}
            }
          });

        assert.deepEqual(domain(model.scale(Y), model, Y), {
            data: "source",
            field: 'origin',
            sort: sortDef
          });
      });

      it('should return correct domain without sort if sort is not provided', function() {
        const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: { field: 'origin', type: "ordinal"}
            }
          });

        assert.deepEqual(domain(model.scale(Y), model, Y), {
            data: "source",
            field: 'origin',
            sort: true
          });
      });
    });
  });

  describe('parseScaleComponent', () => {
    describe('nominal with color', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          color: { field: 'origin', type: "nominal"}
        }
      });

      const scales = parseScaleComponent(model)['color'];

      it('should create correct main color scale', function() {
        assert.equal(scales.main.name, 'color');
        assert.equal(scales.main.type, 'ordinal');
        assert.deepEqual(scales.main.domain, {
          data: 'source',
          field: 'origin',
          sort: true
        });
        assert.deepEqual(scales.main.scheme, 'category10');
        assert.deepEqual(scales.main.bandSize, undefined);
      });
    });

    describe('ordinal with color', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          color: { field: 'origin', type: "ordinal"}
        }
      });

      const scales = parseScaleComponent(model)['color'];

      it('should create color and inverse scales', function() {
        assert.equal(scales.main.name, 'color');
        assert.equal(scales.colorLegend.name, 'color_legend');
        assert.equal(scales.binColorLegend, undefined);
      });

      it('should create correct inverse scale', function() {
        assert.equal(scales.colorLegend.type, 'ordinal');
        assert.deepEqual(scales.colorLegend.domain, {
          data: 'source',
          field: 'rank_origin',
          sort: true
        });
        assert.deepEqual(scales.colorLegend.range, {
          data: 'source',
          field: 'origin',
          sort: true
        });
      });

      it('should create correct color scale', function() {
        assert.equal(scales.main.type, 'linear');
        assert.deepEqual(scales.main.domain, {
          data: 'source',
          field: 'rank_origin'
        });
      });
    });

    describe('color with bin', function() {
      const model = parseUnitModel({
          mark: "point",
          encoding: {
            color: { field: 'origin', type: "quantitative", bin: true}
          }
        });

      const scales = parseScaleComponent(model)['color'];

      it('should add correct scales', function() {
        assert.equal(scales.main.name, 'color');
        assert.equal(scales.colorLegend.name, 'color_legend');
        assert.equal(scales.binColorLegend.name, 'color_legend_label');
      });

      it('should create correct identity scale', function() {
        assert.equal(scales.colorLegend.type, 'ordinal');
        assert.deepEqual(scales.colorLegend.domain, {
          data: 'source',
          field: 'bin_origin_start',
          sort: true
        });
        assert.deepEqual(scales.colorLegend.range, {
          data: 'source',
          field: 'bin_origin_start',
          sort: true
        });
      });

      it('should sort range of color labels', function() {
        assert.deepEqual(scales.binColorLegend.domain, {
          data: 'source',
          field: 'bin_origin_start',
          sort: true
        });
        assert.deepEqual(scales.binColorLegend.range, {
          data: 'source',
          field: 'bin_origin_range',
          sort: {"field": "bin_origin_start","op": "min"}
        });
      });
    });

    describe('color with time unit', function() {
      const model = parseUnitModel({
          mark: "point",
          encoding: {
            color: {field: 'origin', type: "temporal", timeUnit: "year"}
          }
        });

      const scales = parseScaleComponent(model)['color'];

      it('should add correct scales', function() {
        assert.equal(scales.main.name, 'color');
        assert.equal(scales.colorLegend.name, 'color_legend');
        assert.equal(scales.binColorLegend, undefined);
      });

      it('should create correct identity scale', function() {
        assert.equal(scales.colorLegend.type, 'ordinal');
        assert.deepEqual(scales.colorLegend.domain, {
          data: 'source',
          field: 'year_origin',
          sort: true
        });
        assert.deepEqual(scales.colorLegend.range, {
          data: 'source',
          field: 'year_origin',
          sort: true
        });
      });
    });
  });


  describe('rangeMixins()', function() {
    describe('row', function() {
      // TODO:
    });

    describe('column', function() {
      // TODO:
    });

    describe('x', function() {
      // TODO: X
    });

    describe('y', function() {
      // TODO: Y
    });

    describe('size', function() {
      describe('bar', function() {
        // TODO:
      });

      describe('text', function() {
        // TODO:
      });

      describe('rule', function() {
        // TODO:
      });

      describe('point, square, circle', function() {
        it('should return [9, (minBandSize-2)^2] if both x and y are discrete', () => {
          // TODO: replace this test with something more local
          const model = parseUnitModel({
            "data": {"url": "data/cars.json"},
            "mark": "point",
            "encoding": {
              "y": {"field": "Origin", "type": "ordinal", "scale": {"bandSize": 11}},
              "x": {"field": "Cylinders", "type": "ordinal", "scale": {"bandSize": 13}},
              "size": {"aggregate": "mean", "field": "Horsepower", "type": "quantitative"}
            }
          });
          const scales = parseScaleComponent(model)['size'];
          assert.deepEqual(scales.main.range, [9, 81]);
        });

        it('should return [9, (xBandSize-2)^2] if x is discrete and y is continuous', () => {
          // TODO: replace this test with something more local
          const model = parseUnitModel({
            "data": {"url": "data/cars.json"},
            "mark": "point",
            "encoding": {
              "y": {"field": "Acceleration", "type": "quantitative"},
              "x": {"field": "Cylinders", "type": "ordinal", "scale": {"bandSize": 11}},
              "size": {"aggregate": "mean", "field": "Horsepower", "type": "quantitative"}
            }
          });
          const scales = parseScaleComponent(model)['size'];
          assert.deepEqual(scales.main.range, [9, 81]);
        });

        it('should return [9, (yBandSize-2)^2] if y is discrete and x is continuous', () => {
          // TODO: replace this test with something more local
          const model = parseUnitModel({
            "data": {"url": "data/cars.json"},
            "mark": "point",
            "encoding": {
              "x": {"field": "Acceleration", "type": "quantitative"},
              "y": {"field": "Cylinders", "type": "ordinal", "scale": {"bandSize": 11}},
              "size": {"aggregate": "mean", "field": "Horsepower", "type": "quantitative"}
            }
          });
          const scales = parseScaleComponent(model)['size'];
          assert.deepEqual(scales.main.range, [9, 81]);
        });

        it('should return [9, (scaleConfig.BandSize-2)^2] if y is discrete and x is continuous', () => {
          // TODO: replace this test with something more local
          const model = parseUnitModel({
            "data": {"url": "data/cars.json"},
            "mark": "point",
            "encoding": {
              "x": {"field": "Acceleration", "type": "quantitative"},
              "y": {"field": "Acceleration", "type": "quantitative"},
              "size": {"aggregate": "mean", "field": "Horsepower", "type": "quantitative"}
            },
            "config": {"scale": {"bandSize": 11}}
          });
          const scales = parseScaleComponent(model)['size'];
          assert.deepEqual(scales.main.range, [9, 81]);
        });
      });
    });

    describe('shape', function() {
      // TODO:
    });

    describe('color', function() {
      // TODO:
    });
  });

  describe('bandSize()', function() {
    // TODO:
  });

  describe('nice()', function() {
    // FIXME
  });

  describe('outerPadding()', function() {
    // FIXME
  });

  describe('reverse()', function() {
    // FIXME
  });

  describe('zero()', function() {
    // FIXME
  });
});
