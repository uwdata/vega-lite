/**
 * Module for compiling Vega-lite spec into Vega spec.
 */
import {Model} from './Model';

import * as vlTime from './time';
import {compileAxis} from './axis';
import {compileData} from './data';
import {compileLegends} from './legend';
import {compileMarks} from './marks';
import {compileScales, compileScaleNames} from './scale';

// TODO: stop using default if we were to keep these files
import vlFacet from './facet';
import vlLayout from './layout';
import vlStack from './stack';
import vlStyle from './style';
import vlSubfacet from './subfacet';

import {stats as vlDataStats} from '../data';
import {COLUMN, ROW, X, Y} from '../channel';

export {Model} from './Model';

export function compile(spec, stats, theme?) {
  var model = new Model(spec, theme);
  // no need to pass stats if you pass in the data
  if (!stats) {
    if (model.hasValues()) {
        stats = vlDataStats(model.data().values);
    } else {
      console.error('No stats provided and data is not embedded.');
    }
  }

  var layout = vlLayout(model, stats);

  // TODO: change type to become VgSpec
  var output:any = {
      width: layout.width,
      height: layout.height,
      padding: 'auto',
      data: compileData(model),
      marks: [{
        name: 'cell',
        type: 'group',
        properties: {
          update: {
            width: model.has(COLUMN) ?
                     {value: layout.cellWidth} :
                     {field: {group: 'width'}},
            height: model.has(ROW) ?
                    {value: layout.cellHeight} :
                    {field: {group: 'height'}}
          }
        }
      }]
    };

  // global scales contains only time unit scales
  var timeScales = vlTime.scales(model);
  if (timeScales.length > 0) {
    output.scales = timeScales;
  }

  var group = output.marks[0];

  // marks
  var styleCfg = vlStyle(model, stats),
    mdefs = group.marks = compileMarks(model, layout, styleCfg),
    mdef = mdefs[mdefs.length - 1];  // TODO: remove this dirty hack by refactoring the whole flow

  var stack = model.stack();
  if (stack) {
    // modify mdef.{from,properties}
    vlStack(model, mdef, stack);
  }

  const marktype = model.marktype();
  const isLineType = marktype === 'line' || marktype === 'area';

  // handle subfacets
  var details = model.details();

  if (details.length > 0 && isLineType) {
    //subfacet to group area / line together in one group
    vlSubfacet(group, mdef, details);
  }

  // auto-sort line/area values
  if (isLineType && model.config('autoSortLine')) { // TODO: remove autoSortLine
    var f = (model.isMeasure(X) && model.isDimension(Y)) ? Y : X;
    if (!mdef.from) {
      mdef.from = {};
    }
    // TODO: why - ?
    mdef.from.transform = [{type: 'sort', by: '-' + model.fieldRef(f)}];
  }

  // get a flattened list of all scale names that are used in the vl spec
  var singleScaleNames = [].concat.apply([], mdefs.map(function(markProps) {
    return compileScaleNames(markProps.properties.update);
  }));

  var legends = compileLegends(model, styleCfg);

  // Small Multiples
  if (model.has(ROW) || model.has(COLUMN)) {
    output = vlFacet(group, model, layout, output, singleScaleNames, stats);
    if (legends.length > 0) {
      output.legends = legends;
    }
  } else {
    group.scales = compileScales(singleScaleNames, model, layout, stats);

    var axes = [];
    if (model.has(X)) {
      axes.push(compileAxis(X, model, layout, stats));
    }
    if (model.has(Y)) {
      axes.push(compileAxis(Y, model, layout, stats));
    }
    if (axes.length > 0) {
      group.axes = axes;
    }

    if (legends.length > 0) {
      group.legends = legends;
    }
  }

  return {
    spec: output
    // TODO: add warning / errors here
  };
}
