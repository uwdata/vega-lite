import {DateTime, isDateTime} from '../../datetime';
import {FieldDef, isCount} from '../../fielddef';
import {isEqualFilter, isOneOfFilter, isRangeFilter} from '../../filter';
import * as log from '../../log';
import {CalculateTransform, FilterTransform, isCalculate, isFilter} from '../../transform';
import {QUANTITATIVE, TEMPORAL} from '../../type';
import {Dict, extend, isArray, isNumber, isString, keys} from '../../util';
import {VgFormulaTransform} from '../../vega.schema';
import {Model} from '../model';
import {DataFlowNode} from './dataflow';


function parseExpression(field: string, parse: string): string {
  const f = `datum["${field}"]`;
  if (parse === 'number') {
    return `toNumber(${f})`;
  } else if (parse === 'boolean') {
    return `toBoolean(${f})`;
  } else if (parse === 'string') {
    return `toString(${f})`;
  } else if (parse === 'date') {
    return `toDate(${f})`;
  } else if (parse.indexOf('date:') === 0) {
    const specifier = parse.slice(6, parse.length - 1);  // specifier is in ""
    return `timeParse(${f},"${specifier}")`;
  } else {
    log.warn(log.message.unrecognizedParse(parse));
    return null;
  }
}

export class ParseNode extends DataFlowNode {
  private _parse: Dict<string> = {};

  constructor(parse: Dict<string>) {
    super();

    this._parse = parse;
  }

  public static make(model: Model) {
    const parse = {};

    const calcFieldMap = model.transforms.filter(isCalculate).reduce((fieldMap, formula: CalculateTransform) => {
      fieldMap[formula.as] = true;
      return fieldMap;
    }, {});

    // Parse filter fields
    model.transforms.filter(isFilter).forEach((transform: FilterTransform) => {
      let filter = transform.filter;
      if (!isArray(filter)) {
        filter = [filter];
      }
      filter.forEach(f => {
        let val: string | number | boolean | DateTime = null;
        // For EqualFilter, just use the equal property.
        // For RangeFilter and OneOfFilter, all array members should have
        // the same type, so we only use the first one.
        if (isEqualFilter(f)) {
          val = f.equal;
        } else if (isRangeFilter(f)) {
          val = f.range[0];
        } else if (isOneOfFilter(f)) {
          val = (f.oneOf || f['in'])[0];
        } // else -- for filter expression, we can't infer anything

        if (val) {
          if (isDateTime(val)) {
            parse[f['field']] = 'date';
          } else if (isNumber(val)) {
            parse[f['field']] = 'number';
          } else if (isString(val)) {
            parse[f['field']] = 'string';
          }
        }
      });
    });

    // Parse encoded fields
    model.forEachFieldDef((fieldDef: FieldDef) => {
      if (fieldDef.type === TEMPORAL) {
        parse[fieldDef.field] = 'date';
      } else if (fieldDef.type === QUANTITATIVE) {
        if (isCount(fieldDef) || calcFieldMap[fieldDef.field]) {
          return;
        }
        parse[fieldDef.field] = 'number';
      }
    });

    // Custom parse should override inferred parse
    const data = model.data;
    if (data && data.format && data.format.parse) {
      const p = data.format.parse;
      keys(p).forEach((field) => {
        parse[field] = p[field];
      });
    }

    return new ParseNode(parse);
  }

  public get parse() {
    return this._parse;
  }


  public merge(other: ParseNode) {
    this._parse = extend(this._parse, other.parse);
    other.remove();
  }

  public assembleFormatParse() {
    return this._parse;
  }

  public assembleTransforms(): VgFormulaTransform[] {
    return Object.keys(this._parse).map(field => {
      const expr = parseExpression(field, this._parse[field]);
      if (!expr) {
        return null;
      }

      const formula: VgFormulaTransform = {
        type: 'formula',
        expr,
        as: field
      };
      return formula;
    }).filter(t => t !== null);
  }
}
