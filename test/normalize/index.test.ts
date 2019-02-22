/* tslint:disable:quotemark */
import {defaultConfig, initConfig} from '../../src/config';
import * as log from '../../src/log';
import {LocalLogger} from '../../src/log';
import {normalize} from '../../src/normalize/index';

// describe('isStacked()') -- tested as part of stackOffset in stack.test.ts

describe('normalize()', () => {
  describe('normalizeFacetedUnit', () => {
    it('should convert single extended spec with column into a composite spec', () => {
      const spec: any = {
        name: 'faceted',
        width: 123,
        height: 234,
        description: 'faceted spec',
        data: {url: 'data/movies.json'},
        mark: 'point',
        encoding: {
          column: {field: 'MPAA_Rating', type: 'ordinal'},
          x: {field: 'Worldwide_Gross', type: 'quantitative'},
          y: {field: 'US_DVD_Sales', type: 'quantitative'}
        }
      };
      const config = initConfig(spec.config);
      expect(normalize(spec, config)).toEqual({
        name: 'faceted',
        description: 'faceted spec',
        data: {url: 'data/movies.json'},
        facet: {
          column: {field: 'MPAA_Rating', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          width: 123,
          height: 234,
          encoding: {
            x: {field: 'Worldwide_Gross', type: 'quantitative'},
            y: {field: 'US_DVD_Sales', type: 'quantitative'}
          }
        }
      });
    });

    it('should convert single extended spec with row into a composite spec', () => {
      const spec: any = {
        data: {url: 'data/movies.json'},
        mark: 'point',
        encoding: {
          row: {field: 'MPAA_Rating', type: 'ordinal'},
          x: {field: 'Worldwide_Gross', type: 'quantitative'},
          y: {field: 'US_DVD_Sales', type: 'quantitative'}
        }
      };

      const config = initConfig(spec.config);
      expect(normalize(spec, config)).toEqual({
        data: {url: 'data/movies.json'},
        facet: {
          row: {field: 'MPAA_Rating', type: 'ordinal'}
        },
        spec: {
          mark: 'point',
          encoding: {
            x: {field: 'Worldwide_Gross', type: 'quantitative'},
            y: {field: 'US_DVD_Sales', type: 'quantitative'}
          }
        }
      });
    });
  });

  describe('normalizeFacet', () => {
    it('should produce correct layered specs for mean point and vertical error bar', () => {
      expect(
        normalize(
          {
            description:
              'A error bar plot showing mean, min, and max in the US population distribution of age groups in 2000.',
            data: {url: 'data/population.json'},
            transform: [{calculate: "(datum.sex==1) ? 'Men':'Women'", as: 'sex'}],
            facet: {row: {field: 'sex', type: 'ordinal'}},
            spec: {
              layer: [
                {
                  mark: 'errorbar',
                  encoding: {x: {field: 'age', type: 'ordinal'}, y: {field: 'people', type: 'quantitative'}}
                },
                {
                  mark: {type: 'point', opacity: 1, filled: true},
                  encoding: {
                    x: {field: 'age', type: 'ordinal'},
                    y: {field: 'people', type: 'quantitative', aggregate: 'mean'}
                  }
                }
              ]
            }
          },
          defaultConfig
        )
      ).toEqual({
        description:
          'A error bar plot showing mean, min, and max in the US population distribution of age groups in 2000.',
        data: {
          url: 'data/population.json'
        },
        transform: [
          {
            calculate: "(datum.sex==1) ? 'Men':'Women'",
            as: 'sex'
          }
        ],
        facet: {
          row: {
            field: 'sex',
            type: 'ordinal'
          }
        },
        spec: {
          layer: [
            {
              transform: [
                {
                  aggregate: [
                    {op: 'stderr', field: 'people', as: 'extent_people'},
                    {op: 'mean', field: 'people', as: 'center_people'}
                  ],
                  groupby: ['age']
                },
                {
                  calculate: 'datum.center_people + datum.extent_people',
                  as: 'upper_people'
                },
                {
                  calculate: 'datum.center_people - datum.extent_people',
                  as: 'lower_people'
                }
              ],
              layer: [
                {
                  mark: {type: 'rule', style: 'errorbar-rule'},
                  encoding: {
                    y: {
                      field: 'lower_people',
                      type: 'quantitative',
                      title: 'people'
                    },
                    y2: {field: 'upper_people', type: 'quantitative'},
                    x: {field: 'age', type: 'ordinal'},
                    tooltip: [
                      {field: 'center_people', title: 'Mean of people', type: 'quantitative'},
                      {field: 'upper_people', title: 'Mean + stderr of people', type: 'quantitative'},
                      {field: 'lower_people', title: 'Mean - stderr of people', type: 'quantitative'},
                      {field: 'age', type: 'ordinal'}
                    ]
                  }
                }
              ]
            },
            {
              mark: {type: 'point', opacity: 1, filled: true},
              encoding: {
                x: {field: 'age', type: 'ordinal'},
                y: {field: 'people', type: 'quantitative', aggregate: 'mean'}
              }
            }
          ]
        }
      });
    });
  });

  describe('normalizeLayer', () => {
    it('correctly passes shared projection and encoding to children of layer', () => {
      const output = normalize(
        {
          data: {url: 'data/population.json'},
          projection: {type: 'mercator'},
          encoding: {
            x: {field: 'age', type: 'ordinal'}
          },
          layer: [
            {mark: 'point'},
            {
              layer: [
                {mark: 'rule'},
                {
                  mark: 'text',
                  encoding: {
                    text: {field: 'a', type: 'nominal'}
                  }
                }
              ]
            }
          ]
        },
        defaultConfig
      );

      expect(output).toEqual({
        data: {url: 'data/population.json'},
        layer: [
          {
            projection: {type: 'mercator'},
            mark: 'point',
            encoding: {
              x: {field: 'age', type: 'ordinal'}
            }
          },
          {
            layer: [
              {
                projection: {type: 'mercator'},
                mark: 'rule',
                encoding: {
                  x: {field: 'age', type: 'ordinal'}
                }
              },
              {
                projection: {type: 'mercator'},
                mark: 'text',
                encoding: {
                  x: {field: 'age', type: 'ordinal'},
                  text: {field: 'a', type: 'nominal'}
                }
              }
            ]
          }
        ]
      });
    });

    it(
      'correctly overrides shared projection and encoding and throws warnings',
      log.wrap((localLogger: LocalLogger) => {
        const output = normalize(
          {
            data: {url: 'data/population.json'},
            projection: {type: 'mercator'},
            encoding: {
              x: {field: 'age', type: 'ordinal'}
            },
            layer: [
              {
                projection: {type: 'albersUsa'},
                mark: 'rule'
              },
              {
                mark: 'text',
                encoding: {
                  x: {field: 'a', type: 'nominal'}
                }
              }
            ]
          },
          defaultConfig
        );

        expect(localLogger.warns.length).toEqual(2);

        expect(localLogger.warns[0]).toEqual(
          log.message.projectionOverridden({
            parentProjection: {type: 'mercator'},
            projection: {type: 'albersUsa'}
          })
        );

        expect(localLogger.warns[1]).toEqual(log.message.encodingOverridden(['x']));

        expect(output).toEqual({
          data: {url: 'data/population.json'},
          layer: [
            {
              projection: {type: 'albersUsa'},
              mark: 'rule',
              encoding: {
                x: {field: 'age', type: 'ordinal'}
              }
            },
            {
              projection: {type: 'mercator'},
              mark: 'text',
              encoding: {
                x: {field: 'a', type: 'nominal'}
              }
            }
          ]
        });
      })
    );
  });
});
