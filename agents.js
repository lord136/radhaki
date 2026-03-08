/* ═══════════════════════════════════════════════════════════════
   DIVYAM — agents.js  v4.0  (Super Search · Founder Edition)
   ─────────────────────────────────────────────────────────────
   NEW in v4.0:
   • Search-focus hides ALL below-bar UI (HUD, ribbon, hint-row,
     platforms, saved) → reappears when input is empty / blurred
   • Per-search rotating Gita slokas (never repeats in a session)
   • Futuristic Knowledge Results: layered cards, dynamic panels,
     multi-source info grouping, animated reveal
   • Free AI experiments: Pollinations.AI text inference (no key)
     + fallback to Wikipedia-based smart summaries
   • Fixed: logout now reliably clears state and redirects
   • Creative: cosmic-depth result cards, gradient shimmer tiles
═══════════════════════════════════════════════════════════════ */

(function DivyamAgentsV4() {
  'use strict';

  /* ── 1. CONSTANTS ───────────────────────────────────────────── */
  var AGENTS = [
    { id:'orion',  name:'Orion',  role:'Intent Researcher',    sym:'◎', color:'#FF7A00', glow:'rgba(255,122,0,.5)',    task:'Analyzing intent…',         done:'Intent mapped ✓' },
    { id:'nova',   name:'Nova',   role:'Platform Navigator',   sym:'◈', color:'#4285F4', glow:'rgba(66,133,244,.5)',  task:'Routing platforms…',        done:'Platforms ready ✓' },
    { id:'atlas',  name:'Atlas',  role:'Knowledge Researcher', sym:'◉', color:'#34A853', glow:'rgba(52,168,83,.5)',   task:'Fetching knowledge…',       done:'Knowledge loaded ✓' },
    { id:'vega',   name:'Vega',   role:'Discovery Explorer',   sym:'◇', color:'#9C27B0', glow:'rgba(156,39,176,.5)', task:'Exploring topics…',         done:'Topics discovered ✓' },
    { id:'helix',  name:'Helix',  role:'Platform Analyst',     sym:'⬡', color:'#F48024', glow:'rgba(244,128,36,.5)',  task:'Analysing content…',        done:'Insights extracted ✓' },
    { id:'zenith', name:'Zenith', role:'Context Interpreter',  sym:'◬', color:'#00BCD4', glow:'rgba(0,188,212,.5)',   task:'Interpreting context…',     done:'Context clarified ✓' },
    { id:'vyasa',  name:'Vyasa',  role:'Gita Wisdom Teller',   sym:'ॐ', color:'#D97706', glow:'rgba(217,119,6,.5)',   task:'Retrieving Gita wisdom…',   done:'Wisdom revealed ✓' }
  ];

  var INTENT_RULES = [
    { cat:'shopping',    agTag:'Platform Agent',  icon:'🛒', color:'#FF9900',
      kw:['buy','price','cheap','deal','discount','order','shop','cost','purchase','offer','sale','flipkart','amazon','myntra','deliver','shipping','coupon','emi','review of'] },
    { cat:'tutorial',    agTag:'Knowledge Agent', icon:'🎓', color:'#7C3AED',
      kw:['how to','tutorial','learn','guide','step by step','course','beginner','explained','introduction to','basics of','getting started','tips for','tricks','walkthrough'] },
    { cat:'programming', agTag:'Knowledge Agent', icon:'💻', color:'#F48024',
      kw:['error','bug','exception','undefined','null pointer','syntax','debug','code','function','api','library','framework','npm','pip','import','class','array','loop','async','await','promise','react','python','javascript','java','c++','rust','golang','sql','database','git','docker'] },
    { cat:'discussion',  agTag:'Discovery Agent', icon:'💬', color:'#FF4500',
      kw:['vs','versus','better','opinion','thoughts','recommend','which','should i','reddit','community','experience','review','pros cons','difference','compare','worth it','alternatives','best'] },
    { cat:'knowledge',   agTag:'Knowledge Agent', icon:'📖', color:'#3366CC',
      kw:['what is','who is','when was','where is','why does','define','meaning of','history of','biography','facts about','origin of','explain','describe','tell me about','wikipedia','how does','science','theory'] },
    { cat:'spiritual',   agTag:'Wisdom Agent',    icon:'🕉️', color:'#D97706',
      kw:['bhagavad gita','gita','krishna','arjuna','vedas','upanishad','dharma','karma','yoga','moksha','atman','brahman','meditation','mantra','sloka','verse','spiritual','hinduism','vedic','advaita','scripture','philosophy','soul','consciousness','self-realization','enlightenment','purpose of life','mind','wisdom','duty','truth','divine'] },
    { cat:'video',       agTag:'Platform Agent',  icon:'▶️', color:'#FF0000',
      kw:['watch','video','youtube','song','music','trailer','movie','episode','playlist','stream','podcast','listen','reel','shorts','vlog','interview','documentary'] },
    { cat:'local',       agTag:'Intent Agent',    icon:'🗺️', color:'#34A853',
      kw:['near me','nearby','location','restaurant','cafe','hospital','bank','atm','petrol','route','distance','navigate','directions','open now','address of'] }
  ];

  var PLATFORM_ROUTES = {
    shopping:    ['amazon','flipkart','myntra','google'],
    tutorial:    ['youtube','google','reddit','stackoverflow'],
    programming: ['stackoverflow','github','google','reddit'],
    discussion:  ['reddit','google','youtube','wikipedia'],
    knowledge:   ['wikipedia','google','youtube','reddit'],
    spiritual:   ['wikipedia','youtube','google','reddit'],
    video:       ['youtube','google','reddit'],
    local:       ['maps','google','reddit'],
    general:     ['google','wikipedia','youtube','reddit']
  };

  var PM = {
    amazon:        { name:'Amazon',        emoji:'🛒', color:'#FF9900', url:function(q){ return 'https://www.amazon.in/s?k='+encodeURIComponent(q); },                          reason:'Products & pricing' },
    flipkart:      { name:'Flipkart',      emoji:'🛍️', color:'#2874F0', url:function(q){ return 'https://www.flipkart.com/search?q='+encodeURIComponent(q); },                 reason:'Indian e-commerce' },
    myntra:        { name:'Myntra',        emoji:'👗', color:'#FF3F6C', url:function(q){ return 'https://www.myntra.com/'+encodeURIComponent(q); },                              reason:'Fashion & lifestyle' },
    youtube:       { name:'YouTube',       emoji:'▶️', color:'#FF0000', url:function(q){ return 'https://www.youtube.com/results?search_query='+encodeURIComponent(q); },       reason:'Video content' },
    google:        { name:'Google',        emoji:'🔍', color:'#4285F4', url:function(q){ return 'https://www.google.com/search?q='+encodeURIComponent(q); },                    reason:'Broad web search' },
    maps:          { name:'Maps',          emoji:'🗺️', color:'#34A853', url:function(q){ return 'https://www.google.com/maps/search/'+encodeURIComponent(q); },                 reason:'Local places' },
    stackoverflow: { name:'Stack Overflow',emoji:'📋', color:'#F48024', url:function(q){ return 'https://stackoverflow.com/search?q='+encodeURIComponent(q); },                 reason:'Developer Q&A' },
    reddit:        { name:'Reddit',        emoji:'🔴', color:'#FF4500', url:function(q){ return 'https://www.reddit.com/search/?q='+encodeURIComponent(q); },                    reason:'Community' },
    github:        { name:'GitHub',        emoji:'🐙', color:'#24292e', url:function(q){ return 'https://github.com/search?q='+encodeURIComponent(q); },                        reason:'Code & repos' },
    wikipedia:     { name:'Wikipedia',     emoji:'📖', color:'#3366CC', url:function(q){ return 'https://en.wikipedia.org/wiki/Special:Search?search='+encodeURIComponent(q); },reason:'Encyclopedia' }
  };

  /* ── Gita: rotating pool — session-unique verses ─── */
  var GITA_KW = ['bhagavad gita','gita','krishna','arjuna','dharma','karma','yoga','moksha','atman','brahman','meditation','mantra','sloka','verse','spiritual','vedas','upanishad','advaita','soul','consciousness','enlightenment','self-realization','divine','detachment','duty','truth','bhakti','jnana','vedic','purpose of life','mind','wisdom'];
  var GITA_TOPIC = { karma:{ch:2,v:47}, dharma:{ch:3,v:35}, yoga:{ch:6,v:5}, meditation:{ch:6,v:10}, death:{ch:2,v:20}, action:{ch:2,v:47}, peace:{ch:2,v:66}, devotion:{ch:9,v:22}, knowledge:{ch:4,v:38}, wisdom:{ch:4,v:38}, mind:{ch:6,v:5}, duty:{ch:3,v:35}, soul:{ch:2,v:20}, divine:{ch:9,v:22}, enlightenment:{ch:4,v:38}, purpose:{ch:3,v:30}, truth:{ch:4,v:1} };
  /* Large pool so each search shows a different verse */
  var GITA_FULL_POOL = [
    {ch:1,v:1},{ch:2,v:14},{ch:2,v:20},{ch:2,v:47},{ch:2,v:66},
    {ch:3,v:16},{ch:3,v:21},{ch:3,v:27},{ch:3,v:30},{ch:3,v:35},
    {ch:4,v:1},{ch:4,v:7},{ch:4,v:11},{ch:4,v:38},{ch:5,v:10},
    {ch:5,v:18},{ch:6,v:5},{ch:6,v:10},{ch:6,v:34},{ch:7,v:8},
    {ch:8,v:7},{ch:9,v:22},{ch:9,v:26},{ch:10,v:10},{ch:10,v:20},
    {ch:11,v:33},{ch:12,v:13},{ch:12,v:15},{ch:13,v:22},{ch:14,v:23},
    {ch:15,v:15},{ch:16,v:1},{ch:17,v:17},{ch:18,v:63},{ch:18,v:66}
  ];
  var _sessionSearchCount = 0;
  var _usedVerseIndices = [];

  function pickSessionVerse() {
    /* Reset if all used */
    if (_usedVerseIndices.length >= GITA_FULL_POOL.length) _usedVerseIndices = [];
    var available = GITA_FULL_POOL.map(function(_, i){ return i; }).filter(function(i){ return _usedVerseIndices.indexOf(i) === -1; });
    var pick = available[_sessionSearchCount % available.length];
    _usedVerseIndices.push(pick);
    _sessionSearchCount++;
    return GITA_FULL_POOL[pick];
  }

  function isGitaQ(q){ var l=q.toLowerCase(); return GITA_KW.some(function(k){ return l.includes(k); }); }
  function selectGitaRef(q){
    var l=q.toLowerCase();
    for(var t in GITA_TOPIC){ if(l.includes(t)) return GITA_TOPIC[t]; }
    var m=q.match(/\b(\d{1,2})[:.]?\s*(\d{1,3})\b/);
    if(m) return {ch:+m[1],v:+m[2]};
    return null;
  }

  /* ── 2. UTILITY ─────────────────────────────────────────────── */
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function detectIntent(q){
    var low=q.toLowerCase(), best=null, top=0;
    INTENT_RULES.forEach(function(r){
      var s=0; r.kw.forEach(function(k){ if(low.includes(k)) s+=k.split(' ').length; });
      if(s>top){ top=s; best=r; }
    });
    return best||{cat:'general',agTag:'Intent Agent',icon:'🔍',color:'#4285F4'};
  }

  function hexRgba(hex,a){
    var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  /* ── 3. API FETCHERS ─────────────────────────────────────────── */
  async function fetchGitaVerse(ch,v){
    try{
      var r=await fetch('https://vedicscriptures.github.io/slok/'+ch+'/'+v+'/');
      if(!r.ok) return null;
      return await r.json();
    }catch(e){ return null; }
  }

  async function fetchWikiLinks(q){
    try{
      var s=await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&srlimit=1&format=json&origin=*');
      var sd=await s.json();
      if(!sd.query||!sd.query.search||!sd.query.search.length) return [];
      var title=sd.query.search[0].title;
      var lr=await fetch('https://en.wikipedia.org/w/api.php?action=query&titles='+encodeURIComponent(title)+'&prop=links&pllimit=25&plnamespace=0&format=json&origin=*');
      var ld=await lr.json();
      var pages=ld.query&&ld.query.pages?ld.query.pages:{};
      var links=[];
      for(var pid in pages){ var pg=pages[pid]; if(pg.links) pg.links.forEach(function(l){ if(l.title&&!l.title.includes(':')&&!l.title.toLowerCase().includes('disambiguation')) links.push(l.title); }); }
      return links.slice(0,8);
    }catch(e){ return []; }
  }

  async function fetchWikiSearch(q){
    try{
      var r=await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&srlimit=4&srprop=snippet&format=json&origin=*');
      var d=await r.json();
      if(!d.query||!d.query.search||d.query.search.length<2) return [];
      return d.query.search.map(function(s){ return s.title+' — '+s.snippet.replace(/<[^>]+>/g,'').slice(0,80); });
    }catch(e){ return []; }
  }

  /* Free AI: Pollinations.AI — truly free, no API key needed */
  async function fetchPollinationsAI(prompt){
    try{
      var url='https://text.pollinations.ai/'+encodeURIComponent(prompt)+'?model=mistral&seed=42&json=false';
      var ctrl=new AbortController();
      var timeout=setTimeout(function(){ ctrl.abort(); },7000);
      var r=await fetch(url,{signal:ctrl.signal});
      clearTimeout(timeout);
      if(!r.ok) return null;
      var txt=await r.text();
      /* Trim to max 280 chars for card display */
      return txt&&txt.length>10 ? txt.trim().slice(0,280)+(txt.length>280?'…':'') : null;
    }catch(e){ return null; }
  }

  /* ── 4. INJECT STYLES ───────────────────────────────────────── */
  function injectStyles(){
    if(document.getElementById('dvag-style')) return;
    var el=document.createElement('style');
    el.id='dvag-style';
    el.textContent=
    /* ── Ambient ─────────────────────────── */
    '#dvag-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}'+
    '#dvag-mesh::before,#dvag-mesh::after{content:\'\';position:absolute;border-radius:50%;pointer-events:none}'+
    '#dvag-mesh::before{width:700px;height:700px;top:-20%;left:-15%;background:radial-gradient(circle,rgba(255,100,0,.042) 0%,transparent 65%);animation:dvMesh 22s ease-in-out infinite}'+
    '#dvag-mesh::after{width:580px;height:580px;bottom:-18%;right:-12%;background:radial-gradient(circle,rgba(255,155,40,.03) 0%,transparent 65%);animation:dvMesh 18s ease-in-out infinite reverse}'+
    '@keyframes dvMesh{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(3%,-4%) scale(1.07)}66%{transform:translate(-3%,3%) scale(.95)}}'+
    '#dvag-scanlines{position:fixed;inset:0;z-index:1;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.007) 2px,rgba(0,0,0,.007) 4px)}'+
    '.dark #dvag-scanlines{opacity:.55}'+
    '#dvag-aurora{position:fixed;top:0;left:0;right:0;z-index:1;pointer-events:none;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,122,0,.32) 40%,rgba(255,180,60,.42) 60%,transparent 100%);animation:dvAurora 9s ease-in-out infinite}'+
    '@keyframes dvAurora{0%,100%{opacity:.5;transform:scaleX(.8)}50%{opacity:1;transform:scaleX(1)}}'+

    /* ── Search-focus: hide below-bar UI ─── */
    '.dvag-focused #dvag-hud,.dvag-focused #dvag-ribbon,.dvag-focused .hint-row{opacity:0!important;transform:translateY(-6px)!important;pointer-events:none!important;transition:opacity .22s ease,transform .22s ease!important}'+

    /* ── HUD ─────────────────────────────── */
    '#dvag-hud{width:100%;max-width:700px;margin:20px auto 0;padding:0;position:relative;z-index:10;opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease}'+
    '#dvag-hud.hud-show{opacity:1;transform:none}'+
    '.dvag-hdr{display:flex;align-items:center;gap:10px;margin-bottom:13px}'+
    '.dvag-hdr-ttl{font-size:8.5px;font-weight:700;letter-spacing:.26em;color:var(--ink4);text-transform:uppercase;white-space:nowrap}'+
    '.dvag-hdr-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,122,0,.32),rgba(255,122,0,.06) 70%,transparent)}'+
    '.dvag-hdr-badge{font-size:8px;font-weight:800;letter-spacing:.16em;padding:3px 11px;border-radius:20px;background:rgba(255,122,0,.08);border:1px solid rgba(255,122,0,.2);color:var(--sf);text-transform:uppercase;white-space:nowrap}'+
    '.dvag-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}'+
    '@media(max-width:680px){.dvag-grid{grid-template-columns:repeat(4,1fr)}}'+
    '@media(max-width:440px){.dvag-grid{grid-template-columns:repeat(3,1fr);gap:5px}#dvag-hud{padding:0 2px}}'+
    '.dvag-tile{position:relative;display:flex;flex-direction:column;align-items:center;padding:11px 4px 9px;border-radius:14px;border:1.5px solid var(--border2);background:var(--sfbg);overflow:hidden;transition:border-color .3s,box-shadow .3s,background .3s;user-select:none}'+
    '.dvag-tile::before{content:\'\';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,var(--tc) 0%,transparent 70%);opacity:0;transition:opacity .4s;pointer-events:none}'+
    '.dvag-tile.tac{border-color:var(--tc)!important;box-shadow:0 0 18px -5px var(--tg)}'+
    '.dvag-tile.tac::before{opacity:.07}'+
    '.dvag-tile.tdn{border-color:rgba(34,197,94,.22)!important}'+
    '.dvag-tile.tdn::before{opacity:.02}'+
    '.dvag-tile::after{content:\'\';position:absolute;bottom:0;left:0;right:0;height:1.5px;opacity:0;transition:opacity .3s;background:linear-gradient(90deg,transparent,var(--tc),transparent)}'+
    '.dvag-tile.tac::after{opacity:.55;animation:dvBar 1.5s linear infinite}'+
    '.dvag-tile.tdn::after{opacity:.1;animation:none}'+
    '@keyframes dvBar{0%{background-position:200% 0}100%{background-position:-200% 0}}'+
    '.dvag-ring{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-family:\'Syne\',sans-serif;border:1.5px solid var(--tc);color:var(--tc);margin-bottom:7px;position:relative;transition:box-shadow .3s}'+
    '.dvag-tile.tac .dvag-ring{box-shadow:0 0 12px -3px var(--tg);animation:dvRingPulse 1.2s ease-in-out infinite}'+
    '@keyframes dvRingPulse{0%,100%{box-shadow:0 0 8px -3px var(--tg)}50%{box-shadow:0 0 20px 2px var(--tg)}}'+
    '.dvag-scan{position:absolute;inset:0;border-radius:50%;overflow:hidden;pointer-events:none}'+
    '.dvag-scan::after{content:\'\';position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--tc),transparent);opacity:0;top:-2px}'+
    '.dvag-tile.tac .dvag-scan::after{opacity:.85;animation:dvScan .95s linear infinite}'+
    '@keyframes dvScan{0%{top:-2px;opacity:0}12%{opacity:.85}88%{opacity:.85}100%{top:calc(100% + 2px);opacity:0}}'+
    '.dvag-dot{position:absolute;top:7px;right:7px;width:5px;height:5px;border-radius:50%;background:var(--border2);transition:background .3s,box-shadow .3s}'+
    '.dvag-tile.tac .dvag-dot{background:var(--tc);box-shadow:0 0 5px 1px var(--tg);animation:dvDotBlink .65s ease-in-out infinite}'+
    '.dvag-tile.tdn .dvag-dot{background:#22c55e;box-shadow:0 0 4px rgba(34,197,94,.5)}'+
    '@keyframes dvDotBlink{0%,100%{opacity:1}50%{opacity:.2}}'+
    '.dvag-nm{font-size:10.5px;font-weight:800;color:var(--ink);font-family:\'Syne\',sans-serif;letter-spacing:.03em;text-align:center;transition:color .3s}'+
    '.dvag-tile.tac .dvag-nm{color:var(--tc)}'+
    '.dvag-rl{font-size:8px;color:var(--ink4);text-align:center;line-height:1.3;margin-top:2px;letter-spacing:.01em}'+
    '.dvag-tk{font-size:7.5px;color:var(--ink4);margin-top:4px;text-align:center;min-height:9px;transition:color .3s;letter-spacing:.02em;line-height:1.2}'+
    '.dvag-tile.tac .dvag-tk{color:var(--tc);opacity:.85}'+
    '.dvag-tile.tdn .dvag-tk{color:#22c55e;opacity:.7}'+

    /* ── Gita Wisdom Ribbon ───────────────── */
    '#dvag-ribbon{width:100%;max-width:700px;margin:12px auto 0;position:relative;z-index:10;opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease}'+
    '#dvag-ribbon.rbn-show{opacity:1;transform:none}'+
    '.dvag-rbn-inner{display:flex;align-items:flex-start;gap:13px;padding:13px 17px;background:linear-gradient(135deg,rgba(217,119,6,.06) 0%,rgba(255,122,0,.025) 100%);border:1px solid rgba(217,119,6,.2);border-radius:15px;position:relative;overflow:hidden}'+
    '.dvag-rbn-inner::before{content:\'\';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#D97706 0%,rgba(217,119,6,.25) 100%);border-radius:3px 0 0 3px}'+
    '.dvag-rbn-inner::after{content:\'\';position:absolute;inset:0;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.03),transparent 55%)}'+
    '.dvag-rbn-om{font-size:19px;flex-shrink:0;line-height:1;filter:drop-shadow(0 0 6px rgba(217,119,6,.35));animation:dvOmGlow 3.5s ease-in-out infinite;margin-top:1px}'+
    '@keyframes dvOmGlow{0%,100%{filter:drop-shadow(0 0 4px rgba(217,119,6,.3))}50%{filter:drop-shadow(0 0 11px rgba(217,119,6,.65))}}'+
    '.dvag-rbn-body{flex:1;min-width:0}'+
    '.dvag-rbn-tag{display:inline-flex;align-items:center;gap:5px;font-size:8px;font-weight:800;letter-spacing:.18em;color:#D97706;text-transform:uppercase;margin-bottom:5px}'+
    '.dvag-rbn-tag::before{content:\'\';width:4px;height:4px;border-radius:50%;background:#D97706;flex-shrink:0;animation:dvDotBlink .9s ease-in-out infinite}'+
    '.dvag-rbn-ref{font-size:8.5px;font-weight:700;letter-spacing:.1em;color:rgba(217,119,6,.55);text-transform:uppercase;margin-bottom:4px}'+
    '.dvag-rbn-skt{font-size:12px;font-weight:700;font-family:serif;color:var(--ink);line-height:1.85;margin-bottom:4px;opacity:.88}'+
    '.dvag-rbn-tr{font-size:12px;color:var(--ink2);line-height:1.6;font-style:italic}'+
    '.dvag-rbn-load{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink4)}'+
    '.dvag-rbn-spin{width:11px;height:11px;border-radius:50%;border:1.5px solid rgba(217,119,6,.2);border-top-color:#D97706;animation:spin .8s linear infinite;flex-shrink:0}'+
    '.dvag-rbn-toggle{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1px solid rgba(217,119,6,.18);background:rgba(217,119,6,.06);display:flex;align-items:center;justify-content:center;font-size:12px;color:rgba(217,119,6,.55);cursor:pointer;transition:background .2s;margin-top:1px;font-family:\'DM Sans\',sans-serif;line-height:1}'+
    '.dvag-rbn-toggle:hover{background:rgba(217,119,6,.13);color:#D97706}'+

    /* ── Dropdown agent section ───────────── */
    '#dvag-drop-section{border-top:1px solid var(--border2);padding:10px 14px 12px}'+
    '.dvag-drop-hdr{display:flex;align-items:center;gap:8px;margin-bottom:9px}'+
    '.dvag-drop-tag{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;letter-spacing:.15em;padding:2px 8px;border-radius:20px;text-transform:uppercase}'+
    '.dvag-drop-chips{display:flex;flex-wrap:wrap;gap:6px}'+
    '.dvag-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;border:1.5px solid;font-size:12px;font-weight:600;background:none;transition:transform .2s var(--sp),background .2s;font-family:\'DM Sans\',sans-serif;cursor:pointer;animation:chin .22s ease both;white-space:nowrap}'+
    '.dvag-chip:hover{transform:translateY(-2px) scale(1.04)}'+
    '.dvag-drop-section-lbl{font-size:8px;font-weight:700;letter-spacing:.15em;color:var(--ink4);text-transform:uppercase;margin:8px 0 6px;display:flex;align-items:center;gap:6px}'+
    '.dvag-drop-section-lbl::before{content:\'\';width:3px;height:3px;border-radius:50%;background:var(--ink4);flex-shrink:0}'+

    /* ── Cinema overlay ───────────────────── */
    '#dvag-cinema{position:fixed;inset:0;z-index:6000;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s ease;background:var(--bg0);overflow:hidden}'+
    '#dvag-cinema.cin-on{opacity:1;pointer-events:all}'+
    '#dvag-cinema::before{content:\'\';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.014) 2px,rgba(0,0,0,.014) 4px)}'+
    '.cin-ring{position:absolute;border-radius:50%;pointer-events:none;left:50%;top:50%;transform:translate(-50%,-50%)}'+
    '.cin-r1{width:380px;height:380px;border:1px solid rgba(255,122,0,.07)}'+
    '.cin-r2{width:530px;height:530px;border:1px solid rgba(255,122,0,.05);animation:cinRot 16s linear infinite}'+
    '.cin-r3{width:680px;height:680px;border:1px solid rgba(255,122,0,.03);animation:cinRot 24s linear infinite reverse}'+
    '.cin-r4{width:830px;height:830px;border:1px solid rgba(255,122,0,.015);animation:cinRot 34s linear infinite}'+
    '@keyframes cinRot{to{transform:translate(-50%,-50%) rotate(360deg)}}'+
    '.cin-bk{position:absolute;width:40px;height:40px;pointer-events:none;opacity:.35}'+
    '.cin-bk-tl{top:20px;left:20px}.cin-bk-tr{top:20px;right:20px;transform:scaleX(-1)}.cin-bk-br{bottom:20px;right:20px;transform:scale(-1)}.cin-bk-bl{bottom:20px;left:20px;transform:scaleY(-1)}'+
    '.cin-logo{font-size:12px;font-weight:800;letter-spacing:.3em;color:var(--sf);font-family:\'Syne\',sans-serif;text-transform:uppercase;margin-bottom:4px;position:relative;z-index:2}'+
    '.cin-sub{font-size:8px;font-weight:700;letter-spacing:.26em;color:var(--ink4);text-transform:uppercase;margin-bottom:28px;position:relative;z-index:2}'+
    '.cin-qry{font-size:clamp(14px,3vw,20px);font-weight:800;font-family:\'Syne\',sans-serif;color:var(--ink);letter-spacing:-.02em;max-width:500px;text-align:center;margin-bottom:28px;padding:0 24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative;z-index:2}'+
    '.cin-list{display:flex;flex-direction:column;width:min(440px,90vw);position:relative;z-index:2}'+
    '.cin-row{display:flex;align-items:center;gap:12px;padding:6px 16px;border-radius:11px;opacity:0;transform:translateX(-10px);transition:opacity .28s ease,transform .28s ease,background .2s}'+
    '.cin-row.cr-on{opacity:1;transform:none;background:rgba(255,122,0,.032)}'+
    '.cin-row.cr-done{opacity:.42;transform:none}'+
    '.cin-ico{width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-family:\'Syne\',sans-serif;border:1.5px solid currentColor;flex-shrink:0;transition:box-shadow .3s}'+
    '.cin-row.cr-on .cin-ico{box-shadow:0 0 10px -2px var(--cv);animation:dvRingPulse 1.1s ease-in-out infinite}'+
    '.cin-row.cr-done .cin-ico{border-color:#22c55e!important;color:#22c55e!important;box-shadow:none!important;animation:none!important}'+
    '.cin-info{flex:1;min-width:0}'+
    '.cin-nm{font-size:11.5px;font-weight:800;font-family:\'Syne\',sans-serif;letter-spacing:.05em}'+
    '.cin-task{font-size:9.5px;color:var(--ink4);margin-top:1px}'+
    '.cin-row.cr-on .cin-task{color:var(--cv);opacity:.8}'+
    '.cin-row.cr-done .cin-task{color:#22c55e!important;opacity:.7}'+
    '.cin-spin{width:11px;height:11px;border-radius:50%;border:2px solid rgba(0,0,0,.1);animation:spin .65s linear infinite;flex-shrink:0;display:none}'+
    '.cin-row.cr-on .cin-spin{display:block}'+
    '.cin-chk{color:#22c55e;font-size:12px;display:none;flex-shrink:0}'+
    '.cin-row.cr-done .cin-chk{display:block}'+
    '.cin-row.cr-done .cin-spin{display:none!important}'+
    '.cin-prog{margin-top:24px;width:min(440px,90vw);position:relative;z-index:2}'+
    '.cin-prog-lbl{font-size:8.5px;font-weight:700;letter-spacing:.14em;color:var(--ink4);text-transform:uppercase;margin-bottom:6px;display:flex;justify-content:space-between}'+
    '.cin-bar-track{height:2.5px;border-radius:3px;background:var(--border2);overflow:hidden}'+
    '.cin-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#FF6600,#FFB347,#FF7A00);background-size:200% 100%;width:0%;transition:width .3s cubic-bezier(.4,0,.2,1);animation:dvBarShimmer 2s linear infinite}'+
    '@keyframes dvBarShimmer{0%{background-position:0%}100%{background-position:200%}}'+

    /* ── Knowledge page agent panels ──────── */
    '.dvag-kp{background:var(--glass);backdrop-filter:blur(20px);border:1.5px solid var(--border2);border-radius:22px;padding:20px 24px;margin-bottom:16px;animation:kpPanelIn .38s var(--sp)}'+
    '.dvag-kph{display:flex;align-items:center;gap:8px;margin-bottom:14px}'+
    '.dvag-kpt{font-size:10px;font-weight:700;letter-spacing:.12em;color:var(--ink3);text-transform:uppercase}'+
    '.dvag-kps{margin-left:auto;font-size:10px;color:var(--ink4)}'+
    '.dvag-kspin{width:14px;height:14px;border:2px solid rgba(255,122,0,.22);border-top-color:var(--sf);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}'+

    /* ── FUTURISTIC RESULTS FEED ────────────── */
    /* AI Insight card */
    '#dvag-ai-panel{background:linear-gradient(148deg,rgba(255,122,0,.09),rgba(255,60,0,.04));border:1.5px solid rgba(255,122,0,.32);border-radius:22px;padding:22px 24px;margin-bottom:16px;position:relative;overflow:hidden;animation:kpPanelIn .3s var(--sp)}'+
    '#dvag-ai-panel::before{content:\'\';position:absolute;top:-30px;right:-30px;width:140px;height:140px;background:radial-gradient(circle,rgba(255,122,0,.12),transparent 70%);pointer-events:none}'+
    '#dvag-ai-panel::after{content:\'\';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,122,0,.5),transparent);animation:dvAurora 4s ease-in-out infinite}'+
    '.dvag-ai-hdr{display:flex;align-items:center;gap:9px;margin-bottom:13px}'+
    '.dvag-ai-badge{font-size:8px;font-weight:800;letter-spacing:.15em;padding:3px 10px;border-radius:20px;background:rgba(255,122,0,.12);border:1px solid rgba(255,122,0,.28);color:var(--sf);text-transform:uppercase}'+
    '.dvag-ai-free{font-size:8px;color:var(--ink4);margin-left:auto;padding:2px 7px;border-radius:10px;background:rgba(52,168,83,.08);border:1px solid rgba(52,168,83,.18);color:#34A853}'+
    '.dvag-ai-text{font-size:13.5px;color:var(--ink2);line-height:1.75;position:relative;z-index:1}'+

    /* Multi-source cards grid */
    '#dvag-msrc{margin-bottom:16px}'+
    '.dvag-msrc-hdr{font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--ink4);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}'+
    '.dvag-msrc-hdr::after{content:\'\';flex:1;height:1px;background:linear-gradient(90deg,var(--border2),transparent)}'+
    '.dvag-src-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}'+
    '.dvag-src-card{background:var(--glass);border:1.5px solid var(--border2);border-radius:16px;padding:14px;cursor:pointer;transition:all .22s;position:relative;overflow:hidden;text-decoration:none;display:block}'+
    '.dvag-src-card::before{content:\'\';position:absolute;inset:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,122,0,.04),transparent 70%);opacity:0;transition:opacity .3s;pointer-events:none}'+
    '.dvag-src-card:hover{transform:translateY(-3px);border-color:rgba(255,122,0,.28);box-shadow:0 12px 32px -8px rgba(255,122,0,.15)}'+
    '.dvag-src-card:hover::before{opacity:1}'+
    '.dvag-src-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}'+
    '.dvag-src-ico{font-size:18px;flex-shrink:0}'+
    '.dvag-src-name{font-size:12px;font-weight:700;color:var(--ink)}'+
    '.dvag-src-reason{font-size:11px;color:var(--ink3);margin-bottom:8px;line-height:1.4}'+
    '.dvag-src-bar{height:2px;border-radius:2px;background:var(--border2);overflow:hidden;margin-top:auto}'+
    '.dvag-src-bar-fill{height:100%;border-radius:2px;transition:width .8s cubic-bezier(.4,0,.2,1)}'+
    '.dvag-src-action{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;margin-top:8px;color:var(--ink3)}'+
    '.dvag-src-card:hover .dvag-src-action{color:var(--sf)}'+

    /* Layered knowledge timeline */
    '#dvag-timeline{margin-bottom:16px}'+
    '.dvag-tl-hdr{font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--ink4);text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px}'+
    '.dvag-tl-hdr::after{content:\'\';flex:1;height:1px;background:linear-gradient(90deg,var(--border2),transparent)}'+
    '.dvag-tl-item{display:flex;gap:14px;position:relative;padding-bottom:14px}'+
    '.dvag-tl-item:not(:last-child)::before{content:\'\';position:absolute;left:13px;top:26px;bottom:0;width:1px;background:linear-gradient(180deg,rgba(255,122,0,.25),transparent)}'+
    '.dvag-tl-dot{width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;border:1.5px solid;transition:box-shadow .3s}'+
    '.dvag-tl-body{flex:1;padding-top:3px}'+
    '.dvag-tl-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px}'+
    '.dvag-tl-content{font-size:13px;color:var(--ink2);line-height:1.6}'+

    /* Gita wisdom on knowledge page — enhanced */
    '#dvag-gita-kp{border-color:rgba(217,119,6,.32)!important;background:linear-gradient(148deg,rgba(217,119,6,.06),rgba(180,83,9,.025))!important}'+
    '.dvag-gita-verse{font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.9;font-family:serif;margin-bottom:13px;padding:14px 16px;background:rgba(217,119,6,.07);border-radius:12px;border-left:3px solid #D97706;position:relative}'+
    '.dvag-gita-verse::before{content:\'\\201C\';position:absolute;top:-8px;left:10px;font-size:36px;color:rgba(217,119,6,.2);font-family:serif;line-height:1}'+

    /* Wisdom panel on search page (after each search) */
    '#dvag-wisdom-bar{width:100%;max-width:700px;margin:10px auto 0;z-index:10;opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease;display:none}'+
    '#dvag-wisdom-bar.wis-show{opacity:1;transform:none;display:block}'+
    '.dvag-wis-inner{padding:11px 16px;background:linear-gradient(135deg,rgba(217,119,6,.055),rgba(255,122,0,.02));border:1px solid rgba(217,119,6,.18);border-radius:13px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:background .2s}'+
    '.dvag-wis-inner:hover{background:linear-gradient(135deg,rgba(217,119,6,.09),rgba(255,122,0,.04))}'+
    '.dvag-wis-om{font-size:16px;flex-shrink:0;animation:dvOmGlow 3s ease-in-out infinite}'+
    '.dvag-wis-ref{font-size:9px;font-weight:700;color:#D97706;letter-spacing:.09em;text-transform:uppercase;margin-bottom:2px}'+
    '.dvag-wis-text{font-size:12px;color:var(--ink2);line-height:1.5;font-style:italic;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}'+
    '.dvag-wis-expand{flex-shrink:0;width:18px;height:18px;border-radius:50%;background:rgba(217,119,6,.1);border:1px solid rgba(217,119,6,.2);display:flex;align-items:center;justify-content:center;font-size:10px;color:#D97706}'+

    /* @keyframes shared */
    '@keyframes kpPanelIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}'+
    '@keyframes chin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'+
    '@keyframes spin{to{transform:rotate(360deg)}}';

    document.head.appendChild(el);
  }

  /* ── 5. AMBIENT CHROME ──────────────────────────────────────── */
  function buildAmbient(){
    if(document.getElementById('dvag-mesh')) return;
    ['dvag-mesh','dvag-scanlines','dvag-aurora'].forEach(function(id){
      var d=document.createElement('div'); d.id=id;
      document.body.prepend(d);
    });
  }

  /* ── 6. SEARCH-FOCUS HIDE LOGIC ─────────────────────────────── */
  function initSearchFocusHide(){
    var inp = document.getElementById('sb-input');
    if(!inp || inp._dvFocusHooked) return;
    inp._dvFocusHooked = true;

    var sp = document.getElementById('search-page');

    function onFocus(){
      if(sp) sp.classList.add('dvag-focused');
    }
    function onBlur(){
      /* Only remove if input is empty */
      setTimeout(function(){
        var val = inp.value || '';
        if(!val.trim() && sp) sp.classList.remove('dvag-focused');
      }, 150);
    }
    function onInput(){
      var val = inp.value || '';
      if(val.trim().length > 0){
        if(sp) sp.classList.add('dvag-focused');
      } else {
        if(sp) sp.classList.remove('dvag-focused');
      }
    }

    inp.addEventListener('focus', onFocus);
    inp.addEventListener('blur',  onBlur);
    inp.addEventListener('input', onInput);
  }

  /* ── 7. AGENT HUD ───────────────────────────────────────────── */
  function buildHUD(){
    if(document.getElementById('dvag-hud')) return;
    var hud=document.createElement('div');
    hud.id='dvag-hud';
    hud.innerHTML=
      '<div class="dvag-hdr">'+
        '<span class="dvag-hdr-ttl">Agent Network</span>'+
        '<span class="dvag-hdr-line"></span>'+
        '<span class="dvag-hdr-badge">7 Agents Active</span>'+
      '</div>'+
      '<div class="dvag-grid">'+
      AGENTS.map(function(ag){
        return '<div class="dvag-tile" id="dvt-'+ag.id+'" style="--tc:'+ag.color+';--tg:'+ag.glow+'">'+
          '<div class="dvag-dot"></div>'+
          '<div class="dvag-ring">'+ag.sym+'<div class="dvag-scan"></div></div>'+
          '<div class="dvag-nm">'+ag.name+'</div>'+
          '<div class="dvag-rl">'+ag.role+'</div>'+
          '<div class="dvag-tk" id="dvtk-'+ag.id+'">Standby</div>'+
        '</div>';
      }).join('')+
      '</div>';
    var sb=document.getElementById('desktop-search');
    if(sb&&sb.parentNode){ sb.parentNode.insertBefore(hud,sb.nextSibling); }
    else { var sp=document.getElementById('search-page'); if(sp) sp.appendChild(hud); }
    requestAnimationFrame(function(){ setTimeout(function(){ hud.classList.add('hud-show'); },250); });
  }

  function tSet(id,st){
    var c=document.getElementById('dvt-'+id);
    var t=document.getElementById('dvtk-'+id);
    var ag=AGENTS.find(function(a){ return a.id===id; });
    if(c){ c.classList.remove('tac','tdn'); if(st==='active') c.classList.add('tac'); if(st==='done') c.classList.add('tdn'); }
    if(t) t.textContent=(st==='active'?(ag&&ag.task||'Working…'):(st==='done'?(ag&&ag.done||'Done'):'Standby'));
  }
  function allStandby(){ AGENTS.forEach(function(ag){ tSet(ag.id,'idle'); }); }

  /* ── 8. GITA RIBBON ─────────────────────────────────────────── */
  var _ribbonBuilt=false, _ribbonLoaded=false;

  function buildRibbon(){
    if(document.getElementById('dvag-ribbon')) return;
    var r=document.createElement('div');
    r.id='dvag-ribbon';
    r.innerHTML=
      '<div class="dvag-rbn-inner">'+
        '<div class="dvag-rbn-om">ॐ</div>'+
        '<div class="dvag-rbn-body">'+
          '<div class="dvag-rbn-tag">Vyasa · Gita Wisdom</div>'+
          '<div id="dvag-rbn-content"><div class="dvag-rbn-load"><div class="dvag-rbn-spin"></div>Loading today\'s wisdom…</div></div>'+
        '</div>'+
        '<button class="dvag-rbn-toggle" id="dvag-rbn-btn" title="Toggle">−</button>'+
      '</div>';
    var hud=document.getElementById('dvag-hud');
    if(hud&&hud.parentNode){ hud.parentNode.insertBefore(r,hud.nextSibling); }
    var btn=document.getElementById('dvag-rbn-btn');
    var content=document.getElementById('dvag-rbn-content');
    var collapsed=false;
    if(btn&&content){
      btn.addEventListener('click',function(){
        collapsed=!collapsed;
        content.style.display=collapsed?'none':'block';
        btn.textContent=collapsed?'+':'−';
      });
    }
    requestAnimationFrame(function(){ setTimeout(function(){ r.classList.add('rbn-show'); },400); });
    if(!_ribbonLoaded){ _ribbonLoaded=true; loadRibbonVerse(); }
    _ribbonBuilt=true;
  }

  async function loadRibbonVerse(){
    var ref=pickSessionVerse();
    var data=await fetchGitaVerse(ref.ch,ref.v);
    var c=document.getElementById('dvag-rbn-content');
    if(!c) return;
    if(!data){ c.innerHTML='<div class="dvag-rbn-tr" style="font-style:normal;opacity:.55">Wisdom loads momentarily…</div>'; return; }
    renderRibbonData(c, data, ref);
  }

  function renderRibbonData(c, data, ref){
    var skt=data.slok||'';
    var tr=(data.tej&&data.tej.et)||(data.siva&&data.siva.et)||(data.purohit&&data.purohit.et)||'';
    c.innerHTML=
      '<div class="dvag-rbn-ref">Bhagavad Gita '+ref.ch+'.'+ref.v+'</div>'+
      (skt?'<div class="dvag-rbn-skt">'+esc(skt.slice(0,110))+(skt.length>110?'…':'')+'</div>':'')+
      (tr?'<div class="dvag-rbn-tr">'+esc(tr.slice(0,160))+(tr.length>160?'…':'')+'</div>':'');
  }

  /* Per-search: show a NEW verse every time */
  async function updateRibbonForQuery(query){
    var ref=selectGitaRef(query)||pickSessionVerse();
    var data=await fetchGitaVerse(ref.ch,ref.v);
    var c=document.getElementById('dvag-rbn-content');
    if(!c||!data) return;
    c.style.opacity='0'; c.style.transition='opacity .25s';
    setTimeout(function(){
      renderRibbonData(c, data, ref);
      c.style.opacity='1';
      setTimeout(function(){ c.style.transition=''; },300);
    },200);
  }

  /* ── 9. WISDOM BAR (shown below results feed) ────────────────── */
  function buildWisdomBar(){
    if(document.getElementById('dvag-wisdom-bar')) return;
    var wb=document.createElement('div');
    wb.id='dvag-wisdom-bar';
    wb.innerHTML=
      '<div class="dvag-wis-inner" onclick="document.getElementById(\'dvag-wisdom-bar\').classList.toggle(\'expanded\')">'+
        '<div class="dvag-wis-om">ॐ</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="dvag-wis-ref" id="dvag-wis-ref">Bhagavad Gita · Loading…</div>'+
          '<div class="dvag-wis-text" id="dvag-wis-text">Retrieving sacred wisdom…</div>'+
        '</div>'+
        '<div class="dvag-wis-expand">✦</div>'+
      '</div>'+
      '<div id="dvag-wis-full" style="display:none;padding:12px 14px 14px;font-size:13px;color:var(--ink2);line-height:1.7;background:rgba(217,119,6,.04);border:1px solid rgba(217,119,6,.12);border-top:none;border-radius:0 0 13px 13px;font-style:italic"></div>';
    /* Insert after HUD ribbon */
    var rbn=document.getElementById('dvag-ribbon');
    if(rbn&&rbn.parentNode) rbn.parentNode.insertBefore(wb, rbn.nextSibling);
  }

  async function showWisdomForQuery(query){
    var wb=document.getElementById('dvag-wisdom-bar');
    if(!wb) return;
    var refEl=document.getElementById('dvag-wis-ref');
    var txtEl=document.getElementById('dvag-wis-text');
    var fullEl=document.getElementById('dvag-wis-full');
    if(refEl) refEl.textContent='Bhagavad Gita · Loading…';
    if(txtEl) txtEl.textContent='Retrieving sacred wisdom…';
    if(fullEl) fullEl.style.display='none';
    wb.style.display='block';
    setTimeout(function(){ wb.classList.add('wis-show'); },30);

    var ref=selectGitaRef(query)||pickSessionVerse();
    var data=await fetchGitaVerse(ref.ch,ref.v);
    if(!data){ if(refEl) refEl.textContent='Bhagavad Gita'; if(txtEl) txtEl.textContent='Wisdom is beyond words.'; return; }
    var skt=data.slok||'';
    var tr=(data.tej&&data.tej.et)||(data.siva&&data.siva.et)||(data.purohit&&data.purohit.et)||'';
    if(refEl) refEl.textContent='Bhagavad Gita '+ref.ch+'.'+ref.v;
    if(txtEl) txtEl.textContent=tr||skt;
    if(fullEl){
      fullEl.innerHTML=(skt?'<div style="font-family:serif;margin-bottom:8px;color:var(--ink);opacity:.85">'+esc(skt)+'</div>':'')+(tr?'<div>'+esc(tr)+'</div>':'');
    }
    /* Toggle full on click */
    wb.querySelector('.dvag-wis-inner').onclick=function(){
      if(fullEl) fullEl.style.display=(fullEl.style.display==='none'?'block':'none');
    };
  }

  /* ── 10. CINEMA OVERLAY ─────────────────────────────────────── */
  function buildCinema(){
    if(document.getElementById('dvag-cinema')) return;
    var bk='<svg width="40" height="40" fill="none" stroke="rgba(255,122,0,.5)" stroke-width="1.5" stroke-linecap="round"><path d="M0 14 L0 0 L14 0"/></svg>';
    var ov=document.createElement('div');
    ov.id='dvag-cinema';
    ov.innerHTML=
      '<div class="cin-ring cin-r1"></div>'+
      '<div class="cin-ring cin-r2"></div>'+
      '<div class="cin-ring cin-r3"></div>'+
      '<div class="cin-ring cin-r4"></div>'+
      '<div class="cin-bk cin-bk-tl">'+bk+'</div>'+
      '<div class="cin-bk cin-bk-tr">'+bk+'</div>'+
      '<div class="cin-bk cin-bk-br">'+bk+'</div>'+
      '<div class="cin-bk cin-bk-bl">'+bk+'</div>'+
      '<div class="cin-logo">DIVYAM</div>'+
      '<div class="cin-sub">Super Search &middot; Agent Processing</div>'+
      '<div class="cin-qry" id="cin-qry"></div>'+
      '<div class="cin-list">'+
      AGENTS.map(function(ag){
        return '<div class="cin-row" id="cr-'+ag.id+'" style="--cv:'+ag.color+'">'+
          '<div class="cin-ico" style="color:'+ag.color+'">'+ag.sym+'</div>'+
          '<div class="cin-info">'+
            '<div class="cin-nm" style="color:'+ag.color+'">'+ag.name+'</div>'+
            '<div class="cin-task" id="ct-'+ag.id+'">'+ag.role+'</div>'+
          '</div>'+
          '<div class="cin-spin" style="border-top-color:'+ag.color+'"></div>'+
          '<div class="cin-chk">&#10003;</div>'+
        '</div>';
      }).join('')+
      '</div>'+
      '<div class="cin-prog">'+
        '<div class="cin-prog-lbl"><span id="cin-lbl">Initializing agents…</span><span id="cin-pct">0%</span></div>'+
        '<div class="cin-bar-track"><div class="cin-bar-fill" id="cin-bar"></div></div>'+
      '</div>';
    document.body.appendChild(ov);
  }

  function cinRow(id,st){
    var r=document.getElementById('cr-'+id),t=document.getElementById('ct-'+id);
    var ag=AGENTS.find(function(a){ return a.id===id; });
    if(r){ r.classList.remove('cr-on','cr-done'); if(st==='on') r.classList.add('cr-on'); if(st==='done') r.classList.add('cr-done'); }
    if(t) t.textContent=(st==='on'?(ag&&ag.task||'Processing…'):(st==='done'?(ag&&ag.done||'Done ✓'):(ag&&ag.role||'')));
  }
  function cinProg(pct,lbl){
    var b=document.getElementById('cin-bar'),l=document.getElementById('cin-lbl'),p=document.getElementById('cin-pct');
    if(b) b.style.width=pct+'%';
    if(l&&lbl) l.textContent=lbl;
    if(p) p.textContent=Math.round(pct)+'%';
  }

  /* ── 11. SEARCH ANIMATION ───────────────────────────────────── */
  var _animBusy=false;
  function runAnimation(query,onDone){
    if(_animBusy){ onDone&&onDone(); return; }
    _animBusy=true;
    var ov=document.getElementById('dvag-cinema');
    var qEl=document.getElementById('cin-qry');
    if(qEl) qEl.textContent='\u201C'+query+'\u201D';
    AGENTS.forEach(function(ag){ cinRow(ag.id,'idle'); });
    cinProg(0,'Initializing agents…'); allStandby();
    if(ov) ov.classList.add('cin-on');
    var STEP=255,HOLD=110;
    AGENTS.forEach(function(ag,i){
      setTimeout(function(){ cinRow(ag.id,'on'); tSet(ag.id,'active'); cinProg((i/AGENTS.length)*80,ag.task); },i*STEP);
      setTimeout(function(){ cinRow(ag.id,'done'); tSet(ag.id,'done'); },i*STEP+STEP+HOLD);
    });
    var total=AGENTS.length*STEP+STEP+HOLD+80;
    setTimeout(function(){ cinProg(100,'All agents ready →'); },total-80);
    setTimeout(function(){
      if(ov) ov.classList.remove('cin-on');
      _animBusy=false; onDone&&onDone();
    },total+180);
  }

  /* ── 12. DROPDOWN AGENT SECTION ─────────────────────────────── */
  var _lastDropQ='', _vegaTimer=null;
  function removeDropSection(){ var el=document.getElementById('dvag-drop-section'); if(el) el.remove(); }

  function injectDropSection(query){
    if(!query||query.length<2) return;
    if(query===_lastDropQ) return;
    _lastDropQ=query;
    var drop=document.getElementById('drop');
    if(!drop||!drop.classList.contains('open')) return;
    removeDropSection();
    var intent=detectIntent(query);
    var routeIds=PLATFORM_ROUTES[intent.cat]||PLATFORM_ROUTES.general;
    var routes=routeIds.slice(0,4).map(function(id){ return Object.assign({id:id},PM[id]||{}); });
    var sec=document.createElement('div');
    sec.id='dvag-drop-section';
    var ic=intent.color||'#4285F4';
    var ib=hexRgba(ic,0.09), ibrd=hexRgba(ic,0.22);
    var novaChips='<div class="dvag-drop-chips">'+routes.map(function(r,i){
      if(!r.name) return '';
      return '<button class="dvag-chip" style="border-color:'+r.color+'33;color:'+r.color+';animation-delay:'+(i*.06)+'s" onclick="window.open(\''+r.url(query).replace(/'/g,"\\'")+"','_blank');event.stopPropagation()\">"+r.emoji+' '+r.name+'</button>';
    }).join('')+'</div>';
    var vegaHtml='';
    if(query.trim().split(' ').length<=4){
      vegaHtml='<div class="dvag-drop-section-lbl" style="color:rgba(156,39,176,.7);margin-top:8px"><span style="color:#9C27B0;font-size:9px">◇</span> Vega · Related Topics</div>'+
        '<div class="dvag-drop-chips" id="dvag-vega-chips"><div style="font-size:11px;color:var(--ink4);font-style:italic">Exploring…</div></div>';
    }
    sec.innerHTML=
      '<div class="dvag-drop-hdr">'+
        '<span class="dvag-drop-tag" style="background:'+ib+';border:1px solid '+ibrd+';color:'+ic+'"><span style="font-size:9px">◎</span>Orion · '+intent.agTag+'</span>'+
        '<span style="font-size:9px;color:var(--ink4);margin-left:auto">'+intent.icon+' '+intent.cat+'</span>'+
      '</div>'+
      '<div class="dvag-drop-section-lbl" style="color:rgba(66,133,244,.7)"><span style="color:#4285F4;font-size:9px">◈</span> Nova · Platform Routes</div>'+
      novaChips+vegaHtml;
    drop.appendChild(sec);
    if(vegaHtml){
      clearTimeout(_vegaTimer);
      _vegaTimer=setTimeout(function(){
        fetchWikiLinks(query).then(function(topics){
          var el=document.getElementById('dvag-vega-chips');
          if(!el) return;
          if(!topics.length){ el.innerHTML='<div style="font-size:11px;color:var(--ink4)">No related topics</div>'; return; }
          el.innerHTML='';
          topics.slice(0,5).forEach(function(topic,i){
            var btn=document.createElement('button');
            btn.className='dvag-chip';
            btn.style.cssText='border-color:rgba(156,39,176,.28);color:#9C27B0;animation-delay:'+(i*.06)+'s';
            btn.textContent=topic;
            btn.addEventListener('click',function(e){
              e.stopPropagation();
              var inp=document.getElementById('sb-input');
              if(inp){ inp.value=topic; inp.dispatchEvent(new Event('input',{bubbles:true})); }
            });
            el.appendChild(btn);
          });
        });
      },300);
    }
  }

  function hookDropInput(){
    var inp=document.getElementById('sb-input');
    if(!inp||inp._dvDropHooked) return;
    inp._dvDropHooked=true;
    var _t=null;
    inp.addEventListener('input',function(){
      clearTimeout(_t);
      _t=setTimeout(function(){ injectDropSection(inp.value.trim()); },200);
    });
    var drop=document.getElementById('drop');
    if(drop){
      var obs=new MutationObserver(function(){
        if(!drop.classList.contains('open')){ _lastDropQ=''; removeDropSection(); }
      });
      obs.observe(drop,{attributes:true,attributeFilter:['class']});
    }
  }

  /* ── 13. FUTURISTIC KNOWLEDGE RESULT PANELS ─────────────────── */
  function ensureKPPanels(){
    if(document.getElementById('dvag-kp-root')) return;
    var kpInner=document.querySelector('#knowledge-page > div');
    if(!kpInner) return;
    var root=document.createElement('div');
    root.id='dvag-kp-root';
    root.innerHTML=[
      /* AI Insight Panel */
      '<div id="dvag-ai-panel" style="display:none">'+
        '<div class="dvag-ai-hdr">'+
          '<span style="font-size:17px">⚡</span>'+
          '<span class="dvag-ai-badge">AI Insight · Pollinations</span>'+
          '<span class="dvag-ai-free">Free · No API Key</span>'+
        '</div>'+
        '<div id="dvag-ai-loading" style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink3)">'+
          '<div class="dvag-kspin" style="border:2px solid rgba(255,122,0,.2);border-top-color:var(--sf)"></div>'+
          'Free AI generating insight…'+
        '</div>'+
        '<div id="dvag-ai-text" class="dvag-ai-text" style="display:none"></div>'+
      '</div>',

      /* Intent + Routing Panel */
      '<div id="dvag-intent-kp" class="dvag-kp" style="display:none;border-color:rgba(255,122,0,.22)">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">◎</span><span class="dvag-kpt" style="color:var(--sf)">Orion &amp; Nova · Intent + Routing</span><span class="dvag-kps">Agents 1–2</span></div>'+
        '<div id="dvag-intent-body"></div>'+
      '</div>',

      /* Multi-Source Cards (futuristic grid) */
      '<div id="dvag-msrc-panel" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px">🌐</span><span class="dvag-kpt">Multi-Source Navigator</span><span class="dvag-kps">All Agents</span></div>'+
        '<div id="dvag-msrc-body"></div>'+
      '</div>',

      /* Context Panel */
      '<div id="dvag-context-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">◬</span><span class="dvag-kpt">Zenith · Context Interpreter</span><span class="dvag-kps">Agent 6</span></div>'+
        '<div id="dvag-context-body" style="font-size:13px;color:var(--ink2);line-height:1.7"></div>'+
      '</div>',

      /* Discovery Panel */
      '<div id="dvag-discovery-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">◇</span><span class="dvag-kpt">Vega · Discovery Explorer</span><span class="dvag-kps">Agent 4</span></div>'+
        '<div id="dvag-disc-loading" style="display:flex;align-items:center;gap:10px;color:var(--ink3);font-size:13px"><div class="dvag-kspin"></div>Exploring topics…</div>'+
        '<div id="dvag-disc-body" style="display:none;flex-wrap:wrap;gap:8px"></div>'+
      '</div>',

      /* Helix Insights Panel */
      '<div id="dvag-insights-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">⬡</span><span class="dvag-kpt">Helix · Platform Analyst</span><span class="dvag-kps">Agent 5</span></div>'+
        '<div id="dvag-insights-body"></div>'+
      '</div>',

      /* Gita Panel */
      '<div id="dvag-gita-kp" class="dvag-kp" style="display:none;border-color:rgba(217,119,6,.32)!important;background:linear-gradient(148deg,rgba(217,119,6,.06),rgba(180,83,9,.025))!important">'+
        '<div class="dvag-kph"><span style="font-size:18px;flex-shrink:0">ॐ</span><span class="dvag-kpt" style="color:#D97706">Vyasa · Gita Wisdom Teller</span><span class="dvag-kps">Agent 7</span></div>'+
        '<div id="dvag-gita-loading" style="display:flex;align-items:center;gap:10px;color:var(--ink3);font-size:13px">'+
          '<div style="width:14px;height:14px;border:2px solid rgba(217,119,6,.2);border-top-color:#D97706;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0"></div>'+
          'Loading sacred wisdom…'+
        '</div>'+
        '<div id="dvag-gita-body" style="display:none"></div>'+
      '</div>'
    ].join('');

    var kids=Array.from(kpInner.children);
    var anchor=null;
    kids.forEach(function(ch){ if(ch.textContent&&ch.textContent.trim().startsWith('Where to search')) anchor=ch; });
    if(anchor) kpInner.insertBefore(root,anchor);
    else kpInner.appendChild(root);
  }

  function kpShow(id,show){ var el=document.getElementById(id); if(el) el.style.display=show?'block':'none'; }
  function kpFade(el){
    if(!el) return;
    el.style.opacity='0'; el.style.transform='translateY(12px)';
    requestAnimationFrame(function(){
      el.style.transition='opacity .32s ease,transform .32s ease';
      el.style.opacity='1'; el.style.transform='';
      setTimeout(function(){ el.style.transition=''; },380);
    });
  }

  /* Render: AI Insight */
  async function renderAIPanel(query){
    kpShow('dvag-ai-panel',true);
    var aiLoad=document.getElementById('dvag-ai-loading');
    var aiText=document.getElementById('dvag-ai-text');
    if(aiLoad) aiLoad.style.display='flex';
    if(aiText) aiText.style.display='none';

    var prompt='Give a short 2-sentence factual insight about: '+query+'. Be concise and helpful.';
    var result=await fetchPollinationsAI(prompt);

    if(aiLoad) aiLoad.style.display='none';
    if(result && aiText){
      aiText.style.display='block';
      aiText.textContent=result;
      kpFade(document.getElementById('dvag-ai-panel'));
    } else {
      kpShow('dvag-ai-panel',false);
    }
  }

  /* Render: Intent + Routing */
  function renderIntentRouting(query,intent,routes){
    var body=document.getElementById('dvag-intent-body'); if(!body) return;
    var ic=intent.color||'#4285F4';
    body.innerHTML=
      '<div style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:'+hexRgba(ic,0.07)+';border:1.5px solid '+hexRgba(ic,0.16)+';border-radius:13px;margin-bottom:14px">'+
        '<span style="font-size:20px">'+intent.icon+'</span>'+
        '<div><div style="font-size:9.5px;font-weight:700;color:var(--ink4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px">◎ Orion detected</div>'+
        '<div style="font-size:14px;font-weight:800;color:var(--ink);font-family:\'Syne\',sans-serif;text-transform:capitalize">'+esc(intent.cat)+' query</div></div>'+
      '</div>'+
      '<div style="font-size:9.5px;font-weight:700;letter-spacing:.1em;color:var(--ink4);text-transform:uppercase;margin-bottom:10px">◈ Nova · Recommended Platforms</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px">'+
      routes.map(function(r,i){
        if(!r.name) return '';
        return '<div onclick="window.open(\''+r.url(query).replace(/'/g,"\\'")+"','_blank')\" "+
          'style="cursor:pointer;padding:11px 13px;background:var(--sfbg);border:1.5px solid var(--border2);border-radius:13px;transition:all .2s;opacity:0;transform:translateY(10px)" '+
          'onmouseenter="this.style.borderColor=\''+r.color+'44\';this.style.background=\'var(--sfbg2)\'" '+
          'onmouseleave="this.style.borderColor=\'\';this.style.background=\'var(--sfbg)\'" '+
          'id="dvag-rt-'+i+'">'+
          '<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px"><span style="font-size:14px">'+r.emoji+'</span>'+
          '<span style="font-size:12px;font-weight:700;color:var(--ink)">'+esc(r.name)+'</span></div>'+
          '<div style="font-size:11px;color:var(--ink3)">'+esc(r.reason)+'</div>'+
        '</div>';
      }).join('')+'</div>';
    kpShow('dvag-intent-kp',true); kpFade(document.getElementById('dvag-intent-kp'));
    routes.forEach(function(_,i){
      var el=document.getElementById('dvag-rt-'+i);
      if(el) setTimeout(function(){ el.style.transition='opacity .28s ease,transform .28s ease,border-color .2s,background .2s'; el.style.opacity='1'; el.style.transform=''; },75+i*55);
    });
  }

  /* Render: Multi-Source futuristic cards */
  function renderMultiSource(query, intent, routes){
    var body=document.getElementById('dvag-msrc-body'); if(!body) return;
    var relevanceScores=[92,85,78,71,64,58];
    body.innerHTML='<div class="dvag-src-grid">'+
      routes.slice(0,6).map(function(r,i){
        if(!r.name) return '';
        var score=relevanceScores[i]||50;
        var url=r.url(query).replace(/'/g,"\\'");
        return '<a href="'+url+'" target="_blank" rel="noopener" class="dvag-src-card">'+
          '<div class="dvag-src-top">'+
            '<span class="dvag-src-ico">'+r.emoji+'</span>'+
            '<span class="dvag-src-name">'+esc(r.name)+'</span>'+
          '</div>'+
          '<div class="dvag-src-reason">'+esc(r.reason)+'</div>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
            '<div class="dvag-src-action">Search →</div>'+
            '<span style="font-size:9px;font-weight:700;color:'+r.color+'">'+score+'% match</span>'+
          '</div>'+
          '<div class="dvag-src-bar"><div class="dvag-src-bar-fill" style="width:0%;background:'+r.color+';" data-w="'+score+'"></div></div>'+
        '</a>';
      }).join('')+
    '</div>';
    kpShow('dvag-msrc-panel',true); kpFade(document.getElementById('dvag-msrc-panel'));
    /* Animate relevance bars */
    setTimeout(function(){
      body.querySelectorAll('.dvag-src-bar-fill').forEach(function(el){
        el.style.width=el.getAttribute('data-w')+'%';
      });
    },400);
  }

  /* Render: Context */
  function renderContext(c){
    if(!c||!c.length){ kpShow('dvag-context-kp',false); return; }
    var body=document.getElementById('dvag-context-body'); if(!body) return;
    body.innerHTML='<div style="margin-bottom:9px;font-size:12px;color:var(--ink3);font-style:italic">Zenith found multiple possible interpretations:</div>'+
      c.map(function(s,i){
        return '<div style="display:flex;align-items:flex-start;gap:9px;padding:8px 12px;background:var(--sfbg);border-radius:10px;margin-bottom:7px;opacity:0;transform:translateX(-8px)" id="dvag-cx-'+i+'">'+
          '<span style="font-size:12px;flex-shrink:0;margin-top:2px">'+['🔵','🟠','🟢','🟣'][i%4]+'</span>'+
          '<span style="font-size:13px;color:var(--ink2);line-height:1.5">'+esc(s)+'</span></div>';
      }).join('');
    kpShow('dvag-context-kp',true); kpFade(document.getElementById('dvag-context-kp'));
    c.forEach(function(_,i){ setTimeout(function(){ var el=document.getElementById('dvag-cx-'+i); if(el){ el.style.transition='opacity .25s ease,transform .25s ease'; el.style.opacity='1'; el.style.transform=''; } },100+i*55); });
  }

  /* Render: Discovery */
  function renderDiscovery(topics,query){
    var ld=document.getElementById('dvag-disc-loading'),bd=document.getElementById('dvag-disc-body');
    if(ld) ld.style.display='none';
    if(!topics||!topics.length){ kpShow('dvag-discovery-kp',false); return; }
    if(!bd) return;
    bd.innerHTML=''; bd.style.display='flex';
    topics.forEach(function(topic,i){
      var btn=document.createElement('button');
      btn.style.cssText='padding:7px 14px;border-radius:20px;border:1.5px solid var(--border2);background:var(--sfbg);font-size:12px;font-weight:600;color:var(--ink2);font-family:\'DM Sans\',sans-serif;transition:all .2s;cursor:pointer;opacity:0;transform:translateY(7px)';
      btn.textContent=topic;
      btn.onmouseenter=function(){ btn.style.background='var(--sfbg2)'; btn.style.borderColor='rgba(156,39,176,.35)'; btn.style.color='#9C27B0'; };
      btn.onmouseleave=function(){ btn.style.background='var(--sfbg)'; btn.style.borderColor='var(--border2)'; btn.style.color='var(--ink2)'; };
      btn.onclick=function(){
        var si=document.getElementById('sb-input')||document.getElementById('msb-input');
        if(si) si.value=topic;
        if(typeof closeKnowledgePage==='function') closeKnowledgePage();
        setTimeout(function(){ if(typeof fireSearch==='function') fireSearch(null,null); },280);
      };
      bd.appendChild(btn);
      setTimeout(function(){ btn.style.transition='opacity .25s ease,transform .25s ease,background .2s,border-color .2s,color .2s'; btn.style.opacity='1'; btn.style.transform=''; },55+i*40);
    });
    kpShow('dvag-discovery-kp',true); kpFade(document.getElementById('dvag-discovery-kp'));
  }

  /* Render: Helix Insights */
  function renderInsights(intent){
    var body=document.getElementById('dvag-insights-body'); if(!body) return;
    var T={
      shopping:[
        {icon:'🛒',plat:'Amazon',tip:'Filter by "Sold by Amazon" for authentic products. Use the Coupons section for extra savings.',color:'#FF9900'},
        {icon:'🛍️',plat:'Flipkart',tip:'Use F-Assured filter for fast delivery. Check No Cost EMI options.',color:'#2874F0'}
      ],
      tutorial:[
        {icon:'▶️',plat:'YouTube',tip:'Filter by Upload Date → This Year. Use video Chapters for structured learning.',color:'#FF0000'},
        {icon:'🔴',plat:'Reddit',tip:'Subreddit wikis often have curated learning roadmaps and top resource lists.',color:'#FF4500'}
      ],
      programming:[
        {icon:'📋',plat:'Stack Overflow',tip:'Sort by Votes not Newest. A green tick = accepted answer with verified solution.',color:'#F48024'},
        {icon:'🐙',plat:'GitHub',tip:'Search Issues and Discussions tabs for real bug workarounds before asking new questions.',color:'#24292e'}
      ],
      discussion:[{icon:'🔴',plat:'Reddit',tip:'Sort by Top (All Time) to find the best community insights on any topic.',color:'#FF4500'}],
      knowledge:[{icon:'📖',plat:'Wikipedia',tip:'Jump to References for primary sources. Check the Talk page for content disputes.',color:'#3366CC'}],
      spiritual:[{icon:'ॐ',plat:'Vyasa · Gita Wisdom',tip:'A relevant Bhagavad Gita verse for this spiritual query has been retrieved in the Vyasa panel below.',color:'#D97706'}],
      video:[{icon:'▶️',plat:'YouTube',tip:'Use hashtags (#) to find niche content creators. Creative Commons filter for reusable videos.',color:'#FF0000'}],
      local:[{icon:'🗺️',plat:'Google Maps',tip:'Enable "Open Now" filter. Check the Q&A section for crowd-sourced local tips.',color:'#34A853'}],
      general:[{icon:'🔍',plat:'Google',tip:'Use quotes for exact phrases. Add site: to restrict search to one domain.',color:'#4285F4'}]
    };
    var tips=T[intent.cat]||T.general;
    body.innerHTML=tips.map(function(tip,i){
      return '<div style="padding:11px 13px;background:var(--sfbg);border:1.5px solid var(--border2);border-radius:13px;margin-bottom:8px;opacity:0;transform:translateY(8px)" id="dvag-ip-'+i+'">'+
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">'+
          '<span style="font-size:14px">'+esc(tip.icon)+'</span>'+
          '<span style="font-size:11px;font-weight:700;color:'+esc(tip.color)+'">'+esc(tip.plat)+'</span>'+
          '<span style="margin-left:auto;font-size:8.5px;color:var(--ink4);text-transform:uppercase;letter-spacing:.08em">⬡ Helix</span>'+
        '</div>'+
        '<div style="font-size:13px;color:var(--ink2);line-height:1.55">'+esc(tip.tip)+'</div>'+
      '</div>';
    }).join('');
    kpShow('dvag-insights-kp',true); kpFade(document.getElementById('dvag-insights-kp'));
    tips.forEach(function(_,i){ setTimeout(function(){ var el=document.getElementById('dvag-ip-'+i); if(el){ el.style.transition='opacity .27s ease,transform .27s ease'; el.style.opacity='1'; el.style.transform=''; } },75+i*55); });
  }

  /* Render: Gita KP */
  function renderGitaKP(data,ch,v){
    var ld=document.getElementById('dvag-gita-loading'),bd=document.getElementById('dvag-gita-body');
    if(ld) ld.style.display='none';
    if(!data){ kpShow('dvag-gita-kp',false); return; }
    if(!bd) return;
    var skt=data.slok||'';
    var tr=(data.tej&&data.tej.et)||(data.siva&&data.siva.et)||(data.purohit&&data.purohit.et)||'';
    var mn=(data.tej&&data.tej.ec)||(data.siva&&data.siva.ec)||'';
    bd.innerHTML=
      '<div style="font-size:10px;font-weight:700;color:#D97706;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Chapter '+esc(String(ch))+' &middot; Verse '+esc(String(v))+'</div>'+
      (skt?'<div class="dvag-gita-verse">'+esc(skt)+'</div>':'')+
      (tr?'<div style="font-size:13px;color:var(--ink2);line-height:1.75;margin-bottom:10px"><strong style="font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink4)">Translation</strong><br><br>'+esc(tr)+'</div>':'')+
      (mn?'<div style="font-size:12.5px;color:var(--ink3);line-height:1.65;padding:10px 13px;background:var(--sfbg);border-radius:10px;margin-bottom:12px"><strong style="font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink4)">Meaning</strong><br><br>'+esc(mn)+'</div>':'')+
      '<a href="https://www.holy-bhagavad-gita.org/chapter/'+esc(String(ch))+'/verse/'+esc(String(v))+'" target="_blank" rel="noopener" '+
      'style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#D97706;text-decoration:none;padding:6px 14px;border:1.5px solid rgba(217,119,6,.28);border-radius:20px;background:rgba(217,119,6,.07)">Read full commentary →</a>';
    bd.style.display='block';
    kpShow('dvag-gita-kp',true); kpFade(document.getElementById('dvag-gita-kp'));
  }

  function renderAtlasBadge(){
    var wp=document.getElementById('kp-wiki-panel'); if(!wp) return;
    if(wp.querySelector('.dvag-atlas-b')) return;
    var b=document.createElement('span');
    b.className='dvag-atlas-b';
    b.style.cssText='display:inline-flex;align-items:center;gap:4px;font-size:8.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(52,168,83,.1);border:1px solid rgba(52,168,83,.2);color:#34A853;margin-left:8px;letter-spacing:.04em';
    b.textContent='◉ Atlas';
    var hdr=wp.querySelector('div'); if(hdr) hdr.appendChild(b);
  }

  /* ── 14. MAIN AGENT RUN ─────────────────────────────────────── */
  function runAgents(query,platform){
    if(!query) return;
    ensureKPPanels();

    /* Reset all panels */
    ['dvag-ai-panel','dvag-intent-kp','dvag-msrc-panel','dvag-context-kp','dvag-discovery-kp','dvag-insights-kp','dvag-gita-kp'].forEach(function(id){ kpShow(id,false); });
    var dL=document.getElementById('dvag-disc-loading'),dB=document.getElementById('dvag-disc-body');
    if(dL) dL.style.display='flex'; if(dB){ dB.style.display='none'; dB.innerHTML=''; }
    var gL=document.getElementById('dvag-gita-loading'),gB=document.getElementById('dvag-gita-body');
    if(gL) gL.style.display='flex'; if(gB){ gB.style.display='none'; gB.innerHTML=''; }
    var aiLoad=document.getElementById('dvag-ai-loading'),aiTxt=document.getElementById('dvag-ai-text');
    if(aiLoad) aiLoad.style.display='flex'; if(aiTxt) aiTxt.style.display='none';

    var intent=detectIntent(query);
    var rIds=PLATFORM_ROUTES[intent.cat]||PLATFORM_ROUTES.general;
    var routes=rIds.map(function(id){ return Object.assign({id:id},PM[id]||{name:id,emoji:'🔍',color:'#888',url:function(q){ return 'https://www.google.com/search?q='+encodeURIComponent(q); },reason:'Search here'}); });

    /* Orion + Nova */
    renderIntentRouting(query,intent,routes); tSet('orion','done'); tSet('nova','done');

    /* Multi-source futuristic cards */
    renderMultiSource(query,intent,routes);
    kpShow('dvag-msrc-panel',true);

    /* Atlas */
    setTimeout(function(){
      var wt=document.getElementById('kp-wiki-text');
      if(wt&&wt.textContent.length>30){ renderAtlasBadge(); tSet('atlas','done'); }
    },2200);

    /* Vega */
    kpShow('dvag-discovery-kp',true); tSet('vega','active');
    fetchWikiLinks(query).then(function(t){ renderDiscovery(t,query); tSet('vega','done'); }).catch(function(){ kpShow('dvag-discovery-kp',false); tSet('vega','done'); });

    /* Helix */
    renderInsights(intent); tSet('helix','done');

    /* Zenith */
    if(query.trim().split(/\s+/).length<=5){
      tSet('zenith','active');
      fetchWikiSearch(query).then(function(c){ renderContext(c); tSet('zenith','done'); }).catch(function(){ kpShow('dvag-context-kp',false); tSet('zenith','done'); });
    } else { tSet('zenith','done'); }

    /* Vyasa — always show a fresh verse per search */
    kpShow('dvag-gita-kp',true); tSet('vyasa','active');
    var ref=selectGitaRef(query)||pickSessionVerse();
    fetchGitaVerse(ref.ch,ref.v).then(function(d){
      if(d) renderGitaKP(d,ref.ch,ref.v); else kpShow('dvag-gita-kp',false);
      tSet('vyasa','done');
    }).catch(function(){ kpShow('dvag-gita-kp',false); tSet('vyasa','done'); });

    /* Free AI insight — try Pollinations */
    renderAIPanel(query);

    /* Update ambient ribbon with new verse */
    updateRibbonForQuery(query);

    /* Show wisdom bar too */
    showWisdomForQuery(query);
  }

  /* ── 15. FIX LOGOUT ─────────────────────────────────────────── */
  function patchLogout(){
    /* Re-define handleLogout to ensure it fully works */
    window.handleLogout = async function(){
      try{
        /* Clear Firebase session */
        if(window._auth){
          await window._auth.signOut();
        } else if(window._googleLogout){
          await window._googleLogout();
        }
      }catch(e){ console.warn('signOut error:',e.message); }

      /* Clear all local storage */
      ['dv_tok','dv_usr','dv_mem','dv_lifetime'].forEach(function(k){ localStorage.removeItem(k); });

      /* Reset state */
      if(window.state){
        window.state.authUser=null;
        window.state.token=null;
        window.state.member=false;
      }

      /* Reset search counter */
      if(typeof window.setSearches==='function') window.setSearches(0);

      /* Close any open menus */
      var menu=document.getElementById('avatar-menu');
      if(menu) menu.classList.remove('open');

      /* Update UI */
      if(typeof window.applyAuthUI==='function') window.applyAuthUI();

      /* Redirect to auth page */
      if(typeof window.showPage==='function') window.showPage('auth');

      /* Force page reload as failsafe after a brief delay */
      setTimeout(function(){
        var ap=document.getElementById('auth-page');
        var sp=document.getElementById('search-page');
        if(ap&&sp){
          /* If still on search page, force the redirect */
          if(sp.style.display==='flex'){
            sp.style.display='none';
            ap.classList.add('open');
          }
        }
      }, 200);
    };
  }

  /* ── 16. HOOK INTO EXISTING FUNCTIONS ──────────────────────── */
  function hookFunctions(){
    /* Wrap fireSearch → cinema animation */
    if(typeof window.fireSearch==='function'&&!window.fireSearch._dvagV4){
      var _orig=window.fireSearch;
      window.fireSearch=function(mode,forcePlatform){
        var inp=(mode==='mobile')?document.getElementById('msb-input'):document.getElementById('sb-input');
        var q=(inp&&inp.value||'').trim();
        if(!q||!window.state||!window.state.authUser||!window.state.member){
          _orig(mode,forcePlatform); return;
        }
        runAnimation(q,function(){ _orig(mode,forcePlatform); });
      };
      window.fireSearch._dvagV4=true;
    }

    /* Wrap openKnowledgePage → run agents */
    if(typeof window.openKnowledgePage==='function'&&!window.openKnowledgePage._dvagV4){
      var _origKP=window.openKnowledgePage;
      window.openKnowledgePage=function(query,platform){
        _origKP(query,platform);
        setTimeout(function(){ runAgents(query,platform); },55);
      };
      window.openKnowledgePage._dvagV4=true;
    }

    /* Patch logout */
    patchLogout();
  }

  /* ── 17. INIT ────────────────────────────────────────────────── */
  var _built=false;
  function buildAll(){
    if(_built) return;
    var sp=document.getElementById('search-page');
    if(!sp||(sp.style.display!=='flex'&&sp.style.display!=='')) return;
    _built=true;
    buildHUD();
    buildRibbon();
    buildWisdomBar();
    buildCinema();
    hookDropInput();
    initSearchFocusHide();
  }

  function init(){
    injectStyles();
    buildAmbient();
    hookFunctions();
    buildAll();

    if(!_built){
      var iv=setInterval(function(){
        buildAll();
        if(_built) clearInterval(iv);
      },200);
      setTimeout(function(){ clearInterval(iv); if(!_built){ _built=true; buildHUD(); buildRibbon(); buildWisdomBar(); buildCinema(); hookDropInput(); initSearchFocusHide(); } },4000);
    }

    var sp=document.getElementById('search-page');
    if(sp){
      var obs=new MutationObserver(function(){
        if(sp.style.display==='flex'||sp.style.display===''){
          if(!document.getElementById('dvag-hud')){ _built=false; buildAll(); hookDropInput(); initSearchFocusHide(); }
          /* Also repatch logout each time auth state changes */
          patchLogout();
        }
      });
      obs.observe(sp,{attributes:true,attributeFilter:['style']});
    }

    /* Also patch logout whenever auth-area re-renders */
    var authArea=document.getElementById('auth-area');
    if(authArea){
      var authObs=new MutationObserver(function(){ patchLogout(); });
      authObs.observe(authArea,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){ setTimeout(init,150); });
  } else {
    setTimeout(init,150);
  }

  window.DivyamAgents={
    run:runAgents,
    animate:runAnimation,
    detectIntent:detectIntent,
    isGitaQuery:isGitaQ,
    patchLogout:patchLogout
  };

})();
