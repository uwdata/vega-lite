import {COLUMN, ROW, X, Y, Channel} from '../channel';
import {defaultConfig, Config} from '../config';
import {Repeat} from '../repeat';
import {FieldDef} from '../fielddef';
import {Scale, ScaleType} from '../scale';
import {RepeatSpec} from '../spec';
import {extend, keys, vals, flatten, duplicate, mergeDeep, contains, forEach, Dict} from '../util';
import {VgData, VgLegend} from '../vega.schema';
import {ORDINAL} from '../type';
import {LAYOUT} from '../data';
import {SOURCE} from '../data';

import {parseAxisComponent} from './axis';
import {buildModel} from './common';
import {assembleData, parseRepeatData} from './data/data';
import {assembleLayout, parseRepeatLayout} from './layout';
import {Model} from './model';
import {parseScaleComponent, ScaleComponents} from './scale';
import * as selections from './selections';

export type RepeatValues = {
  row: string,
  column: string
}

export class RepeatModel extends Model {
  private _repeat: Repeat;

  constructor(spec: RepeatSpec, parent: Model, parentGivenName: string, repeatValues: RepeatValues) {
    super(spec, parent, parentGivenName, repeatValues);

    // Config must be initialized before child as it gets cascaded to the child
    const config = this._config = this._initConfig(spec.config, parent);

    const repeat  = this._repeat = spec.repeat;
    this._children = this._initChildren(spec, repeat, repeatValues);
    this._scale  = this._initScale(repeat, config);
    this._axis = {};
  }

  private _initConfig(specConfig: Config, parent: Model) {
    return mergeDeep(duplicate(defaultConfig), specConfig, parent ? parent.config() : {});
  }

  private _initScale(repeat: Repeat, config: Config): Dict<Scale> {
    return [ROW, COLUMN].reduce(function(_scale, channel) {
      if (channel in repeat) {
        _scale[channel] = extend({
          type: ScaleType.ORDINAL,
          round: config.facet.scale.round,  // TODO(kanitw): separate `config.repeat` from  `config.facet`
          domain: repeat[channel],

          padding: 60  // TODO(kanitw): put in `config.repeat` from  `config.facet`
        }, {});
      }
      return _scale;
    }, {} as Dict<Scale>);
  }

  private _initChildren(spec: RepeatSpec, repeat: Repeat, repeatValues: RepeatValues): Model[] {
    let children = [];
    const row = repeat.row || [repeatValues ? repeatValues.row : null];
    const column = repeat.column || [repeatValues ? repeatValues.column : null];

    // cross product
    for (let r = 0; r < row.length; r++) {
      const rowField = row[r];
      for (let c = 0; c < column.length; c++) {
        const columnField = column[c];

        const name = (rowField ? '_' + rowField : '') + (columnField ? '_' + columnField : '');

        const childRepRepeatValues = {
          row: rowField,
          column: columnField
        };
        children.push(buildModel(spec.spec, this, this.name('child' + name), childRepRepeatValues));
      }
    }

    return children;
  }

  public repeat() {
    return this._repeat;
  }

  public hasMultipleDimensions() {
    return this.has(ROW) && this.has(COLUMN);
  }

  public has(channel: Channel): boolean {
    return !!this._repeat[channel];
  }

  public dataTable(): string {
    // FIXME: remove this hack
    return this.dataName(SOURCE);
  }

  public isRepeatRef(channel: Channel) {
    // todo
    return false;
  }

  public fieldDef(channel: Channel): FieldDef {
    return {
      type: ORDINAL
    };
  }

  public stack() {
    return null; // this is only a property for UnitModel
  }

  public parseData() {
    this._children.forEach((child) => {
      child.parseData();
    });
    this.component.data = parseRepeatData(this);
  }

  public parseLayoutData() {
    this._children.forEach((child, i) => {
      child.parseLayoutData();
    });
    this.component.layout = parseRepeatLayout(this);
  }

  public parseScale() {
    // TODO(kanitw): move this logic to scale.ts for readability & comparability?

    const model = this;

    // First, add scale for row and column.
    let scaleComponent = this.component.scale = parseScaleComponent(this);

    this._children.forEach(function(child) {
      child.parseScale();
      // move all scales up, merge all but x and y scales

      forEach(child.component.scale, function(childScales: ScaleComponents, key: string) {
        const channel = childScales.channel;

        if (contains([X, Y], channel)) {
          // positional scales are just appended because they should be independent
          scaleComponent[child.name(key)] = childScales;
        } else {
          const scaleNameWithoutPrefix = childScales.main.name.substr(child.name('').length);
          const newName = model.scaleName(scaleNameWithoutPrefix);
          const oldName = childScales.main.name;

          if (channel in scaleComponent) {
            // scale already exists, so merge

            // const modelScales = scaleComponent[channel];
            // TODO: merge scales, I'm too lazy right now and we don't need it for the examples
          } else {
            childScales.main.name = newName;
            scaleComponent[channel] = childScales;
          }
          child.renameScale(oldName, newName);
        }

        // Once put in parent, just remove the child's scale.
        delete child.component.scale[key];
      });
    });
  }

  public parseMark() {
    this._children.forEach(function(child) {
      child.parseMark();
    });
  }

  public parseAxis() {
    this._children.forEach(function(child) {
      child.parseAxis();
    });
    this.component.axis = parseAxisComponent(this, [ROW, COLUMN]);
  }

  public parseAxisGroup() {
    return null;
  }

  public parseGridGroup() {
    return null;
  }

  public parseLegend() {
    let legendComponent = this.component.legend = {} as Dict<VgLegend>;

    this._children.forEach(function(child) {
      child.parseLegend();

      // TODO: merge one legend per channel + field
      keys(child.component.legend).forEach(function(channel) {
        // just use the first legend definition for each channel
        if (!legendComponent[channel]) {
          legendComponent[channel] = child.component.legend[channel];
        }
        delete child.component.legend[channel];
      });
    });
  }

  public assembleParentGroupProperties() {
    return null;
  }

  public assembleData(data: VgData[]): VgData[] {
    assembleData(this, data);
    this._children.forEach((child) => {
      child.assembleData(data);
    });
    return data;
  }

  public assembleLayout(layoutData: VgData[]): VgData[] {
    // Postfix traversal – layout is assembled bottom-up
    this._children.forEach((child) => {
      child.assembleLayout(layoutData);
    });
    return assembleLayout(this, layoutData);
  }

  public assembleSelectionData(data: VgData[]): VgData[] {
    this._children.forEach((child) => child.assembleSelectionData(data));
    return selections.assembleCompositeData(this, data);
  }

  public assembleSignals(signals) {
    this._children.forEach((child) => child.assembleSignals(signals));
    return selections.assembleCompositeSignals(this, signals);
  }

  public assembleMarks(): any[] {
    // only children have marks
    return flatten(this._children.map((child) => {
      return extend(
        {
          name: child.name('cell'),
          type: 'group',
          from: {data: child.dataName(LAYOUT)},
          properties: {
            update: getRepeatGroupProperties(this, child)
          }
        },
        // Call child's assembleGroup to add marks and axes (legends and scales should have been moved up).
        // Note that we can call child's assembleGroup() here because parseMark()
        // is the last method in compile() and thus the child is completely compiled
        // at this point.
        child.assembleGroup()
      );
    }));
  }

  public channels() {
    return [ROW, COLUMN];
  }

  protected mapping() {
    return this.repeat();
  }

  public isRepeat() {
    return true;
  }
}

// TODO: move into RepeatModel if possible

function getRepeatGroupProperties(model: RepeatModel, child: Model) {
  const mergedCellConfig = extend({}, child.config().cell, child.config().facet.cell);

  return extend({
      x: model.has(COLUMN) ? {
          scale: model.scaleName(COLUMN),
          value: child.repeatValue(COLUMN),
          // offset by the padding
          offset: model.scale(COLUMN).padding / 2
        } : {value: model.config().facet.scale.padding / 2},

      y: model.has(ROW) ? {
        scale: model.scaleName(ROW),
        value: child.repeatValue(ROW),
        // offset by the padding
        offset: model.scale(ROW).padding / 2
      } : {value: model.config().facet.scale.padding / 2},

      width: {field: child.sizeName('width')},
      height: {field: child.sizeName('height')}
    },
    child.assembleParentGroupProperties(mergedCellConfig)
  );
}
