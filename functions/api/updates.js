// Latest HMRC and Companies House news from the official GOV.UK search API.
// Served at /api/updates and cached for one hour at the edge.
const API = "https://www.gov.uk/api/search.json?filter_organisations=hm-revenue-customs&filter_organisations=companies-house&filter_content_purpose_supergroup=news_and_communications&order=-public_timestamp&count=30&fields=title,link,public_timestamp,description,format,organisations";
const KEEP = new Set(["press_release", "news_story", "government_response", "statement_to_parliament", "speech"]);

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/updates?v=1", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let items = [];
  try {
    const r = await fetch(API, { headers: { "User-Agent": "nextgenca.co.uk updates feed" } });
    const j = await r.json();
    items = (j.results || [])
      .filter(x => KEEP.has(x.format))
      .slice(0, 8)
      .map(x => ({
        title: x.title,
        url: "https://www.gov.uk" + x.link,
        date: x.public_timestamp,
        summary: x.description || "",
        source: (x.organisations || []).some(o => (o.slug || o) === "companies-house") ? "Companies House" : "HMRC",
      }));
  } catch (e) {
    items = [];
  }
  const res = new Response(JSON.stringify({ updated: new Date().toISOString(), items }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
  if (items.length) context.waitUntil(cache.put(key, res.clone()));
  return res;
}
