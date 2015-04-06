var test = require('tape');
var db = require('level-test')()();
var tracker = require('../')(db);
var through = require('through');

var expected = [
    { type: 'put', key: 'gorilla', value: { n: 6 } },
    { type: 'put', key: 'hack', value: { n: 2 } },
    { type: 'put', key: 'p', value: { n: 11 } },
    { type: 'put', key: 'f', value: { n: 2 } },
    { type: 'put', key: 'c', value: { n: 333 } }
];

test('put keys', function (t) {
    t.plan(expected.length * 2);

    var tr = tracker({ objectMode: true });
    tr.pipe(through(function (row) {
        t.ok(row.key >= 'f' && row.key <= 'p' || row.key === 'c');
        t.deepEqual(row, expected.shift());
    }));

    tr.write('"c"\n');
    tr.write('["f","p"]\n');

    db.batch([
        { type: 'put', key: 'abbot', value: { n: 5 } },
        { type: 'put', key: 'potato', value: { n: 4 } },
        { type: 'put', key: 'gorilla', value: { n: 6 } },
        { type: 'put', key: 'hack', value: { n: 2 } },
        { type: 'put', key: 'queen', value: { n: 50 } },
        { type: 'put', key: 'p', value: { n: 11 } },
        { type: 'put', key: 'f', value: { n: 2 } },
        { type: 'put', key: 'xylophone', value: { n: 555 } },
        { type: 'put', key: 'c', value: { n: 333 } }
    ]);

    t.on('end', function () { tr.end(); });
});
