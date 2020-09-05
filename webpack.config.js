const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const defaults = {
    mode: "development",
    context: __dirname,
    entry: {
        FastVixel: './src/index.ts',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        library: 'FastVixel',
        libraryTarget: 'umd',
        globalObject: "typeof self !== 'undefined' ? self :  this",
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /(node_modules)/,
            },
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                use: [
                    'raw-loader',
                    'glslify-loader',
                ],
                exclude: /node_modules/,
            },
        ],
    },
    devtool: 'cheap-source-map',
}

const production = Object.assign({}, defaults, {
    mode: 'production',
    devtool: 'source-map',
});

module.exports = env => {
    if (env.production) {
        return production;
    } else {
        return defaults;
    }
}