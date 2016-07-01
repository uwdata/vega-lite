/* tslint:disable:quotemark */

import {assert} from 'chai';
import {parseUnitModel} from '../util';
import {X} from '../../src/channel';
import {format} from '../../src/timeunit';

describe('TimeUnit', function() {
  describe('format()', function() {
    it('should get the right time template when shortTimeLabels is specified true', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          x: {timeUnit: 'month', field:'a', type: "temporal", axis: {shortTimeLabels: true}}
        }
      });
      assert.equal(format(model.fieldDef(X).timeUnit, model.axis(X).shortTimeLabels), '{{datum.data | time:\'%b\'}}');
    });

    it('should get the right time template when shortTimeLabels is unspecified', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          x: {timeUnit: 'month', field:'a', type: "temporal"}
        }
      });
      assert.equal(format(model.fieldDef(X).timeUnit, model.axis(X).shortTimeLabels), '{{datum.data | time:\'%B\'}}');
    });

    it('should get the right time template when timeUnit is week and shortTimeLabels is true', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          x: {timeUnit: 'week', field:'a', type: "temporal", axis: {shortTimeLabels: true}}
        }
      });

      assert.equal(format(model.fieldDef(X).timeUnit, model.axis(X).shortTimeLabels), undefined);
    });
  });
});
