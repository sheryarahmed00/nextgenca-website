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
        <p>Sheryar has spent more than ten years in UK finance, in senior finance and payroll roles as well as practice work. He knows these sectors from the inside, not just from their tax returns:</p>
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
            <label><input type="checkbox" name="vat"> <span>Quarterly VAT returns<small>£45 per quarter</small></span></label>
            <label class="ltd-only"><input type="checkbox" name="pay"> <span>Payroll for staff<small>£20 per month for up to 5, then £4 per extra employee</small></span></label>
            <div class="staff ltd-only" id="est-staff" hidden>Employees <input type="number" name="n" min="1" max="200" value="3"></div>
            <label class="st-only"><input type="checkbox" name="mtd"> <span>Making Tax Digital quarterly updates<small>£25 per quarter</small></span></label>
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
    function upd(){var t=f.t.value,ltd=t==='ltd',items=[],m=ltd?59:25;
      items.push(ltd?'Limited company package: £59':'Sole trader package: £25');
      document.querySelectorAll('.ltd-only').forEach(function(e){e.classList.toggle('est-hide',!ltd)});
      document.querySelectorAll('.st-only').forEach(function(e){e.classList.toggle('est-hide',ltd)});
      document.getElementById('est-staff').hidden=!(ltd&&f.pay.checked);
      if(f.bk.checked){m+=49;items.push('Bookkeeping: £49')}
      if(f.vat.checked){m+=15;items.push('VAT returns: £15 (£45 a quarter)')}
      if(ltd&&f.pay.checked){var n=Math.max(1,parseInt(f.n.value)||1),p=20+Math.max(0,n-5)*4;m+=p;items.push('Payroll, '+n+' staff: £'+p)}
      if(!ltd&&f.mtd.checked){m+=25/3;items.push('MTD updates: £8.33 (£25 a quarter)')}
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

# Deadlines box: each date links to Sheryar's article on it
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
              '<p class="foot-note">Tap a date for Sheryar\'s guide to it. We remind you early and file before the date, not on it.</p>', 1)
DL_CSS = ('/*dl*/.cal li a.dl{display:contents;color:inherit;text-decoration:none}.cal li a.dl i{display:block;font-style:normal;font-size:.78rem;font-weight:700;color:var(--gold-soft);margin-top:4px;opacity:.85}'
          '.cal li:hover{background:rgba(255,255,255,.04)}.cal li a.dl:hover i{text-decoration:underline;opacity:1}'
          '#insights+.wrap.showcase,.showcase{margin-top:24px}/*/dl*/')
s = _re.sub(r'/\*dl\*/.*?/\*/dl\*/', '', s, flags=_re.S)
s = s.replace('</style>', DL_CSS + '</style>', 1)
