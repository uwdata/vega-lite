import {UnitModel} from '../unit';
import {OrderChannelDef} from '../../fielddef';

import {X, Y, COLOR, TEXT, SHAPE, PATH, ORDER, DETAIL, LABEL} from '../../channel';
import {AREA, LINE, TEXT as TEXTMARK} from '../../mark';
import {imputeTransform, stackTransform} from '../stack';
import {contains, extend} from '../../util';
import {area} from './area';
import {bar} from './bar';
import {line} from './line';
import {point, circle, square} from './point';
import {text} from './text';
import {tick} from './tick';
import {rule} from './rule';
import {sortField} from '../common';

const markCompiler = {
  area: area,
  bar: bar,
  line: line,
  point: point,
  text: text,
  tick: tick,
  rule: rule,
  circle: circle,
  square: square
};

export function parseMark(model: UnitModel): any[] {
  if (contains([LINE, AREA], model.mark())) {
    return parsePathMark(model);
  } else {
    return parseNonPathMark(model);
  }
}

function parsePathMark(model: UnitModel) { // TODO: extract this into compilePathMark
  const mark = model.mark();
  // TODO: replace this with more general case for composition
  const isFaceted = model.parent() && model.parent().isFacet();
  const dataFrom = {data: model.dataTable()};
  const details = detailFields(model);

  let pathMarks: any = [
    {
      name: model.name('marks'),
      type: markCompiler[mark].markType(),
      from: extend(
        // If has facet, `from.data` will be added in the cell group.
        // If has subfacet for line/area group, `from.data` will be added in the outer subfacet group below.
        // If has no subfacet, add from.data.
        isFaceted || details.length > 0 ? {} : dataFrom,

        // sort transform
        {transform: [{ type: 'sort', by: sortPathBy(model)}]}
      ),
      properties: { update: markCompiler[mark].properties(model) }
    }
  ];

  if (details.length > 0) { // have level of details - need to facet line into subgroups
    const facetTransform = { type: 'facet', groupby: details };
    const transform: any[] = mark === AREA && model.stack() ?
      // For stacked area, we need to impute missing tuples and stack values
      // (Mark layer order does not matter for stacked charts)
      [imputeTransform(model), stackTransform(model), facetTransform] :
      // For non-stacked path (line/area), we need to facet and possibly sort
      [].concat(
        facetTransform,
        // if model has `order`, then sort mark's layer order by `order` field(s)
        model.has(ORDER) ? [{type:'sort', by: sortBy(model)}] : []
      );

    return [{
      name: model.name('pathgroup'),
      type: 'group',
      from: extend(
        // If has facet, `from.data` will be added in the cell group.
        // Otherwise, add it here.
        isFaceted ? {} : dataFrom,
        {transform: transform}
      ),
      properties: {
        update: {
          width: { field: { group: 'width' } },
          height: { field: { group: 'height' } }
        }
      },
      marks: pathMarks
    }];
  } else {
    return pathMarks;
  }
}

function parseNonPathMark(model: UnitModel) {
  const mark = model.mark();
  const isFaceted = model.parent() && model.parent().isFacet();
  const dataFrom = {data: model.dataTable()};

  let marks = []; // TODO: vgMarks
  if (mark === TEXTMARK &&
    model.has(COLOR) &&
    model.config().mark.applyColorToBackground && !model.has(X) && !model.has(Y)
  ) {
    // add background to 'text' marks if has color
    marks.push(extend(
      {
        name: model.name('background'),
        type: 'rect'
      },
      // If has facet, `from.data` will be added in the cell group.
      // Otherwise, add it here.
      isFaceted ? {} : {from: dataFrom},
      // Properties
      { properties: { update: text.background(model) } }
    ));
  }

  marks.push(extend(
    {
      name: model.name('marks'),
      type: markCompiler[mark].markType()
    },
    // Add `from` if needed
    (!isFaceted || model.stack() || model.has(ORDER)) ? {
      from: extend(
        // If faceted, `from.data` will be added in the cell group.
        // Otherwise, add it here
        isFaceted ? {} : dataFrom,
        // `from.transform`
        model.stack() ? // Stacked Chart need stack transform
          { transform: [stackTransform(model)] } :
        model.has(ORDER) ?
          // if non-stacked, detail field determines the layer order of each mark
          { transform: [{type:'sort', by: sortBy(model)}] } :
          {}
      )
    } : {},
    // properties groups
    { properties: { update: markCompiler[mark].properties(model) } }
  ));

  if (model.has(LABEL) && markCompiler[mark].labels) {
    const labelProperties = markCompiler[mark].labels(model);

    // check if we have label method for current mark type.
    if (labelProperties !== undefined) { // If label is supported
      // add label group
      marks.push(extend(
        {
          name: model.name('label'),
          type: 'text'
        },
        // If has facet, `from.data` will be added in the cell group.
        // Otherwise, add it here.
        isFaceted ? {} : {from: dataFrom},
        // Properties
        { properties: { update: labelProperties } }
      ));
    }
  }

  return marks;
}

function sortBy(model: UnitModel): string | string[] {
  if (model.has(ORDER)) {
    let channelDef = model.encoding().order;
    if (channelDef instanceof Array) {
      // sort by multiple fields
      return channelDef.map(sortField);
    } else {
      // sort by one field
      return sortField(channelDef as OrderChannelDef); // have to add OrderChannelDef to make tsify not complaining
    }
  }
  return null; // use default order
}

/**
 * Return path order for sort transform's by property
 */
function sortPathBy(model: UnitModel): string | string[] {
  if (model.mark() === LINE && model.has(PATH)) {
    // For only line, sort by the path field if it is specified.
    const channelDef = model.encoding().path;
    if (channelDef instanceof Array) {
      // sort by multiple fields
      return channelDef.map(sortField);
    } else {
      // sort by one field
      return sortField(channelDef as OrderChannelDef); // have to add OrderChannelDef to make tsify not complaining
    }
  } else {
    // For both line and area, we sort values based on dimension by default
    // FIXME: need to make sure we always get a text
    return '-' + model.fieldRef(model.config().mark.orient === 'horizontal' ? Y : X);
  }
}

/**
 * Returns list of detail fields (for 'color', 'shape', or 'detail' channels)
 * that the model's spec contains.
 */
function detailFields(model: UnitModel): string[] {
  return [COLOR, DETAIL, SHAPE].reduce(function(details, channel) {
    if (model.has(channel) && !model.fieldDef(channel).aggregate) {
      details.push(model.fieldRef(channel));
    }
    return details;
  }, []);
}
