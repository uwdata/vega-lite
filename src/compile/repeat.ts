import {AxisOrient, AxisProperties} from '../axis';
import {COLUMN, ROW, X, Y, Channel} from '../channel';
import {defaultConfig, Config} from '../config';
import {SOURCE, SUMMARY} from '../data';
import {Repeat} from '../repeat';
import {FieldDef} from '../fielddef';
import {Scale, ScaleType} from '../scale';
import {RepeatSpec} from '../spec';
import {extend, keys, vals, flatten, duplicate, mergeDeep, Dict} from '../util';
import {VgData, VgMarkGroup} from '../vega.schema';

import {parseAxis, parseInnerAxis, gridShow, parseAxisComponent} from './axis';
import {buildModel} from './common';
import {assembleData} from './data/data';
import {assembleLayout, parseRepeatLayout} from './layout';
import {Model} from './model';
import {parseScaleComponent, ScaleComponents} from './scale';

export class RepeatModel extends Model {
  private _repeat: Repeat;

  private _child: Model;

  constructor(spec: RepeatSpec, parent: Model, parentGivenName: string) {
    super(spec, parent, parentGivenName);

    // Config must be initialized before child as it gets cascaded to the child
    const config = this._config = this._initConfig(spec.config, parent);

    const child  = this._child = buildModel(spec.spec, this, this.name('child'));

    const repeat = this._repeat = spec.repeat;
    this._scale = this._initScale(repeat, config, child);
  }

  private _initConfig(specConfig: Config, parent: Model) {
    return mergeDeep(duplicate(defaultConfig), specConfig, parent ? parent.config() : {});
  }

  private _initScale(repeat: Repeat, config: Config, child: Model): Dict<Scale> {
    return [ROW, COLUMN].reduce(function(_scale, channel) {
      if (repeat[channel]) {

        _scale[channel] = {
          type: ScaleType.ORDINAL,
          domain: repeat[channel],

          // TODO: revise this rule for multiple level of nesting
          padding: (channel === ROW && child.has(Y)) || (channel === COLUMN && child.has(X)) ?
                   config.facet.scale.padding : 0
        };
      }
      return _scale;
    }, {} as Dict<Scale>);
  }

  private hasMultipleDimensions() {
    return this.has(ROW) && this.has(COLUMN);
  }

  public repeat() {
    return this._repeat;
  }

  public has(channel: Channel): boolean {
    return !!this._repeat[channel];
  }

  public child() {
    return this._child;
  }

  private hasSummary() {
    // TODO
    return false;
  }

  public dataTable(): string {
    return this.has(ROW) ? 'fields_row' : 'fields_column';
  }

  public fieldDef(channel: Channel): FieldDef {
    // HACK
    if (this.has(channel)) {
      return {
        field: this.repeat()[channel][0]
      };
    }
    return null;
  }

  public stack() {
    return null; // this is only a property for UnitModel
  }

  public parseData() {
    this.child().parseData();
  }

  public parseSelectionData() {
    // TODO: @arvind can write this
    // We might need to split this into compileSelectionData and compileSelectionSignals?
  }

  public parseLayoutData() {
    this.child().parseLayoutData();
    this.component.layout = parseRepeatLayout(this);
  }

  public parseScale() {
    const child = this.child();
    const model = this;

    child.parseScale();

    // First, add scale for row and column.
    let scaleComponent = this.component.scale = parseScaleComponent(this);

    // Then, move shared/union from its child spec.
    keys(child.component.scale).forEach(function(channel) {
      // TODO: correctly implement independent scale
      if (true) { // if shared/union scale
        const scales: ScaleComponents = scaleComponent[channel] = child.component.scale[channel];
        // for each scale, need to rename
        scales.main.concat([scales.binColorLegend]).concat([scales.colorLegend]).filter((scale) => {
          return !!scale;
        }).forEach(function(scale) {
          const scaleNameWithoutPrefix = scale.name.substr(child.name('').length);
          const newName = model.scaleName(scaleNameWithoutPrefix);
          child.renameScale(scale.name, newName);
          scale.name = newName;
        });

        // Once put in parent, just remove the child's scale.
        delete child.component.scale[channel];
      }
    });
  }

  public parseMark() {
    this.child().parseMark();

    this.component.mark = extend(
      {
        name: this.name('cell'),
        type: 'group',
        from: extend(
          {data: this.dataTable()},
          this.hasMultipleDimensions() ? {
            transform: [{
              type: 'cross',
              with: 'fields_column',
              output: {left: 'row', right: 'column'}
            }]
          } : {}
        ),
        properties: {
          update: getRepeatGroupProperties(this)
        }
      },
      // Call child's assembleGroup to add marks, scales, axes, and legends.
      // Note that we can call child's assembleGroup() here because parseMark()
      // is the last method in compile() and thus the child is completely compiled
      // at this point.
      this.child().assembleGroup()
    );
  }

  public parseAxis() {
    this.child().parseAxis();
  }

  public parseAxisGroup() {
    // TODO: with nesting, we might need to consider calling child
    // this.child().parseAxisGroup();

    const xAxisGroup = parseAxisGroup(this, X);
    const yAxisGroup = parseAxisGroup(this, Y);

    this.component.axisGroup = extend(
      xAxisGroup ? {x: xAxisGroup} : {},
      yAxisGroup ? {y: yAxisGroup} : {}
    );
  }

  public parseGridGroup() {
    // TODO: with nesting, we might need to consider calling child
    // this.child().parseGridGroup();

    const child = this.child();

    this.component.gridGroup = extend(
      !child.has(X) && this.has(COLUMN) ? { column: getColumnGridGroups(this) } : {},
      !child.has(Y) && this.has(ROW) ? { row: getRowGridGroups(this) } : {}
    );
  }

  public parseLegend() {
    this.child().parseLegend();

    // TODO: support legend for independent non-position scale across facets
    // TODO: support legend for field reference of parent data (e.g., for SPLOM)

    // For now, assuming that non-positional scales are always shared across facets
    // Thus, just move all legends from its child
    this.component.legend = this._child.component.legend;
    this._child.component.legend = {};
  }

  public assembleParentGroupProperties() {
    return null;
  }

  public assembleData(data: VgData[]): VgData[] {
    [COLUMN, ROW].forEach((channel) => {
      if (this.has(channel)) {
        data.push({
          name: 'fields_' + channel,
          values: this._repeat[channel]
        });
      }
    });

    return this._child.assembleData(data);
  }

  public assembleLayout(layoutData: VgData[]): VgData[] {
    // Postfix traversal – layout is assembled bottom-up
    this._child.assembleLayout(layoutData);
    return assembleLayout(this, layoutData);
  }

  public assembleMarks(): any[] {
    return [].concat(
      // axisGroup is a mapping to VgMarkGroup
      vals(this.component.axisGroup),
      flatten(vals(this.component.gridGroup)),
      this.component.mark
    );
  }

  public channels() {
    return [ROW, COLUMN];
  }

  protected mapping() {
    // TODO: what is this?
    return this.repeat();
  }

  public isRepeat() {
    return true;
  }
}

// TODO: move the rest of the file into RepeatModel if possible

function getRepeatGroupProperties(model: RepeatModel) {
  const child = model.child();
  const mergedCellConfig = extend({}, child.config().cell, child.config().facet.cell);

  return extend({
      x: model.has(COLUMN) ? {
          scale: model.scaleName(COLUMN),
          field: 'data',
          // offset by the padding
          offset: model.scale(COLUMN).padding / 2
        } : {value: model.config().facet.scale.padding / 2},

      y: model.has(ROW) ? {
        scale: model.scaleName(ROW),
        field: 'data',
        // offset by the padding
        offset: model.scale(ROW).padding / 2
      } : {value: model.config().facet.scale.padding / 2},

      width: {field: {parent: model.child().sizeName('width')}},
      height: {field: {parent: model.child().sizeName('height')}}
    },
    child.assembleParentGroupProperties(mergedCellConfig)
  );
}

function parseAxisGroup(model: RepeatModel, channel: Channel) {
  // TODO: add a case where inner spec is not a unit (facet/layer/concat)
  let axisGroup = null;

  const child = model.child();
  if (child.has(channel)) {
    if (child.axis(channel)) {
      if (true) { // the channel has shared axes

        // add a group for the shared axes
        axisGroup = channel === X ? getXAxesGroup(model) : getYAxesGroup(model);

        if (child.axis(channel) && gridShow(child, channel)) { // show inner grid
          // add inner axis (aka axis that shows only grid to )
          child.component.axis[channel] = parseInnerAxis(channel, child);
        } else {
          delete child.component.axis[channel];
        }
      } else {
        // TODO: implement independent axes support
      }
    }
  }
  return axisGroup;
}


function getXAxesGroup(model: RepeatModel): VgMarkGroup {
  const hasCol = model.has(COLUMN);
  return extend(
    {
      name: model.name('x-axes'),
      type: 'group'
    },
    hasCol ? {
      from: { // TODO: if we do facet transform at the parent level we can same some transform here
        data: 'fields_column',
      }
    } : {},
    {
      properties: {
        update: {
          width: {field: {parent: model.child().sizeName('width')}},
          height: {
            field: {group: 'height'}
          },
          x: hasCol ? {
            scale: model.scaleName(COLUMN),
            field: 'data',
            // offset by the padding
            offset: model.scale(COLUMN).padding / 2
          } : {
            // offset by the padding
            value: model.config().facet.scale.padding / 2
          }
        }
      },
      axes: [parseAxis(X, model.child())]
    }
  );
}

function getYAxesGroup(model: RepeatModel): VgMarkGroup {
  const hasRow = model.has(ROW);
  return extend(
    {
      name: model.name('y-axes'),
      type: 'group'
    },
    hasRow ? {
      from: {
        data: 'fields_row'
      }
    } : {},
    {
      properties: {
        update: {
          width: {
            field: {group: 'width'}
          },
          height: {field: {parent: model.child().sizeName('height')}},
          y: hasRow ? {
            scale: model.scaleName(ROW),
            field: 'data',
            // offset by the padding
            offset: model.scale(ROW).padding / 2
          } : {
            // offset by the padding
            value: model.config().facet.scale.padding / 2
          }
        }
      },
      axes: [parseAxis(Y, model.child())]
    }
  );
}

function getRowGridGroups(model: RepeatModel): any[] { // TODO: VgMarks
  const facetGridConfig = model.config().facet.grid;

  const rowGrid = {
    name: model.name('row-grid'),
    type: 'rule',
    from: {
      data: model.dataTable(),
      transform: [{type: 'facet', groupby: [model.repeat()[ROW]]}]
    },
    properties: {
      update: {
        y: {
          scale: model.scaleName(ROW),
          field: model.repeat()[ROW]
        },
        x: {value: 0, offset: -facetGridConfig.offset },
        x2: {field: {group: 'width'}, offset: facetGridConfig.offset },
        stroke: { value: facetGridConfig.color },
        strokeOpacity: { value: facetGridConfig.opacity },
        strokeWidth: {value: 0.5}
      }
    }
  };

  return [rowGrid, {
    name: model.name('row-grid-end'),
    type: 'rule',
    properties: {
      update: {
        y: { field: {group: 'height'}},
        x: {value: 0, offset: -facetGridConfig.offset },
        x2: {field: {group: 'width'}, offset: facetGridConfig.offset },
        stroke: { value: facetGridConfig.color },
        strokeOpacity: { value: facetGridConfig.opacity },
        strokeWidth: {value: 0.5}
      }
    }
  }];
}

function getColumnGridGroups(model: RepeatModel): any { // TODO: VgMarks
  const facetGridConfig = model.config().facet.grid;

  const columnGrid = {
    name: model.name('column-grid'),
    type: 'rule',
    from: {
      data: model.dataTable(),
      transform: [{type: 'facet', groupby: [model.repeat()[COLUMN]]}]
    },
    properties: {
      update: {
        x: {
          scale: model.scaleName(COLUMN),
          field: model.repeat()[COLUMN]
        },
        y: {value: 0, offset: -facetGridConfig.offset},
        y2: {field: {group: 'height'}, offset: facetGridConfig.offset },
        stroke: { value: facetGridConfig.color },
        strokeOpacity: { value: facetGridConfig.opacity },
        strokeWidth: {value: 0.5}
      }
    }
  };

  return [columnGrid,  {
    name: model.name('column-grid-end'),
    type: 'rule',
    properties: {
      update: {
        x: { field: {group: 'width'}},
        y: {value: 0, offset: -facetGridConfig.offset},
        y2: {field: {group: 'height'}, offset: facetGridConfig.offset },
        stroke: { value: facetGridConfig.color },
        strokeOpacity: { value: facetGridConfig.opacity },
        strokeWidth: {value: 0.5}
      }
    }
  }];
}
