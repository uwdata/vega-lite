/* tslint:disable quotemark */

import * as log from '../../../src/log';

import {assert} from 'chai';
import {BAR} from '../../../src/mark';
import {parseUnitModelWithScaleMarkDefLayoutSize} from '../../util';

describe('compile/mark/normalize', function() {

  describe('orient', function() {
    it('should return correct default for QxQ', log.wrap((localLogger) => {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        "encoding": {
          "y": {"type": "quantitative", "field": "foo"},
          "x": {"type": "quantitative", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
      assert.equal(localLogger.warns[0], log.message.unclearOrientContinuous(BAR));
    }));

    it('should return correct default for empty plot', log.wrap((localLogger) => {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        encoding: {}
      });
      assert.equal(model.markDef.orient, undefined);
      assert.equal(localLogger.warns[0], log.message.unclearOrientDiscreteOrEmpty(BAR));
    }));

    it('should return correct orient for bar with both axes discrete', log.wrap((localLogger) => {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        "encoding": {
          "x": {"type": "ordinal", "field": "foo"},
          "y": {"type": "ordinal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, undefined);
      assert.equal(localLogger.warns[0], log.message.unclearOrientDiscreteOrEmpty(BAR));
    }));


    it('should return correct orient for vertical bar', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        "encoding": {
          "y": {"type": "quantitative", "field": "foo"},
          "x": {"type": "ordinal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for horizontal bar', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        "encoding": {
          "x": {"type": "quantitative", "field": "foo"},
          "y": {"type": "ordinal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for vertical bar with raw temporal dimension', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        "encoding": {
          "y": {"type": "quantitative", "field": "foo"},
          "x": {"type": "temporal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for horizontal bar with raw temporal dimension', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "bar",
        "encoding": {
          "x": {"type": "quantitative", "field": "foo"},
          "y": {"type": "temporal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for vertical tick', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "tick",
        "encoding": {
          "x": {"type": "quantitative", "field": "foo"},
          "y": {"type": "ordinal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for vertical tick with bin', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "tick",
        "encoding": {
          "x": {"type": "quantitative", "field": "foo"},
          "y": {"type": "quantitative", "field": "bar", "bin": true}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for vertical tick of continuous timeUnit dotplot', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "tick",
        "encoding": {
          "x": {"type": "temporal", "field": "foo", "timeUnit": "yearmonthdate"},
          "y": {"type": "ordinal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for horizontal tick', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "tick",
        "encoding": {
          "y": {"type": "quantitative", "field": "foo"},
          "x": {"type": "ordinal", "field": "bar"}
        },
      });
      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for vertical rule', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "x": {"value": 0},
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for horizontal rule', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "y": {"value": 0},
        },
      });
      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for horizontal rules without x2 ', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "x": {"field": "b", "type": "quantitative"},
          "y": {"field": "a", "type": "ordinal"},
        },
      });

      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for vertical rules without y2 ', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "y": {"field": "b", "type": "quantitative"},
          "x": {"field": "a", "type": "ordinal"},
        },
      });

      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for vertical rule with range', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "x": {"type": "ordinal", "field": "foo"},
          "y": {"type": "quantitative", "field": "bar"},
          "y2": {"type": "quantitative", "field": "baz"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });

    it('should return correct orient for horizontal rule with range', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "y": {"type": "ordinal", "field": "foo"},
          "x": {"type": "quantitative", "field": "bar"},
          "x2": {"type": "quantitative", "field": "baz"}
        },
      });
      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for horizontal rule with range and no ordinal', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "x": {"type": "quantitative", "field": "bar"},
          "x2": {"type": "quantitative", "field": "baz"}
        },
      });
      assert.equal(model.markDef.orient, 'horizontal');
    });

    it('should return correct orient for vertical rule with range and no ordinal', function() {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "rule",
        "encoding": {
          "y": {"type": "quantitative", "field": "bar"},
          "y2": {"type": "quantitative", "field": "baz"}
        },
      });
      assert.equal(model.markDef.orient, 'vertical');
    });
  });
});


