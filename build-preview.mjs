// 시험판(한 기기 두 화면)을 HTML 한 장으로 묶는다: node build-preview.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const js = (await build({ entryPoints: ['public/js/client.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' })).outputFiles[0].text;
const font = (f) => 'data:font/woff2;base64,' + readFileSync('public/fonts/' + f).toString('base64');
let html = readFileSync('public/index.html', 'utf8')
  .replace('url(fonts/Galmuri11.woff2)', `url(${font('Galmuri11.woff2')})`)
  .replace('url(fonts/Galmuri11-Bold.woff2)', `url(${font('Galmuri11-Bold.woff2')})`)
  .replace('<script type="module" src="js/client.js"></script>', () => `<script>window.__LOCAL_ONLY__=true;</script><script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
writeFileSync('dist/preview.html', html);
console.log('dist/preview.html', (html.length / 1024).toFixed(0) + 'KB');
