# Insights: articles from src/posts/*.json plus the live GOV.UK updates feed.
# Executed inside build.py (uses page, NAMES, CTA, html, json, R).
import glob, datetime
POSTS=[]
for f in glob.glob(R+'src/posts/*.json'):
    POSTS.append(json.load(open(f)))
POSTS.sort(key=lambda p:p.get('sort',p['date']),reverse=True)
os.makedirs(R+'insights',exist_ok=True)
AUTHOR='Sheryar Ahmed ACA FCCA'
def nice(d): return datetime.date.fromisoformat(d).strftime('%-d %B %Y')
FEED='''<div id="govuk-updates" class="updates"><p class="note">Loading the latest HMRC and Companies House news…</p></div>
<p class="note">Updates come directly from GOV.UK and refresh automatically. <a href="https://www.gov.uk/search/news-and-communications?organisations%5B%5D=hm-revenue-customs&organisations%5B%5D=companies-house">See all on GOV.UK</a>.</p>
<script src="/updates.js" defer></script>'''
for p in POSTS:
    rel=''.join(f'<li><a href="/{r}">{NAMES[r]}</a></li>' for r in p.get('related',[]) if r in NAMES)
    src=''.join(f'<li><a href="{s["url"]}" rel="noopener">{html.escape(s["title"])}</a></li>' for s in p.get('sources',[]))
    body=f'''<p class="crumb"><a href="/">Home</a> / <a href="/insights">Insights</a> / {html.escape(p['title'])}</p>
<p class="eyebrow" style="margin-top:22px">Insights</p>
<h1>{html.escape(p['title'])}</h1>
<div class="author"><img src="/img/sheryar.jpg" alt="Sheryar Ahmed ACA FCCA" width="56" height="56"><div><b>By Sheryar Ahmed ACA FCCA</b><span>Chartered Accountant · Founder, NextGen Chartered Accountant</span><span>{html.escape(p.get('label',''))}{' · ' if p.get('label') else ''}Published {nice(p['date'])}</span></div></div>
<p class="lead">{html.escape(p['summary'])}</p>
{p['body']}
{('<h2>Sources</h2><ul>'+src+'</ul>') if src else ''}
{('<h2>Related services</h2><ul>'+rel+'</ul>') if rel else ''}
<div class="author author-end"><img src="/img/sheryar.jpg" alt="" width="72" height="72"><div><b>About the author</b><span>Sheryar Ahmed ACA FCCA is a Chartered Accountant (ICAEW) and Fellow of ACCA with more than ten years in UK accounting, tax and payroll. He founded NextGen Chartered Accountant, an ICAEW member firm.</span></div></div>
<p class="note">This article is general information based on the rules at the date of publication. It is not advice for your circumstances; please speak to us before acting on it.</p>
{CTA}'''
    url='https://nextgenca.co.uk/insights/'+p['slug']
    ld=[{"@context":"https://schema.org","@type":"Article","headline":p['title'],"description":p['summary'],"datePublished":p['date'],"dateModified":p.get('updated',p['date']),"url":url,"mainEntityOfPage":url,
         "author":{"@type":"Person","name":"Sheryar Ahmed","honorificSuffix":"ACA FCCA","jobTitle":"Chartered Accountant","url":"https://nextgenca.co.uk/#about"},
         "publisher":{"@type":"Organization","name":"NextGen Chartered Accountant","logo":{"@type":"ImageObject","url":"https://nextgenca.co.uk/img/mark.jpg"}}},
        {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://nextgenca.co.uk/"},{"@type":"ListItem","position":2,"name":"Insights","item":"https://nextgenca.co.uk/insights"},{"@type":"ListItem","position":3,"name":p['title'],"item":url}]}]
    page('insights/'+p['slug'],p['title']+' | NextGen Chartered Accountant',p['summary'],body,ld)

cards=''.join(f'''<article class="post"><p class="post-meta">{html.escape(p.get('label',nice(p['date'])))}</p><p class="post-by">By Sheryar Ahmed ACA FCCA</p><h3><a href="/insights/{p['slug']}">{html.escape(p['title'])}</a></h3><p>{html.escape(p['summary'])}</p><a href="/insights/{p['slug']}">Read the article</a></article>''' for p in POSTS)
page('insights','Insights: UK Tax and Accounting Updates | NextGen Chartered Accountant',
 'Plain-English articles on new UK tax rules, HMRC changes and deadlines by Sheryar Ahmed ACA FCCA, with the latest HMRC and Companies House news.',
 f'''<p class="crumb"><a href="/">Home</a> / Insights</p>
<p class="eyebrow" style="margin-top:22px">Insights</p>
<h1>Tax and accounting updates</h1>
<p class="lead">New rules and HMRC changes explained in plain English by Sheryar Ahmed ACA FCCA, with what they mean for you.</p>
<h2>Articles</h2>
{cards or '<p>New articles are published every week.</p>'}
<h2>Latest from HMRC and Companies House</h2>
{FEED}
{CTA}''',
 [{"@context":"https://schema.org","@type":"Blog","name":"NextGen Chartered Accountant Insights","url":"https://nextgenca.co.uk/insights","author":{"@type":"Person","name":"Sheryar Ahmed"},
   "blogPost":[{"@type":"BlogPosting","headline":p['title'],"datePublished":p['date'],"url":"https://nextgenca.co.uk/insights/"+p['slug']} for p in POSTS]}])
POST_SLUGS=['insights']+['insights/'+p['slug'] for p in POSTS]
