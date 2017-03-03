"use strict";
var chai_1 = require("chai");
var init_1 = require("../../../src/compile/scale/init");
var config_1 = require("../../../src/config");
describe('compile/scale', function () {
    describe('init', function () {
        it('should output only padding without default paddingInner and paddingOuter if padding is specified for a band scale', function () {
            var scale = init_1.default('x', { field: 'a', type: 'ordinal', scale: { type: 'band', padding: 0.6 } }, config_1.defaultConfig, 'bar', 100, []);
            chai_1.assert.equal(scale.padding, 0.6);
            chai_1.assert.isUndefined(scale.paddingInner);
            chai_1.assert.isUndefined(scale.paddingOuter);
        });
        it('should output default paddingInner and paddingOuter = paddingInner/2 if none of padding properties is specified for a band scale', function () {
            var scale = init_1.default('x', { field: 'a', type: 'ordinal', scale: { type: 'band' } }, { scale: { bandPaddingInner: 0.3 } }, 'bar', 100, []);
            chai_1.assert.equal(scale.paddingInner, 0.3);
            chai_1.assert.equal(scale.paddingOuter, 0.15);
            chai_1.assert.isUndefined(scale.padding);
        });
    });
});
//# sourceMappingURL=init.test.js.map