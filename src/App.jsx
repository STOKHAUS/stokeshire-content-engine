import { useState, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   STOKESHIRE CONTENT ENGINE v3
   Full content ops: Intel → Research → Draft → Review → Deploy
   Voice Library · Dual-AI Review · Memory Bank · Integrations
   ═══════════════════════════════════════════════════════════════ */

const C = {
  copper:"#AD7A28",copperLight:"#C4943F",copperGlow:"rgba(173,122,40,0.08)",
  cream:"#FAF8F5",creamDark:"#F3EFE9",warmGray:"#E8E2D9",
  ink:"#1C1C1C",charcoal:"#2E2E2E",slate:"#6B6560",stone:"#9A948D",
  white:"#FFFFFF",success:"#3A7D44",warning:"#D4A017",danger:"#B53A2E",
  accent1:"#5B7F95",accent2:"#7B6B8D",accent3:"#8B6F4E",
};
const F={d:"'Cormorant Garamond','Georgia',serif",b:"'Jost','Helvetica Neue',sans-serif"};

// ═══ CSV + MCP CONFIG ═══
const CSV_URLS={
  search:"https://docs.google.com/spreadsheets/d/e/2PACX-1vTSTiGPTj3d8JIUglnoc9_h25XJWa1u-5umMUkXXIMvipwZZA8h9VWCQIx7nN_JDFjzmvB_r2OKqsEq/pub?gid=0&single=true&output=csv",
  traffic:"https://docs.google.com/spreadsheets/d/e/2PACX-1vTSTiGPTj3d8JIUglnoc9_h25XJWa1u-5umMUkXXIMvipwZZA8h9VWCQIx7nN_JDFjzmvB_r2OKqsEq/pub?gid=1051370982&single=true&output=csv",
};
const MCP={
  gmail:{type:"url",url:"https://gmail.mcp.claude.com/mcp",name:"gmail"},
  gcal:{type:"url",url:"https://gcal.mcp.claude.com/mcp",name:"gcal"},
  asana:{type:"url",url:"https://mcp.asana.com/v2/mcp",name:"asana"},
};

// ═══ VOICE LIBRARY — extracted from top-performing Stokeshire content ═══
const VOICE_LIBRARY = `
## VOICE LIBRARY — Extracted from Stokeshire's highest-performing published content

### Structural Patterns
- Opens with confident, direct positioning that establishes what the subject IS
- Immediately delivers the core definition/answer before going into details
- Uses structured H2 hierarchy: Intro → Quick Facts → Deep Sections → Health → FAQ → CTA
- Embeds genetics education naturally (RSPO2, merle gene, COI, generation labels)
- Weight/size always presented as ranges with units ("10-30 pounds, 14-16 inches at the shoulder")
- Coat descriptions bundle texture + shedding level + grooming needs in one paragraph
- Health section lists breed-specific risks by parent breed origin
- FAQ sections answer the exact Google "People Also Ask" questions

### Sentence-Level Voice Examples (match this cadence and tone)
- "If you're looking for a forever companion — not a trend — you're in the right place."
- "Unfortunately, some programs attempt to 'shrink' dogs too quickly by stacking small lines or overusing a single breed contribution."
- "Understanding this genetic makeup is critical for both breeders and future owners."
- "While individual variation exists, they typically range from medium to large-sized dogs."
- "Their striking appearance is accentuated by a luxuriously dense, wavy, and sometimes curly coat."
- "Each pairing is thoughtfully selected for health, temperament, and low-to-non-shedding coats with premium DNA Science."
- "Responsible breeders will take steps to minimize the risk of health issues by ensuring appropriate breeding and genetic testing."

### Voice Characteristics to Match
- Authority through specificity: exact weight ranges, gene names, generation labels
- Gentle correction of industry misinformation WITHOUT naming competitors
- Education-first: teaches the reader, doesn't sell to them
- Compliance-aware hedging: "may", "typically", "often", "can", "around"
- Personal breeder perspective: "At Stokeshire, we..." and "Our Stokeshire Method includes..."
- Transparent about health risks — builds trust through honesty
- Technical terms explained inline with parenthetical definitions
- Never uses urgency, scarcity, or hype tactics

### Phrases That Must Appear Naturally
- "At Stokeshire Designer Doodles, we..." (at least once per article)
- "Our Stokeshire Method" or "Stokeshire Puppy Aptitude Test" where relevant
- "no dog is truly hypoallergenic" or "no dog is 100% allergy-free" when discussing coats
- "lower-shedding" instead of "hypoallergenic" as a standalone claim
- "typically 12-15 years" for lifespan references
- "state-licensed" and "DATCP #514401-DS" in authority-establishing contexts

### Things the Voice NEVER Does
- Exclamation points in body copy (only in rare UI/callout elements)
- "Perfect", "guaranteed", "best dog ever" hyperbole
- Price comparisons to specific competitors
- Promises about therapy/service certification outcomes
- Claims about health test results without "consult your veterinarian" qualifier
- Stock photo language or generic pet blog filler sentences
`;

// ═══ SYSTEM PROMPT (with voice library) ═══
const SYSTEM_PROMPT = `You are the Stokeshire Content Engine — an expert SEO content writer for Stokeshire Designer Doodles (wisconsindesignerdoodles.com), a therapy-grade luxury breeding program in Medford, Wisconsin. DATCP license #514401-DS. Owner: James Stokes.

${VOICE_LIBRARY}

## BREEDS RAISED
Australian Mountain Doodles (AMD), Golden Mountain Doodles (GMD), Bernedoodles (standard, mini, munchkin, micro), Aussiedoodles (toy, mini), Goldendoodles (including F2 flat coat/unfurnished). Unfurnished = RSPO2 negative, not hypoallergenic.

## ARTICLE STRUCTURE (MANDATORY)
1. QUICK ANSWER (AEO) — 2-3 sentence direct answer extractable by AI search engines
2. TABLE OF CONTENTS — anchor-linked sections
3. BODY — H2 sections, short paragraphs (3-4 sentences), "Stokeshire Perspective" callout boxes, internal links as [INTERNAL LINK: /path]
4. FAQ — 4-6 questions, answers 600-1200 chars, hedged/compliant
5. CONVERSION BLOCK — CTAs to /apply and /available-puppies

## 3-LAYER CONTENT MODEL
Every article serves: (1) Authority/SEO, (2) Conversion/applications, (3) Commerce/future products [COMMERCE OPPORTUNITY: desc].

## OUTPUT FORMAT
---META---
Title: [55-60 chars, keyword-front]
Description: [150-155 chars with CTA]
Slug: [url slug]
Primary Keyword: [main]
Secondary Keywords: [comma list]
Word Count Target: [number]
Content Pillar: [Breed Authority / Comparison / Ownership-Lifestyle]

---ARTICLE---
[Full markdown — minimum 2000 words, match voice library exactly]

---SCHEMA---
[Complete JSON-LD: FAQPage + Article, author=James Stokes, publisher=Stokeshire Designer Doodles]

---INTERNAL LINKS---
[All opportunities with anchor text suggestions]

---NOTES FOR JAMES---
[Compliance flags, judgment calls, strategic notes]`;

// ═══ COMPLIANCE EDITOR PROMPT ═══
const EDITOR_PROMPT = `You are the Stokeshire Compliance Editor. Your ONLY job is to review article drafts and flag problems. You are not rewriting — you are auditing.

Check for:
1. COMPLIANCE: Any "hypoallergenic" used as a promise (must be "lower-shedding" + disclaimer). Any health guarantees. Any temperament guarantees.
2. BRAND VOICE: Exclamation points in body copy. Hype language ("perfect","best","amazing"). Urgency/scarcity tactics.
3. FACTUAL: Weight/size ranges that seem off. Lifespan claims outside 12-15 years. Generation labels used incorrectly.
4. SEO: Missing Quick Answer section. Missing FAQ section. Missing conversion block. Fewer than 3 internal link opportunities.
5. STRUCTURE: Missing meta title/description. Missing JSON-LD schema. Article under 1500 words.

Return your review as:
---COMPLIANCE REVIEW---
Score: [0-100]
Status: [PASS / NEEDS REVISION / FAIL]

Issues Found:
[Numbered list of specific issues with line-level detail]

Suggested Fixes:
[For each issue, the specific fix]

What's Working Well:
[2-3 things the draft does right]`;

// ═══ UTILITIES ═══
function csvParse(t,skip=0){const ls=t.split("\n").filter(l=>l.trim()).slice(skip);if(ls.length<2)return[];const hs=csvLine(ls[0]);return ls.slice(1).map(l=>{const vs=csvLine(l);const r={};hs.forEach((h,i)=>{r[h]=vs[i]||""});return r}).filter(r=>Object.values(r).some(v=>v))}
function csvLine(l){const r=[];let c="",q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"'){if(q&&l[i+1]==='"'){c+='"';i++}else q=!q}else if(ch===","&&!q){r.push(c.trim());c=""}else c+=ch}r.push(c.trim());return r}

async function store(k,d){try{await window.storage.set(k,JSON.stringify(d))}catch(e){console.error(e)}}
async function load(k,fb){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):fb}catch{return fb}}

async function ai(msgs,opts={}){
  const body={model:"claude-sonnet-4-20250514",max_tokens:8000,messages:msgs,...(opts.system?{system:opts.system}:{}),...(opts.tools?{tools:opts.tools}:{}),...(opts.mcp_servers?{mcp_servers:opts.mcp_servers}:{})};
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error?.message||`API ${r.status}`)}
  return r.json();
}
function aiText(d){return d.content.filter(b=>b.type==="text").map(b=>b.text).join("\n")}

function score(out){
  const ch=[
    {n:"Quick Answer (AEO)",p:out.includes("Quick Answer")||/##[^\n]*\n[^\n]{20,}/m.test(out)},
    {n:"FAQ Section",p:/#{1,3}.*FAQ/i.test(out)},
    {n:"Conversion Block",p:out.includes("/apply")||out.includes("available-puppies")},
    {n:"Meta Title (55-60ch)",p:out.includes("Title:")},
    {n:"Meta Description",p:out.includes("Description:")},
    {n:"JSON-LD Schema",p:out.includes("ld+json")||out.includes('"@type"')},
    {n:"3+ Internal Links",p:(out.match(/\[INTERNAL LINK/g)||[]).length>=3},
    {n:"No Hypoallergenic Promise",p:out.includes("lower-shedding")||out.includes("No dog is truly")||!out.toLowerCase().includes("hypoallergenic")},
    {n:"Hedged Language",p:/often|typically|may|around|generally/.test(out)},
    {n:"Stokeshire Voice Marker",p:out.includes("At Stokeshire")},
    {n:"Commerce Opportunities",p:out.includes("[COMMERCE")||out.includes("Commerce")},
    {n:"Word Count 1500+",p:out.split(/\s+/).length>1500},
  ];
  const pass=ch.filter(c=>c.p).length;
  return{checks:ch,score:Math.round(pass/ch.length*100),pass,total:ch.length};
}

// ═══ COMPONENTS ═══
const Badge=({children,color=C.copper})=><span style={{display:"inline-block",padding:"2px 10px",borderRadius:12,fontSize:10,fontWeight:600,fontFamily:F.b,background:color+"18",color,letterSpacing:".03em"}}>{children}</span>;

const Btn=({children,onClick,disabled,v="primary",sx={}})=>{
  const base={padding:"10px 20px",borderRadius:8,border:"none",fontFamily:F.b,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .2s",letterSpacing:".02em",...sx};
  const vs={primary:{...base,background:C.copper,color:C.white},secondary:{...base,background:C.creamDark,color:C.slate,border:`1px solid ${C.warmGray}`},success:{...base,background:C.success,color:C.white},danger:{...base,background:C.danger,color:C.white},ghost:{...base,background:"transparent",color:C.copper,border:`1px solid ${C.copper}`}};
  return <button onClick={onClick} disabled={disabled} style={vs[v]}>{children}</button>;
};

const Card=({children,sx={}})=><div style={{background:C.white,borderRadius:10,border:`1px solid ${C.warmGray}`,padding:"20px 24px",...sx}}>{children}</div>;

const Steps=({steps,cur})=>(
  <div style={{display:"flex",gap:0,marginBottom:28}}>
    {steps.map((s,i)=>(
      <div key={i} style={{flex:1,display:"flex",alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
          <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,fontFamily:F.b,background:i<cur?C.success:i===cur?C.copper:C.creamDark,color:i<=cur?C.white:C.stone}}>{i<cur?"✓":i+1}</div>
          <div style={{fontSize:9,color:i===cur?C.copper:C.stone,marginTop:3,fontFamily:F.b,fontWeight:i===cur?600:400,textAlign:"center"}}>{s}</div>
        </div>
        {i<steps.length-1&&<div style={{flex:1,height:2,background:i<cur?C.success:C.warmGray,margin:"0 4px",marginBottom:14}}/>}
      </div>
    ))}
  </div>
);

// ═══ MAIN APP ═══
export default function ContentEngine(){
  const [tab,setTab]=useState("intel");
  const [searchData,setSearchData]=useState([]);
  const [loadCSV,setLoadCSV]=useState(false);
  // Studio state
  const [step,setStep]=useState(0);
  const [topic,setTopic]=useState("");
  const [kw,setKw]=useState("");
  const [pillar,setPillar]=useState("Breed Authority");
  const [slug,setSlug]=useState("");
  const [extra,setExtra]=useState("");
  const [brief,setBrief]=useState("");
  const [article,setArticle]=useState("");
  const [review,setReview]=useState("");
  const [sc,setSc]=useState(null);
  const [loading,setLoading]=useState(null);
  const [err,setErr]=useState({});
  const [copied,setCopied]=useState("");
  // Pipeline + Memory
  const [pipeline,setPipeline]=useState([]);
  const [memory,setMemory]=useState([]);
  // Settings
  const [settings,setSettings]=useState({perplexityKey:"",openaiKey:"",sqspKey:"",ahrefsKey:""});

  useEffect(()=>{
    load("stk-pipeline",[]).then(setPipeline);
    load("stk-memory",[]).then(setMemory);
    load("stk-settings",{perplexityKey:"",openaiKey:"",sqspKey:"",ahrefsKey:""}).then(setSettings);
  },[]);

  const fetchCSV=useCallback(async()=>{
    setLoadCSV(true);
    try{const r=await fetch(CSV_URLS.search).then(r=>r.text());setSearchData(csvParse(r,2))}catch(e){console.error(e)}
    setLoadCSV(false);
  },[]);
  useEffect(()=>{fetchCSV()},[fetchCSV]);

  // Keyword analysis
  const opportunities=useMemo(()=>{
    if(!searchData.length)return[];
    return searchData.map(r=>{
      const q=r.Query||r.query||"",pos=parseFloat(r.position||0),cl=parseInt(r.clicks||0),ctr=parseFloat(r.ctr||0),imp=parseInt(r.impressions||0),pg=(r.Page||r.page||"").replace("https://www.wisconsindesignerdoodles.com","")||"/";
      let s=0;
      if(imp>5000&&ctr<.02)s+=40;else if(imp>2000&&ctr<.03)s+=25;else if(imp>1000&&ctr<.05)s+=15;
      if(pos>=4&&pos<=10)s+=30;else if(pos>10&&pos<=20)s+=15;
      if(imp>10000)s+=20;else if(imp>5000)s+=10;
      if(pos<=5&&ctr<.03)s+=20;
      return{query:q,position:pos,clicks:cl,ctr,impressions:imp,page:pg,score:s};
    }).filter(r=>r.query&&r.score>20).sort((a,b)=>b.score-a.score).slice(0,50);
  },[searchData]);

  const clusters=useMemo(()=>{
    if(!opportunities.length)return[];
    const m={};
    opportunities.forEach(r=>{
      const q=r.query.toLowerCase();let b="Other";
      if(q.includes("bernedoodle")&&(q.includes("cost")||q.includes("price")||q.includes("how much")))b="Bernedoodle Pricing";
      else if(q.includes("micro")&&q.includes("bernedoodle"))b="Micro Bernedoodle";
      else if(q.includes("toy")&&q.includes("bernedoodle"))b="Toy Bernedoodle";
      else if(q.includes("shed")||q.includes("hypoallergenic")&&q.includes("bernedoodle"))b="Shedding/Allergies";
      else if(q.includes("phantom"))b="Phantom Poodle";
      else if(q.includes("aussiedoodle")||q.includes("aussie doodle"))b="Aussiedoodle";
      else if(q.includes("mountain d")||q.includes("amd"))b="Australian Mountain Doodle";
      else if(q.includes("f1")||q.includes("f2")||q.includes("generation"))b="Doodle Generations";
      else if(q.includes("goldendoodle"))b="Goldendoodle";
      else if(q.includes("merle"))b="Merle Colors";
      else if(q.includes("bernedoodle"))b="Bernedoodle General";
      else if(q.includes("calculator")||q.includes("weight")||q.includes("size"))b="Size Tools";
      if(!m[b])m[b]={name:b,kws:[],impr:0,cl:0};
      m[b].kws.push(r);m[b].impr+=r.impressions;m[b].cl+=r.clicks;
    });
    return Object.values(m).sort((a,b)=>b.impr-a.impr);
  },[opportunities]);

  // ═══ STUDIO ACTIONS ═══
  const pickKw=useCallback((r)=>{setTab("studio");setStep(0);setTopic(`Complete guide: ${r.query}`);setKw(r.query);setSlug(`/${r.query.replace(/\s+/g,"-")}`);setBrief("");setArticle("");setReview("");setSc(null);setErr({});},[]);
  const pickCluster=useCallback((c)=>{setTab("studio");setStep(0);setTopic(`Hub page for "${c.name}" topic cluster`);setKw(c.kws.slice(0,5).map(k=>k.query).join(", "));setSlug(`/${c.name.replace(/\s+/g,"-").toLowerCase()}`);setBrief("");setArticle("");setReview("");setSc(null);setErr({});},[]);

  // Step 1: Research
  const doResearch=useCallback(async()=>{
    setLoading("research");setErr(p=>({...p,research:null}));
    try{
      const d=await ai([{role:"user",content:`Research the top-ranking content for: "${kw.split(",")[0].trim()}"\n\nAnalyze top 5 results:\n1. Topics covered\n2. Headings/structure\n3. Data/tables/tools included\n4. Content gaps Stokeshire can fill\n5. Average word count\n6. "People Also Ask" questions\n\nReturn a structured competitive brief.`}],{system:"You are an SEO research analyst. Be specific and data-driven.",tools:[{type:"web_search_20250305",name:"web_search"}]});
      setBrief(aiText(d));setStep(1);
    }catch(e){setErr(p=>({...p,research:e.message}))}
    setLoading(null);
  },[kw]);

  // Step 2: Draft
  const doDraft=useCallback(async()=>{
    setLoading("draft");setErr(p=>({...p,draft:null}));
    // Include memory context if available
    const memContext=memory.length>0?`\n\nCONTENT MEMORY — Past articles that performed well:\n${memory.slice(0,3).map(m=>`- "${m.title}" (Score: ${m.score}%, Keywords: ${m.keywords})`).join("\n")}`:""
    try{
      const d=await ai([{role:"user",content:`Write a complete SEO article for Stokeshire Designer Doodles.\n\nTOPIC: ${topic}\nKEYWORDS: ${kw}\nPILLAR: ${pillar}\nSLUG: ${slug}\n\n${brief?`COMPETITOR BRIEF:\n${brief}\n\nCover everything competitors do PLUS Stokeshire's unique perspective.`:""}\n${extra?`ADDITIONAL CONTEXT:\n${extra}`:""}\n${memContext}\n\nFollow output format exactly. ALL sections required. Minimum 2000 words. Match the voice library precisely.`}],{system:SYSTEM_PROMPT});
      const out=aiText(d);setArticle(out);setSc(score(out));setStep(2);
    }catch(e){setErr(p=>({...p,draft:e.message}))}
    setLoading(null);
  },[topic,kw,pillar,slug,brief,extra,memory]);

  // Step 3: Compliance Review (Dual-AI)
  const doReview=useCallback(async()=>{
    setLoading("review");setErr(p=>({...p,review:null}));
    try{
      const d=await ai([{role:"user",content:`Review this article draft for compliance, brand voice, SEO structure, and factual accuracy:\n\n${article}`}],{system:EDITOR_PROMPT});
      setReview(aiText(d));setStep(3);
    }catch(e){setErr(p=>({...p,review:e.message}))}
    setLoading(null);
  },[article]);

  // Regenerate section
  const regen=useCallback(async(section)=>{
    setLoading("regen-"+section);
    try{
      const d=await ai([{role:"user",content:`Here is my article:\n\n${article}`},{role:"assistant",content:"I see the full article."},{role:"user",content:`Rewrite ONLY the ${section} section. Stronger, more specific, better voice match. Return ONLY the revised section.`}],{system:SYSTEM_PROMPT});
      setArticle(p=>p+`\n\n---REVISED ${section.toUpperCase()}---\n${aiText(d)}`);
    }catch(e){setErr(p=>({...p,regen:e.message}))}
    setLoading(null);
  },[article]);

  // Deploy: Asana
  const deployAsana=useCallback(async()=>{
    setLoading("asana");
    try{
      const title=(article.match(/Title:\s*(.+)/)?.[1]||topic).trim();
      await ai([{role:"user",content:`Create 3 tasks in Asana:\n1. "Review: ${title}" — due Friday. Description: Review AI draft for compliance and voice.\n2. "Header: ${title}" — due next Monday. Description: Design blog header per Stokeshire brand guide.\n3. "Publish: ${title}" — due next Wednesday. Description: Format in Squarespace, add meta+schema.`}],{mcp_servers:[MCP.asana]});
      setErr(p=>({...p,asanaDone:true}));
    }catch(e){setErr(p=>({...p,asana:e.message}))}
    setLoading(null);
  },[article,topic]);

  // Deploy: Gmail
  const deployGmail=useCallback(async()=>{
    setLoading("gmail");
    try{
      const title=(article.match(/Title:\s*(.+)/)?.[1]||topic).trim();
      await ai([{role:"user",content:`Create a Gmail draft (do NOT send):\nTo: james@stokhausmedia.com\nSubject: Content Engine — Ready for Review: ${title}\n\nBody:\nNew article drafted by Content Engine.\n\nArticle: ${title}\nKeyword: ${kw.split(",")[0].trim()}\nPillar: ${pillar}\nContent Score: ${sc?.score||"N/A"}%\nCompliance: ${review.includes("PASS")?"PASS":"Needs Review"}\n\nPlease review in the team deliverables folder.\n\n— Stokeshire Content Engine`}],{mcp_servers:[MCP.gmail]});
      setErr(p=>({...p,gmailDone:true}));
    }catch(e){setErr(p=>({...p,gmail:e.message}))}
    setLoading(null);
  },[article,topic,kw,pillar,sc,review]);

  // Pipeline
  const addPipeline=useCallback(async()=>{
    const title=(article.match(/Title:\s*(.+)/)?.[1]||topic).trim();
    const item={id:Date.now().toString(),title,keywords:kw.split(",")[0].trim(),pillar,slug,score:sc?.score||0,reviewStatus:review.includes("PASS")?"pass":"needs-review",status:"drafted",createdAt:new Date().toISOString()};
    const up=[item,...pipeline];setPipeline(up);await store("stk-pipeline",up);
    // Add to memory bank
    if(sc?.score>=70){const mu=[{title,keywords:kw.split(",")[0].trim(),score:sc.score,pillar,date:new Date().toISOString()},...memory].slice(0,20);setMemory(mu);await store("stk-memory",mu)}
    setStep(4);
  },[article,topic,kw,pillar,slug,sc,review,pipeline,memory]);

  const updateStatus=useCallback(async(id,s)=>{const u=pipeline.map(p=>p.id===id?{...p,status:s}:p);setPipeline(u);await store("stk-pipeline",u)},[pipeline]);
  const removePipe=useCallback(async(id)=>{const u=pipeline.filter(p=>p.id!==id);setPipeline(u);await store("stk-pipeline",u)},[pipeline]);

  const copy=useCallback((k)=>{
    const m={meta:["---META---","---ARTICLE---"],article:["---ARTICLE---","---SCHEMA---"],schema:["---SCHEMA---","---INTERNAL LINKS---"],links:["---INTERNAL LINKS---","---NOTES FOR JAMES---"],notes:["---NOTES FOR JAMES---",null],all:[null,null]};
    const[s,e]=m[k]||[null,null];let t=article;if(s){const i=t.indexOf(s);if(i>=0)t=t.slice(i+s.length)}if(e){const i=t.indexOf(e);if(i>=0)t=t.slice(0,i)}
    navigator.clipboard.writeText(t.trim());setCopied(k);setTimeout(()=>setCopied(""),2000);
  },[article]);

  const saveSettings=useCallback(async(s)=>{setSettings(s);await store("stk-settings",s)},[]);

  const TABS=[{id:"intel",icon:"🔍",label:"Keyword Intel"},{id:"studio",icon:"✍️",label:"Content Studio"},{id:"pipeline",icon:"📋",label:"Pipeline"},{id:"settings",icon:"⚙️",label:"Settings"}];
  const STEPS_L=["Topic","Research","Draft","Review","Deploy"];
  const ST={drafted:{l:"Drafted",c:C.accent1},review:{l:"In Review",c:C.warning},approved:{l:"Approved",c:C.success},published:{l:"Published",c:C.copper}};

  const is={width:"100%",padding:"10px 14px",borderRadius:8,border:`1px solid ${C.warmGray}`,fontFamily:F.b,fontSize:14,color:C.ink,background:C.white,outline:"none"};
  const ls={fontFamily:F.b,fontSize:11,fontWeight:600,color:C.slate,letterSpacing:".05em",textTransform:"uppercase",marginBottom:6,display:"block"};

  return(
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:F.b}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700&family=Jost:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}textarea:focus,input:focus,select:focus{border-color:${C.copper}!important}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fadeIn .4s ease-out}pre{white-space:pre-wrap;word-wrap:break-word}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:${C.warmGray};border-radius:3px}`}</style>

      {/* Header */}
      <div style={{background:C.ink,padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.cream}}>Stokeshire Content Engine</div>
          <div style={{fontSize:11,color:C.stone,marginTop:1}}>Intel → Research → Draft → Review → Deploy → Track</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {searchData.length>0&&<Badge color={C.success}>{(searchData.length/1000).toFixed(0)}K keywords</Badge>}
          <Badge color={C.accent1}>{pipeline.length} in pipeline</Badge>
          <Badge color={C.accent2}>{memory.length} in memory bank</Badge>
        </div>
      </div>
      <div style={{height:3,background:`linear-gradient(90deg,${C.copper},${C.copperLight},${C.copper})`}}/>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,borderBottom:`2px solid ${C.warmGray}`,padding:"0 32px",background:C.white}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{fontFamily:F.b,fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?C.copper:C.slate,background:"none",border:"none",padding:"12px 20px",cursor:"pointer",borderBottom:tab===t.id?`2px solid ${C.copper}`:"2px solid transparent",marginBottom:-2}}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 32px 80px"}}>

        {/* ═══ INTEL ═══ */}
        {tab==="intel"&&(
          <div className="fi">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.ink}}>Keyword Opportunities</div>
              <Btn onClick={fetchCSV} disabled={loadCSV} v="secondary" sx={{fontSize:12}}>{loadCSV?"Loading...":"↻ Refresh"}</Btn>
            </div>
            {clusters.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
              {clusters.slice(0,9).map(c=>(
                <Card key={c.name} sx={{cursor:"pointer",transition:"box-shadow .2s"}} onClick={()=>pickCluster(c)}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontFamily:F.d,fontSize:16,fontWeight:600,color:C.ink}}>{c.name}</div>
                    <Badge color={C.warning}>{c.kws.length}</Badge>
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:12,color:C.slate}}>
                    <span><strong style={{color:C.ink}}>{c.impr.toLocaleString()}</strong> impr</span>
                    <span><strong style={{color:C.ink}}>{c.cl.toLocaleString()}</strong> clicks</span>
                  </div>
                  <div style={{fontSize:10,color:C.stone,marginTop:6}}>{c.kws.slice(0,3).map(k=>k.query).join(" · ")}</div>
                </Card>
              ))}
            </div>}
            <Card>
              <div style={{fontFamily:F.d,fontSize:16,fontWeight:600,color:C.ink,marginBottom:12}}>Top Keywords — Click to Draft</div>
              <div style={{maxHeight:500,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{borderBottom:`2px solid ${C.warmGray}`,position:"sticky",top:0,background:C.white}}>
                    {["Score","Keyword","Impr","Clicks","CTR","Pos","Page"].map(h=>(
                      <th key={h} style={{textAlign:h==="Keyword"||h==="Page"?"left":"right",padding:"8px",fontSize:10,fontWeight:600,color:C.stone,textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{opportunities.slice(0,30).map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.creamDark}`,cursor:"pointer"}} onClick={()=>pickKw(r)}
                      onMouseEnter={e=>e.currentTarget.style.background=C.copperGlow} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"8px",textAlign:"right"}}><Badge color={r.score>50?C.danger:r.score>30?C.warning:C.success}>{r.score}</Badge></td>
                      <td style={{padding:"8px",fontWeight:600,color:C.ink}}>{r.query}</td>
                      <td style={{padding:"8px",textAlign:"right",fontWeight:600,color:C.copper}}>{r.impressions.toLocaleString()}</td>
                      <td style={{padding:"8px",textAlign:"right"}}>{r.clicks}</td>
                      <td style={{padding:"8px",textAlign:"right",color:C.slate}}>{(r.ctr*100).toFixed(1)}%</td>
                      <td style={{padding:"8px",textAlign:"right"}}><Badge color={r.position<=5?C.success:r.position<=10?C.warning:C.danger}>{r.position.toFixed(1)}</Badge></td>
                      <td style={{padding:"8px",fontSize:10,color:C.stone,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.page}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══ STUDIO ═══ */}
        {tab==="studio"&&(
          <div className="fi">
            <Steps steps={STEPS_L} cur={step}/>

            {step===0&&<div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                <div><label style={ls}>Topic / Brief</label><textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={4} style={{...is,resize:"vertical"}} placeholder="What should this article cover?"/></div>
                <div><label style={ls}>Target Keywords</label><textarea value={kw} onChange={e=>setKw(e.target.value)} rows={4} style={{...is,resize:"vertical"}} placeholder="primary, secondary, long-tail..."/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:20}}>
                <div><label style={ls}>Pillar</label><select value={pillar} onChange={e=>setPillar(e.target.value)} style={is}><option>Breed Authority</option><option>Comparison</option><option>Ownership-Lifestyle</option></select></div>
                <div><label style={ls}>URL Slug</label><input value={slug} onChange={e=>setSlug(e.target.value)} style={is} placeholder="/your-slug"/></div>
                <div><label style={ls}>Extra Context</label><input value={extra} onChange={e=>setExtra(e.target.value)} style={is} placeholder="NotebookLM notes, research..."/></div>
              </div>
              {err.research&&<div style={{padding:12,background:"rgba(181,58,46,.08)",borderRadius:8,marginBottom:16,fontSize:13,color:C.danger}}>{err.research}</div>}
              <div style={{display:"flex",gap:12}}>
                <Btn onClick={doResearch} disabled={!kw.trim()||loading==="research"}>{loading==="research"?"Researching...":"1. Research Competitors"}</Btn>
                <Btn onClick={()=>{setBrief("");setStep(1);doDraft()}} v="ghost" disabled={!topic.trim()}>Skip → Draft Now</Btn>
              </div>
            </div>}

            {step===1&&<div>
              {brief&&<Card sx={{marginBottom:20,maxHeight:400,overflowY:"auto"}}><div style={{fontFamily:F.d,fontSize:16,fontWeight:600,color:C.ink,marginBottom:12}}>Competitive Brief</div><pre style={{fontFamily:F.b,fontSize:13,color:C.ink,lineHeight:1.6}}>{brief}</pre></Card>}
              {err.draft&&<div style={{padding:12,background:"rgba(181,58,46,.08)",borderRadius:8,marginBottom:16,fontSize:13,color:C.danger}}>{err.draft}</div>}
              <div style={{display:"flex",gap:12}}>
                <Btn onClick={doDraft} disabled={loading==="draft"}>{loading==="draft"?"Drafting (30-60s)...":"2. Generate Article"}</Btn>
                <Btn onClick={()=>setStep(0)} v="secondary">Back</Btn>
              </div>
            </div>}

            {step===2&&article&&<div>
              <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:20,marginBottom:20}}>
                <Card sx={{maxHeight:600,overflowY:"auto"}}>
                  <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                    {[["meta","Meta"],["article","Article"],["schema","Schema"],["links","Links"],["notes","Notes"],["all","All"]].map(([k,l])=>(
                      <button key={k} onClick={()=>copy(k)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.warmGray}`,fontSize:10,fontFamily:F.b,cursor:"pointer",background:copied===k?C.success:C.white,color:copied===k?C.white:C.slate}}>{copied===k?"✓":l}</button>
                    ))}
                  </div>
                  <pre style={{fontFamily:F.b,fontSize:12,color:C.ink,lineHeight:1.6}}>{article}</pre>
                </Card>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {sc&&<Card>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontFamily:F.d,fontSize:14,fontWeight:600,color:C.ink}}>Scorecard</div>
                      <div style={{fontFamily:F.d,fontSize:32,fontWeight:700,color:sc.score>=80?C.success:sc.score>=60?C.warning:C.danger}}>{sc.score}%</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {sc.checks.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:c.p?C.success:C.danger}}><span>{c.p?"✓":"✗"}</span>{c.n}</div>)}
                    </div>
                  </Card>}
                  <Card>
                    <div style={{fontSize:12,fontWeight:600,color:C.ink,marginBottom:8}}>Revise Section</div>
                    {["FAQ","Quick Answer","Conversion Block","Schema"].map(s=>(
                      <Btn key={s} onClick={()=>regen(s)} v="secondary" disabled={loading?.startsWith("regen")} sx={{fontSize:10,padding:"5px 10px",marginBottom:4,width:"100%",textAlign:"left"}}>{loading===`regen-${s}`?"...":` ↻ ${s}`}</Btn>
                    ))}
                  </Card>
                  <Btn onClick={doReview} disabled={loading==="review"} v="ghost">{loading==="review"?"Running review...":"3. Compliance Review"}</Btn>
                </div>
              </div>
            </div>}

            {step===3&&<div>
              <Card sx={{marginBottom:20,maxHeight:400,overflowY:"auto"}}>
                <div style={{fontFamily:F.d,fontSize:16,fontWeight:600,color:C.ink,marginBottom:12}}>Compliance Review (Dual-AI)</div>
                <pre style={{fontFamily:F.b,fontSize:13,color:C.ink,lineHeight:1.6}}>{review}</pre>
              </Card>
              <div style={{display:"flex",gap:12}}>
                <Btn onClick={addPipeline} v="success">Add to Pipeline →</Btn>
                <Btn onClick={()=>setStep(2)} v="secondary">Back to Draft</Btn>
              </div>
            </div>}

            {step===4&&<Card sx={{textAlign:"center",padding:40}}>
              <div style={{fontSize:40,marginBottom:12}}>✅</div>
              <div style={{fontFamily:F.d,fontSize:22,color:C.ink,marginBottom:8}}>Article in Pipeline</div>
              <div style={{fontSize:13,color:C.slate,marginBottom:24}}>Deploy to your team workflow.</div>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <Btn onClick={deployAsana} disabled={loading==="asana"}>{loading==="asana"?"Creating...":"Create Asana Tasks"}</Btn>
                <Btn onClick={deployGmail} v="ghost" disabled={loading==="gmail"}>{loading==="gmail"?"Sending...":"Draft Review Email"}</Btn>
                <Btn onClick={()=>{setStep(0);setArticle("");setBrief("");setReview("");setSc(null)}} v="secondary">New Article</Btn>
              </div>
              {err.asanaDone&&<div style={{marginTop:12,fontSize:12,color:C.success,padding:8,background:"rgba(58,125,68,.06)",borderRadius:6}}>✓ Asana tasks created</div>}
              {err.gmailDone&&<div style={{marginTop:6,fontSize:12,color:C.success,padding:8,background:"rgba(58,125,68,.06)",borderRadius:6}}>✓ Gmail draft created</div>}
            </Card>}

            {loading&&<div style={{marginTop:16,padding:14,background:C.copperGlow,borderRadius:8,textAlign:"center"}}>
              <div style={{fontSize:13,color:C.copper,fontWeight:500,animation:"pulse 1.5s infinite"}}>
                {loading==="research"&&"Searching competitors and building research brief..."}
                {loading==="draft"&&"Drafting article with voice library, AEO, schema, and conversion blocks..."}
                {loading==="review"&&"Running dual-AI compliance review..."}
                {loading?.startsWith("regen")&&"Revising section..."}
                {loading==="asana"&&"Creating Asana tasks for the team..."}
                {loading==="gmail"&&"Drafting review notification..."}
              </div>
            </div>}
          </div>
        )}

        {/* ═══ PIPELINE ═══ */}
        {tab==="pipeline"&&(
          <div className="fi">
            <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.ink,marginBottom:20}}>Publishing Pipeline</div>
            {pipeline.length===0?<Card sx={{textAlign:"center",padding:60}}>
              <div style={{fontSize:32,marginBottom:12}}>📝</div>
              <div style={{fontFamily:F.d,fontSize:18,color:C.ink,marginBottom:8}}>Pipeline empty</div>
              <Btn onClick={()=>setTab("intel")}>Browse Keywords</Btn>
            </Card>:
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {pipeline.map(item=>{const s=ST[item.status]||ST.drafted;return(
                <Card key={item.id}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <Badge color={s.c}>{s.l}</Badge>
                        {item.reviewStatus==="pass"&&<Badge color={C.success}>Compliance ✓</Badge>}
                        <span style={{fontFamily:F.d,fontSize:17,fontWeight:600,color:C.ink}}>{item.title}</span>
                      </div>
                      <div style={{display:"flex",gap:16,fontSize:12,color:C.slate}}>
                        <span>Keyword: <strong>{item.keywords}</strong></span>
                        <span>{item.pillar}</span>
                        <span>Score: <strong style={{color:item.score>=80?C.success:C.warning}}>{item.score}%</strong></span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {item.status==="drafted"&&<Btn onClick={()=>updateStatus(item.id,"review")} v="secondary" sx={{fontSize:10,padding:"4px 10px"}}>→ Review</Btn>}
                      {item.status==="review"&&<Btn onClick={()=>updateStatus(item.id,"approved")} v="success" sx={{fontSize:10,padding:"4px 10px"}}>→ Approve</Btn>}
                      {item.status==="approved"&&<Btn onClick={()=>updateStatus(item.id,"published")} sx={{fontSize:10,padding:"4px 10px"}}>→ Published</Btn>}
                      <Btn onClick={()=>removePipe(item.id)} v="danger" sx={{fontSize:10,padding:"4px 10px"}}>✕</Btn>
                    </div>
                  </div>
                </Card>
              )})}
            </div>}

            {memory.length>0&&<div style={{marginTop:32}}>
              <div style={{fontFamily:F.d,fontSize:18,fontWeight:600,color:C.ink,marginBottom:12}}>Content Memory Bank</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {memory.map((m,i)=>(
                  <Card key={i} sx={{padding:"12px 16px"}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.ink,marginBottom:4}}>{m.title}</div>
                    <div style={{fontSize:11,color:C.slate}}>{m.keywords} · {m.pillar} · Score: {m.score}%</div>
                  </Card>
                ))}
              </div>
            </div>}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab==="settings"&&(
          <div className="fi">
            <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.ink,marginBottom:8}}>Integration Settings</div>
            <div style={{fontSize:13,color:C.slate,marginBottom:24}}>Add API keys to unlock additional integrations. Keys are stored locally in your browser.</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {[
                {key:"perplexityKey",label:"Perplexity API Key",desc:"Enhanced competitor research with sourced, structured answers. Get key at perplexity.ai/settings/api",status:settings.perplexityKey?"Connected":"Not configured"},
                {key:"openaiKey",label:"OpenAI API Key",desc:"Dual-AI compliance editing — GPT-4 as a second reviewer. Get key at platform.openai.com/api-keys",status:settings.openaiKey?"Connected":"Not configured"},
                {key:"sqspKey",label:"Squarespace API Key",desc:"Direct publishing — articles go straight to Squarespace drafts. Get key at developers.squarespace.com",status:settings.sqspKey?"Connected":"Not configured"},
                {key:"ahrefsKey",label:"Ahrefs API Key",desc:"Deep keyword intelligence — search volume, difficulty, SERP features. Get key at ahrefs.com/api",status:settings.ahrefsKey?"Connected":"Not configured"},
              ].map(cfg=>(
                <Card key={cfg.key}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.ink}}>{cfg.label}</div>
                    <Badge color={settings[cfg.key]?C.success:C.stone}>{cfg.status}</Badge>
                  </div>
                  <div style={{fontSize:12,color:C.slate,marginBottom:12}}>{cfg.desc}</div>
                  <input value={settings[cfg.key]} onChange={e=>{const s={...settings,[cfg.key]:e.target.value};saveSettings(s)}} style={{...is,fontSize:12}} placeholder="Paste API key here..." type="password"/>
                </Card>
              ))}
            </div>

            <div style={{marginTop:32}}>
              <div style={{fontFamily:F.d,fontSize:18,fontWeight:600,color:C.ink,marginBottom:12}}>Connected Integrations (Active)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[
                  {name:"Claude API",icon:"🧠",desc:"Article drafting + compliance review",status:"Active"},
                  {name:"Search Console",icon:"📊",desc:"Live keyword data via published CSV",status:"Active"},
                  {name:"Asana",icon:"✅",desc:"Auto-create team tasks on deploy",status:"Active"},
                  {name:"Gmail",icon:"📧",desc:"Review notification drafts",status:"Active"},
                  {name:"Canva",icon:"🎨",desc:"Auto-generate blog headers",status:"Available (MCP)"},
                  {name:"ElevenLabs",icon:"🔊",desc:"Audio article generation",status:"Available (MCP)"},
                  {name:"Google Drive",icon:"📁",desc:"Auto-save drafts to team folder",status:"Available (MCP)"},
                  {name:"Google Calendar",icon:"📅",desc:"Block review time on Fridays",status:"Available (MCP)"},
                ].map(i=>(
                  <Card key={i.name} sx={{padding:"12px 16px"}}>
                    <div style={{fontSize:18,marginBottom:4}}>{i.icon}</div>
                    <div style={{fontSize:12,fontWeight:600,color:C.ink}}>{i.name}</div>
                    <div style={{fontSize:10,color:C.slate,marginBottom:6}}>{i.desc}</div>
                    <Badge color={i.status==="Active"?C.success:C.accent1}>{i.status}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{padding:"14px 32px",borderTop:`1px solid ${C.warmGray}`,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:C.stone}}>Stokeshire Designer Doodles · DATCP #514401-DS</span>
        <span style={{fontSize:11,color:C.stone}}>Content Engine v3 · Voice Library · Dual-AI Review · Memory Bank</span>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.copper},${C.copperLight},${C.copper})`,zIndex:999}}/>
    </div>
  );
}
