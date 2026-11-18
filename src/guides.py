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
