import {Spec} from '../schema/schema';
import {Bin} from '../schema/bin.schema';
import {FieldDef} from '../schema/fielddef.schema';

import {MAXBINS_DEFAULT} from '../bin';
import {COLUMN, ROW, X, Y, COLOR, SHAPE, DETAIL, Channel} from '../channel';
import {SOURCE, SUMMARY} from '../data';
import * as vlFieldDef from '../fielddef';
import * as vlEncoding from '../encoding';
import {compileLayout} from './layout';
import {AREA, BAR, POINT, TICK, CIRCLE, SQUARE, Mark} from '../mark';
import * as schema from '../schema/schema';
import * as schemaUtil from '../schema/schemautil';
import {StackProperties} from './stack';
import {getFullName, NOMINAL, ORDINAL, TEMPORAL} from '../type';
import {contains, duplicate} from '../util';
import * as time from './time';
import {Encoding} from '../schema/encoding.schema';


interface FieldRefOption {
  /** exclude bin, aggregate, timeUnit */
  nofn?: boolean;
  /** exclude aggregation function */
  noAggregate?: boolean;
  /** include 'datum.' */
  datum?: boolean;
  /** replace fn with custom function prefix */
  fn?: string;
  /** prepend fn with custom function prefix */
  prefn?: string;
  /** append suffix to the field ref for bin (default='_start') */
  binSuffix?: string;
}


/**
 * Internal model of Vega-Lite specification for the compiler.
 */

export class Model {
  _spec: Spec;
  _stack: StackProperties;
  _layout: any;

  // TODO: include _stack, _layout, _style, etc.

  constructor(spec: Spec, theme?) {
    var defaults = schema.instantiate();
    this._spec = schemaUtil.merge(defaults, theme || {}, spec);

    // convert short type to full type
    vlEncoding.forEach(this._spec.encoding, function(fieldDef: FieldDef, channel: Channel) {
      if (fieldDef.type) {
        fieldDef.type = getFullName(fieldDef.type);
      }
    });

    // calculate stack
    this._stack = this.getStackProperties();
    this._layout = compileLayout(this);
  }

  private getStackProperties(): StackProperties {
    var stackChannel = (this.has(COLOR)) ? COLOR : (this.has(DETAIL)) ? DETAIL : null;

    if (stackChannel &&
      (this.is(BAR) || this.is(AREA)) &&
      this.config('stack') !== false &&
      this.isAggregate()) {
      var isXMeasure = this.isMeasure(X);
      var isYMeasure = this.isMeasure(Y);

      if (isXMeasure && !isYMeasure) {
        return {
          groupbyChannel: Y,
          fieldChannel: X,
          stackChannel: stackChannel,
          config: this.config('stack')
        };
      } else if (isYMeasure && !isXMeasure) {
        return {
          groupbyChannel: X,
          fieldChannel: Y,
          stackChannel: stackChannel,
          config: this.config('stack')
        };
      }
    }
    return null;
  }

  layout(): any {
    return this._layout;
  }

  stack(): StackProperties {
    return this._stack;
  }

  toSpec(excludeConfig?, excludeData?) {
    var encoding = duplicate(this._spec.encoding),
      spec: any;

    spec = {
      mark: this._spec.mark,
      encoding: encoding
    };

    if (!excludeConfig) {
      spec.config = duplicate(this._spec.config);
    }

    if (!excludeData) {
      spec.data = duplicate(this._spec.data);
    }

    // remove defaults
    var defaults = schema.instantiate();
    return schemaUtil.subtract(spec, defaults);
  }

  mark() : Mark {
    return this._spec.mark;
  }

  spec(): Spec {
    return this._spec;
  }

  is(mark: Mark) {
    return this._spec.mark === mark;
  }

  has(channel: Channel) {
    // equivalent to calling vlenc.has(this._spec.encoding, channel)
    return this._spec.encoding[channel].field !== undefined;
  }

  fieldDef(channel: Channel): FieldDef {
    return this._spec.encoding[channel];
  }

  // get "field" reference for vega
  field(channel: Channel, opt?: FieldRefOption) {
    opt = opt || {};

    const fieldDef = this.fieldDef(channel);

    var f = (opt.datum ? 'datum.' : '') + (opt.prefn || ''),
      field = fieldDef.field;

    if (vlFieldDef.isCount(fieldDef)) {
      return f + 'count';
    } else if (opt.fn) {
      return f + opt.fn + '_' + field;
    } else if (!opt.nofn && fieldDef.bin) {
      var binSuffix = opt.binSuffix || '_start';
      return f + 'bin_' + field + binSuffix;
    } else if (!opt.nofn && !opt.noAggregate && fieldDef.aggregate) {
      return f + fieldDef.aggregate + '_' + field;
    } else if (!opt.nofn && fieldDef.timeUnit) {
      return f + fieldDef.timeUnit + '_' + field;
    } else {
      return f + field;
    }
  }

  fieldTitle(channel: Channel) : string {
    if (vlFieldDef.isCount(this._spec.encoding[channel])) {
      return vlFieldDef.COUNT_DISPLAYNAME;
    }
    var fn = this._spec.encoding[channel].aggregate || this._spec.encoding[channel].timeUnit || (this._spec.encoding[channel].bin && 'bin');
    if (fn) {
      return fn.toUpperCase() + '(' + this._spec.encoding[channel].field + ')';
    } else {
      return this._spec.encoding[channel].field;
    }
  }

  // returns false if binning is disabled, otherwise an object with binning properties
  bin(channel: Channel): Bin | boolean {
    var bin = this._spec.encoding[channel].bin;
    if (bin === {})
      return false;
    if (bin === true)
      return {
        maxbins: MAXBINS_DEFAULT
      };
    return bin;
  }

  numberFormat(channel?: Channel): string {
    // TODO(#497): have different number format based on numberType (discrete/continuous)
    return this.config('numberFormat');
  };

  map(f: (fd: FieldDef, c: Channel, e: Encoding) => any) {
    return vlEncoding.map(this._spec.encoding, f);
  }

  reduce(f: (acc: any, fd: FieldDef, c: Channel, e: Encoding) => any, init) {
    return vlEncoding.reduce(this._spec.encoding, f, init);
  }

  forEach(f: (fd: FieldDef, c: Channel, i:number) => void) {
    return vlEncoding.forEach(this._spec.encoding, f);
  }

  isOrdinalScale(channel: Channel) {
    const fieldDef = this.fieldDef(channel);
    return fieldDef && (
      contains([NOMINAL, ORDINAL], fieldDef.type) ||
      (fieldDef.type === TEMPORAL && fieldDef.timeUnit &&
        time.scale.type(fieldDef.timeUnit, channel) === 'ordinal')
      );
  }

  isDimension(channel: Channel) {
    return this.has(channel) &&
      vlFieldDef.isDimension(this.fieldDef(channel));
  }

  isMeasure(channel: Channel) {
    return this.has(channel) &&
      vlFieldDef.isMeasure(this.fieldDef(channel));
  }

  isAggregate() {
    return vlEncoding.isAggregate(this._spec.encoding);
  }

  isFacet() {
    return this.has(ROW) || this.has(COLUMN);
  }

  dataTable() {
    return this.isAggregate() ? SUMMARY : SOURCE;
  }

  data() {
    return this._spec.data;
  }

  /** returns whether the encoding has values embedded */
  hasValues() {
    var vals = this.data().values;
    return vals && vals.length;
  }

  config(name: string) {
    return this._spec.config[name];
  }

  markOpacity() : number {
    const opacity = this.config('marks').opacity;
    if (opacity) {
      return opacity;
    } else {
      if (contains([POINT, TICK, CIRCLE, SQUARE], this.mark())) {
        // point-based marks and bar
        if (!this.isAggregate() ||
          (this.has(DETAIL) || this.has(COLOR) || this.has(SHAPE))) {
          return 0.7;
        }
      }
    }
    return undefined;
  }
}
