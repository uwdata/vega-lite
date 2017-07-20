/**
 * Module for compiling Vega-lite spec into Vega spec.
 */
import {Config, initConfig, stripConfig} from '../config';
import * as log from '../log';
import {normalize, TopLevel, TopLevelExtendedSpec} from '../spec';
import {extractTopLevelProperties, TopLevelProperties} from '../toplevelprops';
import {extend, keys} from '../util';
import {buildModel} from './common';
import {LayerModel} from './layer';
import {Model} from './model';
import {UnitModel} from './unit';


export function compile(inputSpec: TopLevelExtendedSpec, logger?: log.LoggerInterface) {
  if (logger) {
    // set the singleton logger to the provided logger
    log.set(logger);
  }

  try {
    // 1. initialize config
    const config = initConfig(inputSpec.config);

    // 2. Convert input spec into a normal form
    // (Decompose all extended unit specs into composition of unit spec.)
    const spec = normalize(inputSpec, config);

    // 3. Instantiate the model with default config
    const model = buildModel(spec, null, '', undefined, undefined, config);

    // 4. Parse each part of the model to produce components that will be assembled later
    // We traverse the whole tree to parse once for each type of components
    // (e.g., data, layout, mark, scale).
    // Please see inside model.parse() for order for compilation.
    model.parse();

    // 5. Assemble a Vega Spec from the parsed components in 3.
    return assemble(model, getTopLevelProperties(inputSpec, config));
  } finally {
    // Reset the singleton logger if a logger is provided
    if (logger) {
      log.reset();
    }
  }
}


function getTopLevelProperties(topLevelSpec: TopLevel<any>, config: Config) {
  return {
    ...extractTopLevelProperties(config),
    ...extractTopLevelProperties(topLevelSpec),
  };
}

function assemble(model: Model, topLevelProperties: TopLevelProperties) {
  // TODO: change type to become VgSpec

  // Config with Vega-Lite only config removed.
  const vgConfig = model.config ? stripConfig(model.config) : undefined;

  // autoResize has to be put under autosize
  const {autoResize, ...topLevelProps} = topLevelProperties;

  const encode = model.assembleParentGroupProperties();
  if (encode) {
    delete encode.width;
    delete encode.height;
  }

  const output = {
    $schema: 'https://vega.github.io/schema/vega/v3.0.json',
    ...(model.description ? {description: model.description} : {}),
    // By using Vega layout, we don't support custom autosize
    autosize: topLevelProperties.autoResize ? {type: 'pad', resize: true} : 'pad',
    ...topLevelProps,
    ...(encode ? {encode: {update: encode}} : {}),
    data: [].concat(
      model.assembleSelectionData([]),
      model.assembleData()
    ),
    ...model.assembleGroup(
      [].concat(
        model.assembleLayoutSignals({mode: 'combined'}),
        model.assembleSelectionTopLevelSignals([])
      )
    ),
    ...(vgConfig ? {config: vgConfig} : {})
  };

  return {
    spec: output
    // TODO: add warning / errors here
  };
}
