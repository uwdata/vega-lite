import {View} from 'vega';
import {SelectionType} from '../src/selection.js';
import {brush, embed, getGeoSpec, getSpec, hits as hitsMaster, tuples} from './util.js';
import {describe, expect, it} from 'vitest';

describe('interval selections at runtime in unit views', () => {
  const type: SelectionType = 'interval';
  const hits = hitsMaster.interval;

  it('should add extents to the store', async () => {
    for (let i = 0; i < hits.drag.length; i++) {
      const view = await embed(getSpec('unit', i, {type}));
      const store = (await brush(view, 'drag', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(2);
      expect(store[0].values).toHaveLength(2);
      expect(store[0].fields[0].channel).toBe('x');
      expect(store[0].fields[0].field).toBe('a');
      expect(store[0].fields[0].type).toBe('R');
      expect(store[0].fields[1].channel).toBe('y');
      expect(store[0].fields[1].field).toBe('b');
      expect(store[0].fields[1].type).toBe('R');
      expect(store[0].values[0]).toHaveLength(2);
      expect(store[0].values[1]).toHaveLength(2);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/drag_${i}.svg`);
    }
  });

  it('should respect projections', async () => {
    const view1 = await embed(getSpec('unit', 0, {type, encodings: ['x']}));

    for (let i = 0; i < hits.drag.length; i++) {
      const store = (await brush(view1, 'drag', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(1);
      expect(store[0].values).toHaveLength(1);
      expect(store[0].fields[0].channel).toBe('x');
      expect(store[0].fields[0].field).toBe('a');
      expect(store[0].fields[0].type).toBe('R');
      expect(store[0].values[0]).toHaveLength(2);
      await expect(await view1.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/x_${i}.svg`);
    }

    const view2 = await embed(getSpec('unit', 1, {type, encodings: ['y']}));
    for (let i = 0; i < hits.drag.length; i++) {
      const store = (await brush(view2, 'drag', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(1);
      expect(store[0].values).toHaveLength(1);
      expect(store[0].fields[0].channel).toBe('y');
      expect(store[0].fields[0].field).toBe('b');
      expect(store[0].fields[0].type).toBe('R');
      expect(store[0].values[0]).toHaveLength(2);
      await expect(await view2.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/y_${i}.svg`);
    }
  });

  it('should clear out stored extents', async () => {
    for (let i = 0; i < hits.drag_clear.length; i++) {
      const view = await embed(getSpec('unit', i, {type}));
      let store = (await brush(view, 'drag', i)) as [any];
      expect(store).toHaveLength(1);

      store = (await brush(view, 'drag_clear', i)) as [any];
      expect(store).toHaveLength(0);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/clear_${i}.svg`);
    }
  });

  it('should brush over binned domains', async () => {
    const view = await embed(
      getSpec(
        'unit',
        1,
        {type, encodings: ['y']},
        {
          x: {aggregate: 'count', type: 'quantitative'},
          y: {bin: true},
          color: {value: 'steelblue', field: undefined, type: undefined},
        },
      ),
    );
    for (let i = 0; i < hits.bins.length; i++) {
      const store = (await brush(view, 'bins', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(1);
      expect(store[0].values).toHaveLength(1);
      expect(store[0].fields[0].channel).toBe('y');
      expect(store[0].fields[0].field).toBe('b');
      expect(store[0].fields[0].type).toBe('R');
      expect(store[0].values[0]).toHaveLength(2);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/bins_${i}.svg`);
    }

    const store = await brush(view, 'bins_clear', 0);
    expect(store).toHaveLength(0);
  });

  it('should brush over ordinal/nominal domains', async () => {
    const xextents = [
      [2, 3, 4],
      [6, 7, 8],
    ];
    const yextents = [
      [49, 52, 53, 54, 55, 66, 67, 68, 76, 81, 87, 91],
      [17, 19, 23, 24, 27, 28, 35, 39, 43, 48],
    ];

    let view: View;

    for (let i = 0; i < hits.drag.length; i++) {
      view = await embed(getSpec('unit', i, {type}, {x: {type: 'ordinal'}, y: {type: 'nominal'}}));
      const store = (await brush(view, 'drag', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(2);
      expect(store[0].values).toHaveLength(2);
      expect(store[0].fields[0].channel).toBe('x');
      expect(store[0].fields[0].field).toBe('a');
      expect(store[0].fields[0].type).toBe('E');
      expect(store[0].fields[1].channel).toBe('y');
      expect(store[0].fields[1].field).toBe('b');
      expect(store[0].fields[1].type).toBe('E');
      expect(store[0].values[0]).toEqual(expect.arrayContaining(xextents[i]));
      expect(store[0].values[1]).toEqual(expect.arrayContaining(yextents[i]));
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/ord_${i}.svg`);
    }

    const store = await brush(view, 'drag_clear', 0);
    expect(store).toHaveLength(0);
  });

  it('should brush over temporal domains', async () => {
    const values = tuples.map((d) => ({...d, a: new Date(2017, d.a)}));
    const toNumber = (a: any) => a[0].values[0].map((d: any) => +d);

    const view1 = await embed(getSpec('unit', 0, {type, encodings: ['x']}, {values, x: {type: 'temporal'}}));
    let extents = [
      [1485969714000, 1493634384000],
      [1496346498000, 1504364922000],
    ];
    for (let i = 0; i < hits.drag.length; i++) {
      const store = toNumber((await brush(view1, 'drag', i)) as [any]);
      expect(store).toEqual(expect.arrayContaining(extents[i]));
      await expect(await view1.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/temporal_${i}.svg`);
    }

    let cleared = await brush(view1, 'drag_clear', 0);
    expect(cleared).toHaveLength(0);

    const view2 = await embed(
      getSpec('unit', 1, {type, encodings: ['x']}, {values, x: {type: 'temporal', timeUnit: 'day'}}),
    );

    extents = [
      [1325492928000, 1325664000000],
      [1325752128000, 1325837664000],
    ];
    for (let i = 0; i < hits.drag.length; i++) {
      const store = toNumber((await brush(view2, 'drag', i)) as [any]);
      expect(store).toEqual(expect.arrayContaining(extents[i]));
      await expect(await view2.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/dayTimeUnit_${i}.svg`);
    }

    cleared = await brush(view2, 'drag_clear', 0);
    expect(cleared).toHaveLength(0);
  });

  it('should brush over log/pow scales', async () => {
    for (let i = 0; i < hits.drag.length; i++) {
      const view = await embed(
        getSpec(
          'unit',
          i,
          {type},
          {
            x: {scale: {type: 'pow', exponent: 1.5}},
            y: {scale: {type: 'log'}},
          },
        ),
      );
      const store = (await brush(view, 'drag', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(2);
      expect(store[0].values).toHaveLength(2);
      expect(store[0].values[0]).toHaveLength(2);
      expect(store[0].values[1]).toHaveLength(2);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/logpow_${i}.svg`);
    }
  });

  describe('geo-intervals', () => {
    it('should add IDs to the store', async () => {
      const view = await embed(getGeoSpec());
      const store: any = await brush(view, 'drag', 1);
      expect(store).toHaveLength(13);
      for (const t of store) {
        expect(t).toHaveProperty(SELECTION_ID);
      }
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/geo_1.svg`);
    });

    it('should respect projections', async () => {
      const view = await embed(getGeoSpec({encodings: ['longitude']}));
      const store: any = await brush(view, 'drag', 0);
      expect(store).toHaveLength(20);
      for (const t of store) {
        expect(t).toHaveProperty(SELECTION_ID);
      }
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/geo_0.svg`);
    });
  });
});
