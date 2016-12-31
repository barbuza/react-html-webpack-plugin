import { Script, createContext } from 'vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Promise } from 'es6-promise';

import * as NodeTemplatePlugin from 'webpack/lib/node/NodeTemplatePlugin';
import * as NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import * as LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin';
import * as LibraryTemplatePlugin from 'webpack/lib/LibraryTemplatePlugin';
import * as SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';


interface ReactHtmlPluginOptions {
    doctype: boolean;
    filename: string;
    source: string | undefined;
}

type Partial<T> = {
    [P in keyof T]?: T[P];
};

const defaultOptions: ReactHtmlPluginOptions = {
    doctype: true,
    filename: 'index.html',
    source: undefined,
};

interface CompilationResult {
    source: string;
    hash: string;
    outputName: string;
}

class ReactHtmlPlugin {
    protected options: ReactHtmlPluginOptions;

    constructor(source: string, options: Partial<ReactHtmlPluginOptions> = {}) {
        this.options = { ...defaultOptions, ...options, source };
    }

    render(compilation: any, result: CompilationResult) {
        const context = createContext({ console });
        const script = new Script(result.source, { filename: this.options.source });
        script.runInContext(context);
        const exports = (context as any).reactHtmlPluginContext;
        let markup = renderToStaticMarkup(createElement(exports.Html, {
            compilation,
            chunks: compilation.getStats().toJson().chunks
        }));
        if (this.options.doctype) {
            markup = `<!doctype html>${markup}`;
        }
        return markup;
    }

    apply(compiler: any) {
        let compilationPromise: Promise<CompilationResult>;

        compiler.plugin('emit', (compilation: any, callback: any) => {
            compilationPromise
                .then((result: CompilationResult) => {
                    const markup = this.render(compilation, result);
                    compilation.assets[this.options.filename] = {
                        source: () => markup,
                        size: () => markup.length
                    };
                    callback();
                })
                .catch((err: any) => {
                    const errText = err.toString();
                    compilation.assets[this.options.filename] = {
                        source: () => errText,
                        size: () => errText.length
                    };
                    if (!compiler.options.watch && compiler.options.bail) {
                        callback(err);
                    } else {
                        compilation.errors.push(errText);
                        callback();
                    }
                });
        });

        compiler.plugin('make', (compilation: any, callback: any) => {
            const outputOptions = {
                filename: `${this.options.filename}.js`,
                publicPath: compilation.outputOptions.publicPath
            };

            const assetsBeforeCompilation = { ...compilation.assets[outputOptions.filename] };

            const childCompiler = compilation.createChildCompiler(`react-html-compiler-${outputOptions.filename}`, outputOptions);
            childCompiler.context = compiler.context;

            childCompiler.apply(
                new NodeTemplatePlugin(outputOptions),
                new NodeTargetPlugin(),
                new LibraryTemplatePlugin('reactHtmlPluginContext', 'var'),
                new SingleEntryPlugin(compiler.context, this.options.source),
                new LoaderTargetPlugin('node')
            );

            compilationPromise = new Promise<CompilationResult>((resolve: any, reject: any) => {
                childCompiler.runAsChild((err: any, entries: any, childCompilation: any) => {
                    if (err) {
                        reject(err);
                    } else if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
                        const errorDetails = childCompilation.errors.map((error: any) =>
                            error.message + (error.error ? ':\n' + error.error : '')
                        ).join('\n');
                        reject(new Error('Child compilation failed:\n' + errorDetails));
                    } else {
                        const outputName = compilation.mainTemplate.applyPluginsWaterfall('asset-path', outputOptions.filename, {
                            hash: childCompilation.hash,
                            chunk: entries[0]
                        });
                        compilation.assets[outputName] = assetsBeforeCompilation[outputName];
                        if (assetsBeforeCompilation[outputName] === undefined) {
                            delete compilation.assets[outputName];
                        }
                        resolve({
                            hash: entries[0].hash,
                            outputName,
                            source: childCompilation.assets[outputName].source()
                        });
                    }
                });
            }).then((result: CompilationResult) => {
                callback();
                return result;
            });
        });
    }

}

declare const module: { exports: typeof ReactHtmlPlugin };

module.exports = ReactHtmlPlugin;
