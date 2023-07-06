import {TopLevelSpec} from '../src';
import {SELECTION_ID, SelectionType} from '../src/selection';
import {clear, embedFn, circleRegion, polygonRegion, spec, testRenderFn, hits} from './util';
import {Page} from 'puppeteer/lib/cjs/puppeteer/common/Page';

describe('region selections at runtime in unit views', () => {
  let page: Page;
  let embed: (specification: TopLevelSpec) => Promise<void>;
  let testRender: (filename: string) => Promise<void>;

  beforeAll(async () => {
    page = await (global as any).__BROWSER__.newPage();
    embed = embedFn(page);
    testRender = testRenderFn(page, `${type}/unit`);
    await page.goto('http://0.0.0.0:8000/test-runtime/');
  });

  afterAll(async () => {
    await page.close();
  });

  const type: SelectionType = 'region';

  it('should add values to the store for circle regions', async () => {
    for (const [i, hit] of hits.region.circle.entries()) {
      await embed(spec('unit', 0, {type}));
      const store: any = await page.evaluate(circleRegion(hit.id));

      expect(store).toHaveLength(hit.count);
      expect(store[0].fields).toBeUndefined();
      expect(store[0].values).toBeUndefined();
      for (const t of store) {
        expect(t).toHaveProperty(SELECTION_ID);
      }

      await testRender(`circle_${i}`);
    }
  });

  it('should add values to the store for complex polygons', async () => {
    for (const [i, hit] of hits.region.polygon.entries()) {
      await embed(spec('unit', 0, {type}));
      const store: any = await page.evaluate(polygonRegion(hit.id, hit.coords));

      expect(store).toHaveLength(hit.count);
      expect(store[0].fields).toBeUndefined();
      expect(store[0].values).toBeUndefined();
      for (const t of store) {
        expect(t).toHaveProperty(SELECTION_ID);
      }

      await testRender(`polygon_${i}`);
    }
  });

  it('should clear out stored extents', async () => {
    await embed(spec('unit', 0, {type}));

    const hit = hits.region.circle[0];
    let store = await page.evaluate(circleRegion(hit.id));
    expect(store).toHaveLength(hit.count);

    store = await page.evaluate(clear(hits.region.circle_clear[0].id));
    expect(store).toBeUndefined();

    await testRender(`clear_0`);
  });
});
