/* tslint:disable:quotemark */

import {assert} from 'chai';

import {normalize} from '../src/spec';

// describe('isStacked()') -- tested as part of stackOffset in stack.test.ts

describe('normalize()', function () {
  describe('normalizeExtendedUnitSpec', () => {
    it('should convert single extended spec with column into a composite spec', function() {
      const spec: any = {
        "name": "faceted",
        "description": "faceted spec",
        "data": {"url": "data/movies.json"},
        "mark": "point",
        "encoding": {
          "column": {"field": "MPAA_Rating","type": "ordinal"},
          "x": {"field": "Worldwide_Gross","type": "quantitative"},
          "y": {"field": "US_DVD_Sales","type": "quantitative"}
        }
      };

      assert.deepEqual(normalize(spec), {
        "name": "faceted",
        "description": "faceted spec",
        "data": {"url": "data/movies.json"},
        "facet": {
          "column": {"field": "MPAA_Rating","type": "ordinal"}
        },
        "spec": {
          "mark": "point",
          "encoding": {
            "x": {"field": "Worldwide_Gross","type": "quantitative"},
            "y": {"field": "US_DVD_Sales","type": "quantitative"}
          }
        }
      });
    });

    it('should convert single extended spec with row into a composite spec', function() {
      const spec: any = {
        "data": {"url": "data/movies.json"},
        "mark": "point",
        "encoding": {
          "row": {"field": "MPAA_Rating","type": "ordinal"},
          "x": {"field": "Worldwide_Gross","type": "quantitative"},
          "y": {"field": "US_DVD_Sales","type": "quantitative"}
        }
      };

      assert.deepEqual(normalize(spec), {
        "data": {"url": "data/movies.json"},
        "facet": {
          "row": {"field": "MPAA_Rating","type": "ordinal"}
        },
        "spec": {
          "mark": "point",
          "encoding": {
            "x": {"field": "Worldwide_Gross","type": "quantitative"},
            "y": {"field": "US_DVD_Sales","type": "quantitative"}
          }
        }
      });
    });
  });

  describe('normalizeOverlay', () => {
    describe('line', () => {
      it('should be normalized correctly', () => {
        const spec: any = {
          "description": "Google's stock price over time.",
          "data": {"url": "data/stocks.csv", "format": {"type": "csv"}},
          "transform": {"filter": "datum.symbol==='GOOG'"},
          "mark": "line",
          "encoding": {
            "x": {"field": "date", "type": "temporal"},
            "y": {"field": "price", "type": "quantitative"}
          },
          "config": {"overlay": {"line": true}}
        };
        const normalizedSpec = normalize(spec);
        assert.deepEqual(normalizedSpec, {
          "description": "Google's stock price over time.",
          "data": {"url": "data/stocks.csv","format": {"type": "csv"}},
          "transform": {"filter": "datum.symbol==='GOOG'"},
          "layers": [
            {
              "mark": "line",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              }
            },
            {
              "mark": "point",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              },
              "config": {"mark": {"filled": true}}
            }
          ]
        });
      });
    });

    describe('area', () => {
      it('with linepoint should be normalized correctly', () => {
        const spec: any = {
          "description": "Google's stock price over time.",
          "data": {"url": "data/stocks.csv", "format": {"type": "csv"}},
          "transform": {"filter": "datum.symbol==='GOOG'"},
          "mark": "area",
          "encoding": {
            "x": {"field": "date", "type": "temporal"},
            "y": {"field": "price", "type": "quantitative"}
          },
          "config": {"overlay": {"area": 'linepoint'}}
        };
        const normalizedSpec = normalize(spec);
        assert.deepEqual(normalizedSpec, {
          "description": "Google's stock price over time.",
          "data": {"url": "data/stocks.csv","format": {"type": "csv"}},
          "transform": {"filter": "datum.symbol==='GOOG'"},
          "layers": [
            {
              "mark": "area",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              }
            },
            {
              "mark": "line",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              }
            },
            {
              "mark": "point",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              },
              "config": {"mark": {"filled": true}}
            }
          ]
        });
      });

      it('with linepoint should be normalized correctly', () => {
        const spec: any = {
          "description": "Google's stock price over time.",
          "data": {"url": "data/stocks.csv", "format": {"type": "csv"}},
          "transform": {"filter": "datum.symbol==='GOOG'"},
          "mark": "area",
          "encoding": {
            "x": {"field": "date", "type": "temporal"},
            "y": {"field": "price", "type": "quantitative"}
          },
          "config": {"overlay": {"area": 'line'}}
        };
        const normalizedSpec = normalize(spec);
        assert.deepEqual(normalizedSpec, {
          "description": "Google's stock price over time.",
          "data": {"url": "data/stocks.csv","format": {"type": "csv"}},
          "transform": {"filter": "datum.symbol==='GOOG'"},
          "layers": [
            {
              "mark": "area",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              }
            },
            {
              "mark": "line",
              "encoding": {
                "x": {"field": "date","type": "temporal"},
                "y": {"field": "price","type": "quantitative"}
              }
            }
          ]
        });
      });
    });
  });

  it('should convert y2 -> y if there is no y in the encoding', function() {
    const spec: any = {
      "data": {"url": "data/population.json"},
      "mark": "rule",
      "encoding": {
        "y2": {"field": "age","type": "ordinal"},
        "x": { "aggregate": "min", "field": "people", "type": "quantitative" },
        "x2": { "aggregate": "max", "field": "people", "type": "quantitative" }
      }
    };

    assert.deepEqual(normalize(spec), {
      "data": {"url": "data/population.json"},
      "mark": "rule",
      "encoding": {
        "y": {"field": "age","type": "ordinal"},
        "x": { "aggregate": "min", "field": "people", "type": "quantitative" },
        "x2": { "aggregate": "max", "field": "people", "type": "quantitative" }
      }
    });
  });

  it('should convert x2 -> x if there is no x in the encoding', function() {
    const spec: any = {
      "data": {"url": "data/population.json"},
      "mark": "rule",
      "encoding": {
        "x2": {"field": "age","type": "ordinal"},
        "y": { "aggregate": "min", "field": "people", "type": "quantitative" },
        "y2": { "aggregate": "max", "field": "people", "type": "quantitative" }
      }
    };

    assert.deepEqual(normalize(spec), {
      "data": {"url": "data/population.json"},
      "mark": "rule",
      "encoding": {
        "x": {"field": "age","type": "ordinal"},
        "y": { "aggregate": "min", "field": "people", "type": "quantitative" },
        "y2": { "aggregate": "max", "field": "people", "type": "quantitative" }
      }
    });
  });
});
