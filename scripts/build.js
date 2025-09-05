#!/usr/bin/env node
/**
 * Simple bundler/minifier for this project (no external deps).
 * - Bundles ES modules into a single file in a fixed order
 * - Strips import/export and comments
 * - Writes dist/main.bundle.js and a lightly minified dist/main.bundle.min.js
 * - Minifies CSS to dist/app.min.css
 * - Generates dist/tabata-timer.html pointing to bundled assets
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'src');
const stylesDir = path.join(root, 'styles');
const distDir = path.join(root, 'dist');
const docsDir = path.join(root, 'docs');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }

function stripJsImportsExports(code) {
  // Remove import lines
  code = code.replace(/^\s*import\s+[^;]+;\s*$/gm, '');
  // Remove export keywords
  code = code.replace(/\bexport\s+(?=(class|function|const|let|var)\b)/g, '');
  // Named export at end: export { a, b };
  code = code.replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
  return code;
}

function stripJsCommentsLight(code) {
  // Remove block comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove line comments (naive, but fine for our codebase)
  code = code.replace(/(^|\s)\/\/[^\n]*\n/g, (m) => m.replace(/[^\n]*\n$/, '\n'));
  return code;
}

function minifyJsLight(code) {
  code = stripJsCommentsLight(code);
  // Collapse multiple whitespace but keep newlines between statements
  code = code.replace(/\s{2,}/g, ' ');
  code = code.replace(/[\n\r]+/g, '\n');
  return code.trim();
}

function minifyCssLight(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  css = css.replace(/\s*([{}:;,>])\s+/g, '$1');
  css = css.replace(/;}/g, '}');
  css = css.replace(/[\n\r\t]+/g, '');
  css = css.replace(/\s{2,}/g, ' ');
  return css.trim();
}

function bundleJs() {
  const order = ['timer.js', 'audio.js', 'ui.js', 'main.js'];
  const parts = order.map(f => {
    const raw = read(path.join(srcDir, f));
    return stripJsImportsExports(raw);
  });
  const bundled = parts.join('\n\n');
  return { bundled, minified: minifyJsLight(bundled) };
}

function buildHtml(minJsName, minCssName) {
  let html = read(path.join(root, 'tabata-timer.html'));
  // Replace stylesheet href to dist file
  html = html.replace(/href="styles\/[^\"]+"/, `href="${minCssName}"`);
  // Replace module script with bundled file (non-module)
  html = html.replace(/<script\s+type="module"\s+src="src\/main.js"\s*><\/script>/,
    `<script defer src="${minJsName}"></script>`);
  // Light HTML minify: collapse whitespace between tags
  html = html.replace(/>\s+</g, '><');
  return html;
}

function run() {
  ensureDir(distDir);
  ensureDir(path.join(distDir, 'assets'));
  ensureDir(path.join(distDir, 'assets', 'audio'));
  ensureDir(docsDir);
  ensureDir(path.join(distDir, 'icons'));
  ensureDir(path.join(docsDir, 'icons'));
  ensureDir(path.join(distDir, 'seo'));
  ensureDir(path.join(docsDir, 'seo'));

  // JS
  const { bundled, minified } = bundleJs();
  write(path.join(distDir, 'main.bundle.js'), bundled);
  write(path.join(distDir, 'main.bundle.min.js'), minified);

  // CSS
  const css = read(path.join(stylesDir, 'app.css'));
  const cssMin = minifyCssLight(css);
  write(path.join(distDir, 'app.min.css'), cssMin);

  // HTML
  const outHtml = buildHtml('main.bundle.min.js', 'app.min.css');
  write(path.join(distDir, 'tabata-timer.html'), outHtml);

  // Copy manifest and service worker to dist
  const manifestSrc = path.join(root, 'manifest.webmanifest');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, path.join(distDir, 'manifest.webmanifest'));
  }
  const swSrc = path.join(root, 'sw.js');
  if (fs.existsSync(swSrc)) {
    fs.copyFileSync(swSrc, path.join(distDir, 'sw.js'));
  }

  // Copy icons
  const icons = ['icons/tabata-icon.svg', 'icons/maskable.svg'];
  icons.forEach(rel => {
    const src = path.join(root, rel);
    if (fs.existsSync(src)) {
      const base = path.basename(src);
      fs.copyFileSync(src, path.join(distDir, 'icons', base));
      fs.copyFileSync(src, path.join(docsDir, 'icons', base));
    }
  });

  // Copy SEO structured data
  const sd = path.join(root, 'seo', 'structured-data.json');
  if (fs.existsSync(sd)) {
    fs.copyFileSync(sd, path.join(distDir, 'seo', 'structured-data.json'));
    fs.copyFileSync(sd, path.join(docsDir, 'seo', 'structured-data.json'));
  }

  // robots.txt & sitemap.xml
  const baseUrl = 'https://alperkaraca.github.io/tabata-timer/';
  const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}sitemap.xml\n`;
  write(path.join(distDir, 'robots.txt'), robots);
  write(path.join(docsDir, 'robots.txt'), robots);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    `<url><loc>${baseUrl}</loc></url>` +
    `</urlset>`;
  write(path.join(distDir, 'sitemap.xml'), sitemap);
  write(path.join(docsDir, 'sitemap.xml'), sitemap);

  // Copy dist to docs/ for GitHub Pages, and rename HTML to index.html
  const filesToCopy = ['app.min.css', 'main.bundle.min.js', 'manifest.webmanifest', 'sw.js'];
  filesToCopy.forEach(f => {
    const src = path.join(distDir, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(docsDir, f));
  });
  // Write index.html from the dist html
  const distHtml = read(path.join(distDir, 'tabata-timer.html'));
  write(path.join(docsDir, 'index.html'), distHtml);

  console.log('Build complete -> dist/ and docs/');
}

run();
