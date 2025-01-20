import {NonArgAggregateOp} from '../src/aggregate';
import {DETAIL, X, Y, YOFFSET} from '../src/channel';
import * as log from '../src/log';
import {ARC, AREA, BAR, PRIMITIVE_MARKS, RECT} from '../src/mark';
import {ScaleType} from '../src/scale';
import {NormalizedUnitSpec, TopLevel} from '../src/spec';
import {stack, STACKABLE_MARKS, StackOffset, STACK_BY_DEFAULT_MARKS} from '../src/stack';

describe('stack', () => {
  const NON_STACKABLE_NON_POLAR_MARKS = [RECT];
  const STACKABLE_NON_POLAR_MARKS = new Set([...STACKABLE_MARKS].filter(m => m != ARC));
  const STACK_BY_DEFAULT_NON_POLAR_MARKS = new Set([...STACK_BY_DEFAULT_MARKS].filter(m => m != ARC));

  it('should be disabled for non-stackable marks with at least one of the stack channel', () => {
    for (const nonStackableMark of NON_STACKABLE_NON_POLAR_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark: nonStackableMark,
        encoding: {
          x: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
          y: {field: 'variety', type: 'nominal'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      expect(stack(spec.mark, spec.encoding)).toBeNull();
    }
  });

  it('should be allowed for raw plot', () => {
    for (const mark of STACKABLE_NON_POLAR_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {field: 'yield', type: 'quantitative', stack: 'zero'},
          y: {field: 'variety', type: 'nominal'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      const stackProps = stack(spec.mark, spec.encoding);
      expect(stackProps.fieldChannel).toBe(X);
    }
  });

  it("doesn't stacked binned field", () => {
    for (const mark of STACKABLE_NON_POLAR_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {field: 'yield', type: 'quantitative', bin: true}
        }
      };
      const stackProps = stack(spec.mark, spec.encoding);
      expect(stackProps).toBeNull();
    }
  });

  it("doesn't stacked the dimension field on a 1D vertical bar with dimension only", () => {
    const spec: TopLevel<NormalizedUnitSpec> = {
      data: {url: 'data/barley.json'},
      mark: {type: 'bar', orient: 'vertical'},
      encoding: {
        x: {field: 'yield', type: 'quantitative'}
      }
    };
    const stackProps = stack(spec.mark, spec.encoding);
    expect(stackProps).toBeNull();
  });

  it("doesn't stacked the dimension field on a 1D horizontal bar with dimension only", () => {
    const spec: TopLevel<NormalizedUnitSpec> = {
      data: {url: 'data/barley.json'},
      mark: {type: 'bar', orient: 'horizontal'},
      encoding: {
        y: {field: 'yield', type: 'quantitative'}
      }
    };
    const stackProps = stack(spec.mark, spec.encoding);
    expect(stackProps).toBeNull();
  });

  it('should be disabled when stack is false', () => {
    for (const mark of STACKABLE_NON_POLAR_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {aggregate: 'mean', field: 'yield', type: 'quantitative', stack: false},
          y: {field: 'variety', type: 'nominal'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      const stackProps = stack(spec.mark, spec.encoding);
      expect(stackProps).toBeNull();
    }
  });

  it('should stack default stack marks', () => {
    for (const mark of STACK_BY_DEFAULT_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {field: 'yield', type: 'quantitative'},
          y: {field: 'variety', type: 'nominal'}
        }
      };
      const stackProps = stack(spec.mark, spec.encoding);
      expect(stackProps.fieldChannel).toBe(X);
    }
  });

  it('should prioritize axis with stack', () => {
    for (const mark of STACKABLE_NON_POLAR_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {field: 'yield', type: 'quantitative', stack: 'zero'},
          y: {field: 'variety', type: 'quantitative'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      const stackProps = stack(spec.mark, spec.encoding);
      expect(stackProps.fieldChannel).toBe(X);
    }
  });

  it('should always be disabled if the stackby channel is aggregated', () => {
    for (const s of [undefined, 'center', 'zero', 'normalize', null, 'none'] as StackOffset[]) {
      for (const mark of PRIMITIVE_MARKS) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark,
          encoding: {
            x: {aggregate: 'sum', field: 'yield', type: 'quantitative', stack: s},
            y: {field: 'variety', type: 'nominal'},
            color: {aggregate: 'count', type: 'quantitative'}
          }
        };

        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack).toBeNull();
      }
    }
  });

  it('can be enabled if one of the stackby channels is not aggregated', () => {
    for (const s of [undefined, 'center', 'zero', 'normalize'] as const) {
      const marks = s === undefined ? STACK_BY_DEFAULT_NON_POLAR_MARKS : STACKABLE_NON_POLAR_MARKS;
      for (const mark of marks) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark,
          encoding: {
            x: {aggregate: 'sum', field: 'yield', type: 'quantitative', stack: s},
            y: {field: 'variety', type: 'nominal'},
            color: {aggregate: 'count', type: 'quantitative'},
            detail: {field: 'site', type: 'nominal'}
          }
        };

        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack).toBeTruthy();

        expect(_stack.stackBy[0].channel).toEqual(DETAIL);
      }
    }
  });

  it('should not include tooltip in stackBy', () => {
    const spec: TopLevel<NormalizedUnitSpec> = {
      data: {url: 'data/barley.json'},
      mark: 'bar',
      encoding: {
        x: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
        y: {field: 'variety', type: 'nominal'},
        detail: {field: 'site', type: 'nominal'},
        tooltip: {field: 'total_yield', type: 'nominal'}
      }
    };

    const _stack = stack(spec.mark, spec.encoding);
    expect(_stack).toBeTruthy();

    for (const stackBy of _stack.stackBy) {
      expect(stackBy.channel).not.toBe('tooltip');
    }
  });

  it('should always be disabled if both x and y are aggregate', () => {
    for (const mark of PRIMITIVE_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
          y: {aggregate: 'count', type: 'quantitative'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      expect(stack(spec.mark, spec.encoding)).toBeNull();
    }
  });

  it('should always be disabled if neither x nor y is aggregate or stack', () => {
    for (const mark of PRIMITIVE_MARKS) {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark,
        encoding: {
          x: {field: 'variety', type: 'nominal'},
          y: {field: 'variety', type: 'nominal'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      expect(stack(spec.mark, spec.encoding)).toBeNull();
    }
  });

  it('should always be disabled if there is both x and x2', () => {
    for (const stacked of [undefined, 'center', 'zero', 'normalize'] as const) {
      const marks = stacked === undefined ? STACK_BY_DEFAULT_NON_POLAR_MARKS : STACKABLE_NON_POLAR_MARKS;
      for (const mark of marks) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          mark,
          encoding: {
            x: {field: 'a', type: 'quantitative', aggregate: 'sum'},
            x2: {field: 'a', aggregate: 'sum'},
            y: {field: 'variety', type: 'nominal'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        expect(stack(spec.mark, spec.encoding)).toBeNull();
      }
    }
  });

  it('should always be disabled if there is both y and y2', () => {
    for (const stacked of [undefined, 'center', 'zero', 'normalize'] as const) {
      const marks = stacked === undefined ? STACK_BY_DEFAULT_NON_POLAR_MARKS : STACKABLE_NON_POLAR_MARKS;
      for (const mark of marks) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          mark,
          encoding: {
            y: {field: 'a', type: 'quantitative', aggregate: 'sum'},
            y2: {field: 'a', aggregate: 'sum'},
            x: {field: 'variety', type: 'nominal'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        expect(stack(spec.mark, spec.encoding)).toBeNull();
      }
    }
  });

  it(
    'should always return stack and only warn for non-undefined stack if the aggregated axis has non-linear scale',
    log.wrap(localLogger => {
      for (const s of [undefined, 'center', 'zero', 'normalize'] as const) {
        for (const scaleType of [ScaleType.LOG, ScaleType.POW, ScaleType.SQRT]) {
          const marks = s === undefined ? STACK_BY_DEFAULT_NON_POLAR_MARKS : STACKABLE_NON_POLAR_MARKS;
          for (const mark of marks) {
            const spec: TopLevel<NormalizedUnitSpec> = {
              data: {url: 'data/barley.json'},
              mark,
              encoding: {
                x: {field: 'a', type: 'quantitative', aggregate: 'sum', stack: s, scale: {type: scaleType}},
                y: {field: 'variety', type: 'nominal'},
                color: {field: 'site', type: 'nominal'}
              }
            };
            expect(stack(spec.mark, spec.encoding)).toBeTruthy();
            const warns = localLogger.warns;

            if (s !== undefined) {
              expect(warns[warns.length - 1]).toEqual(log.message.stackNonLinearScale(scaleType));
            } else {
              expect(warns).toHaveLength(0);
            }
          }
        }
      }
    })
  );

  it(
    'should throw warning if the aggregated axis has a non-summative aggregate',
    log.wrap(localLogger => {
      for (const stackOffset of [undefined, 'center', 'zero', 'normalize'] as const) {
        for (const aggregate of ['average', 'variance', 'q3'] as NonArgAggregateOp[]) {
          const marks = stackOffset === undefined ? STACK_BY_DEFAULT_NON_POLAR_MARKS : STACKABLE_NON_POLAR_MARKS;
          for (const mark of marks) {
            const spec: TopLevel<NormalizedUnitSpec> = {
              data: {url: 'data/barley.json'},
              mark,
              encoding: {
                x: {
                  aggregate,
                  stack: stackOffset,
                  field: 'a',
                  type: 'quantitative'
                },
                y: {field: 'variety', type: 'nominal'},
                color: {field: 'site', type: 'nominal'}
              }
            };

            stack(spec.mark, spec.encoding);

            const warns = localLogger.warns;
            expect(warns[warns.length - 1]).toEqual(log.message.stackNonSummativeAggregate(aggregate));
          }
        }
      }
    })
  );

  describe('stack().groupbyChannels, .fieldChannels', () => {
    it('should be correct for horizontal', () => {
      for (const stackableMark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark: stackableMark,
          encoding: {
            x: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
            y: {field: 'variety', type: 'nominal'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack.fieldChannel).toBe(X);
        expect(_stack.groupbyChannels).toEqual([Y]);
      }
    });

    it('should be correct for grouped bar', () => {
      for (const stackableMark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark: stackableMark,
          encoding: {
            x: {field: 'yield', type: 'quantitative'},
            y: {field: 'variety', type: 'nominal'},
            yOffset: {field: 'site', type: 'nominal'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack.fieldChannel).toBe(X);
        expect(_stack.groupbyChannels).toEqual([Y, YOFFSET]);
      }
    });

    it('should be correct for grouped bar without nesting', () => {
      for (const stackableMark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark: stackableMark,
          encoding: {
            x: {field: 'yield', type: 'quantitative'},
            yOffset: {field: 'site', type: 'nominal'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack.fieldChannel).toBe(X);
        expect(_stack.groupbyChannels).toEqual([YOFFSET]);
      }
    });

    it('should stack even for two plain quantitatives with the orient on the axes', () => {
      for (const mark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/movies.json'},
          mark: {type: mark, orient: 'vertical'}, // orient also can be inferred by init.ts
          encoding: {
            x: {field: 'IMDB Rating', type: 'quantitative'},
            y: {field: 'Rotten Tomatoes Rating', type: 'quantitative'}
          }
        };
        const stackProps = stack(spec.mark, spec.encoding);
        expect(stackProps.fieldChannel).toBe(Y);
      }
    });

    it('should be correct for horizontal (single)', () => {
      for (const stackableMark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark: stackableMark,
          encoding: {
            x: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack.fieldChannel).toBe(X);
        expect(_stack.groupbyChannels).toEqual([]);
      }
    });

    it('should be correct for vertical', () => {
      for (const stackableMark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark: stackableMark,
          encoding: {
            y: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
            x: {field: 'variety', type: 'nominal'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack.fieldChannel).toBe(Y);
        expect(_stack.groupbyChannels).toEqual([X]);
      }
    });

    it('should be correct for vertical (single)', () => {
      for (const stackableMark of [BAR, AREA]) {
        const spec: TopLevel<NormalizedUnitSpec> = {
          data: {url: 'data/barley.json'},
          mark: stackableMark,
          encoding: {
            y: {aggregate: 'sum', field: 'yield', type: 'quantitative'},
            color: {field: 'site', type: 'nominal'}
          }
        };
        const _stack = stack(spec.mark, spec.encoding);
        expect(_stack.fieldChannel).toBe(Y);
        expect(_stack.groupbyChannels).toEqual([]);
      }
    });

    it('should be correct for pie', () => {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark: 'arc',
        encoding: {
          theta: {field: 'field', type: 'quantitative'},
          color: {field: 'id', type: 'nominal'}
        }
      };
      const _stack = stack(spec.mark, spec.encoding);
      expect(_stack.fieldChannel).toBe('theta');
      expect(_stack.stackBy[0].channel).toBe('color');
    });

    it('should be correct for radial chart with same radius and theta field', () => {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark: 'arc',
        encoding: {
          theta: {field: 'field', type: 'quantitative', stack: true},
          radius: {
            field: 'field',
            type: 'quantitative',
            scale: {type: 'sqrt', zero: true, range: [20, 100]}
          }
        }
      };
      const _stack = stack(spec.mark, spec.encoding);
      expect(_stack.fieldChannel).toBe('theta');
      expect(_stack.groupbyChannels).toHaveLength(0);
      expect(_stack.groupbyFields.size).toBe(0);
    });

    it('should be correct for radial chart with different radius and theta fields', () => {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark: 'arc',
        encoding: {
          theta: {field: 'year', type: 'quantitative', stack: true},
          radius: {
            field: 'variety',
            type: 'quantitative',
            scale: {type: 'sqrt', zero: true, range: [20, 100]}
          }
        }
      };
      const _stack = stack(spec.mark, spec.encoding);
      expect(_stack.fieldChannel).toBe('theta');
      expect(_stack.groupbyChannels).toHaveLength(0);
      expect(_stack.groupbyFields.size).toBe(0);
    });
  });

  describe('stack().offset', () => {
    it('should be zero for stackable marks with at least of of the stack channel if stacked is unspecified or true', () => {
      for (const s of [undefined, true]) {
        for (const stackableMark of [BAR, AREA]) {
          const spec: TopLevel<NormalizedUnitSpec> = {
            data: {url: 'data/barley.json'},
            mark: stackableMark,
            encoding: {
              x: {aggregate: 'sum', field: 'yield', type: 'quantitative', stack: s},
              y: {field: 'variety', type: 'nominal'},
              color: {field: 'site', type: 'nominal'}
            }
          };
          expect(stack(spec.mark, spec.encoding).offset).toBe('zero');
        }
      }
    });

    it('should be the specified stacked for stackable marks with at least one of the stack channel', () => {
      for (const s of ['center', 'zero', 'normalize'] as const) {
        for (const stackableMark of [BAR, AREA]) {
          const spec: TopLevel<NormalizedUnitSpec> = {
            data: {url: 'data/barley.json'},
            mark: stackableMark,
            encoding: {
              x: {aggregate: 'sum', field: 'yield', type: 'quantitative', stack: s},
              y: {field: 'variety', type: 'nominal'},
              color: {field: 'site', type: 'nominal'}
            }
          };
          expect(stack(spec.mark, spec.encoding).offset).toEqual(s);
        }
      }
    });

    it('should impute area', () => {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark: 'area',
        encoding: {
          x: {aggregate: 'sum', field: 'yield', type: 'quantitative', stack: 'zero'},
          y: {field: 'variety', type: 'nominal'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      expect(stack(spec.mark, spec.encoding).impute).toBeTruthy();
    });

    it('should allow disabling of imputation', () => {
      const spec: TopLevel<NormalizedUnitSpec> = {
        data: {url: 'data/barley.json'},
        mark: 'area',
        encoding: {
          x: {aggregate: 'sum', field: 'yield', type: 'quantitative', stack: 'zero', impute: null},
          y: {field: 'variety', type: 'nominal'},
          color: {field: 'site', type: 'nominal'}
        }
      };
      expect(stack(spec.mark, spec.encoding).impute).toBeFalsy();
    });
  });
});
