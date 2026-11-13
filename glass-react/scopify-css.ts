

import * as fs from 'fs';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcssNested from 'postcss-nested';

import util from 'util'
import { exec } from 'child_process'

const TW_PREFIX = 'glasstw-'
const scopeName = 'scope' // the className used in the root of the GlassPromptBar

async function main(src: string) {
    // generate the tailwind css file
    let content = (await util.promisify(exec)(`tailwindcss -i ${src}`)).stdout

    // use postcss to generate the new scoped css
    content = `.${TW_PREFIX}${scopeName} {\n${content}\n}`;
    content = postcss([autoprefixer, postcssNested]).process(content, { from: undefined }).css;

    fs.writeFileSync(src, content);
}

// replaces global.css with a scoped version of global.css
main('./src2/global.css')
