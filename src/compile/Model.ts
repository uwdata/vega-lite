import {Spec} from '../schema/schema';
import {schemaOLD} from '../schema/schema';
import {AxisProperties} from '../schema/axis.schema';
import {LegendProperties} from '../schema/legend.schema';
import {Scale} from '../schema/scale.schema';
import {Encoding} from '../schema/encoding.schema';
import {FieldDef} from '../schema/fielddef.schema';
import {defaultConfig, Config} from '../schema/config.schema';
import * as schemaUtil from '../schema/schemautil';

import {COLUMN, ROW, X, Y, COLOR, SHAPE, SIZE, TEXT, PATH, ORDER, Channel, supportMark} from '../channel';
import {SOURCE, SUMMARY} from '../data';
import * as vlFieldDef from '../fielddef';
import {FieldRefOption} from '../fielddef';
import * as vlEncoding from '../encoding';
import {Mark, BAR, TICK, TEXT as TEXTMARK} from '../mark';

import {getFullName, QUANTITATIVE} from '../type';
import {duplicate, extend} from '../util';

import {compileMarkConfig} from './config';
import {compileStackProperties, StackProperties} from './stack';
import {type as scaleType} from './scale';


/**
 * Internal model of Vega-Lite specification for the compiler.
 */
export class Model {
  private _spec: Spec;
  private _stack: StackProperties;

  private _axis: {
    x?: AxisProperties;
    y?: AxisProperties;
    row?: AxisProperties;
    column?: AxisProperties;
  };

  private _legend: {
    color?: LegendProperties;
    size?: LegendProperties;
    shape?: LegendProperties;
  };

  private _config: Config;

  constructor(spec: Spec) {
    // TODO: remove
    var defaults = this.instantiate();
    this._spec = schemaUtil.mergeDeep(defaults, spec);

    const mark = this._spec.mark;
    const encoding = this._spec.encoding;
    const config = this._config = schemaUtil.mergeDeep(duplicate(defaultConfig), spec.config);

    vlEncoding.forEach(this._spec.encoding, function(fieldDef: FieldDef, channel: Channel) {
      if (!supportMark(channel, this._spec.mark)) {
        // Drop unsupported channel

        // FIXME consolidate warning method
        console.warn(channel, 'dropped as it is incompatible with', this._spec.mark);
        delete this._spec.encoding[channel].field;
      }

      if (fieldDef.type) {
        // convert short type to full type
        fieldDef.type = getFullName(fieldDef.type);
      }

      if ((channel === PATH || channel === ORDER) && !fieldDef.aggregate && fieldDef.type === QUANTITATIVE) {
        fieldDef.aggregate = 'min';
      }

      // TODO instantiate bin here

      // set default bandWidth for X and Y
      if (channel === X && fieldDef.scale.bandWidth === undefined) {
        // This should be zero for the sake of text table.
        fieldDef.scale.bandWidth = this.isOrdinalScale(X) && this.mark() === 'text' ?
          90 : // TODO: config.scale.textBandWidth
          21; // TODO: config.scale.bandWidth
      }
      if (channel === Y && fieldDef.scale.bandWidth === undefined) {
        // This should be zero for the sake of text table.
        fieldDef.scale.bandWidth = 21;
      }

      // set default padding for ROW and COLUMN
      if (channel === ROW && fieldDef.scale.padding === undefined) {
        // This should be zero for the sake of text table.
        fieldDef.scale.padding = this.has(Y) ? 16 : 0;
      }
      if (channel === COLUMN && fieldDef.scale.padding === undefined) {
        // This should be zero for the sake of text table.
        fieldDef.scale.padding = this.has(X) ? 16 : 0;
      }
    }, this);

    // Initialize Axis
    this._axis = [X, Y, ROW, COLUMN].reduce(function(_axis, channel) {
      // Position Axis
      if (vlEncoding.has(encoding, channel)) {
        const channelAxis = encoding[channel].axis;
        if (channelAxis !== false) {
          _axis[channel] = extend({},
            channel === X || channel === Y ? config.axis : config.facet.axis,
            channelAxis === true ? {} : channelAxis ||  {}
          );
        }
      }
      return _axis;
    }, {});

    // initialize legend
    this._legend = [COLOR, SHAPE, SIZE].reduce(function(_legend, channel) {
      if (vlEncoding.has(encoding, channel)) {
        const channelLegend = encoding[channel].legend;
        if (channelLegend !== false) {
          _legend[channel] = extend({}, config.legend,
            channelLegend === true ? {} : channelLegend ||  {}
          );
        }
      }
      return _legend;
    }, {});

    // calculate stack
    this._stack = compileStackProperties(mark, encoding, config);
    this._config.mark = compileMarkConfig(mark, encoding, config, this._stack);
  }

  public stack(): StackProperties {
    return this._stack;
  }

  public toSpec(excludeConfig?, excludeData?) {
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
    var defaults = this.instantiate();
    return schemaUtil.subtract(spec, defaults);
  }

  public mark(): Mark {
    return this._spec.mark;
  }

  // TODO: remove
  public spec(): Spec {
    return this._spec;
  }

  public instantiate() {
    const so = schemaUtil.instantiate(schemaOLD);
    return so;
  }

  public is(mark: Mark) {
    return this._spec.mark === mark;
  }

  public has(channel: Channel) {
    return vlEncoding.has(this._spec.encoding, channel);
  }

  public encoding() {
    return this._spec.encoding;
  }

  public fieldDef(channel: Channel): FieldDef {
    return this._spec.encoding[channel];
  }

  /** Get "field" reference for vega */
  public field(channel: Channel, opt: FieldRefOption = {}) {
    const fieldDef = this.fieldDef(channel);
    const scale = this.scale(channel);

    if (fieldDef.bin) { // bin has default suffix that depends on scaleType
      opt = extend({
        binSuffix: scaleType(scale, fieldDef, channel, this.mark()) === 'ordinal' ? '_range' : '_start'
      }, opt);
    }

    return vlFieldDef.field(fieldDef, opt);
  }

  public fieldTitle(channel: Channel): string {
    return vlFieldDef.title(this._spec.encoding[channel]);
  }

  public channels(): Channel[] {
    return vlEncoding.channels(this._spec.encoding);
  }

  public map(f: (fd: FieldDef, c: Channel, e: Encoding) => any, t?: any) {
    return vlEncoding.map(this._spec.encoding, f, t);
  }

  public reduce(f: (acc: any, fd: FieldDef, c: Channel, e: Encoding) => any, init, t?: any) {
    return vlEncoding.reduce(this._spec.encoding, f, init, t);
  }

  public forEach(f: (fd: FieldDef, c: Channel, i:number) => void, t?: any) {
    vlEncoding.forEach(this._spec.encoding, f, t);
  }

  public isOrdinalScale(channel: Channel) {
    const fieldDef = this.fieldDef(channel);
    const scale = this.scale(channel);

    return fieldDef && scaleType(scale, fieldDef, channel, this.mark()) === 'ordinal';
  }

  public isDimension(channel: Channel) {
    return vlFieldDef.isDimension(this.fieldDef(channel));
  }

  public isMeasure(channel: Channel) {
    return vlFieldDef.isMeasure(this.fieldDef(channel));
  }

  public isAggregate() {
    return vlEncoding.isAggregate(this._spec.encoding);
  }

  public isFacet() {
    return this.has(ROW) || this.has(COLUMN);
  }

  public dataTable() {
    return this.isAggregate() ? SUMMARY : SOURCE;
  }

  public data() {
    return this._spec.data;
  }

  public transform() {
    return this._spec.transform;
  }

  /** returns whether the encoding has values embedded */
  public hasValues() {
    var vals = this.data().values;
    return vals && vals.length;
  }

  /**
   * Get the spec configuration.
   */
  public config() {
    return this._config;
  }

  public sort(channel: Channel) {
    return this._spec.encoding[channel].sort;
  }

  public scale(channel: Channel): Scale {
    return this._spec.encoding[channel].scale;
  }

  public axis(channel: Channel): AxisProperties {
    return this._axis[channel];
  }

  public legend(channel: Channel): LegendProperties {
    return this._legend[channel];
  }

  /** returns scale name for a given channel */
  public scaleName(channel: Channel): string {
    const name = this.spec().name;
    return (name ? name + '-' : '') + channel;
  }

  public sizeValue(channel: Channel = SIZE) {
    const value = this.fieldDef(SIZE).value;
    if (value !== undefined) {
       return value;
    }
    switch (this.mark()) {
      case TEXTMARK:
        return this.config().mark.fontSize; // font size 10 by default
      case BAR:
        if (this.config().mark.barWidth) {
          return this.config().mark.barWidth;
        }
        // BAR's size is applied on either X or Y
        return this.isOrdinalScale(channel) ?
            // For ordinal scale or single bar, we can use bandWidth - 1
            // (-1 so that the border of the bar falls on exact pixel)
            this.scale(channel).bandWidth - 1 :
          !this.has(channel) ?
            21 : /* config.scale.bandWidth */
            2; /* TODO: config.mark.thinBarWidth*/  // otherwise, set to 2 by default
      case TICK:
        if (this.config().mark.tickWidth) {
          return this.config().mark.tickWidth;
        }
        const bandWidth = this.has(channel) ?
          this.scale(channel).bandWidth :
          21; /* config.scale.bandWidth */
        return bandWidth / 1.5;
    }
    return this.config().mark.size;
  }
}
