import os
# Insights: articles from src/posts/*.json plus the live GOV.UK updates feed.
# Executed inside build.py (uses page, NAMES, CTA, html, json, R).
import glob, datetime
POSTS=[]
for f in glob.glob(R+'src/posts/*.json'):
    POSTS.append(json.load(open(f)))
POSTS.sort(key=lambda p:p.get('sort',p['date']),reverse=True)
os.makedirs(R+'insights',exist_ok=True)
AUTHOR='Team NextGen Chartered Accountant'
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
<div class="author"><img src="/img/mark.jpg" alt="NextGen Chartered Accountant" width="56" height="56"><div><b>By Team NextGen Chartered Accountant</b><span>Chartered Accountants · ICAEW member firm</span><span>{html.escape(p.get('label',''))}{' · ' if p.get('label') else ''}Published {nice(p['date'])}</span></div></div>
<p class="lead">{html.escape(p['summary'])}</p>
{p['body']}
{('<h2>Sources</h2><ul>'+src+'</ul>') if src else ''}
{('<h2>Related services</h2><ul>'+rel+'</ul>') if rel else ''}
<div class="author author-end"><img src="/img/mark.jpg" alt="" width="72" height="72"><div><b>About the team</b><span>NextGen Chartered Accountant is an ICAEW member firm of Chartered Accountants. Our team looks after accounts, tax and payroll for small businesses, landlords and individuals across the UK.</span></div></div>
<p class="note">This article is general information based on the rules at the date of publication. It is not advice for your circumstances; please speak to us before acting on it.</p>
{CTA}'''
    url='https://nextgenca.co.uk/insights/'+p['slug']
    ld=[{"@context":"https://schema.org","@type":"Article","headline":p['title'],"description":p['summary'],"datePublished":p['date'],"dateModified":p.get('updated',p['date']),"url":url,"mainEntityOfPage":url,
         "author":{"@type":"Organization","name":"NextGen Chartered Accountant","url":"https://nextgenca.co.uk/"},
         "publisher":{"@type":"Organization","name":"NextGen Chartered Accountant","logo":{"@type":"ImageObject","url":"https://nextgenca.co.uk/img/mark.jpg"}}},
        {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://nextgenca.co.uk/"},{"@type":"ListItem","position":2,"name":"Insights","item":"https://nextgenca.co.uk/insights"},{"@type":"ListItem","position":3,"name":p['title'],"item":url}]}]
    page('insights/'+p['slug'],p['title']+' | NextGen Chartered Accountant',p['summary'],body,ld,image=('https://nextgenca.co.uk/social/'+p['slug']+'.png') if os.path.exists(R+'social/'+p['slug']+'.png') else None,ogtype='article')

cards=''.join(f'''<article class="post"><p class="post-meta">{html.escape(p.get('label',nice(p['date'])))}</p><p class="post-by">By Team NextGen Chartered Accountant</p><h3><a href="/insights/{p['slug']}">{html.escape(p['title'])}</a></h3><p>{html.escape(p['summary'])}</p><a href="/insights/{p['slug']}">Read the article</a></article>''' for p in POSTS)
page('insights','Insights: UK Tax and Accounting Updates | NextGen Chartered Accountant',
 'Plain-English articles on new UK tax rules, HMRC changes and deadlines by Team NextGen Chartered Accountant, with the latest HMRC and Companies House news.',
 f'''<p class="crumb"><a href="/">Home</a> / Insights</p>
<p class="eyebrow" style="margin-top:22px">Insights</p>
<h1>Tax and accounting updates</h1>
<p class="lead">New rules and HMRC changes explained in plain English by Team NextGen Chartered Accountant, with what they mean for you.</p>
<h2>Articles</h2>
{cards or '<p>New articles are published every week.</p>'}
<h2>Latest from HMRC and Companies House</h2>
{FEED}
{CTA}''',
 [{"@context":"https://schema.org","@type":"Blog","name":"NextGen Chartered Accountant Insights","url":"https://nextgenca.co.uk/insights","author":{"@type":"Organization","name":"NextGen Chartered Accountant","url":"https://nextgenca.co.uk/"},
   "blogPost":[{"@type":"BlogPosting","headline":p['title'],"datePublished":p['date'],"url":"https://nextgenca.co.uk/insights/"+p['slug']} for p in POSTS]}])
POST_SLUGS=['insights']+['insights/'+p['slug'] for p in POSTS]

# RSS feed for LinkedIn "External content sources" and other readers: /rss.xml
from email.utils import format_datetime as _fmt
from xml.sax.saxutils import escape as _x
_items=[]
for p in sorted(POSTS,key=lambda p:p['date'],reverse=True)[:30]:
    _u='https://nextgenca.co.uk/insights/'+p['slug']
    _d=_fmt(datetime.datetime.fromisoformat(p['date']+'T08:00:00+00:00'))
    _img=f'https://nextgenca.co.uk/social/{p["slug"]}.png'
    _items.append(f'<item><title>{_x(p["title"])}</title><link>{_u}</link><guid isPermaLink="true">{_u}</guid><pubDate>{_d}</pubDate><description>{_x(p["summary"])}</description>'
                  +(f'<enclosure url="{_img}" type="image/png" length="0"/>' if os.path.exists(f'social/{p["slug"]}.png') else '')+'</item>')
_now=_fmt(datetime.datetime.now(datetime.timezone.utc))
open('rss.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>'
  '<title>NextGen Chartered Accountant: UK tax and accounting updates</title><link>https://nextgenca.co.uk/insights</link>'
  '<atom:link href="https://nextgenca.co.uk/rss.xml" rel="self" type="application/rss+xml"/>'
  '<description>New UK tax, payroll and Companies House rules, explained for small businesses, landlords and individuals.</description>'
  f'<language>en-gb</language><lastBuildDate>{_now}</lastBuildDate>'+''.join(_items)+'</channel></rss>\n')
