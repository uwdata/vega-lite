import {assert} from 'chai';
import * as log from '../../src/log';
import {VgLayout} from '../../src/vega.schema';
import {parseConcatModel} from '../util';

describe('Concat', () => {
  describe('merge scale domains', () => {
    it('should instantiate all children in vconcat', () => {
      const model = parseConcatModel({
        vconcat: [{
          mark: 'point',
          encoding: {
            x: {field: 'a', type: 'ordinal'}
          }
        },{
          mark: 'bar',
          encoding: {
            x: {field: 'b', type: 'ordinal'},
            y: {field: 'c', type: 'quantitative'}
          }
        }]
      });

      assert.equal(model.children.length, 2);
      assert(model.isVConcat);
    });

    it('should instantiate all children in hconcat', () => {
      const model = parseConcatModel({
        hconcat: [{
          mark: 'point',
          encoding: {
            x: {field: 'a', type: 'ordinal'}
          }
        },{
          mark: 'bar',
          encoding: {
            x: {field: 'b', type: 'ordinal'},
            y: {field: 'c', type: 'quantitative'}
          }
        }]
      });

      assert.equal(model.children.length, 2);
      assert(!model.isVConcat);
    });

    it('should create correct layout for vconcat', () => {
      const model = parseConcatModel({
        vconcat: [{
          mark: 'point',
          encoding: {
          }
        },{
          mark: 'bar',
          encoding: {
          }
        }]
      });

      assert.deepEqual<VgLayout>(model.assembleLayout(), {
        padding: {row: 10, column: 10},
        offset: 10,
        columns: 1,
        bounds: 'full',
        align: 'each'
      });
    });

    it('should create correct layout for hconcat', () => {
      const model = parseConcatModel({
        hconcat: [{
          mark: 'point',
          encoding: {
          }
        },{
          mark: 'bar',
          encoding: {
          }
        }]
      });

      assert.deepEqual<VgLayout>(model.assembleLayout(), {
        padding: {row: 10, column: 10},
        offset: 10,
        bounds: 'full',
        align: 'each'
      });
    });
  });

  describe('resolve', () => {
    it('cannot share axes', () => {
      log.runLocalLogger((localLogger) => {
        parseConcatModel({
          hconcat: [],
          resolve: {
            axis: {
              x: 'shared'
            }
          }
        });
        assert.equal(localLogger.warns[0], log.message.CONCAT_CANNOT_SHARE_AXIS);
      });
    });
  });
});
