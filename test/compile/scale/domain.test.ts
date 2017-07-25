/* tslint:disable:quotemark */

import {assert} from 'chai';
import {ScaleChannel} from '../../../src/channel';
import {domainSort, mergeDomains, parseDomainForChannel} from '../../../src/compile/scale/domain';
import {parseScaleCore} from '../../../src/compile/scale/parse';
import {UnitModel} from '../../../src/compile/unit';
import {MAIN} from '../../../src/data';
import {PositionFieldDef} from '../../../src/fielddef';
import * as log from '../../../src/log';
import {ScaleType} from '../../../src/scale';
import {SortField} from '../../../src/sort';
import {FieldRefUnionDomain, VgDataRef, VgDomain, VgSortField} from '../../../src/vega.schema';
import {parseUnitModel} from '../../util';

describe('compile/scale', () => {
  describe('parseDomainForChannel()', () => {
    function testParseDomainForChannel(model: UnitModel, channel: ScaleChannel) {
      // Cannot parseDomain before parseScaleCore
      parseScaleCore(model);
      return parseDomainForChannel(model, channel);
    }

    it('should have correct domain with x and x2 channel', function() {
      const model = parseUnitModel({
          mark: 'bar',
          encoding: {
            x: {field: 'a', type: 'quantitative'},
            x2: {field: 'b', type: 'quantitative'},
            y: {field: 'c', type: 'quantitative'},
            y2: {field: 'd', type: 'quantitative'}
          }
        });

      const xDomain = testParseDomainForChannel(model, 'x');
      assert.deepEqual(xDomain, [{data: 'main', field: 'a'}, {data: 'main', field: 'b'}]);

      const yDomain = testParseDomainForChannel(model, 'y');
      assert.deepEqual(yDomain, [{data: 'main', field: 'c'}, {data: 'main', field: 'd'}]);
    });

    it('should have correct domain for color', function() {
      const model = parseUnitModel({
          mark: 'bar',
          encoding: {
            color: {field: 'a', type: 'quantitative'},
          }
        });

      const xDomain = testParseDomainForChannel(model, 'color');
      assert.deepEqual(xDomain, [{data: 'main', field: 'a'}]);
    });

    it('should have correct domain for color ConditionField', function() {
      const model = parseUnitModel({
          mark: 'bar',
          encoding: {
            color: {
              condition: {selection: 'sel', field: 'a', type: 'quantitative'}
            }
          }
        });

      const xDomain = testParseDomainForChannel(model, 'color');
      assert.deepEqual(xDomain, [{data: 'main', field: 'a'}]);
    });

    it('should return domain for stack', function() {
      const model = parseUnitModel({
        mark: "bar",
        encoding: {
          y: {
            aggregate: 'sum',
            field: 'origin',
            type: 'quantitative'
          },
          x: {field: 'x', type: "ordinal"},
          color: {field: 'color', type: "ordinal"}
        }
      });

      assert.deepEqual(testParseDomainForChannel(model,'y'), [{
        data: 'main',
        field: 'sum_origin_start'
      }, {
        data: 'main',
        field: 'sum_origin_end'
      }]);
    });

    it('should return normalize domain for stack if specified', function() {
      const model = parseUnitModel({
        mark: "bar",
        encoding: {
          y: {
            aggregate: 'sum',
            field: 'origin',
            type: 'quantitative'
          },
          x: {field: 'x', type: "ordinal"},
          color: {field: 'color', type: "ordinal"}
        },
        config: {
          stack: "normalize"
        }
      });

      assert.deepEqual(testParseDomainForChannel(model,'y'), [[0, 1]]);
    });

    describe('for quantitative', function() {
      it('should return the right domain for binned Q', log.wrap((localLogger) => {
        const fieldDef: PositionFieldDef<string> = {
          bin: {maxbins: 15},
          field: 'origin',
          scale: {domain: 'unaggregated'},
          type: 'quantitative'
        };
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: fieldDef
          }
        });

        assert.deepEqual(testParseDomainForChannel(model,'y'), [{
            data: 'main',
            field: 'bin_maxbins_15_origin_start'
          }, {
            data: 'main',
            field: 'bin_maxbins_15_origin_end'
          }]);

        assert.equal(localLogger.warns[0], log.message.unaggregateDomainHasNoEffectForRawField(fieldDef));
      }));

      it('should return the unaggregated domain if requested for non-bin, non-sum Q',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                aggregate: 'mean',
                field: 'acceleration',
                scale: {domain: 'unaggregated'},
                type: "quantitative"
              }
            }
          });

          assert.deepEqual(testParseDomainForChannel(model,'y'), [{
            data: MAIN,
            field: 'min_acceleration'
          }, {
            data: MAIN,
            field: 'max_acceleration'
          }]);
        });

      it('should return the aggregated domain for sum Q', log.wrap((localLogger) => {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              aggregate: 'sum',
              field: 'origin',
              scale: {domain: 'unaggregated'},
              type: "quantitative"
            }
          }
        });
        testParseDomainForChannel(model,'y');
        assert.equal(
          localLogger.warns[0], log.message.unaggregateDomainWithNonSharedDomainOp('sum')
        );
      }));

      it('should return the right custom domain', () => {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              field: 'horsepower',
              type: "quantitative",
              scale: {domain: [0,200]}
            }
          }
        });
        const _domain = testParseDomainForChannel(model,'y');

        assert.deepEqual(_domain, [[0, 200]]);
      });

      it('should ignore the custom domain when binned', log.wrap((localLogger) => {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              field: 'origin',
              type: 'quantitative',
              scale: {domain: [0,200]},
              bin: {maxbins: 15}
            }
          }
        });
        const _domain = testParseDomainForChannel(model,'y');

        assert.deepEqual(_domain, [{
            data: 'main',
            field: 'bin_maxbins_15_origin_start'
          }, {
            data: 'main',
            field: 'bin_maxbins_15_origin_end'
          }]);
        assert.equal(localLogger.warns[0], log.message.conflictedDomain("y"));
      }));

      it('should return the aggregated domain if we do not override it', function() {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              aggregate: 'min',
              field: 'origin',
              type: "quantitative"
            }
          }
        });

        assert.deepEqual(testParseDomainForChannel(model,'y'), [
          {
            data: 'main',
            field: 'min_origin'
          }
        ]);
      });

      it('should use the aggregated data for domain if specified in config', function() {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              aggregate: 'min',
              field: 'acceleration',
              type: "quantitative"
            }
          },
          config: {
            scale: {
              useUnaggregatedDomain: true
            }
          }
        });

        assert.deepEqual(testParseDomainForChannel(model,'y'), [{
            data: MAIN,
            field: 'min_acceleration'
          }, {
            data: MAIN,
            field: 'max_acceleration'
          }]);
      });
    });

    describe('for time', function() {
      it('should return the correct domain for month T',
        function() {
          const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {
                field: 'origin',
                type: "temporal",
                timeUnit: 'month'
              }
            }
          });
          const _domain = testParseDomainForChannel(model,'y');
          assert.deepEqual(_domain, [{data: 'main', field: 'month_origin', sort: true}]);
        });

        it('should return the correct domain for yearmonth T',
          function() {
            const model = parseUnitModel({
              mark: "point",
              encoding: {
                y: {
                  field: 'origin',
                  type: "temporal",
                  timeUnit: 'yearmonth'
                }
              }
            });
            const _domain = testParseDomainForChannel(model,'y');

            assert.deepEqual(_domain, [{data: 'main', field: 'yearmonth_origin'}]);
          });


        it('should return the correct domain for yearmonth T when specify sort',
          function() {
            const sortDef: SortField = {op: 'mean', field: 'precipitation', order: 'descending'} ;
            const model = parseUnitModel({
              mark: "line",
              encoding: {
                x: {
                  timeUnit: 'month',
                  field: 'date',
                  type: 'temporal',
                  sort: sortDef
                },
                y: {
                  aggregate: 'mean',
                  field: 'precipitation',
                  type: 'quantitative'
                }
              }
            });
            const _domain = testParseDomainForChannel(model,'x');

            assert.deepEqual(_domain, [{
              data: 'raw',
              field: 'month_date',
              sort: sortDef
            }]);
        });

      it('should return the right custom domain with DateTime objects', () => {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {
              field: 'year',
              type: "temporal",
              scale: {domain: [{year: 1970}, {year: 1980}]}
            }
          }
        });
        const _domain = testParseDomainForChannel(model,'y');

        assert.deepEqual(_domain, [
          {"signal": "datetime(1970, 0, 1, 0, 0, 0, 0)"},
          {"signal": "datetime(1980, 0, 1, 0, 0, 0, 0)"}
        ]);
      });
    });

    describe('for nominal', function() {
      it('should return correct domain with the provided sort property', function() {
        const sortDef: SortField = {op: 'min' as 'min', field:'Acceleration'};
        const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {field: 'origin', type: "nominal", sort: sortDef}
            }
          });
        assert.deepEqual(testParseDomainForChannel(model,'y'), [{
            data: "raw",
            field: 'origin',
            sort: sortDef
          }]);
      });

      it('should return correct domain with the provided sort property with order property', function() {
        const sortDef: SortField = {op: 'min', field:'Acceleration', order: "descending"} ;
        const model = parseUnitModel({
            mark: "point",
            encoding: {
              y: {field: 'origin', type: "nominal", sort: sortDef}
            }
          });

        assert.deepEqual(testParseDomainForChannel(model,'y'), [{
            data: "raw",
            field: 'origin',
            sort: sortDef
        }]);
      });

      it('should return correct domain without sort if sort is not provided', function() {
        const model = parseUnitModel({
          mark: "point",
          encoding: {
            y: {field: 'origin', type: "nominal"}
          }
        });

        assert.deepEqual(testParseDomainForChannel(model,'y'), [{
          data: "main",
          field: 'origin',
          sort: true
        }]);
      });
    });
  });

  describe('mergeDomains()', () => {
    it('should merge the same domains', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean'}
      }, {
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean'}
      }]);

      assert.deepEqual<VgDomain>(domain, {
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean'}
      });
    });

    it('should drop field if op is count', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {op: 'count', field: 'b'}
      }]);

      assert.deepEqual<VgDomain>(domain, {
        data: 'foo',
        field: 'a',
        sort: {op: 'count'}
      });
    });

    it('should sort the output domain, if one domain is sorted', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a'
      }, {
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean', order: 'descending'}
      }]);

      assert.deepEqual<VgDomain>(domain, {
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean', order: 'descending'}
      });
    });

    it('should ignore order: ascending', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean', order: 'ascending'}
      }, {
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean'}
      }]);

      assert.deepEqual<VgDomain>(domain, {
        data: 'foo',
        field: 'a',
        sort: {field: 'b', op: 'mean'}
      });
    });

    it('should merge domains with the same data', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a'
      }, {
        data: 'foo',
        field: 'b'
      }]);

      assert.deepEqual<VgDomain>(domain, {
        data: 'foo',
        fields: ['a', 'b'],
        sort: true
      });
    });

    it('should maintain sort even if false', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: false
      }, {
        data: 'foo',
        field: 'b',
      }]);

      assert.deepEqual(domain, {
        data: 'foo',
        fields: ['a', 'b'],
        sort: false
      });
    });

    it('should ignore sort false if there is another sort', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: false
      }, {
        data: 'foo',
        field: 'b',
        sort: {
          op: 'count'
        }
      }]);

      assert.deepEqual<VgDomain>(domain, {
        data: 'foo',
        fields: ['a', 'b'],
        sort: {
          op: 'count'
        }
      });
    });

    it('should merge domains with different data', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a'
      }, {
        data: 'bar',
        field: 'a'
      }]);

      assert.deepEqual(domain, {
        fields: [{
          data: 'foo',
          field: 'a'
        }, {
          data: 'bar',
          field: 'a'
        }],
        sort: true
      });
    });

    it('should merge domains with different data and sort', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {
          op: 'count'
        }
      }, {
        data: 'bar',
        field: 'a'
      }]);

      assert.deepEqual<VgDomain>(domain, {
        fields: [{
          data: 'foo',
          field: 'a'
        }, {
          data: 'bar',
          field: 'a'
        }],
        sort: {
          op: 'count'
        }
      });
    });

    it('should merge domains with the same and different data', () => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a'
      }, {
        data: 'foo',
        field: 'b'
      }, {
        data: 'bar',
        field: 'a'
      }]);

      assert.deepEqual(domain, {
        fields: [{
          data: 'foo',
          field: 'a'
        }, {
          data: 'foo',
          field: 'b'
        }, {
          data: 'bar',
          field: 'a'
        }],
        sort: true
      });
    });

    it('should merge signal domains', () => {
      const domain = mergeDomains([{
        signal: 'foo'
      }, {
        data: 'bar',
        field: 'a'
      }]);

      assert.deepEqual(domain, {
        fields: [{
            signal: 'foo'
          }, {
            data: 'bar',
            field: 'a'
          }
        ],
        sort: true
      });
    });

    it('should warn if sorts conflict', log.wrap((localLogger) => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {
          op: 'count'
        }
      }, {
        data: 'foo',
        field: 'b',
        sort: true
      }]);

      assert.deepEqual(domain, {
        data: 'foo',
        fields: ['a', 'b'],
        sort: true
      });

      assert.equal(localLogger.warns[0], log.message.MORE_THAN_ONE_SORT);
    }));

    it('should warn if sorts conflict even if we do not union', log.wrap((localLogger) => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {
          op: 'count'
        }
      }, {
        data: 'foo',
        field: 'a',
        sort: true
      }]);

      assert.deepEqual(domain, {
        data: 'foo',
        field: 'a',
        sort: true
      });

      assert.equal(localLogger.warns[0], log.message.MORE_THAN_ONE_SORT);
    }));

    it('should warn if we had to drop complex sort', log.wrap((localLogger) => {
      const domain = mergeDomains([{
        data: 'foo',
        field: 'a',
        sort: {
          op: 'mean',
          field: 'c'
        }
      }, {
        data: 'foo',
        field: 'b'
      }]);

      assert.deepEqual(domain, {
        data: 'foo',
        fields: ['a', 'b'],
        sort: true
      });

      assert.equal(localLogger.warns[0], log.message.domainSortDropped({
        op: 'mean',
        field: 'c'
      }));
    }));
  });

  describe('domainSort()', () => {
    it('should return undefined for discrete domain', () => {
      const model = parseUnitModel({
          mark: 'bar',
          encoding: {
            x: {field: 'a', type: 'quantitative'},
          }
        });
      const sort = domainSort(model, 'x', ScaleType.LINEAR);
      assert.deepEqual(sort, undefined);
    });

    it('should return normal sort spec if specified and aggregration is not count', () => {
      const model = parseUnitModel({
        mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'nominal', sort:{op: 'sum', field:'y'}},
          y: {field: 'b', aggregate: 'sum', type: 'quantitative'}
        }
      });
      const sort = domainSort(model, 'x', ScaleType.ORDINAL);
      assert.deepEqual<VgSortField>(sort, {op: 'sum', field: 'y'});
    });

    it('should return normal sort spec if aggregration is count and field not specified', () => {
      const model = parseUnitModel({
        mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'nominal', sort:{op: 'count'}},
          y: {field: 'b', aggregate: 'sum', type: 'quantitative'}
        }
      });
      const sort = domainSort(model, 'x', ScaleType.ORDINAL);
      assert.deepEqual<VgSortField>(sort, {op: 'count'});
    });

    it('should return true if sort specified', () => {
      const model = parseUnitModel({
        mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'nominal'},
          y: {field: 'b', aggregate: 'sum', type: 'quantitative'}
        }
      });
      const sort = domainSort(model, 'x', ScaleType.ORDINAL);
      assert.deepEqual(sort, true);
    });

    it('should return undefined if sort is not specified', () => {
      const model = parseUnitModel({
        mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'nominal', sort: "descending"},
          y: {field: 'b', aggregate: 'sum', type: 'quantitative'}
        }
      });
      assert.deepEqual<VgSortField>(domainSort(model, 'x', ScaleType.ORDINAL), {op: 'min', field: 'a', order: 'descending'});
    });
  });
});
