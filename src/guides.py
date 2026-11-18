# Evergreen guides and London content page. Executed inside build.py (uses page, faq, CTA).
GUIDE_SLUGS=[]
def guide(slug,h1,title,desc,body,qs,crumb='Guides'):
    GUIDE_SLUGS.append(slug)
    b=f'''<p class="crumb"><a href="/">Home</a> / {crumb}</p>
<p class="eyebrow" style="margin-top:22px">{crumb}</p>
<h1>{h1}</h1>
{body}
<h2>Questions</h2>{faq(qs)}
<p class="note">Written by Sheryar Ahmed ACA FCCA. Rates and rules are those in force for the 2026 to 2027 tax year and can change. This guide is general information, not advice for your circumstances.</p>
{CTA}'''
    ld=[{"@context":"https://schema.org","@type":"Article","headline":h1,"description":desc,"url":"https://nextgenca.co.uk/"+slug,"author":{"@type":"Person","name":"Sheryar Ahmed","honorificSuffix":"ACA FCCA"},"publisher":{"@type":"Organization","name":"NextGen Chartered Accountant","url":"https://nextgenca.co.uk/"},"dateModified":str(datetime.date.today())},
        {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://nextgenca.co.uk/"},{"@type":"ListItem","position":2,"name":h1,"item":"https://nextgenca.co.uk/"+slug}]},
        {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in qs]}]
    page(slug,title,desc,b,ld,ogtype='article')

guide('limited-company-expenses-guide','What expenses can a limited company claim?',
 'Limited Company Expenses You Can Claim | UK Guide | NextGen CA',
 'A plain-English guide to the expenses a UK limited company can claim against corporation tax in 2026 to 2027: salary, pension, mileage, home office, equipment, travel and what HMRC does not allow.',
 '''<p class="lead">A limited company can deduct costs that are incurred wholly and exclusively for the business. Each allowable pound reduces the profit that corporation tax is charged on, at 19% for profits up to £50,000 and 25% for profits over £250,000, with marginal relief in between.</p>
<h2>The test HMRC applies</h2>
<p>An expense is allowable when it is paid for the purposes of the trade and nothing else. If a cost has a private element that cannot be separated, it normally fails the test. Where the company pays for something a director uses personally, it may still be deductible for the company but taxed on the director as a benefit in kind.</p>
<h2>Common allowable expenses</h2>
<table class="ft">
<tr><td>Director and staff salaries, employer National Insurance</td><td>Allowable</td></tr>
<tr><td>Employer pension contributions</td><td>Allowable</td></tr>
<tr><td>Accountancy, legal and professional fees for the business</td><td>Allowable</td></tr>
<tr><td>Software, subscriptions, website and hosting</td><td>Allowable</td></tr>
<tr><td>Business insurance</td><td>Allowable</td></tr>
<tr><td>Business travel, hotels and meals while travelling for work</td><td>Allowable</td></tr>
<tr><td>Training that updates skills used in the business</td><td>Allowable</td></tr>
<tr><td>Phone contract in the company name</td><td>Allowable</td></tr>
<tr><td>Client entertaining</td><td>Not allowable</td></tr>
<tr><td>Fines and penalties</td><td>Not allowable</td></tr>
</table>
<h2>Mileage in your own car</h2>
<p>If you use your own car for business journeys, the company can pay you the approved mileage rate tax free: 55p a mile for the first 10,000 business miles in the tax year and 25p a mile after that, from 6 April 2026. Commuting between home and a permanent workplace does not count as business travel.</p>
<h2>Working from home</h2>
<p>The company can pay a director or employee who works from home up to £6 a week without tax or National Insurance and without receipts. From 6 April 2026 employees can no longer claim this relief from HMRC themselves, so it only works if the company pays it. Larger claims need evidence of the extra household costs.</p>
<h2>Equipment and capital allowances</h2>
<p>Computers, tools, machinery and office furniture are capital costs. Most small companies get full relief in the year of purchase through the Annual Investment Allowance, which covers up to £1 million of qualifying spending a year. Cars follow separate rules based on CO2 emissions.</p>
<h2>Small tax-free benefits</h2>
<ul><li>Trivial benefits: gifts costing £50 or less that are not cash and not a reward for work. Directors of close companies have an annual cap of £300.</li>
<li>Annual staff event: up to £150 a head, including VAT, for an event open to all staff.</li>
<li>One mobile phone per employee on a company contract.</li></ul>
<h2>Records to keep</h2>
<p>Keep invoices and receipts for six years from the end of the accounting period. A photo or digital copy is fine. If you cannot show what a cost was for, HMRC can disallow it.</p>
<p>We check expenses as part of our <a href="/limited-company-accounts">limited company accounts</a> and <a href="/corporation-tax-returns">corporation tax return</a> service, and plan salary, dividends and pension together in a <a href="/business-tax-planning">tax planning session</a>.</p>''',
 [('Can my company pay for my lunch?','Not normally. Everyday lunches are a private cost. Meals are allowable when you are travelling for business away from your normal workplace.'),
  ('Can I claim clothing?','Only protective clothing or a uniform that carries the business identity. Ordinary clothes, including suits, are not allowable.'),
  ('Is client entertaining ever deductible?','No for corporation tax. The company can still pay for it, but the cost is added back when the tax is calculated.'),
  ('Do I need receipts for everything?','You need a record of every business cost. Without one, HMRC can refuse the deduction if it checks the return.')])

guide('tax-deadlines-for-company-directors','Tax and filing deadlines for limited company directors',
 'Tax Deadlines for Company Directors UK | Filing Calendar | NextGen',
 'Every deadline a UK limited company director needs to know: Companies House accounts, corporation tax, CT600, confirmation statement, VAT, payroll and Self Assessment, with the penalties for missing them.',
 '''<p class="lead">A director of a UK limited company is responsible for two sets of deadlines: the company's own filings with Companies House and HMRC, and their personal Self Assessment. Most company deadlines run from the accounting year end, not the calendar year.</p>
<h2>Company deadlines, counted from the year end</h2>
<table class="ft">
<tr><td>File annual accounts at Companies House</td><td>9 months after year end</td></tr>
<tr><td>Pay corporation tax</td><td>9 months and 1 day after year end</td></tr>
<tr><td>File the CT600 company tax return</td><td>12 months after year end</td></tr>
<tr><td>Confirmation statement</td><td>Within 14 days after the end of the review period, at least once every 12 months</td></tr>
</table>
<p>A new company's first accounts are due 21 months after the date of incorporation. Example: a company with a 31 March 2026 year end files accounts by 31 December 2026, pays corporation tax by 1 January 2027 and files its CT600 by 31 March 2027.</p>
<h2>Deadlines that fall on fixed dates</h2>
<table class="ft">
<tr><td>PAYE and National Insurance payment to HMRC</td><td>22nd of each month</td></tr>
<tr><td>Full Payment Submission (payroll report)</td><td>On or before each payday</td></tr>
<tr><td>VAT return and payment</td><td>1 month and 7 days after the VAT period</td></tr>
<tr><td>P60s to employees</td><td>31 May</td></tr>
<tr><td>P11D benefits forms</td><td>6 July</td></tr>
<tr><td>Class 1A National Insurance on benefits</td><td>22 July</td></tr>
<tr><td>Register for Self Assessment</td><td>5 October</td></tr>
<tr><td>Self Assessment return and tax payment</td><td>31 January</td></tr>
<tr><td>Second payment on account</td><td>31 July</td></tr>
</table>
<h2>Penalties for filing late</h2>
<ul><li>Companies House accounts: £150 if up to 1 month late, £375 for 1 to 3 months, £750 for 3 to 6 months and £1,500 for more than 6 months. The penalty doubles if accounts were late the year before as well.</li>
<li>CT600, for returns with a filing date on or after 1 April 2026: £200 if the return is late and £400 if it is more than 3 months late. If the returns for the two previous periods were also late, these rise to £1,000 and £2,000. HMRC adds tax-based penalties of 10% of the unpaid tax when the return is 6 months late and a further 10% at 12 months. Returns with a filing date before 1 April 2026 carry the old £100 and £200 penalties.</li>
<li>Self Assessment: £100 if one day late, then daily and tax-based penalties after 3, 6 and 12 months.</li>
<li>Late tax also carries interest from the due date.</li></ul>
<h2>Why directors need a personal tax return</h2>
<p>Dividends are not taxed through payroll. A director who takes dividends above the dividend allowance reports them on a Self Assessment return and pays the tax by 31 January.</p>
<p>We keep these dates for clients as part of our <a href="/limited-company-accounts">limited company accounts</a>, <a href="/payroll">payroll</a>, <a href="/vat-registration-and-returns">VAT</a> and <a href="/self-assessment-tax-return">Self Assessment</a> services. If something is already overdue, see <a href="/hmrc-letters-and-penalties">help with HMRC letters and penalties</a>.</p>''',
 [('Are Companies House and HMRC deadlines the same?','No. Accounts go to Companies House within 9 months of the year end. The CT600 goes to HMRC within 12 months, but the corporation tax itself is due at 9 months and 1 day.'),
  ('Does a dormant company still have to file?','Yes. A dormant company files dormant accounts and a confirmation statement each year, and tells HMRC it is dormant.'),
  ('Can I change my company year end?','Yes, you can shorten it as often as you like and lengthen it once in five years in most cases, as long as the accounts are not already overdue.'),
  ('What happens if I miss the confirmation statement?','Companies House can start to strike the company off the register, and the directors can be prosecuted.')])

guide('accountant-or-bookkeeper','Accountant or bookkeeper: which does your business need?',
 'Accountant vs Bookkeeper: Which Do You Need? | NextGen CA',
 'The difference between a bookkeeper and an accountant in the UK, what each one does, when a small business needs a Chartered Accountant, and how to check an accountant is qualified and regulated.',
 '''<p class="lead">A bookkeeper records the day-to-day transactions of a business. An accountant turns those records into year-end accounts and tax returns, and advises on tax and structure. Many small businesses need both jobs done, but not always by two people.</p>
<h2>What each one does</h2>
<table class="ft">
<tr><td>Recording sales, purchases and receipts</td><td>Bookkeeper</td></tr>
<tr><td>Bank reconciliation</td><td>Bookkeeper</td></tr>
<tr><td>Preparing VAT returns</td><td>Either</td></tr>
<tr><td>Running payroll</td><td>Either</td></tr>
<tr><td>Year-end statutory accounts</td><td>Accountant</td></tr>
<tr><td>Corporation tax return (CT600)</td><td>Accountant</td></tr>
<tr><td>Self Assessment with business or rental income</td><td>Accountant</td></tr>
<tr><td>Tax planning, salary and dividends</td><td>Accountant</td></tr>
<tr><td>Dealing with HMRC enquiries</td><td>Accountant</td></tr>
</table>
<h2>When you need an accountant</h2>
<ul><li>You run a limited company. It must file statutory accounts and a CT600 each year.</li>
<li>Your turnover is close to the £90,000 VAT registration threshold.</li>
<li>You are deciding between sole trader and limited company.</li>
<li>You have income from more than one source, such as a job, a business and property.</li>
<li>You have had a letter, penalty or enquiry from HMRC.</li>
<li>You need accounts or a reference for a mortgage, visa or lender.</li></ul>
<h2>What "Chartered" means</h2>
<p>Anyone in the UK can call themselves an accountant. A Chartered Accountant has passed professional exams, completed supervised training and is a member of a body such as ICAEW or ACCA. A firm in practice must hold a practising certificate, carry professional indemnity insurance and be supervised for anti-money laundering.</p>
<h2>How to check an accountant</h2>
<ul><li>Search the ICAEW "Find a Chartered Accountant" directory or the ACCA member directory for the person or firm.</li>
<li>Ask which body supervises the firm for anti-money laundering.</li>
<li>Ask for the fee in writing before work starts, and what it covers.</li></ul>
<p>NextGen Chartered Accountant is an ICAEW member firm, firm number C011010236. We offer <a href="/bookkeeping-and-vat">bookkeeping</a> and year-end work together, so one team keeps the records and files the returns. See <a href="/about">who we are</a> and our <a href="/fees">fixed fees</a>.</p>''',
 [('Can a bookkeeper file my company accounts?','A bookkeeper can prepare the records, but statutory accounts and the corporation tax return are normally prepared by an accountant, who takes responsibility for the tax treatment.'),
  ('Do I need an accountant as a sole trader?','It is not a legal requirement. Many sole traders use one for the tax return, to claim the right expenses and to prepare for Making Tax Digital.'),
  ('Is an online accountant as good as a local one?','The qualifications and regulation are the same. What matters is who prepares and reviews your work and how quickly they reply.'),
  ('How much does an accountant cost?','It depends on the work. Our fees are fixed and published, for example limited company accounts and CT600 from £349 and Self Assessment from £99. NextGen is not VAT registered, so no VAT is added to our fees.')])

guide('online-accountants-for-london-businesses','Online accountants for London businesses',
 'Online Accountants for London Businesses | Fixed Fees | NextGen',
 'ICAEW Chartered Accountants working online with London limited companies, contractors, landlords and sole traders. Fixed fees, 1-hour replies. Based in Luton, no London office.',
 '''<p class="lead">NextGen Chartered Accountant works with London businesses entirely online: limited companies, contractors, landlords and the self-employed. We are an ICAEW member firm based in Luton, around 30 miles north of central London. We do not have a London office, and we price without central London overheads.</p>
<h2>How working with us from London works</h2>
<ul><li>A free 15-minute call by phone or video to understand what you need.</li>
<li>A fixed fee in writing before any work starts.</li>
<li>Documents shared by email, WhatsApp or a secure folder. Nothing needs to be posted or dropped off.</li>
<li>Replies within 1 hour, Monday to Saturday, 9am to 7pm.</li></ul>
<h2>What London clients use us for</h2>
<ul><li><a href="/limited-company-accounts">Limited company accounts and CT600</a> for consultancies, agencies, e-commerce and hospitality businesses.</li>
<li><a href="/contractor-and-self-employed-accounting">Contractor and freelancer accounting</a>, including salary and dividend planning.</li>
<li><a href="/landlord-tax-return">Landlord tax returns</a> and <a href="/capital-gains-tax">capital gains on property</a>.</li>
<li><a href="/vat-registration-and-returns">VAT registration and returns</a> and <a href="/payroll">payroll</a>.</li>
<li><a href="/non-resident-uk-tax">UK tax for non-residents</a> and overseas owners of London companies and property.</li></ul>
<h2>Fees</h2>
<table class="ft">
<tr><td>Limited company accounts and CT600</td><td>from £349</td></tr>
<tr><td>Self Assessment tax return</td><td>from £99</td></tr>
<tr><td>VAT return</td><td>from £90 a quarter</td></tr>
<tr><td>Monthly bookkeeping</td><td>from £49 a month</td></tr>
<tr><td>Director-only payroll</td><td>£10 a month</td></tr>
<tr><td>Staff payroll, up to 5 employees</td><td>£25 a month</td></tr>
</table>
<p class="note">Prices are starting fees. NextGen is not VAT registered, so no VAT is added to our fees. See the <a href="/fees">full price list</a>.</p>
<h2>Is an accountant outside London right for you?</h2>
<p>Company accounts, tax returns, VAT and payroll are filed online with HMRC and Companies House, so where your accountant sits makes no difference to the filing. If you want regular face-to-face meetings at an office in London, a local firm will suit you better. If you want qualified work, a named contact and a fixed fee, working online does the same job.</p>''',
 [('Do you have an office in London?','No. We are based in Luton and work with London clients by video call, phone, email and WhatsApp.'),
  ('Can you be the registered office for my London company?','We do not provide a London registered office address. We can help you keep your Companies House details up to date.'),
  ('Can we meet in person?','Meetings are by video or phone. If you need to meet face to face, tell us and we will see what can be arranged in Luton.'),
  ('Do London clients pay more?','No. Fees are the same wherever you are in the UK.')],
 crumb='London')

EXTRA_LINKS+= [
 ('Limited company expenses guide','/limited-company-expenses-guide'),
 ('Tax deadlines for company directors','/tax-deadlines-for-company-directors'),
 ('Accountant or bookkeeper?','/accountant-or-bookkeeper'),
 ('Online accountants for London businesses','/online-accountants-for-london-businesses'),
]

CALC_CSS='<style>.calc{background:var(--mist);padding:22px;border-left:3px solid var(--gold);margin:10px 0 18px}.calc label{display:block;font-weight:700;margin:0 0 6px}.calc input{width:100%;max-width:260px;padding:11px 12px;border:1px solid var(--rule);font:inherit;margin:0 0 14px}.calc output{display:block}.calc table{margin-top:6px}</style>'

guide('corporation-tax-calculator','Corporation tax calculator (2026 to 2027)',
 'Corporation Tax Calculator UK 2026/27 | Marginal Relief | NextGen',
 'Free UK corporation tax calculator for the financial year starting 1 April 2026. Works out the 19% small profits rate, 25% main rate and marginal relief, including associated companies.',
 CALC_CSS+'''<p class="lead">Enter your company's taxable profit for a 12-month accounting period to see the corporation tax due. The calculator applies the 19% small profits rate, the 25% main rate and marginal relief for profits between £50,000 and £250,000.</p>
<div class="calc">
<label for="ctp">Taxable profit for the year (£)</label><input id="ctp" type="number" min="0" step="100" value="80000" inputmode="numeric">
<label for="cta">Associated companies (other companies you control)</label><input id="cta" type="number" min="0" step="1" value="0" inputmode="numeric">
<table class="ft"><tr><td>Corporation tax due</td><td id="ctr">-</td></tr><tr><td>Effective rate</td><td id="cte">-</td></tr><tr><td>Marginal relief included</td><td id="ctm">-</td></tr></table>
</div>
<script>
(function(){function f(n){return "£"+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}
function run(){var p=Math.max(0,parseFloat(document.getElementById("ctp").value)||0),a=Math.max(0,parseInt(document.getElementById("cta").value)||0),d=a+1,lo=50000/d,hi=250000/d,tax,mr=0;
if(p<=lo){tax=p*0.19}else if(p>=hi){tax=p*0.25}else{mr=(hi-p)*3/200;tax=p*0.25-mr}
document.getElementById("ctr").textContent=f(tax);document.getElementById("cte").textContent=p?(tax/p*100).toFixed(2)+"%":"-";document.getElementById("ctm").textContent=f(mr)}
["ctp","cta"].forEach(function(i){document.getElementById(i).addEventListener("input",run)});run()})();
</script>
<h2>How corporation tax is worked out</h2>
<table class="ft">
<tr><td>Profits up to £50,000</td><td>19%</td></tr>
<tr><td>Profits from £50,000 to £250,000</td><td>25% less marginal relief</td></tr>
<tr><td>Profits over £250,000</td><td>25%</td></tr>
</table>
<p>Marginal relief is (£250,000 minus profit) multiplied by 3/200. Example: on £80,000 of profit, tax at 25% is £20,000, marginal relief is £170,000 x 3/200 = £2,550, so the tax due is £17,450.</p>
<h2>What the calculator assumes</h2>
<ul><li>A 12-month accounting period falling in the financial year from 1 April 2026.</li>
<li>No dividends received from companies outside your group.</li>
<li>The £50,000 and £250,000 limits are divided by the number of associated companies plus one.</li>
<li>Taxable profit is after allowable expenses and capital allowances, which is not the same as the profit in your accounts.</li></ul>
<p>Corporation tax is due 9 months and 1 day after the year end. See <a href="/tax-deadlines-for-company-directors">deadlines for directors</a> and the <a href="/limited-company-expenses-guide">expenses a company can claim</a>. We prepare the computation and CT600 as part of our <a href="/corporation-tax-returns">corporation tax return service</a>.</p>''',
 [('Is the 19% rate automatic?','Yes, if taxable profits are £50,000 or less for a 12-month period and the company is not a close investment-holding company.'),
  ('What is an associated company?','Broadly, another company under the same control anywhere in the world. Each one reduces the £50,000 and £250,000 limits.'),
  ('My accounting period is shorter than 12 months. Does this work?','No. The limits are reduced in proportion for short periods, so ask us for the figure.'),
  ('Can I reduce the bill?','Legitimately, yes: claim all allowable expenses and capital allowances, and consider employer pension contributions. We look at this in a tax planning session.')],
 crumb='Calculators')

guide('dividend-tax-calculator','Dividend tax calculator for directors (2026 to 2027)',
 'Dividend Tax Calculator UK 2026/27 for Directors | NextGen CA',
 'Free UK dividend tax calculator for the 2026 to 2027 tax year. Enter your salary and dividends to see the dividend tax due at 10.75%, 35.75% and 39.35% after the personal allowance and £500 dividend allowance.',
 CALC_CSS+'''<p class="lead">Enter your salary and the dividends you take in the 2026 to 2027 tax year to see the tax due on the dividends. The calculator uses the personal allowance, the £500 dividend allowance and the dividend rates of 10.75%, 35.75% and 39.35%.</p>
<div class="calc">
<label for="dvs">Salary and other non-dividend income (£)</label><input id="dvs" type="number" min="0" step="100" value="12570" inputmode="numeric">
<label for="dvd">Dividends (£)</label><input id="dvd" type="number" min="0" step="100" value="40000" inputmode="numeric">
<table class="ft"><tr><td>Tax on dividends</td><td id="dvt">-</td></tr><tr><td>Dividends after tax</td><td id="dvn">-</td></tr><tr><td>Rate on total dividends</td><td id="dve">-</td></tr></table>
</div>
<script>
(function(){function f(n){return "£"+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}
function run(){var s=Math.max(0,parseFloat(document.getElementById("dvs").value)||0),d=Math.max(0,parseFloat(document.getElementById("dvd").value)||0),tot=s+d;
var pa=12570;if(tot>100000){pa=Math.max(0,12570-Math.floor((tot-100000)/2))}
var paS=Math.min(s,pa),paD=Math.min(d,pa-paS),sT=s-paS,dT=d-paD;
var b1=37700,b2=125140-pa;var used=sT,rem=dT,tax=0,al=Math.min(500,rem);
function slice(limit,rate){var room=Math.max(0,limit-used),x=Math.min(rem,room);if(x<=0)return;var free=Math.min(al,x);al-=free;tax+=(x-free)*rate;used+=x;rem-=x}
slice(b1,0.1075);slice(b2,0.3575);slice(Infinity,0.3935);
document.getElementById("dvt").textContent=f(tax);document.getElementById("dvn").textContent=f(d-tax);document.getElementById("dve").textContent=d?(tax/d*100).toFixed(2)+"%":"-"}
["dvs","dvd"].forEach(function(i){document.getElementById(i).addEventListener("input",run)});run()})();
</script>
<h2>Dividend tax rates for 2026 to 2027</h2>
<table class="ft">
<tr><td>Dividend allowance</td><td>£500</td></tr>
<tr><td>Basic rate band</td><td>10.75%</td></tr>
<tr><td>Higher rate band</td><td>35.75%</td></tr>
<tr><td>Additional rate band</td><td>39.35%</td></tr>
</table>
<h2>What the calculator assumes</h2>
<ul><li>You are resident in England, Wales or Northern Ireland. Scottish income tax bands apply to salary but dividends use the UK bands, so results can differ slightly for Scottish taxpayers.</li>
<li>The standard personal allowance of £12,570, reduced by £1 for every £2 of income over £100,000.</li>
<li>Dividends are treated as the top slice of income, and the £500 allowance uses up part of the band it falls in.</li>
<li>It shows the tax on dividends only. Income tax and National Insurance on salary are separate, and the company pays corporation tax before a dividend can be paid.</li></ul>
<p>Dividends are reported on your Self Assessment return and the tax is due by 31 January. For the best mix of salary, dividends and pension for your company, see <a href="/director-salary-and-dividends">director salary and dividend planning</a>, or use the <a href="/corporation-tax-calculator">corporation tax calculator</a>.</p>''',
 [('Do I pay National Insurance on dividends?','No. Dividends are not subject to National Insurance, which is one reason directors often take a low salary and the rest as dividends.'),
  ('Can my company always pay a dividend?','Only out of profits after corporation tax. A dividend paid without enough retained profit is unlawful and may have to be repaid.'),
  ('Do I need a tax return for dividends?','Yes if your dividends are over £10,000, or if tax is due and HMRC cannot collect it through your tax code.'),
  ('Why is my rate lower than 10.75%?','Because part of your dividends is covered by the personal allowance or the £500 dividend allowance.')],
 crumb='Calculators')

guide('how-much-does-an-accountant-cost-uk','How much does an accountant cost in the UK?',
 'How Much Does an Accountant Cost UK? 2026 Fees | NextGen CA',
 'What UK accountants charge in 2026 for Self Assessment, limited company accounts, VAT, payroll and bookkeeping, how monthly retainers compare with annual fixed fees, and our own published prices.',
 '''<p class="lead">In 2026 most UK small businesses pay an accountant in one of two ways: a monthly retainer that covers everything, or a fixed fee for each piece of work. What you pay depends on the type of business and how much needs doing, not on where the accountant is based.</p>
<h2>Typical UK fees in 2026</h2>
<table class="ft">
<tr><td>One-off Self Assessment tax return</td><td>£150 to £300</td></tr>
<tr><td>Sole trader, online accountant, monthly retainer</td><td>about £25 to £60 a month</td></tr>
<tr><td>Limited company, online accountant, monthly retainer</td><td>about £40 to £185 a month plus VAT</td></tr>
<tr><td>Contractor limited company package</td><td>about £80 to £200 a month</td></tr>
<tr><td>Annual fixed fee for company accounts, budget firms</td><td>about £49 to £599</td></tr>
</table>
<p class="note">Ranges are taken from published price comparisons of UK online accountants in 2026. Individual firms vary.</p>
<h2>Our fixed fees</h2>
<table class="ft">
<tr><td>Self Assessment tax return</td><td>from £99</td></tr>
<tr><td>Self-employed tax return, several income sources</td><td>from £150</td></tr>
<tr><td>Limited company accounts and CT600</td><td>from £349</td></tr>
<tr><td>VAT return</td><td>from £90 a quarter</td></tr>
<tr><td>Director-only payroll</td><td>£10 a month</td></tr>
<tr><td>Staff payroll, up to 5 employees</td><td>£25 a month</td></tr>
<tr><td>Monthly bookkeeping</td><td>from £49 a month</td></tr>
</table><p class="note">NextGen is not VAT registered, so no VAT is added to these fees. Many firms quote prices plus VAT at 20%, so compare like with like.</p>
<p>The <a href="/fees">full price list</a> shows every service. Your fee is fixed in writing before work starts.</p>
<h2>Monthly retainer or annual fixed fee?</h2>
<p>A retainer suits a business with regular work: monthly bookkeeping, payroll, VAT and frequent questions. A fixed annual fee suits a company with simple affairs that mainly needs accounts and a tax return once a year. A company paying £90 a month on a retainer spends £1,080 a year; if it only needs year-end accounts, a CT600 and a confirmation statement, a fixed fee is usually much less.</p>
<h2>What changes the price</h2>
<ul><li>How good your records are. Clean bookkeeping in software costs less to finish than a box of receipts.</li>
<li>Turnover and the number of transactions.</li>
<li>VAT registration, payroll and the number of employees.</li>
<li>Extra income sources such as property, foreign income or capital gains.</li>
<li>Overdue returns that need catching up.</li></ul>
<h2>What to check before you choose</h2>
<ul><li>Is the firm regulated by a body such as ICAEW or ACCA? Anyone can call themselves an accountant.</li>
<li>Who prepares the work and who reviews it?</li>
<li>Does the fee include filing with HMRC and Companies House, and replies to your questions?</li>
<li>Is there a minimum term or an exit fee?</li></ul>
<p>See also <a href="/accountant-or-bookkeeper">accountant or bookkeeper</a>, and <a href="/about">who we are</a>.</p>''',
 [('Is an accountant tax deductible?','For a business, yes. Accountancy fees for preparing business accounts and returns are an allowable expense.'),
  ('Why are some accountants so cheap?','Low headline prices often exclude VAT returns, payroll, the director\'s tax return or support. Compare what is included, not just the first figure.'),
  ('Do you charge a monthly retainer?','Only for monthly work such as bookkeeping and payroll. Year-end accounts and tax returns are a fixed fee per job.'),
  ('Can I get a quote without commitment?','Yes. Book a free 15-minute call and we send a fixed quote in writing.')])

guide('uk-company-non-resident-director-guide','Running a UK limited company as a non-resident director',
 'UK Company for Non-Resident Directors: Tax Guide | NextGen CA',
 'A guide for overseas founders and non-resident directors of UK limited companies: Companies House rules, identity verification, corporation tax, filing deadlines, VAT and paying yourself.',
 '''<p class="lead">You do not need to live in the UK to own or direct a UK limited company. The company still has the same duties as any other: it files accounts and a confirmation statement with Companies House and a corporation tax return with HMRC every year, wherever its directors live.</p>
<h2>What Companies House requires</h2>
<ul><li>A registered office at an appropriate address in the UK where documents will reach the company. A PO box alone is not accepted.</li>
<li>A registered email address.</li>
<li>Identity verification for directors and people with significant control. See our article on <a href="/insights/companies-house-identity-verification-for-directors">identity verification for directors</a>.</li>
<li>At least one director who is a natural person aged 16 or over. There is no UK residence requirement.</li></ul>
<h2>Tax the company pays</h2>
<p>A company incorporated in the UK is normally UK tax resident and pays corporation tax on its worldwide profits at 19% to 25%. If the company is managed and controlled from another country, that country may also treat it as resident there, and the double tax treaty decides which country taxes what. This needs checking before you start trading.</p>
<h2>Deadlines every year</h2>
<table class="ft">
<tr><td>Annual accounts to Companies House</td><td>9 months after year end</td></tr>
<tr><td>Corporation tax payment</td><td>9 months and 1 day after year end</td></tr>
<tr><td>CT600 return to HMRC</td><td>12 months after year end</td></tr>
<tr><td>Confirmation statement</td><td>Within 14 days after the end of each 12-month review period</td></tr>
</table>
<p>These apply even if the company has not traded. A company that has never traded files dormant accounts. Late accounts bring automatic penalties starting at £150.</p>
<h2>Paying yourself from abroad</h2>
<ul><li>Dividends paid to a non-resident shareholder are generally not taxed further in the UK, but are usually taxable where you live.</li>
<li>A salary for duties carried out wholly outside the UK is generally not subject to UK income tax; duties performed in the UK are.</li>
<li>Your home country's rules matter as much as the UK's. Take local advice as well.</li></ul>
<h2>VAT</h2>
<p>A business established in the UK must register once taxable turnover passes £90,000. Different rules apply to a company with no UK establishment, which may have to register from its first UK sale. We check which applies before you invoice UK customers.</p>
<h2>Practical points</h2>
<ul><li>UK business bank accounts can be harder to open from abroad. Allow time, and consider providers that accept non-resident directors.</li>
<li>Keep UK-format records and invoices from day one.</li>
<li>Tell Companies House within 14 days if a director's details change.</li></ul>
<p>We act for overseas founders and non-resident directors: <a href="/company-formation">company formation</a>, <a href="/limited-company-accounts">annual accounts and CT600</a>, and <a href="/non-resident-uk-tax">UK tax for non-residents</a>, all handled online across time zones.</p>''',
 [('Can a non-UK resident be the only director of a UK company?','Yes. There is no nationality or residence requirement for directors or shareholders.'),
  ('Does my company pay UK tax if all customers are abroad?','Usually yes. A UK-incorporated company is normally UK tax resident and taxed on worldwide profits, subject to any double tax treaty.'),
  ('My company never traded. Do I still need to file?','Yes. Dormant accounts and a confirmation statement are still due every year until the company is closed.'),
  ('Can you file overdue accounts for my company?','Yes. Tell us the company number and we will set out what is outstanding, the likely penalties and a fixed fee to bring it up to date.')])

guide('salary-take-home-calculator','Salary take-home pay calculator (2026 to 2027)',
 'Take-Home Pay Calculator UK 2026/27 | Salary After Tax | NextGen',
 'Free UK take-home pay calculator for the 2026 to 2027 tax year. Enter your gross salary and pension to see income tax, National Insurance and your net pay per year, month and week.',
 CALC_CSS+'''<p class="lead">Enter your gross annual salary to see how much you take home after income tax and National Insurance in the 2026 to 2027 tax year. Add a pension percentage if you pay into a workplace pension.</p>
<div class="calc">
<label for="tks">Gross salary for the year (£)</label><input id="tks" type="number" min="0" step="500" value="35000" inputmode="numeric">
<label for="tkp">Your pension contribution (% of salary, salary sacrifice)</label><input id="tkp" type="number" min="0" max="100" step="0.5" value="0" inputmode="decimal">
<table class="ft"><tr><td>Take-home pay per year</td><td id="tky">-</td></tr><tr><td>Per month</td><td id="tkm">-</td></tr><tr><td>Per week</td><td id="tkw">-</td></tr><tr><td>Income tax</td><td id="tkt">-</td></tr><tr><td>National Insurance</td><td id="tkn">-</td></tr><tr><td>Pension</td><td id="tkpp">-</td></tr></table>
</div>
<script>
(function(){function f(n){return "£"+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}
function g(i){return document.getElementById(i)}
function run(){var s=Math.max(0,parseFloat(g("tks").value)||0),pc=Math.min(100,Math.max(0,parseFloat(g("tkp").value)||0)),pen=s*pc/100,e=s-pen;
var pa=12570;if(e>100000){pa=Math.max(0,12570-Math.floor((e-100000)/2))}
var t=Math.max(0,e-pa),tax=Math.min(t,37700)*0.2+Math.max(0,Math.min(t,125140-pa)-37700)*0.4+Math.max(0,t-(125140-pa))*0.45;
var ni=Math.max(0,Math.min(e,50270)-12570)*0.08+Math.max(0,e-50270)*0.02,net=e-tax-ni;
g("tky").textContent=f(net);g("tkm").textContent=f(net/12);g("tkw").textContent=f(net/52);g("tkt").textContent=f(tax);g("tkn").textContent=f(ni);g("tkpp").textContent=f(pen)}
["tks","tkp"].forEach(function(i){g(i).addEventListener("input",run)});run()})();
</script>
<h2>Rates used for 2026 to 2027</h2>
<table class="ft">
<tr><td>Personal allowance</td><td>£12,570</td></tr>
<tr><td>Basic rate, £12,571 to £50,270</td><td>20%</td></tr>
<tr><td>Higher rate, £50,271 to £125,140</td><td>40%</td></tr>
<tr><td>Additional rate, over £125,140</td><td>45%</td></tr>
<tr><td>Employee National Insurance, £12,570 to £50,270</td><td>8%</td></tr>
<tr><td>Employee National Insurance, over £50,270</td><td>2%</td></tr>
</table>
<h2>What the calculator assumes</h2>
<ul><li>You live in England, Wales or Northern Ireland. Scotland has its own income tax bands, so results will differ there.</li>
<li>Tax code 1257L, one job, under State Pension age, National Insurance category A.</li>
<li>The personal allowance falls by £1 for every £2 of income over £100,000.</li>
<li>Pension is treated as salary sacrifice, so it reduces both tax and National Insurance. Other pension schemes give a slightly different result.</li>
<li>No student loan, benefits in kind or other deductions.</li></ul>
<p>If you are a company director, taking a low salary and the rest as dividends usually leaves more in your pocket. See the <a href="/dividend-tax-calculator">dividend tax calculator</a> and <a href="/director-salary-and-dividends">director salary and dividend planning</a>. Employers can use our <a href="/payroll">payroll service</a>: £10 a month for a director-only payroll and £25 a month for up to 5 employees. No VAT is added.</p>''',
 [('Why is my payslip slightly different?','Payroll works out tax and National Insurance each pay period, and your tax code, student loan, benefits or pension scheme type can change the figure.'),
  ('How much tax do I pay on £35,000?','In 2026 to 2027, income tax is £4,486 and National Insurance is £1,794.40, leaving take-home pay of £28,719.60, about £2,393 a month.'),
  ('Does this work for the self-employed?','No. Sole traders pay Class 4 National Insurance at 6% and 2% on profits instead, through Self Assessment.'),
  ('What is the 60% tax trap?','Between £100,000 and £125,140 you lose £1 of personal allowance for every £2 earned, so the effective income tax rate on that slice is 60%. Pension contributions can reduce it.')],
 crumb='Calculators')

FEE_NOTE='<p class="note">Prices are starting fees and are fixed in writing before work starts. NextGen is not VAT registered, so no VAT is added to our fees. See the <a href="/fees">full price list</a>.</p>'

guide('making-tax-digital-for-income-tax','Making Tax Digital for Income Tax: who it applies to and what to do',
 'Making Tax Digital for Income Tax UK | 2026 Guide | NextGen CA',
 'Making Tax Digital for Income Tax started on 6 April 2026 for sole traders and landlords with income over £50,000. Thresholds, quarterly update dates, software, penalties and what it costs.',
 '''<p class="lead">Making Tax Digital for Income Tax (MTD IT) started on 6 April 2026. Sole traders and landlords above the income threshold must now keep digital records, send HMRC a quarterly update through software and file a final declaration after the tax year ends, instead of one Self Assessment return.</p>
<h2>Who has to join, and when</h2>
<table class="ft">
<tr><td>Qualifying income over £50,000</td><td>From 6 April 2026</td></tr>
<tr><td>Qualifying income over £30,000</td><td>From 6 April 2027</td></tr>
<tr><td>Qualifying income over £20,000</td><td>From 6 April 2028</td></tr>
</table>
<p>Qualifying income is your gross self-employment and property income added together, before expenses. HMRC looks at the return for the tax year two years earlier, so the April 2026 start is based on your 2024 to 2025 return. Employment income, dividends and pensions do not count towards the threshold.</p>
<h2>What you have to do each year</h2>
<ul><li>Keep digital records of income and expenses in MTD-compatible software.</li>
<li>Send a quarterly update for each business and for property income.</li>
<li>File a final declaration by 31 January after the tax year, which replaces the Self Assessment return, and pay the tax as before.</li></ul>
<h2>Quarterly update deadlines</h2>
<table class="ft">
<tr><td>6 April to 5 July</td><td>7 August</td></tr>
<tr><td>6 July to 5 October</td><td>7 November</td></tr>
<tr><td>6 October to 5 January</td><td>7 February</td></tr>
<tr><td>6 January to 5 April</td><td>7 May</td></tr>
</table>
<p>You can elect to use calendar quarters instead, ending on 30 June, 30 September, 31 December and 31 March, with the same filing dates.</p>
<h2>Penalties</h2>
<p>MTD IT uses a points system. Each late submission earns a point, and a £200 penalty is charged when you reach the threshold. HMRC has said it will not apply penalty points for late quarterly updates in the first year, 2026 to 2027, but the final declaration and tax payment deadlines still carry penalties.</p>
<h2>What it costs with us</h2>
<table class="ft">
<tr><td>MTD for Income Tax quarterly update</td><td>£30 a quarter</td></tr>
<tr><td>Final declaration, one income source</td><td>from £99</td></tr>
<tr><td>Monthly bookkeeping, if you want us to keep the records</td><td>from £49 a month</td></tr>
</table>'''+FEE_NOTE+'''
<h2>How to get ready</h2>
<ul><li>Check your gross income on your last tax return against the thresholds.</li>
<li>Choose software, or ask us to set it up. See <a href="/accounting-software-setup">software setup</a>.</li>
<li>Open a separate bank account for the business or rental income if you do not have one.</li>
<li>Sign up for MTD IT, or authorise us to do it as your agent.</li></ul>
<p>We run MTD IT for clients as part of our <a href="/making-tax-digital">Making Tax Digital service</a>, alongside <a href="/sole-trader-accounts">sole trader accounts</a> and <a href="/landlord-tax-return">landlord tax returns</a>.</p>''',
 [('Does MTD for Income Tax apply to limited companies?','No. It applies to individuals with self-employment or property income. Companies continue to file a CT600.'),
  ('My profit is low but my turnover is over £50,000. Am I in?','Yes. The test uses gross income before expenses, not profit.'),
  ('Can I still use a spreadsheet?','Only with bridging software that sends the figures to HMRC digitally. Most people find full bookkeeping software simpler.'),
  ('Do I pay tax every quarter?','No. Quarterly updates are reports only. Tax is still paid by 31 January and 31 July.')])

guide('hospitality-and-restaurant-accountants','Accountants for restaurants, takeaways and hospitality businesses',
 'Hospitality and Restaurant Accountants UK | Fixed Fees | NextGen',
 'Chartered Accountants for UK restaurants, takeaways, cafes, pubs and hotels. Weekly payroll, tips and tronc, VAT on food, bookkeeping from till and delivery apps, year-end accounts. Fixed fees.',
 '''<p class="lead">We look after the accounts, VAT, payroll and tax of restaurants, takeaways, cafes, pubs and small hotels across the UK. Sheryar Ahmed ACA FCCA has worked in hospitality finance, so the firm knows how the numbers in a kitchen and front of house actually behave.</p>
<h2>What we do for hospitality businesses</h2>
<ul><li><a href="/bookkeeping-and-vat">Bookkeeping</a> from till reports, card terminals and delivery platforms such as Just Eat, Uber Eats and Deliveroo, including their commission.</li>
<li><a href="/vat-registration-and-returns">VAT returns</a> with the right split between standard-rated and zero-rated sales.</li>
<li><a href="/payroll">Weekly or monthly payroll</a> for hourly staff, holiday pay, pensions and tips.</li>
<li><a href="/limited-company-accounts">Year-end accounts and corporation tax</a>.</li>
<li><a href="/management-accounts">Monthly management accounts</a> showing food cost, labour cost and margin.</li></ul>
<h2>Tax points that catch restaurants out</h2>
<ul><li><strong>VAT on food.</strong> Food eaten on the premises and hot takeaway food are standard-rated at 20%. Most cold takeaway food is zero-rated. The till needs to record the difference.</li>
<li><strong>Tips.</strong> Since 1 October 2024 employers must pass on all tips, gratuities and service charges to staff without deductions, and keep a written tips policy and records.</li>
<li><strong>Tronc.</strong> Tips shared through an independent tronc can be free of National Insurance if the scheme is run properly.</li>
<li><strong>Delivery platforms.</strong> Sales are the gross amount the customer paid, not the net payout after commission.</li>
<li><strong>Cash.</strong> HMRC compares card and cash ratios with similar businesses. Daily records protect you in an enquiry.</li></ul>
<h2>Fees</h2>
<table class="ft">
<tr><td>Monthly bookkeeping</td><td>from £49 a month</td></tr>
<tr><td>VAT return</td><td>£90 a quarter</td></tr>
<tr><td>Staff payroll, up to 5 employees</td><td>£25 a month</td></tr>
<tr><td>Each extra employee</td><td>£4 a payslip</td></tr>
<tr><td>Limited company accounts and CT600</td><td>from £349</td></tr>
</table>'''+FEE_NOTE+'''
<h2>How it works</h2>
<p>Everything is done online. You send till and bank data, or we connect your bookkeeping software to the bank and the till. You have one named contact and replies within 1 hour, Monday to Saturday.</p>''',
 [('Can you work with my EPOS system?','Yes, if it can export daily sales reports or connect to bookkeeping software. We tell you on the first call.'),
  ('Do I have to charge VAT on takeaway food?','Hot takeaway food is standard-rated. Cold food taken away is usually zero-rated. Drinks and confectionery have their own rules.'),
  ('How should tips be paid?','Tips must go to staff in full by the end of the month after the month they were received. Card tips paid by the employer go through payroll for tax.'),
  ('I have fallen behind with VAT and payroll. Can you help?','Yes. We bring the records up to date, file what is overdue and deal with HMRC about penalties.')],
 crumb='Sectors')

guide('construction-and-cis-accountants','Accountants for construction businesses and CIS subcontractors',
 'Construction and CIS Accountants UK | Fixed Fees | NextGen CA',
 'Chartered Accountants for UK builders, contractors and CIS subcontractors. Monthly CIS returns, subcontractor verification, CIS refunds, VAT reverse charge, accounts and tax returns. Fixed fees.',
 '''<p class="lead">We act for building contractors, trades and subcontractors across the UK. We file monthly CIS returns, reclaim CIS deductions, handle the VAT reverse charge and prepare the accounts and tax returns, for a fixed fee.</p>
<h2>How the Construction Industry Scheme works</h2>
<table class="ft">
<tr><td>Subcontractor registered for CIS</td><td>20% deducted</td></tr>
<tr><td>Subcontractor not registered</td><td>30% deducted</td></tr>
<tr><td>Subcontractor with gross payment status</td><td>No deduction</td></tr>
</table>
<p>A contractor must verify each subcontractor with HMRC, deduct tax from the labour part of each payment, give the subcontractor a monthly statement, and file a CIS return by the 19th of each month for the tax month ending on the 5th. Deductions are paid to HMRC by the 22nd.</p>
<h2>What we do</h2>
<ul><li><strong>Contractors:</strong> subcontractor verification, <a href="/cis-returns">monthly CIS returns</a>, deduction statements, and <a href="/payroll">payroll</a> for employed staff.</li>
<li><strong>Sole trader subcontractors:</strong> <a href="/self-assessment-tax-return">Self Assessment</a> with all expenses claimed, so the CIS tax already deducted is refunded where it is more than the tax due.</li>
<li><strong>Limited company subcontractors:</strong> CIS suffered set against PAYE each month, and any balance reclaimed after the tax year.</li>
<li><a href="/vat-registration-and-returns">VAT returns</a> using the domestic reverse charge for construction services.</li>
<li><a href="/limited-company-accounts">Year-end accounts and corporation tax</a>, and help applying for gross payment status.</li></ul>
<h2>Points that cause problems</h2>
<ul><li><strong>Late CIS returns.</strong> The penalty is £100 for a late return, £200 after 2 months, and further penalties after 6 and 12 months.</li>
<li><strong>Materials.</strong> CIS is deducted from labour only. Materials must be shown separately on the invoice.</li>
<li><strong>VAT reverse charge.</strong> For most construction services between VAT-registered businesses, the customer accounts for the VAT, not the supplier. Invoices need the right wording.</li>
<li><strong>Employed or self-employed.</strong> Calling someone a subcontractor does not make them one. HMRC looks at how the work is actually done.</li></ul>
<h2>Fees</h2>
<table class="ft">
<tr><td>CIS monthly return</td><td>£25 a month</td></tr>
<tr><td>Self Assessment for a CIS subcontractor</td><td>from £99</td></tr>
<tr><td>VAT return</td><td>£90 a quarter</td></tr>
<tr><td>Monthly bookkeeping</td><td>from £49 a month</td></tr>
<tr><td>Limited company accounts and CT600</td><td>from £349</td></tr>
</table>'''+FEE_NOTE,
 [('How do I get my CIS refund?','Sole traders claim it through the Self Assessment return after 5 April. Limited companies set CIS against PAYE during the year and reclaim any balance afterwards.'),
  ('Can I get gross payment status?','You need to pass HMRC\'s business, turnover and compliance tests, including filing and paying on time for the last 12 months. We check before you apply.'),
  ('Do I need to file a CIS return if I paid no subcontractors?','If HMRC expects a return, yes, unless you have told HMRC you will not be paying subcontractors for a period.'),
  ('What expenses can a subcontractor claim?','Tools, materials, protective clothing, van and fuel costs, insurance, phone and accountancy fees, as long as they are for the work.')],
 crumb='Sectors')

guide('ecommerce-accountants','Accountants for e-commerce and online sellers',
 'E-commerce Accountants UK | Amazon, eBay, Shopify | NextGen CA',
 'Chartered Accountants for UK online sellers on Amazon, eBay, Etsy, Shopify and TikTok Shop. Bookkeeping from marketplace reports, VAT, stock, multi-currency and year-end accounts. Fixed fees.',
 '''<p class="lead">We prepare the accounts, VAT and tax returns of online sellers trading on Amazon, eBay, Etsy, Shopify, TikTok Shop and their own websites, from first sales through to a limited company with stock in several countries.</p>
<h2>What makes e-commerce accounts different</h2>
<ul><li><strong>Payouts are not sales.</strong> Marketplaces pay out after deducting fees, refunds and advertising. The accounts need gross sales, with fees shown as costs.</li>
<li><strong>VAT registration.</strong> A UK-established seller must register once taxable turnover passes £90,000 in any rolling 12 months. Overseas sellers storing goods in the UK must register from their first sale.</li>
<li><strong>Marketplace VAT rules.</strong> In some cases the marketplace, not the seller, accounts for the VAT, for example on sales by overseas sellers to UK consumers.</li>
<li><strong>Selling to the EU.</strong> Goods sent to EU consumers have EU VAT, usually handled through the One Stop Shop or Import One Stop Shop schemes.</li>
<li><strong>Stock.</strong> Year-end stock, including goods held at fulfilment centres and in transit, changes the profit.</li>
<li><strong>HMRC already has your figures.</strong> Online platforms report sellers' income to HMRC every year.</li></ul>
<h2>What we do</h2>
<ul><li><a href="/bookkeeping-and-vat">Bookkeeping</a> from marketplace settlement reports, payment processors and bank feeds, in Xero, QuickBooks or FreeAgent.</li>
<li><a href="/vat-registration-and-returns">VAT registration and returns</a>, including the right scheme for your margins.</li>
<li><a href="/sole-trader-accounts">Sole trader accounts</a> or <a href="/limited-company-accounts">limited company accounts and CT600</a>.</li>
<li>Advice on <a href="/sole-trader-to-limited-company">when to become a limited company</a>.</li>
<li><a href="/non-resident-uk-tax">UK tax and VAT for overseas sellers</a>.</li></ul>
<h2>Fees</h2>
<table class="ft">
<tr><td>Self-employed tax return, one income source</td><td>£99</td></tr>
<tr><td>Limited company accounts and CT600</td><td>from £349</td></tr>
<tr><td>Monthly bookkeeping</td><td>from £49 a month</td></tr>
<tr><td>VAT registration</td><td>£39</td></tr>
<tr><td>VAT return</td><td>£90 a quarter</td></tr>
<tr><td>UK VAT registration for overseas sellers</td><td>£99</td></tr>
</table>'''+FEE_NOTE,
 [('I only sell a few things online. Do I need to tell HMRC?','If your trading income is over £1,000 in a tax year you must register for Self Assessment. Selling your own used belongings is not usually trading.'),
  ('Do I pay VAT on Amazon fees?','Marketplace fees charged to UK sellers generally carry UK VAT. A VAT-registered seller can normally reclaim it.'),
  ('Should I use the Flat Rate Scheme?','It rarely suits sellers of goods because the cost of stock is high, but we check the figures for you.'),
  ('Can you work from my marketplace reports?','Yes. Give us read-only access or the settlement reports and we do the rest.')],
 crumb='Sectors')

guide('switching-accountants','How to switch accountants in the UK',
 'Switching Accountants UK: How to Change Accountant | NextGen CA',
 'How to change accountant in the UK: when you can switch, what your new accountant does for you, the professional clearance letter, what records are handed over and how long it takes.',
 '''<p class="lead">You can change accountant at any time of year. You do not need to wait for the year end, and you do not need to have an awkward conversation: your new accountant contacts the old one and collects what is needed.</p>
<h2>How switching works</h2>
<ol><li><strong>Choose your new accountant</strong> and agree the fee and what it covers in writing.</li>
<li><strong>Identity checks.</strong> By law the new firm must verify your identity before acting for you.</li>
<li><strong>Tell your current accountant</strong> you are leaving. A short email is enough. Check your engagement letter for any notice period.</li>
<li><strong>Professional clearance.</strong> The new accountant writes to the old one to ask whether there is any reason not to act and to request your records.</li>
<li><strong>Handover.</strong> The old accountant passes on the information needed, such as last accounts, tax returns, trial balance, fixed asset records and payroll data.</li>
<li><strong>HMRC authorisation.</strong> The new accountant becomes your agent with HMRC, and Companies House if needed.</li></ol>
<p>A straightforward switch usually takes one to two weeks. Work on your accounts does not have to wait for the handover to finish.</p>
<h2>Good times to switch</h2>
<ul><li>Just after your accounts and tax return have been filed.</li>
<li>Before the year end, so the new accountant can plan with you.</li>
<li>Immediately, if deadlines are being missed or you cannot get replies.</li></ul>
<h2>Signs it is time to change</h2>
<ul><li>Returns filed at the last minute, or late.</li>
<li>Slow replies, or a different person every time.</li>
<li>Fees that change without explanation.</li>
<li>No advice beyond filing: nothing on salary and dividends, VAT schemes or allowable expenses.</li>
<li>Your accountant is not a member of a professional body.</li></ul>
<h2>What to check first</h2>
<ul><li>Any fees you still owe. Records are normally released once agreed fees are paid.</li>
<li>Who holds the logins for your bookkeeping software, and whose subscription it is.</li>
<li>That you have copies of your last accounts and tax returns.</li></ul>
<h2>Switching to NextGen</h2>
<p>We handle the clearance letter, the handover and the HMRC authorisation for you. You get a fixed fee in writing, one named contact and replies within 1 hour, Monday to Saturday. We are an ICAEW member firm, firm number C011010236. See <a href="/about">who we are</a>, our <a href="/fees">fees</a>, or <a href="/how-much-does-an-accountant-cost-uk">what accountants cost in the UK</a>.</p>''',
 [('Can I switch accountants mid-year?','Yes, at any time. The new accountant picks up from the last period that was completed.'),
  ('Will my old accountant charge me for the handover?','Providing handover information is normally done without charge, but work beyond that, or outstanding fees, may be billed.'),
  ('Do I have to tell HMRC?','No. Your new accountant requests authorisation and you approve it.'),
  ('What if my old accountant will not release my records?','Books and records that belong to you must be returned. If there is a problem, we raise it with the firm and, if needed, its professional body.')])
