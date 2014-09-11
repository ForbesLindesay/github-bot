'use strict';

var fs = require('fs');
var github = require('github-basic');
var GitHubBot = require('../');

var fixDoctype = require('./fix-doctype.js');
var fixAttributes = require('./fix-attributes.js');

var GITHUB_TOKEN = fs.readFileSync(__dirname + '/auth.txt', 'utf8').trim();

var client = github({version: 3, auth: GITHUB_TOKEN, sync: true});
var bot = new GitHubBot(GITHUB_TOKEN, __dirname + '/store', processRepo);

bot.run('visionmedia', 'jade').done();

// bot.fixProject('topfunky', 'demo-simplest-socket-io', 'master', {force: true}).done();

function processRepo(owner, repo, branch, files) {
  // files is an array of `{path: 'path/to/file.js', name: 'file.js', data: Buffer(body of file), text: 'body of file'}`
  files = files.filter(function (file) {
    return /\.jade$/.test(file.name) || file.name === 'package.json';
  });
  if (files.length === 0) return;
  var results = files.map(function (file) {
    if (file.name === 'package.json') return file;
    return {
      path: file.path,
      text: fixAttributes(fixDoctype(file.text))
    };
  });
  results = results.filter(function (result, index) {
    return result.text !== files[index].text;
  });
  if (results.length === 0) return;

}
