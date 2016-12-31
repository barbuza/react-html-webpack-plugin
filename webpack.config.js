const webpack = require('webpack');
const ReactHtmlPlugin = require('./src/index');

module.exports = {
    entry: {
        entry1: './entry1.js',
        entry2: './entry2.js',
    },
    output: {
        filename: 'bundle_[name].js'
    },
    module: {
        loaders: [
            { test: /\.tsx?/, loader: 'ts-loader' }
        ]
    },
    plugins: [
        new ReactHtmlPlugin('./src/html.tsx'),
        new webpack.NoErrorsPlugin()
    ]
};
