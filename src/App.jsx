import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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

// ═══ SYSTEM PROMPT (condensed for API token efficiency) ═══
const SYSTEM_PROMPT = `You are the Stokeshire Content Engine for wisconsindesignerdoodles.com — a therapy-grade luxury doodle breeding program in Medford, WI. DATCP #514401-DS. Owner: James Stokes.

VOICE: Professional restraint, veterinary literacy, calm authority. Education-first — teach, don't sell. Authority through specificity (exact weight ranges, gene names, generation labels). Hedge health claims: "may","typically","often". Include "At Stokeshire Designer Doodles, we..." naturally. Use "lower-shedding" + "no dog is truly hypoallergenic" — never promise hypoallergenic. Lifespan: 12-15 years. No exclamation points in body copy. No hype, urgency, or scarcity. No "perfect" or "guaranteed." Correct industry misinformation without naming competitors. Explain technical terms inline.

BREEDS: AMD, GMD, Bernedoodles (standard/mini/munchkin/micro), Aussiedoodles (toy/mini), Goldendoodles (incl. F2 flat coat). Unfurnished = RSPO2 negative, not hypoallergenic.

STRUCTURE:
1. QUICK ANSWER (AEO) — 2-3 sentence direct answer for AI search extraction
2. TABLE OF CONTENTS
3. BODY — H2 sections, 3-4 sentence paragraphs, "Stokeshire Perspective" callouts, [INTERNAL LINK: /path] markers
4. FAQ — 4-6 Qs, 600-1200 char answers, hedged
5. CONVERSION BLOCK — CTAs to /apply and /available-puppies
Mark commerce opportunities: [COMMERCE OPPORTUNITY: desc]

OUTPUT FORMAT:
---META---
Title: [55-60 chars] | Description: [150-155 chars] | Slug | Primary Keyword | Secondary Keywords | Word Count Target | Content Pillar
---ARTICLE---
[Full markdown, minimum 2000 words]
---SCHEMA---
[JSON-LD: FAQPage + Article, author=James Stokes, publisher=Stokeshire Designer Doodles]
---INTERNAL LINKS---
[Opportunities with anchor text]
---NOTES FOR JAMES---
[Compliance flags, strategic notes]`;

const EDITOR_PROMPT = `You are the Stokeshire Compliance Editor. Audit only — do not rewrite.

Check: (1) "Hypoallergenic" used as promise? Must be "lower-shedding" + disclaimer. (2) Health/temperament guarantees? (3) Exclamation points, hype, urgency? (4) Weight/size ranges accurate? Lifespan 12-15yr? (5) Quick Answer present? FAQ present? Conversion block? 3+ internal links? (6) Meta title/description? JSON-LD schema? Word count 1500+?

Return:
---COMPLIANCE REVIEW---
Score: [0-100] | Status: [PASS/NEEDS REVISION/FAIL]
Issues Found: [numbered list]
Suggested Fixes: [per issue]
What's Working: [2-3 positives]`;

const SOCIAL_PROMPT = `You generate Instagram carousel JSON for Stokeshire Designer Doodles, a luxury dog breeding program. Voice: calm, premium, confident. No exclamation points, no hype, no em dashes. Short, powerful statements.

Return ONLY valid JSON (no markdown fences, no preamble):
{ "caption": "Instagram caption (2-3 short paragraphs, no hashtags)", "slides": [...] }

Each slide: { "template": "...", "props": {...} }

Templates and their props:
- editorial-dark: { tagline, headline, accentWord, subtitle }
- statement-cream: { quote, attribution, divider: true }
- carousel-text: { slideNumber, totalSlides, headline, body }
- stat-card: { number, label, context }
- cta-card: { headline, subtitle, ctaText: "Link in Bio", url: "wisconsindesignerdoodles.com" }

Rules:
- Slide 1: always editorial-dark (cover)
- Last slide: always cta-card
- 5-7 slides total
- Headlines under 8 words, body under 40 words per slide
- accentWord: 1-3 words with emotional weight
- slideNumber/totalSlides must be accurate across all carousel-text slides`;

// ═══ SOCIAL STUDIO CARD DEFAULTS ═══
const SOC_DEFAULTS={
  "editorial-dark":{tagline:"Our Families",headline:"You weren't looking for a puppy",accentWord:"for a",subtitle:"You were looking for something else. A presence in your home that would deepen what you already have - connection, rhythm, presence.",backgroundImage:""},
  "statement-cream":{quote:"We did not know a dog could change the way our family moves through the day. But she did. From the first morning.",attribution:"The Whitfield Family - Chicago, IL",divider:true},
  "split-editorial":{tagline:"Breed Spotlight",headline:"The Australian Mountain Doodle",body:"Three breeds. One intention. The calm of the Bernese, the intelligence of the Poodle, the resilience of the Australian Shepherd - brought together with purpose, not chance.",imageUrl:"",imagePosition:"left"},
  "stat-card":{number:"10",label:"Years of Intentional Breeding",context:"Every pairing, every litter, every family - shaped by a decade of learning what a companion dog should be."},
  "carousel-text":{slideNumber:1,totalSlides:5,headline:"What is Doodle School?",body:"Four weeks of foundational training before your puppy comes home. Leash manners, house training, crate training, socialization.",footer:"Stokeshire Designer Doodles"},
  "cta-card":{headline:"Read the Full Story",subtitle:"Every detail of how we raise, train, and place our dogs.",ctaText:"Link in Bio",url:"wisconsindesignerdoodles.com"},
};
const SOC_FIELDS={
  "editorial-dark":[{key:"tagline",label:"Tagline",type:"text"},{key:"headline",label:"Headline",type:"text",required:true},{key:"accentWord",label:"Accent Word(s)",type:"text"},{key:"subtitle",label:"Subtitle",type:"textarea",rows:3},{key:"backgroundImage",label:"Background Image URL",type:"url"}],
  "statement-cream":[{key:"quote",label:"Quote",type:"textarea",required:true,rows:4},{key:"attribution",label:"Attribution",type:"text"},{key:"divider",label:"Copper Dividers",type:"boolean"}],
  "split-editorial":[{key:"tagline",label:"Tagline",type:"text"},{key:"headline",label:"Headline",type:"text",required:true},{key:"body",label:"Body",type:"textarea",rows:4,required:true},{key:"imageUrl",label:"Image URL",type:"url"},{key:"imagePosition",label:"Image Side",type:"select",options:["left","right"]}],
  "stat-card":[{key:"number",label:"Number",type:"text",required:true},{key:"label",label:"Label",type:"text",required:true},{key:"context",label:"Context",type:"textarea",rows:3}],
  "carousel-text":[{key:"slideNumber",label:"Slide #",type:"number"},{key:"totalSlides",label:"Total",type:"number"},{key:"headline",label:"Headline",type:"text",required:true},{key:"body",label:"Body",type:"textarea",rows:4,required:true},{key:"footer",label:"Footer",type:"text"}],
  "cta-card":[{key:"headline",label:"Headline",type:"text",required:true},{key:"subtitle",label:"Subtitle",type:"textarea",rows:2},{key:"ctaText",label:"CTA Button",type:"text"},{key:"url",label:"URL",type:"text"}],
};
const SOC_TEMPLATES=[{id:"editorial-dark",name:"Editorial Dark"},{id:"statement-cream",name:"Statement Cream"},{id:"split-editorial",name:"Split Editorial"},{id:"stat-card",name:"Stat Card"},{id:"carousel-text",name:"Carousel Text"},{id:"cta-card",name:"CTA Card"}];

// ═══ SOCIAL STUDIO CARD COMPONENTS ═══
function socAccent(text,word,style){if(!word?.trim())return text;try{const e=word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return text.split(new RegExp(`(${e})`,"i")).map((p,i)=>p.toLowerCase()===word.toLowerCase()?<span key={i} style={style}>{p}</span>:<span key={i}>{p}</span>)}catch{return text}}
const socFoot={position:"absolute",bottom:44,left:0,right:0,textAlign:"center",fontFamily:F.b,fontWeight:300,fontSize:14,letterSpacing:".25em",textTransform:"uppercase",color:C.stone};

function SocEditorialDark({tagline,headline,accentWord,subtitle,backgroundImage}){
  return <div style={{width:1080,height:1350,position:"relative",overflow:"hidden",background:C.charcoal,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
    {backgroundImage&&<div style={{position:"absolute",inset:0,backgroundImage:`url(${backgroundImage})`,backgroundSize:"cover",backgroundPosition:"center",opacity:.15,filter:"grayscale(100%)"}}/>}
    <div style={{position:"relative",zIndex:2,textAlign:"center",padding:"80px 72px"}}>
      {tagline&&<div style={{fontFamily:F.b,fontWeight:300,fontSize:18,letterSpacing:".35em",textTransform:"uppercase",color:C.copper,marginBottom:48}}>{tagline}</div>}
      <h1 style={{fontFamily:F.d,fontSize:78,fontWeight:400,lineHeight:1.15,color:C.cream,textTransform:"uppercase",letterSpacing:".02em",margin:"0 0 48px"}}>{socAccent(headline||"",accentWord,{color:C.copper,fontStyle:"italic"})}</h1>
      {subtitle&&<p style={{fontFamily:F.d,fontStyle:"italic",fontSize:32,fontWeight:300,lineHeight:1.55,color:C.stone,margin:0,maxWidth:700,marginInline:"auto"}}>{subtitle}</p>}
    </div>
    <div style={socFoot}>Stokeshire Designer Doodles</div>
  </div>
}
function SocStatementCream({quote,attribution,divider}){
  return <div style={{width:1080,height:1350,background:C.cream,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative"}}>
    <div style={{textAlign:"center",padding:"80px 88px",maxWidth:900}}>
      {divider&&<div style={{width:60,height:2,background:C.copper,margin:"0 auto 56px"}}/>}
      <blockquote style={{fontFamily:F.d,fontSize:42,fontWeight:400,fontStyle:"italic",lineHeight:1.55,color:C.ink,margin:"0 0 48px"}}>{quote}</blockquote>
      {divider&&<div style={{width:60,height:2,background:C.copper,margin:"0 auto 40px"}}/>}
      {attribution&&<p style={{fontFamily:F.b,fontWeight:300,fontSize:18,letterSpacing:".2em",textTransform:"uppercase",color:C.stone,margin:0}}>{attribution}</p>}
    </div>
    <div style={{...socFoot,color:C.slate}}>Stokeshire Designer Doodles</div>
  </div>
}
function SocSplitEditorial({headline,body,imageUrl,tagline,imagePosition}){
  const pos=imagePosition||"left";
  const txt=<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"64px 52px",background:C.charcoal}}>
    {tagline&&<div style={{fontFamily:F.b,fontWeight:300,fontSize:15,letterSpacing:".3em",textTransform:"uppercase",color:C.copper,marginBottom:28}}>{tagline}</div>}
    <h2 style={{fontFamily:F.d,fontSize:44,fontWeight:400,lineHeight:1.2,color:C.cream,margin:"0 0 24px"}}>{headline}</h2>
    <p style={{fontFamily:F.b,fontWeight:300,fontSize:18,lineHeight:1.65,color:C.stone,margin:0}}>{body}</p>
  </div>;
  const img=<div style={{flex:1,background:C.ink,backgroundImage:imageUrl?`url(${imageUrl})`:"none",backgroundSize:"cover",backgroundPosition:"center"}}>{!imageUrl&&<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.b,fontSize:15,color:C.stone,letterSpacing:".15em",textTransform:"uppercase"}}>Add Image URL</div>}</div>;
  return <div style={{width:1080,height:1350,display:"flex",overflow:"hidden"}}>{pos==="left"?<>{img}{txt}</>:<>{txt}{img}</>}</div>
}
function SocStatCard({number,label,context}){
  return <div style={{width:1080,height:1350,background:C.charcoal,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative"}}>
    <div style={{textAlign:"center",padding:"80px 72px"}}>
      <div style={{fontFamily:F.d,fontSize:180,fontWeight:300,lineHeight:1,color:C.copper,marginBottom:16}}>{number}</div>
      <div style={{fontFamily:F.b,fontWeight:300,fontSize:22,letterSpacing:".3em",textTransform:"uppercase",color:C.cream,marginBottom:40}}>{label}</div>
      <div style={{width:60,height:2,background:C.copper,margin:"0 auto 40px"}}/>
      {context&&<p style={{fontFamily:F.d,fontStyle:"italic",fontSize:28,fontWeight:400,lineHeight:1.55,color:C.stone,margin:0,maxWidth:600}}>{context}</p>}
    </div>
    <div style={socFoot}>Stokeshire Designer Doodles</div>
  </div>
}
function SocCarouselText({slideNumber,totalSlides,headline,body,footer}){
  return <div style={{width:1080,height:1350,background:C.charcoal,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"80px 72px"}}>
    <div style={{fontFamily:F.b,fontWeight:300,fontSize:15,letterSpacing:".25em",color:C.stone}}>{slideNumber} / {totalSlides}</div>
    <div>
      <h2 style={{fontFamily:F.d,fontSize:50,fontWeight:400,lineHeight:1.2,color:C.cream,margin:"0 0 32px"}}>{headline}</h2>
      <div style={{width:48,height:2,background:C.copper,marginBottom:32}}/>
      <p style={{fontFamily:F.b,fontWeight:300,fontSize:21,lineHeight:1.7,color:C.cream+"dd",margin:0}}>{body}</p>
    </div>
    <div style={{fontFamily:F.b,fontWeight:300,fontSize:14,letterSpacing:".25em",textTransform:"uppercase",color:C.stone}}>{footer||"Stokeshire Designer Doodles"}</div>
  </div>
}
function SocCtaCard({headline,subtitle,ctaText,url}){
  return <div style={{width:1080,height:1350,background:C.charcoal,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative"}}>
    <div style={{textAlign:"center",padding:"80px 72px"}}>
      <div style={{width:60,height:2,background:C.copper,margin:"0 auto 48px"}}/>
      <h2 style={{fontFamily:F.d,fontSize:58,fontWeight:400,lineHeight:1.2,color:C.cream,margin:"0 0 28px"}}>{headline}</h2>
      {subtitle&&<p style={{fontFamily:F.b,fontWeight:300,fontSize:22,lineHeight:1.6,color:C.stone,margin:"0 0 48px",maxWidth:650}}>{subtitle}</p>}
      <div style={{width:60,height:2,background:C.copper,margin:"0 auto 48px"}}/>
      {ctaText&&<div style={{display:"inline-block",padding:"18px 56px",border:`1.5px solid ${C.copper}`,borderRadius:2,fontFamily:F.b,fontWeight:400,fontSize:16,letterSpacing:".25em",textTransform:"uppercase",color:C.copper}}>{ctaText}</div>}
      {url&&<p style={{fontFamily:F.b,fontWeight:300,fontSize:15,color:C.stone,marginTop:24,letterSpacing:".05em"}}>{url}</p>}
    </div>
    <div style={socFoot}>Stokeshire Designer Doodles</div>
  </div>
}
const SOC_CARDS={"editorial-dark":SocEditorialDark,"statement-cream":SocStatementCream,"split-editorial":SocSplitEditorial,"stat-card":SocStatCard,"carousel-text":SocCarouselText,"cta-card":SocCtaCard};

// ═══ UTILITIES ═══
function csvParse(t,skip=0){const ls=t.split("\n").filter(l=>l.trim()).slice(skip);if(ls.length<2)return[];const hs=csvLine(ls[0]);return ls.slice(1).map(l=>{const vs=csvLine(l);const r={};hs.forEach((h,i)=>{r[h]=vs[i]||""});return r}).filter(r=>Object.values(r).some(v=>v))}
function csvLine(l){const r=[];let c="",q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"'){if(q&&l[i+1]==='"'){c+='"';i++}else q=!q}else if(ch===","&&!q){r.push(c.trim());c=""}else c+=ch}r.push(c.trim());return r}

function store(k,d){try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}}
function load(k,fb){try{const r=localStorage.getItem(k);return r?JSON.parse(r):fb}catch{return fb}}

async function ai(msgs,opts={},retries=1){
  const body={model:"claude-sonnet-4-20250514",max_tokens:8000,messages:msgs,...(opts.system?{system:opts.system}:{}),...(opts.tools?{tools:opts.tools}:{}),...(opts.mcp_servers?{mcp_servers:opts.mcp_servers}:{})};
  const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){
    const e=await r.json().catch(()=>({}));
    if(r.status===429&&retries>0){
      await new Promise(ok=>setTimeout(ok,35000));
      return ai(msgs,opts,retries-1);
    }
    throw new Error(e.error?.message||`API ${r.status}`);
  }
  return r.json();
}

// OpenAI dual-review (GPT-4o as second compliance reviewer)
async function openaiReview(msgs,system){
  const r=await fetch("/api/openai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system,messages:msgs,model:"gpt-4o"})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error?.message||`OpenAI ${r.status}`)}
  return r.json();
}

// Google Drive helpers
async function driveCreateFolder(name,parentId){
  const r=await fetch("/api/drive-folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,parentId})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Folder creation failed")}
  return r.json();
}
async function driveUpload(fileName,base64Data,folderId,mimeType="image/png"){
  const r=await fetch("/api/drive-upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileName,fileData:base64Data,mimeType,folderId})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Upload failed")}
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
  // Social Studio
  const [socTpl,setSocTpl]=useState("editorial-dark");
  const [socProps,setSocProps]=useState({...SOC_DEFAULTS["editorial-dark"]});
  const [socCarousel,setSocCarousel]=useState(null);
  const [socActive,setSocActive]=useState(0);
  const [socCaption,setSocCaption]=useState("");
  const [socHashtags,setSocHashtags]=useState("#stokeshiredoodles #designerdoodles #bernedoodle #australianmountaindoodle #doodlepuppy #luxurypuppy #responsiblebreeder #familydog");
  const [socUrl,setSocUrl]=useState("");
  const [socLoading,setSocLoading]=useState(false);
  const [socStatus,setSocStatus]=useState("");
  const [socToast,setSocToast]=useState(null);
  const [socScale,setSocScale]=useState(0.32);
  const socRef=useRef(null);

  useEffect(()=>{
    setPipeline(load("stk-pipeline",[]));
    setMemory(load("stk-memory",[]));
    setSettings(load("stk-settings",{perplexityKey:"",openaiKey:"",sqspKey:"",ahrefsKey:""}));
    // Restore last draft if exists
    const draft=load("stk-draft",null);
    if(draft&&draft.article&&(Date.now()-draft.ts)<86400000){
      setTopic(draft.topic||"");setKw(draft.kw||"");setPillar(draft.pillar||"Breed Authority");
      setSlug(draft.slug||"");setBrief(draft.brief||"");setArticle(draft.article||"");
      setReview(draft.review||"");if(draft.score)setSc(draft.score);
      setStep(draft.review?3:2);setTab("studio");
    }
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
      store("stk-draft",{topic,kw,pillar,slug,brief,article:out,review:"",score:score(out),ts:Date.now()});
    }catch(e){setErr(p=>({...p,draft:e.message}))}
    setLoading(null);
  },[topic,kw,pillar,slug,brief,extra,memory]);

  // Step 3: Compliance Review (Dual-AI — Claude + GPT-4o)
  const doReview=useCallback(async()=>{
    setLoading("review");setErr(p=>({...p,review:null}));
    try{
      // Claude review
      const claudeD=await ai([{role:"user",content:`Review this article draft for compliance, brand voice, SEO structure, and factual accuracy:\n\n${article}`}],{system:EDITOR_PROMPT});
      const claudeReview=aiText(claudeD);

      // GPT-4o review (independent second opinion)
      let gptReview="";
      try{
        const gptD=await openaiReview([{role:"user",content:`Review this article draft for compliance, brand voice, SEO structure, and factual accuracy:\n\n${article}`}],EDITOR_PROMPT);
        gptReview=aiText(gptD);
      }catch(e){gptReview=`GPT-4o review unavailable: ${e.message}\n(Add OPENAI_API_KEY to Vercel env vars to enable)`}

      const combined=`═══ CLAUDE REVIEW ═══\n${claudeReview}\n\n═══ GPT-4o REVIEW ═══\n${gptReview}`;
      setReview(combined);setStep(3);
      store("stk-draft",{topic,kw,pillar,slug,brief,article,review:combined,score:sc,ts:Date.now()});
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
    const item={id:Date.now().toString(),title,keywords:kw.split(",")[0].trim(),pillar,slug,score:sc?.score||0,reviewStatus:review.includes("PASS")?"pass":"needs-review",status:"drafted",createdAt:new Date().toISOString(),fullArticle:article};
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

  // ═══ SOCIAL STUDIO ACTIONS ═══
  const socPickTpl=(id)=>{setSocTpl(id);setSocProps({...SOC_DEFAULTS[id]});setSocCarousel(null);setSocActive(0)};
  const socPickSlide=(i)=>{setSocActive(i);const s=socCarousel.slides[i];setSocTpl(s.template);setSocProps({...SOC_DEFAULTS[s.template],...s.props})};

  const socGenerate=useCallback(async(url)=>{
    if(!url?.trim())return;
    setSocLoading(true);setSocStatus("Fetching blog...");
    try{
      const res=await fetch("/api/fetch-blog",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:url.trim()})});
      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error||"Could not fetch URL")}
      const{html}=await res.json();
      const doc=new DOMParser().parseFromString(html,"text/html");
      const title=doc.querySelector("h1")?.textContent?.trim()||doc.querySelector("title")?.textContent?.trim()||"Untitled";
      const entry=doc.querySelector(".blog-item-content,.entry-content,article,.sqs-block-content");
      let bodyText="";
      if(entry)bodyText=Array.from(entry.querySelectorAll("p,h2,h3,li")).map(el=>el.textContent?.trim()).filter(Boolean).join("\n\n");
      if(!bodyText)bodyText=doc.body?.textContent?.substring(0,5000)||"";

      setSocStatus("Generating carousel...");
      const d=await ai([{role:"user",content:`Create an Instagram carousel from this blog.\n\nTitle: ${title}\n\nContent:\n${bodyText.substring(0,4000)}`}],{system:SOCIAL_PROMPT});
      const raw=aiText(d);
      const carousel=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const total=carousel.slides.length;
      carousel.slides.forEach((s,i)=>{if(s.template==="carousel-text"){s.props.slideNumber=i+1;s.props.totalSlides=total}});
      setSocCarousel(carousel);setSocCaption(carousel.caption||"");setSocActive(0);
      if(carousel.slides?.length){const f=carousel.slides[0];setSocTpl(f.template);setSocProps({...SOC_DEFAULTS[f.template],...f.props})}
      setSocStatus("");setSocToast("Generated "+carousel.slides.length+" slides");setTimeout(()=>setSocToast(null),2500);
    }catch(e){console.error(e);setSocStatus("");setSocToast("Error: "+e.message);setTimeout(()=>setSocToast(null),4000)}
    finally{setSocLoading(false)}
  },[]);

  const socFromPipeline=useCallback((item)=>{
    setTab("social");
    const url=`https://www.wisconsindesignerdoodles.com${item.slug||""}`;
    setSocUrl(url);
    socGenerate(url);
  },[socGenerate]);

  const socDownload=useCallback(async()=>{
    if(!socRef.current)return;
    try{
      const{toPng}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm");
      const dataUrl=await toPng(socRef.current,{width:1080,height:1350,pixelRatio:1,style:{transform:"none",transformOrigin:"top left"}});
      const a=document.createElement("a");a.download=`stokeshire-slide-${socActive+1}.png`;a.href=dataUrl;a.click();
      setSocToast("PNG downloaded");setTimeout(()=>setSocToast(null),2500);
    }catch(e){console.error(e);setSocToast("Export failed - use screenshot");setTimeout(()=>setSocToast(null),3000)}
  },[socActive]);

  // Export all slides + caption to Google Drive
  const DRIVE_PARENT_FOLDER=load("stk-drive-folder",""); // Set in Settings
  const socExportDrive=useCallback(async()=>{
    if(!socCarousel?.slides?.length||!socRef.current)return;
    if(!DRIVE_PARENT_FOLDER){setSocToast("Set Drive folder ID in Settings first");setTimeout(()=>setSocToast(null),3000);return}
    setSocLoading(true);setSocStatus("Creating Drive folder...");
    try{
      const{toPng}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm");
      // Create subfolder for this carousel
      const date=new Date().toISOString().slice(0,10);
      const title=socCarousel.slides[0]?.props?.headline||"Carousel";
      const folder=await driveCreateFolder(`${date} - ${title}`,DRIVE_PARENT_FOLDER);

      // Export each slide
      for(let i=0;i<socCarousel.slides.length;i++){
        setSocStatus(`Exporting slide ${i+1}/${socCarousel.slides.length}...`);
        // Switch to this slide
        const s=socCarousel.slides[i];
        setSocTpl(s.template);setSocProps({...SOC_DEFAULTS[s.template],...s.props});setSocActive(i);
        // Wait for render
        await new Promise(ok=>setTimeout(ok,500));
        const dataUrl=await toPng(socRef.current,{width:1080,height:1350,pixelRatio:1,style:{transform:"none",transformOrigin:"top left"}});
        const base64=dataUrl.split(",")[1];
        await driveUpload(`slide-${i+1}.png`,base64,folder.id);
      }

      // Upload caption as text file
      setSocStatus("Uploading caption...");
      const captionText=socCaption+"\n\n.\n.\n.\n\n"+socHashtags;
      const captionB64=btoa(unescape(encodeURIComponent(captionText)));
      await driveUpload("caption.txt",captionB64,folder.id,"text/plain");

      setSocStatus("");setSocToast("Exported to Drive");setTimeout(()=>setSocToast(null),3000);
    }catch(e){console.error(e);setSocStatus("");setSocToast("Drive export failed: "+e.message);setTimeout(()=>setSocToast(null),4000)}
    finally{setSocLoading(false)}
  },[socCarousel,socCaption,socHashtags,DRIVE_PARENT_FOLDER]);

  const TABS=[{id:"intel",icon:"🔍",label:"Keyword Intel"},{id:"studio",icon:"✍️",label:"Content Studio"},{id:"pipeline",icon:"📋",label:"Pipeline"},{id:"social",icon:"📸",label:"Social Studio"},{id:"settings",icon:"⚙️",label:"Settings"}];
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
          <div style={{fontSize:11,color:C.stone,marginTop:1}}>Intel → Research → Draft → Review → Deploy → Social → Track</div>
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
              <div style={{fontSize:13,color:C.slate,marginBottom:24}}>Article saved. Use the copy buttons above to grab meta, article, and schema for Squarespace.</div>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <Btn onClick={()=>{setStep(0);setArticle("");setBrief("");setReview("");setSc(null);localStorage.removeItem("stk-draft")}} v="primary">New Article</Btn>
                <Btn onClick={()=>setTab("pipeline")} v="secondary">View Pipeline</Btn>
              </div>
              <div style={{marginTop:16,fontSize:11,color:C.stone,padding:12,background:C.creamDark,borderRadius:8}}>
                Asana task creation and Gmail notifications are available when using the Content Engine inside Claude.ai artifacts.
              </div>
            </Card>}

            {loading&&<div style={{marginTop:16,padding:14,background:C.copperGlow,borderRadius:8,textAlign:"center"}}>
              <div style={{fontSize:13,color:C.copper,fontWeight:500,animation:"pulse 1.5s infinite"}}>
                {loading==="research"&&"Searching competitors and building research brief..."}
                {loading==="draft"&&"Drafting article with voice library, AEO, schema, and conversion blocks..."}
                {loading==="review"&&"Running dual-AI compliance review..."}
                {loading?.startsWith("regen")&&"Revising section..."}
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
                      {item.status==="published"&&<Btn onClick={()=>socFromPipeline(item)} v="ghost" sx={{fontSize:10,padding:"4px 10px"}}>📸 Social</Btn>}
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

        {/* ═══ SOCIAL STUDIO ═══ */}
        {tab==="social"&&(
          <div className="fi">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.ink}}>Social Studio</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:11,color:C.stone}}>Zoom</span>
                <input type="range" min={0.18} max={0.5} step={0.01} value={socScale} onChange={e=>setSocScale(+e.target.value)} style={{width:80,accentColor:C.copper}}/>
              </div>
            </div>

            {/* Blog to Carousel */}
            <Card sx={{background:C.ink,border:"none",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:10}}>Blog to Carousel</div>
              <div style={{fontSize:12,color:C.stone,marginBottom:12}}>Paste a published blog URL. Claude reads it and builds the carousel.</div>
              <div style={{display:"flex",gap:8}}>
                <input type="url" value={socUrl} placeholder="https://wisconsindesignerdoodles.com/blog/..." onChange={e=>setSocUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&socGenerate(socUrl)} style={{...is,flex:1,background:"rgba(255,255,255,0.08)",color:C.cream,border:`1px solid ${C.stone}40`}}/>
                <Btn onClick={()=>socGenerate(socUrl)} disabled={socLoading||!socUrl.trim()}>{socLoading?"Working...":"Generate"}</Btn>
              </div>
              {socStatus&&<div style={{fontSize:12,color:C.copper,marginTop:8}}>{socStatus}</div>}
            </Card>

            <div style={{display:"grid",gridTemplateColumns:"280px 1fr 300px",gap:20}}>
              {/* Left: Templates + Editor */}
              <div>
                {socCarousel&&socCarousel.slides?.length>1&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
                  {socCarousel.slides.map((s,i)=><button key={i} onClick={()=>socPickSlide(i)} style={{width:40,height:50,borderRadius:4,border:i===socActive?`2px solid ${C.copper}`:`1px solid ${C.warmGray}`,background:s.template.includes("cream")?C.cream:C.charcoal,cursor:"pointer",fontFamily:F.b,fontSize:11,color:i===socActive?C.copper:C.stone,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</button>)}
                </div>}
                <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:10}}>Templates</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:16}}>
                  {SOC_TEMPLATES.map(t=><button key={t.id} onClick={()=>socPickTpl(t.id)} style={{textAlign:"left",padding:"8px 10px",borderRadius:5,border:socTpl===t.id?`2px solid ${C.copper}`:`1px solid ${C.warmGray}`,background:socTpl===t.id?C.white:"transparent",cursor:"pointer"}}>
                    <div style={{fontSize:12,fontWeight:socTpl===t.id?600:400,color:C.ink}}>{t.name}</div>
                  </button>)}
                </div>
                <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:10}}>Edit Content</div>
                {(SOC_FIELDS[socTpl]||[]).map(f=><div key={f.key} style={{marginBottom:10}}>
                  <label style={{...ls,fontSize:10}}>{f.label}{f.required&&<span style={{color:C.copper}}> *</span>}</label>
                  {(f.type==="text"||f.type==="url")&&<input value={socProps[f.key]||""} onChange={e=>setSocProps(p=>({...p,[f.key]:e.target.value}))} style={{...is,fontSize:12}} placeholder={f.placeholder||""}/>}
                  {f.type==="textarea"&&<textarea value={socProps[f.key]||""} rows={f.rows||3} onChange={e=>setSocProps(p=>({...p,[f.key]:e.target.value}))} style={{...is,fontSize:12,resize:"vertical"}}/>}
                  {f.type==="number"&&<input type="number" value={socProps[f.key]??1} onChange={e=>setSocProps(p=>({...p,[f.key]:parseInt(e.target.value)||0}))} style={{...is,fontSize:12,width:80}}/>}
                  {f.type==="boolean"&&<button onClick={()=>setSocProps(p=>({...p,[f.key]:!p[f.key]}))} style={{padding:"6px 16px",borderRadius:4,border:`1px solid ${C.warmGray}`,background:socProps[f.key]?C.copper:C.white,color:socProps[f.key]?C.white:C.slate,fontFamily:F.b,fontSize:11,cursor:"pointer"}}>{socProps[f.key]?"On":"Off"}</button>}
                  {f.type==="select"&&<select value={socProps[f.key]||f.options?.[0]} onChange={e=>setSocProps(p=>({...p,[f.key]:e.target.value}))} style={{...is,fontSize:12}}>{f.options?.map(o=><option key={o} value={o}>{o}</option>)}</select>}
                </div>)}
              </div>

              {/* Center: Preview */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",background:`repeating-conic-gradient(${C.warmGray}22 0% 25%, transparent 0% 50%) 50%/18px 18px`,borderRadius:10,overflow:"auto",minHeight:500}}>
                <div ref={socRef} style={{transform:`scale(${socScale})`,transformOrigin:"center center",boxShadow:"0 6px 30px rgba(0,0,0,0.12)",borderRadius:3,overflow:"hidden",flexShrink:0}}>
                  {SOC_CARDS[socTpl]&&(() => {const SocCard=SOC_CARDS[socTpl];return <SocCard {...socProps}/>})()}
                </div>
              </div>

              {/* Right: Caption + Export */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {socCarousel&&socCaption&&<Card>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:8}}>Generated Caption</div>
                  <textarea value={socCaption} onChange={e=>setSocCaption(e.target.value)} rows={7} style={{...is,fontSize:12,resize:"vertical"}}/>
                  <Btn onClick={async()=>{try{await navigator.clipboard.writeText(socCaption);setSocToast("Caption copied");setTimeout(()=>setSocToast(null),2500)}catch{setSocToast("Copy failed")}}} sx={{marginTop:8,fontSize:10,padding:"8px 14px"}}>Copy Caption</Btn>
                </Card>}

                <Card>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:8}}>Hashtags</div>
                  <textarea value={socHashtags} onChange={e=>setSocHashtags(e.target.value)} rows={2} style={{...is,fontSize:11,resize:"vertical",color:C.slate}}/>
                  <Btn onClick={async()=>{try{await navigator.clipboard.writeText((socCaption||"")+"\n\n.\n.\n.\n\n"+socHashtags);setSocToast("Copied caption + hashtags");setTimeout(()=>setSocToast(null),2500)}catch{}}} v="secondary" sx={{marginTop:8,fontSize:10,padding:"8px 14px",width:"100%"}}>Copy All</Btn>
                </Card>

                <Card>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:8}}>Export</div>
                  <Btn onClick={socDownload} v="secondary" sx={{width:"100%",fontSize:11,marginBottom:8}}>Download PNG (1080 x 1350)</Btn>
                  {socCarousel&&socCarousel.slides?.length>1&&<Btn onClick={socExportDrive} disabled={socLoading} sx={{width:"100%",fontSize:11,marginBottom:8}}>
                    {socLoading?"Exporting...":"Export All to Google Drive"}
                  </Btn>}
                  <div style={{fontSize:10,color:C.stone,marginTop:4,lineHeight:1.5}}>Download exports current slide. Drive export saves all slides + caption to a folder.</div>
                </Card>

                <Card sx={{background:C.ink,border:"none"}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>Pipeline</div>
                  <div style={{fontSize:11,color:C.stone,lineHeight:1.7}}>
                    <div>1. Write blog with Claude</div>
                    <div>2. Publish to Squarespace</div>
                    <div>3. Paste URL here</div>
                    <div>4. Claude generates carousel</div>
                    <div>5. Edit slides + download PNGs</div>
                    <div>6. Post with caption + hashtags</div>
                  </div>
                </Card>
              </div>
            </div>

            {socToast&&<div style={{position:"fixed",bottom:28,right:28,zIndex:9999,padding:"12px 24px",borderRadius:6,background:socToast.includes("Error")?C.danger:C.ink,color:C.cream,fontFamily:F.b,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.25)"}}>{socToast}</div>}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab==="settings"&&(
          <div className="fi">
            <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.ink,marginBottom:8}}>Integration Settings</div>
            <div style={{fontSize:13,color:C.slate,marginBottom:24}}>API keys are stored in Vercel environment variables (server-side, secure). Browser settings stored locally.</div>

            <div style={{fontFamily:F.d,fontSize:18,fontWeight:600,color:C.ink,marginBottom:12}}>Server-Side (Vercel Env Vars)</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
              {[
                {name:"Claude API",icon:"🧠",desc:"Drafting, review, carousel generation",key:"ANTHROPIC_API_KEY",status:"Active"},
                {name:"OpenAI GPT-4o",icon:"🤖",desc:"Dual-AI compliance review",key:"OPENAI_API_KEY",status:"Active"},
                {name:"Google Drive",icon:"📁",desc:"Social Studio carousel export",key:"GOOGLE_SERVICE_ACCOUNT_JSON",status:"Needs Setup"},
              ].map(i=>(
                <Card key={i.name} sx={{padding:"14px 18px"}}>
                  <div style={{fontSize:20,marginBottom:6}}>{i.icon}</div>
                  <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{i.name}</div>
                  <div style={{fontSize:11,color:C.slate,marginBottom:8}}>{i.desc}</div>
                  <div style={{fontSize:10,color:C.stone}}>Env: <code style={{fontSize:10}}>{i.key}</code></div>
                  <Badge color={i.status==="Active"?C.success:C.warning}>{i.status}</Badge>
                </Card>
              ))}
            </div>

            <div style={{fontFamily:F.d,fontSize:18,fontWeight:600,color:C.ink,marginBottom:12}}>Data Sources (No Auth Required)</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
              {[
                {name:"Search Console CSV",icon:"📊",desc:"Live keyword data via published spreadsheet",status:"Active"},
                {name:"Web Search",icon:"🔍",desc:"Competitor research via Claude tools",status:"Active"},
                {name:"Blog Fetching",icon:"📰",desc:"Social Studio reads published posts",status:"Active"},
              ].map(i=>(
                <Card key={i.name} sx={{padding:"14px 18px"}}>
                  <div style={{fontSize:20,marginBottom:6}}>{i.icon}</div>
                  <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{i.name}</div>
                  <div style={{fontSize:11,color:C.slate,marginBottom:8}}>{i.desc}</div>
                  <Badge color={C.success}>{i.status}</Badge>
                </Card>
              ))}
            </div>

            <div style={{fontFamily:F.d,fontSize:18,fontWeight:600,color:C.ink,marginBottom:12}}>Browser Settings</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:8}}>Google Drive Export Folder</div>
                <div style={{fontSize:12,color:C.slate,marginBottom:12}}>The Drive folder ID where Social Studio exports carousels. Find it in the folder URL after /folders/</div>
                <input value={load("stk-drive-folder","")} onChange={e=>{store("stk-drive-folder",e.target.value)}} style={is} placeholder="e.g. 1jVhTAmaOPYIRiO1qcn6DBjwVXmG7l-Rx"/>
              </Card>
              <Card>
                <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:8}}>Ahrefs API Key (Future)</div>
                <div style={{fontSize:12,color:C.slate,marginBottom:12}}>Deep keyword intelligence. Not yet wired - saved for when you enable at ahrefs.com/api</div>
                <input value={settings.ahrefsKey||""} onChange={e=>{const s={...settings,ahrefsKey:e.target.value};saveSettings(s)}} style={is} placeholder="Not yet active" type="password"/>
              </Card>
            </div>

            <div style={{marginTop:28,padding:16,background:C.creamDark,borderRadius:8}}>
              <div style={{fontSize:12,fontWeight:600,color:C.ink,marginBottom:8}}>Future Integrations (Roadmap)</div>
              <div style={{fontSize:11,color:C.slate,lineHeight:1.7}}>
                <div>Ahrefs - keyword difficulty + search volume enrichment for Intel tab</div>
                <div>Asana MCP - auto-create tasks on article deploy (requires MCP auth)</div>
                <div>Gmail MCP - review notifications (requires MCP auth)</div>
                <div>Squarespace API - direct blog publishing (no API available yet)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{padding:"14px 32px",borderTop:`1px solid ${C.warmGray}`,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:C.stone}}>Stokeshire Designer Doodles · DATCP #514401-DS</span>
        <span style={{fontSize:11,color:C.stone}}>Content Engine v4 · Voice Library · Dual-AI Review · Social Studio · Memory Bank</span>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.copper},${C.copperLight},${C.copper})`,zIndex:999}}/>
    </div>
  );
}
