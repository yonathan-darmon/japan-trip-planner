const process = require('process');

// try {
//     const puppeteer = require('puppeteer');
//     process.env.CHROME_BIN = puppeteer.executablePath();
//     console.log('Puppeteer Chrome path:', process.env.CHROME_BIN);
// } catch (error) {
//     console.warn('Failed to get Puppeteer Chrome path (using system Chrome):', error.message);
// }


module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage')
        ],
        client: {
            jasmine: {
                // you can add configuration options for Jasmine here
            },
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },
        jasmineHtmlReporter: {
            suppressAll: true // removes the duplicated traces
        },
        coverageReporter: {
            dir: require('path').join(__dirname, './coverage/frontend'),
            subdir: '.',
            reporters: [
                { type: 'html' },
                { type: 'text-summary' }
            ]
        },
        reporters: ['progress', 'kjhtml'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['ChromeHeadlessNoSandbox'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: [
                    '--no-sandbox',
                    '--disable-gpu',
                    '--remote-debugging-port=9222'
                ]
            }
        },
        singleRun: true,
        restartOnFileChange: true
    });
};
