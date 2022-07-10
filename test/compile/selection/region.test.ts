import {assembleUnitSelectionSignals} from '../../../src/compile/selection/assemble';
import region from '../../../src/compile/selection/region';
import {parseUnitSelection} from '../../../src/compile/selection/parse';
import {parseUnitModelWithScale} from '../../util';
import {parseSelector} from 'vega';

describe('Multi Selection', () => {
  const model = parseUnitModelWithScale({
    mark: 'circle',
    encoding: {
      x: {field: 'Horsepower', type: 'quantitative'},
      y: {field: 'Miles_per_Gallon', type: 'quantitative', bin: true},
      color: {field: 'Origin', type: 'nominal'}
    }
  });

  const selCmpts2 = (model.component.selection = parseUnitSelection(model, [
    {
      name: 'one',
      select: 'region'
    },
    {
      name: 'two',
      select: {
        type: 'region',
        mark: {
          fill: 'red',
          fillOpacity: 0.75,
          stroke: 'black',
          strokeWidth: 4,
          strokeDash: [10, 5]
        }
      }
    }
  ]));

  it('builds tuple signals', () => {
    const oneSg = region.signals(model, selCmpts2['one'], []);

    expect(oneSg).toEqual(
      expect.arrayContaining([
        {
          name: 'one_tuple',
          on: [
            {
              events: [{signal: 'one_screen_path'}],
              update: 'vlSelectionTuples(intersectLasso("marks", one_screen_path, unit), {unit: ""})'
            }
          ]
        },
        {
          name: 'one_screen_path',
          init: '[]',
          on: [
            {
              events: parseSelector('mousedown', 'scope')[0],
              update: '[[x(unit), y(unit)]]'
            },
            {
              events: parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope')[0],
              update: 'lassoAppend(one_screen_path, clamp(x(unit), 0, width), clamp(y(unit), 0, height))'
            }
          ]
        }
      ])
    );
  });

  it('builds modify signals', () => {
    const signals = assembleUnitSelectionSignals(model, []);

    expect(signals).toEqual(
      expect.arrayContaining([
        {
          name: 'one_modify',
          on: [
            {
              events: {signal: 'one_tuple'},
              update: `modify("one_store", one_tuple, true)`
            }
          ]
        }
      ])
    );
  });

  it('builds brush mark', () => {
    const marks: any[] = [];

    expect(region.marks(model, selCmpts2['two'], marks)).toEqual([
      {
        name: 'two_brush',
        type: 'path',
        encode: {
          enter: {
            fill: {value: 'red'},
            fillOpacity: {value: 0.75},
            stroke: {value: 'black'},
            strokeWidth: {value: 4},
            strokeDash: {value: [10, 5]}
          },
          update: {path: {signal: 'lassoPath(two_screen_path)'}}
        }
      }
    ]);
  });
});
