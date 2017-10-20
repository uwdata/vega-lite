/* tslint:disable quotemark */

import {assert} from 'chai';
import {parseUnitModelWithScaleAndLayoutSize} from '../../util';

import * as log from '../../../src/log';

import {COLOR, SIZE, X, Y} from '../../../src/channel';
import {line} from '../../../src/compile/mark/line';
import {LINE} from '../../../src/mark';

describe('Mark: Line', function() {

  describe('with x, y', function() {
    const model = parseUnitModelWithScaleAndLayoutSize({
      "data": {"url": "data/barley.json"},
      "mark": "line",
      "encoding": {
        "x": {"field": "year", "type": "ordinal"},
        "y": {"field": "yield", "type": "quantitative"}
      }
    });
    const props = line.encodeEntry(model);

    it('should have scale for x', function() {
      assert.deepEqual(props.x, {scale: X, field: 'year'});
    });

    it('should have scale for y', function(){
      assert.deepEqual(props.y, {scale: Y, field: 'yield'});
    });
  });

  describe('with x, y, color', function () {
    const model = parseUnitModelWithScaleAndLayoutSize({
      "data": {"url": "data/barley.json"},
      "mark": "line",
      "encoding": {
        "x": {"field": "year", "type": "ordinal"},
        "y": {"field": "yield", "type": "quantitative"},
        "color": {"field": "Acceleration", "type": "quantitative"}
      }
    });
    const props = line.encodeEntry(model);

    it('should have scale for color', function () {
      assert.deepEqual(props.stroke, {scale: COLOR, field: 'Acceleration'});
    });
  });


  describe('with x, y, size', function () {
    it('should have scale for size', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        "data": {"url": "data/barley.json"},
        "mark": "line",
        "encoding": {
          "x": {"field": "year", "type": "ordinal"},
          "y": {"field": "yield", "type": "quantitative", "aggregate": "mean"},
          "size": {"field": "variety", "type": "nominal"}
        }
      });
      const props = line.encodeEntry(model);

      assert.deepEqual(props.strokeWidth, {scale: 'size', field: 'variety'});
    });

    it('should drop aggregate size field', log.wrap((localLogger) => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        "data": {"url": "data/barley.json"},
        "mark": "line",
        "encoding": {
          "x": {"field": "year", "type": "ordinal"},
          "y": {"field": "yield", "type": "quantitative", "aggregate": "mean"},
          "size": {"field": "Acceleration", "type": "quantitative", "aggregate": "mean"}
        }
      });
      const props = line.encodeEntry(model);

      // If size field is dropped, then strokeWidth only have value
      assert.isNotOk(props.strokeWidth && props.strokeWidth['scale']);
      assert.equal(localLogger.warns[0], log.message.incompatibleChannel(SIZE, LINE, 'when the field is aggregated.'));
    }));
  });

  describe('with stacked y', function() {
    const model = parseUnitModelWithScaleAndLayoutSize({
      "data": {"url": "data/barley.json"},
      "mark": "line",
      "encoding": {
        "x": {"field": "year", "type": "ordinal"},
        "y": {"field": "yield", "type": "quantitative", "aggregate": "sum"},
        "color": {"field": "a", "type": "nominal"}
      },
      "config": {"stack":  "zero"}
    });
    const props = line.encodeEntry(model);

    it('should use y_end', function() {
      assert.deepEqual(props.y, {scale: Y, field: 'sum_yield_end'});
    });
  });

  describe('with stacked x', function() {
    const model = parseUnitModelWithScaleAndLayoutSize({
      "data": {"url": "data/barley.json"},
      "mark": "line",
      "encoding": {
        "y": {"field": "year", "type": "ordinal"},
        "x": {"field": "yield", "type": "quantitative", "aggregate": "sum"},
        "color": {"field": "a", "type": "nominal"}
      },
      "config": {"stack":  "zero"}
    });
    const props = line.encodeEntry(model);

    it('should use x_end', function() {
      assert.deepEqual(props.x, {scale: X, field: 'sum_yield_end'});
    });
  });

  describe('with x', function() {
    const model = parseUnitModelWithScaleAndLayoutSize({
      "mark": "line",
      "encoding": {"x": {"field": "year", "type": "ordinal"}},
      "data": {"url": "data/barley.json"}
    });

    const props = line.encodeEntry(model);

    it('should be centered on y', function() {
      assert.deepEqual(props.y, {
        mult: 0.5,
        signal: 'height'
      });
    });

    it('should scale on x', function() {
      assert.deepEqual(props.x, {scale: X, field: 'year'});
    });
  });

  describe('with y', function() {
    const model = parseUnitModelWithScaleAndLayoutSize({
      "mark": "line",
      "encoding": {"y": {"field": "year", "type": "ordinal"}},
      "data": {"url": "data/barley.json"}
    });

    const props = line.encodeEntry(model);

    it('should be centered on x', function() {
      assert.deepEqual(props.x, {
        mult: 0.5,
        signal: 'width'
      });
    });

    it('should scale on y', function() {
      assert.deepEqual(props.y, {scale: Y, field: 'year'});
    });
  });
});
