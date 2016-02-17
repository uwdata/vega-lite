/**
 * Module for compiling Vega-lite spec into Vega spec.
 */
import {Model} from './Model';

import {compileAxis} from './axis';
import {compileData} from './data';
import {compileLayoutData} from './layout';
import {facetMixins} from './facet';
import {compileLegends} from './legend';
import {compileMark} from './mark';
import {compileScales} from './scale';
import {extend, keys} from '../util';

import {LAYOUT} from '../data';
import {COLUMN, ROW, X, Y} from '../channel';

export {Model} from './Model';

export function compile(spec) {
  const model = new Model(spec);
  const config = model.config();

  // TODO: change type to become VgSpec
  const output = extend(
    spec.name ? { name: spec.name } : {},
    {
      // Set size to 1 because we rely on padding anyway
      width: 1,
      height: 1,
      padding: 'auto'
    },
    config.viewport ? { viewport: config.viewport } : {},
    config.background ? { background: config.background } : {},
    keys(config.scene).length > 0 ? scene(config) : {},
    {
      data: compileData(model).concat([compileLayoutData(model)]),
      marks: [].concat(
       (model.title() !== undefined ? [compileTitle(model)] : []),
       [compileRootGroup(model)]
     )
    }
  );

  return {
    spec: output
    // TODO: add warning / errors here
  };
}

function scene(config) {
  return ['fill', 'fillOpacity', 'stroke', 'strokeWidth',
    'strokeOpacity', 'strokeDash', 'strokeDashOffset'].
      reduce(function(topLevelConfig: any, property) {
      const value = config.scene[property];
      if (value !== undefined) {
        topLevelConfig.scene = topLevelConfig.scene || {};
        topLevelConfig.scene[property] = {value: value};
      }
      return topLevelConfig;
  }, {});
}

export function compileTitle(model: Model) {
  const title = model.title();
  return {
      name: model.name(title),
      type: 'text',
      from: {data: 'layout'},
      properties: {
        update: {
          x: {field: 'width', mult: 0.5},
          y: {value: 0},
          text: {value: title},
          fill: {value: 'black'},
          fontSize: {value: 16},
          align: {value: 'center'},
          fontWeight: {value: 'bold'}
        }
      }
    };
}

export function compileRootGroup(model: Model) {
  const spec = model.spec();

  let rootGroup:any = extend({
      name: spec.name ? spec.name + '-root' : 'root',
      type: 'group',
    },
    spec.description ? {description: spec.description} : {},
    {
      from: {data: LAYOUT},
      properties: {
        update: extend(
          model.title() !== undefined ? {y: {'value': 55} }: {},
          {
            width: {field: 'width'},
            height: {field: 'height'}
          }
        )
      }
    });

  const marks = compileMark(model);

  // Small Multiples
  if (model.has(ROW) || model.has(COLUMN)) {
    // put the marks inside a facet cell's group
    extend(rootGroup, facetMixins(model, marks));
  } else {
    rootGroup.marks = marks;
    rootGroup.scales = compileScales(model.channels(), model);

    var axes = (model.has(X) && model.axis(X) ? [compileAxis(X, model)] : [])
      .concat(model.has(Y) && model.axis(Y) ? [compileAxis(Y, model)] : []);
    if (axes.length > 0) {
      rootGroup.axes = axes;
    }
  }

  // legends (similar for either facets or non-facets
  var legends = compileLegends(model);
  if (legends.length > 0) {
    rootGroup.legends = legends;
  }
  return rootGroup;
}
