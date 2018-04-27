/* tslint:disable:quotemark */

import {assert} from 'chai';

import {FilterInvalidNode} from '../../../src/compile/data/filterinvalid';
import {UnitModel} from '../../../src/compile/unit';
import {FieldDef} from '../../../src/fielddef';
import {NormalizedUnitSpec, TopLevel} from '../../../src/spec';
import {Dict, mergeDeep} from '../../../src/util';
import {parseUnitModelWithScale} from '../../util';

function parse(model: UnitModel) {
  return FilterInvalidNode.make(null, model);
}

describe('compile/data/nullfilter', function() {
  describe('compileUnit', function() {
    const spec: NormalizedUnitSpec = {
      mark: "point",
      encoding: {
        y: {field: 'qq', type: "quantitative"},
        x: {field: 'tt', type: "temporal"},
        color: {field: 'oo', type: "ordinal"},
        shape: {field: 'nn', type: "nominal"}
      }
    };

    it('should add filterNull for Q and T by default', function () {
      const model = parseUnitModelWithScale(spec);
      assert.deepEqual<Dict<FieldDef<string>>>(parse(model).filter, {
        qq: {field: 'qq', type: "quantitative"},
        tt: {field: 'tt', type: "temporal"}
      });
    });

    it('should add filterNull for Q and T when invalidValues is "filter".', function () {
      const model = parseUnitModelWithScale(mergeDeep<TopLevel<NormalizedUnitSpec>>(spec, {
        config: {
          invalidValues: 'filter'
        }
      }));
      assert.deepEqual<Dict<FieldDef<string>>>(parse(model).filter, {
        qq: {field: 'qq', type: "quantitative"},
        tt: {field: 'tt', type: "temporal"}
      });
    });

    it('should add no null filter if when invalidValues is null', function () {
      const model = parseUnitModelWithScale(mergeDeep<TopLevel<NormalizedUnitSpec>>(spec, {
        config: {
          invalidValues: null
        }
      }));
      assert.deepEqual(parse(model), null);
    });

    it ('should add no null filter for count field', () => {
      const model = parseUnitModelWithScale({
        mark: "point",
        encoding: {
          y: {aggregate: 'count', type: "quantitative"}
        }
      });

      assert.deepEqual(parse(model), null);
    });
  });

  describe('assemble', function() {
    // TODO: write
  });
});
