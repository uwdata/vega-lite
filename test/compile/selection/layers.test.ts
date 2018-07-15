/* tslint:disable quotemark */

import {assert} from 'chai';
import * as selection from '../../../src/compile/selection/selection';
import {UnitModel} from '../../../src/compile/unit';
import {parseLayerModel} from '../../util';

describe('Layered Selections', () => {
  const layers = parseLayerModel({
    layer: [
      {
        selection: {
          brush: {type: 'interval'}
        },
        mark: 'circle',
        encoding: {
          x: {field: 'Horsepower', type: 'quantitative'},
          y: {field: 'Miles_per_Gallon', type: 'quantitative'},
          color: {field: 'Origin', type: 'nominal'}
        }
      },
      {
        selection: {
          grid: {type: 'interval', bind: 'scales'}
        },
        mark: 'square',
        encoding: {
          x: {field: 'Horsepower', type: 'quantitative'},
          y: {field: 'Miles_per_Gallon', type: 'quantitative'},
          color: {field: 'Origin', type: 'nominal'}
        }
      }
    ],
    config: {mark: {tooltip: null}}
  });

  layers.parse();

  it('should appropriately name the unit', () => {
    const unit = layers.children[0] as UnitModel;
    assert.equal(selection.unitName(unit), '"layer_0"');
  });

  // Selections should augment layered marks together, rather than each
  // mark individually. This ensures correct interleaving of brush marks
  // (i.e., that the brush mark appears above all layers and thus can be
  // moved around).
  it('should pass through unit mark assembly', () => {
    expect(layers.children[0].assembleMarks()).toEqual([
      {
        name: 'layer_0_marks',
        type: 'symbol',
        style: ['circle'],
        from: {
          data: 'layer_0_main'
        },
        clip: true,
        encode: {
          update: {
            x: {
              scale: 'x',
              field: 'Horsepower'
            },
            y: {
              scale: 'y',
              field: 'Miles_per_Gallon'
            },
            fill: [
              {
                test:
                  'datum["Horsepower"] !== null && !isNaN(datum["Horsepower"]) && datum["Miles_per_Gallon"] !== null && !isNaN(datum["Miles_per_Gallon"])',
                value: 'none'
              },
              {
                scale: 'color',
                field: 'Origin'
              }
            ],
            shape: {
              value: 'circle'
            },
            stroke: [
              {
                test:
                  'datum["Horsepower"] !== null && !isNaN(datum["Horsepower"]) && datum["Miles_per_Gallon"] !== null && !isNaN(datum["Miles_per_Gallon"])',
                value: 'none'
              }
            ],
            opacity: {
              value: 0.7
            }
          }
        }
      }
    ]);

    expect(layers.children[1].assembleMarks()).toEqual([
      {
        name: 'layer_1_marks',
        type: 'symbol',
        style: ['square'],
        from: {
          data: 'layer_1_main'
        },
        clip: true,
        encode: {
          update: {
            x: {
              scale: 'x',
              field: 'Horsepower'
            },
            y: {
              scale: 'y',
              field: 'Miles_per_Gallon'
            },
            fill: [
              {
                test:
                  'datum["Horsepower"] !== null && !isNaN(datum["Horsepower"]) && datum["Miles_per_Gallon"] !== null && !isNaN(datum["Miles_per_Gallon"])',
                value: 'none'
              },
              {
                scale: 'color',
                field: 'Origin'
              }
            ],
            stroke: [
              {
                test:
                  'datum["Horsepower"] !== null && !isNaN(datum["Horsepower"]) && datum["Miles_per_Gallon"] !== null && !isNaN(datum["Miles_per_Gallon"])',
                value: 'none'
              }
            ],
            shape: {
              value: 'square'
            },
            opacity: {
              value: 0.7
            }
          }
        }
      }
    ]);
  });

  it('should assemble selection marks across layers', () => {
    const child0 = layers.children[0].assembleMarks()[0];
    const child1 = layers.children[1].assembleMarks()[0];

    assert.sameDeepMembers(layers.assembleMarks(), [
      // Background brush mark for "brush" selection.
      {
        name: 'brush_brush_bg',
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
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_x[0]'
              },
              {
                value: 0
              }
            ],
            y: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_y[0]'
              },
              {
                value: 0
              }
            ],
            x2: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_x[1]'
              },
              {
                value: 0
              }
            ],
            y2: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_y[1]'
              },
              {
                value: 0
              }
            ]
          }
        }
      },
      // Layer marks
      {...child0, clip: true},
      {...child1, clip: true},
      // Foreground brush mark for "brush" selection.
      {
        name: 'brush_brush',
        type: 'rect',
        clip: true,
        encode: {
          enter: {
            fill: {value: 'transparent'}
          },
          update: {
            stroke: [
              {
                test: 'brush_x[0] !== brush_x[1] && brush_y[0] !== brush_y[1]',
                value: 'white'
              },
              {value: null}
            ],
            x: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_x[0]'
              },
              {
                value: 0
              }
            ],
            y: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_y[0]'
              },
              {
                value: 0
              }
            ],
            x2: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_x[1]'
              },
              {
                value: 0
              }
            ],
            y2: [
              {
                test: 'data("brush_store").length && data("brush_store")[0].unit === "layer_0"',
                signal: 'brush_y[1]'
              },
              {
                value: 0
              }
            ]
          }
        }
      }
    ]);
  });
});
