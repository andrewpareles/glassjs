// @ts-check

// see the README on how to use this file

// babel docs - https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md

// if you modify code, the modified code gets passed through this script properly, but this script only gets loaded when you run `dev` so you need to reload dev in order to see changes to it 


// * @typedef {import('@babel/types').Program} Program
// * @typedef {import('@babel/types').ImportDeclaration} ImportDeclaration

// types
/**
 * @typedef {import('@babel/core').PluginObj} PluginObj
 * @typedef {import('@babel/core').PluginObj} ImportDeclaration
 */

// import path_ from 'path'
// let path_ = require('path')

// visitor that gets called on each file individually
/**
 * @param {{ types: typeof import('@babel/types') }} babel
 * @returns {babel.PluginObj<
*   babel.PluginPass & 
*   ({dontrun: true, pathOfVarname?:undefined} | {dontrun: false, pathOfVarname: {[importname:string]:string}})
* >}
*/
module.exports = function ({ types: t }) {
  return {

    pre(file) {
      // don't run the babel thing on the file if it's in node_modules
      if (file.opts.filename?.includes('node_modules')) {
        this.dontrun = true // 'this' = state
        return
      }
      // console.log('running glass-babel plugin... ', file.opts.filename, '\n')
      this.pathOfVarname = {}
    },

    post(file) {
      if (this.dontrun) return
      // console.log('successfully finished glass-babel plugin.\n---')

    },

    visitor: {

      JSXElement: {

        // preorder, called when enter AST node
        enter(path, state) {
          if (state.dontrun) return

          // console.log('start', path.node.loc?.start)
          const { line: line_start, column: column_start } = path.node.loc?.start ?? {}
          const { line: line_end, column: column_end } = path.node.loc?.end ?? {}

          const filename = state.filename || 'undefined';


          // the data-glass-info attribute as a JSON string
          let glassidStr = JSON.stringify({ start: { line: line_start, column: column_start }, end: { line: line_end, column: column_end }, filename })
          const attrib = t.jsxAttribute(t.jsxIdentifier('data-glass-info'), t.jsxExpressionContainer(t.stringLiteral(glassidStr)));
          path.node.openingElement.attributes.push(attrib);

        },

      },
    }
  };
};

