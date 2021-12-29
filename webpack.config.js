const path = require('path')

module.exports = {
    target: 'electron-main',
    entry: {
        main: './main.js',
        preload: './preload.js'
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname,'./build')
    },
    mode: 'development',
    node: {
        __dirname: false
    }
}