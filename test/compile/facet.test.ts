/* tslint:disable quotemark */

import {assert} from 'chai';
import {Axis} from '../../src/axis';
import {ROW, SHAPE} from '../../src/channel';
import * as facet from '../../src/compile/facet';
import {FacetModel} from '../../src/compile/facet';
import {defaultConfig} from '../../src/config';
import {Facet} from '../../src/facet';
import {PositionFieldDef} from '../../src/fielddef';
import * as log from '../../src/log';
import {POINT} from '../../src/mark';
import {ORDINAL} from '../../src/type';
import {parseFacetModel} from '../util';

describe('FacetModel', function() {
  describe('initFacet', () => {
    it('should drop unsupported channel and throws warning', () => {
      log.runLocalLogger((localLogger) => {
        const model = parseFacetModel({
          facet: ({
            shape: {field: 'a', type: 'quantitative'}
          }) as Facet, // Cast to allow invalid facet type for test
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        assert.equal(model.facet['shape'], undefined);
        assert.equal(localLogger.warns[0], log.message.incompatibleChannel(SHAPE, 'facet'));
      });
    });

    it('should drop channel without field and value and throws warning', () => {
      log.runLocalLogger((localLogger) => {
        const model = parseFacetModel({
          facet: {
            row: {type: 'ordinal'}
          },
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        assert.equal(model.facet.row, undefined);
        assert.equal(localLogger.warns[0], log.message.emptyFieldDef({type: ORDINAL}, ROW));
      });
    });

    it('should drop channel without field and value and throws warning', () => {
      log.runLocalLogger((localLogger) => {
        const model = parseFacetModel({
          facet: {
            row: {field: 'a', type: 'quantitative'}
          },
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        assert.deepEqual<PositionFieldDef>(model.facet.row, {field: 'a', type: 'quantitative'});
        assert.equal(localLogger.warns[0], log.message.facetChannelShouldBeDiscrete(ROW));
      });
    });
  });

  describe('parseScale', () => {
    it('should correctly set scale component for a model', () => {
      const model = parseFacetModel({
        facet: {
          row: {field: 'a', type: 'quantitative'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        }
      });

      model.parseScale();

      assert(model.component.scales['x']);
    });
  });
});

describe('compile/facet', () => {
  describe('getSharedAxisGroup', () => {
    describe('column-only', () => {
      const model = parseFacetModel({
        facet: {
          column: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });

      // HACK: mock that we have parsed its data and there is no stack and no summary
      // This way, we won't have surge in test coverage for the parse methods.
      model.component.data = {} as any;
      model['hasSummary'] = () => false;

      describe('xAxisGroup', () => {
        const xSharedAxisGroup = facet.getSharedAxisGroup(model, 'x');
        it('should have correct type, name, and data source', () => {
          assert.equal(xSharedAxisGroup.name, 'x-axes');
          assert.equal(xSharedAxisGroup.type, 'group');
          assert.deepEqual(xSharedAxisGroup.from, {data: 'column'});
        });

      });

      describe('yAxisGroup', () => {
        const ySharedAxisGroup = facet.getSharedAxisGroup(model, 'y');
        it('should have correct type, name, and data source', () => {
          assert.equal(ySharedAxisGroup.name, 'y-axes');
          assert.equal(ySharedAxisGroup.type, 'group');
          assert.equal(ySharedAxisGroup.from, undefined);
        });
      });
    });

    describe('row-only', () => {
      const model = parseFacetModel({
        facet: {
          row: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });

      // HACK: mock that we have parsed its data and there is no stack and no summary
      // This way, we won't have surge in test coverage for the parse methods.
      model.component.data = {} as any;
      model['hasSummary'] = () => false;

      describe('yAxisGroup', () => {
        const ySharedAxisGroup = facet.getSharedAxisGroup(model, 'y');
        it('should have correct type, name, and data source', () => {
          assert.equal(ySharedAxisGroup.name, 'y-axes');
          assert.equal(ySharedAxisGroup.type, 'group');
          assert.deepEqual(ySharedAxisGroup.from, {data: 'row'});
        });
      });

      describe('xAxisGroup', () => {
        const xSharedAxisGroup = facet.getSharedAxisGroup(model, 'x');
        it('should have correct type, name, and data source', () => {
          assert.equal(xSharedAxisGroup.name, 'x-axes');
          assert.equal(xSharedAxisGroup.type, 'group');
          assert.equal(xSharedAxisGroup.from, undefined);
        });
      });
    });
  });
});
