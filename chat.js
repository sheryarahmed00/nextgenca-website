(function(){
  // Live chat (tawk.to). If it cannot load, the WhatsApp launcher below is shown instead.
  var TAWK="https://embed.tawk.to/6afbe877a1383d3c7fcfb931/1k7k085dc";
  var done=false, usingFallback=false;
  function fallback(){ if(done) return; done=true; usingFallback=true; whatsappLauncher(); }
  function removeFallback(){ document.querySelectorAll(".ngc-btn,.ngc-box").forEach(function(e){e.remove();}); usingFallback=false; }
  window.Tawk_API=window.Tawk_API||{}; window.Tawk_LoadStart=new Date();
  window.Tawk_API.onLoad=function(){ done=true; if(usingFallback) removeFallback(); };
  var t=document.createElement("script"); t.async=true; t.src=TAWK; t.charset="UTF-8"; t.setAttribute("crossorigin","*");
  t.onerror=fallback;
  document.head.appendChild(t);

  function whatsappLauncher(){
  var WA="447591246395";
  var topics=[
    ["Self Assessment tax return","Hi NextGen, I need help with a Self Assessment tax return."],
    ["Limited company accounts","Hi NextGen, I need help with limited company accounts and corporation tax."],
    ["Bookkeeping or VAT","Hi NextGen, I need help with bookkeeping or VAT returns."],
    ["Payroll","Hi NextGen, I need help with payroll."],
    ["Outsourcing for my practice","Hi NextGen, I run an accountancy practice and want to discuss outsourcing."],
    ["Something else","Hi NextGen, I have a question."]
  ];
  var css=".ngc-btn{position:fixed;right:18px;bottom:18px;z-index:60;display:flex;align-items:center;gap:10px;background:#12284a;color:#fff;border:0;border-radius:999px;padding:13px 20px;font:700 .95rem Manrope,system-ui,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(11,27,52,.3)}"
  +".ngc-btn:hover{background:#0b1b34}.ngc-btn svg{width:20px;height:20px;fill:#e9dcbc}"
  +".ngc-box{position:fixed;right:18px;bottom:78px;z-index:60;width:min(340px,calc(100vw - 36px));background:#fff;border:1px solid #dfe4ec;border-radius:10px;box-shadow:0 18px 50px rgba(11,27,52,.28);font:400 .93rem/1.5 Manrope,system-ui,Arial,sans-serif;color:#1b2637;overflow:hidden}"
  +".ngc-box[hidden]{display:none}.ngc-head{background:#12284a;color:#fff;padding:16px 18px;border-bottom:3px solid #b8913f}.ngc-head b{display:block;font-size:1rem}.ngc-head span{font-size:.82rem;color:#c9d2e0}"
  +".ngc-body{padding:16px 18px}.ngc-msg{background:#f4f6fa;border-radius:8px;padding:11px 13px;margin:0 0 12px}"
  +".ngc-opt{display:block;width:100%;text-align:left;background:#fff;border:1px solid #dfe4ec;border-radius:6px;padding:10px 12px;margin:0 0 8px;font:600 .9rem Manrope,system-ui,Arial,sans-serif;color:#12284a;cursor:pointer;text-decoration:none}"
  +".ngc-opt:hover,.ngc-opt:focus-visible{border-color:#b8913f;background:#fbf8f0}.ngc-foot{padding:0 18px 16px;font-size:.8rem;color:#5a6679}.ngc-foot a{color:#12284a;font-weight:700}"
  +"@media print{.ngc-btn,.ngc-box{display:none}}";
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  var btn=document.createElement("button");btn.className="ngc-btn";btn.type="button";btn.setAttribute("aria-expanded","false");btn.setAttribute("aria-controls","ngcBox");
  btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg><span>Chat with us</span>';
  var box=document.createElement("div");box.className="ngc-box";box.id="ngcBox";box.hidden=true;box.setAttribute("role","dialog");box.setAttribute("aria-label","Chat with NextGen Chartered Accountant");
  var h='<div class="ngc-head"><b>NextGen Chartered Accountant</b><span>Mon to Sat, 9am to 7pm UK time</span></div><div class="ngc-body"><p class="ngc-msg">Hello. What do you need help with? Pick one and the chat opens in WhatsApp with our team.</p>';
  topics.forEach(function(t){h+='<a class="ngc-opt" target="_blank" rel="noopener" href="https://wa.me/'+WA+'?text='+encodeURIComponent(t[1])+'">'+t[0]+'</a>';});
  h+='</div><p class="ngc-foot">No WhatsApp? <a href="/#contact">Send a message</a> or email <a href="mailto:info@nextgenca.co.uk">info@nextgenca.co.uk</a>. Outside opening hours we reply the next working day.</p>';
  box.innerHTML=h;
  function toggle(open){box.hidden=!open;btn.setAttribute("aria-expanded",open);btn.querySelector("span").textContent=open?"Close chat":"Chat with us";}
  btn.addEventListener("click",function(){toggle(box.hidden);});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!box.hidden){toggle(false);btn.focus();}});
  document.body.appendChild(box);document.body.appendChild(btn);
  }
})();

  // Mobile call and WhatsApp bar
  (function(){try{var st=document.createElement("style");st.textContent=".ng-mbar{display:none}@media(max-width:720px){.ng-mbar{display:flex;position:fixed;left:12px;bottom:18px;z-index:59;gap:8px}.ng-mbar a{display:inline-flex;align-items:center;padding:12px 16px;border-radius:999px;font:700 .9rem Manrope,system-ui,Arial,sans-serif;text-decoration:none;color:#fff;box-shadow:0 8px 24px rgba(11,27,52,.3)}.ng-mbar .c{background:#12284a}.ng-mbar .w{background:#1f7a4d}}";document.head.appendChild(st);var d=document.createElement("div");d.className="ng-mbar";d.innerHTML='<a class="c" href="tel:+447591246395">Call</a><a class="w" href="https://wa.me/447591246395" target="_blank" rel="noopener">WhatsApp</a>';document.body.appendChild(d);}catch(e){}})();
