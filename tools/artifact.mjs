// Turns the single-file build into an artifact page: the artifact host supplies the doctype, <html>, <head> and
// <body>, so this keeps only what goes inside them.
import fs from 'fs';
const html=fs.readFileSync('dist-artifact/index.html','utf8');
const head=html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>\s*/,'').replace(/<meta name="viewport"[^>]*>\s*/,'').replace(/<meta name="(theme-color|mobile-web-app-capable|apple-[^"]*)"[^>]*>\s*/g,'');
const body=html.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.writeFileSync('dist-artifact/rake-before-dark.html',head.trim()+'\n'+body.trim()+'\n');
console.log('wrote dist-artifact/rake-before-dark.html');
