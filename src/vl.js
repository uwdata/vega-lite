'use strict';

require('./globals');

var util = require('./util'),
    consts = require('./consts');

var vl = {};

util.extend(vl, consts, util);

vl.Encoding = require('./Encoding');
vl.compile = require('./compile/compile');
vl.data = require('./data');
vl.enc = require('./enc');
vl.field = require('./field');
vl.parse = vl.Encoding.compile;
vl.schema = require('./schema/schema');
vl.toShorthand = vl.Encoding.shorthand;

module.exports = vl;