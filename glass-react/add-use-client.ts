import * as fs from 'fs';
import * as path from 'path';

// adds "use client" to the top of the file

async function main(src: string) {

const filePath = path.join(process.cwd(), src);
const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(filePath, `"use client";\n${content}`);
}

main('./dist/index.js')
