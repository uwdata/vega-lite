/* tslint:disable quotemark */

import {selector as parseSelector} from 'vega-event-selector';

import interval from '../../../src/compile/selection/interval';
import * as selection from '../../../src/compile/selection/selection';
import {parseUnitModel} from '../../util';

describe('Interval Selections', () => {
  const model = parseUnitModel({
    mark: 'circle',
    encoding: {
      x: {field: 'Horsepower', type: 'quantitative'},
      y: {field: 'Miles-per-Gallon', type: 'quantitative'},
      color: {field: 'Origin', type: 'nominal'}
    }
  });
  model.parseScale();

  const selCmpts = (model.component.selection = selection.parseUnitSelection(model, {
    one: {type: 'interval', encodings: ['x'], translate: false, zoom: false},
    two: {
      type: 'interval',
      encodings: ['y'],
      bind: 'scales',
      translate: false,
      zoom: false
    },
    'thr-ee': {
      type: 'interval',
      on: '[mousedown, mouseup] > mousemove, [keydown, keyup] > keypress',
      translate: false,
      zoom: false,
      resolve: 'intersect',
      mark: {
        fill: 'red',
        fillOpacity: 0.75,
        stroke: 'black',
        strokeWidth: 4,
        strokeDash: [10, 5],
        strokeDashOffset: 3,
        strokeOpacity: 0.25
      }
    },
    four: {
      type: 'interval',
      translate: false,
      zoom: false,
      encodings: ['x'],
      init: {x: [50, 70]}
    },
    five: {
      type: 'interval',
      translate: false,
      zoom: false,
      init: {x: [50, 60], y: [23, 54]}
    },
    six: {
      type: 'interval',
      translate: false,
      zoom: false,
      encodings: ['x'],
      init: {
        x: [{year: 2000, month: 10, day: 5}, {year: 2001, month: 1, day: 13}]
      }
    }
  }));

  describe('Tuple Signals', () => {
    it('builds projection signals', () => {
      const oneSg = interval.signals(model, selCmpts['one']);
      expect(oneSg).toEqual(
        expect.arrayContaining([
          {
            name: 'one_x',
            value: [],
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[x(unit), x(unit)]'
              },
              {
                events: parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope')[0],
                update: '[one_x[0], clamp(x(unit), 0, width)]'
              },
              {
                events: {signal: 'one_scale_trigger'},
                update: '[scale("x", one_Horsepower[0]), scale("x", one_Horsepower[1])]'
              }
            ]
          },
          {
            name: 'one_Horsepower',
            on: [
              {
                events: {signal: 'one_x'},
                update: 'one_x[0] === one_x[1] ? null : invert("x", one_x)'
              }
            ]
          },
          {
            name: 'one_scale_trigger',
            update:
              '(!isArray(one_Horsepower) || (+invert("x", one_x)[0] === +one_Horsepower[0] && +invert("x", one_x)[1] === +one_Horsepower[1])) ? one_scale_trigger : {}'
          }
        ])
      );

      const twoSg = interval.signals(model, selCmpts['two']);
      expect(twoSg).toContainEqual({
        name: 'two_Miles_per_Gallon',
        on: []
      });

      const threeSg = interval.signals(model, selCmpts['thr_ee']);
      expect(threeSg).toEqual(
        expect.arrayContaining([
          {
            name: 'thr_ee_x',
            value: [],
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[x(unit), x(unit)]'
              },
              {
                events: parseSelector('[mousedown, mouseup] > mousemove', 'scope')[0],
                update: '[thr_ee_x[0], clamp(x(unit), 0, width)]'
              },
              {
                events: parseSelector('keydown', 'scope')[0],
                update: '[x(unit), x(unit)]'
              },
              {
                events: parseSelector('[keydown, keyup] > keypress', 'scope')[0],
                update: '[thr_ee_x[0], clamp(x(unit), 0, width)]'
              },
              {
                events: {signal: 'thr_ee_scale_trigger'},
                update: '[scale("x", thr_ee_Horsepower[0]), scale("x", thr_ee_Horsepower[1])]'
              }
            ]
          },
          {
            name: 'thr_ee_Horsepower',
            on: [
              {
                events: {signal: 'thr_ee_x'},
                update: 'thr_ee_x[0] === thr_ee_x[1] ? null : invert("x", thr_ee_x)'
              }
            ]
          },
          {
            name: 'thr_ee_y',
            value: [],
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[y(unit), y(unit)]'
              },
              {
                events: parseSelector('[mousedown, mouseup] > mousemove', 'scope')[0],
                update: '[thr_ee_y[0], clamp(y(unit), 0, height)]'
              },
              {
                events: parseSelector('keydown', 'scope')[0],
                update: '[y(unit), y(unit)]'
              },
              {
                events: parseSelector('[keydown, keyup] > keypress', 'scope')[0],
                update: '[thr_ee_y[0], clamp(y(unit), 0, height)]'
              },
              {
                events: {signal: 'thr_ee_scale_trigger'},
                update: '[scale("y", thr_ee_Miles_per_Gallon[0]), scale("y", thr_ee_Miles_per_Gallon[1])]'
              }
            ]
          },
          {
            name: 'thr_ee_Miles_per_Gallon',
            on: [
              {
                events: {signal: 'thr_ee_y'},
                update: 'thr_ee_y[0] === thr_ee_y[1] ? null : invert("y", thr_ee_y)'
              }
            ]
          },
          {
            name: 'thr_ee_scale_trigger',
            update:
              '(!isArray(thr_ee_Horsepower) || (+invert("x", thr_ee_x)[0] === +thr_ee_Horsepower[0] && +invert("x", thr_ee_x)[1] === +thr_ee_Horsepower[1])) && (!isArray(thr_ee_Miles_per_Gallon) || (+invert("y", thr_ee_y)[0] === +thr_ee_Miles_per_Gallon[0] && +invert("y", thr_ee_y)[1] === +thr_ee_Miles_per_Gallon[1])) ? thr_ee_scale_trigger : {}'
          }
        ])
      );

      const fourSg = interval.signals(model, selCmpts['four']);
      expect(fourSg).toEqual(
        expect.arrayContaining([
          {
            name: 'four_x',
            init: '[scale("x", 50), scale("x", 70)]',
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[x(unit), x(unit)]'
              },
              {
                events: parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope')[0],
                update: '[four_x[0], clamp(x(unit), 0, width)]'
              },
              {
                events: {signal: 'four_scale_trigger'},
                update: '[scale("x", four_Horsepower[0]), scale("x", four_Horsepower[1])]'
              }
            ]
          },
          {
            name: 'four_Horsepower',
            init: '[50, 70]',
            on: [
              {
                events: {signal: 'four_x'},
                update: 'four_x[0] === four_x[1] ? null : invert("x", four_x)'
              }
            ]
          },
          {
            name: 'four_scale_trigger',
            update:
              '(!isArray(four_Horsepower) || (+invert("x", four_x)[0] === +four_Horsepower[0] && +invert("x", four_x)[1] === +four_Horsepower[1])) ? four_scale_trigger : {}'
          }
        ])
      );

      const fiveSg = interval.signals(model, selCmpts['five']);
      expect(fiveSg).toEqual(
        expect.arrayContaining([
          {
            name: 'five_x',
            init: '[scale("x", 50), scale("x", 60)]',
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[x(unit), x(unit)]'
              },
              {
                events: parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope')[0],
                update: '[five_x[0], clamp(x(unit), 0, width)]'
              },
              {
                events: {signal: 'five_scale_trigger'},
                update: '[scale("x", five_Horsepower[0]), scale("x", five_Horsepower[1])]'
              }
            ]
          },
          {
            name: 'five_Horsepower',
            init: '[50, 60]',
            on: [
              {
                events: {signal: 'five_x'},
                update: 'five_x[0] === five_x[1] ? null : invert("x", five_x)'
              }
            ]
          },
          {
            name: 'five_y',
            init: '[scale("y", 23), scale("y", 54)]',
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[y(unit), y(unit)]'
              },
              {
                events: parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope')[0],
                update: '[five_y[0], clamp(y(unit), 0, height)]'
              },
              {
                events: {signal: 'five_scale_trigger'},
                update: '[scale("y", five_Miles_per_Gallon[0]), scale("y", five_Miles_per_Gallon[1])]'
              }
            ]
          },
          {
            name: 'five_Miles_per_Gallon',
            init: '[23, 54]',
            on: [
              {
                events: {signal: 'five_y'},
                update: 'five_y[0] === five_y[1] ? null : invert("y", five_y)'
              }
            ]
          },
          {
            name: 'five_scale_trigger',
            update:
              '(!isArray(five_Horsepower) || (+invert("x", five_x)[0] === +five_Horsepower[0] && +invert("x", five_x)[1] === +five_Horsepower[1])) && (!isArray(five_Miles_per_Gallon) || (+invert("y", five_y)[0] === +five_Miles_per_Gallon[0] && +invert("y", five_y)[1] === +five_Miles_per_Gallon[1])) ? five_scale_trigger : {}'
          }
        ])
      );

      const sixSg = interval.signals(model, selCmpts['six']);
      expect(sixSg).toEqual(
        expect.arrayContaining([
          {
            name: 'six_x',
            init: '[scale("x", datetime(2000, 10, 5+1, 0, 0, 0, 0)), scale("x", datetime(2001, 1, 13+1, 0, 0, 0, 0))]',
            on: [
              {
                events: parseSelector('mousedown', 'scope')[0],
                update: '[x(unit), x(unit)]'
              },
              {
                events: parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope')[0],
                update: '[six_x[0], clamp(x(unit), 0, width)]'
              },
              {
                events: {signal: 'six_scale_trigger'},
                update: '[scale("x", six_Horsepower[0]), scale("x", six_Horsepower[1])]'
              }
            ]
          },
          {
            name: 'six_Horsepower',
            init: '[datetime(2000, 10, 5+1, 0, 0, 0, 0), datetime(2001, 1, 13+1, 0, 0, 0, 0)]',
            on: [
              {
                events: {signal: 'six_x'},
                update: 'six_x[0] === six_x[1] ? null : invert("x", six_x)'
              }
            ]
          },
          {
            name: 'six_scale_trigger',
            update:
              '(!isArray(six_Horsepower) || (+invert("x", six_x)[0] === +six_Horsepower[0] && +invert("x", six_x)[1] === +six_Horsepower[1])) ? six_scale_trigger : {}'
          }
        ])
      );
    });

    it('builds trigger signals', () => {
      const oneSg = interval.signals(model, selCmpts['one']);
      expect(oneSg).toContainEqual({
        name: 'one_tuple',
        on: [
          {
            events: [{signal: 'one_Horsepower'}],
            update: 'one_Horsepower ? {unit: "", fields: one_tuple_fields, values: [one_Horsepower]} : null'
          }
        ]
      });

      const twoSg = interval.signals(model, selCmpts['two']);
      expect(twoSg).toContainEqual({
        name: 'two_tuple',
        on: [
          {
            events: [{signal: 'two_Miles_per_Gallon'}],
            update: 'two_Miles_per_Gallon ? {unit: "", fields: two_tuple_fields, values: [two_Miles_per_Gallon]} : null'
          }
        ]
      });

      const threeSg = interval.signals(model, selCmpts['thr_ee']);
      expect(threeSg).toContainEqual({
        name: 'thr_ee_tuple',
        on: [
          {
            events: [{signal: 'thr_ee_Horsepower'}, {signal: 'thr_ee_Miles_per_Gallon'}],
            update:
              'thr_ee_Horsepower && thr_ee_Miles_per_Gallon ? {unit: "", fields: thr_ee_tuple_fields, values: [thr_ee_Horsepower,thr_ee_Miles_per_Gallon]} : null'
          }
        ]
      });

      const fourSg = interval.signals(model, selCmpts['four']);
      expect(fourSg).toContainEqual({
        name: 'four_tuple',
        init: '{unit: "", fields: four_tuple_fields, values: [[50, 70]]}',
        on: [
          {
            events: [{signal: 'four_Horsepower'}],
            update: 'four_Horsepower ? {unit: "", fields: four_tuple_fields, values: [four_Horsepower]} : null'
          }
        ]
      });

      const fiveSg = interval.signals(model, selCmpts['five']);
      expect(fiveSg).toContainEqual({
        name: 'five_tuple',
        init: '{unit: "", fields: five_tuple_fields, values: [[50, 60], [23, 54]]}',
        on: [
          {
            events: [{signal: 'five_Horsepower'}, {signal: 'five_Miles_per_Gallon'}],
            update:
              'five_Horsepower && five_Miles_per_Gallon ? {unit: "", fields: five_tuple_fields, values: [five_Horsepower,five_Miles_per_Gallon]} : null'
          }
        ]
      });
    });

    it('namespaces signals when encoding/fields collide', () => {
      const model2 = parseUnitModel({
        mark: 'circle',
        encoding: {
          x: {field: 'x', type: 'quantitative'},
          y: {field: 'y', type: 'quantitative'}
        }
      });

      model2.parseScale();

      const selCmpts2 = (model2.component.selection = selection.parseUnitSelection(model2, {
        one: {
          type: 'interval',
          encodings: ['x'],
          translate: false,
          zoom: false
        }
      }));

      const sg = interval.signals(model, selCmpts2['one']);
      expect(sg[0].name).toEqual('one_x');
      expect(sg[1].name).toEqual('one_x_1');
    });
  });

  it('builds modify signals', () => {
    const oneExpr = interval.modifyExpr(model, selCmpts['one']);
    expect(oneExpr).toEqual('one_tuple, true');

    const twoExpr = interval.modifyExpr(model, selCmpts['two']);
    expect(twoExpr).toEqual('two_tuple, true');

    const threeExpr = interval.modifyExpr(model, selCmpts['thr_ee']);
    expect(threeExpr).toEqual('thr_ee_tuple, {unit: ""}');

    const signals = selection.assembleUnitSelectionSignals(model, []);
    expect(signals).toEqual(
      expect.arrayContaining([
        {
          name: 'one_modify',
          update: `modify(\"one_store\", ${oneExpr})`
        },
        {
          name: 'two_modify',
          update: `modify(\"two_store\", ${twoExpr})`
        },
        {
          name: 'thr_ee_modify',
          update: `modify(\"thr_ee_store\", ${threeExpr})`
        }
      ])
    );
  });

  it('builds brush mark', () => {
    const marks: any[] = [{hello: 'world'}];
    expect(interval.marks(model, selCmpts['one'], marks)).toEqual([
      {
        name: 'one_brush_bg',
        type: 'rect',
        clip: true,
        encode: {
          enter: {
            fill: {value: '#333'},
            fillOpacity: {value: 0.125}
          },
          update: {
            x: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                signal: 'one_x[0]'
              },
              {
                value: 0
              }
            ],
            y: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                value: 0
              },
              {
                value: 0
              }
            ],
            x2: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                signal: 'one_x[1]'
              },
              {
                value: 0
              }
            ],
            y2: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                field: {
                  group: 'height'
                }
              },
              {
                value: 0
              }
            ]
          }
        }
      },
      {hello: 'world'},
      {
        name: 'one_brush',
        type: 'rect',
        clip: true,
        encode: {
          enter: {
            fill: {value: 'transparent'}
          },
          update: {
            stroke: [
              {
                test: 'one_x[0] !== one_x[1]',
                value: 'white'
              },
              {
                value: null
              }
            ],
            x: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                signal: 'one_x[0]'
              },
              {
                value: 0
              }
            ],
            y: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                value: 0
              },
              {
                value: 0
              }
            ],
            x2: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                signal: 'one_x[1]'
              },
              {
                value: 0
              }
            ],
            y2: [
              {
                test: 'data("one_store").length && data("one_store")[0].unit === ""',
                field: {
                  group: 'height'
                }
              },
              {
                value: 0
              }
            ]
          }
        }
      }
    ]);

    // Scale-bound interval selections should not add a brush mark.
    expect(interval.marks(model, selCmpts['two'], marks)).toEqual(marks);

    expect(interval.marks(model, selCmpts['thr_ee'], marks)).toEqual([
      {
        name: 'thr_ee_brush_bg',
        type: 'rect',
        clip: true,
        encode: {
          enter: {
            fill: {value: 'red'},
            fillOpacity: {value: 0.75}
          },
          update: {
            x: {
              signal: 'thr_ee_x[0]'
            },
            y: {
              signal: 'thr_ee_y[0]'
            },
            x2: {
              signal: 'thr_ee_x[1]'
            },
            y2: {
              signal: 'thr_ee_y[1]'
            }
          }
        }
      },
      {hello: 'world'},
      {
        name: 'thr_ee_brush',
        type: 'rect',
        clip: true,
        encode: {
          enter: {
            fill: {value: 'transparent'}
          },
          update: {
            stroke: [
              {
                test: 'thr_ee_x[0] !== thr_ee_x[1] && thr_ee_y[0] !== thr_ee_y[1]',
                value: 'black'
              },
              {value: null}
            ],
            strokeWidth: [
              {
                test: 'thr_ee_x[0] !== thr_ee_x[1] && thr_ee_y[0] !== thr_ee_y[1]',
                value: 4
              },
              {value: null}
            ],
            strokeDash: [
              {
                test: 'thr_ee_x[0] !== thr_ee_x[1] && thr_ee_y[0] !== thr_ee_y[1]',
                value: [10, 5]
              },
              {value: null}
            ],
            strokeDashOffset: [
              {
                test: 'thr_ee_x[0] !== thr_ee_x[1] && thr_ee_y[0] !== thr_ee_y[1]',
                value: 3
              },
              {value: null}
            ],
            strokeOpacity: [
              {
                test: 'thr_ee_x[0] !== thr_ee_x[1] && thr_ee_y[0] !== thr_ee_y[1]',
                value: 0.25
              },
              {value: null}
            ],
            x: {
              signal: 'thr_ee_x[0]'
            },
            y: {
              signal: 'thr_ee_y[0]'
            },
            x2: {
              signal: 'thr_ee_x[1]'
            },
            y2: {
              signal: 'thr_ee_y[1]'
            }
          }
        }
      }
    ]);
  });
});
