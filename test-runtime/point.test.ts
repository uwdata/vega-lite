import {View} from 'vega';
import {SelectionType, SELECTION_ID} from '../src/selection.js';
import {embed, fill, hits as hitsMaster, pt, getSpec} from './util.js';
import {describe, expect, it} from 'vitest';

describe(`point selections at runtime in unit views`, () => {
  const type: SelectionType = 'point';
  const hits = hitsMaster.point;

  it('should add values to the store', async () => {
    for (let i = 0; i < hits.qq.length; i++) {
      const view = await embed(getSpec('unit', i, {type}));
      const store = (await pt(view, 'qq', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0]).toHaveProperty(SELECTION_ID);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/click_${i}.svg`);
    }
  });

  it('should respect projections', async () => {
    let values: number[][] = [];
    let encodings: string[] = [];
    let fields: string[] = [];
    const t = async (emb: (i: number) => Promise<View>) => {
      for (let i = 0; i < hits.qq.length; i++) {
        const view = await emb(i);
        const store = (await pt(view, 'qq', i)) as [any];
        expect(store).toHaveLength(1);
        expect(store[0].fields).toHaveLength(fields.length);
        expect(store[0].values).toHaveLength(fields.length);
        expect(store[0].fields.map((f: any) => f.field)).toEqual(fields);
        expect(store[0].fields.map((f: any) => f.type)).toEqual(fill('E', fields.length));
        expect(store[0].values).toEqual(values[i]);
        await expect(await view.toSVG()).toMatchFileSnapshot(
          `./snapshots/${type}/unit/${encodings}_${fields}_${i}.svg`,
        );
      }
    };

    encodings = ['x', 'color'];
    fields = ['a', 'c'];
    values = [
      [2, 1],
      [6, 0],
    ];
    await t(async (i: number) => await embed(getSpec('unit', i, {type, encodings})));

    encodings = [];
    fields = ['c', 'a', 'b'];
    values = [
      [1, 2, 53],
      [0, 6, 87],
    ];
    await t(async (i: number) => await embed(getSpec('unit', i, {type, fields})));
  });

  it('should clear out the store', async () => {
    for (let i = 0; i < hits.qq_clear.length; i++) {
      const view = await embed(getSpec('unit', i, {type}));
      let store = (await pt(view, 'qq', i)) as [any];
      expect(store).toHaveLength(1);

      store = (await pt(view, 'qq_clear', i)) as [any];
      expect(store).toHaveLength(0);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/clear_${i}.svg`);
    }
  });

  it('should support selecting bins', async () => {
    const encodings = ['x', 'color', 'y'];
    const fields = ['a', 'c', 'b'];
    const types = ['R-RE', 'E', 'R-RE'];
    const values = [
      [[1, 2], 0, [40, 50]],
      [[8, 9], 1, [10, 20]],
    ];

    for (let i = 0; i < hits.bins.length; i++) {
      const view = await embed(getSpec('unit', i, {type, encodings}, {x: {bin: true}, y: {bin: true}}));
      const store = (await pt(view, 'bins', i)) as [any];
      expect(store).toHaveLength(1);
      expect(store[0].fields).toHaveLength(fields.length);
      expect(store[0].values).toHaveLength(fields.length);
      expect(store[0].fields.map((f: any) => f.field)).toEqual(fields);
      expect(store[0].fields.map((f: any) => f.type)).toEqual(types);
      expect(store[0].values).toEqual(values[i]);
      await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/unit/bins_${i}.svg`);
    }
  });
});
