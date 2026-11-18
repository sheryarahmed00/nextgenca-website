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
<tr><td>Confirmation statement</td><td>Within 14 days of the review date, every 12 months</td></tr>
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
<li>CT600: £100 if one day late and a further £100 after 3 months, then tax-based penalties after 6 and 12 months.</li>
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
  ('How much does an accountant cost?','It depends on the work. Our fees are fixed and published, for example limited company accounts and CT600 from £349 and Self Assessment from £99.')])

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
<tr><td>Payroll</td><td>from £25 a month</td></tr>
</table>
<p class="note">Prices are starting fees. See the <a href="/fees">full price list</a>.</p>
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
<tr><td>Payroll</td><td>from £25 a month</td></tr>
<tr><td>Monthly bookkeeping</td><td>from £49 a month</td></tr>
</table>
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
<tr><td>Confirmation statement</td><td>Every 12 months</td></tr>
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
<p>If you are a company director, taking a low salary and the rest as dividends usually leaves more in your pocket. See the <a href="/dividend-tax-calculator">dividend tax calculator</a> and <a href="/director-salary-and-dividends">director salary and dividend planning</a>. Employers can use our <a href="/payroll">payroll service</a> from £25 a month.</p>''',
 [('Why is my payslip slightly different?','Payroll works out tax and National Insurance each pay period, and your tax code, student loan, benefits or pension scheme type can change the figure.'),
  ('How much tax do I pay on £35,000?','In 2026 to 2027, income tax is £4,486 and National Insurance is £1,794.40, leaving take-home pay of £28,719.60, about £2,393 a month.'),
  ('Does this work for the self-employed?','No. Sole traders pay Class 4 National Insurance at 6% and 2% on profits instead, through Self Assessment.'),
  ('What is the 60% tax trap?','Between £100,000 and £125,140 you lose £1 of personal allowance for every £2 earned, so the effective income tax rate on that slice is 60%. Pension contributions can reduce it.')],
 crumb='Calculators')
