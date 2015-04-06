var test = require('tape');
var db = require('level-test')()();
var tracker = require('../')(db);
var through = require('through');

var expected = [
    { type: 'put', key: 'gorilla', value: { n: 6 } },
    { type: 'put', key: 'hack', value: { n: 2 } },
    { type: 'put', key: 'p', value: { n: 11 } },
    { type: 'put', key: 'f', value: { n: 2 } },
    { type: 'put', key: 'v', value: { n: 888 } },
    { type: 'put', key: 'c', value: { n: 333 } },
    { type: 'put', key: 'c', value: { n: 222 } }
];

test('put keys', function (t) {
    t.plan(expected.length);
    var tr = tracker({ objectMode: true });
    tr.pipe(through(function (row) {
        t.deepEqual(row, expected.shift());

        if (expected.length === 1) {
            tr.write('{"rm":["f","p"]}\n');
            tr.write('{"rm":"v"}\n');
            db.batch([
                { type: 'put', key: 'immobile', value: { n: 6 } },
                { type: 'put', key: 'c', value: { n: 222 } },
                { type: 'put', key: 'v', value: { n: 111 } }
            ]);
        }
    }));

    tr.write('"c"\n');
    tr.write('"v"\n');
    tr.write('["f","p"]\n');

    db.batch([
        { type: 'put', key: 'abbot', value: { n: 5 } },
        { type: 'put', key: 'potato', value: { n: 4 } },
        { type: 'put', key: 'gorilla', value: { n: 6 } },
        { type: 'put', key: 'hack', value: { n: 2 } },
        { type: 'put', key: 'queen', value: { n: 50 } },
        { type: 'put', key: 'p', value: { n: 11 } },
        { type: 'put', key: 'f', value: { n: 2 } },
        { type: 'put', key: 'v', value: { n: 888 } },
        { type: 'put', key: 'xylophone', value: { n: 555 } },
        { type: 'put', key: 'c', value: { n: 333 } }
    ]);

    t.on('end', function () { tr.end() });
});
