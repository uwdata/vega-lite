import {Axis} from '../axis';
import {Channel} from '../channel';
import {CellConfig, Config} from '../config';
import {FieldDef} from '../fielddef';
import {Legend} from '../legend';
import {FILL_STROKE_CONFIG} from '../mark';
import {Scale} from '../scale';
import {LayerSpec} from '../spec';
import {StackProperties} from '../stack';
import {Dict, flatten, keys, vals} from '../util';
import {isSignalRefDomain, VgData, VgEncodeEntry, VgLayout, VgScale, VgSignal} from '../vega.schema';

import {applyConfig, buildModel} from './common';
import {assembleData} from './data/assemble';
import {parseData} from './data/parse';
import {assembleLayoutLayerSignals} from './layout/index';
import {Model} from './model';
import {RepeaterValue} from './repeat';
import {unionDomains} from './scale/domain';
import {assembleLayerSelectionMarks} from './selection/selection';
import {UnitModel} from './unit';


export class LayerModel extends Model {
  public readonly children: UnitModel[];

  /**
   * Fixed width for the unit visualization.
   * If undefined (e.g., for ordinal scale), the width of the
   * visualization will be calculated dynamically.
   */
  public readonly width: number;

  /**
   * Fixed height for the unit visualization.
   * If undefined (e.g., for ordinal scale), the height of the
   * visualization will be calculated dynamically.
   */
  public readonly height: number;

  constructor(spec: LayerSpec, parent: Model, parentGivenName: string, repeater: RepeaterValue, config: Config) {

    super(spec, parent, parentGivenName, config);

    this.width = spec.width;
    this.height = spec.height;

    this.children = spec.layer.map((layer, i) => {
      // FIXME: this is not always the case
      // we know that the model has to be a unit model because we pass in a unit spec
      return buildModel(layer, this, this.getName('layer_' + i), repeater, config) as UnitModel;
    });
  }

  public parseData() {
    this.component.data = parseData(this);
    for (const child of this.children) {
      child.parseData();
    }
  }

  public parseSelection() {
    // Merge selections up the hierarchy so that they may be referenced
    // across unit specs. Persist their definitions within each child
    // to assemble signals which remain within output Vega unit groups.
    this.component.selection = {};
    for (const child of this.children) {
      child.parseSelection();
      keys(child.component.selection).forEach((key) => {
        this.component.selection[key] = child.component.selection[key];
      });
    }
  }

  public parseScale(this: LayerModel) {
    const model = this;

    const scaleComponent: Dict<VgScale> = this.component.scales = {};

    for (const child of this.children) {
      child.parseScale();

      // FIXME(#1602): correctly implement independent scale
      // Also need to check whether the scales are actually compatible, e.g. use the same sort or throw error
      if (true) { // if shared/union scale
        keys(child.component.scales).forEach(function(channel) {
          const childScale = child.component.scales[channel];
          const modelScale = scaleComponent[channel];

          if (!childScale || isSignalRefDomain(childScale.domain) || (modelScale && isSignalRefDomain(modelScale.domain))) {
            // TODO: merge signal ref domains
            return;
          }

          if (modelScale) {
            modelScale.domain = unionDomains(modelScale.domain, childScale.domain);
          } else {
            scaleComponent[channel] = childScale;
          }

          // rename child scale to parent scales
          const scaleNameWithoutPrefix = childScale.name.substr(child.getName('').length);
          const newName = model.scaleName(scaleNameWithoutPrefix, true);
          child.renameScale(childScale.name, newName);
          childScale.name = newName;

          // remove merged scales from children
          delete child.component.scales[channel];
        });
      }
    }
  }

  public parseMark() {
    for (const child of this.children) {
      child.parseMark();
    }
  }

  public parseAxis() {
    const axisComponent = this.component.axes = {};

    for (const child of this.children) {
      child.parseAxis();

      // TODO: correctly implement independent axes
      if (true) { // if shared/union scale
        keys(child.component.axes).forEach(channel => {
          // TODO: support multiple axes for shared scale

          // just use the first axis definition for each channel
          if (!axisComponent[channel]) {
            axisComponent[channel] = child.component.axes[channel];
          }
        });
      }
    }
  }

  public parseAxisGroup(): void {
    return null;
  }

  public parseLegend() {
    const legendComponent = this.component.legends = {};

    for (const child of this.children) {
      child.parseLegend();

      // TODO: correctly implement independent axes
      if (true) { // if shared/union scale
        keys(child.component.legends).forEach(channel => {
          // just use the first legend definition for each channel
          if (!legendComponent[channel]) {
            legendComponent[channel] = child.component.legends[channel];
          }
        });
      }
    }
  }

  public assembleParentGroupProperties(cellConfig: CellConfig): VgEncodeEntry {
    return applyConfig({}, cellConfig, FILL_STROKE_CONFIG.concat(['clip']));
  }

  // TODO: Support same named selections across children.
  public assembleSignals(): VgSignal[] {
    return this.children.reduce((signals, child) => {
      return [].concat(
        child.assembleLayoutSignals(),
        child.assembleSignals(),
        signals
      );
    }, []);
  }

  public assembleSelectionData(data: VgData[]): VgData[] {
    return this.children.reduce((db, child) => child.assembleSelectionData(db), []);
  }

  public assembleData(): VgData[] {
     if (!this.parent) {
      // only assemble data in the root
      return assembleData(vals(this.component.data.sources));
    }
    return [];
  }

  public assembleScales(): VgScale[] {
    // combine with scales from children
    return this.children.reduce((scales, c) => {
      return scales.concat(c.assembleScales());
    }, super.assembleScales());
  }

  public assembleLayout(): VgLayout {
    return null;
  }
  public assembleLayoutSignals(): VgSignal[] {
    return assembleLayoutLayerSignals(this);
  }

  public assembleMarks(): any[] {
    return assembleLayerSelectionMarks(this, flatten(this.children.map((child) => {
      return child.assembleMarks();
    })));
  }
}
