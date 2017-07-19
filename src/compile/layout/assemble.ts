import {Channel, COLUMN, ROW, X, Y} from '../../channel';
import {MAIN} from '../../data';
import {hasDiscreteDomain, scaleCompatible} from '../../scale';
import {extend, isArray, keys, StringSet} from '../../util';
import {isVgRangeStep, VgData, VgFormulaTransform, VgRangeStep, VgSignal, VgTransform} from '../../vega.schema';
import {FacetModel} from '../facet';
import {LayerModel} from '../layer';
import {Model, ModelWithField} from '../model';
import {ScaleComponent} from '../scale/component';
import {UnitModel} from '../unit';

export function assembleLayoutSignals(model: Model): VgSignal[] {
  return [].concat(
    sizeSignals(model, 'width'),
    sizeSignals(model, 'height')
  );
}

export function sizeSignals(model: Model, sizeType: 'width' | 'height'): VgSignal[] {
  const channel = sizeType==='width' ? 'x' : 'y';
  const size = model.component.layoutSize.get(sizeType);
  if (size === 'merged') {
    return [];
  } else if (size === 'range-step') {
    const scaleComponent = model.getScaleComponent(channel);

    if (scaleComponent) {
      const type = scaleComponent.get('type');
      const range = scaleComponent.get('range');

      if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
        const scaleName = model.scaleName(channel);

        return [
          stepSignal(scaleName, range),
          {
            name: model.getName(sizeType),
            update: sizeExpr(scaleName, scaleComponent)
          }
        ];
      }
    }
    /* istanbul ignore next: Condition should not happen -- only for warning in development. */
    throw new Error('layout size is range step although there is no rangeStep.');
  }
  return size ? [{
    name: model.getName(sizeType),
    update: `${size}`
  }] : [];
}

function stepSignal(scaleName: string, range: VgRangeStep) {
  return {
    name: scaleName + '_step',
    value: range.step,
  };
}

function sizeExpr(scaleName: string, scaleComponent: ScaleComponent) {
  const type = scaleComponent.get('type');
  const cardinality = `domain('${scaleName}').length`;
  const padding = scaleComponent.get('padding');
  let paddingOuter = scaleComponent.get('paddingOuter');
  paddingOuter = paddingOuter !== undefined ? paddingOuter : padding;

  let paddingInner = scaleComponent.get('paddingInner');
  paddingInner = type === 'band' ?
    // only band has real paddingInner
    (paddingInner !== undefined ? paddingInner : padding) :
    // For point, as calculated in https://github.com/vega/vega-scale/blob/master/src/band.js#L128,
    // it's equivalent to have paddingInner = 1 since there is only n-1 steps between n points.
    1;
  return `bandspace(${cardinality}, ${paddingInner}, ${paddingOuter}) * ${scaleName}_step`;
}


