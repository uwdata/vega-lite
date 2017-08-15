/* tslint:disable quotemark */

import {assert} from 'chai';
import {ROW, SHAPE} from '../../src/channel';
import {FacetModel} from '../../src/compile/facet';
import {Facet} from '../../src/facet';
import {PositionFieldDef} from '../../src/fielddef';
import * as log from '../../src/log';
import {ORDINAL} from '../../src/type';
import {VgLayout} from '../../src/vega.schema';
import {parseFacetModel, parseFacetModelWithScale} from '../util';

describe('FacetModel', function() {
  describe('initFacet', () => {
    it('should drop unsupported channel and throws warning', () => {
      log.runLocalLogger((localLogger) => {
        const model = parseFacetModel({
          facet: ({
            shape: {field: 'a', type: 'quantitative'}
          }) as Facet<string>, // Cast to allow invalid facet type for test
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        assert.equal(model.facet['shape'], undefined);
        assert.equal(localLogger.warns[0], log.message.incompatibleChannel(SHAPE, 'facet'));
      });
    });

    it('should drop channel without field and value and throws warning', () => {
      log.runLocalLogger((localLogger) => {
        const model = parseFacetModel({
          facet: {
            row: {type: 'ordinal'}
          },
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        assert.equal(model.facet.row, undefined);
        assert.equal(localLogger.warns[0], log.message.emptyFieldDef({type: ORDINAL}, ROW));
      });
    });

    it('should drop channel without field and value and throws warning', () => {
      log.runLocalLogger((localLogger) => {
        const model = parseFacetModel({
          facet: {
            row: {field: 'a', type: 'quantitative'}
          },
          spec: {
            mark: 'point',
            encoding: {}
          }
        });
        assert.deepEqual<PositionFieldDef<string>>(model.facet.row, {field: 'a', type: 'quantitative'});
        assert.equal(localLogger.warns[0], log.message.facetChannelShouldBeDiscrete(ROW));
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
          column: {timeUnit:'year', field: 'date', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'}
          }
        }
      });
      model.parseAxisAndHeader();
      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(function(d){
        return d.name === "column_header";
      })[0];

      assert(columnHeader.title.text.signal, "timeFormat(parent[\"year_date\"], '%Y')");
    });

    it('applies number format for fieldref of a quantitative field', () => {
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
        }
      });
      model.parseAxisAndHeader();
      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(function(d){
        return d.name === "column_header";
      })[0];

      assert(columnHeader.title.text.signal, "format(parent[\"a\"], 'd')");
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
      model.parseAxisAndHeader();
      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(function(d){
        return d.name === "column_header";
      })[0];

      assert(columnHeader.title.text.signal, "parent[\"a\"]");
    });
  });

  describe('parseScale', () => {
    it('should correctly set scale component for a model', () => {
      const model = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'quantitative'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        }
      });


      assert(model.component.scales['x']);
    });

    it('should create independent scales if resolve is set to independent', () => {
      const model = parseFacetModelWithScale({
        facet: {
          row: {field: 'a', type: 'quantitative'}
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

      assert(!model.component.scales['x']);
    });
  });

  describe('assembleScales', () => {
    it('includes shared scales, but not independent scales (as they are nested).', () => {
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

      const scales = model.assembleScales();
      assert.equal(scales.length, 1);
      assert.equal(scales[0].name, 'y');
    });
  });

  describe('assembleHeaderMarks', () => {
    it('should sort headers in ascending order', () => {
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
        }
      });
      model.parseAxisAndHeader();

      const headerMarks = model.assembleHeaderMarks();
      const columnHeader = headerMarks.filter(function(d){
        return d.name === "column_header";
      })[0];

      assert.deepEqual(columnHeader.sort, {field: 'datum["a"]', order: 'ascending'});
    });
  });

  describe('assembleGroup', () => {
    it('includes a columns fields in the encode block for facet with column that parent is also a facet.', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'quantitative'}
        },
        spec: {
         facet: {
            column: {field: 'c', type: 'quantitative'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        }
      });
      model.parseData();
      const group = model.child.assembleGroup([]);
      assert.deepEqual(group.encode.update.columns, {field: 'distinct_c'});
    });
  });

  describe('assembleLayout', () => {
    it('returns a layout with a column signal for facet with column', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'quantitative'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'b', type: 'quantitative'}
          }
        }
      });
      const layout = model.assembleLayout();
      assert.deepEqual<VgLayout>(layout, {
        padding: {row: 10, column: 10},
        offset: 10,
        columns: {
          signal: "length(data('column_domain'))"
        },
        bounds: 'full',
        align: 'all'
      });
    });

    it('returns a layout without a column signal for facet with column that parent is also a facet.', () => {
      const model = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'quantitative'}
        },
        spec: {
         facet: {
            column: {field: 'c', type: 'quantitative'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        }
      });
      const layout = model.child.assembleLayout();
      assert.deepEqual(layout.columns, undefined);
    });

    it('returns a layout with header band if child spec is also a facet', () => {
      const model = parseFacetModelWithScale({
        "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
        "data": {"url": "data/cars.json"},
        "facet": {"row": {"field": "Origin","type": "ordinal"}},
        "spec": {
          "facet": {"row": {"field": "Cylinders","type": "ordinal"}},
          "spec": {
            "mark": "point",
            "encoding": {
              "x": {"field": "Horsepower","type": "quantitative"},
              "y": {"field": "Acceleration","type": "quantitative"}
            }
          }
        }
      });
      model.parseLayoutSize();
      model.parseAxisAndHeader();
      const layout = model.assembleLayout();
      assert.deepEqual(layout.headerBand, {row: 0.5});
    });
  });

  describe('assembleMarks', () => {
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

      assert(marks[0].from.facet.aggregate.cross);
      assert.deepEqual(marks[0].sort, {
        field: [
          'datum["a"]',
          'datum["b"]'
        ],
        order: [
          'ascending',
          'ascending'
        ]
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

      assert.deepEqual(marks[0].from.facet.aggregate, {
        fields: ['b', 'c'],
        ops: ['distinct', 'distinct']
      });
    });

    it('should add calculate cardinality for child column facet', () => {
      const model: FacetModel = parseFacetModelWithScale({
        facet: {
          column: {field: 'a', type: 'quantitative'}
        },
        spec: {
         facet: {
            column: {field: 'c', type: 'quantitative'}
          },
          spec: {
            mark: 'point',
            encoding: {
              x: {field: 'b', type: 'quantitative'}
            }
          }
        }
      });
      model.parse();

      const marks = model.assembleMarks();

      assert.deepEqual(marks[0].from.facet.aggregate, {
        fields: ['c'],
        ops: ['distinct']
      });
    });
  });
});
