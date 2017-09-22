import {buildModel} from '../src/compile/buildmodel';
import {ConcatModel} from '../src/compile/concat';
import {FacetModel} from '../src/compile/facet';
import {LayerModel} from '../src/compile/layer';
import {Model} from '../src/compile/model';
import {RepeatModel} from '../src/compile/repeat';
import {UnitModel} from '../src/compile/unit';
import {initConfig} from '../src/config';
import {
  ConcatSpec,
  FacetSpec,
  LayerSpec,
  normalize,
  RepeatSpec,
  TopLevel,
  TopLevelExtendedSpec,
  UnitSpec,
} from '../src/spec';
import {isLayerSpec, isUnitSpec} from '../src/spec';
import {normalizeAutoSize} from '../src/toplevelprops';

export function parseModel(inputSpec: TopLevelExtendedSpec): Model {
  const config = initConfig(inputSpec.config);
  const spec = normalize(inputSpec, config);
  const autosize = normalizeAutoSize(inputSpec.autosize, config.autosize, isLayerSpec(spec) || isUnitSpec(spec));
  return buildModel(spec, null, '', undefined, undefined, config, autosize.type === 'fit');
}

export function parseModelWithScale(inputSpec: TopLevelExtendedSpec): Model {
  const model = parseModel(inputSpec);
  model.parseScale();
  return model;
}

export function parseUnitModel(spec: TopLevel<UnitSpec>) {
  return new UnitModel(spec, null, '', undefined, undefined, initConfig(spec.config), normalizeAutoSize(spec.autosize, spec.config ? spec.config.autosize : undefined, true).type === 'fit');
}

export function parseUnitModelWithScale(spec: TopLevel<UnitSpec>) {
  const model = parseUnitModel(spec);
  model.parseScale();
  return model;
}

export function parseUnitModelWithScaleMarkDefLayoutSize(spec: TopLevel<UnitSpec>) {
  const model = parseUnitModelWithScale(spec);
  model.parseMarkDef();
  model.parseLayoutSize();
  return model;
}

export function parseUnitModelWithScaleAndLayoutSize(spec: TopLevel<UnitSpec>) {
  const model = parseUnitModelWithScale(spec);
  model.parseLayoutSize();
  return model;
}


export function parseLayerModel(spec: TopLevel<LayerSpec>) {
  return new LayerModel(spec, null, '', undefined, undefined, initConfig(spec.config), normalizeAutoSize(spec.autosize, spec.config ? spec.config.autosize : undefined, true).type === 'fit');
}

export function parseFacetModel(spec: TopLevel<FacetSpec>) {
  return new FacetModel(spec, null, '', undefined, initConfig(spec.config));
}

export function parseFacetModelWithScale(spec: TopLevel<FacetSpec>) {
  const model = parseFacetModel(spec);
  model.parseScale();
  return model;
}

export function parseRepeatModel(spec: TopLevel<RepeatSpec>) {
  return new RepeatModel(spec, null, '', undefined, initConfig(spec.config));
}

export function parseConcatModel(spec: TopLevel<ConcatSpec>) {
  return new ConcatModel(spec, null, '', undefined, initConfig(spec.config));
}
