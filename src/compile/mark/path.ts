import {Config} from '../../config';
import {FieldDef} from '../../fielddef';
import {GEOJSON} from '../../type';

import {applyColorAndOpacity} from '../common';
import {UnitModel} from '../unit';


export namespace path {
  export function markType() {
    return 'path';
  }

  export function properties(model: UnitModel, fixedShape?: string) {
    // TODO Use Vega's marks properties interface
    let p: any = {};
    const config = model.config();

    p.path = path(model.encoding().geopath);
    p.stroke = stroke(config);
    applyColorAndOpacity(p, model);
    return p;
  }

  function stroke(config: Config) {
    if (config && config.mark && config.mark.stroke) {
      return { value: config.mark.stroke};
    }
    // TODO: Default stroke is white ?
    return { value: 'white'};
  }

  function path(fieldDef: FieldDef) {
    if (fieldDef && fieldDef.type === GEOJSON) {
      return { field: 'layout_path' };
    }
    return undefined;
  }
}
