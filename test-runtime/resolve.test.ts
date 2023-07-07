import {
  brush,
  compositeTypes,
  hits as hitsMaster,
  multiviewRegion,
  parentSelector,
  pt,
  resolutions,
  selectionTypes,
  getSpec,
  unitNameRegex,
  embed,
} from './util.js';
import {describe, expect, it} from 'vitest';

const fns = {
  point: pt,
  interval: brush,
  region: multiviewRegion
};

for (const type of selectionTypes) {
  const hits = hitsMaster[type];
  const fn = fns[type];

  describe(`${type} selections at runtime`, () => {
    compositeTypes.forEach((specType) => {
      describe(`in ${specType} views`, () => {
        /**
         * Loop through the views, click to add a selection instance.
         * Store size should stay constant, but unit names should vary.
         */
        it('should have one global selection instance', async () => {
          const selection = {
            type,
            resolve: 'global',
            ...(specType === 'facet' && type !== 'region' ? {encodings: ['y']} : {})
          };

          for (let i = 0; i < hits[specType].length; i++) {
            const view = await embed(getSpec(specType, i, selection));
            const parent = parentSelector(specType, i);
            const store = (await fn(view, specType, i, parent)) as [any];
            expect(store).toHaveLength(1);
            expect(store[0].unit).toMatch(unitNameRegex(specType, i));
            await expect(await view.toSVG()).toMatchFileSnapshot(`./snapshots/${type}/${specType}/global_${i}.svg`);

            if (i === hits[specType].length - 1) {
              const cleared = await fn(view, `${specType}_clear`, 0, parent);
              expect(cleared).toHaveLength(0);
              await expect(await view.toSVG()).toMatchFileSnapshot(
                `./snapshots/${type}/${specType}/global_clear_${i}.svg`,
              );
            }
          }
        });

        for (const resolve of resolutions) {
          const selection = {
            type,
            resolve,
            ...(specType === 'facet' && type !== 'region' ? {encodings: ['x']} : {})
          };

          /**
           * Loop through the views, click to add selection instance and observe
           * incrementing store size. Then, loop again but click to clear and
           * observe decrementing store size. Check unit names in each case.
           */
          it(`should have one selection instance per ${resolve} view`, async () => {
            const view1 = await embed(getSpec(specType, 0, selection));
            for (let i = 0; i < hits[specType].length; i++) {
              const parent = parentSelector(specType, i);
              const store = (await fn(view1, specType, i, parent)) as [any];
              expect(store).toHaveLength(i + 1);
              expect(store[i].unit).toMatch(unitNameRegex(specType, i));
              await expect(await view1.toSVG()).toMatchFileSnapshot(
                `./snapshots/${type}/${specType}/${resolve}_${i}.svg`,
              );
            }

            const view2 = await embed(getSpec(specType, 1, {type, resolve, encodings: ['x']}));
            for (let i = 0; i < hits[specType].length; i++) {
              const parent = parentSelector(specType, i);
              await fn(view2, specType, i, parent);
            }

            for (let i = hits[`${specType}_clear`].length - 1; i >= 0; i--) {
              const parent = parentSelector(specType, i);
              const store = (await fn(view2, `${specType}_clear`, i, parent)) as [any];
              expect(store).toHaveLength(i);
              if (i > 0) {
                expect(store[i - 1].unit).toMatch(unitNameRegex(specType, i - 1));
              }
              await expect(await view2.toSVG()).toMatchFileSnapshot(
                `./snapshots/${type}/${specType}/${resolve}_clear_${i}.svg`,
              );
            }
          });
        }
      });
    });
  });
}
