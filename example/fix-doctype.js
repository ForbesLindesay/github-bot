'use strict';

module.exports = function (text) {
  return text.replace(/^\s*\!\!\!\n/g, '!!! 5\n')
             .replace(/^\s*\!\!\! ([a-zA-Z0-9]+\s*\n)/g, 'doctype $1')
             .replace(/^\s*doctype 5(\s*\n)/g, 'doctype html$1');
};
