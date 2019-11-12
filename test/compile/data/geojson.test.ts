import {FieldRef, Vector2} from 'vega';
import {GeoJSONNode} from '../../../src/compile/data/geojson';
import {contains, every} from '../../../src/util';
import {parseUnitModelWithScaleAndLayoutSize} from '../../util';
import {PlaceholderDataFlowNode} from './util';

describe('compile/data/geojson', () => {
  it('should make transform and assemble correctly', () => {
    const model = parseUnitModelWithScaleAndLayoutSize({
      data: {
        url: 'data/zipcodes.csv',
        format: {
          type: 'csv'
        }
      },
      mark: 'circle',
      encoding: {
        longitude: {
          field: 'longitude',
          type: 'quantitative'
        },
        latitude: {
          field: 'latitude',
          type: 'quantitative'
        }
      }
    });

    const root = new PlaceholderDataFlowNode(null);
    GeoJSONNode.parseAll(root, model);

    let node = root.children[0];

    while (node != null) {
      expect(node).toBeInstanceOf(GeoJSONNode);
      const transform = (node as GeoJSONNode).assemble();
      expect(transform.type).toBe('geojson');
      expect(every(['longitude', 'latitude'], field => contains(transform.fields as Vector2<FieldRef>, field))).toBe(
        true
      );
      expect(transform.geojson).not.toBeDefined();

      expect(node.children.length).toBeLessThanOrEqual(1);
      node = node.children[0];
    }
  });

  it('should skip geojson if custom projection', () => {
    const model = parseUnitModelWithScaleAndLayoutSize({
      data: {
        url: 'data/zipcodes.csv',
        format: {
          type: 'csv'
        }
      },
      projection: {
        type: 'mercator',
        scale: 1000
      },
      mark: 'circle',
      encoding: {
        longitude: {
          field: 'longitude',
          type: 'quantitative'
        },
        latitude: {
          field: 'latitude',
          type: 'quantitative'
        }
      }
    });
    model.parse();

    const root = new PlaceholderDataFlowNode(null);
    const retval = GeoJSONNode.parseAll(root, model);

    expect(retval).toBe(root);
    expect(root.children.length).toBe(0);
  });

  describe('GeoJSONNode', () => {
    describe('dependentFields', () => {
      it('should return fields', () => {
        const flatten = new GeoJSONNode(null, ['foo', {expr: 's'}], null);
        expect(flatten.dependentFields()).toEqual(new Set(['foo']));
      });
      it('should return geojson', () => {
        const flatten = new GeoJSONNode(null, null, 'geo');
        expect(flatten.dependentFields()).toEqual(new Set(['geo']));
      });
    });

    describe('producedFields', () => {
      it('should return empty set', () => {
        const flatten = new GeoJSONNode(null);
        expect(flatten.producedFields()).toEqual(new Set());
      });
    });
  });
});
