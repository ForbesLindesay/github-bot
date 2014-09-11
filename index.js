'use strict';

var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var uid = require('uid');
var github = require('github-basic');
var gethub = require('gethub');
var lsr = require('lsr');
var mkdirp = require('mkdirp');
var rimraf = Promise.denodeify(require('rimraf'));
var readFile = Promise.denodeify(fs.readFile);

module.exports = Bot;
function Bot(auth, directory, fixRepo) {
  this.client = github({version: 3, auth: auth, cache: 'file'});
  this.directory = directory;
  this.fixRepo = fixRepo;

  mkdirp.sync(directory);
  try {
    this.processed = fs.readFileSync(directory + '/processed.txt',
                                     'utf8').split('\n');
  } catch (ex) {
    this.processed = [];
  }
  this.getStargazers = this.getStargazers.bind(this);
  this.getProjects = this.getProjects.bind(this);
  this.fixProject = this.fixProject.bind(this);
}
Bot.prototype.getStargazers = function (owner, repo) {
  if (typeof owner === 'object' && owner.owner && owner.owner.login && owner.name) {
    repo = owner.name;
    owner = owner.owner.login;
  }
  return this.client.getStream('/repos/:owner/:repo/stargazers', {
    owner: owner,
    repo: repo
  });
};
Bot.prototype.getProjects = function (owner) {
  return this.client.getStream('/users/:username/repos', {
    username: (owner && owner.login) || owner
  }).filter(function (repo) {
    return !repo.fork;
  });
};
Bot.prototype.fixProject = function (owner, repo, branch, options) {
  if (typeof owner === 'object' && owner.owner && owner.owner.login && owner.name) {
    repo = owner.name;
    branch = owner.default_branch;
    owner = owner.owner.login;
  }
  var fixRepo = this.fixRepo;
  branch = branch || 'master';
  if (!(options && options.force)) {
    if (this.processed.indexOf(owner + '/' + repo + '/' + branch) !== -1) {
      console.log('already processed ' + owner + '/' + repo + '/' + branch);
      return Promise.resolve(null);
    }
  }
  var dirname = path.resolve(this.directory + '/cache/' + uid());
  return Promise.resolve(gethub(owner, repo, branch, dirname)).then(function () {
    console.log(owner + '/' + repo + '/' + branch + ' - ' + dirname);
    return lsr(dirname);
  }).then(function (dir) {
    return Promise.all(dir.filter(function (entry) {
      return entry.isFile();
    }).map(function (file) {
      return readFile(file.fullPath).then(function (data) {
        return {
          path: file.path.substr(2),
          name: file.name,
          data: data,
          text: data.toString()
        };
      });
    }));
  }).then(function (files) {
    return fixRepo(owner, repo, branch, files);
  }).then(function () {
    return rimraf(dirname);
  }).then(function () {
    this.processed.push(owner + '/' + repo + '/' + branch);
    fs.writeFileSync(this.directory + '/processed.txt',
                                     this.processed.join('\n'));
  }.bind(this));
};
Bot.prototype.run = function (owner, repo) {
  return this.getStargazers(owner, repo)
    .flatMap(this.getProjects)
    .map(this.fixProject)
    .wait();
};
