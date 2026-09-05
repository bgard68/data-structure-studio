import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(join(root, 'src', f), 'utf8');

const js = ['core.js', 'structs-linear.js', 'structs-linear2.js', 'structs-hash.js', 'structs-tree.js', 'structs-rb.js', 'app.js']
  .map(src).join('\n');

const body = src('head.html') + '\n<script>\n' + js + '\n</script>\n';

// artifact format: no doctype/html/head/body wrappers
writeFileSync(join(root, 'app.html'), body);

// local preview: full document
writeFileSync(join(root, 'preview.html'),
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n' +
  body + '\n</body>\n</html>\n');

console.log('built app.html + preview.html');
