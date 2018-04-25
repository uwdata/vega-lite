/* tslint:disable:quotemark */
import {assert} from 'chai';

import {CalculateNode} from '../../../src/compile/data/calculate';
import {ModelWithField} from '../../../src/compile/model';
import {parseUnitModel} from '../../util';


function assembleFromSortArray(model: ModelWithField) {
  const node = CalculateNode.parseAllForSortIndex(null, model) as CalculateNode;
  return node.assemble();
}

describe('compile/data/calculate', () => {
  it('makeAllForSortIndex', () => {
    const model = parseUnitModel({
      data: {
        values: [
          {a: 'A',b: 28}, {a: 'B',b: 55}, {a: 'C',b: 43}
        ]
      },
      mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'ordinal', sort: ['B', 'A', 'C']},
          y: {field: 'b', type: 'quantitative'}
        }
    });
    const nodes = assembleFromSortArray(model);
    assert.deepEqual(nodes, {
      type: 'formula',
      expr: "datum.a === 'B' ? 0 : datum.a === 'A' ? 1 : datum.a === 'C' ? 2 : 3",
      as: 'x_a_sort_index'
    });
  });

  it('calculateExpressionFromSortField', () => {
    const expression = CalculateNode.calculateExpressionFromSortField('a', ["B", "A", "C"]);
    assert.equal(expression, "datum.a === 'B' ? 0 : datum.a === 'A' ? 1 : datum.a === 'C' ? 2 : 3");
  });
});
