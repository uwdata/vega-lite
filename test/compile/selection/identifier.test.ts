import {Transforms as VgTransform} from 'vega';
import {assembleRootData} from '../../../src/compile/data/assemble';
import {IdentifierNode} from '../../../src/compile/data/identifier';
import {optimizeDataflow} from '../../../src/compile/data/optimize';
import {Mark} from '../../../src/mark';
import {SELECTION_ID} from '../../../src/selection';
import {parseConcatModel, parseUnitModelWithScaleAndSelection} from '../../util';

function getVgData(selection: any, x?: any, y?: any, mark?: Mark, enc?: any, transform?: any) {
  const model = parseUnitModelWithScaleAndSelection({
    data: {url: 'data/cars.json'},
    transform,
    selection,
    mark: mark || 'circle',
    encoding: {
      x: {field: 'Horsepower', type: 'quantitative', ...x},
      y: {field: 'Miles-per-Gallon', type: 'quantitative', ...y},
      color: {field: 'Origin', type: 'nominal'},
      ...enc
    }
  });
  model.parseData();
  optimizeDataflow(model.component.data, model);
  return assembleRootData(model.component.data, {});
}

describe('compile/data/identifier', () => {
  describe('Identifier transform', () => {
    it('is not unnecessarily added', () => {
      function run(selDef?: any) {
        const data = getVgData(selDef);
        for (const d of data) {
          expect(d.transform && d.transform.some(t => t.type === 'identifier')).not.toBe(true);
        }
      }

      run();
      for (const type of ['single', 'multi']) {
        run([{name: 'pt', select: {type, encodings: ['x']}}]);
      }
    });

    it('is added for default point selections', () => {
      for (const select of ['single', 'multi']) {
        const url = getVgData([{name: 'pt', select}]);
        expect(url[0].transform[0].type).toBe('identifier');
      }
    });

    it('is added immediately after aggregate transforms', () => {
      function run(transform: VgTransform[]) {
        let aggr = -1;
        transform.some((t, i) => ((aggr = i), t.type === 'aggregate'));
        expect(aggr).toBeGreaterThanOrEqual(0);
        expect(transform[aggr + 1].type).toBe('identifier');
      }

      for (const select of ['single', 'multi']) {
        const sel = [{name: 'pt', select}];
        let data = getVgData(sel, {bin: true}, {aggregate: 'count'});
        run(data[0].transform);

        data = getVgData(sel, {aggregate: 'sum'}, null, 'bar', {column: {field: 'Cylinders', type: 'ordinal'}});
        run(data[0].transform);
      }
    });

    it('is added before any user-specified transforms', () => {
      for (const select of ['single', 'multi']) {
        const data = getVgData([{name: 'pt', select}], null, null, null, null, [
          {calculate: 'datum.Horsepower * 2', as: 'foo'}
        ]);
        let calc = -1;
        data[0].transform.some((t, i) => ((calc = i), t.type === 'formula' && t.as === 'foo'));
        expect(data[0].transform[calc - 1].type).toBe('identifier');
      }
    });

    it('is added to the source dataset in multi-views', () => {
      const vgData = (bin: boolean) => {
        const model = parseConcatModel({
          data: {url: 'data/cars.json'},
          hconcat: [
            {
              selection: [
                {
                  name: 'pt',
                  select: 'single'
                }
              ],
              mark: 'circle',
              encoding: {
                x: {field: 'Horsepower', type: 'quantitative'},
                y: {field: 'Miles-per-Gallon', type: 'quantitative'},
                color: {field: 'Year', type: 'temporal'}
              }
            },
            {
              mark: 'circle',
              encoding: {
                x: {field: 'Horsepower', type: 'quantitative', bin},
                y: {field: 'Miles-per-Gallon', type: 'quantitative'},
                color: {field: 'Origin', type: 'nominal'}
              }
            }
          ]
        });
        model.parseScale();
        model.parseSelections();
        model.parseData();
        optimizeDataflow(model.component.data, model);
        return assembleRootData(model.component.data, {});
      };

      expect(vgData(false)[0].transform[0].type).toBe('identifier');
      expect(vgData(true)[0].transform[0].type).toBe('identifier');
    });
  });

  describe('IdentifierNode', () => {
    describe('dependentFields', () => {
      it('should return empty set', () => {
        const flatten = new IdentifierNode(null);
        expect(flatten.dependentFields()).toEqual(new Set());
      });
    });

    describe('producedFields', () => {
      it('should return proper produced fields', () => {
        const flatten = new IdentifierNode(null);
        expect(flatten.producedFields()).toEqual(new Set([SELECTION_ID]));
      });
    });
  });
});
