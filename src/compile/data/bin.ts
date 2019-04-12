import {isString} from 'vega-util';
import {BinParams, binToString, isBinning} from '../../bin';
import {Channel} from '../../channel';
import {binRequiresRange, isTypedFieldDef, normalizeBin, TypedFieldDef, vgField} from '../../channeldef';
import {Config} from '../../config';
import {BinTransform} from '../../transform';
import {Dict, duplicate, flatten, hash, keys, vals} from '../../util';
import {VgBinTransform, VgTransform} from '../../vega.schema';
import {binFormatExpression} from '../common';
import {isUnitModel, Model, ModelWithField} from '../model';
import {DataFlowNode} from './dataflow';

function rangeFormula(model: ModelWithField, fieldDef: TypedFieldDef<string>, channel: Channel, config: Config) {
  if (binRequiresRange(fieldDef, channel)) {
    // read format from axis or legend, if there is no format then use config.numberFormat

    const guide = isUnitModel(model) ? model.axis(channel) || model.legend(channel) || {} : {};

    const startField = vgField(fieldDef, {expr: 'datum'});
    const endField = vgField(fieldDef, {expr: 'datum', binSuffix: 'end'});

    return {
      formulaAs: vgField(fieldDef, {binSuffix: 'range', forAs: true}),
      formula: binFormatExpression(startField, endField, guide.format, config)
    };
  }
  return {};
}

function binKey(bin: BinParams, field: string) {
  return `${binToString(bin)}_${field}`;
}

function getSignalsFromModel(model: Model, key: string) {
  return {
    signal: model.getName(`${key}_bins`),
    extentSignal: model.getName(`${key}_extent`)
  };
}

function isBinTransform(t: TypedFieldDef<string> | BinTransform): t is BinTransform {
  return 'as' in t;
}

function createBinComponent(t: TypedFieldDef<string> | BinTransform, bin: boolean | BinParams, model: Model) {
  let as: [string, string];

  if (isBinTransform(t)) {
    as = isString(t.as) ? [t.as, `${t.as}_end`] : [t.as[0], t.as[1]];
  } else {
    as = [vgField(t, {forAs: true}), vgField(t, {binSuffix: 'end', forAs: true})];
  }

  const normalizedBin = normalizeBin(bin, undefined) || {};
  const key = binKey(normalizedBin, t.field);
  const {signal, extentSignal} = getSignalsFromModel(model, key);

  const binComponent: BinComponent = {
    bin: normalizedBin,
    field: t.field,
    as: [as],
    ...(signal ? {signal} : {}),
    ...(extentSignal ? {extentSignal} : {})
  };

  return {key, binComponent};
}

export interface BinComponent {
  bin: BinParams;
  field: string;
  extentSignal?: string;
  signal?: string;
  as: [string, string][];

  // Range Formula

  formula?: string;
  formulaAs?: string;
}

export class BinNode extends DataFlowNode {
  public clone() {
    return new BinNode(null, duplicate(this.bins));
  }

  constructor(parent: DataFlowNode, private bins: Dict<BinComponent>) {
    super(parent);
  }

  public static makeFromEncoding(parent: DataFlowNode, model: ModelWithField) {
    const bins = model.reduceFieldDef((binComponentIndex: Dict<BinComponent>, fieldDef, channel) => {
      if (isTypedFieldDef(fieldDef) && isBinning(fieldDef.bin)) {
        const {key, binComponent} = createBinComponent(fieldDef, fieldDef.bin, model);
        binComponentIndex[key] = {
          ...binComponent,
          ...binComponentIndex[key],
          ...rangeFormula(model, fieldDef, channel, model.config)
        };
      }
      return binComponentIndex;
    }, {});

    if (keys(bins).length === 0) {
      return null;
    }

    return new BinNode(parent, bins);
  }

  /**
   * Creates a bin node from BinTransform.
   * The optional parameter should provide
   */
  public static makeFromTransform(parent: DataFlowNode, t: BinTransform, model: Model) {
    const {key, binComponent} = createBinComponent(t, t.bin, model);
    return new BinNode(parent, {
      [key]: binComponent
    });
  }

  /**
   * Merge bin nodes. This method either integrates the bin config from the other node
   * or if this node already has a bin config, renames the corresponding signal in the model.
   */
  public merge(other: BinNode, model: Model) {
    for (const key of keys(other.bins)) {
      if (key in this.bins) {
        if (model) {
          model.renameSignal(other.bins[key].signal, this.bins[key].signal);
        }
        // Ensure that we don't have duplicate names for signal pairs
        const uniqueAs: Dict<[string, string]> = {};
        for (const as of [...this.bins[key].as, ...other.bins[key].as]) {
          uniqueAs[hash(as)] = as;
        }
        this.bins[key].as = vals(uniqueAs);
      } else {
        this.bins[key] = other.bins[key];
      }
    }

    for (const child of other.children) {
      other.removeChild(child);
      child.parent = this;
    }
    other.remove();
  }

  public producedFields() {
    return new Set(flatten(flatten(vals(this.bins).map(c => c.as))));
  }

  public dependentFields() {
    return new Set(vals(this.bins).map(c => c.field));
  }

  public hash() {
    return `Bin ${hash(this.bins)}`;
  }

  public assemble(): VgTransform[] {
    return flatten(
      vals(this.bins).map(bin => {
        const transform: VgTransform[] = [];
        const as = Array.from(bin.as);
        const asSignals = as.pop();
        const binTrans: VgBinTransform = {
          type: 'bin',
          field: bin.field,
          as: [asSignals[0], asSignals[1]],
          signal: bin.signal,
          ...bin.bin
        };

        if (!bin.bin.extent && bin.extentSignal) {
          transform.push({
            type: 'extent',
            field: bin.field,
            signal: bin.extentSignal
          });
          binTrans.extent = {signal: bin.extentSignal};
        }

        transform.push(binTrans);

        for (const asPair of as) {
          transform.push({
            type: 'formula',
            expr: vgField({field: asSignals[0]}, {expr: 'datum'}),
            as: asPair[0]
          });
          transform.push({
            type: 'formula',
            expr: vgField({field: asSignals[1]}, {expr: 'datum'}),
            as: asPair[1]
          });
        }

        if (bin.formula) {
          transform.push({
            type: 'formula',
            expr: bin.formula,
            as: bin.formulaAs
          });
        }

        return transform;
      })
    );
  }
}
