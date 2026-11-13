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

let path_ = require('path')

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


      // TODO this doesnt handle require() function calls or import() function calls
      // TODO this doesnt handle import { A } from './wherever'   and then    B = A;    <B />

      // lets you access import statements. For example:    import A, { B } from '../x/y/z'
      ImportDeclaration(path, state) {
        if (state.dontrun) return

        const localpath = path.node.source.value; // '../x/y/z'

        if (localpath.substring(0, 1) !== '.') return // only consider files in the filesystem like ../../server/MyComponent or ./MyComponent, must start with .

        if (!state.filename) {
          console.log(`ERROR - state.filename did not exist in ${localpath}`)
          return
        }

        // convert ../x to C:/Users/.../x
        const absolutePath = path_.resolve(path_.dirname(state.filename), localpath)

        // try adding different file extensions. this is needed to get the full path, and it's useful b/c we don't want .css
        let globalpath = ''
        for (let ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
          try {
            globalpath = require.resolve(absolutePath + ext, { paths: [path_.dirname(state.filename)] })
            break
          } catch (err) {
            continue
          }
        }
        if (!globalpath) return

        // console.log('importpath', importpath)
        // console.log('resolvedpath', resolvedPath)
        // specifiers are an array like [Node A, Node B]
        for (let specifier of path.node.specifiers) {
          if (t.isImportDefaultSpecifier(specifier)) { // import A from '../x/y/z'
            let varname = specifier.local.name // 'A'
            state.pathOfVarname[varname] = globalpath
          } else if (t.isImportSpecifier(specifier)) { // import { B } from '../x/y/z'
            let varname = specifier.local.name // 'B'
            state.pathOfVarname[varname] = globalpath
          } else if (t.isImportNamespaceSpecifier(specifier)) { // import X as A from '../x/y/z' or  import { X as A } from '../x/y/z'
            let varname = specifier.local.name // 'A'
            state.pathOfVarname[varname] = globalpath
          }
        }
      },



      JSXElement: {

        // preorder, called when enter AST node
        enter(path, state) {
          if (state.dontrun) return

          // console.log('start', path.node.loc?.start)
          const { line: line_start, column: column_start } = path.node.loc?.start ?? {}
          const { line: line_end, column: column_end } = path.node.loc?.end ?? {}

          const filename = state.filename || 'undefined';


          // // the data-glass-info attribute as a JSON string
          // let glassidStr = JSON.stringify({ start: { line: line_start, column: column_start }, end: { line: line_end, column: column_end }, filename })
          // const attrib = t.jsxAttribute(t.jsxIdentifier('data-glass-info'), t.jsxExpressionContainer(t.stringLiteral(glassidStr)));
          // path.node.openingElement.attributes.push(attrib);

        },

        // postorder, called when exit AST node
        exit(path, state) {
          if (state.dontrun) return
        }
      },
    }
  };
};

