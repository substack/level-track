var through = require('through');
var combine = require('stream-combiner');
var split = require('split');
var hooks = require('level-hooks');

module.exports = function (db) {
    hooks(db);
    var trackingKeys = {};
    var trackingRange = [];
    db.hooks.post({ start: '', end: '~' }, function (change) {
        if (trackingKeys[change.key]) {
            trackingKeys[change.key].forEach(function (stream) {
                if (stream._objectMode) stream.queue(change)
                else stream.queue(JSON.stringify(change) + '\n')
            });
        }
        for (var i = 0, l = trackingRange.length; i < l; i++) {
            // todo: binary search for start and end keys
            var r = trackingRange[i];
            if (change.key >= r.start && change.key <= r.end) {
                if (r.stream._objectMode) r.stream.queue(change)
                else r.stream.queue(JSON.stringify(change) + '\n')
            }
        }
    });

    return function (opts) {
        if (!opts) opts = {};
        var keyMap = opts.keyMap || function (x) { return x };

        var localKeys = [];
        var localRange = [];
        var output = through(write, end);
        output._objectMode = opts.objectMode;
        return combine(split(), output);

        function write (line) {
            try { var row = JSON.parse(line) }
            catch (e) { return }

            if (typeof row === 'string') {
                localKeys.push(row);
                if (!trackingKeys[row]) trackingKeys[row] = [];
                trackingKeys[row].push(output);
            }
            else if (Array.isArray(row)) {
                var ref = {
                    start: keyMap(row[0]),
                    end: keyMap(row[1]),
                    stream: output
                };
                if (row.length >= 3) {
                    ref.since = keyMap(row[2]);
                    var params = { start: ref.since + '\x00', end: ref.end };
                    db.createReadStream(params)
                        .pipe(through(function (row) {
                            if (opts.objectMode) output.queue(row)
                            else output.queue(JSON.stringify(row) + '\n');
                        }))
                    ;
                }
                trackingRange.push(ref);
                localRange.push(ref);
            }
            else if (row && typeof row === 'object' && row.rm
            && typeof row.rm === 'string') {
                removeKey(row.rm);
            }
            else if (row && typeof row === 'object' && row.rm
            && Array.isArray(row.rm)) {
                removeRange(findRange(row.rm));
            }
        }

        function end () {
            localKeys.forEach(removeKey);
            localRange.forEach(removeRange);
            output.queue(null);
        }

        function removeKey (key) {
            var xs = trackingKeys[key];
            if (!xs) return;
            var ix = xs.indexOf(output);
            if (ix >= 0) xs.splice(ix, 1);
            if (ix.length === 0) delete trackingKeys[key];
        }

        function removeRange (r) {
            var ix = trackingRange.indexOf(r);
            if (ix >= 0) trackingRange.splice(ix, 1);
        }

        function findRange (rf) {
            for (var i = 0; i < trackingRange.length; i++) {
                var r = trackingRange[i];
                if (rf[0] == r.start && rf[1] === r.end && rf[2] === r.since) {
                    return r;
                }
            }
        }
    };
};
