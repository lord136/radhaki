/* ═══════════════════════════════════════════════════════════════
   DIVYAM — script.js
   Firebase compat (no ES modules = no Vercel white-screen)
   Collection: PREM / {user.uid}
═══════════════════════════════════════════════════════════════ */

/* ─────────── Firebase config + init ─────────── */
(function initFirebase() {
  var cfg = {
    apiKey: "AIzaSyAAZ3sEJsMhvgTj4FOroyjgd4AIpnWm_nA",
    authDomain: "divy-1339d.firebaseapp.com",
    projectId: "divy-1339d",
    storageBucket: "divy-1339d.firebasestorage.app",
    messagingSenderId: "1013492970798",
    appId: "1:1013492970798:web:c24f32a481ec000019b6bf"
  };
  if (!firebase.apps.length) firebase.initializeApp(cfg);

  var auth     = firebase.auth();
  var db       = firebase.firestore();
  var storage  = firebase.storage();
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });

  window._auth    = auth;
  window._db      = db;
  window._storage = storage;
  window._prov    = provider;

  /* ── Auth state listener ── */
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      var token = await user.getIdToken(false);
      localStorage.setItem("dv_tok", token);
      localStorage.setItem("dv_usr", JSON.stringify({
        uid: user.uid, email: user.email,
        displayName: user.displayName, photoURL: user.photoURL
      }));
      /* Ensure PREM doc exists, then check membership */
      await ensurePremDoc(user);
      var isLifetime = await checkMembership(user.uid);
      if (isLifetime) localStorage.setItem("dv_lifetime", "1");
      else            localStorage.removeItem("dv_lifetime");
      if (window._appReady) window._onAuthChange(user, token, isLifetime);
    } else {
      localStorage.removeItem("dv_tok");
      localStorage.removeItem("dv_usr");
      localStorage.removeItem("dv_lifetime");
      if (window._appReady) window._onAuthChange(null, null, false);
    }
  });

  /* ── Google login ── */
  window._googleLogin = async function() {
    var result = await auth.signInWithPopup(provider);
    var token  = await result.user.getIdToken();
    localStorage.setItem("dv_tok", token);
    return { user: result.user, token: token };
  };

  /* ── Logout ── */
  window._googleLogout = async function() {
    await auth.signOut();
    ["dv_tok","dv_usr","dv_mem","dv_lifetime"].forEach(function(k){ localStorage.removeItem(k); });
  };

  /* ── Ensure PREM/{uid} doc exists ── */
  async function ensurePremDoc(user) {
    try {
      var ref  = db.collection("PREM").doc(user.uid);
      var snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          email:             user.email,
          membership_status: "inactive",
          payment_status:    "pending",
          screenshot_url:    "",
          payment_date:      firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch(e) { console.warn("ensurePremDoc:", e.message); }
  }

  /* ── Check lifetime membership ── */
  async function checkMembership(uid) {
    try {
      var snap = await db.collection("PREM").doc(uid).get();
      return snap.exists && snap.data().membership_status === "lifetime";
    } catch(e) { return false; }
  }
  window._checkMembership = checkMembership;

  /* ── Upload screenshot + update PREM doc ── */
  window._submitScreenshot = async function(file, amount) {
    var user = auth.currentUser;
    if (!user) throw new Error("not_logged_in");

    /* Block if already lifetime */
    var alreadyMember = await checkMembership(user.uid);
    if (alreadyMember) throw new Error("already_member");

    /* Block if already has a pending/approved submission */
    var ref  = db.collection("PREM").doc(user.uid);
    var snap = await ref.get();
    if (snap.exists) {
      var d = snap.data();
      if (d.payment_status === "approved")          throw new Error("already_member");
      if (d.payment_status === "pending" && d.screenshot_url) throw new Error("duplicate_upload");
    }

    /* Upload to Firebase Storage */
    var ext        = file.name.split(".").pop() || "jpg";
    var path       = "payment_screenshots/" + user.uid + "_" + Date.now() + "." + ext;
    var storageRef = storage.ref(path);
    var uploadSnap = await storageRef.put(file);
    var url        = await uploadSnap.ref.getDownloadURL();

    /* Update PREM document */
    await ref.set({
      email:             user.email,
      screenshot_url:    url,
      payment_amount:    amount,
      payment_status:    "pending",
      membership_status: "inactive",
      payment_date:      firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return true;
  };

  /* ── Admin: get all PREM docs ── */
  window._getAdminPayments = async function() {
    try {
      var snap = await db.collection("PREM").orderBy("payment_date", "desc").get();
      return snap.docs.map(function(d) {
        return Object.assign({ uid: d.id }, d.data());
      });
    } catch(e) { return []; }
  };

  /* ── Admin: approve → set lifetime ── */
  window._approvePayment = async function(uid) {
    await db.collection("PREM").doc(uid).update({
      membership_status: "lifetime",
      payment_status:    "approved"
    });
  };

  /* ── Admin: reject ── */
  window._rejectPayment = async function(uid) {
    await db.collection("PREM").doc(uid).update({
      payment_status: "rejected"
    });
  };

})();

/* ═══════════════════════════════════════════════════════════════
   PLATFORM DATA
═══════════════════════════════════════════════════════════════ */
var P = {
  amazon:      { id:"amazon",      name:"Amazon",      emoji:"🛒", color:"#FF9900",
    bg:"linear-gradient(148deg,#FFF8EC,#FFEFD0)", dbg:"linear-gradient(148deg,#2A1F00,#1A1300)",
    aliases:["@az","@amazon"], kw:["buy","order","price","deal","shop","cart","deliver","purchase","product","sale","offer"],
    cat:["electronics","laptop","phone","headphones","shoes","book","kitchen","appliance"],
    url: function(q){ return "https://www.amazon.in/s?k="+encodeURIComponent(q); } },
  flipkart:    { id:"flipkart",    name:"Flipkart",    emoji:"🛍️", color:"#2874F0",
    bg:"linear-gradient(148deg,#EFF5FF,#DFEDFF)", dbg:"linear-gradient(148deg,#001230,#000D22)",
    aliases:["@fk","@flipkart"], kw:["flipkart","emi","big billion"], cat:[],
    url: function(q){ return "https://www.flipkart.com/search?q="+encodeURIComponent(q); } },
  myntra:      { id:"myntra",      name:"Myntra",      emoji:"👗", color:"#FF3F6C",
    bg:"linear-gradient(148deg,#FFF0F4,#FFE0EA)", dbg:"linear-gradient(148deg,#220010,#150008)",
    aliases:["@mn","@myntra"], kw:["fashion","clothes","dress","shirt","jeans","kurta","saree","ethnic","wear","style"], cat:[],
    url: function(q){ return "https://www.myntra.com/"+encodeURIComponent(q); } },
  youtube:     { id:"youtube",     name:"YouTube",     emoji:"▶️", color:"#FF0000",
    bg:"linear-gradient(148deg,#FFF0F0,#FFE0E0)", dbg:"linear-gradient(148deg,#220000,#150000)",
    aliases:["@yt","@youtube"], kw:["video","watch","music","song","tutorial","review","trailer","reel","stream","listen","podcast"], cat:[],
    url: function(q){ return "https://www.youtube.com/results?search_query="+encodeURIComponent(q); } },
  maps:        { id:"maps",        name:"Maps",        emoji:"🗺️", color:"#34A853",
    bg:"linear-gradient(148deg,#F0FFF4,#DFFFEA)", dbg:"linear-gradient(148deg,#001A0A,#000F06)",
    aliases:["@mp","@maps"], kw:["near me","location","direction","navigate","route","address","how to reach","distance","hospital"], cat:[],
    url: function(q){ return "https://www.google.com/maps/search/"+encodeURIComponent(q); } },
  google:      { id:"google",      name:"Google",      emoji:"🔍", color:"#4285F4",
    bg:"linear-gradient(148deg,#F0F4FF,#E0EAFF)", dbg:"linear-gradient(148deg,#000A1A,#000510)",
    aliases:["@g","@google"], kw:[], cat:[],
    url: function(q){ return "https://www.google.com/search?q="+encodeURIComponent(q); } },
  stackoverflow:{ id:"stackoverflow",name:"StackOverflow",emoji:"📋",color:"#F48024",
    bg:"linear-gradient(148deg,#FFF4EC,#FFEAD0)", dbg:"linear-gradient(148deg,#1A0A00,#100600)",
    aliases:["@so","@stack"], kw:["error","bug","code","fix","exception","syntax","debug","undefined","null","how to code"], cat:[],
    url: function(q){ return "https://stackoverflow.com/search?q="+encodeURIComponent(q); } },
  reddit:      { id:"reddit",      name:"Reddit",      emoji:"🔴", color:"#FF4500",
    bg:"linear-gradient(148deg,#FFF2EE,#FFE4DA)", dbg:"linear-gradient(148deg,#1A0500,#0F0300)",
    aliases:["@rd","@reddit"], kw:["discussion","opinion","community","thread","recommend","thoughts","vs","better"], cat:[],
    url: function(q){ return "https://www.reddit.com/search/?q="+encodeURIComponent(q); } },
  github:      { id:"github",      name:"GitHub",      emoji:"🐙", color:"#24292e",
    bg:"linear-gradient(148deg,#F6F8FA,#EBEFF4)", dbg:"linear-gradient(148deg,#0D0D0D,#050505)",
    aliases:["@gh","@github"], kw:["github","repository","open source","library","framework","npm","package","repo"], cat:[],
    url: function(q){ return "https://github.com/search?q="+encodeURIComponent(q); } }
};
var QIDS    = ["youtube","amazon","flipkart","myntra","maps","stackoverflow","reddit"];
var FILLERS = ["show me","find me","i want to","i need","please","can you","search for","look up",
               "on youtube","on amazon","on flipkart","on myntra","on google","on maps",
               "videos of","video of","near me in"];

/* ═══════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════ */
var state = {
  searches: 0,
  member:   false,
  authUser: null,
  token:    null,
  dark:     localStorage.getItem("dv_dark") === "true" ||
            (window.matchMedia && window.matchMedia("(prefers-color-scheme:dark)").matches),
  trending:     [],
  tourStep:     0,
  portalActive: false,
  pendingUrl:   null,
  micState:     "idle",
  recognition:  null
};

/* ═══════════════════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
═══════════════════════════════════════════════════════════════ */
function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch(e) { return fb; } }
function lsSet(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }
function getHistory()  { return lsGet("dv_hist", []); }
function addHistory(e) { var h = getHistory().filter(function(x){ return x.query !== e.query; }); h.unshift(Object.assign({}, e, {ts: Date.now()})); lsSet("dv_hist", h.slice(0, 30)); }
function clearHistoryData() { localStorage.removeItem("dv_hist"); }
function getSaved()    { return lsGet("dv_saved", []); }
function addSaved(e)   { var s = getSaved(); if (!s.find(function(x){ return x.query === e.query && x.platform === e.platform; })) { s.unshift(Object.assign({}, e, {id: Date.now()})); lsSet("dv_saved", s.slice(0, 20)); } }
function removeSaved(id) { lsSet("dv_saved", getSaved().filter(function(x){ return x.id !== id; })); }

/* ═══════════════════════════════════════════════════════════════
   ADMIN
═══════════════════════════════════════════════════════════════ */
var ADMIN_EMAILS = ["prempeswani1609@gmail.com"];
function isAdmin() {
  return state.authUser && ADMIN_EMAILS.indexOf((state.authUser.email || "").toLowerCase()) !== -1;
}
function escHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

async function openAdminPanel() {
  if (!isAdmin()) { alert("Not authorized."); return; }
  openOverlay("admin-overlay");
  await renderAdminPanel();
}

async function renderAdminPanel() {
  var body = document.getElementById("admin-panel-body");
  body.innerHTML = '<div style="padding:28px;text-align:center;color:var(--ink3)"><div style="font-size:26px;margin-bottom:8px">⏳</div>Loading payments…</div>';
  try {
    var payments = await window._getAdminPayments();
    if (!payments.length) {
      body.innerHTML = '<div style="padding:36px;text-align:center;color:var(--ink3);font-size:13px">No submissions yet.</div>';
      return;
    }
    body.innerHTML = "";
    payments.forEach(function(p) {
      var ts = p.payment_date && p.payment_date.seconds
        ? new Date(p.payment_date.seconds * 1000).toLocaleString("en-IN",
            { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
        : "—";
      var sc = p.payment_status === "approved" ? "#006630"
             : p.payment_status === "rejected" ? "#CC3300" : "#885500";
      var card = document.createElement("div");
      card.style.cssText = "background:var(--sfbg);border:1.5px solid var(--border2);border-radius:16px;padding:14px 16px;margin-bottom:10px";
      card.innerHTML =
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">' +
          '<div>' +
            '<div style="font-size:13px;font-weight:700;color:var(--ink)">' + escHtml(p.email || "—") + '</div>' +
            '<div style="font-size:11px;color:var(--ink3);margin-top:3px">' + ts + '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">' +
            '<span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:' + sc + '18;color:' + sc + ';border:1px solid ' + sc + '30">' + escHtml(p.payment_status || "—") + '</span>' +
            '<span style="font-size:13px;font-weight:800;color:var(--sf)">₹' + escHtml(p.payment_amount || "199") + '</span>' +
          '</div>' +
        '</div>' +
        (p.screenshot_url ? '<a href="' + escHtml(p.screenshot_url) + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--sf);text-decoration:none;margin-bottom:10px;padding:5px 12px;background:var(--sfbg2);border-radius:8px;border:1px solid var(--border2)">📷 View Screenshot ↗</a><br>' : '') +
        (p.payment_status === "pending"
          ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">' +
              '<button data-uid="' + escHtml(p.uid) + '" onclick="adminApprove(this.dataset.uid)" style="flex:1;min-width:120px;padding:9px 0;background:linear-gradient(135deg,#00A050,#00C060);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;cursor:pointer">✓ Approve</button>' +
              '<button data-uid="' + escHtml(p.uid) + '" onclick="adminReject(this.dataset.uid)" style="flex:1;min-width:120px;padding:9px 0;background:rgba(200,40,0,.08);color:#CC3300;border:1.5px solid rgba(200,40,0,.2);border-radius:10px;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;cursor:pointer">✗ Reject</button>' +
            '</div>'
          : '<span style="font-size:12px;color:var(--ink3);font-style:italic">No pending actions</span>'
        );
      body.appendChild(card);
    });
  } catch(e) {
    body.innerHTML = '<div style="padding:24px;text-align:center;color:#CC3300;font-size:13px">Error: ' + escHtml(e.message) + '</div>';
  }
}

async function adminApprove(uid) {
  if (!confirm("Approve payment and activate lifetime membership?")) return;
  try {
    await window._approvePayment(uid);
    alert("✅ Lifetime membership activated!");
    await renderAdminPanel();
  } catch(e) { alert("Error: " + e.message); }
}
async function adminReject(uid) {
  if (!confirm("Reject this submission?")) return;
  try {
    await window._rejectPayment(uid);
    await renderAdminPanel();
  } catch(e) { alert("Error: " + e.message); }
}

/* ═══════════════════════════════════════════════════════════════
   UPI PAYMENT SYSTEM
═══════════════════════════════════════════════════════════════ */
var UPI_ID     = "prempeswani1609@okaxis";
var UPI_AMOUNT = "149";
var UPI_NAME   = "Divyam";

function getUpiLink() {
  return "upi://pay?pa=" + UPI_ID + "&pn=" + encodeURIComponent(UPI_NAME) + "&am=" + UPI_AMOUNT + "&cu=INR";
}

function showMemStep(step) {
  ["info","upi","confirm"].forEach(function(s) {
    var el = document.getElementById("mem-step-" + s);
    if (el) el.style.display = (s === step) ? "block" : "none";
  });
  if (step === "upi") setupUpiQr();
  if (step === "confirm") {
    var emailEl = document.getElementById("confirm-email");
    if (emailEl && state.authUser) emailEl.textContent = state.authUser.email || "";
  }
}

function setupUpiQr() {
  var link   = getUpiLink();
  var qrUrl  = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=ffffff&color=1A0F00&data=" + encodeURIComponent(link);
  var img    = document.getElementById("upi-qr-img");
  if (img)   img.src = qrUrl;
  var a      = document.getElementById("upi-deep-link");
  if (a)     a.href  = link;
}

function openUpiApp(e) {
  e.preventDefault();
  window.location.href = getUpiLink();
  setTimeout(function() { showMemStep("confirm"); }, 1800);
}

var _selectedFile = null;

function handleScreenshotSelect(e) {
  var file = e.target.files[0];
  if (!file) return;
  _selectedFile = file;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = document.getElementById("ss-img");
    if (img) img.src = ev.target.result;
    var prev = document.getElementById("ss-preview");
    var phld = document.getElementById("ss-placeholder");
    if (prev) prev.style.display = "block";
    if (phld) phld.style.display = "none";
  };
  reader.readAsDataURL(file);
  var btn = document.getElementById("submit-ss-btn");
  if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
  setUploadMsg("", "");
}

function setUploadMsg(msg, type) {
  var el = document.getElementById("upload-msg");
  if (!msg) { el.style.display = "none"; return; }
  el.style.display = "block";
  var colors = {
    error:   "rgba(200,40,0,.08)|rgba(200,40,0,.2)|#CC3300",
    success: "rgba(0,140,70,.08)|rgba(0,140,70,.2)|#006630",
    info:    "rgba(255,122,0,.08)|rgba(255,122,0,.2)|var(--sf)"
  };
  var parts = (colors[type] || colors.info).split("|");
  el.style.background = parts[0];
  el.style.border     = "1.5px solid " + parts[1];
  el.style.color      = parts[2];
  el.textContent      = msg;
}

async function submitScreenshot() {
  if (!state.authUser) { showPage("auth"); closePopup(); return; }
  if (!_selectedFile)  { setUploadMsg("Please select a screenshot first.", "error"); return; }
  var btn = document.getElementById("submit-ss-btn");
  btn.disabled = true;
  btn.textContent = "Uploading…";
  try {
    await window._submitScreenshot(_selectedFile, UPI_AMOUNT);
    showMemStep("pending");
  } catch(e) {
    if (e.message === "already_member") {
      setUploadMsg("You already have lifetime membership! 🎉", "success");
      setTimeout(closePopup, 2000);
    } else if (e.message === "duplicate_upload") {
      setUploadMsg("A payment is already pending or approved for your account.", "error");
    } else {
      setUploadMsg("Upload failed: " + e.message, "error");
    }
    btn.disabled = false;
    btn.textContent = "Submit for Verification";
    btn.style.opacity = "1";
  }
}

/* ═══════════════════════════════════════════════════════════════
   POPUP OPEN / CLOSE
═══════════════════════════════════════════════════════════════ */
function openPopup() {
  if (!state.authUser) { showPage("auth"); return; }
  document.getElementById("mem-popup").classList.add("open");
  showMemStep("info");
}
function closePopup() {
  document.getElementById("mem-popup").classList.remove("open");
}

/* ═══════════════════════════════════════════════════════════════
   COUNTER / SEARCHES
═══════════════════════════════════════════════════════════════ */
function setSearches(n) {
  state.searches = n;
  var label = document.getElementById("counter-label");
  var dotsEl = document.getElementById("counter-dots");
  var ctr    = document.getElementById("counter");
  if (n === "∞" || n === Infinity) {
    if (label) label.textContent = "Unlimited";
    if (dotsEl) dotsEl.innerHTML = '<span style="font-size:14px;line-height:1">∞</span>';
    if (ctr)   { ctr.classList.remove("empty"); ctr.classList.remove("anim"); }
    return;
  }
  if (n === 0) {
    if (label) label.textContent = "Members Only";
    if (dotsEl) dotsEl.innerHTML = '<span style="font-size:11px;line-height:1">🔒</span>';
    if (ctr)   { ctr.classList.add("empty"); }
    return;
  }
  var max = 5;
  if (label) label.textContent = n > 0 ? n + " left" : "No searches left";
  if (dotsEl) {
    dotsEl.innerHTML = "";
    for (var i = 0; i < max; i++) {
      var d = document.createElement("div");
      d.className = "cdot" + (i < n ? (n <= 2 ? " low" : " on") : "");
      dotsEl.appendChild(d);
    }
  }
  if (ctr) {
    ctr.classList.toggle("empty", n === 0);
    ctr.classList.add("anim");
    setTimeout(function(){ ctr.classList.remove("anim"); }, 400);
  }
}

function decrementSearches() {
  if (typeof state.searches === "number" && state.searches > 0) {
    setSearches(state.searches - 1);
  }
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER UI
═══════════════════════════════════════════════════════════════ */
function applyMemberUI() {
  var badge = document.getElementById("member-badge");
  var exEl  = document.getElementById("expiry-label");
  if (badge) badge.style.display = state.member ? "inline-flex" : "none";
  if (exEl) {
    if (state.member) { exEl.textContent = "Lifetime ✦"; exEl.style.display = "block"; }
    else              exEl.style.display = "none";
  }
}

/* ═══════════════════════════════════════════════════════════════
   AUTH UI
═══════════════════════════════════════════════════════════════ */
var GOOGLE_SVG = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';

async function handleGoogleLogin() {
  var btn   = document.getElementById("google-btn");
  var errEl = document.getElementById("auth-err");
  btn.disabled = true;
  btn.innerHTML = '<div style="width:16px;height:16px;border:2.5px solid rgba(60,64,67,.3);border-top-color:#4285F4;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:8px"></div> Signing in…';
  errEl.classList.remove("visible");
  try {
    var res = await window._googleLogin();
    state.authUser = res.user;
    state.token    = res.token;
    var isLifetime = await window._checkMembership(res.user.uid).catch(function(){ return false; });
    if (isLifetime) { state.member = true; setSearches("∞"); localStorage.setItem("dv_lifetime","1"); }
    else            { state.member = false; setSearches(0); localStorage.removeItem("dv_lifetime"); }
    applyAuthUI();
    showPage("search");
  } catch(e) {
    var msgs = {
      "auth/popup-closed-by-user": "Login cancelled.",
      "auth/popup-blocked":        "Popup blocked — allow popups for this site.",
      "auth/network-request-failed": "Network error. Check your connection."
    };
    errEl.textContent = msgs[e.code] || e.message || "Login failed.";
    errEl.classList.add("visible");
  }
  btn.disabled = false;
  btn.innerHTML = GOOGLE_SVG + " Continue with Google";
}

async function handleLogout() {
  await window._googleLogout();
  state.authUser = null; state.token = null; state.member = false;
  setSearches(0);
  applyAuthUI();
  showPage("auth");
}

function applyAuthUI() {
  var area    = document.getElementById("auth-area");
  var cta     = document.getElementById("signin-cta");
  var welcome = document.getElementById("hero-welcome");
  if (!area) return;

  if (state.authUser) {
    var u           = state.authUser;
    var displayName = ((u.displayName || u.email || "").split(" ")[0]) || "there";
    var adminBtn    = isAdmin()
      ? '<button onclick="openAdminPanel();document.getElementById(\'avatar-menu\').classList.remove(\'open\')" style="width:100%;padding:9px 0;border-radius:11px;font-size:12px;background:var(--sfbg);border:1.5px solid rgba(255,122,0,.22);color:var(--sf);font-family:\'DM Sans\',sans-serif;font-weight:600;margin-bottom:8px">🛡 Admin Panel</button>'
      : "";
    var memberBadge = state.member
      ? '<div class="mbadge" style="margin-bottom:10px;width:100%;justify-content:center">✦ LIFETIME MEMBER</div>'
      : "";
    area.innerHTML =
      '<div class="avatar-wrap">' +
        '<div class="avatar" onclick="document.getElementById(\'avatar-menu\').classList.toggle(\'open\')" style="' + (state.member ? "border-color:rgba(255,150,0,.5)" : "") + '">' +
          (u.photoURL ? '<img src="' + escHtml(u.photoURL) + '" alt="" style="width:100%;height:100%;object-fit:cover"/>' : '<span>' + escHtml((u.displayName || u.email || "U")[0].toUpperCase()) + '</span>') +
        '</div>' +
        '<div class="avatar-menu" id="avatar-menu">' +
          memberBadge +
          '<p class="avatar-email">Signed in as</p>' +
          '<p class="avatar-name">' + escHtml(u.email || "") + '</p>' +
          adminBtn +
          '<button class="bout" onclick="handleLogout()" style="width:100%;padding:9px 0;border-radius:11px;font-size:12px">Sign Out</button>' +
        '</div>' +
      '</div>';

    if (welcome) {
      var wn = document.getElementById("welcome-name");
      if (wn) wn.textContent = displayName;
      welcome.style.display = "block";
    }
    if (cta) cta.style.display = "none";
    applyMemberUI();

    setTimeout(function() {
      document.addEventListener("click", function closeMenu(e) {
        var m = document.getElementById("avatar-menu");
        var wrap = m && m.closest && m.closest(".avatar-wrap");
        if (m && wrap && !wrap.contains(e.target)) {
          m.classList.remove("open");
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 0);
  } else {
    area.innerHTML = '<button class="bout" onclick="showPage(\'auth\')" style="border-radius:50px;padding:7px 16px;font-size:12px">Sign In</button>';
    if (welcome) welcome.style.display = "none";
    if (cta)    cta.style.display = "block";
    var badge = document.getElementById("member-badge");
    var exEl  = document.getElementById("expiry-label");
    if (badge) badge.style.display = "none";
    if (exEl)  exEl.style.display  = "none";
  }
}

/* _onAuthChange is called by Firebase auth state listener */
window._onAuthChange = function(user, token, isLifetime) {
  state.authUser = user; state.token = token;
  if (!user) { state.member = false; setSearches(0); }
  else if (isLifetime) { state.member = true; setSearches("∞"); }
  else { state.member = false; setSearches(0); }
  applyAuthUI();
  if (user) showPage("search"); else showPage("auth");
};

/* ═══════════════════════════════════════════════════════════════
   PAGE ROUTING
═══════════════════════════════════════════════════════════════ */
function showPage(id) {
  var sp = document.getElementById("search-page");
  var ap = document.getElementById("auth-page");
  if (sp) sp.style.display = (id === "search") ? "flex" : "none";
  if (ap) ap.classList.toggle("open", id === "auth");
}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE
═══════════════════════════════════════════════════════════════ */
function applyDark() {
  document.documentElement.classList.toggle("dark", state.dark);
  var btn = document.getElementById("dark-btn");
  if (btn) btn.textContent = state.dark ? "☀️" : "🌙";
}
function toggleDark() {
  state.dark = !state.dark;
  lsSet("dv_dark", state.dark);
  applyDark();
}

/* ═══════════════════════════════════════════════════════════════
   SAFE SEARCH
═══════════════════════════════════════════════════════════════ */
var BLOCKED_KEYWORDS = [
  "porn","pornhub","xvideos","xnxx","xhamster","redtube","youporn","brazzers","onlyfans",
  "nude","naked","nsfw","xxx","hentai","sex video","sex clip","explicit","adult video",
  "adult content","18+","erotic","strip","stripper","cam girl","webcam sex",
  "masturbat","orgasm","penis","vagina","boobs","tits","ass naked","fuck video",
  "blowjob","handjob","cumshot","anal sex","threesome","fetish video","bdsm video",
  "incest","lolita","underage","child porn","cp video"
];
function isSafeQuery(q) {
  var low = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  return !BLOCKED_KEYWORDS.some(function(kw){ return low.includes(kw); });
}
function showSafeSearchBlock() {
  var existing = document.getElementById("safe-search-msg");
  if (existing) existing.remove();
  var msg = document.createElement("div");
  msg.id = "safe-search-msg";
  msg.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9000;background:var(--glass2);border:1.5px solid rgba(200,40,0,.25);border-radius:24px;padding:44px 36px;max-width:380px;width:90%;text-align:center;box-shadow:var(--sh);animation:popin .4s var(--sp)";
  msg.innerHTML = '<div style="font-size:40px;margin-bottom:14px">🚫</div>' +
    '<h3 style="font-size:18px;font-weight:800;font-family:\'Syne\',sans-serif;color:var(--ink);margin-bottom:8px">Search Blocked</h3>' +
    '<p style="font-size:13px;color:var(--ink3);line-height:1.65;margin-bottom:22px">This search violates safe-search policy and cannot be processed.</p>' +
    '<button onclick="this.closest(\'#safe-search-msg\').remove()" class="bsf" style="padding:11px 28px;border-radius:12px;font-size:13px">OK</button>';
  document.body.appendChild(msg);
  setTimeout(function(){ if (msg.parentNode) msg.remove(); }, 4000);
}

/* ═══════════════════════════════════════════════════════════════
   BUSY STATE
═══════════════════════════════════════════════════════════════ */
function setBusy(on) {
  var btn = document.getElementById("sb-btn");
  if (!btn) return;
  if (on) {
    btn.innerHTML = '<div style="width:14px;height:14px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block"></div>';
    btn.disabled = true;
  } else {
    btn.innerHTML = 'Search <span style="opacity:.65">✦</span>';
    btn.disabled = false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORM HELPERS
═══════════════════════════════════════════════════════════════ */
function parseShorthand(raw) {
  var t = raw.trim();
  for (var id in P) {
    var cfg = P[id];
    for (var i = 0; i < cfg.aliases.length; i++) {
      var alias = cfg.aliases[i];
      if (t.toLowerCase().startsWith(alias + " ")) return { platform: id, query: t.slice(alias.length).trim() };
      if (t.toLowerCase() === alias)               return { platform: id, query: "" };
    }
  }
  return { platform: null, query: t };
}
function detectPlatform(raw) {
  var parsed = parseShorthand(raw);
  if (parsed.platform) return parsed.platform;
  var low = raw.toLowerCase(), best = null, top = 0;
  for (var id in P) {
    if (id === "google") continue;
    var cfg = P[id];
    var s = cfg.kw.filter(function(k){ return low.includes(k); }).length * 2 +
            cfg.cat.filter(function(c){ return low.includes(c); }).length;
    if (s > top) { top = s; best = id; }
  }
  return top > 0 ? best : null;
}
function rewrite(raw, platform) {
  var q = raw.trim();
  for (var id in P) {
    P[id].aliases.forEach(function(a){ q = q.replace(new RegExp("^" + a + "\\s*", "i"), ""); });
  }
  FILLERS.forEach(function(f){ q = q.replace(new RegExp("\\b" + f + "\\b", "gi"), ""); });
  if (["amazon","flipkart","myntra"].includes(platform)) q = q.replace(/\s*(reviews?|rating|price)\s*$/i, "");
  if (platform === "youtube") q = q.replace(/\s*(videos?|watch)\s*$/i, "");
  return q.replace(/\s+/g, " ").trim() || raw.trim();
}
function looksLikeProduct(raw) {
  var l = raw.toLowerCase();
  return [].concat(P.amazon.kw, P.amazon.cat, P.myntra.kw).some(function(k){ return l.includes(k); }) || /\d+/.test(raw);
}
function getChips(raw) {
  if (!raw || raw.trim().length < 2) return [];
  var parsed = parseShorthand(raw);
  if (parsed.platform && P[parsed.platform]) return [Object.assign({}, P[parsed.platform], { confidence: "exact" })];
  var res = [], low = raw.toLowerCase();
  for (var id in P) {
    if (id === "google") continue;
    var cfg = P[id];
    var s = cfg.kw.filter(function(k){ return low.includes(k); }).length * 2 +
            cfg.cat.filter(function(c){ return low.includes(c); }).length;
    if (s >= 3) res.push(Object.assign({}, cfg, { confidence: "high",   score: s }));
    else if (s >= 1) res.push(Object.assign({}, cfg, { confidence: "medium", score: s }));
  }
  res.sort(function(a,b){ return b.score - a.score; });
  if (!res.length) res.push(Object.assign({}, P.google, { confidence: "low", score: 0 }));
  if (res.length && res[0].id !== "google") res.push(Object.assign({}, P.google, { confidence: "low", score: 0 }));
  return res.slice(0, 5);
}

/* ═══════════════════════════════════════════════════════════════
   INTENT / DIRECT OPEN
═══════════════════════════════════════════════════════════════ */
var DIRECT_OPEN = new Set(["amazon","flipkart","myntra","youtube","maps","stackoverflow","reddit","github"]);
var INTENT_MAP  = {
  amazon: { label: "Shopping" }, flipkart: { label: "Shopping" }, myntra: { label: "Fashion" },
  youtube: { label: "Video" }, maps: { label: "Navigation" }, google: { label: "Web Search" },
  stackoverflow: { label: "Dev Help" }, reddit: { label: "Community" }, github: { label: "Code" }
};
function detectIntent(raw) { return detectPlatform(raw); }

function resolveAndRoute(query, forcePlatform) {
  var detected = forcePlatform || detectIntent(query) || detectPlatform(query) || "google";
  var finalQ   = rewrite(query, detected);
  addHistory({ query: finalQ, platform: detected });
  if (DIRECT_OPEN.has(detected)) {
    return { url: (P[detected] || P.google).url(finalQ), platform: detected, direct: true };
  }
  return { query: finalQ, platform: detected, showKnowledge: true };
}

/* ═══════════════════════════════════════════════════════════════
   FIRE SEARCH
═══════════════════════════════════════════════════════════════ */
async function fireSearch(mode, forcePlatform) {
  var inpEl = (mode === "mobile")
    ? document.getElementById("msb-input")
    : document.getElementById("sb-input");
  var query = (inpEl && inpEl.value || "").trim();
  if (!query) return;
  if (!isSafeQuery(query)) { showSafeSearchBlock(); return; }
  /* Require login */
  if (!state.authUser) { showPage("auth"); return; }
  /* Require lifetime membership — no free searches */
  if (!state.member) { openPopup(); return; }
  if (navigator.vibrate) navigator.vibrate(30);
  /* Button pulse */
  var sbtn = document.getElementById("sb-btn");
  if (sbtn) {
    sbtn.classList.add("firing");
    var ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    ripple.style.cssText = "left:50%;top:50%;margin-left:-30px;margin-top:-30px";
    sbtn.appendChild(ripple);
    setTimeout(function(){ ripple.remove(); sbtn.classList.remove("firing"); }, 600);
  }
  setBusy(true);
  closeDrop();
  var ch = document.getElementById("cmd-hints"); if (ch) ch.classList.remove("open");
  var result = resolveAndRoute(query, forcePlatform || null);
  setBusy(false);
  if (!result) return;
  if (result.showKnowledge) {
    openKnowledgePage(result.query, result.platform);
  } else if (result.url) {
    openPortal(result.url, result.platform || query);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PORTAL ANIMATION
═══════════════════════════════════════════════════════════════ */
function openPortal(url, label) {
  state.pendingUrl   = url;
  state.portalActive = true;
  /* Pre-open the tab NOW (while in the user gesture) to avoid popup blockers.
     We set location immediately so it never stays blank. */
  var newTab = window.open(url, "_blank");
  var pEl    = document.getElementById("portal");
  pEl.classList.add("active");
  var _pCfg        = P[label] || null;
  var platformName = _pCfg ? _pCfg.name : (typeof label === "string" && label.length < 24 ? label : "Super Search");
  document.getElementById("portal-label").textContent = platformName.toUpperCase();
  var color = (_pCfg && _pCfg.color) || "#FF7A00";
  var emoji = (_pCfg && _pCfg.emoji) || "✦";
  var pe    = document.getElementById("portal-emoji");
  if (pe)   pe.textContent = emoji;
  animatePortal(color, function() {
    pEl.classList.remove("active");
    state.portalActive = false;
    /* Tab is already loading — nothing more to do */
    if (!newTab) window.open(url, "_blank"); /* fallback if blocked */
  });
}
function hexToRgb(hex) {
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return {r:r,g:g,b:b};
}
function animatePortal(accentHex, onDone) {
  var cvs = document.getElementById("portal-canvas");
  var ctx = cvs.getContext("2d");
  cvs.width = window.innerWidth; cvs.height = window.innerHeight;
  var W=cvs.width,H=cvs.height,CX=W/2,CY=H/2;
  var isDark = document.documentElement.classList.contains("dark");
  var bg = isDark ? "10,6,0" : "255,250,244";
  var ac = hexToRgb(accentHex || "#FF7A00");
  var t0 = performance.now(), DURATION = 1600;
  var ease = function(t){ return t<.5?2*t*t:-1+(4-2*t)*t; };
  var easeIn = function(t){ return t*t*t; };
  var easeOut = function(t){ return 1-(1-t)*(1-t)*(1-t); };
  var RINGS = 28;
  var rings = Array.from({length:RINGS}, function(_,i){ return {phase:i/RINGS,lineW:Math.random()*2.2+.6,accent:i%4!==0,rotDir:i%2===0?1:-1}; });
  var STREAKS = 180;
  var streaks = Array.from({length:STREAKS}, function(_,i){ return {angle:(i/STREAKS)*Math.PI*2+(Math.random()-.5)*.08,speed:.22+Math.random()*.6,lineW:Math.random()*1.6+.3,accent:Math.random()>.3,phase:Math.random()*.3}; });
  var DOTS = 40;
  var dots = Array.from({length:DOTS}, function(){ return {x:CX+(Math.random()-.5)*W*.8,y:CY+(Math.random()-.5)*H*.8,r:Math.random()*2.5+.5,delay:Math.random()*.4}; });
  function frame(now) {
    var raw = Math.min((now-t0)/DURATION, 1);
    var p   = ease(raw);
    var bgA = raw<.1?raw/.1:raw>.85?(1-(raw-.85)/.15):1;
    ctx.fillStyle = "rgba("+bg+","+(bgA*.97)+")";
    ctx.fillRect(0,0,W,H);
    var ringProg = Math.max(0,(raw-.02)/.98);
    rings.forEach(function(ring){
      var f=(ring.phase+ringProg*1.6+ring.rotDir*raw*.08)%1;
      var r=f*Math.max(W,H)*.96;
      var alpha=(1-f)*.85*Math.min(ringProg*6,1);
      if(alpha<.005)return;
      ctx.beginPath();ctx.arc(CX,CY,Math.max(0,r),0,Math.PI*2);
      ctx.strokeStyle=ring.accent?"rgba("+ac.r+","+ac.g+","+ac.b+","+alpha+")":
        (isDark?"rgba(255,200,120,"+(alpha*.5)+")":"rgba(255,220,160,"+(alpha*.6)+")");
      ctx.lineWidth=ring.lineW*(1-f*.5);ctx.stroke();
    });
    if(raw>.05){
      var sp2=easeOut(Math.min((raw-.05)/.6,1));
      streaks.forEach(function(s){
        var f=(s.phase+raw*s.speed*1.4)%1;
        var r2=f*Math.max(W,H)*.8;
        var r1=Math.max(0,f-.14)*Math.max(W,H)*.8;
        var alpha=(1-f)*sp2*.75;
        if(alpha<.005)return;
        ctx.beginPath();
        ctx.moveTo(CX+Math.cos(s.angle)*r1,CY+Math.sin(s.angle)*r1);
        ctx.lineTo(CX+Math.cos(s.angle)*r2,CY+Math.sin(s.angle)*r2);
        ctx.strokeStyle=s.accent?"rgba("+ac.r+","+ac.g+","+ac.b+","+alpha+")":"rgba(255,200,100,"+(alpha*.45)+")";
        ctx.lineWidth=s.lineW;ctx.stroke();
      });
    }
    var burstR=20+easeIn(p)*Math.max(W,H)*.35;
    var burstA=Math.sin(raw*Math.PI)*.95;
    var g=ctx.createRadialGradient(CX,CY,0,CX,CY,burstR);
    g.addColorStop(0,"rgba(255,240,180,"+burstA+")");
    g.addColorStop(.15,"rgba("+ac.r+","+ac.g+","+ac.b+","+(burstA*.9)+")");
    g.addColorStop(.5,"rgba("+ac.r+","+ac.g+","+ac.b+","+(burstA*.2)+")");
    g.addColorStop(1,"rgba("+ac.r+","+ac.g+","+ac.b+",0)");
    ctx.beginPath();ctx.arc(CX,CY,burstR,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    if(raw>.1&&raw<.85){
      dots.forEach(function(d){
        var dp=Math.max(0,(raw-.1-d.delay)/.4);if(dp<=0)return;
        var da=Math.sin(dp*Math.PI)*.7;
        ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
        ctx.fillStyle="rgba("+ac.r+","+ac.g+","+ac.b+","+da+")";ctx.fill();
      });
    }
    if(raw>.15&&raw<.9){
      var haloA=Math.sin((raw-.15)/.75*Math.PI)*.5;
      var haloR=80+p*120;
      var rotAngle=raw*Math.PI*3;
      [-1,1].forEach(function(dir){
        ctx.save();ctx.translate(CX,CY);ctx.rotate(rotAngle*dir);
        ctx.beginPath();ctx.arc(0,0,haloR,0,Math.PI*1.3);
        ctx.strokeStyle="rgba("+ac.r+","+ac.g+","+ac.b+","+haloA+")";ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
      });
    }
    if(raw>.82){
      var flashA=easeIn((raw-.82)/.18);
      ctx.fillStyle=isDark?"rgba(10,6,0,"+flashA+")":"rgba(255,255,255,"+flashA+")";
      ctx.fillRect(0,0,W,H);
    }
    if(raw<1) requestAnimationFrame(frame); else setTimeout(onDone,30);
  }
  requestAnimationFrame(frame);
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH BAR INTERACTIONS
═══════════════════════════════════════════════════════════════ */
function closeDrop() {
  var drop = document.getElementById("drop");
  if (drop) drop.classList.remove("open");
}

function toggleCardsOnTyping(val, focused) {
  /* Hide platform cards whenever the search bar is active (focused or typing) */
  var shouldHide = focused || (val && val.trim().length > 0);
  var platformsSec = document.querySelector(".platforms-section");
  var savedSec     = document.querySelector(".saved-section");
  if (platformsSec) platformsSec.classList.toggle("typing", !!shouldHide);
  if (savedSec)     savedSec.classList.toggle("typing", !!shouldHide);
}

function updatePrefix(v) {
  var parsed = parseShorthand(v);
  var wrap   = document.getElementById("sb-prefix");
  if (!wrap) return;
  if (parsed.platform && P[parsed.platform]) {
    var cfg = P[parsed.platform];
    wrap.classList.add("visible");
    wrap.style.borderRightColor = cfg.color + "50";
    var emojiEl = document.getElementById("sb-prefix-emoji");
    var nameEl  = document.getElementById("sb-prefix-name");
    if (emojiEl) emojiEl.textContent = cfg.emoji;
    if (nameEl)  { nameEl.textContent = cfg.name; nameEl.style.color = cfg.color; }
  } else { wrap.classList.remove("visible"); }
}

function clearInput() {
  var inp = document.getElementById("sb-input");
  if (!inp) return;
  inp.value = "";
  var clrBtn = document.getElementById("sb-clear");
  if (clrBtn) clrBtn.classList.remove("visible");
  updatePrefix("");
  closeDrop();
  var ins = document.getElementById("search-insight");
  if (ins) ins.style.display = "none";
  var ch = document.getElementById("cmd-hints");
  if (ch) ch.classList.remove("open");
  /* Clear wiki preview */
  clearTimeout(window._dropWikiTimer);
  var wp = document.getElementById("drop-wiki-preview");
  if (wp) { wp.style.display = "none"; wp.innerHTML = ""; }
  toggleCardsOnTyping("", false);
}

function clearMobileInput() {
  var mi = document.getElementById("msb-input");
  var mc = document.getElementById("msb-clear");
  if (mi) mi.value = "";
  if (mc) mc.style.display = "none";
  toggleCardsOnTyping("");
  if (mi) mi.focus();
}

function updateDrop() {
  var inp = document.getElementById("sb-input");
  if (!inp) return;
  var v       = inp.value.trim();
  var drop    = document.getElementById("drop");
  var isTyping = v.length >= 2;
  var chipsSec  = document.getElementById("drop-chips-section");
  var recentSec = document.getElementById("drop-recent-section");
  var trendSec  = document.getElementById("drop-trending-section");
  if (!chipsSec || !recentSec || !drop) return;

  if (isTyping) {
    var chps    = getChips(v);
    var chipsEl = document.getElementById("drop-chips");
    if (chipsEl) {
      chipsEl.innerHTML = "";
      chps.forEach(function(c, i) {
        var btn = document.createElement("button");
        btn.className = "chip " + c.confidence;
        btn.style.cssText = "border-color:" + c.color + "44;color:" + c.color + ";background:" + c.color + "0E;animation-delay:" + (i*.05) + "s";
        btn.innerHTML = "<span>" + c.emoji + "</span><span>" + c.name + "</span>" + (c.confidence === "high" ? '<span style="font-size:8px;opacity:.65">✦</span>' : "");
        btn.onclick = function(){ fireSearch(null, c.id); };
        chipsEl.appendChild(btn);
      });
      var webBtn = document.createElement("button");
      webBtn.className = "chip low";
      webBtn.style.cssText = "border-color:rgba(180,140,100,.3);color:#AA8050;background:rgba(255,200,100,.06)";
      webBtn.innerHTML = "🔍 All Web";
      webBtn.onclick = function(){ fireSearch(null, "google"); };
      chipsEl.appendChild(webBtn);
    }
    chipsSec.style.display = "block";
    if (recentSec) recentSec.style.display = "none";
    if (trendSec)  trendSec.style.display  = "none";

    /* Live Wikipedia preview — debounced 650ms, only for 4+ char non-shorthand queries */
    var wikiPrev = document.getElementById("drop-wiki-preview");
    if (wikiPrev) {
      clearTimeout(window._dropWikiTimer);
      var parsedCheck = parseShorthand(v);
      if (!parsedCheck.platform && v.length >= 4) {
        window._dropWikiTimer = setTimeout(function() {
          var snap = v;
          wikiSearchThenSummary(snap).then(function(data) {
            /* Only apply if input hasn't changed */
            var cur = (document.getElementById("sb-input") || {}).value || "";
            if (cur.trim() !== snap || !data) return;
            wikiPrev.innerHTML =
              '<div style="display:flex;align-items:flex-start;gap:9px;padding:9px 15px 10px;border-top:1px solid var(--border2);animation:chin .2s var(--sp)">' +
                '<span style="font-size:15px;flex-shrink:0;margin-top:1px">📖</span>' +
                '<div style="flex:1;min-width:0">' +
                  '<div style="font-size:11px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">' + escHtml(data.title || snap) + '</div>' +
                  '<div style="font-size:11.5px;color:var(--ink3);line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + escHtml(data.text.slice(0, 130)) + '</div>' +
                '</div>' +
                '<span style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink4);background:var(--sfbg);padding:2px 7px;border-radius:6px;border:1px solid var(--border2);flex-shrink:0;margin-top:1px">Wiki</span>' +
              '</div>';
            wikiPrev.style.display = "block";
          });
        }, 650);
      } else {
        wikiPrev.style.display = "none";
        wikiPrev.innerHTML = "";
      }
    }
  } else {
    chipsSec.style.display = "none";
    /* Clear wiki preview */
    var wp = document.getElementById("drop-wiki-preview");
    if (wp) { wp.style.display = "none"; wp.innerHTML = ""; }
    clearTimeout(window._dropWikiTimer);

    var hist = getHistory().slice(0, 8);
    if (hist.length) {
      var recentEl = document.getElementById("drop-recent");
      if (recentEl) {
        recentEl.innerHTML = "";
        hist.forEach(function(h, i) {
          var cfg = P[h.platform] || P.google;
          var row = document.createElement("div");
          row.className = "drop-row";
          row.style.animationDelay = (i * .03) + "s";
          row.innerHTML = '<span style="font-size:16px">' + cfg.emoji + '</span><span class="drop-row-label">' + escHtml(h.query) + '</span><span class="drop-row-badge" style="background:' + cfg.color + '18;color:' + cfg.color + '">' + cfg.name + '</span>';
          row.onclick = function(){
            inp.value = h.query; updatePrefix(h.query); fireSearch(null, h.platform);
          };
          recentEl.appendChild(row);
        });
      }
      recentSec.style.display = "block";
    } else { recentSec.style.display = "none"; }
    if (trendSec) trendSec.style.display = "none";
  }

  var hasContent = chipsSec.style.display !== "none" || recentSec.style.display !== "none";
  drop.classList.toggle("open", hasContent);
}

function clearHistory() {
  clearHistoryData();
  var recentSec = document.getElementById("drop-recent-section");
  var drop      = document.getElementById("drop");
  if (recentSec) recentSec.style.display = "none";
  if (drop)      drop.classList.remove("open");
}

function updateCmdHints(v) {
  var ch = document.getElementById("cmd-hints");
  if (!ch) return;
  if (!v || v.length < 2) { ch.classList.remove("open"); ch.innerHTML = ""; return; }
  var parsed = parseShorthand(v);
  if (parsed.platform) { ch.classList.remove("open"); return; }
  var hints = [];
  for (var id in P) {
    P[id].aliases.forEach(function(a){
      if (v.toLowerCase().startsWith(a.slice(0, 2)) && !v.toLowerCase().startsWith(a + " ")) {
        hints.push({ alias: a, name: P[id].name, emoji: P[id].emoji, id: id });
      }
    });
  }
  if (!hints.length) { ch.classList.remove("open"); ch.innerHTML = ""; return; }
  ch.innerHTML = hints.map(function(h){
    return '<div class="cmd-hint-item" onclick="var i=document.getElementById(\'sb-input\');i.value=\'' + h.alias + ' \';updatePrefix(i.value);updateDrop();">' +
      '<code style="color:' + (P[h.id] && P[h.id].color || "#FF7A00") + '">' + h.alias + '</code> ' + h.emoji + ' ' + h.name + ' <kbd>Tab</kbd>' +
    '</div>';
  }).join("");
  ch.classList.add("open");
}

/* ═══════════════════════════════════════════════════════════════
   SUPER SEARCH — FREE KNOWLEDGE APIs
═══════════════════════════════════════════════════════════════ */

/* Utility: race a promise against a timeout */
function withTimeout(promiseFn, ms) {
  return new Promise(function(resolve) {
    var done = false;
    var t = setTimeout(function(){ if (!done){ done = true; resolve(null); } }, ms || 5000);
    promiseFn()
      .then(function(r){ if (!done){ done = true; clearTimeout(t); resolve(r); } })
      .catch(function(){  if (!done){ done = true; clearTimeout(t); resolve(null); } });
  });
}

/* ═══════════════════════════════════════════════════════════════
   SMART ANSWER ENGINE — Structured results for "best X" queries
═══════════════════════════════════════════════════════════════ */

/* Query intent classifier */
var SMART_PATTERNS = {
  best_list:    /^(?:best|top|greatest|recommended?|good)\s+(.+)$/i,
  vs_compare:   /^(.+?)\s+vs\.?\s+(.+)$/i,
  what_is:      /^(?:what\s+is|what\s+are|define|meaning\s+of|who\s+is)\s+(.+)$/i,
  how_to:       /^(?:how\s+to|how\s+do|how\s+can|steps\s+to|guide\s+to)\s+(.+)$/i,
  price_query:  /^(?:price\s+of|cost\s+of|how\s+much\s+(?:is|does)|buy)\s+(.+)$/i
};

/* Curated knowledge base — structured answers for popular categories */
var SMART_KB = {
  /* ─── TECH: LAPTOPS ─── */
  laptop: [
    { rank:1, name:"MacBook Air M3",     note:"Best all-rounder — thin, fast, 18hr battery", tag:"Apple",     price:"₹1,14,900+", az:"MacBook Air M3", fk:"MacBook Air M3" },
    { rank:2, name:"Dell XPS 15",         note:"Best Windows laptop for creators",            tag:"Dell",      price:"₹1,59,990+", az:"Dell XPS 15",    fk:"Dell XPS 15" },
    { rank:3, name:"Lenovo ThinkPad X1",  note:"Best for business & keyboard lovers",         tag:"Lenovo",    price:"₹1,29,000+", az:"ThinkPad X1",    fk:"ThinkPad X1" },
    { rank:4, name:"ASUS ROG Zephyrus",   note:"Best gaming laptop under ₹1.5L",             tag:"ASUS",      price:"₹1,09,990+", az:"ASUS ROG Zephyrus", fk:"ASUS ROG" },
    { rank:5, name:"HP Spectre x360",     note:"Best 2-in-1 convertible design",             tag:"HP",        price:"₹1,39,999+", az:"HP Spectre x360", fk:"HP Spectre" }
  ],
  computer: [
    { rank:1, name:"Apple Mac Mini M4",   note:"Best compact desktop — silent and powerful",  tag:"Apple",  price:"₹59,900+",   az:"Mac Mini M4",    fk:"Mac Mini M4" },
    { rank:2, name:"iMac 24\" M3",        note:"Best all-in-one for home/studio use",         tag:"Apple",  price:"₹1,34,900+", az:"iMac M3",        fk:"iMac 24" },
    { rank:3, name:"Dell OptiPlex 7010",  note:"Best business PC — reliable & upgradeable",   tag:"Dell",   price:"₹44,990+",   az:"Dell OptiPlex",  fk:"Dell OptiPlex 7010" },
    { rank:4, name:"ASUS ROG Strix GT",   note:"Best gaming desktop for performance",         tag:"ASUS",   price:"₹89,990+",   az:"ASUS ROG desktop", fk:"ASUS ROG desktop" },
    { rank:5, name:"Lenovo IdeaCentre",   note:"Best budget desktop for everyday tasks",      tag:"Lenovo", price:"₹34,990+",   az:"Lenovo IdeaCentre", fk:"Lenovo IdeaCentre" }
  ],
  phone: [
    { rank:1, name:"iPhone 16 Pro",       note:"Best camera & performance — iOS ecosystem",   tag:"Apple",   price:"₹1,19,900+", az:"iPhone 16 Pro",  fk:"iPhone 16 Pro" },
    { rank:2, name:"Samsung Galaxy S25",  note:"Best Android — AI features, 200MP camera",   tag:"Samsung", price:"₹79,999+",   az:"Galaxy S25",     fk:"Samsung Galaxy S25" },
    { rank:3, name:"Google Pixel 9",      note:"Best Android camera & pure software exp.",   tag:"Google",  price:"₹79,999+",   az:"Pixel 9",        fk:"Google Pixel 9" },
    { rank:4, name:"OnePlus 13",          note:"Best value flagship — fast charging king",    tag:"OnePlus", price:"₹69,999+",   az:"OnePlus 13",     fk:"OnePlus 13" },
    { rank:5, name:"Nothing Phone 3",     note:"Best unique design + clean UI",              tag:"Nothing", price:"₹49,999+",   az:"Nothing Phone",  fk:"Nothing Phone" }
  ],
  smartphone: "phone",
  mobile:     "phone",
  headphone: [
    { rank:1, name:"Sony WH-1000XM5",    note:"Best ANC headphones — unmatched noise cancel", tag:"Sony",  price:"₹26,990+",   az:"Sony WH-1000XM5", fk:"Sony WH-1000XM5" },
    { rank:2, name:"Apple AirPods Pro 2", note:"Best for iPhone users — ANC + transparency",  tag:"Apple", price:"₹24,900+",   az:"AirPods Pro 2",   fk:"AirPods Pro 2" },
    { rank:3, name:"Bose QC45",           note:"Best comfort for long listening sessions",    tag:"Bose",  price:"₹24,900+",   az:"Bose QC45",       fk:"Bose QC45" },
    { rank:4, name:"Sennheiser Momentum", note:"Best audiophile sound quality",              tag:"Senn.", price:"₹19,999+",   az:"Sennheiser Momentum", fk:"Sennheiser Momentum" },
    { rank:5, name:"JBL Tour One M2",     note:"Best value premium with good ANC",           tag:"JBL",   price:"₹12,999+",   az:"JBL Tour One",    fk:"JBL Tour One" }
  ],
  headphones: "headphone",
  earphone: [
    { rank:1, name:"Apple AirPods 4",     note:"Best TWS for iOS — seamless integration",    tag:"Apple",   price:"₹12,900+", az:"AirPods 4",        fk:"AirPods 4" },
    { rank:2, name:"Sony WF-1000XM5",     note:"Best ANC earbuds for Android",               tag:"Sony",    price:"₹19,990+", az:"Sony WF-1000XM5",  fk:"Sony WF-1000XM5" },
    { rank:3, name:"Nothing Ear 2",       note:"Best design + transparent stem look",        tag:"Nothing", price:"₹8,499+",  az:"Nothing Ear",      fk:"Nothing Ear" },
    { rank:4, name:"OnePlus Buds Pro 3",  note:"Best value ANC earbuds under ₹10K",          tag:"OnePlus", price:"₹7,999+",  az:"OnePlus Buds Pro", fk:"OnePlus Buds Pro" },
    { rank:5, name:"Boult Audio W40",     note:"Best budget pick with LDAC support",         tag:"Boult",   price:"₹1,299+",  az:"Boult W40",        fk:"Boult W40" }
  ],
  earphones: "earphone", earbuds: "earphone",
  tablet: [
    { rank:1, name:"iPad Air M2",         note:"Best all-round tablet for work & study",     tag:"Apple",   price:"₹59,900+",  az:"iPad Air M2",      fk:"iPad Air M2" },
    { rank:2, name:"Samsung Tab S9+",     note:"Best Android tablet — AMOLED display",       tag:"Samsung", price:"₹74,999+",  az:"Samsung Tab S9",   fk:"Samsung Tab S9" },
    { rank:3, name:"iPad mini 7",         note:"Best compact tablet for portability",        tag:"Apple",   price:"₹46,900+",  az:"iPad mini",        fk:"iPad mini" },
    { rank:4, name:"Lenovo Tab P12",      note:"Best budget large-screen tablet",            tag:"Lenovo",  price:"₹24,999+",  az:"Lenovo Tab P12",   fk:"Lenovo Tab P12" },
    { rank:5, name:"Xiaomi Pad 6",        note:"Best budget pick with 144Hz display",        tag:"Xiaomi",  price:"₹22,999+",  az:"Xiaomi Pad 6",     fk:"Xiaomi Pad 6" }
  ],
  smartwatch: [
    { rank:1, name:"Apple Watch Series 10", note:"Best smartwatch for iPhone users",        tag:"Apple",   price:"₹46,900+",  az:"Apple Watch S10",  fk:"Apple Watch" },
    { rank:2, name:"Samsung Galaxy Watch 7",note:"Best Android smartwatch — health sensors", tag:"Samsung", price:"₹28,999+",  az:"Galaxy Watch 7",   fk:"Galaxy Watch 7" },
    { rank:3, name:"Garmin Fenix 7",        note:"Best sports watch — 18 day battery",      tag:"Garmin",  price:"₹54,990+",  az:"Garmin Fenix 7",   fk:"Garmin Fenix" },
    { rank:4, name:"Amazfit GTR 4",         note:"Best value feature-packed smartwatch",    tag:"Amazfit", price:"₹9,999+",   az:"Amazfit GTR 4",    fk:"Amazfit GTR 4" },
    { rank:5, name:"Noise ColorFit Pro",    note:"Best budget smartwatch for India",        tag:"Noise",   price:"₹2,499+",   az:"Noise ColorFit",   fk:"Noise ColorFit" }
  ],
  tv: [
    { rank:1, name:"Samsung QLED Q80C",   note:"Best overall — quantum dot, 120Hz",        tag:"Samsung", price:"₹89,990+",  az:"Samsung QLED Q80C", fk:"Samsung QLED Q80C" },
    { rank:2, name:"LG OLED C3",          note:"Best picture quality — true blacks",        tag:"LG",      price:"₹1,29,990+",az:"LG OLED C3",        fk:"LG OLED C3" },
    { rank:3, name:"Sony Bravia XR A80L", note:"Best for movies — cognitive processor",    tag:"Sony",    price:"₹1,49,990+",az:"Sony Bravia XR",    fk:"Sony Bravia" },
    { rank:4, name:"Mi QLED 4K",          note:"Best budget smart TV for India",           tag:"Xiaomi",  price:"₹29,999+",  az:"Mi QLED TV",        fk:"Mi QLED TV" },
    { rank:5, name:"FireTV Omni QLED",    note:"Best for Prime + Alexa ecosystem",         tag:"Amazon",  price:"₹39,999+",  az:"Fire TV Omni",      fk:"Amazon Fire TV" }
  ],
  /* ─── APPLIANCES ─── */
  refrigerator: [
    { rank:1, name:"LG 242L Smart Inverter",  note:"Best frost-free for families",        tag:"LG",      price:"₹27,990+", az:"LG 242L refrigerator", fk:"LG refrigerator" },
    { rank:2, name:"Samsung 253L Digital",    note:"Best with Digital Inverter tech",     tag:"Samsung", price:"₹29,990+", az:"Samsung 253L fridge",  fk:"Samsung fridge" },
    { rank:3, name:"Whirlpool 265L Triple",   note:"Best 3-door value fridge",            tag:"Whirl.",  price:"₹31,490+", az:"Whirlpool fridge",     fk:"Whirlpool fridge" },
    { rank:4, name:"Haier 258L Double Door",  note:"Best budget frost-free option",       tag:"Haier",   price:"₹21,990+", az:"Haier fridge",         fk:"Haier fridge" },
    { rank:5, name:"Godrej 244L Double",      note:"Best made-in-India reliable pick",    tag:"Godrej",  price:"₹19,990+", az:"Godrej fridge",        fk:"Godrej fridge" }
  ],
  fridge: "refrigerator",
  washing_machine: [
    { rank:1, name:"LG 8kg Front Load",       note:"Best front-load — steam wash, inverter", tag:"LG",    price:"₹38,990+", az:"LG front load washer", fk:"LG front load" },
    { rank:2, name:"Samsung 7kg Eco Bubble",  note:"Best mid-range with eco bubble tech",    tag:"Samsung",price:"₹31,990+", az:"Samsung washing machine",fk:"Samsung washer" },
    { rank:3, name:"Bosch 7kg Series 4",      note:"Best German build quality",              tag:"Bosch", price:"₹35,990+", az:"Bosch washing machine", fk:"Bosch washer" },
    { rank:4, name:"IFB 6.5kg TL",            note:"Best top-load fully automatic",          tag:"IFB",   price:"₹14,990+", az:"IFB washing machine",   fk:"IFB washer" },
    { rank:5, name:"Whirlpool 7.5kg TL",      note:"Best budget top-load option",            tag:"Whirl.",price:"₹12,990+", az:"Whirlpool washer",      fk:"Whirlpool washer" }
  ],
  /* ─── BOOKS ─── */
  "self help book": [
    { rank:1, name:"Atomic Habits",         note:"Building tiny habits that compound",          tag:"James Clear",    az:"Atomic Habits book",   fk:"Atomic Habits" },
    { rank:2, name:"Deep Work",             note:"Rules for focused success in a distracted world", tag:"Cal Newport", az:"Deep Work book",       fk:"Deep Work" },
    { rank:3, name:"The Psychology of Money",note:"Timeless lessons on wealth & happiness",    tag:"Morgan Housel",  az:"Psychology of Money",  fk:"Psychology of Money" },
    { rank:4, name:"Think and Grow Rich",   note:"Classic guide to success mindset",            tag:"Napoleon Hill",  az:"Think and Grow Rich",  fk:"Think and Grow Rich" },
    { rank:5, name:"Ikigai",               note:"Japanese secret to long happy life",           tag:"Héctor García",  az:"Ikigai book",          fk:"Ikigai" }
  ],
  /* ─── PROGRAMMING ─── */
  "programming language": [
    { rank:1, name:"Python",     note:"Best for beginners, data science & AI",      tag:"General", az:"Python programming book", fk:"Python book" },
    { rank:2, name:"JavaScript", note:"Best for web development — runs everywhere", tag:"Web",     az:"JavaScript book",        fk:"JavaScript book" },
    { rank:3, name:"Rust",       note:"Best for systems programming — memory safe", tag:"Systems", az:"Rust programming book",  fk:"Rust book" },
    { rank:4, name:"Go",         note:"Best for backend & microservices",           tag:"Backend", az:"Go programming book",    fk:"Go lang book" },
    { rank:5, name:"TypeScript", note:"Best typed superset of JavaScript",          tag:"Web",     az:"TypeScript book",        fk:"TypeScript book" }
  ],
  /* ─── FOOD ─── */
  biryani: [
    { rank:1, name:"Hyderabadi Dum Biryani", note:"Slow-cooked with aromatic whole spices",   tag:"Hyderabad", az:"Hyderabadi biryani masala", fk:"biryani masala" },
    { rank:2, name:"Lucknowi Awadhi Biryani",note:"Mild, fragrant with saffron & kewra",      tag:"Lucknow",   az:"Lucknowi biryani",          fk:"biryani" },
    { rank:3, name:"Kolkata Biryani",        note:"Light, potato-based — unique sweet notes", tag:"Kolkata",   az:"Kolkata biryani masala",    fk:"biryani masala" },
    { rank:4, name:"Chicken Biryani",        note:"Most popular everyday biryani",             tag:"Classic",   az:"biryani masala",            fk:"biryani masala" },
    { rank:5, name:"Mutton Biryani",         note:"Richest flavor — traditional & hearty",    tag:"Classic",   az:"mutton biryani masala",     fk:"biryani" }
  ]
};

/* Resolve aliases in SMART_KB */
(function resolveKbAliases(){
  for (var k in SMART_KB) {
    if (typeof SMART_KB[k] === "string") {
      var alias = SMART_KB[k];
      Object.defineProperty(SMART_KB, k, { get: function(a){ return function(){ return SMART_KB[a]; }; }(alias), configurable:true });
    }
  }
})();

/* Find the best matching KB entry for a subject string */
function findSmartKB(subject) {
  if (!subject) return null;
  var low = subject.toLowerCase().trim();
  /* Direct match */
  if (SMART_KB[low] && typeof SMART_KB[low] !== "string") return { items: SMART_KB[low], key: low };
  /* Alias resolution */
  if (typeof SMART_KB[low] === "string") return findSmartKB(SMART_KB[low]);
  /* Partial match — find longest key that appears in subject */
  var best = null, bestLen = 0;
  for (var k in SMART_KB) {
    if (typeof SMART_KB[k] === "string") continue;
    if (low.includes(k) && k.length > bestLen) { best = k; bestLen = k.length; }
  }
  if (best) return { items: SMART_KB[best], key: best };
  /* Reverse: subject appears as part of a key */
  for (var k2 in SMART_KB) {
    if (typeof SMART_KB[k2] === "string") continue;
    if (k2.includes(low) && low.length >= 4) return { items: SMART_KB[k2], key: k2 };
  }
  return null;
}

/* Classify query intent */
function classifyQuery(query) {
  var q = query.trim();
  for (var type in SMART_PATTERNS) {
    var m = q.match(SMART_PATTERNS[type]);
    if (m) return { type: type, subject: m[1] ? m[1].trim() : q, match: m };
  }
  return { type: "general", subject: q, match: null };
}

/* ── Build Smart Answer HTML ── */
function buildSmartAnswer(query) {
  var intent = classifyQuery(query);

  /* VS comparison */
  if (intent.type === "vs_compare") {
    var a = intent.match[1].trim(), b = intent.match[2].trim();
    return {
      type: "comparison",
      label: "Comparison",
      html: buildVsCard(a, b, query),
      hasContent: true
    };
  }

  /* Best/Top list */
  if (intent.type === "best_list") {
    var kb = findSmartKB(intent.subject);
    if (kb) {
      return {
        type: "list",
        label: "Curated List",
        html: buildRankedList(kb.items, intent.subject, query),
        hasContent: true
      };
    }
    /* No KB match — offer Google fallback */
    return {
      type: "fallback",
      label: "Web",
      html: buildGoogleFallback(query),
      hasContent: true
    };
  }

  return { hasContent: false };
}

function buildRankedList(items, subject, query) {
  var googleUrl = P.google.url("best " + subject);
  var html = '<div class="sa-list">';
  items.forEach(function(item, i) {
    var azUrl = item.az ? P.amazon.url(item.az) : P.amazon.url(query);
    var fkUrl = item.fk ? P.flipkart.url(item.fk) : P.flipkart.url(query);
    var delay = (i * 0.07) + "s";
    html += '<div class="sa-item" style="animation-delay:' + delay + '">' +
      '<div class="sa-rank" style="' + (i === 0 ? "background:linear-gradient(135deg,#FF7A00,#FFAA33);color:#fff" : "") + '">' + (i + 1) + '</div>' +
      '<div class="sa-item-body">' +
        '<div class="sa-item-name">' + escHtml(item.name) + '</div>' +
        '<div class="sa-item-note">' + escHtml(item.note) + '</div>' +
      '</div>' +
      '<div class="sa-item-right">' +
        (item.price ? '<div class="sa-item-price">' + escHtml(item.price) + '</div>' : '') +
        '<div class="sa-item-links">' +
          '<a href="' + azUrl + '" target="_blank" rel="noopener" class="sa-link sa-link-az" onclick="event.stopPropagation()">🛒 Amazon</a>' +
          '<a href="' + fkUrl + '" target="_blank" rel="noopener" class="sa-link sa-link-fk" onclick="event.stopPropagation()">🛍 Flipkart</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>' +
    '<a href="' + googleUrl + '" target="_blank" rel="noopener" class="sa-more-btn">See full rankings on Google →</a>';
  return html;
}

function buildVsCard(a, b, query) {
  var aUrl = P.google.url(a + " review");
  var bUrl = P.google.url(b + " review");
  var vsUrl = P.google.url(a + " vs " + b);
  var rdUrl = P.reddit.url(a + " vs " + b);
  return '<div class="sa-vs">' +
    '<div class="sa-vs-side">' +
      '<div class="sa-vs-name">' + escHtml(a) + '</div>' +
      '<a href="' + aUrl + '" target="_blank" rel="noopener" class="sa-link" style="margin-top:8px">Google it →</a>' +
    '</div>' +
    '<div class="sa-vs-center">VS</div>' +
    '<div class="sa-vs-side">' +
      '<div class="sa-vs-name">' + escHtml(b) + '</div>' +
      '<a href="' + bUrl + '" target="_blank" rel="noopener" class="sa-link" style="margin-top:8px">Google it →</a>' +
    '</div>' +
  '</div>' +
  '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
    '<a href="' + vsUrl + '" target="_blank" rel="noopener" class="sa-more-btn" style="flex:1;text-align:center;min-width:140px">Full comparison on Google →</a>' +
    '<a href="' + rdUrl + '" target="_blank" rel="noopener" class="sa-more-btn" style="flex:1;text-align:center;min-width:140px;background:rgba(255,69,0,.07);border-color:rgba(255,69,0,.22);color:#FF4500">Reddit discussion →</a>' +
  '</div>';
}

function buildGoogleFallback(query) {
  var gUrl = P.google.url(query);
  var rdUrl = P.reddit.url(query);
  return '<div style="font-size:13.5px;color:var(--ink2);line-height:1.65;margin-bottom:14px">No curated list found for this query. Here are the best places to find top recommendations:</div>' +
    '<div style="display:flex;gap:9px;flex-wrap:wrap">' +
      '<a href="' + gUrl + '" target="_blank" rel="noopener" class="sa-more-btn" style="flex:1;text-align:center;min-width:120px">🔍 Search Google →</a>' +
      '<a href="' + rdUrl + '" target="_blank" rel="noopener" class="sa-more-btn" style="flex:1;text-align:center;min-width:120px;background:rgba(255,69,0,.07);border-color:rgba(255,69,0,.22);color:#FF4500">🔴 Ask Reddit →</a>' +
    '</div>';
}



/* ── Wikipedia: search → summary + thumbnail ── */
async function wikiSearchThenSummary(query) {
  try {
    var sr = await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(query) + "&format=json&origin=*&srlimit=1");
    var sd = await sr.json();
    var title = sd.query && sd.query.search && sd.query.search[0] && sd.query.search[0].title;
    if (!title) return null;
    var r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title));
    if (!r.ok) return null;
    var d = await r.json();
    if (!d.extract) return null;
    return {
      text:  d.extract.slice(0, 560),
      title: d.title,
      link:  d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page,
      thumb: d.thumbnail && d.thumbnail.source ? d.thumbnail.source : null
    };
  } catch(e) { return null; }
}
function fetchWikiSummary(query) {
  return withTimeout(function(){ return wikiSearchThenSummary(query); }, 5500);
}

/* ── Wikidata structured facts ── */
var WD_PROPS = {
  P569:  "Born",      P570: "Died",       P19:  "Birthplace",
  P27:   "Country",   P131: "Located in", P1082:"Population",
  P571:  "Founded",   P112: "Founder",    P159: "Headquarters",
  P577:  "Published", P50:  "Author",     P57:  "Director",
  P136:  "Genre",     P495: "Origin",     P856: "Website"
};
async function fetchWikidataFacts(query) {
  try {
    var sUrl = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + encodeURIComponent(query) + "&language=en&format=json&origin=*&limit=1&type=item";
    var sr = await fetch(sUrl);
    var sd = await sr.json();
    if (!sd.search || !sd.search.length) return null;
    var eid = sd.search[0].id;
    var eLabel = sd.search[0].label || query;
    var eDesc  = sd.search[0].description || "";
    var eUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + eid + "&props=claims&languages=en&format=json&origin=*";
    var er = await fetch(eUrl);
    var ed = await er.json();
    var entity = ed.entities && ed.entities[eid];
    if (!entity) return null;
    var claims = entity.claims || {};
    var facts = [];
    for (var pid in WD_PROPS) {
      if (!claims[pid] || !claims[pid].length) continue;
      var ms = claims[pid][0].mainsnak;
      if (!ms || ms.snaktype !== "value" || !ms.datavalue) continue;
      var dv = ms.datavalue, val = null;
      if (dv.type === "string")           val = dv.value;
      else if (dv.type === "monolingualtext") val = dv.value.text;
      else if (dv.type === "quantity") {
        var n = parseFloat(dv.value.amount);
        val = n >= 1e9 ? (n/1e9).toFixed(2)+"B" : n >= 1e6 ? (n/1e6).toFixed(2)+"M" : n >= 1000 ? (n/1000).toFixed(1)+"K" : String(Math.round(n));
      } else if (dv.type === "time") {
        var ts = dv.value.time;
        var m = ts.match(/^\+?(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          var mo = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          val = (m[2]!=="00"?mo[+m[2]]+" ":"") + (m[3]!=="00"?m[3]+", ":"") + m[1];
        }
      } else continue;
      if (val && String(val).length < 80) facts.push({ label: WD_PROPS[pid], value: String(val) });
    }
    if (!facts.length) return null;
    return { label: eLabel, desc: eDesc, facts: facts.slice(0,9) };
  } catch(e) { return null; }
}

/* ── Open Library books ── */
async function fetchOpenLibraryBooks(query) {
  try {
    var url = "https://openlibrary.org/search.json?q=" + encodeURIComponent(query) + "&limit=8&fields=key,title,author_name,first_publish_year,cover_i";
    var r = await fetch(url);
    var d = await r.json();
    if (!d.docs || !d.docs.length) return null;
    return d.docs.slice(0, 6).map(function(b) {
      return {
        title:  b.title,
        author: b.author_name ? b.author_name[0] : "Unknown",
        year:   b.first_publish_year || null,
        cover:  b.cover_i ? "https://covers.openlibrary.org/b/id/" + b.cover_i + "-M.jpg" : null,
        link:   "https://openlibrary.org" + b.key
      };
    });
  } catch(e) { return null; }
}

/* ── Wikimedia Commons images ── */
async function fetchCommonsImages(query) {
  try {
    var url = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(query) + "+filetype:bitmap&srnamespace=6&format=json&origin=*&srlimit=10";
    var r = await fetch(url);
    var d = await r.json();
    if (!d.query || !d.query.search || !d.query.search.length) return null;
    var titles = d.query.search.slice(0,9).map(function(s){ return s.title; }).join("|");
    var ir = await fetch("https://commons.wikimedia.org/w/api.php?action=query&titles=" + encodeURIComponent(titles) + "&prop=imageinfo&iiprop=url|mime&iiurlwidth=260&format=json&origin=*");
    var id = await ir.json();
    var pages = id.query && id.query.pages ? id.query.pages : {};
    var imgs = [];
    for (var pid in pages) {
      var pg = pages[pid];
      if (!pg.imageinfo || !pg.imageinfo[0]) continue;
      var ii = pg.imageinfo[0];
      if (!ii.url || (ii.mime && !ii.mime.startsWith("image/"))) continue;
      imgs.push({ thumb: ii.thumburl || ii.url, full: ii.url, caption: pg.title.replace("File:","").replace(/\.[^.]+$/,"").slice(0,50) });
    }
    return imgs.length ? imgs.slice(0,6) : null;
  } catch(e) { return null; }
}

/* ── Quick answers: currency conversion ── */
var CURRENCY_RE = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]{3})\s+(?:to|in)\s+([a-zA-Z]{3})$/i;
async function fetchCurrencyFact(query) {
  try {
    var m = query.trim().match(CURRENCY_RE);
    if (!m) return null;
    var amount = parseFloat(m[1].replace(",",".")), from = m[2].toUpperCase(), to = m[3].toUpperCase();
    var r = await fetch("https://open.er-api.com/v6/latest/" + from);
    if (!r.ok) return null;
    var d = await r.json();
    if (d.result !== "success" || !d.rates || !d.rates[to]) return null;
    var converted = (amount * d.rates[to]);
    var formatted = converted >= 1000 ? converted.toLocaleString("en-IN",{maximumFractionDigits:2}) : converted.toPrecision(6).replace(/\.?0+$/,"");
    return { text: amount + " " + from + " = " + formatted + " " + to, source: "Exchange Rate API" };
  } catch(e) { return null; }
}

/* ── Quick answers: number trivia ── */
async function fetchNumberFact(query) {
  try {
    var clean = query.trim().replace(/,/g,"");
    if (!/^\d+$/.test(clean)) return null;
    var n = parseInt(clean, 10);
    if (n > 9999999) return null;
    var r = await fetch("https://numbersapi.com/" + n + "/trivia?json");
    if (!r.ok) return null;
    var d = await r.json();
    return d.found ? { text: d.text, source: "Numbers API" } : null;
  } catch(e) { return null; }
}

/* ── Dispatch quick fact (currency first, then number) ── */
async function fetchQuickFact(query) {
  var q = query.trim();
  var curr = await withTimeout(function(){ return fetchCurrencyFact(q); }, 4000);
  if (curr) return curr;
  var num = await withTimeout(function(){ return fetchNumberFact(q); }, 3000);
  return num;
}

/* ═══════════════════════════════════════════════════════════════
   KNOWLEDGE PAGE
═══════════════════════════════════════════════════════════════ */
var KP_DEFS = {
  amazon:      { emoji:"🛒",name:"Amazon",      color:"#FF9900", desc:"Best for shopping & deals" },
  flipkart:    { emoji:"🛍️",name:"Flipkart",    color:"#2874F0", desc:"Indian e-commerce leader" },
  myntra:      { emoji:"👗",name:"Myntra",      color:"#FF3F6C", desc:"Fashion & lifestyle" },
  youtube:     { emoji:"▶️",name:"YouTube",     color:"#FF0000", desc:"Videos, music & tutorials" },
  maps:        { emoji:"🗺️",name:"Maps",        color:"#34A853", desc:"Directions & places" },
  google:      { emoji:"🔍",name:"Google",      color:"#4285F4", desc:"General web search" },
  stackoverflow:{ emoji:"📋",name:"StackOverflow",color:"#F48024",desc:"Dev Q&A" },
  reddit:      { emoji:"🔴",name:"Reddit",      color:"#FF4500", desc:"Community discussion" },
  github:      { emoji:"🐙",name:"GitHub",      color:"#24292e", desc:"Code & repos" },
  wikipedia:   { emoji:"📖",name:"Wikipedia",   color:"#3366CC", desc:"Knowledge base" }
};

function showPanel(id, visible) {
  var el = document.getElementById(id);
  if (el) el.style.display = visible ? "block" : "none";
}
function panelLoading(prefix) {
  var l = document.getElementById(prefix + "-loading");
  var c = document.getElementById(prefix + "-content");
  if (l) l.style.display = "flex";
  if (c) c.style.display = "none";
}
function panelDone(prefix, hasData) {
  var l = document.getElementById(prefix + "-loading");
  var c = document.getElementById(prefix + "-content");
  if (l) l.style.display = "none";
  if (c) c.style.display = hasData ? "block" : "none";
}

/* Shimmer skeleton HTML helper */
function skeletonLine(w, h) {
  h = h || 14;
  return '<div class="skel" style="width:' + w + ';height:' + h + 'px;border-radius:' + Math.round(h/2) + 'px"></div>';
}
function skeletonBlock(lines) {
  return '<div style="display:flex;flex-direction:column;gap:9px">' + lines.map(function(w){ return skeletonLine(w); }).join("") + '</div>';
}

function openKnowledgePage(query, platform) {
  var pg = document.getElementById("knowledge-page");
  if (!pg) return;
  pg.style.display = "block";
  pg.style.animation = "none";
  requestAnimationFrame(function(){ pg.style.animation = "kpSlideIn .38s cubic-bezier(.34,1.56,.64,1)"; });
  pg.scrollTop = 0;

  /* Header */
  var qtEl = document.getElementById("kp-query-title"); if (qtEl) qtEl.textContent = query;
  var badge = document.getElementById("kp-intent-badge");
  var def   = KP_DEFS[platform] || { emoji:"\uD83D\uDD0D", name:platform };
  var iconEl = document.getElementById("kp-intent-icon");
  var textEl = document.getElementById("kp-intent-text");
  if (iconEl) iconEl.textContent = def.emoji;
  if (textEl) textEl.innerHTML = "<strong>Intent:</strong> " + ((INTENT_MAP[platform]||{}).label||"Web Search") + " &nbsp;\u00B7&nbsp; <strong>Best match:</strong> " + def.name;
  if (badge)  badge.style.display = "flex";
  var backBtn = document.getElementById("kp-back");
  if (backBtn) backBtn.onclick = closeKnowledgePage;

  /* ─── ① SMART ANSWER (synchronous — instant) ─── */
  var smartEl   = document.getElementById("kp-smart-panel");
  var smartBody = document.getElementById("kp-smart-body");
  var smartLbl  = document.getElementById("kp-smart-label");
  if (smartEl && smartBody) {
    var sa = buildSmartAnswer(query);
    if (sa.hasContent) {
      smartBody.innerHTML = sa.html;
      if (smartLbl) smartLbl.textContent = sa.label;
      smartEl.style.opacity = "0";
      smartEl.style.transform = "translateY(12px)";
      smartEl.style.display = "block";
      requestAnimationFrame(function(){
        smartEl.style.transition = "opacity .3s ease, transform .3s var(--sp)";
        smartEl.style.opacity = "1";
        smartEl.style.transform = "";
        setTimeout(function(){ smartEl.style.transition = ""; }, 350);
      });
      smartEl.querySelectorAll(".sa-item").forEach(function(el, i) {
        el.style.opacity = "0";
        el.style.transform = "translateY(14px)";
        setTimeout(function(){ el.style.transition = "opacity .3s ease, transform .3s ease"; el.style.opacity = "1"; el.style.transform = ""; }, 60 + i * 70);
      });
    } else {
      smartEl.style.display = "none";
    }
  }

  /* ─── ② QUICK FACT ─── */
  showPanel("kp-quick-panel", false);
  withTimeout(function(){ return fetchQuickFact(query); }, 4500).then(function(fact) {
    if (fact) {
      var qt = document.getElementById("kp-quick-text");
      var qs = document.getElementById("kp-quick-src");
      if (qt) qt.textContent = fact.text;
      if (qs) qs.textContent = fact.source;
      revealPanel("kp-quick-panel");
    }
  });

  /* ─── ③ WIKIPEDIA — skeleton while loading ─── */
  var wikiLoadEl  = document.getElementById("kp-wiki-loading");
  var wikiContent = document.getElementById("kp-wiki-content");
  var wikiEmpty   = document.getElementById("kp-wiki-empty");
  if (wikiLoadEl) {
    wikiLoadEl.innerHTML = skeletonBlock(["92%","78%","85%","60%"]);
    wikiLoadEl.style.display = "block";
    wikiLoadEl.style.flexDirection = "column";
  }
  if (wikiContent) wikiContent.style.display = "none";
  if (wikiEmpty)   wikiEmpty.style.display   = "none";
  fetchWikiSummary(query).then(function(data) {
    if (wikiLoadEl) {
      wikiLoadEl.style.display = "none";
      wikiLoadEl.innerHTML = "<div style=\"display:flex;align-items:center;gap:10px;color:var(--ink3);font-size:13px\"><div style=\"width:14px;height:14px;border:2px solid rgba(255,122,0,.25);border-top-color:var(--sf);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0\"></div>Fetching knowledge\u2026</div>";
    }
    if (data && data.text) {
      var wt = document.getElementById("kp-wiki-text");
      var wl = document.getElementById("kp-wiki-link");
      var wth = document.getElementById("kp-wiki-thumb");
      if (wt) wt.textContent = data.text;
      if (wl) wl.href = data.link || ("https://en.wikipedia.org/wiki/" + encodeURIComponent((data.title||query).replace(/\s+/g,"_")));
      if (wth && data.thumb) { wth.src = data.thumb; wth.style.display = "block"; }
      else if (wth) wth.style.display = "none";
      if (wikiContent) { wikiContent.style.display = "block"; animateFadeIn(wikiContent); }
    } else {
      if (wikiEmpty) wikiEmpty.style.display = "block";
    }
  });

  /* ─── ④ WIKIDATA FACTS — skeleton ─── */
  showPanel("kp-wikidata-panel", true);
  var wdLoad = document.getElementById("kp-wikidata-loading");
  var wdCont = document.getElementById("kp-wikidata-content");
  if (wdLoad) {
    wdLoad.innerHTML = "<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:9px;width:100%\">" +
      [1,2,3,4,5,6].map(function(){ return "<div class=\"skel\" style=\"height:60px;border-radius:13px\"></div>"; }).join("") + "</div>";
    wdLoad.style.display = "block"; wdLoad.style.flexDirection = "";
  }
  if (wdCont) wdCont.style.display = "none";
  withTimeout(function(){ return fetchWikidataFacts(query); }, 7000).then(function(data) {
    var factsEl = document.getElementById("kp-wikidata-facts");
    if (wdLoad) { wdLoad.style.display = "none"; }
    if (data && data.facts.length && factsEl) {
      factsEl.innerHTML = data.facts.map(function(f, i) {
        return "<div class=\"kp-fact-chip\" style=\"animation-delay:" + (i*.04) + "s\">" +
          "<div class=\"kp-fact-label\">" + escHtml(f.label) + "</div>" +
          "<div class=\"kp-fact-value\">" + escHtml(f.value) + "</div>" +
        "</div>";
      }).join("");
      if (wdCont) { wdCont.style.display = "block"; animateFadeIn(wdCont); }
    } else {
      showPanel("kp-wikidata-panel", false);
    }
  });

  /* ─── ⑤ OPEN LIBRARY BOOKS — skeleton ─── */
  showPanel("kp-books-panel", true);
  var bkLoad = document.getElementById("kp-books-loading");
  var bkCont = document.getElementById("kp-books-content");
  if (bkLoad) {
    bkLoad.innerHTML = "<div style=\"display:flex;gap:12px\">" +
      [1,2,3,4].map(function(){ return "<div style=\"flex-shrink:0;width:100px\"><div class=\"skel\" style=\"width:100px;height:140px;border-radius:10px;margin-bottom:7px\"></div><div class=\"skel\" style=\"width:80%;height:11px;border-radius:6px\"></div></div>"; }).join("") + "</div>";
    bkLoad.style.display = "block"; bkLoad.style.flexDirection = "";
  }
  if (bkCont) bkCont.style.display = "none";
  withTimeout(function(){ return fetchOpenLibraryBooks(query); }, 6000).then(function(books) {
    var grid = document.getElementById("kp-books-grid");
    if (bkLoad) bkLoad.style.display = "none";
    if (books && books.length && grid) {
      grid.innerHTML = "";
      books.forEach(function(book, i) {
        var a = document.createElement("a");
        a.href = book.link; a.target = "_blank"; a.rel = "noopener";
        a.className = "kp-book-card";
        a.style.cssText = "opacity:0;transform:translateY(12px)";
        var coverHtml = book.cover
          ? "<img src=\"" + escHtml(book.cover) + "\" alt=\"\" loading=\"lazy\" class=\"kp-book-cover\" onerror=\"this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'\">" +
            "<div class=\"kp-book-cover kp-book-cover-fallback\" style=\"display:none\">\uD83D\uDCD6</div>"
          : "<div class=\"kp-book-cover kp-book-cover-fallback\">\uD83D\uDCD6</div>";
        a.innerHTML = coverHtml +
          "<div class=\"kp-book-title\">" + escHtml(book.title) + "</div>" +
          "<div class=\"kp-book-author\">" + escHtml(book.author) + (book.year?" \u00B7 "+book.year:"") + "</div>";
        grid.appendChild(a);
        setTimeout(function(){ a.style.transition = "opacity .3s ease, transform .3s ease"; a.style.opacity = "1"; a.style.transform = ""; }, i * 60);
      });
      if (bkCont) bkCont.style.display = "block";
    } else {
      showPanel("kp-books-panel", false);
    }
  });

  /* ─── ⑥ WIKIMEDIA COMMONS — skeleton ─── */
  showPanel("kp-commons-panel", true);
  var cmLoad = document.getElementById("kp-commons-loading");
  var cmCont = document.getElementById("kp-commons-content");
  if (cmLoad) {
    cmLoad.innerHTML = "<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;width:100%\">" +
      [1,2,3,4,5,6].map(function(){ return "<div class=\"skel\" style=\"aspect-ratio:1;border-radius:12px\"></div>"; }).join("") + "</div>";
    cmLoad.style.display = "block"; cmLoad.style.flexDirection = "";
  }
  if (cmCont) cmCont.style.display = "none";
  withTimeout(function(){ return fetchCommonsImages(query); }, 7000).then(function(imgs) {
    var grid = document.getElementById("kp-commons-grid");
    if (cmLoad) cmLoad.style.display = "none";
    if (imgs && imgs.length && grid) {
      grid.innerHTML = "";
      imgs.forEach(function(img, i) {
        var div = document.createElement("div");
        div.className = "kp-commons-img";
        div.style.cssText = "opacity:0;transform:scale(.92)";
        div.innerHTML = "<img src=\"" + escHtml(img.thumb) + "\" alt=\"" + escHtml(img.caption) + "\" loading=\"lazy\" onerror=\"this.closest(\'.kp-commons-img\').remove()\">" +
          "<div class=\"kp-commons-cap\">" + escHtml(img.caption) + "</div>";
        div.onclick = function(){ window.open(img.full, "_blank"); };
        grid.appendChild(div);
        setTimeout(function(){ div.style.transition = "opacity .35s ease, transform .35s ease"; div.style.opacity = "1"; div.style.transform = ""; }, i * 55);
      });
      if (cmCont) cmCont.style.display = "block";
    } else {
      showPanel("kp-commons-panel", false);
    }
  });

  /* Platform cards */
  var cardsEl = document.getElementById("kp-cards");
  if (cardsEl) {
    cardsEl.innerHTML = "";
    var show = ["amazon","flipkart","myntra","google"];
    if (["google","wikipedia"].includes(platform)) show = ["google","wikipedia","reddit","amazon"];
    if (["stackoverflow","reddit","github"].includes(platform)) show = ["stackoverflow","reddit","github","google"];
    show.forEach(function(id, i) {
      var kd  = KP_DEFS[id] || { emoji:"\uD83D\uDD0D", name:id, color:"#888", desc:"" };
      var url = (P[id]||P.google).url(query);
      var card = document.createElement("div");
      card.className = "kp-card";
      card.style.cssText = "opacity:0;transform:translateY(16px) scale(.97)";
      card.innerHTML = "<div class=\"kp-glow\" style=\"background:" + kd.color + "\"></div>" +
        "<div class=\"kp-card-icon\">" + kd.emoji + "</div>" +
        "<div class=\"kp-card-name\">" + kd.name + "</div>" +
        "<div class=\"kp-card-desc\">" + kd.desc + "</div>" +
        "<button class=\"kp-card-btn\" style=\"background:linear-gradient(135deg," + kd.color + "," + kd.color + "BB)\">Search " + kd.name + " \u2192</button>";
      card.addEventListener("mouseenter", function(){ card.style.borderColor = kd.color + "44"; });
      card.addEventListener("mouseleave", function(){ card.style.borderColor = ""; });
      card.onclick = function(){ window.open(url, "_blank"); };
      card.querySelector(".kp-card-btn").onclick = function(e){ e.stopPropagation(); window.open(url, "_blank"); };
      cardsEl.appendChild(card);
      setTimeout(function(){ card.style.transition = "opacity .32s ease, transform .32s ease"; card.style.opacity = "1"; card.style.transform = ""; }, 200 + i * 80);
    });
  }

  /* Related searches */
  var words = query.split(" ").filter(function(w){ return w.length > 3; });
  var related = words.length >= 2 ? words.map(function(w,i){ return words.filter(function(_,j){ return j!==i; }).join(" "); }).filter(Boolean).slice(0,4) : [];
  var relEl = document.getElementById("kp-related");
  var pillsEl = document.getElementById("kp-related-pills");
  if (relEl && pillsEl) {
    if (related.length) {
      pillsEl.innerHTML = "";
      related.forEach(function(r, i) {
        var btn = document.createElement("button");
        btn.style.cssText = "padding:7px 16px;border-radius:20px;border:1.5px solid var(--border2);background:var(--sfbg);font-size:12px;font-weight:600;color:var(--ink2);font-family:\'DM Sans\',sans-serif;transition:all .2s;opacity:0;transform:translateY(8px)";
        btn.textContent = r;
        btn.onmouseenter = function(){ btn.style.background="var(--sfbg2)"; btn.style.borderColor="rgba(255,122,0,.4)"; };
        btn.onmouseleave = function(){ btn.style.background="var(--sfbg)";  btn.style.borderColor="var(--border2)"; };
        btn.onclick = function(){ closeKnowledgePage(); var si=document.getElementById("sb-input"); if(si) si.value=r; fireSearch(null,null); };
        pillsEl.appendChild(btn);
        setTimeout(function(){ btn.style.opacity="1"; btn.style.transform=""; }, 350 + i * 55);
      });
      relEl.style.display = "block";
    } else { relEl.style.display = "none"; }
  }
}

/* Animate an element in with fade + lift */
function animateFadeIn(el) {
  if (!el) return;
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  requestAnimationFrame(function(){
    el.style.transition = "opacity .35s ease, transform .35s ease";
    el.style.opacity = "1";
    el.style.transform = "";
    setTimeout(function(){ el.style.transition = ""; }, 400);
  });
}

/* Reveal a hidden panel with animation */
function revealPanel(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.opacity = "0";
  el.style.transform = "translateY(12px) scale(.98)";
  el.style.display = "block";
  requestAnimationFrame(function(){
    el.style.transition = "opacity .3s ease, transform .3s var(--sp)";
    el.style.opacity = "1";
    el.style.transform = "";
    setTimeout(function(){ el.style.transition = ""; }, 350);
  });
}

function closeKnowledgePage() {
  var pg = document.getElementById("knowledge-page");
  if (!pg) return;
  pg.style.animation = "kpSlideOut .25s ease forwards";
  setTimeout(function(){ pg.style.display = "none"; pg.style.animation = ""; }, 240);
}

/* ═══════════════════════════════════════════════════════════════
   OVERLAYS
═══════════════════════════════════════════════════════════════ */
function openOverlay(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add("open");
  if (id === "saved-overlay")   renderSavedPanel();
  if (id === "history-overlay") { renderHistoryTab(); renderAnalyticsTab(); }
  if (id === "palette-overlay") { var pi = document.getElementById("palette-input"); if (pi) pi.focus(); renderPalette(""); }
}
function closeOverlay(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

/* ═══════════════════════════════════════════════════════════════
   SAVED SEARCHES
═══════════════════════════════════════════════════════════════ */
function renderSavedPanel() {
  var saved = getSaved();
  var body  = document.getElementById("saved-panel-body");
  if (!body) return;
  if (!saved.length) { body.innerHTML = '<p style="padding:24px;text-align:center;color:var(--ink3);font-size:13px">No saved searches yet. Search something and pin it!</p>'; return; }
  body.innerHTML = "";
  saved.forEach(function(s) {
    var cfg = P[s.platform] || P.google;
    var row = document.createElement("div");
    row.className = "drop-row";
    row.style.cssText = "display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border2)";
    row.innerHTML = '<span style="font-size:18px">' + cfg.emoji + '</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(s.query) + '</div><div style="font-size:11px;color:' + cfg.color + '">' + cfg.name + '</div></div><button onclick="removeSaved(' + s.id + ');renderSavedPanel();" style="width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(200,40,0,.25);background:none;color:#CC3300;font-size:14px;flex-shrink:0">×</button>';
    row.querySelector(".drop-row, div").onclick = function(e){ if (e.target.tagName !== "BUTTON") { var si = document.getElementById("sb-input"); if (si) si.value = s.query; closeOverlay("saved-overlay"); fireSearch(null, s.platform); } };
    body.appendChild(row);
  });
}

function renderSavedQuick() {
  var saved = getSaved();
  var sec   = document.getElementById("saved-quick");
  var row   = document.getElementById("saved-pills-row");
  if (!sec || !row) return;
  if (!saved.length) { sec.style.display = "none"; return; }
  sec.style.display = "block";
  row.innerHTML = "";
  saved.slice(0, 6).forEach(function(s) {
    var cfg = P[s.platform] || P.google;
    var btn = document.createElement("button");
    btn.className = "svpill";
    btn.innerHTML = '<span style="font-size:14px">' + cfg.emoji + '</span><span class="svpill-name">' + escHtml(s.query) + '</span><span class="svpill-plat" style="color:' + cfg.color + '">' + cfg.name + '</span>';
    btn.onclick = function(){ var si = document.getElementById("sb-input"); if (si) si.value = s.query; fireSearch(null, s.platform); };
    row.appendChild(btn);
  });
  var mgr = document.createElement("button");
  mgr.className = "sv-manage"; mgr.textContent = "+ Manage";
  mgr.onclick = function(){ openOverlay("saved-overlay"); };
  row.appendChild(mgr);
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY + ANALYTICS
═══════════════════════════════════════════════════════════════ */
function renderHistoryTab() {
  var hist = getHistory();
  var el   = document.getElementById("tab-history");
  if (!el) return;
  if (!hist.length) { el.innerHTML = '<p style="padding:24px;text-align:center;color:var(--ink3);font-size:13px">No searches yet.</p>'; return; }
  el.innerHTML = "";
  hist.forEach(function(h, i) {
    var cfg = P[h.platform] || P.google;
    var row = document.createElement("div");
    row.className = "drop-row";
    row.style.animationDelay = (i * .025) + "s";
    row.innerHTML = '<span style="font-size:16px">' + cfg.emoji + '</span><span class="drop-row-label">' + escHtml(h.query) + '</span><span class="drop-row-badge" style="background:' + cfg.color + '18;color:' + cfg.color + '">' + cfg.name + '</span>';
    row.onclick = function(){ var si = document.getElementById("sb-input"); if (si) si.value = h.query; closeOverlay("history-overlay"); fireSearch(null, h.platform); };
    el.appendChild(row);
  });
}

function renderAnalyticsTab() {
  var hist = getHistory();
  var el   = document.getElementById("tab-analytics");
  if (!el) return;
  if (!hist.length) { el.innerHTML = '<p style="padding:24px;text-align:center;color:var(--ink3);font-size:13px">No data yet.</p>'; return; }
  var counts = {};
  hist.forEach(function(h){ counts[h.platform] = (counts[h.platform] || 0) + 1; });
  var top = Object.entries(counts).sort(function(a,b){ return b[1]-a[1]; }).slice(0, 5);
  var today = hist.filter(function(h){ return Date.now() - h.ts < 86400000; }).length;
  el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">' +
    '<div style="background:var(--sfbg);border:1.5px solid var(--border2);border-radius:14px;padding:14px;text-align:center"><div style="font-size:22px;margin-bottom:4px">🔍</div><div style="font-size:20px;font-weight:800;color:var(--ink)">' + hist.length + '</div><div style="font-size:11px;color:var(--ink3)">Total Searches</div></div>' +
    '<div style="background:var(--sfbg);border:1.5px solid var(--border2);border-radius:14px;padding:14px;text-align:center"><div style="font-size:22px;margin-bottom:4px">📅</div><div style="font-size:20px;font-weight:800;color:var(--ink)">' + today + '</div><div style="font-size:11px;color:var(--ink3)">Today</div></div>' +
    '</div>' +
    '<p style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--ink3);text-transform:uppercase;margin-bottom:12px">Top Platforms</p>' +
    top.map(function(entry){
      var pid = entry[0], count = entry[1];
      var cfg = P[pid] || P.google;
      var pct = Math.round(count / hist.length * 100);
      return '<div style="margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><div style="display:flex;align-items:center;gap:7px"><span>' + cfg.emoji + '</span><span style="font-size:13px;font-weight:600">' + cfg.name + '</span></div><span style="font-size:12px;color:var(--ink3)">' + count + ' · ' + pct + '%</span></div><div style="height:6px;border-radius:10px;background:var(--sfbg);overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + cfg.color + ',' + cfg.color + '88);border-radius:10px;transition:width .6s"></div></div></div>';
    }).join("");
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(function(b){ b.classList.toggle("active", b.dataset.tab === tab); });
  document.querySelectorAll(".tab-panel").forEach(function(p){ p.classList.toggle("active", p.id === "tab-" + tab); });
  if (tab === "history")   renderHistoryTab();
  if (tab === "analytics") renderAnalyticsTab();
}

/* ═══════════════════════════════════════════════════════════════
   COMMAND PALETTE
═══════════════════════════════════════════════════════════════ */
var paletteActions = [
  { icon: "🔍", label: "Search Google",    fn: function(){ fireSearch(null,"google"); } },
  { icon: "🛒", label: "Search Amazon",    fn: function(){ var q=document.getElementById("palette-input").value||document.getElementById("sb-input").value; if(q) fireSearch(null,"amazon"); } },
  { icon: "▶️", label: "Search YouTube",  fn: function(){ var q=document.getElementById("palette-input").value||document.getElementById("sb-input").value; if(q) fireSearch(null,"youtube"); } },
  { icon: "🗺️", label: "Search Maps",     fn: function(){ var q=document.getElementById("palette-input").value||document.getElementById("sb-input").value; if(q) fireSearch(null,"maps"); } },
  { icon: "⭐", label: "Saved Searches",   fn: function(){ openOverlay("saved-overlay"); } },
  { icon: "🕒", label: "Search History",   fn: function(){ openOverlay("history-overlay"); } },
  { icon: "🌙", label: "Toggle Dark Mode", fn: toggleDark },
  { icon: "👤", label: "Sign In / Out",    fn: function(){ if(state.authUser) handleLogout(); else showPage("auth"); } }
];
function renderPalette(filter) {
  var list     = document.getElementById("palette-list");
  if (!list) return;
  var filtered = filter
    ? paletteActions.filter(function(a){ return a.label.toLowerCase().includes(filter.toLowerCase()); })
    : paletteActions;
  list.innerHTML = "";
  if (!filtered.length) { list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--ink3);font-size:13px">No commands found</p>'; return; }
  filtered.forEach(function(a, i) {
    var row = document.createElement("div");
    row.className = "palette-action";
    row.style.animationDelay = (i * .03) + "s";
    row.innerHTML = '<span class="palette-icon">' + a.icon + '</span><span class="palette-action-label">' + a.label + '</span>' + (i === 0 && filter ? '<span class="palette-enter">↵</span>' : "");
    row.onclick = function(){ a.fn(); closeOverlay("palette-overlay"); };
    list.appendChild(row);
  });
}
function filterPalette() { renderPalette(document.getElementById("palette-input").value); }
function paletteKey(e) {
  if (e.key === "Escape") closeOverlay("palette-overlay");
  if (e.key === "Enter") { var first = document.querySelector(".palette-action"); if (first) first.click(); }
}

/* ═══════════════════════════════════════════════════════════════
   SHORTHAND TOOLTIP
═══════════════════════════════════════════════════════════════ */
function renderShorthandTooltip() {
  var hints = [
    {alias:"@az",label:"Amazon",color:"#FF9900"},{alias:"@fk",label:"Flipkart",color:"#2874F0"},
    {alias:"@mn",label:"Myntra",color:"#FF3F6C"},{alias:"@yt",label:"YouTube",color:"#FF0000"},
    {alias:"@mp",label:"Maps",color:"#34A853"},{alias:"@g",label:"Google",color:"#4285F4"},
    {alias:"@so",label:"StackOverflow",color:"#F48024"},{alias:"@rd",label:"Reddit",color:"#FF4500"},
    {alias:"@gh",label:"GitHub",color:"#24292e"}
  ];
  var tt = document.getElementById("sh-tooltip");
  if (!tt) return;
  tt.innerHTML = '<p style="font-size:9px;font-weight:700;letter-spacing:.1em;color:rgba(255,180,80,.55);margin-bottom:10px;text-transform:uppercase">Platform Shortcuts</p>' +
    hints.map(function(h){ return '<div class="sh-item"><code class="sh-code" style="color:' + h.color + '">' + h.alias + '</code><span class="sh-label">' + h.label + '</span></div>'; }).join("") +
    '<div class="sh-tip">e.g. <strong style="color:#FF9900">@az</strong> iphone 15<br>e.g. <strong style="color:#FF0000">@yt</strong> lo-fi playlist<br>Press <strong>Tab</strong> to autocomplete</div>';
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORM CARDS — Infinite auto-scroll carousel
═══════════════════════════════════════════════════════════════ */
var _carousel = null; /* singleton handle so we never double-start */

function renderPlatformCards() {
  var wrap = document.getElementById("pscroll");
  if (!wrap) return;

  /* ── Build one set of cards ── */
  function makeCard(id) {
    var p    = P[id];
    var card = document.createElement("div");
    card.className = "pcard";
    card.dataset.pid = id;
    card.innerHTML =
      '<div class="picon" style="background:rgba(128,80,0,.06)">' + p.emoji + '</div>' +
      '<span class="pname">' + p.name + '</span>' +
      '<div class="pstreak" style="background:linear-gradient(90deg,transparent,' + p.color + ',transparent)"></div>';
    card.addEventListener("mouseenter", function(){
      card.style.borderColor  = p.color + "38";
      card.style.boxShadow    = "0 24px 56px " + p.color + "22,0 6px 20px rgba(0,0,0,.1)";
      card.querySelector(".picon").style.background = p.color + "18";
    });
    card.addEventListener("mouseleave", function(){
      card.style.borderColor  = "";
      card.style.boxShadow    = "";
      card.querySelector(".picon").style.background = "rgba(128,80,0,.06)";
    });
    card.onclick = function(){
      var si = document.getElementById("sb-input");
      if (si) si.value = p.name;
      fireSearch(null, p.id);
    };
    return card;
  }

  /* ── Wrap pscroll in a carousel container if not already ── */
  var section = wrap.closest(".platforms-section");
  var outer = section && section.querySelector(".pcarousel-outer");
  if (!outer) {
    outer = document.createElement("div");
    outer.className = "pcarousel-outer";
    wrap.parentNode.insertBefore(outer, wrap);
    outer.appendChild(wrap);
  }

  /* ── Replace scroll div with the track ── */
  wrap.innerHTML = "";
  wrap.className = "pcarousel-track";
  wrap.removeAttribute("id"); /* we'll still keep reference via _carousel */

  /* Populate two identical sets so the seam is invisible */
  var allIds = Object.keys(P).filter(function(id){ return id !== "google"; });
  /* Honour original order: QIDS first, then any extras */
  var ordered = QIDS.concat(allIds.filter(function(id){ return QIDS.indexOf(id) === -1; }));

  var setA = document.createElement("div");
  var setB = document.createElement("div");
  setA.className = setB.className = "pcarousel-set";

  ordered.forEach(function(id){ setA.appendChild(makeCard(id)); });
  ordered.forEach(function(id){ setB.appendChild(makeCard(id)); });

  wrap.appendChild(setA);
  wrap.appendChild(setB);

  /* ── Carousel engine ── */
  if (_carousel) _carousel.destroy();

  var speed   = 42;   /* px per second — feels slow & readable */
  var offset  = 0;
  var paused  = false;
  var resumeTimer = null;
  var lastTs  = null;
  var raf     = null;
  var setW    = 0;    /* width of one full set, measured after paint */

  function measureSet() {
    /* Sum card widths + gaps in one set */
    var cards = setA.querySelectorAll(".pcard");
    var gap   = 12; /* matches original gap:12px */
    var total = 0;
    cards.forEach(function(c){ total += c.offsetWidth + gap; });
    setW = total; /* include trailing gap so seam stays even */
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(ts - lastTs, 80) / 1000; /* cap at 80ms so tab-switch doesn't jump */
    lastTs = ts;

    if (!paused && setW > 0) {
      offset += speed * dt;
      if (offset >= setW) offset -= setW; /* seamless loop */
      wrap.style.transform = "translateX(-" + offset.toFixed(2) + "px)";
    }

    raf = requestAnimationFrame(tick);
  }

  function pause(resumeDelay) {
    paused = true;
    clearTimeout(resumeTimer);
    if (resumeDelay > 0) {
      resumeTimer = setTimeout(function(){
        paused = false;
        lastTs = null; /* reset dt so no jump on resume */
      }, resumeDelay);
    }
  }

  function resume() {
    paused = false;
    lastTs = null;
  }

  /* ── User-interaction: hover ── */
  outer.addEventListener("mouseenter", function(){ pause(0); });
  outer.addEventListener("mouseleave", function(){ resume(); });

  /* ── User-interaction: touch / trackpad swipe ── */
  var touchStartX = 0;
  var manualOffset = 0;
  outer.addEventListener("touchstart", function(e){
    pause(0);
    touchStartX = e.touches[0].clientX;
    manualOffset = offset;
  }, { passive: true });
  outer.addEventListener("touchmove", function(e){
    var dx = touchStartX - e.touches[0].clientX;
    offset = manualOffset + dx;
    if (offset < 0) offset += setW;
    if (offset >= setW) offset -= setW;
    wrap.style.transform = "translateX(-" + offset.toFixed(2) + "px)";
  }, { passive: true });
  outer.addEventListener("touchend", function(){
    pause(1800); /* resume after 1.8 s */
  });

  /* ── Visibility: pause when tab hidden ── */
  document.addEventListener("visibilitychange", function(){
    if (document.hidden) { clearTimeout(resumeTimer); paused = true; }
    else { lastTs = null; paused = false; }
  });

  /* ── Start after one paint so offsetWidths are available ── */
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      measureSet();
      raf = requestAnimationFrame(tick);
    });
  });

  /* ── Re-measure on resize ── */
  window.addEventListener("resize", measureSet);

  _carousel = {
    destroy: function(){
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      window.removeEventListener("resize", measureSet);
    }
  };
}

/* ═══════════════════════════════════════════════════════════════
   PARTICLES
═══════════════════════════════════════════════════════════════ */
function initParticles(canvasId) {
  var cvs = document.getElementById(canvasId);
  if (!cvs) return;
  var ctx = cvs.getContext("2d");
  var W = cvs.width = window.innerWidth, H = cvs.height = window.innerHeight;
  window.addEventListener("resize", function(){ W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight; });
  var m = {x:0, y:0};
  window.addEventListener("mousemove", function(e){ m.x = e.clientX; m.y = e.clientY; });
  var pts = Array.from({length:50}, function(){ return {x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.32,vy:(Math.random()-.5)*.32,r:Math.random()*2+.5,a:Math.random()*.4+.07,sf:Math.random()>.5}; });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) for (var j = i+1; j < pts.length; j++) {
      var d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
      if (d < 130) { ctx.beginPath(); ctx.strokeStyle = "rgba(255,122,0," + (.04*(1-d/130)) + ")"; ctx.lineWidth = .5; ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke(); }
    }
    pts.forEach(function(p) {
      var d = Math.hypot(m.x-p.x, m.y-p.y);
      if (d < 180) { p.vx += (m.x-p.x)*.00005; p.vy += (m.y-p.y)*.00005; }
      p.vx *= .989; p.vy *= .989; p.x = (p.x+p.vx+W)%W; p.y = (p.y+p.vy+H)%H;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = state.dark ? "rgba(255,122,0," + p.a + ")" : (p.sf ? "rgba(255,122,0," + p.a + ")" : "rgba(200,170,130," + (p.a*.4) + ")");
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ═══════════════════════════════════════════════════════════════
   CURSOR
═══════════════════════════════════════════════════════════════ */
function initCursor() {
  if (window.matchMedia && window.matchMedia("(pointer:coarse)").matches) return;
  var dot  = document.getElementById("cur-dot");
  var ring = document.getElementById("cur-ring");
  if (!dot || !ring) return;
  var pos = {mx:-100,my:-100,rx:-100,ry:-100};
  window.addEventListener("mousemove", function(e){ pos.mx = e.clientX; pos.my = e.clientY; });
  window.addEventListener("mousedown", function(){ document.body.classList.add("cclk"); });
  window.addEventListener("mouseup",   function(){ document.body.classList.remove("cclk"); });
  function addHov() {
    document.querySelectorAll("button,a,input,[data-h]").forEach(function(el) {
      el.addEventListener("mouseenter", function(){ document.body.classList.add("chov"); },    {passive:true});
      el.addEventListener("mouseleave", function(){ document.body.classList.remove("chov"); }, {passive:true});
    });
  }
  addHov();
  new MutationObserver(addHov).observe(document.body, {childList:true, subtree:true});
  var sbBtn = document.getElementById("sb-btn");
  if (sbBtn) {
    sbBtn.addEventListener("mousemove", function(e){
      var rc = sbBtn.getBoundingClientRect();
      var dx = (e.clientX-(rc.left+rc.width/2))*.2;
      var dy = (e.clientY-(rc.top+rc.height/2))*.2;
      sbBtn.style.transform = "translate(" + dx + "px," + dy + "px) translateY(-2px) scale(1.02)";
    });
    sbBtn.addEventListener("mouseleave", function(){ sbBtn.style.transform = ""; });
  }
  function tick() {
    dot.style.transform  = "translate(" + pos.mx + "px," + pos.my + "px) translate(-50%,-50%)";
    pos.rx += (pos.mx-pos.rx)*.13; pos.ry += (pos.my-pos.ry)*.13;
    ring.style.transform = "translate(" + pos.rx + "px," + pos.ry + "px) translate(-50%,-50%)";
    requestAnimationFrame(tick);
  }
  tick();
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL INDICATORS
═══════════════════════════════════════════════════════════════ */
function initScrollIndicators() {
  var t = false;
  window.addEventListener("scroll", function() {
    if (t) return; t = true;
    requestAnimationFrame(function() {
      var y   = window.scrollY;
      var max = document.body.scrollHeight - window.innerHeight;
      var up  = document.getElementById("scroll-up-btn");
      var dn  = document.getElementById("scroll-dn-btn");
      if (up) up.style.display = y > 200 ? "block" : "none";
      if (dn) dn.style.display = (max > 200 && y < max-100) ? "block" : "none";
      t = false;
    });
  }, {passive:true});
}

/* ═══════════════════════════════════════════════════════════════
   TOUR
═══════════════════════════════════════════════════════════════ */
var TOUR_STEPS = [
  {title:"Welcome to Divyam! 👋", body:"Type anything to search. Divyam intelligently routes to the best platform automatically."},
  {title:"Smart Shortcuts ⌨",     body:"Type @yt, @az, @mn to force a specific platform. Hover 'shortcuts' to see all aliases."},
  {title:"Voice Search 🎙",       body:"Click the mic button and speak. Works in Chrome and Edge on HTTPS."},
  {title:"Platform Chips ✦",      body:"As you type, smart chips appear. Click one to instantly search that platform."}
];
var tourStep = lsGet("dv_toured", null) ? 0 : 1;
function renderTour() {
  var el = document.getElementById("tour");
  if (!el) return;
  if (tourStep === 0) { el.classList.remove("show"); return; }
  var s = TOUR_STEPS[tourStep-1];
  if (!s) { el.classList.remove("show"); return; }
  var tt = document.getElementById("tour-title");
  var tb = document.getElementById("tour-body");
  var ts = document.getElementById("tour-step-label");
  var tn = document.getElementById("tour-next");
  var td = document.getElementById("tour-dots");
  if (tt) tt.textContent = s.title;
  if (tb) tb.textContent = s.body;
  if (ts) ts.textContent = tourStep + "/" + TOUR_STEPS.length;
  if (tn) tn.textContent = tourStep < TOUR_STEPS.length ? "Next →" : "Got it ✓";
  if (td) td.innerHTML = TOUR_STEPS.map(function(_,i){ return '<div class="tdot' + (i+1===tourStep?" active":"") + '"></div>'; }).join("");
  el.classList.add("show");
}
function tourNext() { tourStep++; if (tourStep > TOUR_STEPS.length) tourSkip(); else renderTour(); }
function tourSkip() { tourStep = 0; lsSet("dv_toured", true); var el = document.getElementById("tour"); if (el) el.classList.remove("show"); }

/* ═══════════════════════════════════════════════════════════════
   MIC / VOICE SEARCH
═══════════════════════════════════════════════════════════════ */
function toggleMic() {
  var btn = document.getElementById("mic-btn");
  var err = document.getElementById("mic-err");
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    if (err) { var et = document.getElementById("mic-err-text"); if (et) et.textContent = "Voice not supported in this browser"; err.classList.add("visible"); setTimeout(function(){ err.classList.remove("visible"); }, 3000); }
    return;
  }
  if (state.micState === "listening") {
    if (state.recognition) state.recognition.stop();
    state.micState = "idle";
    if (btn) btn.classList.remove("mic-on");
    return;
  }
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = new SpeechRecognition();
  rec.lang = "en-IN"; rec.interimResults = true; rec.maxAlternatives = 1;
  state.recognition = rec; state.micState = "listening";
  if (btn) btn.classList.add("mic-on");
  rec.onresult = function(e) {
    var transcript = Array.from(e.results).map(function(r){ return r[0].transcript; }).join("");
    var si = document.getElementById("sb-input");
    if (si) { si.value = transcript; updatePrefix(transcript); toggleCardsOnTyping(transcript); }
    if (e.results[e.results.length-1].isFinal) { state.micState = "idle"; if (btn) btn.classList.remove("mic-on"); fireSearch(); }
  };
  rec.onerror = function(e) {
    state.micState = "idle"; if (btn) btn.classList.remove("mic-on");
    if (err) { var et = document.getElementById("mic-err-text"); if (et) et.textContent = e.error === "not-allowed" ? "Mic permission denied" : "Voice error: " + e.error; err.classList.add("visible"); setTimeout(function(){ err.classList.remove("visible"); }, 3000); }
  };
  rec.onend = function() { state.micState = "idle"; if (btn) btn.classList.remove("mic-on"); };
  rec.start();
}

/* ═══════════════════════════════════════════════════════════════
   PLACEHOLDER CYCLE
═══════════════════════════════════════════════════════════════ */
function initPlaceholderCycle() {
  var inp = document.getElementById("sb-input");
  if (!inp || inp.value) return;
  var hints = [
    "Search anything — DIVYAM routes it smart",
    "Try: @yt lo-fi music",
    "Try: buy wireless headphones",
    "Try: how to make biryani",
    "Try: @so fix undefined is not a function",
    "Try: @rd best laptop under 50k",
    "Try: near me pizza",
    "Try: blue jeans history"
  ];
  var i = 0;
  function cycle() {
    if (document.activeElement === inp || inp.value) return;
    inp.placeholder = hints[i % hints.length]; i++;
  }
  cycle();
  setInterval(cycle, 3200);
}

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — runs after DOM is ready
═══════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function() {

  /* ── Search bar (desktop) ── */
  var inp  = document.getElementById("sb-input");
  var drop = document.getElementById("drop");
  if (inp) {
    inp.addEventListener("focus", function(){
      var sw = document.getElementById("sb-wrap");
      var si = document.getElementById("sb-icon");
      if (sw) sw.classList.add("focused");
      if (si) si.style.color = "var(--sf)";
      /* Hide platform cards when bar is focused */
      toggleCardsOnTyping(inp.value, true);
      updateDrop();
    });
    inp.addEventListener("blur", function(){
      setTimeout(function(){
        var sw = document.getElementById("sb-wrap");
        var si = document.getElementById("sb-icon");
        if (sw) sw.classList.remove("focused");
        if (si) si.style.color = "var(--ink3)";
        closeDrop();
        var ch = document.getElementById("cmd-hints"); if (ch) ch.classList.remove("open");
        /* Restore platform cards if input is empty */
        if (!inp.value.trim()) toggleCardsOnTyping("", false);
      }, 220);
    });
    inp.addEventListener("input", function(){
      var v = inp.value;
      var clrBtn = document.getElementById("sb-clear");
      if (clrBtn) clrBtn.classList.toggle("visible", v.length > 0);
      updatePrefix(v);
      updateDrop();
      /* Cmd hints DISABLED during normal typing — only show if user types @ prefix */
      var ch = document.getElementById("cmd-hints");
      if (ch) ch.classList.remove("open");
      toggleCardsOnTyping(v, true);
    });
    inp.addEventListener("keydown", function(e){
      if (e.key === "Enter") fireSearch();
      if (e.key === "Escape") { inp.value = ""; clearInput(); }
      if (e.key === "Tab") {
        var parsed = parseShorthand(inp.value);
        if (!parsed.platform) {
          for (var id in P) {
            var cfg = P[id];
            for (var ai = 0; ai < cfg.aliases.length; ai++) {
              var alias = cfg.aliases[ai];
              if (inp.value.toLowerCase().startsWith(alias.slice(0, 2))) {
                e.preventDefault(); inp.value = alias + " "; updatePrefix(inp.value); updateDrop(); return;
              }
            }
          }
        }
      }
    });
  }

  /* ── Mobile search bar ── */
  var mi = document.getElementById("msb-input");
  var mc = document.getElementById("msb-clear");
  var mw = document.getElementById("msb-wrap");
  if (mi) {
    mi.addEventListener("input", function(){ if (mc) mc.style.display = mi.value ? "block" : "none"; toggleCardsOnTyping(mi.value); });
    mi.addEventListener("focus", function(){ if (mw) mw.classList.add("focused"); });
    mi.addEventListener("blur",  function(){ setTimeout(function(){ if (mw) mw.classList.remove("focused"); }, 200); });
    mi.addEventListener("keydown", function(e){
      if (e.key === "Enter")  fireSearch("mobile");
      if (e.key === "Escape") { mi.value = ""; if (mc) mc.style.display = "none"; mi.blur(); }
    });
  }

  /* ── Keyboard shortcuts ── */
  document.addEventListener("keydown", function(e){
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); openOverlay("palette-overlay"); }
      else { e.preventDefault(); var si = document.getElementById("sb-input"); if (si) si.focus(); }
    }
    if (e.key === "Escape") {
      closeOverlay("palette-overlay"); closeOverlay("saved-overlay"); closeOverlay("history-overlay");
      var mp = document.getElementById("mem-popup"); if (mp) mp.classList.remove("open");
    }
  });

  /* ── Membership popup backdrop close ── */
  var mp = document.getElementById("mem-popup");
  if (mp) mp.addEventListener("click", function(e){ if (e.target === mp) closePopup(); });

  /* ── Auth page back button visibility ── */
  var backBtn = document.getElementById("auth-back");
  if (backBtn) {
    var cached = lsGet("dv_usr", null);
    backBtn.style.display = cached ? "flex" : "none";
  }

  /* ── INIT ── */
  applyDark();
  initCursor();
  initParticles("particles");
  renderPlatformCards();
  renderShorthandTooltip();
  renderSavedQuick();
  renderTour();

  /* Restore session from localStorage instantly */
  var cachedUser     = lsGet("dv_usr", null);
  var cachedTok      = localStorage.getItem("dv_tok");
  var cachedLifetime = localStorage.getItem("dv_lifetime") === "1";

  if (cachedUser && cachedTok) {
    state.authUser = cachedUser;
    state.token    = cachedTok;
    if (cachedLifetime) { state.member = true; }
    applyAuthUI();
    setSearches(state.member ? "∞" : 0);
    showPage("search");
  } else {
    showPage("auth");
  }

  initScrollIndicators();
  initPlaceholderCycle();

  /* Mark app as ready so Firebase auth state listener can call _onAuthChange */
  window._appReady = true;
});
