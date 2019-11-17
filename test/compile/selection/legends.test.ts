import {parseUnitModel} from '../../util';
import {parseUnitSelection} from '../../../src/compile/selection/parse';
import {assembleTopLevelSignals, assembleUnitSelectionSignals} from '../../../src/compile/selection/assemble';
import legends from '../../../src/compile/selection/transforms/legends';
import * as log from '../../../src/log';

describe('Interactive Legends', () => {
  const model = parseUnitModel({
    mark: 'circle',
    encoding: {
      x: {field: 'Horsepower', type: 'quantitative'},
      y: {field: 'Miles_per_Gallon', type: 'quantitative'},
      color: {field: 'Origin', type: 'nominal'},
      size: {field: 'Cylinders', type: 'ordinal'}
    }
  });

  model.parseScale();
  const selCmpts = (model.component.selection = parseUnitSelection(model, {
    one: {type: 'single', fields: ['Origin'], bind: 'legend'},
    two: {type: 'multi', fields: ['Origin'], bind: {legend: 'dblclick, mouseover'}},
    three: {type: 'multi', fields: ['Origin', 'Cylinders'], bind: 'legend'},
    four: {type: 'single', encodings: ['color'], bind: 'legend'},
    five: {type: 'single', encodings: ['color', 'size'], bind: 'legend'},
    six: {type: 'multi', bind: 'legend'},
    seven: {type: 'multi', fields: ['Origin'], bind: {legend: 'mouseover'}, on: 'click'},
    eight: {type: 'multi', encodings: ['color'], bind: {legend: 'mouseover'}, on: 'click', clear: 'dblclick'},
    nine: {
      type: 'single',
      bind: {input: 'range', min: 0, max: 10, step: 1}
    },
    ten: {
      type: 'multi',
      fields: ['Origin'],
      bind: 'legend',
      init: [{Origin: 'USA'}, {Origin: 'Japan'}]
    }
  }));
  model.parseLegends();

  it('identifies transform invocation', () => {
    log.wrap(localLogger => {
      expect(legends.has(selCmpts['one'])).toBeTruthy();
      expect(legends.has(selCmpts['two'])).toBeTruthy();

      expect(legends.has(selCmpts['three'])).toBeFalsy();
      expect(localLogger.warns[0]).toEqual(log.message.LEGEND_BINDINGS_PROJECT_LENGTH);

      expect(legends.has(selCmpts['four'])).toBeTruthy();

      expect(legends.has(selCmpts['five'])).toBeFalsy();
      expect(localLogger.warns[1]).toEqual(log.message.LEGEND_BINDINGS_PROJECT_LENGTH);

      expect(legends.has(selCmpts['six'])).toBeFalsy();
      expect(localLogger.warns[2]).toEqual(log.message.LEGEND_BINDINGS_PROJECT_LENGTH);

      expect(legends.has(selCmpts['seven'])).toBeTruthy();
      expect(legends.has(selCmpts['eight'])).toBeTruthy();
      expect(legends.has(selCmpts['nine'])).toBeFalsy();
      expect(legends.has(selCmpts['ten'])).toBeTruthy();
    });
  });

  it('adds legend binding top-level signal', () => {
    expect(assembleTopLevelSignals(model, [])).toEqual(
      expect.arrayContaining([
        {
          name: 'one_Origin_legend',
          value: null,
          on: [
            {
              events: [
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_entries'
                }
              ],
              update: 'datum.value || item().items[0].items[0].datum.value',
              force: true
            },
            {
              events: [{source: 'view', type: 'click'}],
              update: '!event.item || !datum ? null : one_Origin_legend',
              force: true
            }
          ]
        },
        {
          name: 'two_Origin_legend',
          value: null,
          on: [
            {
              events: [
                {
                  source: 'view',
                  type: 'dblclick',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'dblclick',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'dblclick',
                  markname: 'Origin_legend_entries'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_entries'
                }
              ],
              update: 'datum.value || item().items[0].items[0].datum.value',
              force: true
            },
            {
              events: [
                {
                  source: 'view',
                  type: 'dblclick'
                },
                {
                  source: 'view',
                  type: 'mouseover'
                }
              ],
              update: '!event.item || !datum ? null : two_Origin_legend',
              force: true
            }
          ]
        },
        {
          name: 'four_Origin_legend',
          value: null,
          on: [
            {
              events: [
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_entries'
                }
              ],
              update: 'datum.value || item().items[0].items[0].datum.value',
              force: true
            },
            {
              events: [
                {
                  source: 'view',
                  type: 'click'
                }
              ],
              update: '!event.item || !datum ? null : four_Origin_legend',
              force: true
            }
          ]
        },
        {
          name: 'seven_Origin_legend',
          value: null,
          on: [
            {
              events: [
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_entries'
                }
              ],
              update: 'datum.value || item().items[0].items[0].datum.value',
              force: true
            },
            {
              events: [
                {
                  source: 'view',
                  type: 'mouseover'
                }
              ],
              update: '!event.item || !datum ? null : seven_Origin_legend',
              force: true
            }
          ]
        },
        {
          name: 'eight_Origin_legend',
          value: null,
          on: [
            {
              events: [
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'mouseover',
                  markname: 'Origin_legend_entries'
                }
              ],
              update: 'datum.value || item().items[0].items[0].datum.value',
              force: true
            },
            {
              events: [
                {
                  source: 'view',
                  type: 'mouseover'
                }
              ],
              update: '!event.item || !datum ? null : eight_Origin_legend',
              force: true
            }
          ]
        }
      ])
    );
  });

  it('updates tuple signal to use bound top-level signal', () => {
    expect(assembleUnitSelectionSignals(model, [])).toEqual(
      expect.arrayContaining([
        {
          name: 'one_tuple',
          update: 'one_Origin_legend !== null ? {fields: one_tuple_fields, values: [one_Origin_legend]} : null'
        },
        {
          name: 'two_tuple',
          update: 'two_Origin_legend !== null ? {fields: two_tuple_fields, values: [two_Origin_legend]} : null'
        },
        {
          name: 'four_tuple',
          update: 'four_Origin_legend !== null ? {fields: four_tuple_fields, values: [four_Origin_legend]} : null'
        }
      ])
    );
  });

  it('preserves explicit event triggers', () => {
    expect(assembleUnitSelectionSignals(model, [])).toEqual(
      expect.arrayContaining([
        {
          name: 'seven_tuple',
          on: [
            {
              events: [
                {
                  source: 'scope',
                  type: 'click',
                  filter: ['event.item && indexof(event.item.mark.role, "legend") < 0']
                }
              ],
              update:
                'datum && item().mark.marktype !== \'group\' ? {unit: "", fields: seven_tuple_fields, values: [(item().isVoronoi ? datum.datum : datum)["Origin"]]} : null',
              force: true
            },
            {
              events: [
                {
                  signal: 'seven_Origin_legend'
                }
              ],
              update:
                'seven_Origin_legend !== null ? {fields: seven_tuple_fields, values: [seven_Origin_legend]} : null'
            }
          ]
        },
        {
          name: 'eight_tuple',
          on: [
            {
              events: [
                {
                  source: 'scope',
                  type: 'click',
                  filter: ['event.item && indexof(event.item.mark.role, "legend") < 0']
                }
              ],
              update:
                'datum && item().mark.marktype !== \'group\' ? {unit: "", fields: eight_tuple_fields, values: [(item().isVoronoi ? datum.datum : datum)["Origin"]]} : null',
              force: true
            },
            {
              events: [
                {
                  signal: 'eight_Origin_legend'
                }
              ],
              update:
                'eight_Origin_legend !== null ? {fields: eight_tuple_fields, values: [eight_Origin_legend]} : null'
            },
            {
              events: [
                {
                  source: 'scope',
                  type: 'dblclick'
                }
              ],
              update: 'null'
            }
          ]
        }
      ])
    );
  });

  it('respects initialization', () => {
    expect(assembleTopLevelSignals(model, [])).toEqual(
      expect.arrayContaining([
        {
          name: 'ten_Origin_legend',
          on: [
            {
              events: [
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_symbols'
                },
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_labels'
                },
                {
                  source: 'view',
                  type: 'click',
                  markname: 'Origin_legend_entries'
                }
              ],
              update: 'datum.value || item().items[0].items[0].datum.value',
              force: true
            },
            {
              events: [{source: 'view', type: 'click'}],
              update: '!event.item || !datum ? null : ten_Origin_legend',
              force: true
            }
          ]
        }
      ])
    );
  });
});
