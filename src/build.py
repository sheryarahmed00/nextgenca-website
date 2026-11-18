import re, json, html, sys
import os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
idx=open(R+'index.html').read()
if '.upd{' not in idx:
    idx=idx.replace('</style>','.upd-list{}.updates{display:grid;gap:0;margin:8px 0 12px;border-top:1px solid var(--rule)}.upd{display:block;padding:16px 0;border-bottom:1px solid var(--rule);text-decoration:none;color:inherit}.upd b{display:block;color:var(--navy);font-size:1.02rem;margin:4px 0}.upd span{display:block;color:var(--muted);font-size:.93rem}.upd .upd-meta{font-size:.74rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}.upd:hover b{text-decoration:underline}.post{padding:20px 0;border-bottom:1px solid var(--rule)}.post h3{margin:6px 0 8px;font-size:1.35rem}.post h3 a{color:var(--navy);text-decoration:none}.byline{color:var(--muted);margin:-6px 0 18px}.ins-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}@media(max-width:860px){.ins-grid{grid-template-columns:1fr;gap:24px}}</style>',1)
style=re.search(r'<style>(.*?)</style>',idx,re.S).group(1)
fonts=re.search(r'<link href="https://fonts.googleapis.com/css2[^>]*>',idx).group(0)
EXTRA='''
.page{padding:72px 0 96px}
.page h1{font-size:clamp(2.2rem,4.6vw,3.4rem);margin:18px 0 18px}
.page h2{font-size:clamp(1.5rem,2.6vw,2rem);margin:44px 0 14px}
.prose{max-width:780px}
.prose p{margin:0 0 16px}
.prose ul{margin:0 0 18px;padding-left:20px}
.prose li{margin:0 0 8px}
.prose a{color:var(--navy);font-weight:700}
.prose a.btn{color:#fff}
.ft{width:100%;border-collapse:collapse;margin:6px 0 10px}
.ft td{padding:13px 0;border-bottom:1px solid var(--rule)}
.ft td:last-child{text-align:right;font-weight:800;color:var(--navy);white-space:nowrap}
.note{color:var(--muted);font-size:.92rem}
.cta{margin-top:44px;padding:28px;background:var(--mist);border-left:3px solid var(--gold)}
.cta p{margin:0 0 16px}
.cta .btn{margin:0 10px 8px 0}
.btn-wa{background:#1f7a4d;color:#fff}
.crumb{font-size:.85rem;color:var(--muted)}
.crumb a{color:var(--muted)}
'''
HEADER='''<header class="site">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="NextGen Chartered Accountant home">
      <img src="/img/mark.jpg" alt="" width="68" height="50">
      <span><b>NEXT<i>GEN</i></b><small>CHARTERED ACCOUNTANT</small></span>
    </a>
    <nav class="main" id="mainNav" aria-label="Main">
      <a href="/#services">Services</a>
      <a href="/#sectors">Who we help</a>
      <a href="/#fees">Fees</a>
      <a href="/#international">International</a>
      <a href="/#about">About</a>
      <a href="/insights">Insights</a>
      <a href="/#questions">Questions</a>
    </nav>
    <div class="bar-right">
      <a class="btn btn-navy" href="/#contact">Book a free call</a>
      <button class="menu" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mainNav"><i></i><i></i><i></i></button>
    </div>
  </div>
</header>'''
FOOT='''<footer>
  <div class="wrap">
    <div class="foot">
      <div>
        <b class="w">NEXT<i>GEN</i></b>
        <p style="margin-top:10px;max-width:38ch">Chartered Accountant. Your outsourcing partner for accounts, tax, payroll and advice.</p>
        <p style="margin-top:14px">+44 7591 246395<br>info@nextgenca.co.uk<br>nextgenca.co.uk</p>
        <p style="margin-top:14px">Follow us: <a href="https://www.linkedin.com/company/nextgen-chartered-accountant" rel="me noopener" target="_blank">LinkedIn</a> · <a href="https://www.facebook.com/nextgencharteredaccountant" rel="me noopener" target="_blank">Facebook</a> · <a href="https://www.instagram.com/nextgencharteredaccountant/" rel="me noopener" target="_blank">Instagram</a><br><a href="https://find.icaew.com/firms/luton/nextgen/Z1qgR7E" rel="noopener" target="_blank">ICAEW directory listing</a></p>
      </div>
      <div><h4>Services</h4><ul><li><a href="/self-assessment-tax-return">Self Assessment tax returns</a></li><li><a href="/limited-company-accounts">Limited company accounts</a></li><li><a href="/bookkeeping-and-vat">Bookkeeping and VAT</a></li><li><a href="/payroll">Payroll and pensions</a></li><li><a href="/landlord-tax-return">Landlord tax returns</a></li><li><a href="/company-formation">Company formation</a></li><li><a href="/management-accounts">Management accounts</a></li><li><a href="/non-resident-uk-tax">UK tax for non-residents</a></li><li><a href="/outsourcing-for-accountancy-firms">Outsourcing for accountancy firms</a></li></ul></div>
      <div><h4>Firm</h4><ul><li><a href="/accountants-in-luton">Accountants in Luton</a></li><li><a href="/insights">Insights and tax updates</a></li><li><a href="/fees">Fees and price list</a></li><li><a href="/#about">About</a></li><li><a href="/#contact">Book a call</a></li><li><a href="/privacy">Privacy notice</a></li><li><a href="/complaints">Complaints</a></li></ul></div>
    </div>
    <p class="legal">NextGen Chartered Accountant is the trading name of Sheryar Ahmed ACA FCCA, a sole practitioner and member firm of the Institute of Chartered Accountants in England and Wales (ICAEW), firm number C011010236. © 2026 NextGen Chartered Accountant.</p>
  </div>
</footer>
<script>
const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("mainNav");
menuBtn.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuBtn.setAttribute("aria-expanded",open);menuBtn.setAttribute("aria-label",open?"Close menu":"Open menu");});
</script>
<script src="/chat.js?v=5" defer></script>'''
CTA='''<div class="cta"><p><b>Want a fixed quote?</b> Tell us what you need. We reply within 1 hour, Monday to Saturday, 9am to 7pm, and send a fixed fee after a free call.</p>
<a class="btn btn-navy" href="/#contact">Book a free call</a><a class="btn btn-wa" href="https://wa.me/447591246395">Message on WhatsApp</a></div>'''
PAGES={}
def page(slug,title,desc,body,ld=None,noindex=False,image=None,ogtype='website'):
    url='https://nextgenca.co.uk/'+slug
    h=f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="robots" content="{'noindex' if noindex else 'index, follow'}">
<link rel="icon" href="/img/mark.jpg">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
'''
    if not noindex:
        h+=f'''<link rel="canonical" href="{url}">
<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="NextGen Chartered Accountant">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image or 'https://nextgenca.co.uk/img/mark.jpg'}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="{'summary_large_image' if image else 'summary'}">
'''
    if ld: h+='<script type="application/ld+json">'+json.dumps(ld,separators=(',',':'))+'</script>\n'
    h+=f'''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{fonts}
<style>{style}{EXTRA}</style>
</head>
<body>
{HEADER}
<main class="page"><div class="wrap"><div class="prose">
{body}
</div></div></main>
{FOOT}
</body>
</html>
'''
    PAGES[slug]=h
def fees(rows):
    return '<table class="ft">'+''.join(f'<tr><td>{a}</td><td>{b if b.startswith(("Quoted","Included","At cost")) else "from "+b}</td></tr>' for a,b in rows)+'</table><p class="note">Prices are starting fees. Your quote is fixed for the work described in your engagement letter.</p>'
def faq(qs): return ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q,a in qs)
NAMES={}
REL={}
def svc(slug,name,title,desc,lead,inc,feerows,steps,dates,qs,dates_title='Dates worth knowing',who=None,need=None,crumb='Services'):
    body=f'''<p class="crumb"><a href="/">Home</a> / <a href="/#services">Services</a> / {name}</p>
<p class="eyebrow" style="margin-top:22px">Services</p>
<h1>{name}</h1>
<p class="lead">{lead}</p>
{('<h2>Who it is for</h2><ul>'+''.join(f'<li>{i}</li>' for i in who)+'</ul>') if who else ''}
<h2>What is included</h2><ul>{''.join(f'<li>{i}</li>' for i in inc)}</ul>
<h2>Fees</h2>{fees(feerows)}
<h2>How it works</h2><ul>{''.join(f'<li>{i}</li>' for i in steps)}</ul>
{('<h2>What we need from you</h2><ul>'+''.join(f'<li>{i}</li>' for i in need)+'</ul>') if need else ''}
<h2>{dates_title}</h2><ul>{''.join(f'<li>{i}</li>' for i in dates)}</ul>
<p class="note">Rules and deadlines are set by HMRC and Companies House and can change. We confirm what applies to you before any work starts.</p>
<h2>Questions</h2>{faq(qs)}
@@REL:{slug}@@
{CTA}'''
    ld=[{"@context":"https://schema.org","@type":"Service","name":name,"serviceType":name,"url":"https://nextgenca.co.uk/"+slug,"areaServed":{"@type":"Country","name":"United Kingdom"},"provider":{"@type":"AccountingService","name":"NextGen Chartered Accountant","url":"https://nextgenca.co.uk/","telephone":"+447591246395"}},
        {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://nextgenca.co.uk/"},{"@type":"ListItem","position":2,"name":name,"item":"https://nextgenca.co.uk/"+slug}]},
        {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in qs]}]
    NAMES[slug]=name
    page(slug,title,desc,body,ld)

svc('self-assessment-tax-return','Self Assessment tax returns',
 'Self Assessment Tax Return Accountant in Luton | From £99 | NextGen',
 'Self Assessment tax returns prepared and filed by a Chartered Accountant in Luton. Fixed fees from £99 for employees, sole traders, landlords and directors across the UK.',
 'Your tax return prepared, checked and filed with HMRC by a Chartered Accountant, for a fixed fee agreed before we start.',
 ['Review of your income, expenses and allowances','Sole trader, rental, dividend, pension and foreign income','Capital gains, including 60-day property returns','Tax calculation explained in plain English before we file','Filing with HMRC and confirmation of what to pay and when','Help with HMRC letters, late returns and penalties'],
 [('Self Assessment tax return','£99'),('Self-employed tax return, one income source','£100'),('Self-employed tax return, several income sources','£150'),('Landlord tax return','£129'),('Capital gains tax return','£149'),('MTD for Income Tax quarterly update','£30 per quarter')],
 ['Send us your figures and documents by email, WhatsApp or a shared folder.','We prepare the return and send you a clear summary of the tax due.','You approve it, we file it with HMRC and send you the confirmation.'],
 ['The tax year runs from 6 April to 5 April.','Online returns and any tax owed are due by 31 January after the tax year ends.','Payments on account may be due on 31 January and 31 July.','Making Tax Digital for Income Tax applies from April 2026 to sole traders and landlords with qualifying income over £50,000.'],
 [('I have never filed a tax return. Can you register me?','Yes. We register you for Self Assessment with HMRC and then prepare your first return.'),
  ('My return is late. What should I do?','Send us what you have. We will tell you what to file first and what penalties are likely, then get the return in.'),
  ('Do I need to live in Luton?','No. Everything is done online, so we act for clients anywhere in the UK and abroad.')])

svc('limited-company-accounts','Limited company accounts and corporation tax',
 'Limited Company Accounts and CT600 | From £349 | NextGen Chartered Accountant',
 'Year-end accounts, corporation tax return (CT600) and Companies House filing for limited companies. Fixed fees from £349 from an ICAEW member firm in Luton.',
 'Year-end accounts, the corporation tax return and Companies House filing, handled together for one fixed fee.',
 ['Statutory year-end accounts','Corporation tax computation and CT600 return','Filing with Companies House and HMRC','Confirmation statement','Salary and dividend planning for directors','Dormant company accounts'],
 [('Limited company accounts and CT600','£349'),('Dormant company accounts','£49'),('Confirmation statement','£29'),('Director-only payroll','£10 per month'),('Tax planning session','£75')],
 ['We collect your records or connect to your accounting software.','We prepare the accounts and tax return and walk you through the figures.','You approve them and we file with Companies House and HMRC.'],
 ['Accounts are due at Companies House 9 months after the company year end.','Corporation tax is payable 9 months and 1 day after the year end.','The CT600 return is due 12 months after the year end.','A confirmation statement is due at least once every 12 months.'],
 [('Can I switch from my current accountant?','Yes. We write to your current accountant for the handover information. You do not need to manage the move yourself.'),
  ('My company accounts are overdue. Can you help?','Yes. Tell us what is outstanding and we will set out what to file first and what any penalties are likely to be.'),
  ('Can you set up a new company for me?','Yes. Company formation starts from £49, and we can register the company for PAYE and VAT at the same time.')])

svc('bookkeeping-and-vat','Bookkeeping and VAT returns',
 'Bookkeeping and VAT Returns | From £49 a month | NextGen Chartered Accountant',
 'Monthly bookkeeping, bank reconciliation and Making Tax Digital VAT returns on Xero, QuickBooks, Sage or FreeAgent. Fixed fees from £49 a month.',
 'Your books kept up to date every month and your VAT returns filed on time under Making Tax Digital.',
 ['Monthly bookkeeping and bank reconciliation','VAT registration and choice of VAT scheme','Quarterly VAT returns filed through MTD software','Xero, QuickBooks, Sage and FreeAgent setup','Catch-up on late or messy books','Management accounts if you want monthly figures'],
 [('Monthly bookkeeping','£49 per month'),('VAT return','£90 per quarter'),('VAT registration','£39'),('Accounting software setup','£99'),('Management accounts','£99 per month')],
 ['We connect your bank feed and set up a simple way to send receipts and invoices.','We post and reconcile your transactions each month.','We prepare each VAT return, show you the figure and file it once you approve.'],
 ['You must register for VAT when taxable turnover goes over £90,000 in any 12-month period.','Most VAT returns are quarterly and are due 1 month and 7 days after the period ends.','VAT records must be kept digitally and returns filed with MTD-compatible software.'],
 [('Which software do you use?','We work with Xero, QuickBooks, Sage and FreeAgent, and can set one up for you if you have none.'),
  ('My books are months behind. Is that a problem?','No. We quote a one-off fee to bring them up to date and then move you onto a monthly fee.'),
  ('Should I register for VAT voluntarily?','It depends on your customers and costs. We will work through the numbers with you before you decide.')])

svc('payroll','Payroll and pensions',
 'Payroll Services and Auto-Enrolment | From £10 a month | NextGen Chartered Accountant',
 'Weekly and monthly payroll with RTI filing, payslips, auto-enrolment pensions and CIS returns. Director-only payroll from £10 a month.',
 'Payslips, HMRC submissions and pension uploads done for you each pay period, from one director to a full team.',
 ['Weekly and monthly payroll with RTI filing','Director-only payroll','Payslips, P45, P60 and P11D','Auto-enrolment pension setup and uploads','CIS returns and subcontractor statements','PAYE registration with HMRC'],
 [('Director-only payroll','£10 per month'),('Staff payroll, up to 5 employees','£25 per month'),('Extra employee','£4 per payslip'),('Auto-enrolment pension setup','£49'),('P11D, per employee','£35'),('CIS monthly return','£25 per month')],
 ['You send us hours, starters, leavers and changes before each pay date.','We run the payroll, send payslips and tell you what to pay staff and HMRC.','We file the RTI submission and upload pension contributions.'],
 ['A Full Payment Submission must reach HMRC on or before each pay day.','PAYE and National Insurance are usually due to HMRC by the 22nd of the following month if paid electronically.','P60s must be given to employees by 31 May and P11Ds filed by 6 July.'],
 [('I am the only director. Do I need payroll?','If you pay yourself a salary, yes. We can advise on the salary and dividend mix as part of setting it up.'),
  ('Can you take over payroll part way through the year?','Yes. We take the year-to-date figures from your current provider and carry on from the next pay run.'),
  ('Do you deal with pensions?','Yes. We set up auto-enrolment, assess staff and upload contributions each pay period.')])

svc('outsourcing-for-accountancy-firms','Outsourcing for accountancy firms',
 'Outsourcing for Accountancy Firms | White-Label Accounts and Bookkeeping | NextGen',
 'White-label bookkeeping, year-end accounts, payroll and management accounts for UK accountancy practices, from an ICAEW member firm. Bookkeeping from £12 an hour.',
 'Extra capacity for your practice in busy season: UK-qualified work delivered under your name, reviewed by a Chartered Accountant.',
 ['Bookkeeping on your clients\' software','Year-end accounts preparation with working papers','White-label payroll bureau','Management accounts packs','Self Assessment and corporation tax return preparation','One trial job so you can judge the quality first'],
 [('Bookkeeping','£12 per hour'),('Year-end accounts preparation','£90 per job'),('Payroll bureau, white label','£3 per payslip'),('Management accounts pack','£80 per pack')],
 ['We agree scope, turnaround and how files are shared, under a confidentiality agreement.','You send the job; we prepare it on your software and templates.','You review and sign off. Your client deals only with you.'],
 ['Self Assessment peak: November to 31 January.','Company year ends cluster around 31 March and 31 December, with filing 9 months later.','We agree turnaround times with you before peak season starts.'],
 [('Will you contact our clients?','No. We work in the background and all client contact stays with your firm.'),
  ('Who does the work?','Work is prepared and reviewed under Sheryar Ahmed ACA FCCA, a member of both ICAEW and ACCA.'),
  ('Can we start small?','Yes. You can start with one trial job and then agree a regular arrangement if it works for you.')])


svc('landlord-tax-return','Landlord tax returns',
 'Landlord Tax Return Accountant | From £129 | NextGen Chartered Accountant',
 'Rental income tax returns for UK landlords prepared by a Chartered Accountant. Fixed fees from £129, including allowable expenses, mortgage interest relief and Making Tax Digital.',
 'Your rental income, expenses and tax worked out and filed with HMRC, whether you have one property or a portfolio.',
 ['Rental income and allowable expenses for each property','Mortgage interest relief worked out correctly','Jointly owned property and income splits','Capital gains tax when you sell, including the 60-day return','Making Tax Digital quarterly updates','Advice on holding property personally or through a company'],
 [('Landlord tax return','£129'),('Capital gains tax return','£149'),('MTD for Income Tax quarterly update','£30 per quarter'),('Non-resident landlord tax return','£149'),('Tax planning session','£75')],
 ['Send us your rent statements, mortgage interest figures and expense records.','We prepare the rental accounts and tax return and explain the tax due.','You approve it and we file it with HMRC.'],
 ['Rental profits are reported through Self Assessment, due by 31 January after the tax year ends.','Gains on UK residential property must usually be reported and paid within 60 days of completion.','Making Tax Digital for Income Tax applies from April 2026 to landlords with qualifying income over £50,000.','Finance costs on residential lets are given as a basic rate tax credit, not deducted from rental income.'],
 [('I have not declared rental income from earlier years. What should I do?','Tell us the years involved. We can prepare the figures and make a disclosure to HMRC so that the position is put right.'),
  ('Should I move my properties into a limited company?','It depends on your income, borrowing and plans. We work through the tax and costs of both routes before you decide.'),
  ('I live abroad and let a UK property. Can you help?','Yes. See our page on UK tax for non-residents, or ask us about the Non-resident Landlord Scheme.')])

svc('company-formation','Company formation',
 'Company Formation and Registration | From £49 | NextGen Chartered Accountant',
 'UK limited company formation by a Chartered Accountant, with HMRC registrations for corporation tax, PAYE and VAT. Fixed fees from £49, and from £99 for non-residents.',
 'A limited company set up properly from day one, with the share structure, HMRC registrations and first-year deadlines explained.',
 ['Company incorporation at Companies House','Advice on share structure and directors','Registration for corporation tax, PAYE and VAT','Sole trader to limited company switch','Director and shareholder changes','UK company formation for non-residents'],
 [('Company formation','£49'),('Sole trader to limited company switch','£99'),('HMRC registration (SA, PAYE or CIS)','£25'),('VAT registration','£39'),('Director or shareholder change','£29'),('UK company formation for non-residents','£99')],
 ['Tell us the company name, directors, shareholders and what the business does.','We prepare and submit the application and send you the incorporation documents.','We register the company with HMRC and give you a list of first-year deadlines.'],
 ['Directors and people with significant control must verify their identity with Companies House.','A new company must register for corporation tax within 3 months of starting to trade.','The first accounts are due 21 months after incorporation.','A confirmation statement is due at least once every 12 months.'],
 [('Should I be a sole trader or a limited company?','It depends on your profit, risk and plans. We compare the tax and running costs of both for your figures.'),
  ('Can you be my accountant after the company is formed?','Yes. Year-end accounts and the corporation tax return start from £349, and director payroll from £10 a month.'),
  ('I live outside the UK. Can I own a UK company?','Yes. We form UK companies for non-residents and explain the UK tax position.')],
 dates_title='Rules worth knowing')

svc('management-accounts','Management accounts and virtual Finance Director',
 'Management Accounts and Virtual FD | From £99 a month | NextGen Chartered Accountant',
 'Monthly management accounts, KPIs, cash flow forecasts, budgets and part-time Finance Director support from a Chartered Accountant. Fixed fees from £99 a month.',
 'Monthly figures you can act on: profit, cash and the numbers that drive them, explained by a Chartered Accountant.',
 ['Monthly profit and loss, balance sheet and cash position','KPIs chosen for your business','Cash flow forecasts and budgets','Business plans for loans and investors','Pricing, margin and cost reviews','Part-time Finance Director support'],
 [('Management accounts','£99 per month'),('Cash flow forecast or budget','£149'),('Business plan for a loan','£249'),('Virtual Finance Director','£249 per month')],
 ['We agree what you want to see each month and which KPIs matter.','We close the month from your bookkeeping and prepare the pack.','We send the pack with a short commentary and talk it through with you.'],
 ['You are making decisions on pricing, hiring or borrowing and need current figures.','A lender or investor has asked for monthly reporting or a forecast.','The business has grown and year-end accounts arrive too late to be useful.','You want a finance lead without the cost of a full-time Finance Director.'],
 [('Do you need to do my bookkeeping as well?','No. We can work from your own bookkeeping or your bookkeeper\'s, as long as the records are up to date.'),
  ('How soon after month end do I get the pack?','We agree a date with you at the start, based on how quickly the bookkeeping can be closed.'),
  ('Can you attend our management meetings?','Yes. Virtual Finance Director support includes a regular meeting by video or phone.')],
 dates_title='When it helps')

svc('non-resident-uk-tax','UK tax for non-residents',
 'UK Tax for Non-Residents and Overseas Landlords | NextGen Chartered Accountant',
 'UK tax returns for non-resident landlords, UK company formation for overseas owners, residence and double tax reviews. Fixed fees from £99, handled fully online.',
 'UK tax handled for clients who live abroad: rental income, UK companies, residence status and double tax relief.',
 ['Non-resident landlord tax returns','Non-resident Landlord Scheme applications','UK company formation for overseas owners','Residence status and double tax treaty reviews','Capital gains on UK property for non-residents','UK VAT registration for overseas sellers'],
 [('Non-resident landlord tax return','£149'),('UK company formation for non-residents','£99'),('Residence and double tax review','£149'),('UK VAT registration for overseas sellers','£99')],
 ['We hold a video or phone call at a time that suits your time zone.','You send documents by email or a shared folder.','We prepare and file with HMRC and Companies House and confirm what is due.'],
 ['UK rental income is taxable in the UK even if you live abroad.','Under the Non-resident Landlord Scheme, agents or tenants deduct basic rate tax from rent unless HMRC approves gross payment.','Non-residents must report disposals of UK property to HMRC within 60 days of completion.','Residence for UK tax is decided by the Statutory Residence Test.'],
 [('Do I need to come to the UK?','No. Everything is done online, and we can meet by video call.'),
  ('I pay tax on the same income in another country. Can I get relief?','Often yes, under a double tax treaty. We review your position and claim the relief available.'),
  ('Can you act as my UK accountant on an ongoing basis?','Yes. We act for individuals and companies based outside the UK.')],
 dates_title='Rules worth knowing')

exec(open(R+'src/more.py').read())
exec(open(R+'src/insights.py').read())

page('accountants-in-luton','Chartered Accountants in Luton, Bedfordshire | NextGen Chartered Accountant',
 'NextGen Chartered Accountant is an ICAEW member firm based in Luton. Fixed-fee accounts, tax returns, payroll, VAT and bookkeeping for businesses and individuals in Luton, Dunstable and across Bedfordshire.',
 """<p class="crumb"><a href="/">Home</a> / Accountants in Luton</p>
<p class="eyebrow" style="margin-top:22px">Luton and Bedfordshire</p>
<h1>Chartered Accountants in Luton</h1>
<p class="lead">NextGen Chartered Accountant is an ICAEW member firm based in Luton, working with sole traders, landlords, contractors and limited companies across Luton, Dunstable and Bedfordshire.</p>
<h2>What we do for Luton businesses</h2>
<ul><li><a href="/self-assessment-tax-return">Self Assessment tax returns</a>, from £99</li>
<li><a href="/limited-company-accounts">Limited company accounts and corporation tax</a>, from £349</li>
<li><a href="/bookkeeping-and-vat">Bookkeeping and VAT returns</a>, from £49 a month</li>
<li><a href="/payroll">Payroll and pensions</a>, from £10 a month</li>
<li><a href="/landlord-tax-return">Landlord tax returns</a>, from £129</li>
<li><a href="/company-formation">Company formation</a>, from £49</li>
<li><a href="/management-accounts">Management accounts and virtual Finance Director</a>, from £99 a month</li>
<li><a href="/non-resident-uk-tax">UK tax for non-residents</a></li>
<li><a href="/outsourcing-for-accountancy-firms">Outsourcing for accountancy firms</a></li></ul>
<h2>Why choose a Chartered Accountant</h2>
<ul><li>The firm is led by Sheryar Ahmed ACA FCCA, a member of both ICAEW and ACCA.</li>
<li>Fees are fixed and agreed before any work starts.</li>
<li>We work on Xero, QuickBooks, Sage and FreeAgent.</li>
<li>You deal with a qualified accountant, by phone, video call, email or WhatsApp.</li></ul>
<h2>How we work with local clients</h2>
<p>We are based in Luton and work with clients by phone, video call and secure document sharing, so you do not need to travel to an office. Open Monday to Saturday, 9am to 7pm.</p>
<h2>Areas we cover</h2>
<p>Luton, Dunstable, Houghton Regis, Leighton Buzzard, Harpenden, Hitchin, Bedford and the rest of Bedfordshire and Hertfordshire. We also act for clients anywhere in the UK and abroad.</p>
"""+CTA,
 [{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://nextgenca.co.uk/"},{"@type":"ListItem","position":2,"name":"Accountants in Luton","item":"https://nextgenca.co.uk/accountants-in-luton"}]}])

page('privacy','Privacy Notice | NextGen Chartered Accountant','How NextGen Chartered Accountant collects, uses and protects personal information.','''
<p class="eyebrow">Firm</p>
<h1>Privacy notice</h1>
<p class="note">Last updated: 17 November 2026</p>
<p>This notice explains how NextGen Chartered Accountant uses personal information. NextGen Chartered Accountant is the trading name of Sheryar Ahmed ACA FCCA, a sole practitioner based in Luton, England, who is the data controller.</p>
<p>Contact: <a href="mailto:info@nextgenca.co.uk">info@nextgenca.co.uk</a> or +44 7591 246395.</p>
<h2>Information we collect</h2>
<ul><li><b>Enquiries:</b> your name, email address, phone number and anything you tell us in the contact form, in the live chat, by email, by phone or on WhatsApp.</li>
<li><b>Clients:</b> identity and contact details, identity verification documents, tax references, financial records, payroll information about your employees, and correspondence with HMRC and Companies House.</li>
<li><b>Website:</b> our hosting provider records technical information such as IP address and browser type to keep the site secure. This website does not use advertising cookies. The live chat stores a cookie so that your conversation continues as you move between pages.</li></ul>
<h2>Why we use it and our lawful basis</h2>
<ul><li>To reply to your enquiry and give you a quote (legitimate interests, or steps before entering a contract).</li>
<li>To provide accountancy, tax, payroll and related services (performance of a contract).</li>
<li>To meet our legal and professional duties, including anti-money laundering checks, tax law and ICAEW requirements (legal obligation).</li>
<li>To run and protect our practice, including record keeping and insurance (legitimate interests).</li></ul>
<h2>Who we share it with</h2>
<ul><li>HMRC, Companies House and other authorities, where needed to act for you or where the law requires it.</li>
<li>Service providers who process information for us: FormSubmit (delivers contact form messages), tawk.to (live chat on this website), Google Workspace (email and documents), Cloudflare (website hosting), WhatsApp (if you choose to message us there), and the accounting and payroll software used for your work.</li>
<li>Our professional body, regulators and insurers, where required.</li></ul>
<p>We do not sell personal information. Some providers store information outside the UK; where they do, we rely on the safeguards permitted under UK data protection law.</p>
<h2>How long we keep it</h2>
<ul><li>Enquiries that do not become clients: up to 12 months.</li>
<li>Client records: at least 6 years after the end of the engagement, to meet tax and professional requirements.</li>
<li>Anti-money laundering records: 5 years after the business relationship ends.</li></ul>
<h2>Your rights</h2>
<p>You can ask us for a copy of your information, to correct it, to delete it, to restrict or object to how we use it, or to transfer it to another provider. Some rights do not apply where we must keep records by law. To use your rights, email <a href="mailto:info@nextgenca.co.uk">info@nextgenca.co.uk</a>.</p>
<p>If you are unhappy with how we have handled your information, please tell us first. You also have the right to complain to the Information Commissioner's Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.</p>
<h2>Changes</h2>
<p>We will update this page if how we use personal information changes.</p>''')

page('complaints','Complaints Procedure | NextGen Chartered Accountant','How to raise a concern about the service you have received from NextGen Chartered Accountant.','''
<p class="eyebrow">Firm</p>
<h1>Complaints procedure</h1>
<p>We want every client to be satisfied with our work. If something has gone wrong, please tell us so that we can put it right.</p>
<h2>How to raise a concern</h2>
<ul><li>Email <a href="mailto:info@nextgenca.co.uk">info@nextgenca.co.uk</a> with the subject "Complaint", or call +44 7591 246395.</li>
<li>Tell us what happened, when, and what you would like us to do.</li></ul>
<h2>What we will do</h2>
<ul><li>Acknowledge your complaint within 5 working days.</li>
<li>Sheryar Ahmed ACA FCCA will look into it and may contact you for more detail.</li>
<li>Send you a written response, normally within 4 weeks, explaining what we found and what we will do.</li></ul>
<h2>If you are still not satisfied</h2>
<p>NextGen Chartered Accountant is an ICAEW member firm (firm number C011010236). If we have not resolved your complaint, you can raise it with the Institute of Chartered Accountants in England and Wales. Details are at <a href="https://www.icaew.com/complaints">icaew.com/complaints</a>.</p>''')

page('404','Page not found | NextGen Chartered Accountant','Page not found.','''
<p class="eyebrow">Not found</p>
<h1>We could not find that page</h1>
<p class="lead">The link may be old or mistyped.</p>
<p style="margin-top:26px"><a class="btn btn-navy" href="/">Go to the home page</a></p>''',noindex=True)

def relblock(slug):
    rs=[r for r in REL.get(slug,[]) if r in NAMES and r!=slug]
    if not rs: return ''
    return '<h2>Related services</h2><ul>'+''.join(f'<li><a href="/{r}">{NAMES[r]}</a></li>' for r in rs)+'</ul>'
for k,h in PAGES.items():
    h=re.sub(r'@@REL:([a-z0-9-]+)@@',lambda m:relblock(m.group(1)),h)
    h=re.sub(r'<li>([a-z])',lambda m:'<li>'+m.group(1).upper(),h)
    open(R+k+'.html','w').write(h)

# index.html updates
s=idx
if '<a href="/insights">Insights</a>' not in s:
    s=s.replace('      <a href="#questions">Questions</a>','      <a href="/insights">Insights</a>\n      <a href="#questions">Questions</a>',1)
latest=''.join(f'<article class="post"><p class="post-meta">{html.escape(p.get("label",nice(p["date"])))}</p><p class="post-by">By Sheryar Ahmed ACA FCCA</p><h3><a href="/insights/{p["slug"]}">{html.escape(p["title"])}</a></h3><p>{html.escape(p["summary"])}</p></article>' for p in POSTS[:4])
INS=f'''<!--insights-->
<section id="insights">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">Insights</p>
      <h2>New rules, explained</h2>
      <p class="lead">Every week Sheryar Ahmed ACA FCCA reviews the latest HMRC and Companies House changes and explains what they mean for you.</p>
    </div>
    <div class="ins-grid">
      <div><h3 style="margin:0 0 6px">Latest articles</h3>{latest}<p style="margin-top:16px"><a class="btn btn-navy" href="/insights">All articles</a></p></div>
      <div><h3 style="margin:0 0 6px">Latest from HMRC and Companies House</h3><div id="govuk-updates" class="updates" data-max="4"><p class="note">Loading the latest updates…</p></div><p class="note">Live from GOV.UK.</p></div>
    </div>
  </div>
</section>
<script src="/updates.js" defer></script>
<!--/insights-->
'''
s=re.sub(r'<!--insights-->.*?<!--/insights-->\n','',s,flags=re.S)
s=s.replace('<div class="wrap showcase">',INS+'<div class="wrap showcase">',1)
s=re.sub(r'<!--latest-->.*?<!--/latest-->\n','',s,flags=re.S)
if POSTS:
    lp=POSTS[0]
    if '<div class="hero-side">' not in s:
        s=s.replace('   <aside class="cal"','   <div class="hero-side">\n   <aside class="cal"',1).replace('   </aside>','   </aside>\n   </div>',1)
    s=s.replace('   <div class="hero-side">\n',f'   <div class="hero-side">\n    <!--latest-->\n    <a class="hero-latest" href="/insights/{lp["slug"]}"><span>Latest from Sheryar Ahmed ACA FCCA</span><b>{html.escape(lp["title"])}</b><i>Read the article →</i></a>\n    <!--/latest-->\n',1)
old_foot=re.search(r'<footer>.*?</footer>',s,re.S).group(0)
new_foot=re.search(r'<footer>.*?</footer>',FOOT,re.S).group(0).replace('href="/#','href="#')
s=s.replace(old_foot,new_foot)

LINKS=[('Year-end accounts for limited companies','/limited-company-accounts'),('Self Assessment tax returns','/self-assessment-tax-return'),('Corporation tax returns (CT600)','/limited-company-accounts'),('Landlord and rental income tax','/landlord-tax-return'),('Weekly and monthly payroll with RTI filing','/payroll'),('Monthly bookkeeping and bank reconciliation','/bookkeeping-and-vat'),('VAT registration, scheme choice and returns','/bookkeeping-and-vat'),('Monthly management accounts and KPIs','/management-accounts'),('Company formation and share structure','/company-formation')]
for t,u in LINKS+EXTRA_LINKS:
    s=s.replace('<li>'+t+'</li>','<li><a href="'+u+'">'+t+'</a></li>')
if '"@type":"WebSite"' not in s:
    s=s.replace('<script type="application/ld+json">','<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"NextGen Chartered Accountant","alternateName":["NextGen CA","NextGen Chartered Accountants"],"url":"https://nextgenca.co.uk/"}</script>\n<script type="application/ld+json">',1)
if 'apple-touch-icon' not in s:
    s=s.replace('<link rel="icon" href="img/mark.jpg">','<link rel="icon" href="img/mark.jpg">\n<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">')
btn='<button class="btn btn-gold" type="submit">Request my free call</button>'
if 'privacy notice</a>' not in s.split('</form>')[0]:
    s=s.replace(btn,btn+'\n      <p style="margin-top:12px;font-size:.82rem;opacity:.8">We use your details only to reply to your enquiry. See our <a href="/privacy">privacy notice</a>.</p>')
if '/chat.js?v=5' not in s:
    s=s.replace('</body>','<script src="/chat.js?v=5" defer></script>\n</body>')
exec(open(R+'src/extras.py').read())
open(R+'index.html','w').write(s)
slugs=['','self-assessment-tax-return','limited-company-accounts','bookkeeping-and-vat','payroll','landlord-tax-return','company-formation','management-accounts','non-resident-uk-tax','outsourcing-for-accountancy-firms','accountants-in-luton','privacy','complaints','fees']+NEW_SLUGS+POST_SLUGS
open(R+'sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>https://nextgenca.co.uk/{x}</loc><lastmod>'+str(datetime.date.today())+'</lastmod></url>\n' for x in slugs)+'</urlset>\n')
print('built')
