'use strict';

module.exports = function (text) {
  return text.replace(/^(\s*[a-z]+\([^\)]*)\battributes([^\)]*\))([^\n]*)$/gm, function (_, prefix, postfix, end) {
    return prefix + postfix.replace(/^=attributes/, '') + '&attributes(attributes) + end;
  })
};
