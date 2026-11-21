# Answer-engine and AI-search layer. Executed at the end of build.py.
# - one linked entity graph in JSON-LD (firm and founder have the same @id on every page)
# - starting price as an Offer on each service page, FAQPage on the home page, price list on /fees
# - llms.txt and robots.txt regenerated from the pages that exist
import glob as _glob
_ORG='https://nextgenca.co.uk/#org'
_PER='https://nextgenca.co.uk/about#principal'
_FIRM='NextGen Chartered Accountant'
_LD=re.compile(r'<script type="application/ld\+json">(.*?)</script>',re.S)
def _txt(x): return html.unescape(re.sub(r'<[^>]+>','',x)).strip()
def _gbp(x):
    m=re.search(r'£([\d,]+(?:\.\d+)?)',x)
    return m.group(1).replace(',','') if m else None
_FOUNDER={"@type":"Person","@id":_PER,"name":"Ahmed","honorificSuffix":"ACA","jobTitle":"Founder, Chartered Accountant","url":"https://nextgenca.co.uk/about","worksFor":{"@id":_ORG},
 "hasCredential":[{"@type":"EducationalOccupationalCredential","name":"ACA","credentialCategory":"Professional qualification","recognizedBy":{"@type":"Organization","name":"Institute of Chartered Accountants in England and Wales (ICAEW)","url":"https://www.icaew.com/"}}],
 "knowsAbout":["UK corporation tax","Self Assessment","VAT","Payroll","Limited company accounts","Making Tax Digital","UK tax for non-residents"]}
def _walk(n,top=False):
    if isinstance(n,list): return [_walk(x) for x in n]
    if not isinstance(n,dict): return n
    n={k:_walk(v) for k,v in n.items()}
    t=n.get('@type')
    if t in('AccountingService','Organization') and n.get('name')==_FIRM:
        n={'@type':'AccountingService' if t=='AccountingService' else t,'@id':_ORG,**{k:v for k,v in n.items() if k not in('@type','@id')}}
        n.setdefault('url','https://nextgenca.co.uk/')
    if t=='Person' and n.get('name') in ('Sheryar Ahmed','S. Ahmed','Ahmed'):
        n={'@type':'Person','@id':_PER,**{k:v for k,v in n.items() if k not in('@type','@id')}}
        n['url']='https://nextgenca.co.uk/about'
    return n
def _blocks(h):
    out=[]
    for b in _LD.findall(h):
        d=json.loads(b); out+= d if isinstance(d,list) else [d]
    return out
def _put(h,nodes):
    h=re.sub(r'<script type="application/ld\+json">.*?</script>\n?','',h,flags=re.S)
    tag='<script type="application/ld+json">'+json.dumps(nodes,separators=(',',':'),ensure_ascii=False)+'</script>\n'
    return h.replace('<link rel="preconnect"',tag+'<link rel="preconnect"',1) if '<link rel="preconnect"' in h else h.replace('</head>',tag+'</head>',1)

# price list read from the published /fees page
_fees=open(R+'fees.html').read()
_OFFERS=[]
for _n,_a in re.findall(r'<span class="nm">(.*?)</span><span class="dots"></span><span class="amt">(.*?)</span></div>',_fees):
    _p=_gbp(_a)
    if _p: _OFFERS.append((_txt(_n),_p,_txt(_a)))

for _f in sorted(_glob.glob(R+'*.html')+_glob.glob(R+'insights/*.html')):
    _h=open(_f).read()
    _slug=_f[len(R):-5]
    if _slug.startswith('google') or _slug=='404': continue
    _n=[_walk(x) for x in _blocks(_h)]
    if not _n: continue
    for _x in _n:
        if _x.get('@type')=='Service' and FEE1.get(_slug):
            _x['offers']={"@type":"Offer","name":FEE1[_slug][0],"priceCurrency":"GBP","price":_gbp(FEE1[_slug][1]),"description":"Starting fee. Fixed quote in writing before work begins. No VAT is added.","url":"https://nextgenca.co.uk/"+_slug}
        if _x.get('@type')=='Article':
            _x['publisher']={"@id":_ORG}
            _x.setdefault('inLanguage','en-GB')
    if _slug=='index':
        for _x in _n:
            if _x.get('@type')=='AccountingService':
                _x['founder']=_FOUNDER
                _x['employee']=[{"@id":_PER}]
                _x['identifier']={"@type":"PropertyValue","propertyID":"ICAEW firm number","value":"C011010236"}
                _x['memberOf']={"@type":"Organization","name":"Institute of Chartered Accountants in England and Wales (ICAEW)","url":"https://www.icaew.com/"}
                _x['knowsAbout']=["Limited company accounts","Corporation tax returns (CT600)","Self Assessment tax returns","VAT registration and returns","Payroll","Bookkeeping","Making Tax Digital","UK tax for non-residents","Outsourced accounting for accountancy firms"]
                _x['availableLanguage']=["en-GB"]
                _x['hasOfferCatalog']={"@type":"OfferCatalog","name":"Fixed starting fees","url":"https://nextgenca.co.uk/fees"}
                _x['contactPoint']={"@type":"ContactPoint","contactType":"customer service","telephone":"+447591246395","email":"info@nextgenca.co.uk","areaServed":"GB","availableLanguage":"en-GB"}
        _n=[x for x in _n if x.get('@type')!='FAQPage']
        _qs=re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',_h,re.S)
        if _qs: _n.append({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":_txt(q),"acceptedAnswer":{"@type":"Answer","text":_txt(a)}} for q,a in _qs]})
    if _slug=='fees' and _OFFERS:
        _n=[x for x in _n if x.get('@type')!='OfferCatalog']
        _n.append({"@context":"https://schema.org","@type":"OfferCatalog","name":"NextGen Chartered Accountant price list","url":"https://nextgenca.co.uk/fees","provider":{"@id":_ORG},
                   "itemListElement":[{"@type":"Offer","name":n,"priceCurrency":"GBP","price":p,"description":"Starting fee: "+a} for n,p,a in _OFFERS]})
    open(_f,'w').write(_put(_h,_n))

# llms.txt: a plain-text summary of the firm for AI assistants
def _h1(slug):
    try: return _txt(re.search(r'<h1>(.*?)</h1>',open(R+slug+'.html').read(),re.S).group(1))
    except Exception: return slug
_L=['# NextGen Chartered Accountant','',
'> NextGen Chartered Accountant is a UK firm of Chartered Accountants based in Luton, England. It is an ICAEW member firm (firm number C011010236). It works online with small businesses, limited companies, contractors, landlords and the self-employed across the United Kingdom, and with non-residents who have UK tax or company obligations. Fees are fixed and published. It is not connected with Accounts NextGen (Australia) or NextGen Accountants (New Zealand).','',
'## Key facts',
'- Name: NextGen Chartered Accountant (also written NextGen Chartered Accountants, NextGen CA)',
'- Website: https://nextgenca.co.uk/',
'- Type: firm of Chartered Accountants, sole practitioner, ICAEW member firm number C011010236',
'- Founder: Ahmed ACA (ICAEW). Team of ACCA-qualified accountants',
'- Based in: Luton, Bedfordshire, England. No London office. Works online with clients anywhere in the UK and abroad',
'- Hours: Monday to Saturday, 9am to 7pm UK time. Enquiries answered within 1 hour in those hours',
'- Pricing: fixed starting fees, published. Not VAT registered, so no VAT is added',
'- Software: Xero, QuickBooks, Sage, FreeAgent, Dext',
'- Verify: https://find.icaew.com/firms/luton/nextgen/Z1qgR7E','',
'## Services and starting fees']
for _s,_nm in NAMES.items():
    _f1=FEE1.get(_s)
    _L.append(f'- [{_nm}](https://nextgenca.co.uk/{_s})'+(f': from {_f1[1]} ({_f1[0]})' if _f1 else ''))
_L+=['- [Full price list](https://nextgenca.co.uk/fees)','- [All accounting services](https://nextgenca.co.uk/accounting-services-uk)','','## Guides and calculators']
for _s in GUIDE_SLUGS: _L.append(f'- [{_h1(_s)}](https://nextgenca.co.uk/{_s})')
_L+=['','## Latest tax and Companies House updates']
for _p in POSTS[:15]: _L.append(f'- [{_p["title"]}](https://nextgenca.co.uk/insights/{_p["slug"]}): {_p["summary"]}')
_L+=['- [All articles](https://nextgenca.co.uk/insights)','','## About and policies',
'- [About the firm and how to verify it](https://nextgenca.co.uk/about)','- [Privacy notice](https://nextgenca.co.uk/privacy)','- [Complaints procedure](https://nextgenca.co.uk/complaints)','',
'## Contact','Phone and WhatsApp: +44 7591 246395. Email: info@nextgenca.co.uk. Monday to Saturday, 9am to 7pm UK time.','']
open(R+'llms.txt','w').write('\n'.join(_L))

# robots.txt: search and AI crawlers are named so there is no doubt they are welcome
_BOTS=['Googlebot','Bingbot','Google-Extended','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User','Applebot','Applebot-Extended','CCBot','Amazonbot','meta-externalagent','DuckAssistBot','MistralAI-User']
open(R+'robots.txt','w').write('User-agent: *\nAllow: /\n\n# Search engines and AI assistants are welcome to read and cite this site\n'+''.join(f'User-agent: {b}\n' for b in _BOTS)+'Allow: /\n\nSitemap: https://nextgenca.co.uk/sitemap.xml\n')
print('aeo layer built')
