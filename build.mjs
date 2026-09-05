import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
// normalize to LF so the build is byte-reproducible regardless of editor line endings
const src = f => readFileSync(join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n');

const js = ['core.js', 'structs-linear.js', 'structs-linear2.js', 'structs-hash.js', 'structs-tree.js', 'structs-rb.js', 'app.js']
  .map(src).join('\n');

const body = src('head.html') + '\n<script>\n' + js + '\n</script>\n';

// artifact format: no doctype/html/head/body wrappers
writeFileSync(join(root, 'app.html'), body);

// local preview: full document, with the title moved into <head> where it belongs
const titleMatch = body.match(/<title>.*?<\/title>/);
const title = titleMatch ? titleMatch[0] : '<title>Data Structure Studio</title>';
writeFileSync(join(root, 'preview.html'),
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  title + '\n</head>\n<body>\n' +
  body.replace(/<title>.*?<\/title>\n?/, '') + '\n</body>\n</html>\n');

console.log('built app.html + preview.html');
