# level-track

keep track of all the active queries from a request to route live updates

[![build status](https://secure.travis-ci.org/substack/level-track.png)](http://travis-ci.org/substack/level-track)

# example

In this example we'll subscribe to the range of keys `"f"` through `"p"` and the
singular key `"c"`. The database is then populated with random keys and values
to show that only keys `"f"` through `"p"` inclusive and `"c"` are captured.

``` js
var db = require('level')('test.db');
var tracker = require('level-track')(db);
var through = require('through');

var t = tracker();
t.pipe(process.stdout);

t.write('"c"\n');
t.write('["f","p"]\n');

setInterval(function () {
    var l = Math.floor(Math.random() * 2) + 1;
    var key = '';
    for (var i = 0; i < l; i++) {
        key += String.fromCharCode(Math.random() * 26 + 97);
    }
    db.put(key, { n: Math.floor(Math.random() * 100) });
}, 250);
```

output:

```
{"type":"put","key":"jr","value":{"n":92}}
{"type":"put","key":"ft","value":{"n":41}}
{"type":"put","key":"g","value":{"n":32}}
{"type":"put","key":"c","value":{"n":55}}
{"type":"put","key":"kh","value":{"n":60}}
{"type":"put","key":"m","value":{"n":43}}
{"type":"put","key":"p","value":{"n":40}}
{"type":"put","key":"nc","value":{"n":64}}
{"type":"put","key":"l","value":{"n":70}}
{"type":"put","key":"fy","value":{"n":41}}
{"type":"put","key":"kp","value":{"n":98}}
{"type":"put","key":"mk","value":{"n":48}}
{"type":"put","key":"h","value":{"n":27}}
^C
```

# protocol

The tracking protocol is newline-delimited json.
Each line should match one of these formats:

## "key"

Receive updates from a single key.

## ["startkey","endkey"]

Receive updates from the range `"startkey"` through `"endkey"`, inclusive.

## ["startkey","endkey","sincekey"]

Receive updates from the range `"startkey"` through `"endkey"`, inclusive and
populate the result stream with data from the exclusive `"sincekey"` through
`"endkey"`.

This form is useful so that no updates slip past due to delays from rendering
the initial content and establishing a live connection.

# methods

``` js
var tracker = require('level-track')
```

## var t = tracker(opts)

Return a duplex stream that expects 
input of the form documented in the protocol section and produces output of the
form:

``` json
{"type":"put","key":"h","value":{"n":27}}
```

which is the same format that `db.hooks` and `db.batch()` use.

When `opts.objectMode` is true, output is written as objects. Otherwise, output
is written as newline-delimited lines of json.

You may also specify an optional `opts.keyMap(key)` function to pre-transform
keys. Return the value you want to use for the key.

# install

With [npm](https://npmjs.org) do:

```
npm install level-tracker
```

# license

MIT
