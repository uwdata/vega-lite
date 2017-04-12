/* tslint:disable:quotemark */

import {assert} from 'chai';
import {TimeUnitNode} from '../../../src/compile/data/timeunit';
import {Model} from '../../../src/compile/model';
import {parseUnitModel} from '../../util';

function assemble(model: Model) {
  return new TimeUnitNode(model).assemble();
}

describe('compile/data/timeunit', () => {
  describe('parseUnit', () => {

    it('should return a dictionary of formula transform', () => {

      const model = parseUnitModel({
        "data": {"values": []},
        "mark": "point",
        "encoding": {
          "x": {field: 'a', type: 'temporal', timeUnit: 'month'}
        }
      });

      assert.deepEqual(assemble(model), [{
        type: 'formula',
        as: 'month_a',
        expr: 'datetime(0, month(datum["a"]), 1, 0, 0, 0, 0)'
      }]);
    });
  });
});
