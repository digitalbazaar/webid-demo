/*
Copyright 2010, 2011. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

var sax = require('./sax'),
    sys = require('sys'),
    events = require('events');

var Parser = function() {
    var that = this;
    this.saxParser = sax.parser(true); // make the sax parser

    this.EXPLICIT_CHARKEY = false; // always use the '#' key, even if there are no subkeys
    this.resultObject = null;

    var stack = [];

    this.saxParser.onopentag = function(node) {
        var obj = {};
        obj['#'] = "";
        for (var key in node.attributes) {
            if (node.attributes.hasOwnProperty(key)) {
                if(typeof obj['@'] === 'undefined') {
                    obj['@'] = {};
                }
                obj['@'][key] = node.attributes[key];
            }
        }
        obj['#name'] = node.name; // need a place to store the node name
        stack.push(obj);
    };

    this.saxParser.onclosetag = function() {
        var obj = stack.pop();
        var nodeName = obj['#name'];
        delete obj['#name'];
        var s = stack[stack.length-1];

        // remove the '#' key altogether if it's blank
        if(obj['#'].match(/^\s*$/)) {
            delete obj['#'];
        }
        else {
            // turn 2 or more spaces into one space
            obj['#'] = obj['#'].replace(/\s{2,}/g, " ").trim();

            // also do away with '#' key altogether, if there's no subkeys
            // unless EXPLICIT_CHARKEY is set
            if( Object.keys(obj).length == 1 && '#' in obj && !(that.EXPLICIT_CHARKEY) ) {
                obj = obj['#'];
            }
        }
        
        // set up the parent element relationship
        if (stack.length > 0) {
            if (typeof s[nodeName] === 'undefined')
                s[nodeName] = obj;
            else if (s[nodeName] instanceof Array)
                s[nodeName].push(obj);
            else {
                var old = s[nodeName];
                s[nodeName] = [old];
                s[nodeName].push(obj);
            }
        }
        else {
            that.resultObject = obj;
            that.emit("end", that.resultObject);
        }
    };

    this.saxParser.ontext = this.saxParser.oncdata = function(t) {
        var s = stack[stack.length-1];
        if(s) { 
            s['#'] += t;
        }
    }
};
sys.inherits(Parser, events.EventEmitter);
Parser.prototype.parseString = function(str) { this.saxParser.write(str.toString()); };
exports.Parser = Parser;
