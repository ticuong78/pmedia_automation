function extractFacebookAndPhonesFromHtml(html) {
  const raw = html ?? '';
  const text =
    typeof raw === 'string'
      ? raw
      : typeof raw?.body === 'string'
      ? raw.body
      : typeof raw?.html === 'string'
      ? raw.html
      : typeof raw?.text === 'string'
      ? raw.text
      : String(raw);

  const hrefs = [];

  try {
    const cheerio = require('cheerio');
    const $ = cheerio.load(text || '');
    $('[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) hrefs.push(href);
    });
    $('[data-href]').each((_, el) => {
      const href = $(el).attr('data-href');
      if (href) hrefs.push(href);
    });
  } catch {
    const hrefRe = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+))/gi;
    let m;
    while ((m = hrefRe.exec(text))) {
      const href = (m[1] ?? m[2] ?? m[3] ?? '').trim();
      if (href) hrefs.push(href);
    }
  }

  function normalizeFacebookLink(href) {
    if (!href) return '';
    let h = String(href).trim().replace(/&amp;/g, '&');
    if (!h) return '';
    if (/^(?:javascript|data|mailto|tel):/i.test(h)) return '';

    if (/%3a%2f%2f/i.test(h)) {
      try {
        h = decodeURIComponent(h);
      } catch {}
    }

    if (h.startsWith('//')) h = 'https:' + h;

    if (/^(?:www\.|m\.|mbasic\.)?facebook\.com\//i.test(h) || /^(?:m\.)?fb\.com\//i.test(h)) {
      h = 'https://' + h.replace(/^\/+/, '');
    }

    if (!/^https?:\/\//i.test(h)) return '';

    if (!/\/\/(?:www\.|m\.|mbasic\.)?facebook\.com\//i.test(h) && !/\/\/(?:m\.)?fb\.com\//i.test(h)) {
      return '';
    }

    return h;
  }

  const facebook_links = [];
  const fbSeen = new Set();

  for (const href of hrefs) {
    const fb = normalizeFacebookLink(href);
    if (!fb) continue;
    const key = fb.toLowerCase();
    if (fbSeen.has(key)) continue;
    fbSeen.add(key);
    facebook_links.push(fb);
  }

  // extra: pick facebook URLs that appear as plain text or URL-encoded in the HTML
  const fbUrlRe = /https?:\/\/(?:www\.|m\.|mbasic\.)?facebook\.com\/[^\s"'<>]+/gi;
  let tm;
  while ((tm = fbUrlRe.exec(text))) {
    const fb = normalizeFacebookLink(tm[0]);
    if (!fb) continue;
    const key = fb.toLowerCase();
    if (fbSeen.has(key)) continue;
    fbSeen.add(key);
    facebook_links.push(fb);
  }

  const fbEncRe = /https%3a%2f%2f(?:www%2e|m%2e|mbasic%2e)?facebook%2ecom%2f[^\s"'<>]+/gi;
  let em;
  while ((em = fbEncRe.exec(text))) {
    const fb = normalizeFacebookLink(em[0]);
    if (!fb) continue;
    const key = fb.toLowerCase();
    if (fbSeen.has(key)) continue;
    fbSeen.add(key);
    facebook_links.push(fb);
  }

  const phones = [];
  const phoneSeen = new Set();
  const phoneRe = /(?:\+?84|0)(?:[\s().-]*\d){8,12}/g;
  let pm;
  while ((pm = phoneRe.exec(text))) {
    const p = normVNPhone(pm[0]);
    if (!p) continue;
    if (phoneSeen.has(p)) continue;
    phoneSeen.add(p);
    phones.push(p);
  }

  function normVNPhone(rawPhone) {
    if (!rawPhone) return '';
    let d = String(rawPhone).replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('84')) d = '0' + d.slice(2);
    if (d.startsWith('084')) d = '0' + d.slice(3);
    if (!d.startsWith('0')) return '';
    if (d.length < 9 || d.length > 11) return '';
    return d;
  }

  return { facebook_links, phones };
}

return extractFacebookAndPhonesFromHtml($json.body);
