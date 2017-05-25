import {isArray} from 'vega-util';
import {ScaleChannel} from '../channel';
import {Config} from '../config';
import {Encoding} from '../encoding';
import {Facet} from '../facet';
import {Field, FieldDef, isRepeatRef} from '../fielddef';
import * as log from '../log';
import {Repeat} from '../repeat';
import {initRepeatResolve, ResolveMapping} from '../resolve';
import {RepeatSpec} from '../spec';
import {Dict, keys} from '../util';
import {isSignalRefDomain, VgData, VgLayout, VgScale, VgSignal} from '../vega.schema';
import {buildModel} from './common';
import {assembleData} from './data/assemble';
import {parseData} from './data/parse';
import {Model} from './model';
import {ScaleComponent} from './scale/component';
import {unionDomains} from './scale/domain';
import {moveSharedScaleUp} from './scale/parse';


export type RepeaterValue = {
  row?: string,
  column?: string
};

export function replaceRepeaterInFacet(facet: Facet<Field>, repeater: RepeaterValue): Facet<string> {
  return replaceRepeater(facet, repeater);
}

export function replaceRepeaterInEncoding(encoding: Encoding<Field>, repeater: RepeaterValue): Encoding<string> {
  return replaceRepeater(encoding, repeater);
}

type EncodingOrFacet<F> = Encoding<F> | Facet<F>;

/**
 * Replace repeater values in a field def with the concrete field name.
 */
function replaceRepeaterInFieldDef(fieldDef: FieldDef<Field>, repeater: RepeaterValue): FieldDef<string> | null {
  const field = fieldDef.field;
  if (isRepeatRef(field)) {
    if (field.repeat in repeater) {
      return {
        ...fieldDef,
        field: repeater[field.repeat]
      };
    } else {
      log.warn(log.message.noSuchRepeatedValue(field.repeat));
      return null;
    }
  } else {
    // field is not a repeat ref so we can just return the field def
    return fieldDef as FieldDef<string>;
  }
}

function replaceRepeater(mapping: EncodingOrFacet<Field>, repeater: RepeaterValue): EncodingOrFacet<string> {
  const out: EncodingOrFacet<string> = {};
  for (const channel in mapping) {
    if (mapping.hasOwnProperty(channel)) {
      const fieldDef: FieldDef<Field> | FieldDef<Field>[] = mapping[channel];

      if (isArray(fieldDef)) {
        out[channel] = fieldDef.map(fd => replaceRepeaterInFieldDef(fd, repeater))
          .filter((fd: FieldDef<string> | null) => fd !== null);
      } else {
        const fd = replaceRepeaterInFieldDef(fieldDef, repeater);
        if (fd !== null) {
          out[channel] = fd;
        }
      }
    }
  }
  return out;
}

export class RepeatModel extends Model {
  public readonly repeat: Repeat;

  public readonly children: Model[];

  private readonly resolve: ResolveMapping;

  constructor(spec: RepeatSpec, parent: Model, parentGivenName: string, repeatValues: RepeaterValue, config: Config) {
    super(spec, parent, parentGivenName, config);

    this.resolve = initRepeatResolve(spec.resolve || {});

    this.repeat = spec.repeat;
    this.children = this._initChildren(spec, this.repeat, repeatValues, config);
  }

  private _initChildren(spec: RepeatSpec, repeat: Repeat, repeater: RepeaterValue, config: Config): Model[] {
    const children: Model[] = [];
    const row = repeat.row || [repeater ? repeater.row : null];
    const column = repeat.column || [repeater ? repeater.column : null];

    // cross product
    for (const rowField of row) {
      for (const columnField of column) {
        const name = (rowField ? '_' + rowField : '') + (columnField ? '_' + columnField : '');

        const childRepeat = {
          row: rowField,
          column: columnField
        };

        children.push(buildModel(spec.spec, this, this.getName('child' + name), undefined, childRepeat, config));
      }
    }

    return children;
  }

  public parseData() {
    this.component.data = parseData(this);
    this.children.forEach((child) => {
      child.parseData();
    });
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

  public parseScale(this: RepeatModel) {
    const scaleComponent: Dict<ScaleComponent> = this.component.scales = {};

    for (const child of this.children) {
      child.parseScale();

      // Check whether the scales are actually compatible, e.g. use the same sort or throw error
      keys(child.component.scales).forEach((channel: ScaleChannel) => {
        if (this.resolve[channel].scale === 'shared') {
          moveSharedScaleUp(this, scaleComponent, child, channel);
        }
      });
    }
  }

  public parseMark() {
    for (const child of this.children) {
      child.parseMark();
    }
  }

  public parseAxisAndHeader() {
    for (const child of this.children) {
      child.parseAxisAndHeader();
    }

    // TODO(#2415): support shared axes
  }

  public parseLegend() {
    const legendComponent = this.component.legends = {};

    for (const child of this.children) {
      child.parseLegend();

      keys(child.component.legends).forEach((channel: ScaleChannel) => {
        if (this.resolve[channel].legend === 'shared') {
          // just use the first legend definition for each channel
          if (!legendComponent[channel]) {
            legendComponent[channel] = child.component.legends[channel];
          }
          delete child.component.legends[channel];
        }
      });
    }
  }

  public assembleData(): VgData[] {
     if (!this.parent) {
      // only assemble data in the root
      return assembleData(this.component.data);
    }

    return [];
  }

  public assembleParentGroupProperties(): any {
    return null;
  }

  public assembleSelectionTopLevelSignals(signals: any[]): VgSignal[] {
    return this.children.reduce((sg, child) => child.assembleSelectionTopLevelSignals(sg), signals);
  }

  public assembleSelectionSignals(): VgSignal[] {
    this.children.forEach((child) => child.assembleSelectionSignals());
    return [];
  }

  public assembleLayoutSignals(): VgSignal[] {
    return this.children.reduce((signals, child) => {
      return signals.concat(child.assembleLayoutSignals());
    }, []);
  }

  public assembleSelectionData(data: VgData[]): VgData[] {
    return this.children.reduce((db, child) => child.assembleSelectionData(db), []);
  }

  public assembleScales(): VgScale[] {
    // combine with scales from children
    return this.children.reduce((scales, c) => {
      return scales.concat(c.assembleScales());
    }, super.assembleScales());
  }

  public assembleLayout(): VgLayout {
    // TODO: allow customization
    return {
      padding: {row: 10, column: 10},
      offset: 10,
      columns: this.repeat && this.repeat.column ? this.repeat.column.length : 1,
      bounds: 'full',
      align: 'all'
    };
  }

  public assembleMarks(): any[] {
    // only children have marks
    return this.children.map(child => {

      const encodeEntry = child.assembleParentGroupProperties();

      return {
        type: 'group',
        name: child.getName('group'),
        ...(encodeEntry ? {
          encode: {
            update: encodeEntry
          }
        } : {}),
        ...child.assembleGroup()
      };
    });
  }
}
