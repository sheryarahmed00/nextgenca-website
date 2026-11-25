# Home page extras: fee estimator, experience strip, small copy fixes.
# Executed by build.py on the home page string `s` before it is written.
import re as _re

s = s.replace('Twenty minutes to understand your business', 'Fifteen minutes to understand your business')

EX_CSS = ('/*extras*/.est{margin:34px 0 8px;border:1px solid var(--rule);background:var(--mist);padding:28px}'
          '.est h3{margin:0 0 4px;font-family:var(--display);font-size:1.6rem;color:var(--navy)}'
          '.est>p{margin:0 0 18px;color:var(--muted)}'
          '.est-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:28px;align-items:start}'
          '.est fieldset{border:0;margin:0 0 16px;padding:0}.est legend{font-weight:800;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--navy);margin-bottom:8px}'
          '.est label{display:flex;gap:10px;align-items:flex-start;padding:7px 0;cursor:pointer;line-height:1.35}.est label small{display:block;color:var(--muted)}'
          '.est .est-hide,.est [hidden]{display:none!important}.est form#est-form{background:none;border:0;box-shadow:none;padding:0;margin:0}.est label{display:flex!important;flex-direction:row!important;text-align:left;font-size:.95rem;font-weight:700;color:var(--navy);text-transform:none;letter-spacing:0}.est label small{font-weight:500;font-size:.85rem}.est input[type=radio],.est input[type=checkbox]{width:18px!important;height:18px;min-width:18px;padding:0!important;border:0!important;margin:2px 0 0!important;flex:0 0 18px;box-shadow:none!important;accent-color:var(--navy)}.est .staff{display:flex;align-items:center;gap:10px;margin:4px 0 0 26px}.est .staff input{width:72px;padding:6px 8px;border:1px solid var(--rule)}'
          '.est-out{background:var(--navy);color:#fff;padding:24px}.est-out .lbl{font-size:.74rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-soft)}'
          '.est-out .amt{font-family:var(--display);font-size:3rem;line-height:1;margin:8px 0 4px}.est-out .amt small{font-size:1rem;font-family:var(--body);opacity:.8}'
          '.est-out ul{margin:14px 0;padding-left:18px;font-size:.92rem;opacity:.92}.est-out p{font-size:.82rem;opacity:.8;margin:10px 0 16px}'
          '@media(max-width:820px){.est-grid{grid-template-columns:1fr}.est{padding:20px}}'
          '.exp{margin-top:30px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center;border-top:1px solid var(--rule);padding-top:26px}'
          '.exp .yrs{font-family:var(--display);font-size:3.4rem;line-height:1;color:var(--navy)}.exp .yrs small{display:block;font-family:var(--body);font-size:.74rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}'
          '.exp p{margin:0 0 10px}.exp .chips{display:flex;flex-wrap:wrap;gap:8px}.exp .chips span{border:1px solid var(--rule);padding:5px 12px;font-size:.86rem;font-weight:700;color:var(--navy);background:#fff}'
          '@media(max-width:620px){.exp{grid-template-columns:1fr}}')
s = _re.sub(r'/\*extras\*/.*?/\*/extras\*/', '', s, flags=_re.S)
s = s.replace('</style>', EX_CSS + '/*/extras*/</style>', 1)

EXP = '''<!--exp-->
    <div class="exp">
      <div class="yrs">10+<small>years in UK accounting</small></div>
      <div>
        <p>Our team has more than ten years in UK finance, in senior finance and payroll roles as well as practice work. We know these sectors from the inside, not just from their tax returns:</p>
        <div class="chips"><span>Hospitality</span><span>Real estate</span><span>Consulting</span><span>Salons and retail</span><span>Multi-site payroll</span></div>
      </div>
    </div>
    <!--/exp-->
'''
s = _re.sub(r'<!--exp-->.*?<!--/exp-->\n', '', s, flags=_re.S)
_m = _re.search(r'(<section id="sectors".*?<div class="sectors">.*?\n    </div>\n)', s, _re.S)
if _m:
    s = s[:_m.end()] + '    ' + EXP + s[_m.end():]

EST = '''<!--est-->
    <div class="est" id="estimate">
      <h3>Estimate your monthly fee</h3>
      <p>Tick what you need and see a starting fee straight away. Prices are the same as on our service pages.</p>
      <div class="est-grid">
        <form id="est-form" onsubmit="return false">
          <fieldset><legend>Your business</legend>
            <label><input type="radio" name="t" value="st" checked> <span>Sole trader, freelancer or landlord<small>Accounts, Self Assessment return and tax estimate</small></span></label>
            <label><input type="radio" name="t" value="ltd"> <span>Limited company<small>Accounts, CT600, confirmation statement, director payroll and Self Assessment</small></span></label>
          </fieldset>
          <fieldset><legend>Add what you need</legend>
            <label><input type="checkbox" name="bk"> <span>Monthly bookkeeping<small>£49 per month</small></span></label>
            <label><input type="checkbox" name="vat"> <span>Quarterly VAT returns<small>£90 per quarter</small></span></label>
            <label class="ltd-only"><input type="checkbox" name="pay"> <span>Payroll for staff<small>£25 per month for up to 5, then £4 per extra employee</small></span></label>
            <div class="staff ltd-only" id="est-staff" hidden>Employees <input type="number" name="n" min="1" max="200" value="3"></div>
            <label class="st-only"><input type="checkbox" name="mtd"> <span>Making Tax Digital quarterly updates<small>£30 per quarter</small></span></label>
            <label><input type="checkbox" name="cis"> <span>CIS monthly returns<small>£25 per month</small></span></label>
            <label class="ltd-only"><input type="checkbox" name="ma"> <span>Monthly management accounts<small>£99 per month</small></span></label>
          </fieldset>
        </form>
        <div class="est-out" aria-live="polite">
          <div class="lbl">Estimated starting fee</div>
          <div class="amt" id="est-amt">£25<small> / month</small></div>
          <ul id="est-list"></ul>
          <p>An estimate for a straightforward case. Your exact fee is fixed in writing after a free call and depends on turnover, transactions and the state of your records.</p>
          <a class="btn btn-gold" href="#contact" id="est-cta">Get my fixed quote</a>
        </div>
      </div>
    </div>
    <script>
    (function(){var f=document.getElementById('est-form');if(!f)return;
    function upd(){var t=f.t.value,ltd=t==='ltd',items=[],m=ltd?69:25;
      items.push(ltd?'Limited company package: £69':'Sole trader package: £25');
      document.querySelectorAll('.ltd-only').forEach(function(e){e.classList.toggle('est-hide',!ltd)});
      document.querySelectorAll('.st-only').forEach(function(e){e.classList.toggle('est-hide',ltd)});
      document.getElementById('est-staff').hidden=!(ltd&&f.pay.checked);
      if(f.bk.checked){m+=49;items.push('Bookkeeping: £49')}
      if(f.vat.checked){m+=30;items.push('VAT returns: £30 (£90 a quarter)')}
      if(ltd&&f.pay.checked){var n=Math.max(1,parseInt(f.n.value)||1),p=25+Math.max(0,n-5)*4;m+=p;items.push('Payroll, '+n+' staff: £'+p)}
      if(!ltd&&f.mtd.checked){m+=10;items.push('MTD updates: £10 (£30 a quarter)')}
      if(f.cis.checked){m+=25;items.push('CIS returns: £25')}
      if(ltd&&f.ma.checked){m+=99;items.push('Management accounts: £99')}
      var g=ltd&&f.bk.checked&&f.vat.checked&&f.pay.checked&&(parseInt(f.n.value)||1)<=5;
      if(g){var extra=(f.cis.checked?25:0)+(f.ma.checked?99:0);if(129+extra<m){m=129+extra;items=['Growing business package: £129 (bookkeeping, VAT, payroll for up to 5 and quarterly management accounts included)'].concat(extra?items.filter(function(x){return /CIS|Management/.test(x)}):[])}}
      document.getElementById('est-amt').innerHTML='£'+(Math.round(m*100)/100).toFixed(m%1?2:0)+'<small> / month</small>';
      document.getElementById('est-list').innerHTML=items.map(function(x){return '<li>'+x+'</li>'}).join('');}
    f.addEventListener('input',upd);f.addEventListener('change',upd);upd();})();
    </script>
    <!--/est-->
'''
s = _re.sub(r'<!--est-->.*?<!--/est-->\n', '', s, flags=_re.S)
_i = s.find('<div class="ledger">', s.find('id="fees"'))
if _i > 0:
    s = s[:_i] + EST.lstrip() + '\n    ' + s[_i:]

# hero: link to the estimator next to the fees button
s = s.replace('<a class="btn btn-line" href="#fees">See fees from £25 a month</a>', '<a class="btn btn-line" href="#estimate">Estimate your fee from £25 a month</a>', 1)

# ICAEW directory link and 1-hour reply promise
ICAEW_URL = 'https://find.icaew.com/firms/luton/nextgen/Z1qgR7E'
_A = f'<a href="{ICAEW_URL}" target="_blank" rel="noopener" style="color:inherit">'
s = s.replace('<span>ICAEW firm no. <strong>C011010236</strong></span>',
              f'<span>{_A}ICAEW firm no. <strong>C011010236</strong> ↗</a></span>\n      <span>Replies within <strong>1 hour</strong> Mon to Sat</span>', 1)
s = s.replace('<div><b>C011010236</b>ICAEW firm number</div>',
              f'<div><b>C011010236</b>{_A}ICAEW firm number, verify ↗</a></div>', 1)
s = s.replace('firm number C011010236. ©', f'firm number {_A}C011010236</a>. ©', 1)
s = s.replace('You will get a reply with a time to talk and, after the call, a fixed quote.',
              'We reply within 1 hour, Monday to Saturday, 9am to 7pm, with a time to talk and, after the call, a fixed quote.', 1)
s = s.replace('Prefer not to book now? We will reply within one working day.',
              'Prefer not to book now? We reply within 1 hour, Monday to Saturday, 9am to 7pm.', 1)

# Deadlines box: each date links to our article on it
_DL = [
 ('31 January', 'Self Assessment tax return and payment', 'start-your-self-assessment-tax-return-now'),
 ('Every month', 'Payroll, RTI submissions and PAYE payment', 'payroll-deadlines-fps-on-payday-pay-hmrc-by-22nd'),
 ('Every quarter', 'VAT return, due one month and seven days after the period ends', 'vat-return-deadline-one-month-and-seven-days'),
 ('9 months', 'Company accounts to Companies House after your year end', 'company-accounts-deadline-9-months-and-late-filing-penalties'),
 ('12 months', 'Corporation tax return to HMRC after your year end', 'corporation-tax-pay-9-months-1-day-file-ct600-12-months'),
]
for _d, _t, _sl in _DL:
    s = s.replace(f'<li><b>{_d}</b><span>{_t}</span></li>',
                  f'<li><a class="dl" href="/insights/{_sl}"><b>{_d}</b><span>{_t}<i>Read the guide →</i></span></a></li>', 1)
s = s.replace('<p class="foot-note">We remind you early and file before the date, not on it.</p>',
              '<p class="foot-note">Tap a date for our guide to it. We remind you early and file before the date, not on it.</p>', 1)
DL_CSS = ('/*dl*/.cal li a.dl{display:contents;color:inherit;text-decoration:none}.cal li a.dl i{display:block;font-style:normal;font-size:.78rem;font-weight:700;color:var(--gold-soft);margin-top:4px;opacity:.85}'
          '.cal li:hover{background:rgba(255,255,255,.04)}.cal li a.dl:hover i{text-decoration:underline;opacity:1}'
          '#insights+.wrap.showcase,.showcase{margin-top:24px}/*/dl*/')
s = _re.sub(r'/\*dl\*/.*?/\*/dl\*/', '', s, flags=_re.S)
s = s.replace('</style>', DL_CSS + '</style>', 1)

# Section order, in the order professional firm sites use:
# hero -> what you get -> services -> who we help -> how it works -> fees -> reviews -> about -> insights -> international -> switch -> FAQ -> contact
_start = min(i for i in (s.find('<!--insights-->'), s.find('<div class="wrap showcase">')) if i >= 0)
_end = s.find('<section class="contact" id="contact">')
_region = s[_start:_end]
_blocks = {}
_mi = _re.search(r'<!--insights-->.*?<!--/insights-->\n', _region, _re.S)
if _mi:
    _blocks['insights'] = _mi.group(0)
    _region = _region.replace(_mi.group(0), '')
_parts = _re.split(r'(?m)^(?=<div class="wrap showcase">|<section[ >]|<div class="band">)', _region)
for _p in _parts:
    if not _p.strip():
        continue
    if _p.startswith('<div class="wrap showcase">'): _k = 'showcase'
    elif _p.startswith('<div class="band">'): _k = 'band'
    elif 'From first call to filed' in _p: _k = 'process'
    else:
        _m = _re.match(r'<section[^>]*id="([^"]+)"', _p); _k = _m.group(1) if _m else 'x%d' % len(_blocks)
    _blocks[_k] = _p
_ORDER = ['insights', 'showcase', 'services', 'sectors', 'process', 'fees', 'reviews', 'about', 'international', 'band', 'questions']
_new = ''.join(_blocks.pop(k) for k in _ORDER if k in _blocks) + ''.join(_blocks.values())
s = s[:_start] + _new + s[_end:]

# nav in the same order as the page
s = _re.sub(r'(<nav class="main" id="mainNav" aria-label="Main">\n).*?(    </nav>)',
            r'\1      <a href="#insights">Insights</a>\n      <a href="#services">Services</a>\n      <a href="#sectors">Who we help</a>\n      <a href="#fees">Fees</a>\n      <a href="#reviews">Reviews</a>\n      <a href="#about">About</a>\n      <a href="#international">International</a>\n      <a href="#questions">Questions</a>\n      <a href="/review">Give us a review</a>\n\2',
            s, count=1, flags=_re.S)

# byline on the deadlines box
s = _re.sub(r'<p class="cal-by">.*?</p>\n    ', '', s)
s = s.replace('<h2>Deadlines we keep for you</h2>',
              '<p class="cal-by">Guides by Ahmed ACA, founder of NextGen Chartered Accountant</p>\n    <h2>Deadlines we keep for you</h2>', 1)
s = s.replace('#insights+.wrap.showcase,.showcase{margin-top:24px}', '.cal-by{margin:0 0 6px;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fff;opacity:.75}#insights~.wrap.showcase{margin-top:0}', 1)

# Social profiles: tell Google which profiles belong to the firm
_SAME = '"sameAs":["https://www.linkedin.com/company/nextgen-chartered-accountant","https://www.facebook.com/nextgencharteredaccountant","https://www.instagram.com/nextgencharteredaccountant/","https://www.tiktok.com/@nextgenca.co.uk","https://www.youtube.com/@nextgencharteredaccountant","https://find.icaew.com/firms/luton/nextgen/Z1qgR7E","https://wa.me/447591246395"]'
s = _re.sub(r'"sameAs":\[[^\]]*\]', _SAME, s, count=1)

# Google Search Console verification
if 'google-site-verification' not in s:
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="google-site-verification" content="JtV78OIq002X6sZKrBfHd2YsYli2YX8-uKDxMeHRK5U">', 1)

# Free first step on each service group
_FREE = {
 'Accounts and compliance': 'Free Companies House deadline check',
 'Tax': 'Free first look at your HMRC letter',
 'Payroll and pensions': 'Free payroll health check',
 'Bookkeeping and VAT': 'Free Making Tax Digital readiness check',
 'Advisory and virtual FD': 'Free cash flow review call',
 'Starting and running a company': 'Free sole trader vs Ltd comparison',
}
s = _re.sub(r'<p class="svc-free">.*?</p>', '', s)
for _h, _o in _FREE.items():
    _i = s.find('<h3>' + _h + '</h3>')
    if _i < 0: continue
    _j = _i + len('<h3>' + _h + '</h3>')
    s = s[:_j] + f'<p class="svc-free"><a href="#contact">Free {_o[5:]}</a></p>' + s[_j:]

# Software certifications
s = _re.sub(r'\n    <div class="tools"><span>(We work on|Certified in)</span>.*?</div>', '', s, count=1)

# Trust bar under the hero
TRUST = '''<!--trust-->
<div class="trustbar"><div class="wrap">
  <a class="tb" href="https://find.icaew.com/firms/luton/nextgen/Z1qgR7E" target="_blank" rel="noopener"><b>ICAEW</b><span>Member firm C011010236</span></a>
  <div class="tb"><b>HMRC</b><span>Registered tax agent</span></div>
  <div class="tb"><b>Xero</b><span>Certified</span></div>
  <div class="tb"><b>QuickBooks</b><span>Certified ProAdvisor</span></div>
  <div class="tb"><b>Sage</b><span>Certified</span></div>
  <div class="tb"><b>FreeAgent</b><span>Certified</span></div>
  <div class="tb"><b>Dext</b><span>Certified</span></div>
  <div class="tb"><b>PI insured</b><span>Professional indemnity</span></div>
</div></div>
<!--/trust-->
'''
s = _re.sub(r'<!--trust-->.*?<!--/trust-->\n', '', s, flags=_re.S)
s = s.replace('<!--insights-->', TRUST + '<!--insights-->', 1)
TB_CSS = ('/*tb*/.trustbar{background:#fff;border-bottom:1px solid var(--rule)}.trustbar .wrap{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;padding-top:22px;padding-bottom:22px}@media(max-width:1000px){.trustbar .wrap{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:560px){.trustbar .wrap{grid-template-columns:repeat(2,minmax(0,1fr))}}'
          '.trustbar .tb{display:flex;flex-direction:column;align-items:center;min-width:0;padding:8px 6px;border:1px solid var(--rule);text-decoration:none;color:inherit}'
          '.trustbar .tb b{font-family:var(--display);font-size:1.15rem;color:var(--navy);line-height:1.1}.trustbar .tb span{font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:3px;text-align:center}'
          'a.tb:hover{border-color:var(--gold)}#insights{padding-top:56px}'
          '.svc-free{margin:-4px 0 14px}.svc-free a{display:inline-block;background:var(--gold-soft);color:var(--navy);font-size:.74rem;font-weight:800;letter-spacing:.04em;padding:5px 10px;border-radius:999px;text-decoration:none}.svc-free a:hover{background:var(--gold);color:#fff}'
          '/*/tb*/')
s = _re.sub(r'/\*tb\*/.*?/\*/tb\*/', '', s, flags=_re.S)
s = s.replace('</style>', TB_CSS + '</style>', 1)

# Stats band under the trust bar (figures confirmed by the owner, 25 Nov 2026)
STATS = """<!--stats-->
<div class="stats"><div class="wrap">
  <div class="st"><b>1000+</b><span>Clients served</span></div>
  <div class="st"><b>300+</b><span>Monthly clients</span></div>
  <div class="st"><b>10+</b><span>Years of UK experience</span></div>
  <div class="st"><b>&lt; 1 hr</b><span>Typical reply time</span></div>
</div></div>
<!--/stats-->
"""
s = _re.sub(r'<!--stats-->.*?<!--/stats-->\n', '', s, flags=_re.S)
s = s.replace('<!--insights-->', STATS + '<!--insights-->', 1)
ST_CSS = ('/*st*/.stats{background:var(--navy);color:#fff}.stats .wrap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;padding-top:30px;padding-bottom:30px}'
          '.stats .st{text-align:center;padding:6px 10px;border-left:1px solid rgba(255,255,255,.14)}.stats .st:first-child{border-left:0}'
          '.stats .st b{display:block;font-family:var(--display);font-size:2.6rem;line-height:1;color:#fff;font-weight:600}'
          '.stats .st span{display:block;margin-top:8px;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-soft)}'
          '@media(max-width:700px){.stats .wrap{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:22px}.stats .st:nth-child(3){border-left:0}.stats .st b{font-size:2.1rem}}'
          '/*/st*/')
s = _re.sub(r'/\*st\*/.*?/\*/st\*/', '', s, flags=_re.S)
s = s.replace('</style>', ST_CSS + '</style>', 1)

# Full price list on its own page (/fees); home keeps packages + estimator
import json as _json
_fm = _re.search(r'const FEES = (\[.*?\n\]);', s, _re.S)
if _fm:
    _FEES = _json.loads(_fm.group(1))
    _css = ''.join(c.strip() for c in _re.findall(r'[^{}]*\{[^}]*\}', s[:s.find('</style>')]) if _re.match(r'\s*(/\*[^*]*\*/\s*)?\.(ledger|grp|row)', c))
    _ledger = ''.join('<div class="grp"><h3>' + html.escape(t) + '<span>' + c + '</span></h3>' + ''.join(
        '<div class="row"><span class="nm">' + html.escape(r[0]) + '</span><span class="dots"></span><span class="amt">' + r[1] + ('<small>' + r[2] + '</small>' if len(r) > 2 else '') + '</span></div>' for r in rows) + '</div>' for t, c, rows in _FEES)
    _body = f'''<style>{_css}.ledger{{margin-top:28px}}</style>
<p class="crumb"><a href="/">Home</a> / Fees</p>
<p class="eyebrow" style="margin-top:22px">Fees</p>
<h1>Full price list</h1>
<p class="lead">Every price below is a starting fee for a straightforward case. You get an exact fixed quote after a free 15-minute call, and it does not change unless your work does.</p>
<p><a class="btn btn-gold" href="/#estimate">Estimate your monthly fee</a> <a class="btn btn-navy" href="/#contact">Book a free call</a></p>
<h2>Prices by service</h2>
<div class="ledger"><div class="ledger-cols">{_ledger}</div>
<p class="note">Fees depend on turnover, number of transactions and the state of the records. Companies House and other official filing fees are charged at cost.</p></div>
<h2>What is included</h2>
<p>NextGen is not VAT registered, so no VAT is added to any fee on this page. The price you are quoted is the price you pay.</p>
<ul><li><b>One-off fees</b> cover preparing the accounts or return named, a review by a Chartered Accountant, filing with HMRC or Companies House once you approve it, and your questions about that work by email and WhatsApp.</li>
<li><b>Sole trader package, from £25 a month:</b> annual accounts, Self Assessment tax return, a tax estimate before each deadline, email and WhatsApp support.</li>
<li><b>Limited company package, from £69 a month:</b> year-end accounts and corporation tax return, confirmation statement, director's payroll and Self Assessment, salary and dividend planning, email and WhatsApp support.</li>
<li><b>Growing business package, from £129 a month:</b> everything in the Limited company package, plus monthly bookkeeping, quarterly VAT returns, payroll for up to 5 staff and quarterly management accounts.</li>
<li><b>Not included:</b> Companies House and other official filing fees, which are charged at cost, software subscriptions, and catch-up work on earlier years, which is quoted separately.</li></ul>
{CTA}'''
    page('fees', 'Accountant Fees and Full Price List | NextGen Chartered Accountant',
         'Fixed-fee price list for accounts, tax returns, payroll, VAT, bookkeeping and company services from NextGen Chartered Accountant, an ICAEW member firm in Luton.', _body)
    open(R + 'fees.html', 'w').write(PAGES['fees'])
s = s.replace('<div class="ledger-cols" id="ledger"></div>',
              '<p style="margin:26px 0 8px"><a class="btn btn-navy" href="/fees">See the full price list →</a></p>', 1)
s = s.replace('document.getElementById("ledger").innerHTML =', 'var _lg = document.getElementById("ledger"); if (_lg) _lg.innerHTML =', 1)

# Software logos in the trust bar
for _n, _a in [('Xero', 'xero'), ('QuickBooks', 'quickbooks'), ('Sage', 'sage'), ('FreeAgent', 'freeagent'), ('Dext', 'dext')]:
    s = s.replace(f'<div class="tb"><b>{_n}</b>', f'<div class="tb"><img src="/img/badges/{_a}.svg" alt="{_n}" height="28" loading="lazy">', 1)
s = s.replace('.trustbar .tb b{', '.trustbar .tb img{height:28px;width:auto;max-width:100%;margin:2px 0}.trustbar .tb b{', 1)

# Both team cards in the same navy style
s = s.replace('<aside class="card-cred alt"', '<aside class="card-cred" style="margin-top:18px"', 1)

# Start every list item and review with a capital letter
s = _re.sub(r'<li>([a-z])', lambda m: '<li>' + m.group(1).upper(), s)
s = s.replace('“thank you very much Ahmed as usual. this is the third year i work', '“Thank you very much Ahmed as usual. This is the third year I work', 1)
for _a, _b in [('>up 9% on October<', '>Up 9% on October<'), ('>target 58%<', '>Target 58%<'), ('>due 31 January<', '>Due 31 January<'),
               ('>five-star reviews<', '>Five-star reviews<'), ('<small>years in UK accounting</small>', '<small>Years in UK accounting</small>')]:
    s = s.replace(_a, _b)

# UK-wide home title and description
_HT='Chartered Accountants UK | Online Accountants | NextGen'
_HD='ICAEW Chartered Accountants for UK small businesses, limited companies, contractors and the self-employed. Fixed fees, online across the UK, based in Luton.'
s=_re.sub(r'<title>.*?</title>','<title>'+_HT+'</title>',s,count=1,flags=_re.S)
s=_re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="'+_HD+'">',s,count=1)
s=_re.sub(r'<meta property="og:title" content="[^"]*">','<meta property="og:title" content="'+_HT+'">',s,count=1)
s=_re.sub(r'<meta property="og:description" content="[^"]*">','<meta property="og:description" content="'+_HD+'">',s,count=1)
s=s.replace('"description":"ICAEW member firm of Chartered Accountants in Luton, Bedfordshire. Fixed-fee','"description":"ICAEW member firm of Chartered Accountants serving clients across the UK, based in Luton, Bedfordshire. Fixed-fee',1)
s=s.replace('"areaServed":[{"@type":"City","name":"Luton"},{"@type":"AdministrativeArea","name":"Bedfordshire"},{"@type":"Country","name":"United Kingdom"}]','"areaServed":[{"@type":"Country","name":"United Kingdom"},{"@type":"City","name":"London"},{"@type":"City","name":"Luton"},{"@type":"AdministrativeArea","name":"Bedfordshire"}]',1)

# Link new UK service pages from the home services section
if '<!--uksvc-->' not in s:
    _i=s.find('id="services"'); _j=s.find('</section>',_i)
    _blk='''<!--uksvc--><div class="uksvc" style="margin:26px 0 0">
<style>.uksvc h3{font:800 .74rem var(--body);letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin:0 0 14px}.uksvc .chips{display:flex;flex-wrap:wrap;gap:10px}.uksvc .chips a{display:inline-flex;align-items:center;padding:11px 18px;border:1px solid var(--rule);background:#fff;color:var(--navy);font-weight:700;font-size:.93rem;text-decoration:none;border-radius:999px;transition:background .15s,color .15s,border-color .15s}.uksvc .chips a:hover{background:var(--navy);color:#fff;border-color:var(--navy)}.uksvc .chips a.all{background:var(--navy);color:#fff;border-color:var(--navy)}</style>
<h3>Popular services</h3>
<div class="chips"><a href="/corporation-tax-returns">Corporation tax returns (CT600)</a><a href="/vat-registration-and-returns">VAT registration and returns</a><a href="/small-business-accounting">Small business accounting</a><a href="/contractor-and-self-employed-accounting">Contractor and self-employed accounting</a><a href="/business-tax-planning">Business tax planning</a><a class="all" href="/accounting-services-uk">All accounting services →</a></div>
</div>
'''
    _k=s.rfind('</div>',_i,_j)
    if _i>0 and _k>0: s=s[:_k]+_blk+s[_k:]

# Free tools section near the top of the home page
if '<!--tools-->' not in s:
    _tools='''<!--tools--><section id="tools" style="padding-bottom:0">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">Free tools</p>
      <h2>Work out your tax in seconds</h2>
      <p class="lead">Free calculators and guides for UK company directors and the self-employed, built and checked by a Chartered Accountant.</p>
    </div>
    <style>.ftools{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:26px}.ftool{display:block;background:#fff;border:1px solid var(--rule);border-top:3px solid var(--gold);padding:24px 22px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s}.ftool:hover{transform:translateY(-3px);box-shadow:0 14px 34px rgba(11,27,52,.12)}.ftool small{display:block;font-size:.72rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}.ftool b{display:block;color:var(--navy);font-size:1.12rem;line-height:1.3;margin-bottom:8px}.ftool span{display:block;color:var(--muted);font-size:.93rem}.ftool i{display:block;margin-top:14px;font-style:normal;font-weight:800;color:var(--navy)}@media(max-width:980px){.ftools{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.ftools{grid-template-columns:1fr}}</style>
    <div class="ftools">
      <a class="ftool" href="/corporation-tax-calculator"><small>Calculator</small><b>Corporation tax calculator</b><span>19%, 25% and marginal relief for 2026 to 2027.</span><i>Calculate →</i></a>
      <a class="ftool" href="/dividend-tax-calculator"><small>Calculator</small><b>Dividend tax calculator</b><span>See the tax on your salary and dividend mix.</span><i>Calculate →</i></a>
      <a class="ftool" href="/tax-deadlines-for-company-directors"><small>Guide</small><b>Deadlines for directors</b><span>Every filing date and the penalty for missing it.</span><i>Read the guide →</i></a>
      <a class="ftool" href="/salary-take-home-calculator"><small>Calculator</small><b>Take-home pay calculator</b><span>Your salary after tax and National Insurance.</span><i>Calculate →</i></a>
    </div>
  </div>
</section>
'''
    s=s.replace('<section id="insights">',_tools+'<section id="insights">',1)
    s=s.replace('<a href="#insights">Insights</a>','<a href="#tools">Free tools</a>\n      <a href="#insights">Insights</a>',1)

# Quick corporation tax check in the hero, under the credentials
if '<!--herocalc-->' not in s:
    _hc='''<!--herocalc--><div class="hcalc">
      <style>.hcalc{margin:30px 0 0;max-width:640px;padding:20px 22px;border:1px solid rgba(201,162,77,.45);border-left:3px solid var(--gold);background:rgba(255,255,255,.05)}.hcalc small{display:block;font-size:.7rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}.hcalc b.t{display:block;color:#fff;font-size:1.08rem;margin:6px 0 14px}.hcalc .row{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center}.hcalc input{width:170px;padding:11px 12px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff;font:inherit}.hcalc .res{color:rgba(255,255,255,.85)}.hcalc .res strong{color:#fff;font-size:1.25rem}.hcalc p{margin:16px 0 0;font-size:.9rem;display:flex;flex-wrap:wrap;gap:8px 20px}.hcalc p a{color:var(--gold-2,#e3c178);font-weight:700;white-space:nowrap}.hcalc .row label{flex:0 0 132px}.hcalc .row{flex-wrap:nowrap}.hcalc input{flex:0 0 150px;width:150px;min-width:0}@media(max-width:520px){.hcalc .row{flex-wrap:wrap}.hcalc .row label{flex:1 0 100%}}</style>
      <small>Free tools</small>
      <b class="t">Quick tax check, 2026 to 2027</b>
      <div class="row"><label for="hcp" style="color:rgba(255,255,255,.85)">Company profit £</label><input id="hcp" type="number" min="0" step="1000" value="60000" inputmode="numeric"><span class="res">Tax due <strong id="hcr">-</strong></span></div>
      <div class="row" style="margin-top:12px"><label for="hsp" style="color:rgba(255,255,255,.85)">Annual salary £</label><input id="hsp" type="number" min="0" step="1000" value="35000" inputmode="numeric"><span class="res">Take-home <strong id="hsr">-</strong> a month</span></div>
      <p><a href="/corporation-tax-calculator">Full calculator →</a><a href="/salary-take-home-calculator">Take-home pay calculator →</a><a href="/dividend-tax-calculator">Dividend tax calculator →</a><a href="/tax-deadlines-for-company-directors">Deadlines for directors →</a></p>
      <script>(function(){var i=document.getElementById("hcp"),o=document.getElementById("hcr");function r(){var p=Math.max(0,parseFloat(i.value)||0),t=p<=50000?p*0.19:p>=250000?p*0.25:p*0.25-(250000-p)*3/200;o.textContent="£"+Math.round(t).toLocaleString("en-GB")}i.addEventListener("input",r);r();var a=document.getElementById("hsp"),b=document.getElementById("hsr");function q(){var e=Math.max(0,parseFloat(a.value)||0),pa=12570;if(e>100000){pa=Math.max(0,12570-Math.floor((e-100000)/2))}var t=Math.max(0,e-pa),x=Math.min(t,37700)*0.2+Math.max(0,Math.min(t,125140-pa)-37700)*0.4+Math.max(0,t-(125140-pa))*0.45,n=Math.max(0,Math.min(e,50270)-12570)*0.08+Math.max(0,e-50270)*0.02;b.textContent="£"+Math.round((e-x-n)/12).toLocaleString("en-GB")}a.addEventListener("input",q);q()})();</script>
    </div>
'''
    _a=s.find('<div class="creds">'); _b=s.find('</div>',_a)
    if _a>0 and _b>0: s=s[:_b+6]+'\n    '+_hc+s[_b+6:]
