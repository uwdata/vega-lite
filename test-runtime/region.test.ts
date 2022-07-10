import {TopLevelSpec} from '../src';
import {SelectionType} from '../src/selection';
import {clear, embedFn, region, regionByPolygon, spec, testRenderFn} from './util';
import {Page} from 'puppeteer/lib/cjs/puppeteer/common/Page';
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
describe('interval selections at runtime in unit views', () => {
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

  it('circle region test 1', async () => {
    await embed(spec('unit', 0, {type}));
    const store = await page.evaluate(region(14));

    expect(store).toHaveLength(5);
    expect(store[0].fields).toBeUndefined();
    expect(store[0].values).toBeUndefined();

    await testRender(`circle_0`);
  });

  it('circle region test 2', async () => {
    await embed(spec('unit', 0, {type}));
    const store = await page.evaluate(region(3));

    expect(store).toHaveLength(2);
    expect(store[0].fields).toBeUndefined();
    expect(store[0].values).toBeUndefined();

    await testRender(`cirlce_1`);
  });

  it('circle region test 3', async () => {
    await embed(spec('unit', 0, {type}));
    const store = await page.evaluate(region(6));

    expect(store).toHaveLength(4);
    expect(store[0].fields).toBeUndefined();
    expect(store[0].values).toBeUndefined();

    await testRender(`circle_2`);
  });

  it('polygon region test 1', async () => {
    await embed(spec('unit', 0, {type}));

    const store = await page.evaluate(
      regionByPolygon(6, [
        [-30, -30],
        [-30, 30],
        [30, 30],
        [30, -30]
      ])
    );

    expect(store).toHaveLength(4);
    expect(store[0].fields).toBeUndefined();
    expect(store[0].values).toBeUndefined();

    await testRender(`polygon_0`);
  });

  it('polygon region test 2', async () => {
    await embed(spec('unit', 0, {type}));

    const l = 30;
    const h = 15;

    const store = await page.evaluate(
      regionByPolygon(14, [
        [-l, -l],
        [-l, l],
        [-h, h],
        [-h, -h],
        [h, -h],
        [h, l],
        [l, l],
        [l, -l]
      ])
    );

    expect(store).toHaveLength(2);
    expect(store[0].fields).toBeUndefined();
    expect(store[0].values).toBeUndefined();

    await testRender(`polygon_1`);
  });

  it('should clear out stored extents', async () => {
    await embed(spec('unit', 0, {type}));
    let store = await page.evaluate(region(14));

    expect(store).toHaveLength(5);

    store = await page.evaluate(clear(14));

    expect(store).toBeUndefined();

    await testRender(`clear_0`);
  });
});
