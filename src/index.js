"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var vm_1 = require("vm");
var react_1 = require("react");
var server_1 = require("react-dom/server");
var es6_promise_1 = require("es6-promise");
var NodeTemplatePlugin = require("webpack/lib/node/NodeTemplatePlugin");
var NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
var LoaderTargetPlugin = require("webpack/lib/LoaderTargetPlugin");
var LibraryTemplatePlugin = require("webpack/lib/LibraryTemplatePlugin");
var SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
var defaultOptions = {
    doctype: true,
    filename: 'index.html',
    source: undefined
};
var ReactHtmlPlugin = (function () {
    function ReactHtmlPlugin(source, options) {
        if (options === void 0) { options = {}; }
        this.options = __assign({}, defaultOptions, options, { source: source });
    }
    ReactHtmlPlugin.prototype.render = function (compilation, result) {
        var context = vm_1.createContext({ console: console });
        var script = new vm_1.Script(result.source, { filename: this.options.source });
        script.runInContext(context);
        var exports = context.reactHtmlPluginContext;
        var markup = server_1.renderToStaticMarkup(react_1.createElement(exports.Html, {
            compilation: compilation,
            chunks: compilation.getStats().toJson().chunks
        }));
        if (this.options.doctype) {
            markup = "<!doctype html>" + markup;
        }
        return markup;
    };
    ReactHtmlPlugin.prototype.apply = function (compiler) {
        var _this = this;
        var compilationPromise;
        compiler.plugin('emit', function (compilation, callback) {
            compilationPromise
                .then(function (result) {
                var markup = _this.render(compilation, result);
                compilation.assets[_this.options.filename] = {
                    source: function () { return markup; },
                    size: function () { return markup.length; }
                };
                callback();
            })["catch"](function (err) {
                var errText = err.toString();
                compilation.assets[_this.options.filename] = {
                    source: function () { return errText; },
                    size: function () { return errText.length; }
                };
                if (!compiler.options.watch && compiler.options.bail) {
                    callback(err);
                }
                else {
                    compilation.errors.push(errText);
                    callback();
                }
            });
        });
        compiler.plugin('make', function (compilation, callback) {
            var outputOptions = {
                filename: _this.options.filename + ".js",
                publicPath: compilation.outputOptions.publicPath
            };
            var assetsBeforeCompilation = __assign({}, compilation.assets[outputOptions.filename]);
            var childCompiler = compilation.createChildCompiler("react-html-compiler-" + outputOptions.filename, outputOptions);
            childCompiler.context = compiler.context;
            childCompiler.apply(new NodeTemplatePlugin(outputOptions), new NodeTargetPlugin(), new LibraryTemplatePlugin('reactHtmlPluginContext', 'var'), new SingleEntryPlugin(compiler.context, _this.options.source), new LoaderTargetPlugin('node'));
            compilationPromise = new es6_promise_1.Promise(function (resolve, reject) {
                childCompiler.runAsChild(function (err, entries, childCompilation) {
                    if (err) {
                        reject(err);
                    }
                    else if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
                        var errorDetails = childCompilation.errors.map(function (error) {
                            return error.message + (error.error ? ':\n' + error.error : '');
                        }).join('\n');
                        reject(new Error('Child compilation failed:\n' + errorDetails));
                    }
                    else {
                        var outputName = compilation.mainTemplate.applyPluginsWaterfall('asset-path', outputOptions.filename, {
                            hash: childCompilation.hash,
                            chunk: entries[0]
                        });
                        compilation.assets[outputName] = assetsBeforeCompilation[outputName];
                        if (assetsBeforeCompilation[outputName] === undefined) {
                            delete compilation.assets[outputName];
                        }
                        resolve({
                            hash: entries[0].hash,
                            outputName: outputName,
                            source: childCompilation.assets[outputName].source()
                        });
                    }
                });
            }).then(function (result) {
                callback();
                return result;
            });
        });
    };
    return ReactHtmlPlugin;
}());
module.exports = ReactHtmlPlugin;
