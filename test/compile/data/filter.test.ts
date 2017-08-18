import {assert} from 'chai';
import {ParseNode} from '../../../src/compile/data/formatparse';
import {LookupNode} from '../../../src/compile/data/lookup';
import {parseTransformArray} from '../../../src/compile/data/parse';
import * as log from '../../../src/log';
import {Dict} from '../../../src/util';
import {VgLookupTransform} from '../../../src/vega.schema';
import {parseUnitModel} from '../../util';

describe('compile/data/filter', () => {
  it('should create parse for filtered fields', () => {
    const model = parseUnitModel({
      'data': {'url': 'a.json'},
      'transform': [
        {'filter': {'field': 'a', 'equal': {year: 2000}}},
        {'filter': {'field': 'b', 'oneOf': ['a', 'b']}},
        {'filter': {'field': 'c', 'range': [{year: 2000}, {year: 2001}]}},
        {'filter': {'field': 'd', 'range': [1, 2]}}
      ],
      'mark': 'point',
      encoding: {}
    });

    let parse: Dict<string> = {};

    // extract the parse from the parse nodes that were generated along with the filter nodes
    let {first: node} = parseTransformArray(model);
    while (node.numChildren() > 0) {
      if (node instanceof ParseNode) {
        parse = {...parse, ...node.parse};
      }
      assert.equal(node.numChildren(), 1);
      node = node.children[0];
    }

    assert.deepEqual(parse, {
      a: 'date',
      b: 'string',
      c: 'date',
      d: 'number'
    });
  });
});
