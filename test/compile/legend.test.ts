/* tslint:disable:quotemark */

import {assert} from 'chai';
import {parseUnitModel} from '../util';
import {COLOR, X} from '../../src/channel';
import {defaultConfig} from '../../src/config';
import * as legend from '../../src/compile/legend';
import {TimeUnit} from '../../src/timeunit';
import {TEMPORAL} from '../../src/type';

describe('Legend', function() {
  describe('parseLegend()', function() {
    it('should output explicitly specified properties', function() {
      it('should produce a Vega axis object with correct type and scale', function() {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal"}
          }
        });
        const def = legend.parseLegend(model, X);
        assert.isObject(def);
        assert.equal(def.title, "a");
      });
    });
  });

  describe('title()', function () {
    it('should add explicitly specified title', function () {
      const title = legend.title({title: 'Custom'}, {field: 'a'}, defaultConfig);
      assert.deepEqual(title, 'Custom');
    });

    it('should add return fieldTitle by default', function () {
      const title = legend.title({}, {field: 'a'}, defaultConfig);
      assert.deepEqual(title, 'a');
    });
  });

  describe('properties.symbols', function() {
    it('should initialize if filled', function() {
      const symbol = legend.properties.symbols({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal"}
          }
        }), COLOR);
        assert.deepEqual(symbol.strokeWidth.value, 2);
    });

    it('should not have strokeDash and strokeDashOffset', function() {
      const symbol = legend.properties.symbols({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal"}
          }
        }), COLOR);
        assert.isUndefined(symbol.strokeDash);
        assert.isUndefined(symbol.strokeDashOffset);
    });

    it('should return specific color value', function() {
      const symbol = legend.properties.symbols({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal",  legend: {"symbolColor": "red"}}
          }
        }), COLOR);
        assert.deepEqual(symbol.fill.value, "red");
    });

    it('should return specific shape value', function() {
      const symbol = legend.properties.symbols({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"symbolShape": "diamond"}}
          }
        }), COLOR);
        assert.deepEqual(symbol.shape.value, "diamond");
    });

    it('should return specific size of the symbol', function() {
      const symbol = legend.properties.symbols({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"symbolSize": 20}}}
        }), COLOR);
        assert.deepEqual(symbol.size.value, 20);
    });

    it('should return specific width of the symbol', function() {
      const symbol = legend.properties.symbols({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"symbolStrokeWidth": 20}}}
        }), COLOR);
        assert.deepEqual(symbol.strokeWidth.value, 20);
    });
  });

  describe('properties.labels', function() {
    it('should return alignment value of the label', function() {
      const label = legend.properties.labels({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"labelAlign": "left"}}}
        }), COLOR);
        assert.deepEqual(label.align.value, "left");
    });

    it('should return color value of the label', function() {
      const label = legend.properties.labels({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"labelColor": "blue"}}}
        }), COLOR);
        assert.deepEqual(label.stroke.value, "blue");
    });

    it('should return font of the label', function() {
      const label = legend.properties.labels({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"labelFont": "what"}}}
        }), COLOR);
        assert.deepEqual(label.font.value, "what");
    });

    it('should return font size of the label', function() {
      const label = legend.properties.labels({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"labelFontSize": 20}}}
        }), COLOR);
        assert.deepEqual(label.fontSize.value, 20);
    });

    it('should return baseline of the label', function() {
      const label = legend.properties.labels({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"labelBaseline": "middle"}}}
        }), COLOR);
        assert.deepEqual(label.baseline.value, "middle");
    });

    it('should return correct template for the timeUnit: TimeUnit.MONTH', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          x: {field: "a", type: "temporal"},
          color: {field: "a", type: "temporal", timeUnit: "month"}}
      });
      const fieldDef = {field: 'a', type: TEMPORAL, timeUnit: TimeUnit.MONTH};
      const label = legend.properties.labels(fieldDef, {}, model, COLOR);
      let expected = "{{datum.data | time:'%B'}}";
      assert.deepEqual(label.text.template, expected);
    });

    it('should return correct template for the timeUnit: TimeUnit.QUARTER', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          x: {field: "a", type: "temporal"},
          color: {field: "a", type: "temporal", timeUnit: "quarter"}}
      });
      const fieldDef = {field: 'a', type: TEMPORAL, timeUnit: TimeUnit.QUARTER};
      const label = legend.properties.labels(fieldDef, {}, model, COLOR);
      let quarterPrefix = 'Q';
      let expected = quarterPrefix + "{{datum.data | quarter}}";
      assert.deepEqual(label.text.template, expected);
    });
  });

  describe('properties.title', function() {
    it('should return color of the title', function() {
      const title = legend.properties.title({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"titleColor": "black"}}}
        }), COLOR);
        assert.deepEqual(title.stroke.value, "black");
    });

    it('should return font of the title', function() {
      const title = legend.properties.title({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"titleFont": "abcd"}}}
        }), COLOR);
        assert.deepEqual(title.font.value, "abcd");
    });

    it('should return font size of the title', function() {
      const title = legend.properties.title({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"titleFontSize": 22}}}
        }), COLOR);
        assert.deepEqual(title.fontSize.value, 22);
    });

    it('should return font weight of the title', function() {
      const title = legend.properties.title({field: 'a'}, {}, parseUnitModel({
          mark: "point",
          encoding: {
            x: {field: "a", type: "nominal"},
            color: {field: "a", type: "nominal", legend: {"titleFontWeight": 5}}}
        }), COLOR);
        assert.deepEqual(title.fontWeight.value, 5);
    });
  });
});
