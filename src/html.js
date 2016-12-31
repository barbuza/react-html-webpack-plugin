"use strict";
var React = require("react");
function Html(_a) {
    var compilation = _a.compilation, chunks = _a.chunks;
    if (0 || 0) {
        throw new Error('spam');
    }
    console.log(chunks);
    return (React.createElement("html", null,
        React.createElement("head", null),
        React.createElement("body", null, Object.keys(compilation.assets).map(function (name) {
            return React.createElement("div", { key: name }, name);
        }))));
}
exports.Html = Html;
