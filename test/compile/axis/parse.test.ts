import {Y} from '../../../src/channel';
import {parseLayerAxes, parseUnitAxes} from '../../../src/compile/axis/parse';
import {parseLayerModel, parseUnitModelWithScale} from '../../util';

describe('Axis', () => {
  // TODO: move this to model.test.ts
  describe('= true', () => {
    it('should produce default properties for axis', () => {
      const model1 = parseUnitModelWithScale({
        mark: 'bar',
        encoding: {
          y: {type: 'quantitative', field: 'US_Gross', aggregate: 'sum'}
        },
        data: {url: 'data/movies.json'}
      });

      const model2 = parseUnitModelWithScale({
        mark: 'bar',
        encoding: {
          y: {type: 'quantitative', field: 'US_Gross', aggregate: 'sum'}
        },
        data: {url: 'data/movies.json'}
      });
      expect(model1.axis(Y)).toEqual(model2.axis(Y));
    });
  });
  describe('parseUnitAxis', () => {
    it('should produce Vega grid', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
            axis: {grid: true, gridColor: 'blue', gridWidth: 20}
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.grid).toBe(true);
    });

    it('should respect config even though the function could provide default value', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {axisQuantitative: {labelAlign: 'right'}, axisX: {title: 'foo'}}
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.labelAlign).toBe('right');
      expect(axisComponent['x'][0].implicit.title).toBe('foo');
    });

    it('should override axis title set in config with title from encoding', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            title: 'foo',
            type: 'quantitative'
          }
        },
        config: {axisX: {title: 'bar'}}
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.title).toBe('foo');
    });

    it('should produce grid, orient, tickCount, labelExpr in the component when axis config is specified.', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {axisX: {grid: true, orient: 'right', tickCount: 20, labelExpr: 'abc'}}
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.grid).toBe(true);
      expect(axisComponent['x'][0].implicit.orient).toBe('right');
      expect(axisComponent['x'][0].implicit.tickCount).toBe(20);
      expect(axisComponent['x'][0].implicit.labelExpr).toBe('abc');
    });

    it('should include conditional axis config', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {
          axisX: {
            gridDash: {
              condition: {
                test: {field: 'value', timeUnit: 'monthdate', equal: {month: 1, date: 1}},
                value: null
              },
              value: [2, 2]
            }
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.gridDash).toEqual({
        condition: {
          test: {field: 'value', timeUnit: 'monthdate', equal: {month: 1, date: 1}},
          value: null
        },
        value: [2, 2]
      });
    });

    it('should include axis property in style', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
            axis: {style: 'foo'}
          }
        },
        config: {
          style: {
            foo: {labelColor: 'red'}
          }
        }
      });

      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.labelColor).toBe('red');
    });

    it('should include axis property in axis config style', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {
          axis: {style: 'foo'},
          style: {
            foo: {labelColor: 'red'}
          }
        }
      });

      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.labelColor).toBe('red');
    });

    it('should include axis property in orientation and type based axis config style', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {
          axisXQuantitative: {labelColor: 'red'}
        }
      });

      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.labelColor).toBe('red');
    });

    it('should include axis property in axis config over axis config style', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {
          axis: {style: 'foo'},
          axisX: {labelColor: 'blue'},
          style: {
            foo: {labelColor: 'red'}
          }
        }
      });

      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].implicit.labelColor).toBeUndefined();
      // Vega-Lite doesn't have to output "blue" here since Vega will apply config.axisX.labelColor and renders blue label color anyway.
    });

    it('should produce axis component with grid=false', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
            axis: {grid: false, gridColor: 'blue', gridWidth: 20}
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.grid).toBe(false);
    });

    it('should ignore null scales', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          longitude: {
            field: 'a',
            type: 'quantitative'
          },
          latitude: {
            field: 'b',
            type: 'quantitative'
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toBeUndefined();
      expect(axisComponent['y']).toBeUndefined();
    });

    it('should produce Vega grid axis = undefined axis if grid is disabled via config.axisX', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {axisX: {grid: false}}
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.grid).toBeUndefined();
    });

    it('should produce Vega grid axis = undefined axis if grid is disabled via config.axis', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          }
        },
        config: {axis: {grid: false}}
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.grid).toBeUndefined();
    });

    it('should store the title value if title = null, "", or false', () => {
      for (const val of [null, '', false]) {
        const model = parseUnitModelWithScale({
          mark: 'point',
          encoding: {
            x: {
              field: 'a',
              type: 'quantitative',
              axis: {title: val as any} // Need to cast as false is not valid, but we want to fall back gracefully
            }
          }
        });
        const axisComponent = parseUnitAxes(model);
        expect(axisComponent['x']).toHaveLength(1);
        expect(axisComponent['x'][0].explicit.title).toEqual(val as any);
      }
    });

    it('should store the fieldDef title value if title = null, "", or false', () => {
      for (const val of [null, '', false]) {
        const model = parseUnitModelWithScale({
          mark: 'point',
          encoding: {
            x: {
              field: 'a',
              type: 'quantitative',
              title: val as any // Need to cast as false is not valid, but we want to fall back gracefully
            }
          }
        });
        const axisComponent = parseUnitAxes(model);
        expect(axisComponent['x']).toHaveLength(1);
        expect(axisComponent['x'][0].explicit.title).toEqual(val as any);
      }
    });

    it('should store fieldDef.title as explicit', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
            title: 'foo'
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.title).toBe('foo');
    });

    it('should produces correct axis encode', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
            axis: {
              encoding: {
                labels: {
                  dx: {value: {signal: 'a'}},
                  dy: {value: 2}
                }
              }
            }
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.encode).toEqual({
        labels: {
          update: {
            dx: {signal: 'a'},
            dy: {value: 2}
          }
        }
      });
    });

    it('should merge title of fieldDef and fieldDef2', () => {
      const model = parseUnitModelWithScale({
        mark: 'bar',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
            title: 'foo'
          },
          x2: {
            field: 'b',
            title: 'bar'
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.title).toBe('foo, bar');
    });

    it('should use title of fieldDef2', () => {
      const model = parseUnitModelWithScale({
        mark: 'bar',
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative'
          },
          x2: {
            field: 'b',
            title: 'bar'
          }
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].explicit.title).toBe('bar');
    });

    it('should store both x and x2 for ranged mark', () => {
      const model = parseUnitModelWithScale({
        mark: 'rule',
        encoding: {
          x: {field: 'a', type: 'quantitative'},
          x2: {field: 'a2'}
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].get('title')).toEqual([{field: 'a'}, {field: 'a2'}]);
    });

    it('should have correct text.signal for quarter timeUnits', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'temporal', timeUnit: 'quarter'}
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].get('format')).toEqual({
        signal: 'timeUnitSpecifier(["quarter"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "})'
      });
    });

    it('should have output time formatType for ordinal months', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'ordinal', timeUnit: 'month'}
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].get('formatType')).toBe('time');
    });

    it('should have output axis custom format in label encode block', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'ordinal', timeUnit: 'month', axis: {format: 'x', formatType: 'foo'}}
        },
        config: {customFormatTypes: true}
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].get('format')).toBeUndefined();
      expect(axisComponent['x'][0].get('encode').labels.update.text).toEqual({signal: 'foo(datum.value, "x")'});
    });

    it('should have correct text.signal for yearquartermonth timeUnits', () => {
      const model = parseUnitModelWithScale({
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'temporal', timeUnit: 'yearquartermonth'}
        }
      });
      const axisComponent = parseUnitAxes(model);
      expect(axisComponent['x']).toHaveLength(1);
      expect(axisComponent['x'][0].get('format')).toEqual({
        signal: 'timeUnitSpecifier(["year","quarter","month"], {"year-month":"%b %Y ","year-month-date":"%b %d, %Y "})'
      });
    });
  });

  describe('parseLayerAxis', () => {
    const globalRuleOverlay = parseLayerModel({
      layer: [
        {
          mark: 'rule',
          encoding: {
            y: {
              aggregate: 'mean',
              field: 'a',
              type: 'quantitative'
            }
          }
        },
        {
          mark: 'line',
          encoding: {
            y: {
              aggregate: 'mean',
              field: 'a',
              type: 'quantitative'
            },
            x: {
              timeUnit: 'month',
              type: 'temporal',
              field: 'date'
            }
          }
        }
      ]
    });
    globalRuleOverlay.parseScale();
    globalRuleOverlay.parseLayoutSize();
    parseLayerAxes(globalRuleOverlay);

    it('correctly merges gridScale if one layer does not have one of the axis', () => {
      const axisComponents = globalRuleOverlay.component.axes;
      expect(axisComponents.y).toHaveLength(1);
      expect(axisComponents.y[0].get('gridScale')).toBe('x');
    });

    it('correctly merges similar title', () => {
      const axisComponents = globalRuleOverlay.component.axes;
      expect(axisComponents.y[0].get('title')).toEqual([{aggregate: 'mean', field: 'a'}]);
    });

    it('correctly combines different titles', () => {
      const model = parseLayerModel({
        data: {url: 'data/cars.json'},
        layer: [
          {
            mark: 'line',
            encoding: {
              x: {field: 'Cylinders', type: 'ordinal'},
              y: {
                aggregate: 'max',
                field: 'Horsepower',
                type: 'quantitative'
              },
              color: {value: 'darkred'}
            }
          },
          {
            data: {url: 'data/cars.json'},
            mark: 'line',
            encoding: {
              x: {field: 'Cylinders', type: 'ordinal'},
              y: {
                aggregate: 'min',
                field: 'Horsepower',
                type: 'quantitative'
              }
            }
          }
        ]
      });
      model.parseScale();
      parseLayerAxes(model);
      const axisComponents = model.component.axes;

      expect(axisComponents.y[0].get('title')).toEqual([
        {aggregate: 'max', field: 'Horsepower'},
        {aggregate: 'min', field: 'Horsepower'}
      ]);
    });

    it('correctly combines different titles with null', () => {
      const model = parseLayerModel({
        data: {url: 'data/cars.json'},
        layer: [
          {
            mark: 'line',
            encoding: {
              x: {field: 'Cylinders', type: 'ordinal', title: 'Hello'},
              y: {
                aggregate: 'max',
                field: 'Horsepower',
                type: 'quantitative',
                title: 'HP'
              },
              color: {value: 'darkred'}
            }
          },
          {
            data: {url: 'data/cars.json'},
            mark: 'line',
            encoding: {
              x: {field: 'Cylinders', type: 'ordinal', title: 'World'},
              y: {
                aggregate: 'min',
                field: 'Horsepower',
                type: 'quantitative',
                title: null // remove the title entirely
              }
            }
          }
        ]
      });
      model.parseScale();
      parseLayerAxes(model);
      const axisComponents = model.component.axes;

      expect(axisComponents.x[0].get('title')).toBe('Hello, World');
      expect(axisComponents.y[0].get('title')).toBeNull();
    });
  });
});
