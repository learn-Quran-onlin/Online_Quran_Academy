import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let header = fs.readFileSync(path.join(root, 'header.html'), 'utf8');
let footer = fs.readFileSync(path.join(root, 'footer.html'), 'utf8');

header = header
  .replace(/<link rel="stylesheet" href="css\/homeStyle\.css">\s*/g, '')
  .replace('src="https://learn-quran-onlin.github.io/Online_Quran_Academy/images/logo.png"', 'src="/Online_Quran_Academy/images/logo.webp"')
  .replace('<button class="menu-button">', '<button class="menu-button" aria-label="Open navigation menu">');
footer = footer.replace(/\s*<link rel="stylesheet" href="css\/homeStyle\.css">\s*/g, '\n');

const articleHeader = header.replaceAll('href="./index.html"', 'href="../index.html"');
const articleFooter = footer.replaceAll('href="./tuitions.html"', 'href="../tuitions.html"');

for (const file of walk(root).filter((f) => f.endsWith('.html') && !['header.html', 'footer.html'].includes(path.basename(f)))) {
  const isArticle = file.includes(`${path.sep}articles${path.sep}`);
  let s = fs.readFileSync(file, 'utf8');
  const h = isArticle ? articleHeader : header;
  const f = isArticle ? articleFooter : footer;

  s = s.replace(/<div id="header"><\/div>/g, h);
  s = s.replace(/<div id="footer"><\/div>/g, f);
  s = removePartialScripts(s);
  s = s.replaceAll('images/about.png', 'images/about.webp').replaceAll('../images/about.png', '../images/about.webp');
  s = s.replaceAll('images/logo.png', 'images/logo.webp').replaceAll('../images/logo.png', '../images/logo.webp').replaceAll('/../images/logo.png', '../images/logo.webp');
  s = s.replaceAll('aria-label="Read more: How To Find a Reliable Quran Tutor Online"', 'aria-label="Read: How To Find a Reliable Quran Tutor Online"');
  s = s.replaceAll('aria-label="Read more: The Importance of Islamic Education"', 'aria-label="Read: The Importance of Islamic Education"');
  s = s.replaceAll('aria-label="Read more: How To Become A Qari of the Quran"', 'aria-label="Read: How To Become A Qari of the Quran"');
  s = s.replaceAll('aria-label="Read more: Benefits of Becoming a Hafiz"', 'aria-label="Read: Benefits of Becoming a Hafiz"');
  s = s.replace(/<a href="\.\/about\.html"([^>]*)>Read more<\/a>/g, '<a href="about.html"$1 aria-label="Read more about Dar Arqam Online Quran Academy">Read more</a>');
  fs.writeFileSync(file, s);
}

let css = fs.readFileSync(path.join(root, 'css', 'homeStyle.css'), 'utf8');
css = css
  .replaceAll('../images/about.png', '../images/about.webp')
  .replace(/#trialButton\{([^}]*)\}/, (m, body) => `#trialButton{${touch(body)}}`)
  .replace(/\.plans-button\{([^}]*)\}/, (m, body) => `.plans-button{${touch(body)}}`);
if (!/#planButton\{/.test(css)) css += '#planButton{min-height:44px;padding:12px 24px}';
css += '.nav-links a[href="https://wa.me/201118749237"]{min-height:44px;padding:12px 24px}';
fs.writeFileSync(path.join(root, 'css', 'homeStyle.css'), css);

function removePartialScripts(s) {
  return s.replace(/<script>\s*[\s\S]*?(?:fetch\((?:'|")[^'"]*(?:header|footer)\.html(?:'|")|loadComponent\((?:'|")header(?:'|")|loadComponent\((?:'|")footer(?:'|"))[\s\S]*?<\/script>/gi, '');
}

function touch(body) {
  body = body.replace(/min-height:[^;}]*/g, 'min-height:44px').replace(/padding:[^;}]*/g, 'padding:12px 24px');
  if (!/min-height:/.test(body)) body += ';min-height:44px';
  if (!/padding:/.test(body)) body += ';padding:12px 24px';
  return body;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() && entry.name !== '.git' ? walk(full) : entry.isFile() ? [full] : [];
  });
}
