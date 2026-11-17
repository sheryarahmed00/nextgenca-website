(function(){
  var box=document.getElementById("govuk-updates"); if(!box) return;
  var max=parseInt(box.getAttribute("data-max")||"8",10);
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function day(d){try{return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});}catch(e){return "";}}
  fetch("/api/updates").then(function(r){return r.json();}).then(function(j){
    var it=(j.items||[]).slice(0,max);
    if(!it.length) throw 0;
    box.innerHTML=it.map(function(x){
      return '<a class="upd" href="'+esc(x.url)+'" target="_blank" rel="noopener"><span class="upd-meta">'+esc(x.source)+' · '+esc(day(x.date))+'</span><b>'+esc(x.title)+'</b><span>'+esc(x.summary)+'</span></a>';
    }).join("");
  }).catch(function(){
    box.innerHTML='<p class="note">The live feed is not available right now. See the latest <a href="https://www.gov.uk/government/organisations/hm-revenue-customs">HMRC news on GOV.UK</a>.</p>';
  });
})();
