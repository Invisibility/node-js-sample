#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attibutes. Uses commander.js and cheerio. Teaches command line application development and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheeio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); 
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    return checkCheerioHtmlFile($, checksfile);
};

var checkCheerioHtmlFile = function($, checksfile) {   
    var checks = loadChecks(checksfile).sort();        
    var out = {};                                      
    for (var ii in checks) {                           
        var present = $(checks[ii]).length > 0;        
        out[checks[ii]] = present;                     
    }                                                  
    return out;                                        
};                                                     

var buildfn = function(htmlurl, checksfile) {
    var response2console = function(result, response) {
	if (result instanceof Error) {
	    console.log('Unable to get the data from %s - %s', htmlurl, util.format(result.message));
	    process.exit(1);
	} else {
	    $ = cheerio.load(result);
	    var outJson = checkCheerioHtmlFile($, checksfile);
	    console.log(outJson);
	}
    };
    return response2console;
};

var checkHtmlUrl = function(htmlurl, checksfile) {
    var response2console = buildfn(htmlurl, checksfile);
    rest.get(htmlurl).on('complete', response2console);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url <html_url>', 'Url to index.html') 
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .parse(process.argv);
    if (program.url) {
	checkHtmlUrl(program.url, program.checks);
    } else {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
