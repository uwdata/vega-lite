import * as aggregate from './aggregate';
import * as axis from './axis';
import * as bin from './bin';
import * as channel from './channel';
import * as compositeMark from './compositemark';
export {TopLevelSpec} from './spec';
export {compile} from './compile/compile';
export {Config} from './config';
import * as config from './config';
import * as data from './data';
import * as datetime from './datetime';
import * as encoding from './encoding';
import * as facet from './facet';
import * as fieldDef from './fielddef';
import * as header from './header';
import * as legend from './legend';
import * as mark from './mark';
import * as scale from './scale';
import * as sort from './sort';
import * as spec from './spec';
import * as stack from './stack';
import * as timeUnit from './timeunit';
import * as transform from './transform';
import * as type from './type';
import * as util from './util';
import * as validate from './validate';

import pkg from '../package.json';
const version = pkg.version;

export {aggregate, axis, bin, channel, compositeMark, config, data, datetime, encoding, facet, fieldDef, header, legend, mark, scale, sort, spec, stack, timeUnit, transform, type, util, validate, version};
