import type {SignalRef} from 'vega';
import {ROW} from '../../src/channel';
import {FacetModel} from '../../src/compile/facet';
import {assembleLabelTitle} from '../../src/compile/header/assemble';
import * as log from '../../src/log';
import {DEFAULT_SPACING} from '../../src/spec/base';
import {FacetFieldDef, FacetMapping} from '../../src/spec/facet';
import {ORDINAL} from '../../src/type';
import {parseFacetModel, parseFacetModelWithScale} from '../util';

describe('FacetModel', () => {
  describe('initFacet', () => {
    it(
      'should drop channel without field and value and throws warning',
      log.wrap(localLogger => {
        const model = parseFacetModel({
          facet: {
            row: {type: 'ordinal'}
          },
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        expect(model.facet).not.toHaveProperty('row');
        expect(localLogger.warns[0]).toEqual(log.message.emptyFieldDef({type: ORDINAL}, ROW));
      })
    );

    it(
      'should throw warning about quantitative field used for faceting',
      log.wrap(localLogger => {
        const model = parseFacetModel({
          facet: {
            row: {field: 'a', type: 'quantitative'}
          },
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        expect(model.facet).toEqual({row: {field: 'a', type: 'quantitative'}});
        expect(localLogger.warns[0]).toEqual(log.message.channelShouldBeDiscrete(ROW));
      })
    );

    it('converts orient to titleOrient and labelOrient', () => {
      const model = parseFacetModel({
        facet: {
          row: {field: 'a', type: 'nominal', header: {orient: 'right'}}
        },
        spec: {
          mark: 'point',
          encoding: {}
        }
      });
      expect(model.facet).toEqual({
        row: {field: 'a', type: 'nominal', header: {titleOrient: 'right', labelOrient: 'right'}}
      });
    });

    it('keeps header: null', () => {
      const model = parseFacetModel({
        facet: {
          row: {field: 'a', type: 'nominal', header: null}
        },
        spec: {
          mark: 'point',
          encoding: {}
        }
      });
      expect(model.facet).toEqual({
        row: {field: 'a', type: 'nominal', header: null}
      });
    });
  });

  describe('parseAxisAndHeader', () => {
    // TODO: add more tests
    // - correctly join title for nested facet
    // - correctly generate headers with right labels and axes

    it('applies text format to the fieldref of a temporal field', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {timeUnit: 'year', field: 'date', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parseAxesAndHeaders();
      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(d => {
        return d.name === 'column_header';
      })[0];

      expect(columnHeader.title.text.signal).toBeTruthy();
    });

    it('applies number format for fieldref of a quantitative field', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'nominal', header: {format: 'd'}}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parseAxesAndHeaders();
      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(d => {
        return d.name === 'column_header';
      })[0];

      expect(columnHeader.title.text.signal).toBeTruthy();
    });

    it('ignores number format for fieldref of a binned field', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {bin: true, field: 'a', type: 'quantitative'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parseAxesAndHeaders();
      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(d => {
        return d.name === 'column_header';
      })[0];

      expect(columnHeader.title.text.signal).toBeTruthy();
    });
  });

  describe('parseScale', () => {
    it('should correctly set scale component for a model', () => {
      const model = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        }
      });

      expect(model.component.scales['x']).toBeTruthy();
    });

    it('should create independent scales if resolve is set to independent', () => {
      const model = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        },
        resolve: {
          scale: {
            x: 'independent'
          }
        }
      });

      expect(!model.component.scales['x']).toBeTruthy();
    });
  });

  describe('assembleHeaderMarks', () => {
    it('should sort headers in ascending order', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parseAxesAndHeaders();

      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(d => {
        return d.name === 'column_header';
      })[0];

      expect(columnHeader.sort).toEqual({field: 'datum["a"]', order: 'ascending'});
    });
  });

  describe('assembleGroup', () => {
    it('includes a columns fields in the encode block for facet with column that parent is also a facet.', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'ordinal'}
        },
        spec: {
          facet: {
            column: {field: 'c', type: 'ordinal'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        }
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);
      model.parseData();
      const group = model.child.assembleGroup([]);
      expect(group.encode.update.columns).toEqual({field: 'distinct_c'});
    });
  });

  describe('assembleLayout', () => {
    it('returns a layout with a column signal for facet with column', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        }
      });
      const layout = model.assembleLayout();
      expect(layout).toEqual({
        padding: DEFAULT_SPACING,
        columns: {
          signal: "length(data('column_domain'))"
        },
        bounds: 'full',
        align: 'all'
      });
    });

    it('should not align independent scales for column', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'ordinal'}
          }
        },
        resolve: {
          scale: {
            x: 'independent'
          }
        }
      });
      const layout = model.assembleLayout();
      expect(layout).toEqual({
        padding: DEFAULT_SPACING,
        columns: {
          signal: "length(data('column_domain'))"
        },
        bounds: 'full',
        align: 'none'
      });
    });

    it('should not align independent scales for row', () => {
      const model = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            y: {field: 'b', type: 'ordinal'}
          }
        },
        resolve: {
          scale: {
            y: 'independent'
          }
        }
      });
      const layout = model.assembleLayout();
      expect(layout).toEqual({
        padding: DEFAULT_SPACING,
        columns: 1,
        bounds: 'full',
        align: 'none'
      });
    });

    it('returns a layout without a column signal for facet with column that parent is also a facet.', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'ordinal'}
        },
        spec: {
          facet: {
            column: {field: 'c', type: 'ordinal'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        }
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);
      const layout = model.child.assembleLayout();
      expect(layout).not.toHaveProperty('columns');
    });

    it('correctly applies columns config.', () => {
      const model = parseFacetModelWithScale({
        facet: {field: 'a', type: 'ordinal'},
        spec: {
          facet: {
            column: {field: 'c', type: 'ordinal'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        },
        config: {facet: {columns: 3}}
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);

      expect(model.layout).toMatchObject({columns: 3});
    });

    it('returns a layout with header band if child spec is also a facet', () => {
      const model = parseFacetModelWithScale({
        data: {url: 'data/cars.json'},
        facet: {row: {field: 'Origin', type: 'ordinal'}},
        spec: {
          facet: {row: {field: 'Cylinders', type: 'ordinal'}},
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'Horsepower', type: 'quantitative'},
              y: {field: 'Acceleration', type: 'quantitative'}
            }
          }
        }
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);
      model.parseLayoutSize();
      model.parseAxesAndHeaders();
      const layout = model.assembleLayout();
      expect(layout.headerBand).toEqual({row: 0.5});
    });

    it('returns a layout with titleAnchor ="end" when titleOrient is right', () => {
      const model = parseFacetModelWithScale({
        data: {url: 'data/cars.json'},
        facet: {row: {field: 'Origin', type: 'ordinal', header: {titleOrient: 'right'}}},
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'Horsepower', type: 'quantitative'},
            y: {field: 'Acceleration', type: 'quantitative'}
          }
        }
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);
      model.parseLayoutSize();
      model.parseAxesAndHeaders();
      const layout = model.assembleLayout();
      expect(layout.titleAnchor).toEqual({row: 'end'});
    });

    it('returns a layout with titleAnchor ="end" when titleOrient is bottom', () => {
      const model = parseFacetModelWithScale({
        data: {url: 'data/cars.json'},
        facet: {column: {field: 'Origin', type: 'ordinal', header: {titleOrient: 'bottom'}}},
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'Horsepower', type: 'quantitative'},
            y: {field: 'Acceleration', type: 'quantitative'}
          }
        }
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);
      model.parseLayoutSize();
      model.parseAxesAndHeaders();
      const layout = model.assembleLayout();
      expect(layout.titleAnchor).toEqual({column: 'end'});
    });
  });

  describe('assembleMarks', () => {
    it('add label title for orthogonal orient label', () => {
      const facet: FacetMapping<string, FacetFieldDef<string, SignalRef>> = {
        row: {field: 'a', type: 'ordinal', header: {labelOrient: 'top'}}
      };
      const model: FacetModel = parseFacetModelWithScale({
        facet,
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].title).toEqual(assembleLabelTitle(facet.row, 'row', model.config));
    });

    it('should add cross and sort if we facet by multiple dimensions', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal'},
          column: {field: 'b', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].from.facet.aggregate.cross).toBeTruthy();
      expect(marks[0].sort).toEqual({
        field: ['datum["a"]', 'datum["b"]'],
        order: ['ascending', 'ascending']
      });
    });

    it('should add cross and sort if we facet by multiple dimensions with sort array', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal', sort: ['a1', 'a2']},
          column: {field: 'b', type: 'ordinal', sort: ['b1', 'b2']}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].from.facet.aggregate.cross).toBeTruthy();
      expect(marks[0].sort).toEqual({
        field: ['datum["row_a_sort_index"]', 'datum["column_b_sort_index"]'],
        order: ['ascending', 'ascending']
      });
    });

    it('should add cross and sort if we facet by multiple dimensions with sort fields', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal', sort: {field: 'd', op: 'median'}},
          column: {field: 'b', type: 'ordinal', sort: {field: 'e', op: 'median'}}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].from.facet.aggregate).toEqual({
        cross: true
      });

      expect(marks[0].sort).toEqual({
        field: ['datum["median_d_by_a"]', 'datum["median_e_by_b"]'],
        order: ['ascending', 'ascending']
      });
    });

    it('should add calculate cardinality for independent scales', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: 'rect',
          encoding: {
            x: {field: 'b', type: 'nominal'},
            y: {field: 'c', type: 'nominal'}
          }
        },
        resolve: {
          scale: {
            x: 'independent',
            y: 'independent'
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].from.facet.aggregate).toEqual({
        fields: ['b', 'c'],
        ops: ['distinct', 'distinct'],
        as: ['distinct_b', 'distinct_c']
      });
    });

    it('should add calculate cardinality for child column facet', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'nominal'}
        },
        spec: {
          facet: {
            column: {field: 'c', type: 'nominal'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        }
        // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
      } as any);
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].from.facet.aggregate).toEqual({
        fields: ['c'],
        ops: ['distinct'],
        as: ['distinct_c']
      });
    });

    it('includes both bin start and end in the facet groupby', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          column: {bin: true, field: 'a', type: 'quantitative'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      expect(marks[0].from.facet.groupby).toEqual(['bin_maxbins_6_a', 'bin_maxbins_6_a_end']);
    });
  });
});
