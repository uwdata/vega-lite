'use strict';

var expect = require('chai').expect,
  _ = require('lodash');

var vlsort = require('../../src/compile/sort'),
  Encoding = require('../../src/Encoding');

describe('Sort', function() {
  var encoding = Encoding.fromSpec({
        enc: {
          x: {name: 'foo', type: 'O', sort: [{
            name: 'bar', aggr: 'avg'
          }]},
          y: {name: 'bar', type: 'Q'},
          color: {name: 'baz', type: 'O', sort: [{
            name: 'bar', aggr: 'sum'
          }, {
            name: 'foo', aggr: 'max', reverse: true
          }]}
        }
      }),
    sorting = vlsort({data: [{name: RAW}, {name: TABLE}]}, encoding, {}),
    spec = sorting.spec;

  it('should add new data and transform', function() {
    expect(spec.data.length).to.equal(4);

    expect(spec.data[2].transform).to.deep.equal([
      {
        type: 'aggregate',
        groupby: [ 'data.foo' ],
        fields: [{
          field: 'data.bar',
          op: 'avg'
        }]
      },
      { type: 'sort', by: [ 'data.avg_bar' ] }
    ]);

    expect(spec.data[3].transform).to.deep.equal([
      {
        type: 'aggregate',
        groupby: [ 'data.baz' ],
        fields: [{
          field: 'data.bar',
          op: 'sum'
        }, {
          field: 'data.foo',
          op: 'max'
        }]
      },
      { type: 'sort', by: [ 'data.sum_bar', '-data.max_foo' ] }
    ]);
  });

  it('should set correct mapping', function() {
    expect(sorting.getDataset('x')).to.equal('sorted0');
    expect(sorting.getDataset('color')).to.equal('sorted1');
    expect(sorting.getDataset('y')).to.equal('table');
  });
});
