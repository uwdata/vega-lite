import {assert} from 'chai';
import {parseLayerModel} from '../util';

describe('Layer', function() {
  describe('parseScale', () => {
    it('should merge domains', () => {
      const model = parseLayerModel({
        layer: [{
          mark: 'point',
          encoding: {
            x: {field: 'a', type: 'ordinal'}
          }
        },{
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'ordinal'}
          }
        }]
      });
      assert.equal(model.children.length, 2);
      model.parseScale();

      assert.deepEqual(model.component.scales['x'].domains, [{
          data: 'layer_0_main',
          field: 'a',
          sort: true
        }, {
          data: 'layer_1_main',
          field: 'b',
          sort: true
        }]);
    });

    it('should union explicit and referenced domains', () => {
      const model = parseLayerModel({
        layer: [{
          mark: 'point',
          encoding: {
            x: {scale: {domain: [1, 2, 3]}, field: 'b', type: 'ordinal'}
          }
        }, {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'ordinal'}
          }
        }]
      });
      model.parseScale();

      assert.deepEqual(model.component.scales['x'].domains, [
        [1, 2, 3],
        {
          data: 'layer_1_main',
          field: 'b',
          sort: true
        }]);
    });
  });

  describe('assembleScales', () => {
    it('includes all scales from children, both shared and independent', () => {
      const model = parseLayerModel({
        layer: [{
          mark: 'point',
          encoding: {
            x: {field: 'a', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        },{
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }],
        resolve: {
          scale: {
            x: 'independent'
          }
        }
      });

      model.parseScale();
      const scales = model.assembleScales();
      assert.equal(scales.length, 3); // 2 x, 1 y
    });
  });

  describe('dual axis chart', () => {
    const model = parseLayerModel({
      layer: [{
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'quantitative'}
        }
      }, {
        mark: 'point',
        encoding: {
          x: {field: 'b', type: 'quantitative'}
        }
      }],
      resolve: {
        scale: {
          x: 'independent'
        }
      }
    });

    assert.equal(model.children.length, 2);

    it('should leave scales in children when set to be independent', () => {
      model.parseScale();

      assert.equal(model.component.scales['x'], undefined);
      assert.deepEqual(model.children[0].component.scales['x'].domains, [{
        data: 'layer_0_main',
        field: 'a'
      }]);
      assert.deepEqual(model.children[1].component.scales['x'].domains, [{
        data: 'layer_1_main',
        field: 'b'
      }]);
    });

    it('should create second axis on top', () => {
      model.parseAxisAndHeader();

      assert.equal(model.component.axes['x'].length, 2);
      assert.equal(model.component.axes['x'][1].main.implicit.orient, 'top');
    });
  });
});
