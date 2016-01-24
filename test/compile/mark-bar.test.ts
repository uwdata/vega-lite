/* tslint:disable quote */

import {assert} from 'chai';
import {parseModel} from '../util';
import {extend} from '../../src/util'
import {X, Y, SIZE, COLOR, SHAPE} from '../../src/channel';
import {bar} from '../../src/compile/mark-bar';

describe('Mark: Bar', function() {
  it('should return the correct mark type', function() {
    assert.equal(bar.markType(), 'rect');
  });

  describe('with size.value specified', function() {
    // TODO
  });

  describe('vertical, with log', function() {
    const model = parseModel({
      "mark": "bar",
      "encoding": {
        "x": {"bin": true, "type": "quantitative", "field": "IMDB_Rating"},
        "y": {"scale": {"type": 'log'}, "type": "quantitative", "field": 'US_Gross', "aggregate": "mean"}
      },
      "data": {"url": 'data/movies.json'}
    });
    const props = bar.properties(model);

    it('should end on axis', function() {
      assert.deepEqual(props.y2, { scale: 'y', value: 0});
    });

    it('should has no height', function(){
      assert.isUndefined(props.height);
    });
  });

  describe('horizontal, with log', function() {
    const model = parseModel({
      "mark": "bar",
      "encoding": {
        "y": {"bin": true, "type": "quantitative", "field": "IMDB_Rating"},
        "x": {"scale": {"type": 'log'}, "type": "quantitative", "field": 'US_Gross', "aggregate": "mean"}
      },
      "data": {"url": 'data/movies.json'}
    });

    const props = bar.properties(model);

    it('should end on axis', function() {
      assert.deepEqual(props.x2, {scale: 'x', value: 0});
    });

    it('should have no width', function(){
      assert.isUndefined(props.width);
    });
  });

  describe('vertical', function() {
    const model = parseModel({
      "mark": "bar",
      "encoding": {"y": {"type": "quantitative", "field": 'US_Gross', "aggregate": "sum"}},
      "data": {"url": 'data/movies.json'}
    });
    const props = bar.properties(model);

    it('should end on axis', function() {
      assert.deepEqual(props.y2, {scale: 'y', value: 0});
    });

    it('should have no height', function(){
      assert.isUndefined(props.height);
    });

    it('should have x-offset', function(){
      assert.deepEqual(props.x.offset, 2);
    });
  });

  describe('horizontal', function() {
    const model = parseModel({
      "mark": "bar",
      "encoding": {"x": {"type": "quantitative", "field": 'US_Gross', "aggregate": 'sum'}},
      "data": {"url": 'data/movies.json'}
    });
    const props = bar.properties(model);

    it('should end on axis', function() {
      assert.deepEqual(props.x2, {scale: 'x', value: 0});
    });

    it('should have no width', function(){
      assert.isUndefined(props.width);
    });

    it('should have y-offset', function(){
      assert.deepEqual(props.y2, {
        field: {group: 'height'},
        offset: -1
      });
    });
  });

  describe('horizontal, label', function() {
    const model = parseModel({
      "mark": "bar",
      "encoding": {
        "x": {"type": "quantitative", "field": "US_Gross"},
        "y": {"bin": true, "type": "quantitative", "field": "IMDB_Rating"},
        "label": {
          "field": "US_Gross",
          "type": "quantitative"
        }
      },
      "data": {"url": 'data/movies.json'}
    });

    const labels = bar.labels(model);

    it('should have horizontal x', function() {
      assert.deepEqual(labels.x, { field: 'x2', offset: 5 });
    });

    it('should have horizontal y', function() {
      assert.deepEqual(labels.y, { field: 'yc' });
    });

    it('should have baseline middle', function() {
      assert.deepEqual(labels.baseline, { value: 'middle' });
    });

    it('should be aligned left', function() {
      assert.deepEqual(labels.align, { value: 'left' });
    });
  });

  describe('vertical, label', function() {
    const model = parseModel({
      "mark": "bar",
      "encoding": {
        "x": {"bin": true, "type": "quantitative", "field": "IMDB_Rating"},
        "y": {"type": "quantitative", "field": "US_Gross"},
        "label": {
          "field": "US_Gross",
          "type": "quantitative"
        }
      },
      "data": {"url": 'data/movies.json'}
    });

    const labels = bar.labels(model);

    it('should have vertical x', function() {
      assert.deepEqual(labels.x, { field: 'xc' })
    });

    it('should have vertical y', function() {
      assert.deepEqual(labels.y, { field: 'datum.' + model.field(Y), offset: -5, scale: model.scaleName(Y) });
    });

    it('should have baseline bottom', function() {
      assert.deepEqual(labels.baseline, { value: 'bottom' });
    });

    it('should be aligned center', function() {
      assert.deepEqual(labels.align, { value: 'center' });
    });
  });
});
