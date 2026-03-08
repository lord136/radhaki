/* ═══════════════════════════════════════════════════════════════
   DIVYAM — agents.js  v3.0
   ─────────────────────────────────────────────────────────────
   • Futuristic Agent HUD below search bar
   • Agent-tagged autocomplete suggestions in dropdown
   • Cinematic search animation overlay
   • Ambient Gita Wisdom ribbon (every search)
   • Knowledge Page panels with all 7 agents
   • Cinematic theme enhancements (mesh, scanlines, aurora)
   ─────────────────────────────────────────────────────────────
   ZERO changes to script.js · style.css · index.html
═══════════════════════════════════════════════════════════════ */

(function DivyamAgentsV3() {
  'use strict';

  /* ────────────────────────────────────────────────────────────
     1. CONSTANTS
  ──────────────────────────────────────────────────────────── */
  var AGENTS = [
    { id:'orion',  name:'Orion',  role:'Intent Researcher',     sym:'◎', color:'#FF7A00', glow:'rgba(255,122,0,.5)',    task:'Analyzing search intent…',  done:'Intent mapped ✓' },
    { id:'nova',   name:'Nova',   role:'Platform Navigator',    sym:'◈', color:'#4285F4', glow:'rgba(66,133,244,.5)',  task:'Routing to platforms…',     done:'Platforms ready ✓' },
    { id:'atlas',  name:'Atlas',  role:'Knowledge Researcher',  sym:'◉', color:'#34A853', glow:'rgba(52,168,83,.5)',   task:'Fetching knowledge base…',  done:'Knowledge loaded ✓' },
    { id:'vega',   name:'Vega',   role:'Discovery Explorer',    sym:'◇', color:'#9C27B0', glow:'rgba(156,39,176,.5)', task:'Exploring related topics…', done:'Topics discovered ✓' },
    { id:'helix',  name:'Helix',  role:'Platform Analyst',      sym:'⬡', color:'#F48024', glow:'rgba(244,128,36,.5)',  task:'Analysing content types…',  done:'Insights extracted ✓' },
    { id:'zenith', name:'Zenith', role:'Context Interpreter',   sym:'◬', color:'#00BCD4', glow:'rgba(0,188,212,.5)',   task:'Interpreting context…',     done:'Context clarified ✓' },
    { id:'vyasa',  name:'Vyasa',  role:'Gita Wisdom Teller',    sym:'ॐ', color:'#D97706', glow:'rgba(217,119,6,.5)',   task:'Retrieving Gita wisdom…',   done:'Wisdom revealed ✓' }
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

  /* Gita data */
  var GITA_KW = ['bhagavad gita','gita','krishna','arjuna','dharma','karma','yoga','moksha','atman','brahman','meditation','mantra','sloka','verse','spiritual','vedas','upanishad','advaita','soul','consciousness','enlightenment','self-realization','divine','detachment','duty','truth','bhakti','jnana','vedic','purpose of life','mind','wisdom'];
  var GITA_TOPIC = { karma:{ch:2,v:47}, dharma:{ch:3,v:35}, yoga:{ch:6,v:5}, meditation:{ch:6,v:10}, death:{ch:2,v:20}, action:{ch:2,v:47}, peace:{ch:2,v:66}, devotion:{ch:9,v:22}, knowledge:{ch:4,v:38}, wisdom:{ch:4,v:38}, mind:{ch:6,v:5}, duty:{ch:3,v:35}, soul:{ch:2,v:20}, divine:{ch:9,v:22}, enlightenment:{ch:4,v:38}, purpose:{ch:3,v:30}, truth:{ch:4,v:1} };
  var DAILY_POOL = [{ch:2,v:47},{ch:3,v:35},{ch:6,v:5},{ch:4,v:38},{ch:2,v:20},{ch:9,v:22},{ch:2,v:14},{ch:6,v:10},{ch:2,v:66},{ch:3,v:30},{ch:4,v:1},{ch:12,v:15}];

  function isGitaQ(q){ var l=q.toLowerCase(); return GITA_KW.some(function(k){ return l.includes(k); }); }
  function pickDailyRef(){ var d=Math.floor(Date.now()/(864e5)); return DAILY_POOL[d%DAILY_POOL.length]; }

  /* Query-specific verse: each unique search gets a unique verse from the pool */
  function queryHash(q){
    var h=0, s=q.toLowerCase().trim();
    for(var i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0; }
    return Math.abs(h);
  }
  function pickVerseForQuery(q){
    if(!q) return pickDailyRef();
    return DAILY_POOL[queryHash(q) % DAILY_POOL.length];
  }
  function selectGitaRef(q){
    var l=q.toLowerCase();
    for(var t in GITA_TOPIC){ if(l.includes(t)) return GITA_TOPIC[t]; }
    var m=q.match(/\b(\d{1,2})[:.]\s*(\d{1,3})\b/);
    if(m) return {ch:+m[1],v:+m[2]};
    return null;
  }

  /* ────────────────────────────────────────────────────────────
     2. UTILITY
  ──────────────────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────────────────────
     3. API FETCHERS
  ──────────────────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────────────────────
     4. INJECT STYLES
  ──────────────────────────────────────────────────────────── */
  function injectStyles(){
    if(document.getElementById('dvag-style')) return;
    var el=document.createElement('style');
    el.id='dvag-style';
    el.textContent=
    /* ── Cinematic ambient enhancements ─────────────────── */
    '#dvag-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}'+
    '#dvag-mesh::before,#dvag-mesh::after{content:\'\';position:absolute;border-radius:50%;pointer-events:none}'+
    '#dvag-mesh::before{width:700px;height:700px;top:-20%;left:-15%;background:radial-gradient(circle,rgba(255,100,0,.042) 0%,transparent 65%);animation:dvMesh 22s ease-in-out infinite}'+
    '#dvag-mesh::after{width:580px;height:580px;bottom:-18%;right:-12%;background:radial-gradient(circle,rgba(255,155,40,.03) 0%,transparent 65%);animation:dvMesh 18s ease-in-out infinite reverse}'+
    '@keyframes dvMesh{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(3%,-4%) scale(1.07)}66%{transform:translate(-3%,3%) scale(.95)}}'+
    '#dvag-scanlines{position:fixed;inset:0;z-index:1;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.007) 2px,rgba(0,0,0,.007) 4px)}'+
    '.dark #dvag-scanlines{opacity:.55}'+
    '#dvag-aurora{position:fixed;top:0;left:0;right:0;z-index:1;pointer-events:none;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,122,0,.32) 40%,rgba(255,180,60,.42) 60%,transparent 100%);animation:dvAurora 9s ease-in-out infinite}'+
    '@keyframes dvAurora{0%,100%{opacity:.5;transform:scaleX(.8)}50%{opacity:1;transform:scaleX(1)}}'+

    /* ── HUD container ────────────────────────────────────── */
    '#dvag-hud{width:100%;max-width:700px;margin:20px auto 0;padding:0;position:relative;z-index:10;opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease}'+
    '#dvag-hud.hud-show{opacity:1;transform:none}'+

    /* HUD header */
    '.dvag-hdr{display:flex;align-items:center;gap:10px;margin-bottom:13px}'+
    '.dvag-hdr-ttl{font-size:8.5px;font-weight:700;letter-spacing:.26em;color:var(--ink4);text-transform:uppercase;white-space:nowrap}'+
    '.dvag-hdr-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,122,0,.32),rgba(255,122,0,.06) 70%,transparent)}'+
    '.dvag-hdr-badge{font-size:8px;font-weight:800;letter-spacing:.16em;padding:3px 11px;border-radius:20px;background:rgba(255,122,0,.08);border:1px solid rgba(255,122,0,.2);color:var(--sf);text-transform:uppercase;white-space:nowrap}'+

    /* Agent grid */
    '.dvag-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}'+
    '@media(max-width:680px){.dvag-grid{grid-template-columns:repeat(4,1fr)}}'+
    '@media(max-width:440px){.dvag-grid{grid-template-columns:repeat(3,1fr);gap:5px}#dvag-hud{padding:0 2px}}'+

    /* Individual tile */
    '.dvag-tile{position:relative;display:flex;flex-direction:column;align-items:center;padding:11px 4px 9px;border-radius:14px;border:1.5px solid var(--border2);background:var(--sfbg);overflow:hidden;transition:border-color .3s,box-shadow .3s,background .3s;user-select:none}'+
    '.dvag-tile::before{content:\'\';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,var(--tc) 0%,transparent 70%);opacity:0;transition:opacity .4s;pointer-events:none}'+
    '.dvag-tile.tac{border-color:var(--tc)!important;box-shadow:0 0 18px -5px var(--tg)}'+
    '.dvag-tile.tac::before{opacity:.07}'+
    '.dvag-tile.tdn{border-color:rgba(34,197,94,.22)!important}'+
    '.dvag-tile.tdn::before{opacity:.02}'+

    /* bottom shimmer bar */
    '.dvag-tile::after{content:\'\';position:absolute;bottom:0;left:0;right:0;height:1.5px;opacity:0;transition:opacity .3s;background:linear-gradient(90deg,transparent,var(--tc),transparent)}'+
    '.dvag-tile.tac::after{opacity:.55;animation:dvBar 1.5s linear infinite}'+
    '.dvag-tile.tdn::after{opacity:.1;animation:none}'+
    '@keyframes dvBar{0%{background-position:200% 0}100%{background-position:-200% 0}}'+

    /* Icon ring */
    '.dvag-ring{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-family:\'Syne\',sans-serif;border:1.5px solid var(--tc);color:var(--tc);margin-bottom:7px;position:relative;transition:box-shadow .3s}'+
    '.dvag-tile.tac .dvag-ring{box-shadow:0 0 12px -3px var(--tg);animation:dvRingPulse 1.2s ease-in-out infinite}'+
    '@keyframes dvRingPulse{0%,100%{box-shadow:0 0 8px -3px var(--tg)}50%{box-shadow:0 0 20px 2px var(--tg)}}'+

    /* scan sweep in ring */
    '.dvag-scan{position:absolute;inset:0;border-radius:50%;overflow:hidden;pointer-events:none}'+
    '.dvag-scan::after{content:\'\';position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--tc),transparent);opacity:0;top:-2px}'+
    '.dvag-tile.tac .dvag-scan::after{opacity:.85;animation:dvScan .95s linear infinite}'+
    '@keyframes dvScan{0%{top:-2px;opacity:0}12%{opacity:.85}88%{opacity:.85}100%{top:calc(100% + 2px);opacity:0}}'+

    /* Status dot */
    '.dvag-dot{position:absolute;top:7px;right:7px;width:5px;height:5px;border-radius:50%;background:var(--border2);transition:background .3s,box-shadow .3s}'+
    '.dvag-tile.tac .dvag-dot{background:var(--tc);box-shadow:0 0 5px 1px var(--tg);animation:dvDotBlink .65s ease-in-out infinite}'+
    '.dvag-tile.tdn .dvag-dot{background:#22c55e;box-shadow:0 0 4px rgba(34,197,94,.5)}'+
    '@keyframes dvDotBlink{0%,100%{opacity:1}50%{opacity:.2}}'+

    /* Text */
    '.dvag-nm{font-size:10.5px;font-weight:800;color:var(--ink);font-family:\'Syne\',sans-serif;letter-spacing:.03em;text-align:center;transition:color .3s}'+
    '.dvag-tile.tac .dvag-nm{color:var(--tc)}'+
    '.dvag-rl{font-size:8px;color:var(--ink4);text-align:center;line-height:1.3;margin-top:2px;letter-spacing:.01em}'+
    '.dvag-tk{font-size:7.5px;color:var(--ink4);margin-top:4px;text-align:center;min-height:9px;transition:color .3s;letter-spacing:.02em;line-height:1.2}'+
    '.dvag-tile.tac .dvag-tk{color:var(--tc);opacity:.85}'+
    '.dvag-tile.tdn .dvag-tk{color:#22c55e;opacity:.7}'+

    /* ── Gita Wisdom Ribbon ───────────────────────────────── */
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

    /* ── Tagged suggestions in dropdown ─────────────────── */
    '#dvag-drop-section{border-top:1px solid var(--border2);padding:10px 14px 12px}'+
    '.dvag-drop-hdr{display:flex;align-items:center;gap:8px;margin-bottom:9px}'+
    '.dvag-drop-tag{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;letter-spacing:.15em;padding:2px 8px;border-radius:20px;text-transform:uppercase}'+
    '.dvag-drop-chips{display:flex;flex-wrap:wrap;gap:6px}'+
    '.dvag-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;border:1.5px solid;font-size:12px;font-weight:600;background:none;transition:transform .2s var(--sp),background .2s;font-family:\'DM Sans\',sans-serif;cursor:pointer;animation:chin .22s ease both;white-space:nowrap}'+
    '.dvag-chip:hover{transform:translateY(-2px) scale(1.04)}'+
    '.dvag-drop-section-lbl{font-size:8px;font-weight:700;letter-spacing:.15em;color:var(--ink4);text-transform:uppercase;margin:8px 0 6px;display:flex;align-items:center;gap:6px}'+
    '.dvag-drop-section-lbl::before{content:\'\';width:3px;height:3px;border-radius:50%;background:var(--ink4);flex-shrink:0}'+

    /* ── Search cinema overlay ───────────────────────────── */
    '#dvag-cinema{position:fixed;inset:0;z-index:6000;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s ease;background:var(--bg0);overflow:hidden}'+
    '#dvag-cinema.cin-on{opacity:1;pointer-events:all}'+
    '#dvag-cinema::before{content:\'\';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.014) 2px,rgba(0,0,0,.014) 4px)}'+

    /* cinema rings */
    '.cin-ring{position:absolute;border-radius:50%;pointer-events:none;left:50%;top:50%;transform:translate(-50%,-50%)}'+
    '.cin-r1{width:380px;height:380px;border:1px solid rgba(255,122,0,.07)}'+
    '.cin-r2{width:530px;height:530px;border:1px solid rgba(255,122,0,.05);animation:cinRot 16s linear infinite}'+
    '.cin-r3{width:680px;height:680px;border:1px solid rgba(255,122,0,.03);animation:cinRot 24s linear infinite reverse}'+
    '.cin-r4{width:830px;height:830px;border:1px solid rgba(255,122,0,.015);animation:cinRot 34s linear infinite}'+
    '@keyframes cinRot{to{transform:translate(-50%,-50%) rotate(360deg)}}'+

    /* cinema brackets */
    '.cin-bk{position:absolute;width:40px;height:40px;pointer-events:none;opacity:.35}'+
    '.cin-bk-tl{top:20px;left:20px}'+
    '.cin-bk-tr{top:20px;right:20px;transform:scaleX(-1)}'+
    '.cin-bk-br{bottom:20px;right:20px;transform:scale(-1)}'+
    '.cin-bk-bl{bottom:20px;left:20px;transform:scaleY(-1)}'+

    /* cinema content */
    '.cin-logo{font-size:12px;font-weight:800;letter-spacing:.3em;color:var(--sf);font-family:\'Syne\',sans-serif;text-transform:uppercase;margin-bottom:4px;position:relative;z-index:2}'+
    '.cin-sub{font-size:8px;font-weight:700;letter-spacing:.26em;color:var(--ink4);text-transform:uppercase;margin-bottom:28px;position:relative;z-index:2}'+
    '.cin-qry{font-size:clamp(14px,3vw,20px);font-weight:800;font-family:\'Syne\',sans-serif;color:var(--ink);letter-spacing:-.02em;max-width:500px;text-align:center;margin-bottom:28px;padding:0 24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative;z-index:2}'+

    /* cinema agent rows */
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

    /* cinema progress */
    '.cin-prog{margin-top:24px;width:min(440px,90vw);position:relative;z-index:2}'+
    '.cin-prog-lbl{font-size:8.5px;font-weight:700;letter-spacing:.14em;color:var(--ink4);text-transform:uppercase;margin-bottom:6px;display:flex;justify-content:space-between}'+
    '.cin-bar-track{height:2.5px;border-radius:3px;background:var(--border2);overflow:hidden}'+
    '.cin-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#FF6600,#FFB347,#FF7A00);background-size:200% 100%;width:0%;transition:width .3s cubic-bezier(.4,0,.2,1);animation:dvBarShimmer 2s linear infinite}'+
    '@keyframes dvBarShimmer{0%{background-position:0%}100%{background-position:200%}}'+

    /* ── Knowledge page panels ────────────────────────────── */
    '.dvag-kp{background:var(--glass);backdrop-filter:blur(20px);border:1.5px solid var(--border2);border-radius:22px;padding:20px 24px;margin-bottom:16px;animation:kpPanelIn .38s var(--sp)}'+
    '.dvag-kph{display:flex;align-items:center;gap:8px;margin-bottom:14px}'+
    '.dvag-kpt{font-size:10px;font-weight:700;letter-spacing:.12em;color:var(--ink3);text-transform:uppercase}'+
    '.dvag-kps{margin-left:auto;font-size:10px;color:var(--ink4)}'+
    '.dvag-kspin{width:14px;height:14px;border:2px solid rgba(255,122,0,.22);border-top-color:var(--sf);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}'+
    '#dvag-gita-kp{border-color:rgba(217,119,6,.32)!important;background:linear-gradient(148deg,rgba(217,119,6,.06),rgba(180,83,9,.025))!important}'+
    /* AI panel */
    '#dvag-ai-kp{border-color:rgba(99,102,241,.22)!important;background:linear-gradient(148deg,rgba(99,102,241,.05),rgba(139,92,246,.025))!important}';

    document.head.appendChild(el);
  }

  /* ────────────────────────────────────────────────────────────
     5. AMBIENT CHROME ELEMENTS
  ──────────────────────────────────────────────────────────── */
  function buildAmbient(){
    if(document.getElementById('dvag-mesh')) return;
    ['dvag-mesh','dvag-scanlines','dvag-aurora'].forEach(function(id){
      var d=document.createElement('div'); d.id=id;
      document.body.prepend(d);
    });
  }

  /* ────────────────────────────────────────────────────────────
     6. AGENT HUD
  ──────────────────────────────────────────────────────────── */
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

    /* Insert directly after the desktop search bar (#desktop-search) */
    var sb=document.getElementById('desktop-search');
    if(sb&&sb.parentNode){ sb.parentNode.insertBefore(hud,sb.nextSibling); }
    else { var sp=document.getElementById('search-page'); if(sp) sp.appendChild(hud); }

    requestAnimationFrame(function(){ setTimeout(function(){ hud.classList.add('hud-show'); },250); });
  }

  /* tile state helpers */
  function tSet(id,st){
    var c=document.getElementById('dvt-'+id);
    var t=document.getElementById('dvtk-'+id);
    var ag=AGENTS.find(function(a){ return a.id===id; });
    if(c){ c.classList.remove('tac','tdn'); if(st==='active') c.classList.add('tac'); if(st==='done') c.classList.add('tdn'); }
    if(t) t.textContent=(st==='active'?(ag&&ag.task||'Working…'):(st==='done'?(ag&&ag.done||'Done'):'Standby'));
  }
  function allStandby(){ AGENTS.forEach(function(ag){ tSet(ag.id,'idle'); }); }

  /* ────────────────────────────────────────────────────────────
     7. GITA RIBBON (ambient wisdom, appears below HUD)
  ──────────────────────────────────────────────────────────── */
  var _ribbonBuilt=false;
  var _ribbonLoaded=false;

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

    /* Collapse toggle */
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
    var ref=pickDailyRef();
    var data=await fetchGitaVerse(ref.ch,ref.v);
    var c=document.getElementById('dvag-rbn-content');
    if(!c) return;
    if(!data){ c.innerHTML='<div class="dvag-rbn-tr" style="font-style:normal;opacity:.55">Wisdom loads momentarily…</div>'; return; }
    var skt=data.slok||'';
    var tr=(data.tej&&data.tej.et)||(data.siva&&data.siva.et)||(data.purohit&&data.purohit.et)||'';
    c.innerHTML=
      '<div class="dvag-rbn-ref">Bhagavad Gita '+ref.ch+'.'+ref.v+'</div>'+
      (skt?'<div class="dvag-rbn-skt">'+esc(skt.slice(0,110))+(skt.length>110?'…':'')+'</div>':'')+
      (tr?'<div class="dvag-rbn-tr">'+esc(tr.slice(0,150))+(tr.length>150?'…':'')+'</div>':'');
  }

  /* update ribbon with a search-relevant verse */
  async function updateRibbonForQuery(query){
    /* Always show a verse — use query hash for variety, topic-match if relevant */
    var ref=selectGitaRef(query)||pickVerseForQuery(query);
    var data=await fetchGitaVerse(ref.ch,ref.v);
    var c=document.getElementById('dvag-rbn-content');
    if(!c||!data) return;
    var skt=data.slok||'';
    var tr=(data.tej&&data.tej.et)||(data.siva&&data.siva.et)||(data.purohit&&data.purohit.et)||'';
    /* fade update */
    c.style.opacity='0';c.style.transition='opacity .25s';
    setTimeout(function(){
      c.innerHTML=
        '<div class="dvag-rbn-ref">Bhagavad Gita '+ref.ch+'.'+ref.v+'</div>'+
        (skt?'<div class="dvag-rbn-skt">'+esc(skt.slice(0,110))+(skt.length>110?'…':'')+'</div>':'')+
        (tr?'<div class="dvag-rbn-tr">'+esc(tr.slice(0,150))+(tr.length>150?'…':'')+'</div>':'');
      c.style.opacity='1';
      setTimeout(function(){ c.style.transition=''; },300);
    },200);
  }

  /* ────────────────────────────────────────────────────────────
     8. CINEMA OVERLAY
  ──────────────────────────────────────────────────────────── */
  function buildCinema(){
    if(document.getElementById('dvag-cinema')) return;
    /* SVG corner bracket */
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

  /* cinema helpers */
  function cinRow(id,st){
    var r=document.getElementById('cr-'+id);
    var t=document.getElementById('ct-'+id);
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

  /* ────────────────────────────────────────────────────────────
     9. SEARCH ANIMATION
  ──────────────────────────────────────────────────────────── */
  var _animBusy=false;

  function runAnimation(query,onDone){
    if(_animBusy){ onDone&&onDone(); return; }
    _animBusy=true;

    var ov=document.getElementById('dvag-cinema');
    var qEl=document.getElementById('cin-qry');
    if(qEl) qEl.textContent='\u201C'+query+'\u201D';

    AGENTS.forEach(function(ag){ cinRow(ag.id,'idle'); });
    cinProg(0,'Initializing agents…');
    allStandby();
    if(ov) ov.classList.add('cin-on');

    var STEP=255, HOLD=110;
    AGENTS.forEach(function(ag,i){
      setTimeout(function(){
        cinRow(ag.id,'on');
        tSet(ag.id,'active');
        cinProg((i/AGENTS.length)*80, ag.task);
      }, i*STEP);
      setTimeout(function(){
        cinRow(ag.id,'done');
        tSet(ag.id,'done');
      }, i*STEP+STEP+HOLD);
    });

    var total=AGENTS.length*STEP+STEP+HOLD+80;
    setTimeout(function(){ cinProg(100,'All agents ready →'); }, total-80);
    setTimeout(function(){
      if(ov) ov.classList.remove('cin-on');
      _animBusy=false;
      onDone&&onDone();
    }, total+180);
  }

  /* ────────────────────────────────────────────────────────────
     10. AGENT-TAGGED DROPDOWN SUGGESTIONS
  ──────────────────────────────────────────────────────────── */
  var _lastDropQ='';
  var _vegaTimer=null;

  function removeDropSection(){
    var el=document.getElementById('dvag-drop-section');
    if(el) el.remove();
  }

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

    /* Intent tag */
    var intentColor=intent.color||'#4285F4';
    var intentBg=hexRgba(intentColor,0.09);
    var intentBorder=hexRgba(intentColor,0.22);
    var intentHtml=
      '<div class="dvag-drop-hdr">'+
        '<span class="dvag-drop-tag" style="background:'+intentBg+';border:1px solid '+intentBorder+';color:'+intentColor+'">'+
          '<span style="font-size:9px">◎</span>'+
          'Orion · '+intent.agTag+
        '</span>'+
        '<span style="font-size:9px;color:var(--ink4);margin-left:auto">'+intent.icon+' '+intent.cat+'</span>'+
      '</div>';

    /* Nova platform chips */
    var novaBg=hexRgba('#4285F4',0.07);
    var novaChips=
      '<div class="dvag-drop-section-lbl" style="color:rgba(66,133,244,.7)">'+
        '<span style="color:#4285F4;font-size:9px">◈</span> Nova · Platform Navigator'+
      '</div>'+
      '<div class="dvag-drop-chips">'+
      routes.map(function(r,i){
        if(!r.name) return '';
        return '<button class="dvag-chip" style="border-color:'+r.color+'33;color:'+r.color+';animation-delay:'+(i*.06)+'s" '+
          'onclick="window.open(\''+r.url(query).replace(/'/g,"\\'")+"','_blank');event.stopPropagation()\">"+ 
          r.emoji+' '+r.name+
        '</button>';
      }).join('')+
      '</div>';

    /* Vega discovery chips (async) */
    var vegaHtml='';
    if(query.trim().split(' ').length<=3){
      vegaHtml=
        '<div class="dvag-drop-section-lbl" style="color:rgba(156,39,176,.7);margin-top:8px">'+
          '<span style="color:#9C27B0;font-size:9px">◇</span> Vega · Discovery Explorer'+
        '</div>'+
        '<div class="dvag-drop-chips" id="dvag-vega-chips"><div style="font-size:11px;color:var(--ink4);font-style:italic">Exploring…</div></div>';
    }

    sec.innerHTML=intentHtml+novaBg+novaChips+vegaHtml;
    drop.appendChild(sec);

    /* Load Vega chips async */
    if(vegaHtml){
      clearTimeout(_vegaTimer);
      _vegaTimer=setTimeout(function(){
        fetchWikiLinks(query).then(function(topics){
          var el=document.getElementById('dvag-vega-chips');
          if(!el) return;
          if(!topics.length){ el.innerHTML='<div style="font-size:11px;color:var(--ink4)">No related topics found</div>'; return; }
          el.innerHTML='';
          topics.slice(0,4).forEach(function(topic,i){
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

  /* hook into sb-input */
  function hookDropInput(){
    var inp=document.getElementById('sb-input');
    if(!inp||inp._dvDropHooked) return;
    inp._dvDropHooked=true;
    var _t=null;
    inp.addEventListener('input',function(){
      clearTimeout(_t);
      _t=setTimeout(function(){ injectDropSection(inp.value.trim()); },200);
    });
    /* clear agent section when dropdown closes */
    var drop=document.getElementById('drop');
    if(drop){
      var obs=new MutationObserver(function(){
        if(!drop.classList.contains('open')){ _lastDropQ=''; removeDropSection(); }
      });
      obs.observe(drop,{attributes:true,attributeFilter:['class']});
    }
  }

  /* ────────────────────────────────────────────────────────────
     10-B. TYPING DETECTION — hide panels while user types
  ──────────────────────────────────────────────────────────── */
  function hookTypingDetection(){
    var inp=document.getElementById('sb-input');
    if(!inp||inp._dvTypingHooked) return;
    inp._dvTypingHooked=true;

    function setTypingMode(active){
      var ps=document.querySelector('.platforms-section');
      var ss=document.getElementById('saved-quick');
      var hr=document.querySelector('.hint-row');
      if(ps) ps.classList.toggle('typing',active);
      if(ss) ss.classList.toggle('typing',active);
      if(hr){
        hr.style.transition='opacity .22s ease,transform .22s ease';
        hr.style.opacity=active?'0':'1';
        hr.style.pointerEvents=active?'none':'';
      }
    }

    inp.addEventListener('input',function(){ setTypingMode(inp.value.trim().length>0); });
    inp.addEventListener('focus',function(){ if(inp.value.trim().length>0) setTypingMode(true); });
    inp.addEventListener('blur',function(){ setTimeout(function(){ if(!inp.value.trim()) setTypingMode(false); },200); });
    var origClear=window.clearInput;
    if(typeof origClear==='function'&&!origClear._dvTypingPatched){
      window.clearInput=function(){
        origClear.apply(this,arguments);
        setTimeout(function(){ setTypingMode(false); },10);
      };
      window.clearInput._dvTypingPatched=true;
    }
  }

  /* ────────────────────────────────────────────────────────────
     10-C. FREE AI INSIGHT — Pollinations.ai (zero API key)
  ──────────────────────────────────────────────────────────── */
  async function fetchPollinationsInsight(query){
    try{
      var prompt='Give exactly 1 useful, specific insight (max 2 short sentences) about: +query+. Be direct. No preamble or quotes.';
      var url='https://text.pollinations.ai/'+encodeURIComponent(prompt)+'?model=mistral&seed='+queryHash(query);
      var ctrl=new AbortController();
      var timer=setTimeout(function(){ ctrl.abort(); },7000);
      var r=await fetch(url,{method:'GET',signal:ctrl.signal});
      clearTimeout(timer);
      if(!r.ok) return null;
      var text=await r.text();
      text=text.trim().replace(/^["']+|["']+$/g,'').replace(/
/g,' ');
      if(!text||text.length<10||text.length>380) return null;
      return text;
    }catch(e){ return null; }
  }

  function renderAiInsight(text){
    var panel=document.getElementById('dvag-ai-kp');
    var body=document.getElementById('dvag-ai-body');
    var loading=document.getElementById('dvag-ai-loading');
    if(!panel||!body) return;
    if(loading) loading.style.display='none';
    if(!text){ panel.style.display='none'; return; }
    body.innerHTML=
      '<div style="display:flex;align-items:flex-start;gap:11px;padding:12px 14px;'+
      'background:linear-gradient(135deg,rgba(99,102,241,.07),rgba(139,92,246,.04));'+
      'border:1.5px solid rgba(99,102,241,.18);border-radius:14px">'+
        '<span style="font-size:18px;flex-shrink:0;filter:drop-shadow(0 0 5px rgba(99,102,241,.4))">✦</span>'+
        '<div>'+
          '<div style="font-size:9px;font-weight:800;letter-spacing:.16em;color:rgba(99,102,241,.75);text-transform:uppercase;margin-bottom:5px">Free AI · Pollinations Intelligence</div>'+
          '<div style="font-size:13.5px;color:var(--ink2);line-height:1.68">'+esc(text)+'</div>'+
        '</div>'+
      '</div>';
    panel.style.display='block';
    kpFade(panel);
  }

  /* ────────────────────────────────────────────────────────────
     11. KNOWLEDGE PAGE PANELS
  ──────────────────────────────────────────────────────────── */
  function ensureKPPanels(){
    if(document.getElementById('dvag-kp-root')) return;
    var kpInner=document.querySelector('#knowledge-page > div');
    if(!kpInner) return;

    var root=document.createElement('div');
    root.id='dvag-kp-root';
    root.innerHTML=[
      '<div id="dvag-intent-kp" class="dvag-kp" style="display:none;border-color:rgba(255,122,0,.22)">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">◎</span><span class="dvag-kpt" style="color:var(--sf)">Orion &amp; Nova · Intent + Routing</span><span class="dvag-kps">Agents 1–2</span></div>'+
        '<div id="dvag-intent-body"></div>'+
      '</div>',
      '<div id="dvag-context-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">◬</span><span class="dvag-kpt">Zenith · Context Interpreter</span><span class="dvag-kps">Agent 6</span></div>'+
        '<div id="dvag-context-body" style="font-size:13px;color:var(--ink2);line-height:1.7"></div>'+
      '</div>',
      '<div id="dvag-discovery-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">◇</span><span class="dvag-kpt">Vega · Discovery Explorer</span><span class="dvag-kps">Agent 4</span></div>'+
        '<div id="dvag-disc-loading" style="display:flex;align-items:center;gap:10px;color:var(--ink3);font-size:13px"><div class="dvag-kspin"></div>Exploring topics…</div>'+
        '<div id="dvag-disc-body" style="display:none;flex-wrap:wrap;gap:8px"></div>'+
      '</div>',
      '<div id="dvag-insights-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">⬡</span><span class="dvag-kpt">Helix · Platform Analyst</span><span class="dvag-kps">Agent 5</span></div>'+
        '<div id="dvag-insights-body"></div>'+
      '</div>',
      '<div id="dvag-ai-kp" class="dvag-kp" style="display:none">'+
        '<div class="dvag-kph"><span style="font-size:15px;flex-shrink:0">✦</span><span class="dvag-kpt" style="color:rgba(99,102,241,.85)">Free AI · Pollinations Intelligence</span><span class="dvag-kps">no API key</span></div>'+
        '<div id="dvag-ai-loading" style="display:flex;align-items:center;gap:10px;color:var(--ink3);font-size:13px">'+
          '<div style="width:14px;height:14px;border:2px solid rgba(99,102,241,.2);border-top-color:rgba(99,102,241,.7);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0"></div>'+
          'Generating free AI insight…'+
        '</div>'+
        '<div id="dvag-ai-body"></div>'+
      '</div>',
      '<div id="dvag-gita-kp" class="dvag-kp" style="display:none" id="dvag-gita-kp">'+
        '<div class="dvag-kph"><span style="font-size:18px;flex-shrink:0">ॐ</span><span class="dvag-kpt" style="color:#D97706">Vyasa · Gita Wisdom Teller</span><span class="dvag-kps">Agent 7</span></div>'+
        '<div id="dvag-gita-loading" style="display:flex;align-items:center;gap:10px;color:var(--ink3);font-size:13px">'+
          '<div style="width:14px;height:14px;border:2px solid rgba(217,119,6,.2);border-top-color:#D97706;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0"></div>'+
          'Loading sacred wisdom…'+
        '</div>'+
        '<div id="dvag-gita-body" style="display:none"></div>'+
      '</div>'
    ].join('');

    /* Apply special styling to gita panel */
    var gitaPanel=root.querySelector('#dvag-gita-kp');
    if(gitaPanel){
      gitaPanel.style.cssText='display:none;border-color:rgba(217,119,6,.32)!important;background:linear-gradient(148deg,rgba(217,119,6,.06),rgba(180,83,9,.025))!important';
    }

    var kids=Array.from(kpInner.children);
    var anchor=null;
    kids.forEach(function(ch){ if(ch.textContent&&ch.textContent.trim().startsWith('Where to search')) anchor=ch; });
    if(anchor) kpInner.insertBefore(root,anchor);
    else kpInner.appendChild(root);
  }

  function kpShow(id,show){ var el=document.getElementById(id); if(el) el.style.display=show?'block':'none'; }
  function kpFade(el){
    if(!el) return;
    el.style.opacity='0';el.style.transform='translateY(10px)';
    requestAnimationFrame(function(){
      el.style.transition='opacity .3s ease,transform .3s ease';
      el.style.opacity='1';el.style.transform='';
      setTimeout(function(){ el.style.transition=''; },350);
    });
  }

  /* KP renderers */
  function renderIntentRouting(query,intent,routes){
    var body=document.getElementById('dvag-intent-body'); if(!body) return;
    var ic=intent.color||'#4285F4';
    body.innerHTML=
      '<div style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:'+hexRgba(ic,0.07)+';border:1.5px solid '+hexRgba(ic,0.16)+';border-radius:13px;margin-bottom:14px">'+
        '<span style="font-size:20px">'+intent.icon+'</span>'+
        '<div>'+
          '<div style="font-size:9.5px;font-weight:700;color:var(--ink4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px">◎ Orion detected</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--ink);font-family:\'Syne\',sans-serif;text-transform:capitalize">'+esc(intent.cat)+' query</div>'+
        '</div>'+
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
          '<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">'+
            '<span style="font-size:14px">'+r.emoji+'</span>'+
            '<span style="font-size:12px;font-weight:700;color:var(--ink)">'+esc(r.name)+'</span>'+
          '</div>'+
          '<div style="font-size:11px;color:var(--ink3)">'+esc(r.reason)+'</div>'+
        '</div>';
      }).join('')+'</div>';
    kpShow('dvag-intent-kp',true); kpFade(document.getElementById('dvag-intent-kp'));
    routes.forEach(function(_,i){ var el=document.getElementById('dvag-rt-'+i); if(el) setTimeout(function(){ el.style.transition='opacity .28s ease,transform .28s ease,border-color .2s,background .2s'; el.style.opacity='1'; el.style.transform=''; },75+i*55); });
  }

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

  function renderDiscovery(topics,query){
    var ld=document.getElementById('dvag-disc-loading');
    var bd=document.getElementById('dvag-disc-body');
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

  function renderInsights(intent){
    var body=document.getElementById('dvag-insights-body'); if(!body) return;
    var T={
      shopping:[
        {icon:'🛒',plat:'Amazon',tip:'Filter by "Sold by Amazon" for authentic products. Use the Coupons section for extra savings.',color:'#FF9900'},
        {icon:'🛍️',plat:'Flipkart',tip:'Use F-Assured filter for fast delivery. Check No Cost EMI options.',color:'#2874F0'}
      ],
      tutorial:[
        {icon:'▶️',plat:'YouTube',tip:'Filter by Upload Date → This Year. Use Chapters for structured learning.',color:'#FF0000'},
        {icon:'🔴',plat:'Reddit',tip:'Subreddit wikis have curated learning roadmaps and resource lists.',color:'#FF4500'}
      ],
      programming:[
        {icon:'📋',plat:'Stack Overflow',tip:'Sort by Votes not Newest. Green tick = accepted answer.',color:'#F48024'},
        {icon:'🐙',plat:'GitHub',tip:'Search Issues and Discussions tabs for bug workarounds first.',color:'#24292e'}
      ],
      discussion:[{icon:'🔴',plat:'Reddit',tip:'Sort by Top (All Time) for best community insights on any topic.',color:'#FF4500'}],
      knowledge:[{icon:'📖',plat:'Wikipedia',tip:'Jump straight to References for primary sources. Check the Talk page for disputes.',color:'#3366CC'}],
      spiritual:[{icon:'ॐ',plat:'Vyasa Agent',tip:'See the Vyasa panel below for a relevant Bhagavad Gita verse on this topic.',color:'#D97706'}],
      video:[{icon:'▶️',plat:'YouTube',tip:'Use hashtags (#) to find niche content. Creative Commons filter for reusable videos.',color:'#FF0000'}],
      local:[{icon:'🗺️',plat:'Google Maps',tip:'Enable "Open Now" filter. Check Q&A for crowd-sourced local tips.',color:'#34A853'}],
      general:[{icon:'🔍',plat:'Google',tip:'Use quotes for exact phrases. Add site: to search within a domain.',color:'#4285F4'}]
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

  function renderGitaKP(data,ch,v){
    var ld=document.getElementById('dvag-gita-loading');
    var bd=document.getElementById('dvag-gita-body');
    if(ld) ld.style.display='none';
    if(!data){ kpShow('dvag-gita-kp',false); return; }
    if(!bd) return;
    var skt=data.slok||'';
    var tr=(data.tej&&data.tej.et)||(data.siva&&data.siva.et)||(data.purohit&&data.purohit.et)||'';
    var mn=(data.tej&&data.tej.ec)||(data.siva&&data.siva.ec)||'';
    bd.innerHTML=
      '<div style="font-size:10px;font-weight:700;color:#D97706;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Chapter '+esc(ch)+' &middot; Verse '+esc(v)+'</div>'+
      (skt?'<div style="font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.9;font-family:serif;margin-bottom:13px;padding:14px 16px;background:rgba(217,119,6,.07);border-radius:12px;border-left:3px solid #D97706">'+esc(skt)+'</div>':'')+
      (tr?'<div style="font-size:13px;color:var(--ink2);line-height:1.75;margin-bottom:10px"><strong style="font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink4)">Translation</strong><br><br>'+esc(tr)+'</div>':'')+
      (mn?'<div style="font-size:12.5px;color:var(--ink3);line-height:1.65;padding:10px 13px;background:var(--sfbg);border-radius:10px;margin-bottom:12px"><strong style="font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink4)">Meaning</strong><br><br>'+esc(mn)+'</div>':'')+
      '<a href="https://www.holy-bhagavad-gita.org/chapter/'+esc(ch)+'/verse/'+esc(v)+'" target="_blank" rel="noopener" '+
      'style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#D97706;text-decoration:none;padding:6px 14px;border:1.5px solid rgba(217,119,6,.28);border-radius:20px;background:rgba(217,119,6,.07)">'+
      'Read full commentary →</a>';
    bd.style.display='block';
    kpShow('dvag-gita-kp',true);
    kpFade(document.getElementById('dvag-gita-kp'));
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

  /* ────────────────────────────────────────────────────────────
     12. MAIN AGENT RUN (knowledge page)
  ──────────────────────────────────────────────────────────── */
  function runAgents(query,platform){
    if(!query) return;
    ensureKPPanels();

    ['dvag-intent-kp','dvag-context-kp','dvag-discovery-kp','dvag-insights-kp','dvag-gita-kp','dvag-ai-kp'].forEach(function(id){ kpShow(id,false); });
    var dL=document.getElementById('dvag-disc-loading'),dB=document.getElementById('dvag-disc-body');
    if(dL) dL.style.display='flex'; if(dB){ dB.style.display='none'; dB.innerHTML=''; }
    var gL=document.getElementById('dvag-gita-loading'),gB=document.getElementById('dvag-gita-body');
    if(gL) gL.style.display='flex'; if(gB){ gB.style.display='none'; gB.innerHTML=''; }
    var aiL=document.getElementById('dvag-ai-loading'),aiB=document.getElementById('dvag-ai-body');
    if(aiL) aiL.style.display='flex'; if(aiB){ aiB.style.display='none'; aiB.innerHTML=''; }

    var intent=detectIntent(query);
    var rIds=PLATFORM_ROUTES[intent.cat]||PLATFORM_ROUTES.general;
    var routes=rIds.map(function(id){ return Object.assign({id:id},PM[id]||{name:id,emoji:'🔍',color:'#888',url:function(q){ return 'https://www.google.com/search?q='+encodeURIComponent(q); },reason:'Search here'}); });

    renderIntentRouting(query,intent,routes);
    tSet('orion','done'); tSet('nova','done');

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
    if(query.trim().split(/\s+/).length<=4){
      tSet('zenith','active');
      fetchWikiSearch(query).then(function(c){ renderContext(c); tSet('zenith','done'); }).catch(function(){ kpShow('dvag-context-kp',false); tSet('zenith','done'); });
    } else { tSet('zenith','done'); }

    /* Vyasa — always show a verse, unique per query */
    kpShow('dvag-gita-kp',true); tSet('vyasa','active');
    var ref=selectGitaRef(query)||pickVerseForQuery(query);
    fetchGitaVerse(ref.ch,ref.v).then(function(d){
      if(d) renderGitaKP(d,ref.ch,ref.v);
      else kpShow('dvag-gita-kp',false);
      tSet('vyasa','done');
    }).catch(function(){ kpShow('dvag-gita-kp',false); tSet('vyasa','done'); });

    /* Update ambient ribbon with relevant verse */
    updateRibbonForQuery(query);

    /* Free AI insight via Pollinations.ai */
    kpShow('dvag-ai-kp',true);
    fetchPollinationsInsight(query).then(function(txt){ renderAiInsight(txt); }).catch(function(){ kpShow('dvag-ai-kp',false); });
  }

  /* ────────────────────────────────────────────────────────────
     13. HOOK INTO EXISTING FUNCTIONS
  ──────────────────────────────────────────────────────────── */
  function hookFunctions(){
    /* Wrap fireSearch → inject cinema animation */
    if(typeof window.fireSearch==='function'&&!window.fireSearch._dvagV3){
      var _orig=window.fireSearch;
      window.fireSearch=function(mode,forcePlatform){
        var inp=(mode==='mobile')?document.getElementById('msb-input'):document.getElementById('sb-input');
        var q=(inp&&inp.value||'').trim();
        if(!q||!window.state||!window.state.authUser||!window.state.member){
          _orig(mode,forcePlatform); return;
        }
        runAnimation(q,function(){ _orig(mode,forcePlatform); });
      };
      window.fireSearch._dvagV3=true;
    }

    /* Wrap openKnowledgePage → run agents after */
    if(typeof window.openKnowledgePage==='function'&&!window.openKnowledgePage._dvagV3){
      var _origKP=window.openKnowledgePage;
      window.openKnowledgePage=function(query,platform){
        _origKP(query,platform);
        setTimeout(function(){ runAgents(query,platform); },55);
      };
      window.openKnowledgePage._dvagV3=true;
    }
  }

  /* ────────────────────────────────────────────────────────────
     14. INIT
  ──────────────────────────────────────────────────────────── */
  var _built=false;

  function buildAll(){
    if(_built) return;
    var sp=document.getElementById('search-page');
    if(!sp||(sp.style.display!=='flex'&&sp.style.display!=='')) return;
    _built=true;
    buildHUD();
    buildRibbon();
    buildCinema();
    hookDropInput();
    hookTypingDetection();
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
      setTimeout(function(){ clearInterval(iv); _built=true; buildHUD(); buildRibbon(); buildCinema(); hookDropInput(); hookTypingDetection(); },4000);
    }

    /* Watch for search page visibility (after login) */
    var sp=document.getElementById('search-page');
    if(sp){
      var obs=new MutationObserver(function(){
        if(sp.style.display==='flex'||sp.style.display===''){
          if(!document.getElementById('dvag-hud')){ _built=false; buildAll(); hookDropInput(); hookTypingDetection(); }
        }
      });
      obs.observe(sp,{attributes:true,attributeFilter:['style']});
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
    isGitaQuery:isGitaQ
  };

})();
