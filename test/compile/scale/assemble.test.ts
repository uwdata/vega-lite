import {assembleScaleRange, assembleScales} from '../../../src/compile/scale/assemble';
import {SignalRefComponent} from '../../../src/compile/signal';
import {
  parseConcatModel,
  parseFacetModelWithScale,
  parseLayerModel,
  parseRepeatModel,
  parseUnitModel,
  parseUnitModelWithScale
} from '../../util';

describe('compile/scale/assemble', () => {
  describe('assembleScales', () => {
    it('includes all scales for concat', () => {
      const model = parseConcatModel({
        vconcat: [
          {
            mark: 'point',
            encoding: {
              x: {field: 'a', type: 'ordinal'}
            }
          },
          {
            mark: 'bar',
            encoding: {
              x: {field: 'b', type: 'ordinal'},
              y: {field: 'c', type: 'quantitative'}
            }
          }
        ]
      });

      model.parseScale();
      const scales = assembleScales(model);
      expect(scales).toHaveLength(3);
    });

    it('includes all scales from children for layer, both shared and independent', () => {
      const model = parseLayerModel({
        layer: [
          {
            mark: 'point',
            encoding: {
              x: {field: 'a', type: 'quantitative'},
              y: {field: 'c', type: 'quantitative'}
            }
          },
          {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'},
              y: {field: 'c', type: 'quantitative'}
            }
          }
        ],
        resolve: {
          scale: {
            x: 'independent'
          }
        }
      });

      model.parseScale();
      const scales = assembleScales(model);
      expect(scales).toHaveLength(3); // 2 x, 1 y
    });

    it('includes all scales for repeat', () => {
      const model = parseRepeatModel({
        repeat: {
          row: ['Acceleration', 'Horsepower']
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: {repeat: 'row'}, type: 'quantitative'}
          }
        }
      });

      model.parseScale();
      const scales = assembleScales(model);
      expect(scales).toHaveLength(2);
    });

    it('includes shared scales, but not independent scales (as they are nested) for facet.', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'quantitative', format: 'd'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        },
        resolve: {
          scale: {x: 'independent'}
        }
      });

      const scales = assembleScales(model);
      expect(scales).toHaveLength(1);
      expect(scales[0].name).toEqual('y');
    });
  });

  describe('assembleScaleRange', () => {
    it('replaces a range step constant with a signal', () => {
      const model = parseUnitModel({
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'}
        }
      });

      expect(assembleScaleRange({step: 21}, 'x', model, 'x')).toEqual({step: {signal: 'x_step'}});
    });

    it('updates width signal when renamed.', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'quantitative'}
        }
      });

      // mock renaming
      model.renameSignal('width', 'new_width');

      expect(assembleScaleRange([0, SignalRefComponent.fromName('width')], 'x', model, 'x')).toEqual([
        0,
        {signal: 'new_width'}
      ]);
    });

    it('updates height signal when renamed.', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {field: 'y', type: 'quantitative'}
        }
      });

      // mock renaming
      model.renameSignal('height', 'new_height');

      expect(assembleScaleRange([0, SignalRefComponent.fromName('height')], 'x', model, 'x')).toEqual([
        0,
        {signal: 'new_height'}
      ]);
    });
  });
});
