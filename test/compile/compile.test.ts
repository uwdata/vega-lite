import {AggregateTransform} from 'vega';
import {compile} from '../../src/compile/compile.js';
import * as log from '../../src/log/index.js';

describe('compile/compile', () => {
  it('should throw error for invalid spec', () => {
    expect(() => {
      compile({} as any);
    }).toThrow();
  });

  it('should return a spec with default top-level properties, size signals, data, marks, and title', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      title: {text: 'test'},
      mark: 'point',
      encoding: {},
    });

    expect(spec.padding).toBe(5);
    expect(spec.autosize).toBeUndefined();
    expect(spec.width).toBe(20);
    expect(spec.height).toBe(20);
    expect(spec.title).toEqual({text: 'test', frame: 'group'});

    expect(spec.data).toHaveLength(1); // just source
    expect(spec.marks).toHaveLength(1); // just the root group
  });

  it('should return a spec with specified top-level properties, size signals, data and marks', () => {
    const {spec} = compile({
      padding: 123,
      data: {
        values: [{a: 'A', b: 28}],
      },
      mark: 'point',
      encoding: {},
    });

    expect(spec.padding).toBe(123);
    expect(spec.autosize).toBeUndefined();
    expect(spec.width).toBe(20);
    expect(spec.height).toBe(20);

    expect(spec.data).toHaveLength(1); // just source.
    expect(spec.marks).toHaveLength(1); // just the root group
  });

  it(
    'should drop fit in top-level properties for discrete x discrete chart',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {
          values: [{x: 'foo', y: 'bar'}],
        },
        autosize: 'fit',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'},
          y: {field: 'y', type: 'nominal'},
        },
      });

      expect(localLogger.warns[0]).toBe(log.message.droppingFit());
      expect(spec.autosize).toBeUndefined();
    }),
  );

  it(
    'should drop fit-y in top-level properties for quantitative x discrete chart',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {
          values: [{x: 1, y: 'bar'}],
        },
        autosize: 'fit',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'quantitative'},
          y: {field: 'y', type: 'nominal'},
        },
      });

      expect(localLogger.warns[0]).toBe(log.message.droppingFit('y'));
      expect(spec.autosize).toBe('fit-x');
    }),
  );

  it(
    'should drop fit-x in top-level properties for discrete x quantitative chart',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {
          values: [{x: 'foo', y: 1}],
        },
        autosize: 'fit',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'},
          y: {field: 'y', type: 'quantitative'},
        },
      });

      expect(localLogger.warns[0]).toBe(log.message.droppingFit('x'));
      expect(spec.autosize).toBe('fit-y');
    }),
  );

  it(
    'should NOT drop fit in top-level properties for specified width/height chart',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {
          values: [{x: 'foo', y: 'bar'}],
        },
        autosize: 'fit',
        width: 400,
        height: 400,
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'},
          y: {field: 'y', type: 'nominal'},
        },
      });

      expect(localLogger.warns).toHaveLength(0);
      expect(spec.autosize).toBe('fit');
    }),
  );

  it(
    'should NOT drop fit-y in top-level properties for specified height chart',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {
          values: [{x: 1, y: 'bar'}],
        },
        height: 400,
        autosize: 'fit',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'quantitative'},
          y: {field: 'y', type: 'nominal'},
        },
      });

      expect(localLogger.warns).toHaveLength(0);
      expect(spec.autosize).toBe('fit');
    }),
  );

  it(
    'should NOT drop fit-x in top-level properties for specified width chart',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {
          values: [{x: 'foo', y: 1}],
        },
        width: 400,
        autosize: 'fit',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'},
          y: {field: 'y', type: 'quantitative'},
        },
      });

      expect(localLogger.warns).toHaveLength(0);
      expect(spec.autosize).toBe('fit');
    }),
  );

  it(
    'should NOT drop fit-x in top-level properties for fit-x chart with specified width',
    log.wrap(localLogger => {
      const {spec} = compile({
        data: {
          values: [{x: 'foo', y: 1}]
        },
        width: 400,
        autosize: 'fit-x',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'},
          y: {field: 'y', type: 'quantitative'}
        }
      });

      expect(localLogger.warns).toHaveLength(0);
      expect(spec.autosize).toBe('fit-x');
    })
  );

  it(
    'should NOT drop fit-y in top-level properties for fit-y chart with specified height',
    log.wrap(localLogger => {
      const {spec} = compile({
        data: {
          values: [{x: 'foo', y: 1}]
        },
        height: 400,
        autosize: 'fit-y',
        mark: 'point',
        encoding: {
          x: {field: 'x', type: 'nominal'},
          y: {field: 'y', type: 'quantitative'}
        }
      });

      expect(localLogger.warns).toHaveLength(0);
      expect(spec.autosize).toBe('fit-y');
    })
  );

  it('should use size signal for bar chart width', () => {
    const {spec} = compile({
      data: {values: [{a: 'A', b: 28}]},
      mark: 'bar',
      encoding: {
        x: {field: 'a', type: 'ordinal'},
        y: {field: 'b', type: 'quantitative'},
      },
    });

    expect(spec.signals).toEqual([
      {
        name: 'x_step',
        value: 20,
      },
      {
        name: 'width',
        update: `bandspace(domain('x').length, 0.1, 0.05) * x_step`,
      },
    ]);
    expect(spec.height).toBe(200);
  });

  it('should set resize to true if requested', () => {
    const {spec} = compile({
      autosize: {
        resize: true,
      },
      data: {url: 'foo.csv'},
      mark: 'point',
      encoding: {},
    });

    expect((spec.autosize as any).resize).toBeTruthy();
  });

  it('should set autosize to fit and containment if requested', () => {
    const {spec} = compile({
      autosize: {
        type: 'fit',
        contains: 'content',
      },
      data: {url: 'foo.csv'},
      mark: 'point',
      encoding: {},
    });

    expect(spec.autosize).toEqual({type: 'fit', contains: 'content'});
  });

  it('should set autosize to fit if requested', () => {
    const {spec} = compile({
      autosize: 'fit',
      data: {url: 'foo.csv'},
      mark: 'point',
      encoding: {},
    });

    expect(spec.autosize).toBe('fit');
  });

  it('should use containerSize for width and autosize to fit-x/padding', () => {
    const {spec} = compile({
      width: 'container',
      data: {url: 'foo.csv'},
      mark: 'point',
      encoding: {},
    });

    expect(spec.autosize).toEqual({type: 'fit-x', contains: 'padding'});
    expect(spec.signals).toEqual([
      {
        name: 'width',
        init: 'isFinite(containerSize()[0]) ? containerSize()[0] : 200',
        on: [{events: 'window:resize', update: 'isFinite(containerSize()[0]) ? containerSize()[0] : 200'}],
      },
    ]);
    expect(spec.width).toBeUndefined();
  });

  it('should use containerSize for width and autosize to fit-y/padding', () => {
    const {spec} = compile({
      height: 'container',
      data: {url: 'foo.csv'},
      mark: 'point',
      encoding: {},
    });

    expect(spec.autosize).toEqual({type: 'fit-y', contains: 'padding'});
    expect(spec.signals).toEqual([
      {
        name: 'height',
        init: 'isFinite(containerSize()[1]) ? containerSize()[1] : 200',
        on: [{events: 'window:resize', update: 'isFinite(containerSize()[1]) ? containerSize()[1] : 200'}],
      },
    ]);
    expect(spec.height).toBeUndefined();
  });

  it('should use containerSize for width/height and autosize to fit/padding, and respect default view width/height', () => {
    const {spec} = compile({
      width: 'container',
      height: 'container',
      data: {url: 'foo.csv'},
      mark: 'point',
      encoding: {},
      config: {
        view: {
          continuousWidth: 500,
          continuousHeight: 300,
        },
      },
    });

    expect(spec.autosize).toEqual({type: 'fit', contains: 'padding'});
    expect(spec.signals).toEqual([
      {
        name: 'width',
        init: 'isFinite(containerSize()[0]) ? containerSize()[0] : 500',
        on: [{events: 'window:resize', update: 'isFinite(containerSize()[0]) ? containerSize()[0] : 500'}],
      },
      {
        name: 'height',
        init: 'isFinite(containerSize()[1]) ? containerSize()[1] : 300',
        on: [{events: 'window:resize', update: 'isFinite(containerSize()[1]) ? containerSize()[1] : 300'}],
      },
    ]);
    expect(spec.width).toBeUndefined();
    expect(spec.height).toBeUndefined();
  });

  it(
    'warn if use container for width and pad for autosize',
    log.wrap((localLogger) => {
      compile({
        width: 'container',
        height: 'container',
        autosize: 'pad',
        data: {url: 'foo.csv'},
        mark: 'point',
        encoding: {},
      });
      expect(localLogger.warns[0]).toBe(log.message.containerSizeNotCompatibleWithAutosize('width'));
      expect(localLogger.warns[1]).toBe(log.message.containerSizeNotCompatibleWithAutosize('height'));
    }),
  );

  it(
    'warn if use container for width for composed spec',
    log.wrap((localLogger) => {
      const {spec} = compile({
        width: 'container',
        vconcat: [
          {
            mark: 'point',
            encoding: {},
          },
        ],
      });
      expect(localLogger.warns[0]).toBe(log.message.containerSizeNonSingle('width'));
      expect(spec.autosize).toBeUndefined();
    }),
  );

  it(
    'warn if use container for height for composed spec',
    log.wrap((localLogger) => {
      const {spec} = compile({
        height: 'container',
        vconcat: [
          {
            mark: 'point',
            encoding: {},
          },
        ],
      });
      expect(localLogger.warns[0]).toBe(log.message.containerSizeNonSingle('height'));
      expect(spec.autosize).toBeUndefined();
    }),
  );

  it(
    'warn if trying to fit composed spec',
    log.wrap((localLogger) => {
      const {spec} = compile({
        data: {values: [{a: 'A', b: 28}]},
        autosize: 'fit',
        vconcat: [
          {
            mark: 'point',
            encoding: {},
          },
        ],
      });
      expect(localLogger.warns[0]).toBe(log.message.FIT_NON_SINGLE);
      expect(spec.autosize).toBe('fit');
    }),
  );

  it('should return title for a layered spec.', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      title: {text: 'test'},
      layer: [
        {
          mark: 'point',
          encoding: {},
        },
      ],
    });
    expect(spec.title).toEqual({text: 'test', frame: 'group'});
  });

  it('should return title (string) for a layered spec.', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      title: 'test',
      layer: [
        {
          mark: 'point',
          encoding: {},
        },
      ],
    });
    expect(spec.title).toEqual({text: 'test', frame: 'group'});
  });

  it('should return title from a child of a layer spec if parent has no title.', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      layer: [
        {
          title: {text: 'test'},
          mark: 'point',
          encoding: {},
        },
      ],
    });
    expect(spec.title).toEqual({text: 'test', frame: 'group'});
  });

  it('should return a title for a concat spec', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      title: {text: 'test'},
      hconcat: [
        {
          mark: 'point',
          encoding: {},
        },
      ],
      config: {title: {anchor: 'middle'}},
    });
    expect(spec.title).toEqual({
      text: 'test',
      anchor: 'middle', // We only support anchor as start for concat
    });
  });

  it('should return a title for a concat spec, automatically set anchor to "start", and augment the title with non-mark title config (e.g., offset).', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      title: {text: 'test'},
      hconcat: [
        {
          mark: 'point',
          encoding: {},
        },
      ],
      config: {title: {offset: 5}},
    });
    expect(spec.title).toEqual({
      text: 'test',
      anchor: 'start',
      offset: 5,
    });
  });

  it('should not have title if there is no title.', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      hconcat: [
        {
          mark: 'point',
          encoding: {},
        },
      ],
      config: {title: {offset: 5}},
    });
    expect(spec.title).toBeUndefined();
  });

  it('should use provided config.', () => {
    const {spec} = compile(
      {
        mark: 'point',
        data: {url: 'foo.csv'},
        encoding: {},
      },
      {
        config: {
          background: 'blue',
        },
      },
    );
    expect(spec.background).toBe('blue');
  });

  it('should apply expr in top-level property.', () => {
    const {spec} = compile(
      {
        background: {expr: "'red"},
        mark: 'point',
        data: {url: 'foo.csv'},
        encoding: {},
      },
      {
        config: {},
      },
    );
    expect(spec.background).toEqual({signal: "'red"});
  });

  it('should merge spec and provided config.', () => {
    const {spec} = compile(
      {
        mark: 'point',
        data: {url: 'foo.csv'},
        encoding: {},
        config: {
          background: 'red',
        },
      },
      {
        config: {
          background: 'blue',
        },
      },
    );
    expect(spec.background).toBe('red');
  });

  it('should return a spec with projections (implicit)', () => {
    const {spec} = compile({
      mark: 'geoshape',
      data: {
        url: 'data/us-10m.json',
        format: {
          type: 'topojson',
          feature: 'states',
        },
      },
      encoding: {},
    });
    expect(spec.projections).toBeDefined();
  });

  it('should return a spec with projections (explicit)', () => {
    const {spec} = compile({
      mark: 'geoshape',
      projection: {
        type: 'albersUsa',
      },
      data: {
        url: 'data/us-10m.json',
        format: {
          type: 'topojson',
          feature: 'states',
        },
      },
      encoding: {},
    });
    expect(spec.projections).toBeDefined();
  });

  it('should set `resize: true` for spec with axis orient signal', () => {
    const {spec} = compile({
      data: {
        values: [{a: 'A', b: 28}],
      },
      mark: 'point',
      encoding: {
        x: {field: 'a', type: 'nominal', axis: {orient: {signal: '"top"'}}},
        y: {field: 'b', type: 'quantitative', axis: {orient: {signal: '"right"'}}},
      },
    });

    expect((spec.autosize as any).resize).toBeTruthy();
  });
});

it('should generate right tooltip', () => {
  const {spec} = compile({
    data: {url: 'data/population.json'},
    mark: 'errorband',
    encoding: {
      x: {field: 'age', type: 'ordinal'},
      y: {field: 'people', type: 'quantitative'},
      tooltip: {field: 'people', aggregate: 'mean'},
    },
  });

  expect((spec.data[0].transform[0] as AggregateTransform).as as string[]).toEqual([
    'mean_people',
    'center_people',
    'extent_people',
  ]);
});
