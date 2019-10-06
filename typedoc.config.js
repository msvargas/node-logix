const path = require('path')
const fs = require('fs')

module.exports = {
  mode: 'file',
  out: 'docs',
  module: 'commonjs',
  target: 'es5',
  theme: 'default',
  excludeExternals: true,
  includeDeclarations: true,
  excludePrivate: true,
  excludeNotExported: true,
  stripInternal: true,
}