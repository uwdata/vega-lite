import {BIN_RANGE_DELIMITER} from '../../../../src/compile/common';
import {tooltip, tooltipRefForEncoding} from '../../../../src/compile/mark/encode';
import {defaultConfig} from '../../../../src/config';
import {parseUnitModelWithScaleAndLayoutSize} from '../../../util';

describe('compile/mark/encoding/tooltip', () => {
  describe('tooltip', () => {
    it('generates tooltip object signal for all encoding fields', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: 'point',
        encoding: {
          tooltip: [
            {field: 'Horsepower', type: 'quantitative'},
            {field: 'Acceleration', type: 'quantitative'}
          ]
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({
        signal: '{"Horsepower": format(datum["Horsepower"], ""), "Acceleration": format(datum["Acceleration"], "")}'
      });
    });

    it('generates tooltip object signal for all encoding fields', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: {type: 'point', tooltip: true},
        encoding: {
          x: {field: 'Horsepower', type: 'quantitative'},
          y: {field: 'Acceleration', type: 'quantitative'}
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({
        signal: '{"Horsepower": format(datum["Horsepower"], ""), "Acceleration": format(datum["Acceleration"], "")}'
      });
    });

    it('generates no tooltip if encoding.tooltip === null', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: 'point',
        encoding: {
          x: {field: 'Horsepower', type: 'quantitative'},
          y: {field: 'Acceleration', type: 'quantitative'},
          tooltip: null
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual(undefined);
    });

    it('generates tooltip object signal for all data if specified', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: {type: 'point', tooltip: {content: 'data'}},
        encoding: {
          x: {field: 'Horsepower', type: 'quantitative'},
          y: {field: 'Acceleration', type: 'quantitative'}
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({signal: 'datum'});
    });

    it('priorizes tooltip field def', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: {type: 'point', tooltip: {content: 'data'}},
        encoding: {
          x: {field: 'Cylinders', type: 'quantitative'},
          y: {field: 'Displacement', type: 'quantitative'},
          tooltip: [
            {field: 'Horsepower', type: 'quantitative'},
            {field: 'Acceleration', type: 'quantitative'}
          ]
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({
        signal: '{"Horsepower": format(datum["Horsepower"], ""), "Acceleration": format(datum["Acceleration"], "")}'
      });
    });

    it('priorizes tooltip value def', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: {type: 'point', tooltip: {content: 'data'}},
        encoding: {
          x: {field: 'Cylinders', type: 'quantitative'},
          y: {field: 'Displacement', type: 'quantitative'},
          tooltip: {value: 'haha'}
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({value: 'haha'});
    });

    it('generates correct keys and values for channels with axis', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: {type: 'point', tooltip: true},
        encoding: {
          x: {field: 'Date', type: 'quantitative', axis: {title: 'foo', format: '%y'}},
          y: {field: 'Displacement', type: 'quantitative', axis: {title: 'bar'}}
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({
        signal: '{"foo": format(datum["Date"], "%y"), "bar": format(datum["Displacement"], "")}'
      });
    });

    it('generates correct keys and values for channels with legends', () => {
      const model = parseUnitModelWithScaleAndLayoutSize({
        mark: {type: 'point', tooltip: true},
        encoding: {
          color: {field: 'Foobar', type: 'nominal', legend: {title: 'baz'}}
        }
      });
      const props = tooltip(model);
      expect(props.tooltip).toEqual({
        signal: '{"baz": \'\'+datum["Foobar"]}'
      });
    });
  });

  describe('tooltipForEncoding', () => {
    it('returns correct tooltip signal for binned field', () => {
      expect(
        tooltipRefForEncoding(
          {
            x: {
              bin: true,
              field: 'IMDB_Rating',
              type: 'quantitative'
            }
          },
          defaultConfig
        )
      ).toEqual({
        signal: `{"IMDB_Rating (binned)": !isValid(datum["bin_maxbins_10_IMDB_Rating"]) || !isFinite(+datum["bin_maxbins_10_IMDB_Rating"]) ? "null" : format(datum["bin_maxbins_10_IMDB_Rating"], "") + "${BIN_RANGE_DELIMITER}" + format(datum["bin_maxbins_10_IMDB_Rating_end"], "")}`
      });
    });

    it('returns correct tooltip signal for binned field with custom title', () => {
      expect(
        tooltipRefForEncoding(
          {
            x: {
              bin: 'binned',
              field: 'bin_IMDB_rating',
              type: 'quantitative',
              title: 'IMDB_Rating (binned)'
            },
            x2: {
              field: 'bin_IMDB_rating_end'
            }
          },
          defaultConfig
        )
      ).toEqual({
        signal: `{"IMDB_Rating (binned)": !isValid(datum["bin_IMDB_rating"]) || !isFinite(+datum["bin_IMDB_rating"]) ? "null" : format(datum["bin_IMDB_rating"], "") + "${BIN_RANGE_DELIMITER}" + format(datum["bin_IMDB_rating_end"], "")}`
      });
    });
  });
});
