import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_LIMIT = 5;
const STORAGE_KEY = "contentai_data";
const PRO_PRICE = 299;

// ⚠️ REPLACE these with your real UPI details
const UPI_ID = "yourname@upi";           // e.g. krushiv@okaxis
const UPI_NAME = "ContentAI Pro";        // Your registered name
const UPI_AMOUNT = PRO_PRICE;

const CONTENT_TYPES = [
  { id:"blog",    icon:"✍️", label:"Blog Post",            desc:"Long-form SEO articles",   color:"#4ade80" },
  { id:"caption", icon:"📸", label:"Social Caption",       desc:"Instagram & LinkedIn",      color:"#60a5fa" },
  { id:"email",   icon:"📧", label:"Email Copy",           desc:"Cold & marketing emails",   color:"#f472b6" },
  { id:"ad",      icon:"🎯", label:"Ad Copy",              desc:"Facebook & Google ads",     color:"#fb923c" },
  { id:"product", icon:"🛍️", label:"Product Description", desc:"E-commerce listings",       color:"#a78bfa" },
  { id:"youtube", icon:"🎬", label:"YouTube Script",       desc:"Video scripts & hooks",     color:"#f87171" },
  { id:"thread",  icon:"🧵", label:"Twitter Thread",       desc:"Viral tweet threads",       color:"#38bdf8" },
  { id:"seo",     icon:"🔍", label:"SEO Meta",             desc:"Title & meta description",  color:"#facc15" },
];
const TONES     = ["Professional","Casual","Witty","Persuasive","Inspirational","Formal","Friendly","Urgent"];
const LENGTHS   = ["Short","Medium","Long"];
const LANGUAGES = ["English","Hindi","Spanish","French","German","Portuguese"];

// ─── UPI QR URL builder ───────────────────────────────────────────────────────
function buildUpiUrl() {
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${UPI_AMOUNT}&cu=INR&tn=${encodeURIComponent("ContentAI Pro Upgrade")}`;
}
function buildQrImageUrl() {
  const data = buildUpiUrl();
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=0d0d18&color=00ffa3&qzone=1`;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadData() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return { history:[], usageCount:0, isPro:false };
}
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ text, speed = 6 }) {
  const [shown, setShown] = useState("");
  const [done, setDone]   = useState(false);
  const ref = useRef(0);
  useEffect(() => {
    setShown(""); setDone(false); ref.current = 0;
    if (!text) return;
    const iv = setInterval(() => {
      ref.current++;
      setShown(text.slice(0, ref.current));
      if (ref.current >= text.length) { setDone(true); clearInterval(iv); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{shown}{!done && <span className="tw-cursor">|</span>}</span>;
}

// ─── UPI Payment Modal ────────────────────────────────────────────────────────
function UpiPaymentModal({ onClose, onVerify }) {
  const [step, setStep]           = useState("qr"); // qr | confirm | success
  const [txnId, setTxnId]         = useState("");
  const [copying, setCopying]     = useState(false);
  const [qrLoaded, setQrLoaded]   = useState(false);
  const [timer, setTimer]         = useState(600); // 10 min countdown
  const upiUrl                    = buildUpiUrl();
  const qrUrl                     = buildQrImageUrl();

  useEffect(() => {
    if (step !== "qr") return;
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  function copyUpi() {
    navigator.clipboard.writeText(UPI_ID);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  }

  function mm(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#0d0d18", border:"1px solid #1e1e30",
        borderRadius:24, width:"100%", maxWidth:460,
        overflow:"hidden", position:"relative",
      }}>
        {/* Header */}
        <div style={{
          padding:"22px 28px", borderBottom:"1px solid #14141f",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"#e2e2f0" }}>Upgrade to Pro</div>
            <div style={{ fontSize:12, color:"#444460", marginTop:2 }}>Pay ₹{PRO_PRICE}/month via UPI</div>
          </div>
          <button onClick={onClose} style={{
            background:"#1a1a2e", border:"none", borderRadius:8,
            color:"#555570", width:32, height:32, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
          }}>✕</button>
        </div>

        {/* Step: QR */}
        {step === "qr" && (
          <div style={{ padding:28 }}>

            {/* Timer */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(0,255,163,.06)", border:"1px solid rgba(0,255,163,.15)",
              borderRadius:10, padding:"10px 16px", marginBottom:24,
            }}>
              <span style={{ fontSize:12, color:"#00ffa3" }}>⏱ QR valid for</span>
              <span style={{ fontSize:14, fontWeight:700, color:"#00ffa3", fontFamily:"monospace" }}>{mm(timer)}</span>
            </div>

            {/* QR Code */}
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{
                display:"inline-block", padding:12,
                background:"#0a0a14", border:"2px solid #1e1e30",
                borderRadius:16, position:"relative",
              }}>
                {!qrLoaded && (
                  <div style={{
                    position:"absolute", inset:0, display:"flex",
                    alignItems:"center", justifyContent:"center",
                    background:"#0a0a14", borderRadius:14,
                  }}>
                    <div style={{ color:"#333348", fontSize:12 }}>Loading QR...</div>
                  </div>
                )}
                <img
                  src={qrUrl} alt="UPI QR Code" width={200} height={200}
                  onLoad={() => setQrLoaded(true)}
                  style={{ display:"block", borderRadius:8, imageRendering:"pixelated" }}
                />
              </div>
              <div style={{ marginTop:14, fontSize:12, color:"#444460" }}>
                Scan with any UPI app
              </div>
            </div>

            {/* UPI Apps */}
            <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:22 }}>
              {[
                { name:"GPay",    bg:"#1a73e8", emoji:"G" },
                { name:"PhonePe", bg:"#5f259f", emoji:"P" },
                { name:"Paytm",   bg:"#002970", emoji:"₹" },
                { name:"BHIM",    bg:"#138808", emoji:"B" },
              ].map(app => (
                <a key={app.name} href={upiUrl} style={{ textDecoration:"none", textAlign:"center" }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background:app.bg, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:18, fontWeight:800,
                    color:"#fff", marginBottom:5, cursor:"pointer",
                    border:"2px solid rgba(255,255,255,.08)",
                  }}>{app.emoji}</div>
                  <div style={{ fontSize:9, color:"#444460" }}>{app.name}</div>
                </a>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ flex:1, height:1, background:"#14141f" }} />
              <span style={{ fontSize:11, color:"#333348" }}>OR PAY MANUALLY</span>
              <div style={{ flex:1, height:1, background:"#14141f" }} />
            </div>

            {/* UPI ID copy */}
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              background:"#0a0a14", border:"1px solid #1a1a2e",
              borderRadius:10, padding:"12px 14px", marginBottom:22,
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:"#333348", marginBottom:3 }}>UPI ID</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#00ffa3", fontFamily:"monospace" }}>{UPI_ID}</div>
              </div>
              <button onClick={copyUpi} style={{
                padding:"7px 14px", borderRadius:8,
                background: copying ? "rgba(0,255,163,.15)" : "#1a1a2e",
                border:`1px solid ${copying ? "#00ffa3" : "#252538"}`,
                color: copying ? "#00ffa3" : "#666688",
                fontSize:12, cursor:"pointer", fontFamily:"inherit",
                transition:"all .2s",
              }}>{copying ? "✓ Copied" : "Copy"}</button>
            </div>

            {/* Amount */}
            <div style={{
              background:"#0a0a14", border:"1px solid #1a1a2e",
              borderRadius:10, padding:"12px 14px", marginBottom:22,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <span style={{ fontSize:12, color:"#444460" }}>Amount to pay</span>
              <span style={{ fontSize:18, fontWeight:800, color:"#e2e2f0" }}>₹{PRO_PRICE}</span>
            </div>

            <button onClick={() => setStep("confirm")} style={{
              width:"100%", padding:"13px", borderRadius:12,
              background:"linear-gradient(135deg,#00ffa3,#00cc80)",
              border:"none", color:"#060609", fontWeight:800,
              fontSize:15, cursor:"pointer", fontFamily:"inherit",
            }}>
              I've Paid — Enter Transaction ID →
            </button>
          </div>
        )}

        {/* Step: Confirm TXN */}
        {step === "confirm" && (
          <div style={{ padding:28 }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🧾</div>
              <h3 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Enter Transaction ID</h3>
              <p style={{ fontSize:13, color:"#444460", lineHeight:1.6 }}>
                Find your UPI Transaction ID in your payment app under transaction history.
              </p>
            </div>

            {/* How to find TXN ID */}
            <div style={{
              background:"#0a0a14", border:"1px solid #1a1a2e",
              borderRadius:10, padding:16, marginBottom:20,
            }}>
              <div style={{ fontSize:11, color:"#444460", fontWeight:600, marginBottom:10 }}>HOW TO FIND YOUR TXN ID</div>
              {[
                "GPay → Profile → Transactions → Find this payment",
                "PhonePe → History → Tap payment → Transaction ID",
                "Paytm → Passbook → Tap payment → Reference ID",
              ].map((tip, i) => (
                <div key={i} style={{ fontSize:12, color:"#555570", marginBottom:6, display:"flex", gap:8 }}>
                  <span style={{ color:"#00ffa3", flexShrink:0 }}>→</span>{tip}
                </div>
              ))}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:"#444460", fontWeight:600, display:"block", marginBottom:8 }}>
                TRANSACTION ID / UTR NUMBER
              </label>
              <input
                value={txnId}
                onChange={e => setTxnId(e.target.value)}
                placeholder="e.g. 425678901234 or T2504261234"
                style={{
                  width:"100%", background:"#0a0a14", border:"1px solid #1a1a2e",
                  borderRadius:10, color:"#e2e2f0", fontSize:14,
                  padding:"13px 14px", fontFamily:"monospace",
                }}
              />
            </div>

            <button
              onClick={() => { if (txnId.trim().length >= 6) setStep("success"); }}
              disabled={txnId.trim().length < 6}
              style={{
                width:"100%", padding:"13px", borderRadius:12,
                background: txnId.trim().length >= 6
                  ? "linear-gradient(135deg,#00ffa3,#00cc80)"
                  : "#1a1a2e",
                border:"none",
                color: txnId.trim().length >= 6 ? "#060609" : "#333348",
                fontWeight:800, fontSize:15, cursor: txnId.trim().length >= 6 ? "pointer" : "not-allowed",
                fontFamily:"inherit", marginBottom:10,
              }}
            >Verify & Activate Pro</button>

            <button onClick={() => setStep("qr")} style={{
              width:"100%", padding:"11px", borderRadius:12,
              background:"transparent", border:"1px solid #1a1a2e",
              color:"#444460", fontSize:13, cursor:"pointer", fontFamily:"inherit",
            }}>← Back to QR</button>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div style={{ padding:40, textAlign:"center" }}>
            <div style={{
              width:72, height:72, borderRadius:"50%",
              background:"rgba(0,255,163,.12)", border:"2px solid #00ffa3",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:32, margin:"0 auto 20px",
            }}>✓</div>
            <h3 style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Payment Received!</h3>
            <p style={{ color:"#444460", fontSize:13, marginBottom:8, lineHeight:1.6 }}>
              Your transaction ID <span style={{ color:"#00ffa3", fontFamily:"monospace" }}>{txnId}</span> has been recorded.
            </p>
            <p style={{ color:"#333348", fontSize:12, marginBottom:28, lineHeight:1.6 }}>
              Pro access is now active. In a real app, this would be verified server-side.
            </p>
            <button onClick={onVerify} style={{
              width:"100%", padding:"14px", borderRadius:12,
              background:"linear-gradient(135deg,#00ffa3,#00cc80)",
              border:"none", color:"#060609", fontWeight:800,
              fontSize:16, cursor:"pointer", fontFamily:"inherit",
            }}>⚡ Start Using Pro</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appData, setAppData]       = useState(loadData);
  const [view, setView]             = useState("generator");
  const [type, setType]             = useState(CONTENT_TYPES[0]);
  const [topic, setTopic]           = useState("");
  const [tone, setTone]             = useState("Professional");
  const [length, setLength]         = useState("Medium");
  const [language, setLanguage]     = useState("English");
  const [keywords, setKeywords]     = useState("");
  const [audience, setAudience]     = useState("");
  const [output, setOutput]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [toast, setToast]           = useState("");
  const [searchQ, setSearchQ]       = useState("");
  const [filterType, setFilterType] = useState("all");
  const [wordCount, setWordCount]   = useState(0);
  const [charCount, setCharCount]   = useState(0);

  const persist = useCallback((updates) => {
    setAppData(prev => { const next = { ...prev, ...updates }; saveData(next); return next; });
  }, []);

  useEffect(() => {
    setWordCount(output.trim().split(/\s+/).filter(Boolean).length);
    setCharCount(output.length);
  }, [output]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  async function generate() {
    if (!topic.trim()) return;
    if (!appData.isPro && appData.usageCount >= FREE_LIMIT) { setShowUpiModal(true); return; }
    setLoading(true); setOutput(""); setError(""); setCopied(false);

    const lengthGuide = { Short:"150-250 words", Medium:"350-500 words", Long:"700-1000 words" }[length];
    const prompt = `You are an expert ${language} copywriter. Write a ${type.label} in ${language}.
Topic: ${topic}
Tone: ${tone}
Target Length: ${lengthGuide}
${keywords ? `Keywords: ${keywords}` : ""}
${audience ? `Target Audience: ${audience}` : ""}
${type.id==="blog"    ? "Include: catchy headline, engaging intro, 3 sections with subheadings, actionable conclusion." : ""}
${type.id==="caption" ? "Include: hook line, engaging body, 5-8 hashtags, CTA." : ""}
${type.id==="email"   ? "Include: Subject line, preview text, greeting, body, CTA, sign-off." : ""}
${type.id==="ad"      ? "Include: Primary headline, 2 alternates, description, CTA. Use AIDA." : ""}
${type.id==="product" ? "Include: Product title, short description, 5 bullet benefits, long description." : ""}
${type.id==="youtube" ? "Include: Hook (15 sec), intro, 3 content sections, outro with CTA, description, tags." : ""}
${type.id==="thread"  ? "Write 8-10 numbered tweets each under 280 chars, strong hook at #1." : ""}
${type.id==="seo"     ? "Write: SEO title (under 60 chars), meta description (under 160 chars), 5 keywords, OG title, OG description." : ""}
Write in ${language}. Ready to publish. No placeholders.`;

    try {
      const res  = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBZnjoef6lkyNs_RcUpGAyJzfJwmo", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{ role:"user", content:prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text||"").join("") || "";
      setOutput(text);
      const entry = {
        id:Date.now(), type:type.id, typeLabel:type.label, typeIcon:type.icon,
        topic, tone, language, output:text, createdAt:new Date().toISOString(), favorite:false,
      };
      persist({ history:[entry,...appData.history].slice(0,100), usageCount:appData.usageCount+1 });
    } catch { setError("Generation failed. Please try again."); }
    finally { setLoading(false); }
  }

  function copyText() { navigator.clipboard.writeText(output); setCopied(true); showToast("Copied!"); setTimeout(()=>setCopied(false),2000); }
  function downloadTxt() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([output],{type:"text/plain"}));
    a.download = `${type.label.replace(/\s+/g,"-")}-${Date.now()}.txt`; a.click();
    showToast("Downloaded!");
  }
  function toggleFavorite(id) { persist({ history:appData.history.map(h=>h.id===id?{...h,favorite:!h.favorite}:h) }); }
  function deleteHistory(id) { persist({ history:appData.history.filter(h=>h.id!==id) }); showToast("Deleted!"); }
  function loadFromHistory(entry) {
    setType(CONTENT_TYPES.find(t=>t.id===entry.type)||CONTENT_TYPES[0]);
    setTopic(entry.topic); setTone(entry.tone); setLanguage(entry.language||"English"); setOutput(entry.output);
    setView("generator"); showToast("Loaded!");
  }
  function activatePro() { persist({ isPro:true }); setShowUpiModal(false); showToast("🎉 Pro activated! Unlimited generations!"); }

  const filteredHistory = appData.history.filter(h => {
    const ms = h.topic.toLowerCase().includes(searchQ.toLowerCase()) || h.typeLabel.toLowerCase().includes(searchQ.toLowerCase());
    const mf = filterType==="all" || filterType==="favorites" ? (filterType==="all"||h.favorite) : h.type===filterType;
    return ms && mf;
  });
  const usageLeft = Math.max(0, FREE_LIMIT - appData.usageCount);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    .tw-cursor{animation:blink .65s infinite;color:#00ffa3;}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes popIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
    .spinner{animation:spin .8s linear infinite;}
    .fade-up{animation:fadeUp .3s ease forwards;}
    .slide-in{animation:slideIn .22s ease forwards;}
    .pop-in{animation:popIn .25s ease forwards;}
    .nav-btn{transition:all .16s;cursor:pointer;border:none;background:transparent;font-family:inherit;}
    .nav-btn:hover{color:#00ffa3!important;}
    .type-card{transition:all .16s;cursor:pointer;}
    .type-card:hover{transform:translateY(-2px);}
    .chip{transition:all .14s;cursor:pointer;border:none;font-family:inherit;}
    .chip:hover{border-color:#00ffa3!important;color:#00ffa3!important;}
    .btn{transition:all .18s;cursor:pointer;border:none;font-family:inherit;}
    .btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
    .btn:active:not(:disabled){transform:translateY(0);}
    .hist-card{transition:all .16s;cursor:pointer;}
    .hist-card:hover{border-color:#1e1e32!important;background:#0d0d1a!important;}
    .icon-btn{transition:all .14s;cursor:pointer;border:none;background:transparent;display:flex;align-items:center;justify-content:center;font-family:inherit;}
    .icon-btn:hover{color:#00ffa3!important;}
    input,textarea,select{font-family:'Bricolage Grotesque',sans-serif;}
    input:focus,textarea:focus,select:focus{outline:none;border-color:#00ffa3!important;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-thumb{background:#1e1e30;border-radius:4px;}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;}
    .toast-bar{animation:fadeUp .3s ease;}
  `;

  return (
    <div style={{ minHeight:"100vh", background:"#060609", fontFamily:"'Bricolage Grotesque',sans-serif", color:"#e2e2f0" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div className="toast-bar" style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"#111120", border:"1px solid #00ffa3",
          borderRadius:12, padding:"10px 22px", fontSize:13,
          color:"#00ffa3", zIndex:9999, whiteSpace:"nowrap",
          boxShadow:"0 8px 30px rgba(0,255,163,.18)",
        }}>{toast}</div>
      )}

      {/* UPI Payment Modal */}
      {showUpiModal && (
        <UpiPaymentModal onClose={() => setShowUpiModal(false)} onVerify={activatePro} />
      )}

      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div style={{
          width:220, background:"#08080f", borderRight:"1px solid #10101c",
          display:"flex", flexDirection:"column", padding:"24px 0",
          position:"sticky", top:0, height:"100vh", flexShrink:0,
        }}>
          <div style={{ padding:"0 18px 24px", borderBottom:"1px solid #10101c" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:34, height:34, borderRadius:10,
                background:"linear-gradient(135deg,#00ffa3,#00cc80)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, color:"#060609", fontWeight:900,
              }}>✦</div>
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>ContentAI</div>
                <div style={{ fontSize:10, color:"#333348", marginTop:1 }}>Pro Suite</div>
              </div>
            </div>
          </div>

          <div style={{ flex:1, padding:"14px 10px", display:"flex", flexDirection:"column", gap:3 }}>
            {[
              { id:"generator", icon:"⚡", label:"Generator" },
              { id:"history",   icon:"🕐", label:"History", badge:appData.history.length||null },
              { id:"pricing",   icon:"💎", label:"Pricing"  },
              { id:"settings",  icon:"⚙️", label:"Settings" },
            ].map(item => (
              <button key={item.id} className="nav-btn" onClick={() => setView(item.id)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                borderRadius:10, width:"100%", textAlign:"left",
                background: view===item.id ? "rgba(0,255,163,.08)" : "transparent",
                color: view===item.id ? "#00ffa3" : "#444460",
                fontSize:14, fontWeight: view===item.id ? 700 : 400,
              }}>
                <span style={{ fontSize:15 }}>{item.icon}</span>
                {item.label}
                {item.badge ? <span style={{ marginLeft:"auto", background:"#1a1a2e", color:"#444460", fontSize:10, padding:"2px 6px", borderRadius:8 }}>{item.badge}</span> : null}
              </button>
            ))}
          </div>

          {/* Usage meter */}
          <div style={{ padding:"14px 14px 0", borderTop:"1px solid #10101c" }}>
            {appData.isPro ? (
              <div style={{ background:"rgba(0,255,163,.06)", border:"1px solid rgba(0,255,163,.2)", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:"#00ffa3", fontWeight:700 }}>⚡ PRO ACTIVE</div>
                <div style={{ fontSize:10, color:"#333348", marginTop:2 }}>Unlimited generations</div>
              </div>
            ) : (
              <div style={{ background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                  <span style={{ fontSize:11, color:"#444460" }}>Free limit</span>
                  <span style={{ fontSize:11, color: usageLeft<=1 ? "#f87171" : "#00ffa3" }}>{usageLeft}/{FREE_LIMIT}</span>
                </div>
                <div style={{ height:3, background:"#1a1a2e", borderRadius:3, overflow:"hidden", marginBottom:10 }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${(appData.usageCount/FREE_LIMIT)*100}%`, background: usageLeft<=1 ? "#f87171" : "#00ffa3", transition:"width .3s" }} />
                </div>
                <button className="btn" onClick={() => setShowUpiModal(true)} style={{
                  width:"100%", padding:"7px", borderRadius:8,
                  background:"linear-gradient(135deg,#00ffa3,#00cc80)",
                  color:"#060609", fontSize:11, fontWeight:800,
                }}>Pay ₹{PRO_PRICE} via UPI</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:"auto" }}>

          {/* GENERATOR */}
          {view==="generator" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"100vh" }}>

              {/* Inputs */}
              <div style={{ padding:30, borderRight:"1px solid #10101c", overflowY:"auto" }}>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>Content Generator</h1>
                  <p style={{ color:"#333348", fontSize:13 }}>Fill details → generate publish-ready content instantly.</p>
                </div>

                {/* Type */}
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em", display:"block", marginBottom:10 }}>CONTENT TYPE</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                    {CONTENT_TYPES.map(t => (
                      <div key={t.id} className="type-card" onClick={() => setType(t)} style={{
                        padding:"10px 12px", borderRadius:10,
                        border:`1px solid ${type.id===t.id ? t.color : "#14141f"}`,
                        background: type.id===t.id ? `${t.color}0d` : "transparent",
                        display:"flex", alignItems:"center", gap:9,
                      }}>
                        <span style={{ fontSize:16 }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:type.id===t.id?t.color:"#888899" }}>{t.label}</div>
                          <div style={{ fontSize:10, color:"#2a2a3e" }}>{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em", display:"block", marginBottom:8 }}>TOPIC / BRIEF *</label>
                  <textarea value={topic} onChange={e=>setTopic(e.target.value)}
                    placeholder={`What is your ${type.label.toLowerCase()} about?`} rows={3}
                    style={{ width:"100%", background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:10, color:"#e2e2f0", fontSize:13, padding:"11px 13px", resize:"vertical", lineHeight:1.6 }} />
                </div>

                {/* Tone + Length */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em", display:"block", marginBottom:8 }}>TONE</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {TONES.map(t => (
                        <button key={t} className="chip" onClick={()=>setTone(t)} style={{
                          padding:"4px 10px", borderRadius:20, fontSize:10,
                          border:`1px solid ${tone===t?"#00ffa3":"#1a1a2e"}`,
                          background:tone===t?"rgba(0,255,163,.1)":"transparent",
                          color:tone===t?"#00ffa3":"#444460",
                        }}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em", display:"block", marginBottom:8 }}>LENGTH</label>
                    {LENGTHS.map(l => (
                      <button key={l} className="chip" onClick={()=>setLength(l)} style={{
                        display:"block", width:"100%", padding:"7px 12px", borderRadius:8,
                        fontSize:12, textAlign:"left", marginBottom:5,
                        border:`1px solid ${length===l?"#00ffa3":"#1a1a2e"}`,
                        background:length===l?"rgba(0,255,163,.1)":"transparent",
                        color:length===l?"#00ffa3":"#444460",
                      }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em", display:"block", marginBottom:8 }}>LANGUAGE</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {LANGUAGES.map(l => (
                      <button key={l} className="chip" onClick={()=>setLanguage(l)} style={{
                        padding:"4px 10px", borderRadius:20, fontSize:10,
                        border:`1px solid ${language===l?"#60a5fa":"#1a1a2e"}`,
                        background:language===l?"rgba(96,165,250,.1)":"transparent",
                        color:language===l?"#60a5fa":"#444460",
                      }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Keywords + Audience */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:22 }}>
                  {[["KEYWORDS","keywords","AI, startup…",setKeywords,keywords],["AUDIENCE","audience","Startup founders…",setAudience,audience]].map(([label,,,setter,val])=>(
                    <div key={label}>
                      <label style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em", display:"block", marginBottom:7 }}>{label}</label>
                      <input value={val} onChange={e=>setter(e.target.value)}
                        placeholder={label==="KEYWORDS"?"AI, startup…":"Startup founders…"}
                        style={{ width:"100%", background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:8, color:"#e2e2f0", fontSize:12, padding:"9px 11px" }} />
                    </div>
                  ))}
                </div>

                {/* Generate */}
                <button className="btn" onClick={generate} disabled={loading||!topic.trim()} style={{
                  width:"100%", padding:"14px", borderRadius:12,
                  background:loading||!topic.trim()?"#1a1a2e":"linear-gradient(135deg,#00ffa3,#00cc80)",
                  color:loading||!topic.trim()?"#2a2a3e":"#060609",
                  fontSize:15, fontWeight:800,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                }}>
                  {loading
                    ? <><svg className="spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Generating…</>
                    : <>⚡ Generate {type.label}</>
                  }
                </button>
              </div>

              {/* Output */}
              <div style={{ padding:30, display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:10, color:"#333348", fontWeight:700, letterSpacing:".08em" }}>OUTPUT</span>
                    {output && <>
                      <span style={{ fontSize:10, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:6, padding:"2px 7px", color:"#333348" }}>{wordCount}w</span>
                      <span style={{ fontSize:10, background:"#0d0d18", border:"1px solid #1a1a2e", borderRadius:6, padding:"2px 7px", color:"#333348" }}>{charCount}c</span>
                    </>}
                  </div>
                  {output && (
                    <div style={{ display:"flex", gap:7 }}>
                      <button className="icon-btn" onClick={copyText} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #1a1a2e", color:copied?"#00ffa3":"#444460", fontSize:11 }}>
                        {copied?"✓ Copied":"⎘ Copy"}
                      </button>
                      <button className="icon-btn" onClick={downloadTxt} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #1a1a2e", color:"#444460", fontSize:11 }}>
                        ↓ Save
                      </button>
                    </div>
                  )}
                </div>

                <div style={{
                  flex:1, background:"#08080f", border:"1px solid #10101c",
                  borderRadius:14, padding:22, overflowY:"auto", minHeight:380,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:12, lineHeight:1.9,
                  color:"#b0b0cc", whiteSpace:"pre-wrap", position:"relative",
                }}>
                  {!output && !loading && !error && (
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, opacity:.25 }}>
                      <span style={{ fontSize:48 }}>{type.icon}</span>
                      <span style={{ fontSize:12, color:"#333348" }}>Your {type.label} will appear here</span>
                    </div>
                  )}
                  {error && <div style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", borderRadius:8, padding:14, color:"#f87171", fontSize:12 }}>{error}</div>}
                  {loading && !output && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, color:"#333348" }}>
                      <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ffa3" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      <span style={{ fontSize:12 }}>Writing your {type.label}…</span>
                    </div>
                  )}
                  {output && <div className="fade-up"><Typewriter text={output} speed={5} /></div>}
                </div>

                {output && (
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button className="btn" onClick={generate} style={{ flex:1, padding:"9px", borderRadius:9, border:"1px solid #1a1a2e", background:"transparent", color:"#666688", fontSize:12 }}>↻ Regenerate</button>
                    <button className="btn" onClick={()=>{setOutput("");setTopic("");}} style={{ flex:1, padding:"9px", borderRadius:9, border:"1px solid #1a1a2e", background:"transparent", color:"#666688", fontSize:12 }}>+ New</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY */}
          {view==="history" && (
            <div style={{ padding:32, maxWidth:820, margin:"0 auto" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h2 style={{ fontSize:22, fontWeight:800, marginBottom:3 }}>History</h2>
                  <p style={{ color:"#333348", fontSize:12 }}>{appData.history.length} saved</p>
                </div>
                {appData.history.length > 0 && (
                  <button className="btn" onClick={()=>{ persist({history:[],usageCount:0}); showToast("Cleared!"); }} style={{ padding:"7px 14px", borderRadius:7, border:"1px solid #f871711a", background:"transparent", color:"#f87171", fontSize:11 }}>Clear All</button>
                )}
              </div>
              <div style={{ display:"flex", gap:10, marginBottom:18 }}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search…"
                  style={{ flex:1, background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:9, color:"#e2e2f0", fontSize:12, padding:"9px 12px" }} />
                <select value={filterType} onChange={e=>setFilterType(e.target.value)}
                  style={{ background:"#0a0a14", border:"1px solid #1a1a2e", borderRadius:9, color:"#888899", fontSize:12, padding:"9px 12px" }}>
                  <option value="all">All</option>
                  <option value="favorites">⭐ Favorites</option>
                  {CONTENT_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              {filteredHistory.length===0
                ? <div style={{ textAlign:"center", padding:"60px 0", color:"#222238" }}><div style={{ fontSize:36, marginBottom:10 }}>🕐</div>No history yet.</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {filteredHistory.map(h=>(
                      <div key={h.id} className="hist-card slide-in" style={{ background:"#08080f", border:"1px solid #10101c", borderRadius:12, padding:18 }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                              <span style={{ fontSize:14 }}>{h.typeIcon}</span>
                              <span style={{ fontSize:10, fontWeight:700, color:CONTENT_TYPES.find(t=>t.id===h.type)?.color||"#888" }}>{h.typeLabel}</span>
                              <span style={{ fontSize:10, color:"#222238", marginLeft:"auto" }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize:13, fontWeight:600, marginBottom:5, color:"#ccccee" }}>{h.topic.slice(0,80)}{h.topic.length>80?"…":""}</div>
                            <div style={{ fontSize:11, color:"#222238", lineHeight:1.5 }}>{h.output.slice(0,100)}…</div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                            <button className="icon-btn" onClick={()=>loadFromHistory(h)} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #1a1a2e", color:"#666688", fontSize:10 }}>Load</button>
                            <button className="icon-btn" onClick={()=>toggleFavorite(h.id)} style={{ padding:"5px 11px", borderRadius:7, border:`1px solid ${h.favorite?"#facc15":"#1a1a2e"}`, color:h.favorite?"#facc15":"#444460", fontSize:10 }}>{h.favorite?"★":"☆"}</button>
                            <button className="icon-btn" onClick={()=>deleteHistory(h.id)} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #1a1a2e", color:"#444460", fontSize:10 }}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* PRICING */}
          {view==="pricing" && (
            <div style={{ padding:36, maxWidth:720, margin:"0 auto" }}>
              <div style={{ textAlign:"center", marginBottom:36 }}>
                <h2 style={{ fontSize:30, fontWeight:800, marginBottom:8 }}>Simple Pricing</h2>
                <p style={{ color:"#444460", fontSize:14 }}>Pay via UPI — GPay, PhonePe, Paytm accepted.</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                {[
                  { name:"Free", price:"₹0", period:"forever", highlight:false,
                    features:["5 generations/day","8 content types","Basic tones","History (last 20)","Copy & download"],
                    cta:appData.isPro?"Downgraded":"\Current Plan", action:()=>{} },
                  { name:"Pro", price:`₹${PRO_PRICE}`, period:"/month", highlight:true,
                    features:["Unlimited generations","All 8 content types","8 tones & 6 languages","Full history + favorites","Priority speed","Download as TXT","JSON export"],
                    cta:appData.isPro?"✓ Active":"Pay via UPI →", action:()=>setShowUpiModal(true) },
                ].map(plan=>(
                  <div key={plan.name} style={{
                    padding:28, borderRadius:18,
                    border:`1px solid ${plan.highlight?"#00ffa3":"#1a1a2e"}`,
                    background:plan.highlight?"rgba(0,255,163,.03)":"#08080f",
                    position:"relative",
                  }}>
                    {plan.highlight && (
                      <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
                        background:"linear-gradient(135deg,#00ffa3,#00cc80)", color:"#060609",
                        fontSize:9, fontWeight:900, padding:"4px 14px", borderRadius:20, whiteSpace:"nowrap",
                      }}>MOST POPULAR</div>
                    )}
                    <div style={{ fontSize:11, color:plan.highlight?"#00ffa3":"#444460", fontWeight:700, marginBottom:6 }}>{plan.name}</div>
                    <div style={{ fontSize:34, fontWeight:800, marginBottom:3 }}>
                      {plan.price}<span style={{ fontSize:13, color:"#333348", fontWeight:400 }}>{plan.period}</span>
                    </div>
                    {plan.highlight && (
                      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"12px 0", padding:"8px 12px",
                        background:"rgba(0,255,163,.06)", border:"1px solid rgba(0,255,163,.15)", borderRadius:8 }}>
                        <span style={{ fontSize:16 }}>📱</span>
                        <span style={{ fontSize:11, color:"#00ffa3" }}>Pay via GPay · PhonePe · Paytm · BHIM</span>
                      </div>
                    )}
                    <div style={{ margin:"18px 0", display:"flex", flexDirection:"column", gap:10 }}>
                      {plan.features.map(f=>(
                        <div key={f} style={{ display:"flex", alignItems:"center", gap:9, fontSize:12, color:"#888899" }}>
                          <span style={{ color:plan.highlight?"#00ffa3":"#222238", flexShrink:0 }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                    <button className="btn" onClick={plan.action} style={{
                      width:"100%", padding:"12px", borderRadius:10,
                      background:plan.highlight?"linear-gradient(135deg,#00ffa3,#00cc80)":"#111120",
                      border:plan.highlight?"none":"1px solid #1a1a2e",
                      color:plan.highlight?"#060609":"#444460", fontWeight:800, fontSize:13,
                    }}>{plan.cta}</button>
                  </div>
                ))}
              </div>

              {/* UPI badges */}
              <div style={{ textAlign:"center", marginTop:28 }}>
                <div style={{ fontSize:11, color:"#222238", marginBottom:14 }}>ACCEPTED PAYMENT METHODS</div>
                <div style={{ display:"flex", justifyContent:"center", gap:14 }}>
                  {[{label:"GPay",bg:"#1a73e8",e:"G"},{label:"PhonePe",bg:"#5f259f",e:"P"},{label:"Paytm",bg:"#002970",e:"₹"},{label:"BHIM",bg:"#138808",e:"B"},{label:"Any UPI",bg:"#333348",e:"🔗"}].map(a=>(
                    <div key={a.label} style={{ textAlign:"center" }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", marginBottom:5, border:"1px solid rgba(255,255,255,.08)" }}>{a.e}</div>
                      <div style={{ fontSize:9, color:"#333348" }}>{a.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {view==="settings" && (
            <div style={{ padding:32, maxWidth:520, margin:"0 auto" }}>
              <h2 style={{ fontSize:22, fontWeight:800, marginBottom:24 }}>Settings</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { title:"ACCOUNT STATUS", content:(
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:13, color:appData.isPro?"#00ffa3":"#666688" }}>{appData.isPro?"⚡ Pro Active":"Free Account"}</span>
                      {!appData.isPro && <button className="btn" onClick={()=>setShowUpiModal(true)} style={{ padding:"7px 14px", borderRadius:7, background:"linear-gradient(135deg,#00ffa3,#00cc80)", color:"#060609", fontSize:11, fontWeight:800 }}>Pay ₹{PRO_PRICE} via UPI</button>}
                    </div>
                  )},
                  { title:"YOUR UPI SETTINGS", content:(
                    <div style={{ fontSize:12, color:"#333348", lineHeight:1.8 }}>
                      <div>UPI ID: <span style={{ color:"#00ffa3", fontFamily:"monospace" }}>{UPI_ID}</span></div>
                      <div style={{ marginTop:6, fontSize:11, color:"#222238" }}>Edit <code style={{ color:"#444460" }}>UPI_ID</code> in the source code to your real UPI ID before deploying.</div>
                    </div>
                  )},
                  { title:"USAGE STATS", content:(
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {[["Total Generations",appData.usageCount],["History Items",appData.history.length],["Favorites",appData.history.filter(h=>h.favorite).length]].map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:12, color:"#444460" }}>{k}</span>
                          <span style={{ fontSize:12, color:"#666688", fontFamily:"monospace" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )},
                  { title:"DATA", content:(
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <button className="btn" onClick={()=>{ persist({history:[],usageCount:0}); showToast("Cleared!"); }} style={{ padding:"9px", borderRadius:8, border:"1px solid #f871711a", background:"transparent", color:"#f87171", fontSize:12 }}>🗑 Clear History</button>
                      {appData.isPro && <button className="btn" onClick={()=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(appData.history,null,2)],{type:"application/json"})); a.download="contentai-history.json"; a.click(); showToast("Exported!"); }} style={{ padding:"9px", borderRadius:8, border:"1px solid #1a1a2e", background:"transparent", color:"#666688", fontSize:12 }}>↓ Export JSON</button>}
                    </div>
                  )},
                ].map(s=>(
                  <div key={s.title} style={{ background:"#08080f", border:"1px solid #10101c", borderRadius:12, padding:20 }}>
                    <div style={{ fontSize:10, color:"#222238", fontWeight:700, letterSpacing:".08em", marginBottom:14 }}>{s.title}</div>
                    {s.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
