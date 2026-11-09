/* Dotvolt site — etkileşimler. Kütüphane yok. */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let T={};try{T=JSON.parse(document.getElementById("i18n").textContent)}catch(e){}
const TC=T.cmp||{c_cat:"Kategori",c_topo:"Teknoloji",c_phase:"Faz",c_range:"Güç aralığı",c_n:"Model sayısı",c_diff:"Farklı değerler mavi zeminle gösterilir."};
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Mobil menü */
$$(".burger").forEach(burger=>{const nav=burger.parentElement.querySelector(".mainnav");if(nav)burger.addEventListener("click",()=>{const o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)});});
/* Mega menü */
$$(".mm").forEach(m=>{const b=$("button",m);
  b.addEventListener("click",e=>{e.stopPropagation();const o=m.classList.toggle("open");b.setAttribute("aria-expanded",o);});
  if(window.matchMedia("(hover:hover) and (min-width:1081px)").matches){let t;
    m.addEventListener("mouseenter",()=>{clearTimeout(t);m.classList.add("open");b.setAttribute("aria-expanded",true)});
    m.addEventListener("mouseleave",()=>{t=setTimeout(()=>{m.classList.remove("open");b.setAttribute("aria-expanded",false)},180)});}
});
document.addEventListener("click",e=>{$$(".mm.open").forEach(m=>{if(!m.contains(e.target)){m.classList.remove("open");$("button",m).setAttribute("aria-expanded",false)}})});
document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".mm.open").forEach(m=>{m.classList.remove("open");$("button",m).focus()})});

/* ---------- Osiloskop (ana sayfa) ---------- */
const scope=$("#scope");
if(scope){
  const cv=$("canvas",scope), ctx=cv.getContext("2d");
  const cap=$(".scope-cap",scope.parentElement);
  const rd={in:$("#rd-in"),out:$("#rd-out"),t:$("#rd-t")};
  const leds={n:$(".led.n"),b:$(".led.b"),a:$(".led.a")};
  const MODES={
    normal:{cap:"Şebeke normal. Online UPS yükü yine de her an inverterden besler; çıkış şebekeden bağımsızdır.",in:"230 V",led:"n"},
    sag:{cap:"Voltaj düşümü ve harmonik bozulma. Çıkış ±%1 regülasyonla 230 V tam sinüste kalır.",in:"168 V",led:"n"},
    spike:{cap:"Ani gerilim darbeleri ve parazit. Çift dönüşüm, darbeyi yüke ulaşmadan süzer.",in:"230 V ±",led:"n"},
    out:{cap:"Şebeke kesildi. Akü devrede, aktarım süresi 0 ms — bağlı cihaz kesintiyi fark etmez.",in:"0 V",led:"b"}
  };
  let mode="normal", t=0, W=0, H=0, dpr=1;
  function size(){dpr=Math.min(window.devicePixelRatio||1,2);const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  size();window.addEventListener("resize",size);
  function grid(){
    ctx.strokeStyle="rgba(140,196,242,.09)";ctx.lineWidth=1;
    const cx=10,cy=8;
    for(let i=1;i<cx;i++){const x=Math.round(W*i/cx)+.5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let j=1;j<cy;j++){const y=Math.round(H*j/cy)+.5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="rgba(140,196,242,.22)";
    [H*.25,H*.75].forEach(y=>{ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(W,y+.5);ctx.stroke();});
  }
  function noise(x){return Math.sin(x*12.9898+t*.7)*43758.5453%1;}
  function inV(ph,x){
    const s=Math.sin(ph);
    if(mode==="normal") return s;
    if(mode==="sag") return .72*s + .08*Math.sin(ph*3) - .05*Math.sin(ph*5);
    if(mode==="spike"){let v=s+.05*Math.sin(ph*17+t*3); const k=(x*7+Math.floor(t*0.8))%53; if(k<1.2) v+= (k<.6?.8:-.6); return v;}
    if(mode==="out"){ return Math.abs(noise(x))*.03; }
    return s;
  }
  function trace(fn,y0,amp,col,glow){
    ctx.save();ctx.shadowColor=col;ctx.shadowBlur=glow;ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineJoin="round";ctx.beginPath();
    const cycles=3, step=2;
    for(let x=0;x<=W;x+=step){const ph=(x/W)*cycles*2*Math.PI - t; const y=y0 - fn(ph,x)*amp; x?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);grid();
    trace(inV,H*.25,H*.17,"#F2A41C",8);
    trace(ph=>Math.sin(ph),H*.75,H*.17,"#8CC4F2",10);
  }
  let raf;
  function loop(){t+=0.045;draw();raf=requestAnimationFrame(loop);}
  if(reduce){draw();}else{loop();}
  document.addEventListener("visibilitychange",()=>{if(reduce)return;if(document.hidden)cancelAnimationFrame(raf);else loop();});
  function set(m){
    mode=m;const M=MODES[m];
    $$(".modes button",scope.parentElement).forEach(b=>b.setAttribute("aria-pressed",b.dataset.mode===m));
    cap.textContent=M.cap; rd.in.textContent=M.in;
    Object.entries(leds).forEach(([k,el])=>el&&el.classList.toggle("on",k===M.led));
    if(reduce)draw();
  }
  $$(".modes button",scope.parentElement).forEach(b=>b.addEventListener("click",()=>set(b.dataset.mode)));
  set("normal");
}

/* ---------- Slide sayaçları ---------- */
function runCounters(root){
  if(!root)return;
  root.querySelectorAll("[data-count]").forEach(el=>{
    const to=+el.dataset.count, pre=el.dataset.prefix||"", suf=el.dataset.suffix||"", d=+(el.dataset.dur||1600), wait=+(el.dataset.delay||400);
    if(reduce){el.textContent=pre+to+suf;return;}
    clearTimeout(el._t);cancelAnimationFrame(el._r);el.textContent=pre+"0"+suf;
    el._t=setTimeout(()=>{const t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=pre+Math.round(to*e)+suf;if(k<1)el._r=requestAnimationFrame(f);};el._r=requestAnimationFrame(f);},wait);
  });
  root.querySelectorAll("[data-steps]").forEach(el=>{
    const st=el.dataset.steps.split(","), suf=el.dataset.suffix||"", ms=+(el.dataset.stepMs||1000), wait=+(el.dataset.delay||0);
    (el._ts||[]).forEach(clearTimeout);el._ts=[];
    if(reduce){el.textContent=st[st.length-1]+suf;return;}
    st.forEach((v,k)=>el._ts.push(setTimeout(()=>{el.textContent=v+suf;el.classList.remove("tick");void el.offsetWidth;el.classList.add("tick");},wait+k*ms)));
  });
}
/* ---------- Slider ---------- */
$$(".slider:not(.is-static)").forEach(sl=>{
  const slides=$$(".slide",sl), dots=$$(".sl-dots button",sl), pause=$(".sl-pause",sl);
  const MS=8000; sl.style.setProperty("--slide-ms",MS+"ms");
  let i=0,timer=null,user=false;
  const auto=!reduce;
  if(!auto)sl.classList.add("no-auto");
  function go(n,focus){
    n=(n+slides.length)%slides.length; if(n===i&&!focus)return;
    slides[i].classList.remove("is-active");slides[i].setAttribute("aria-hidden","true");
    slides[i].querySelectorAll("a,button").forEach(a=>a.tabIndex=-1);
    i=n;slides[i].classList.add("is-active");runCounters(slides[i]);slides[i].removeAttribute("aria-hidden");
    slides[i].querySelectorAll("a,button").forEach(a=>a.removeAttribute("tabindex"));
    sl.classList.toggle("on-dark",slides[i].classList.contains("s-dark"));
    dots.forEach((d,k)=>{d.setAttribute("aria-selected",k===i);const b=d.querySelector("i");if(b){b.style.animation="none";b.offsetWidth;b.style.animation="";}});
    restart();
  }
  function restart(){clearTimeout(timer);if(auto&&!sl.classList.contains("paused"))timer=setTimeout(()=>go(i+1),MS);}
  sl.classList.toggle("on-dark",slides[0].classList.contains("s-dark"));
  slides.forEach((s,k)=>{if(k){s.setAttribute("aria-hidden","true");s.querySelectorAll("a,button").forEach(a=>a.tabIndex=-1);}});
  dots.forEach((d,k)=>d.addEventListener("click",()=>go(k,true)));
  $(".sl-prev",sl).addEventListener("click",()=>go(i-1,true));
  $(".sl-next",sl).addEventListener("click",()=>go(i+1,true));
  function setPaused(p,byUser){if(byUser)user=p;sl.classList.toggle("paused",p);pause.setAttribute("aria-pressed",p);pause.setAttribute("aria-label",p?"Oynat":"Duraklat");if(p)clearTimeout(timer);else restart();}
  pause.addEventListener("click",()=>setPaused(!sl.classList.contains("paused"),true));
  sl.addEventListener("mouseenter",()=>{if(!user)setPaused(true)});
  sl.addEventListener("mouseleave",()=>{if(!user)setPaused(false)});
  sl.addEventListener("focusin",()=>{if(!user)setPaused(true)});
  sl.addEventListener("focusout",e=>{if(!user&&!sl.contains(e.relatedTarget))setPaused(false)});
  sl.addEventListener("keydown",e=>{if(e.key==="ArrowRight")go(i+1,true);if(e.key==="ArrowLeft")go(i-1,true);});
  let x0=null;sl.addEventListener("touchstart",e=>{x0=e.touches[0].clientX},{passive:true});
  sl.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)go(i+(dx<0?1:-1),true);x0=null;});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)clearTimeout(timer);else restart();});
  if(!auto)pause.hidden=true;
  restart();
});

/* ---------- Katalog filtreleme ---------- */
const cat=$("#catalog");
if(cat){
  const cards=$$(".pitem",cat), q=$("#q"), cnt=$("#cnt"), empty=$("#empty");
  const params=new URLSearchParams(location.search);
  if(params.get("kategori")){const el=$(`input[name=cat][value="${params.get("kategori")}"]`);if(el)el.checked=true;}
  function apply(){
    const cats=$$("input[name=cat]:checked").map(i=>i.value);
    const ph=$$("input[name=phase]:checked").map(i=>i.value);
    const pw=($("input[name=pw]:checked")||{}).value||"all";
    const term=(q.value||"").toLocaleLowerCase("tr").trim();
    let n=0;
    cards.forEach(c=>{
      const d=c.dataset; const lo=parseFloat(d.lo), hi=parseFloat(d.hi);
      let ok=true;
      if(cats.length&&!cats.includes(d.cat))ok=false;
      if(ph.length&&!ph.includes(d.phase))ok=false;
      if(pw!=="all"){
        if(isNaN(lo))ok=false;else{
          const [a,b]=pw.split("-").map(Number);
          if(hi<a||lo>b)ok=false;
        }
      }
      if(term&&!d.text.includes(term))ok=false;
      c.hidden=!ok; if(ok)n++;
    });
    cnt.textContent=n; empty.hidden=n>0;
  }
  $$("input",$(".filters")).forEach(i=>i.addEventListener("change",apply));
  q.addEventListener("input",apply);
  $("#reset")&&$("#reset").addEventListener("click",()=>{$$(".filters input").forEach(i=>{if(i.type==="checkbox")i.checked=false;if(i.type==="radio")i.checked=i.value==="all"});q.value="";apply();});
  apply();
}

/* ---------- Karşılaştırma ---------- */
if(cat&&$("#compare-data")){
  const C=JSON.parse($("#compare-data").textContent), bar=$("#cmpbar"), view=$("#cmpview");
  const boxes=$$(".cmp input",cat);
  const sel=()=>boxes.filter(b=>b.checked).map(b=>b.value);
  function upd(){const n=sel().length;$("#cmpn").textContent=n;bar.hidden=n===0;$("#cmpgo").disabled=n<2;
    boxes.forEach(b=>{b.disabled=!b.checked&&n>=3;});}
  boxes.forEach(b=>b.addEventListener("change",upd));
  $("#cmpclear").addEventListener("click",()=>{boxes.forEach(b=>b.checked=false);upd();});
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  $("#cmpgo").addEventListener("click",()=>{
    const S=sel().map(k=>C[k]);
    const keys=[];S.forEach(s=>Object.keys(s.specs).forEach(k=>{if(!keys.includes(k))keys.push(k)}));
    const row=(label,vals)=>{const d=new Set(vals).size>1;return `<tr><th scope="row">${esc(label)}</th>${vals.map(v=>`<td class="${d?"diff":""}">${esc(v)}</td>`).join("")}</tr>`;};
    let h=`<table class="cmptbl"><thead><tr><th></th>${S.map(s=>`<th scope="col"><img src="${s.img}" alt=""><a class="nm" href="${s.url}">${esc(s.name)}</a><span class="sb">${esc(s.sub)}</span></th>`).join("")}</tr></thead><tbody>`;
    h+=row(TC.c_cat,S.map(s=>s.cat))+row(TC.c_topo,S.map(s=>s.topo))+row(TC.c_phase,S.map(s=>s.phase))+row(TC.c_range,S.map(s=>s.range))+row(TC.c_n,S.map(s=>s.n||"—"));
    keys.forEach(k=>{h+=row(k,S.map(s=>s.specs[k]||"—"));});
    h+=`</tbody></table><p class="meta" style="margin-top:14px">${TC.c_diff}</p>`;
    $("#cmptable").innerHTML=h;view.hidden=false;document.body.style.overflow="hidden";$("#cmpclose").focus();
  });
  const close=()=>{view.hidden=true;document.body.style.overflow="";$("#cmpgo").focus();};
  $("#cmpclose").addEventListener("click",close);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!view.hidden)close();});
  upd();
}

/* ---------- Akü seçici ---------- */
const ak=$("#akusec");
if(ak){
  const A=JSON.parse($("#aku-data").textContent);
  const fmt=n=>String(n).replace(".",",");
  function calc(){
    const dv=$("input[name=brand]:checked").value==="dv";
    $("#st-dv").hidden=!dv;$("#st-ot").hidden=dv;
    let n,ah,note="",label;
    if(dv){const m=A.ups[$("#aku-model").value];n=m.n;ah=m.ah;note=m.note;label=$("#aku-model").value;}
    else{n=Math.max(1,parseInt($("#ot-n").value)||1);ah=parseFloat($("#ot-ah").value);label="Başka marka UPS";}
    const name=A.models[String(ah)]||("12 V "+fmt(ah)+" Ah");
    $("#aku-name").textContent=name;
    $("#aku-qty").textContent=n+" adet";
    $("#aku-total").textContent=dv?("Akü grubu "+(n*12)+" V nominal"):"";
    $("#aku-note").textContent=note;
    $("#aku-offer").href="iletisim.html?konu="+encodeURIComponent("Akü değişimi")+"&urun="+encodeURIComponent(label+" için "+n+" adet "+name);
  }
  $$("input,select",ak).forEach(i=>i.addEventListener("change",calc));$("#ot-n").addEventListener("input",calc);
  calc();
}

/* ---------- Ürün galerisi ---------- */
$$(".thumbs button").forEach(b=>b.addEventListener("click",()=>{
  const main=$(".pd-main img",b.closest(".pd-gal"));main.src=b.dataset.src;
  $$(".thumbs button",b.closest(".pd-gal")).forEach(x=>x.setAttribute("aria-pressed",x===b));
}));

/* Uzak görsel yüklenemezse yer tutucu */
function fb(img){if(img.dataset.failed)return;img.dataset.failed=1;if(img.dataset.fallback==="hide")img.classList.add("broken");else img.src=img.dataset.fallback;}
$$("img[data-fallback]").forEach(img=>{img.addEventListener("error",()=>fb(img));if(img.complete&&img.naturalWidth===0&&img.src)fb(img);});
$$(".ph").forEach(p=>{const i=$("img",p);if(i&&!i.classList.contains("broken"))i.addEventListener("load",()=>p.removeAttribute("data-name"),{once:true});if(i&&i.complete&&i.naturalWidth>0)p.removeAttribute("data-name");});

/* ---------- Formlar ---------- */
$$("form[data-form]").forEach(f=>{
  const msg=$(".form-msg",f);
  f.addEventListener("submit",async e=>{
    e.preventDefault();
    msg.className="form-msg";
    if(!f.checkValidity()){f.reportValidity();return;}
    const btn=$("button[type=submit]",f);btn.disabled=true;const old=btn.textContent;btn.textContent="Gönderiliyor…";
    try{
      const r=await fetch(f.action,{method:"POST",body:new FormData(f),headers:{"Accept":"application/json"}});
      const j=await r.json().catch(()=>({ok:false}));
      if(r.ok&&j.ok){msg.textContent=f.dataset.ok||"Talebiniz alındı. En kısa sürede size dönüş yapacağız.";msg.classList.add("ok");f.reset();}
      else throw new Error(j.error||"send");
    }catch(err){
      msg.textContent=location.hostname.indexOf("dotvolt")<0?"Önizleme modunda form gönderilmez. Canlı sunucuda bu form doğrudan Dotvolt'a e-posta olarak iletilir.":"Form gönderilemedi. Lütfen +90 216 706 95 80 numarasından bize ulaşın veya info@dotvolt.com.tr adresine yazın.";
      msg.classList.add("err");
    }finally{btn.disabled=false;btn.textContent=old;}
  });
});

/* ---------- Garanti sorgulama ---------- */
const gf=$("#garanti-form");
if(gf){gf.addEventListener("submit",e=>{e.preventDefault();const sn=$("#sn").value.trim();if(!sn){$("#sn").focus();return;}
  const url=gf.dataset.url;const m=$("#g-msg");m.className="form-msg ok";m.innerHTML="Seri numaranız: <b class=\"mono\"></b><br>Sorgulamayı tamamlamak için <a target=\"_blank\" rel=\"noopener\">garanti sistemini açın</a>.";$("b",m).textContent=sn;$("a",m).href=url;});}

/* ---------- UPS seçici ---------- */
const wiz=$("#wizard");
if(wiz){
  const DATA=JSON.parse($("#picker-data").textContent);
  const PRESETS=JSON.parse($("#preset-data").textContent);
  const rows=$("#loads");
  function addRow(name="",w=0,q=1){
    const r=document.createElement("div");r.className="load";
    r.innerHTML=`<select aria-label="Cihaz"><option value="">Cihaz seçin…</option>${PRESETS.map(p=>`<option value="${p[1]}">${p[0]}</option>`).join("")}<option value="custom">Diğer (watt girin)</option></select>
    <input type="number" min="0" step="10" inputmode="numeric" aria-label="Watt" placeholder="Watt" value="${w||""}">
    <input type="number" min="1" step="1" inputmode="numeric" aria-label="Adet" value="${q}">
    <button type="button" class="x" aria-label="Satırı sil">×</button>`;
    const [sel,wi,qi,x]=r.children;
    if(name){const o=[...sel.options].find(o=>o.text===name);if(o)sel.value=o.value;}
    sel.addEventListener("change",()=>{if(sel.value&&sel.value!=="custom")wi.value=sel.value;if(sel.value==="custom")wi.focus();calc();});
    [wi,qi].forEach(i=>i.addEventListener("input",calc));
    x.addEventListener("click",()=>{r.remove();calc();});
    rows.appendChild(r);
  }
  $("#addrow").addEventListener("click",()=>{addRow();});
  addRow("Masaüstü bilgisayar",300,1);addRow("Monitör",40,1);addRow("Modem / router",15,1);
  $$("input",wiz).forEach(i=>i.addEventListener("change",calc));
  const fmt=w=>w>=1000?(w/1000).toLocaleString("tr-TR",{maximumFractionDigits:1})+" kW":Math.round(w)+" W";
  function pick(list,need){return list.find(m=>m.w>=need);}
  function calc(){
    let total=0;$$(".load",rows).forEach(r=>{const w=parseFloat(r.children[1].value)||0,q=parseFloat(r.children[2].value)||0;total+=w*q;});
    const use=($("input[name=use]:checked",wiz)||{}).value||"home";
    const phase=($("input[name=ph]:checked",wiz)||{}).value||"1";
    const rt=($("input[name=rt]:checked",wiz)||{}).value||"std";
    const need=total*1.25;
    $("#need").textContent=fmt(need);$("#total").textContent=fmt(total);
    let series=null,model=null,why="",alt="";
    const S=k=>DATA[k];
    if(total<=0){$("#res").innerHTML=`<p class="res-note">Cihaz ekleyin; öneri burada oluşur.</p>`;return;}
    if(use==="rack"){series="volt-rt-plus";}
    else if((use==="home"||use==="game")&&need<=1800&&rt==="std"){series=use==="game"&&need<=900?"volt-ln-gaming":"volt-ln-plus";}
    else if(need<=3000&&phase==="1"){series="volt-mn-plus-1-3";}
    else if(need<=10000&&phase==="1"){series="volt-mn-plus-6-10";}
    else if(phase==="31"&&need<=18000){series="volt-tm";}
    else if(need<=27000){series=phase==="1"&&need<=10000?"volt-mn-plus-6-10":"volt-tr";}
    else if(need<=80000){series="volt-ex-40-80";}
    else if(need<=200000){series="volt-ex-100-200";}
    if(series==="volt-ln-gaming"){model={name:"Volt LN Gaming 1600",cap:"1600 VA"};}
    else if(series){const m=pick(S(series).models,need);model=m?{name:m.name,cap:m.cap}:null;}
    if(series==="volt-mn-plus-6-10"&&phase!=="1"){why="Trifaze yük yoksa monofaze online UPS yeterlidir.";}
    if(use==="med"||use==="server"){if(series==="volt-ln-plus"){series="volt-mn-plus-1-3";const m=pick(S(series).models,need);model=m?{name:m.name,cap:m.cap}:null;}why="Kritik yükte çıkışı şebekeden bağımsız online UPS öneriyoruz.";}
    if(rt==="long")alt="Uzun destek süresi için aküsüz (L) model + harici akü kabini gerekir. Akü sayısını projelendirme ekibimiz belirler.";
    if(!series||!model){
      $("#res").innerHTML=`<p class="res-note">Bu güç seviyesi (${fmt(need)}) proje bazında boyutlandırılır. Paralel Volt EX sistemleri ve jeneratör entegrasyonu için ekibimizle görüşün.</p><a class="btn btn-l" href="iletisim.html?konu=Projelendirme">Projelendirme talep et</a>`;return;}
    const s=S(series);
    $("#res").innerHTML=`<div class="res-card"><img src="${s.img}" alt=""><div><div class="s">${s.sub}</div><h4>${model.name}</h4><div>${model.cap} · ${s.topo}</div></div></div>
      ${why?`<p class="res-note">${why}</p>`:""}${alt?`<p class="res-note">${alt}</p>`:""}
      <div class="pd-ctas" style="margin-top:18px"><a class="btn btn-l btn-sm" href="${s.url}">Seriyi incele</a><a class="btn btn-o btn-sm" href="bayi-bulucu.html">Satış noktası bul</a></div>`;
  }
  calc();
}

/* ---------- Bayi bulucu ---------- */
const fd=$("#finder");
if(fd){
  const D=JSON.parse($("#dealer-data").textContent);
  const city=$("#city"), list=$("#dealers"), cnt=$("#dcnt");
  const LBL=T.dtypes||{merkez:"Genel merkez",satis:"Yetkili satış",servis:"Yetkili servis",online:"Online satış"};const TD=T.d||{};
  function render(){
    const c=city.value, types=$$("input[name=dtype]:checked").map(i=>i.value);
    const res=D.filter(d=>(!c||d.city===c)&&(!types.length||types.some(t=>d.types.includes(t))));
    cnt.textContent=res.length;
    list.innerHTML=res.map(d=>`<article class="dealer"><div><div>${d.types.map(t=>`<span class="badge ${t}">${LBL[t]}</span>`).join("")}</div>
      <h3>${d.name}</h3><div class="addr">${d.address}</div>${d.note?`<div style="font-size:14.5px">${d.note}</div>`:""}</div>
      <div class="acts">${d.phone?`<a class="btn btn-p btn-sm" href="tel:${d.phone.replace(/\s/g,"")}">${TD.d_call||"Ara"}</a>`:""}${d.web?`<a class="btn btn-o btn-sm" href="${d.web}" target="_blank" rel="noopener">${TD.d_shop||"Online mağaza"}</a>`:""}<a class="btn btn-o btn-sm" href="${d.maps}" target="_blank" rel="noopener">${TD.d_route||"Yol tarifi"}</a></div></article>`).join("")
      || `<div class="empty"><h3>${c?c+": ":""}${TD.d_none||"henüz listelenmiş nokta yok"}</h3><p>${TD.d_none_p||""}</p><a class="btn btn-p" href="${TD.d_none_url||"iletisim.html"}${c&&T.inBrowser!=="en"?"&il="+encodeURIComponent(c):""}">${TD.d_none_btn||"Bayi yönlendirmesi iste"}</a></div>`;
  }
  city.addEventListener("change",render);$$("input[name=dtype]").forEach(i=>i.addEventListener("change",render));
  render();
}

/* İletişim formunda konu ön doldurma */
const pf=new URLSearchParams(location.search);
if(pf.get("konu")&&$("#f-konu")){const s=$("#f-konu");const v=pf.get("konu");if(![...s.options].some(o=>o.value===v))s.add(new Option(v,v));s.value=v;}
if(pf.get("il")&&$("#f-il"))$("#f-il").value=pf.get("il");
if(pf.get("urun")&&$("#f-msg"))$("#f-msg").value=pf.get("urun")+(T.ask||" hakkında bilgi almak istiyorum.");
})();
