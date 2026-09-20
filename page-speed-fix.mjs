import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = walk(root).filter((file) => file.endsWith('.html'));
const cssFiles = walk(path.join(root, 'css')).filter((file) => file.endsWith('.css'));
const imgMap = new Map([
  ['q1.png', 'q1.webp'], ['q2.png', 'q2.webp'], ['q3.png', 'q3.webp'], ['q4.png', 'q4.webp'], ['q5.png', 'q5.webp'],
  ['blog2.png', 'blog2.webp'], ['blog4.png', 'blog4.webp'],
  ['course4.jpg', 'course4.webp'], ['course5.jpg', 'course5.webp'], ['Ijazah.jpeg', 'Ijazah.webp'],
]);

for (const file of htmlFiles) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/<html(?![^>]*\blang=)>/i, '<html lang="en">');
  s = s.replaceAll('See All Courses', 'Browse All Quran & Arabic Courses');
  s = s.replaceAll('See All Articles', 'Read All Quran & Islamic Articles');
  s = s.replace(/(<a\b(?=[^>]*\bclass=["'][^"']*\bwhatsapp-button\b)[^>]*href=["']https:\/\/wa\.me\/201118749237["'][^>]*)(>)/gi, addAttr('aria-label', 'Contact Dar Arqam on WhatsApp'));
  s = s.replace(/(<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2\?[^"']*)(["'][^>]*>)/gi, (_, url, tail) =>
    `${url.includes('display=swap') ? url : `${url}&display=swap`}${tail}`);
  s = s.replace(/<script\b(?![^>]*\b(?:defer|async|type=["']application\/ld\+json["']))([^>]*\bsrc=["'][^"']+["'][^>]*)><\/script>/gi, '<script$1 defer></script>');
  for (const [from, to] of imgMap) s = s.replaceAll(`images/${from}`, `images/${to}`).replaceAll(`images\\${from}`, `images\\${to}`);
  s = addMain(s);
  s = fixReadMore(s);
  s = fixHeadings(s);
  if (path.basename(file).toLowerCase() === 'index.html') s = liteYoutube(s);
  fs.writeFileSync(file, s);
}

for (const file of cssFiles) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/@font-face\s*{[^}]*}/gi, (block) => block.includes('font-display') ? block : block.replace(/}\s*$/, 'font-display:swap;}'));
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/\s*([{}:;,>+~])\s*/g, '$1');
  s = s.replace(/;}/g, '}').trim();
  fs.writeFileSync(file, s);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() && entry.name !== '.git' ? walk(full) : entry.isFile() ? [full] : [];
  });
}

function addAttr(name, value) {
  return (match, tag, close) => new RegExp(`\\b${name}=`, 'i').test(tag) ? match : `${tag} ${name}="${value}"${close}`;
}

function addMain(s) {
  if (/<main\b/i.test(s) || /<(?:footer|body)\b/i.test(s) === false) return s;
  const start = s.search(/(?:<div\s+id=["']header["']>\s*<\/div>|<\/header>|<\/nav>)/i);
  if (start < 0) return s;
  const startEnd = s.indexOf('>', start) + 1;
  const footer = s.search(/(?:<div\s+id=["']footer["']>\s*<\/div>|<footer\b)/i);
  if (footer < 0 || footer <= startEnd) return s;
  return `${s.slice(0, startEnd)}\n<main>${s.slice(startEnd, footer)}\n</main>\n${s.slice(footer)}`;
}

function fixReadMore(s) {
  return s.replace(/(<article\b[\s\S]*?<\/article>)/gi, (card) => {
    const title = card.match(/<h3\b[^>]*class=["'][^"']*\bblog-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
    if (!title || title.toLowerCase() === 'title') return card;
    return card.replace(/<a\b([^>]*class=["'][^"']*\bread-more\b[^"']*["'][^>]*)>Read More<\/a>/i, (m, attrs) =>
      /aria-label=/i.test(attrs) ? m : `<a${attrs} aria-label="Read more about ${escapeAttr(title)}">Read More</a>`);
  });
}

function fixHeadings(s) {
  let seenH1 = false;
  let seenH2 = false;
  return s.replace(/<\/?h([1-4])(\b[^>]*)>/gi, (tag, level, attrs) => {
    const closing = tag.startsWith('</');
    let n = Number(level);
    if (n === 1) {
      if (seenH1) n = 2;
      else seenH1 = true;
    } else if (n === 3 && !seenH2) {
      n = 2;
    } else if (n === 4) {
      n = 3;
    }
    if (!closing && n === 2) seenH2 = true;
    return `<${closing ? '/' : ''}h${n}${closing ? '' : attrs}>`;
  });
}

function liteYoutube(s) {
  return s.replace(/<iframe\s+[^>]*src=["']https:\/\/www\.youtube\.com\/embed\/mlv6ekBnbWQ["'][\s\S]*?<\/iframe>/i, `<div class="youtube-lite" data-id="mlv6ekBnbWQ" style="position:relative;padding-bottom:56.25%;cursor:pointer;background:#000;">
<img src="https://i.ytimg.com/vi/mlv6ekBnbWQ/hqdefault.jpg" alt="Dar Arqam Online Quran Academy introduction video" loading="lazy" style="width:100%;height:100%;position:absolute;object-fit:cover;opacity:0.8;">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:68px;height:48px;background:#ff0000;border-radius:12px;display:flex;align-items:center;justify-content:center;">
<svg viewBox="0 0 24 24" width="28" fill="white"><polygon points="9.5,7 9.5,17 17,12"/></svg>
</div>
</div>
<script>
document.querySelector('.youtube-lite').addEventListener('click', function() {
var id = this.dataset.id;
this.innerHTML = '<iframe width="100%" height="100%" style="position:absolute;top:0;left:0;" src="https://www.youtube.com/embed/'+id+'?autoplay=1" frameborder="0" allowfullscreen allow="autoplay"></iframe>';
});
</script>`);
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
