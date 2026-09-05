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
// two linked nodes on the app's dark ground, drawn small enough to read at 16px
const favicon = '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<rect width="32" height="32" rx="6" fill="#0a0e17"/>' +
  '<rect x="3" y="11" width="10" height="10" rx="2" fill="#131b2e" stroke="#2dd6ff" stroke-width="2"/>' +
  '<rect x="19" y="11" width="10" height="10" rx="2" fill="#131b2e" stroke="#2fe6a0" stroke-width="2"/>' +
  '<path d="M13 16 h6" stroke="#2fe6a0" stroke-width="2.5"/>' +
  '</svg>') + '">';

writeFileSync(join(root, 'preview.html'),
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<meta name="description" content="Animated data structure lab for students: watch pointers, links, and rotations move exactly as the algorithm runs, with live step counts vs Big-O.">\n' +
  favicon + '\n' + title + '\n</head>\n<body>\n' +
  body.replace(/<title>.*?<\/title>\n?/, '') + '\n</body>\n</html>\n');

console.log('built app.html + preview.html');
