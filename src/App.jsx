import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   STOKESHIRE CONTENT ENGINE v6
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

Check: (1) "Hypoallergenic" used as promise? Must be "lower-shedding" + disclaimer. (2) Health/temperament guarantees? (3) Exclamation points, hype, urgency? (4) Weight/size ranges accurate? Lifespan 12-15yr? (5) Quick Answer present? FAQ present? Conversion block? 3+ internal links? (6) Meta title/description? JSON-LD schema? Word count 2000+?

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
const BRAND_PATTERN="https://images.squarespace-cdn.com/content/5f57a5db19270a2fe560d10c/c99fe7f4-0947-4bb8-a3fd-6ccab42079d8/stokeshire-brand-pattern.26.jpg?content-type=image%2Fjpeg";
function socAccent(text,word,style){if(!word?.trim())return text;try{const e=word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return text.split(new RegExp(`(${e})`,"i")).map((p,i)=>p.toLowerCase()===word.toLowerCase()?<span key={i} style={style}>{p}</span>:<span key={i}>{p}</span>)}catch{return text}}
const socFoot={position:"absolute",bottom:44,left:0,right:0,textAlign:"center",fontFamily:F.b,fontWeight:300,fontSize:13,letterSpacing:".3em",textTransform:"uppercase"};
const brandOverlay={position:"absolute",inset:0,backgroundImage:`url(${BRAND_PATTERN})`,backgroundSize:"420px",opacity:.035,pointerEvents:"none"};
const copperLine=(w=60)=>({width:w,height:1.5,background:"linear-gradient(90deg,transparent,#AD7A28,transparent)",margin:"0 auto"});
const cornerAccent=(pos)=>{const base={position:"absolute",width:40,height:40,borderColor:"rgba(173,122,40,0.15)",borderStyle:"solid",borderWidth:0};const map={tl:{top:32,left:32,borderTopWidth:1,borderLeftWidth:1},tr:{top:32,right:32,borderTopWidth:1,borderRightWidth:1},bl:{bottom:32,left:32,borderBottomWidth:1,borderLeftWidth:1},br:{bottom:32,right:32,borderBottomWidth:1,borderRightWidth:1}};return{...base,...(map[pos]||{})}};

function SocEditorialDark({tagline,headline,accentWord,subtitle,backgroundImage}){
  return <div style={{width:1080,height:1350,position:"relative",overflow:"hidden",background:"linear-gradient(175deg,#1C1C1C 0%,#2A2118 50%,#1C1C1C 100%)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
    <div style={brandOverlay}/>
    {backgroundImage&&<div style={{position:"absolute",inset:0,backgroundImage:`url(${backgroundImage})`,backgroundSize:"cover",backgroundPosition:"center",opacity:.18,filter:"grayscale(100%) contrast(1.1)"}}/>}
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(173,122,40,0.06) 0%, transparent 60%)"}}/>
    <div style={cornerAccent("tl")}/><div style={cornerAccent("tr")}/><div style={cornerAccent("bl")}/><div style={cornerAccent("br")}/>
    <div style={{position:"relative",zIndex:2,textAlign:"center",padding:"100px 80px"}}>
      {tagline&&<div style={{fontFamily:F.b,fontWeight:300,fontSize:14,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(173,122,40,0.5)",marginBottom:48}}>{tagline}</div>}
      <h1 style={{fontFamily:F.d,fontSize:72,fontWeight:300,lineHeight:1.12,color:"#EDE5D8",letterSpacing:".02em",margin:"0 0 40px"}}>{socAccent(headline||"",accentWord,{color:C.copper,fontStyle:"italic"})}</h1>
      <div style={copperLine(80)}/>
      {subtitle&&<p style={{fontFamily:F.d,fontStyle:"italic",fontSize:28,fontWeight:300,lineHeight:1.6,color:"rgba(222,211,191,0.45)",margin:"40px auto 0",maxWidth:700}}>{subtitle}</p>}
    </div>
    <div style={{...socFoot,color:"rgba(222,211,191,0.2)"}}>Stokeshire Designer Doodles</div>
  </div>
}
function SocStatementCream({quote,attribution,divider}){
  return <div style={{width:1080,height:1350,background:"linear-gradient(175deg,#FAF8F4 0%,#EDE5D8 100%)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative"}}>
    <div style={{...brandOverlay,opacity:.025}}/>
    <div style={cornerAccent("tl")}/><div style={cornerAccent("tr")}/><div style={cornerAccent("bl")}/><div style={cornerAccent("br")}/>
    <div style={{textAlign:"center",padding:"100px 96px",maxWidth:920,position:"relative"}}>
      <div style={{fontFamily:F.d,fontSize:120,fontWeight:300,color:"rgba(173,122,40,0.08)",position:"absolute",top:40,left:"50%",transform:"translateX(-50%)",lineHeight:1}}>\u201C</div>
      {divider&&<div style={{...copperLine(60),margin:"0 auto 56px"}}/>}
      <blockquote style={{fontFamily:F.d,fontSize:38,fontWeight:300,fontStyle:"italic",lineHeight:1.6,color:C.ink,margin:"0 0 48px"}}>{quote}</blockquote>
      {divider&&<div style={{...copperLine(60),margin:"0 auto 40px"}}/>}
      {attribution&&<p style={{fontFamily:F.b,fontWeight:300,fontSize:14,letterSpacing:".25em",textTransform:"uppercase",color:C.stone,margin:0}}>{attribution}</p>}
    </div>
    <div style={{...socFoot,color:C.slate}}>Stokeshire Designer Doodles</div>
  </div>
}
function SocSplitEditorial({headline,body,imageUrl,tagline,imagePosition}){
  const pos=imagePosition||"left";
  const txt=<div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"72px 56px",background:"linear-gradient(175deg,#1C1C1C,#2A2118)",position:"relative"}}>
    <div style={{...brandOverlay,opacity:.03}}/>
    <div style={{position:"relative",zIndex:2}}>
      {tagline&&<div style={{fontFamily:F.b,fontWeight:300,fontSize:13,letterSpacing:".35em",textTransform:"uppercase",color:"rgba(173,122,40,0.5)",marginBottom:28}}>{tagline}</div>}
      <h2 style={{fontFamily:F.d,fontSize:42,fontWeight:300,lineHeight:1.2,color:"#EDE5D8",margin:"0 0 20px"}}>{headline}</h2>
      <div style={{...copperLine(48),margin:"0 0 24px"}}/>
      <p style={{fontFamily:F.b,fontWeight:300,fontSize:17,lineHeight:1.75,color:"rgba(222,211,191,0.5)",margin:0}}>{body}</p>
    </div>
  </div>;
  const img=<div style={{flex:1,background:C.ink,backgroundImage:imageUrl?`url(${imageUrl})`:"none",backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>{!imageUrl&&<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.b,fontSize:13,color:C.stone,letterSpacing:".15em",textTransform:"uppercase"}}>Add Image URL</div>}{imageUrl&&<div style={{position:"absolute",inset:0,background:pos==="left"?"linear-gradient(90deg,transparent 70%,#1C1C1C)":"linear-gradient(270deg,transparent 70%,#1C1C1C)"}}/>}</div>;
  return <div style={{width:1080,height:1350,display:"flex",overflow:"hidden"}}>{pos==="left"?<>{img}{txt}</>:<>{txt}{img}</>}</div>
}
function SocStatCard({number,label,context}){
  return <div style={{width:1080,height:1350,background:"linear-gradient(175deg,#1C1C1C 0%,#2A2118 50%,#1C1C1C 100%)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative"}}>
    <div style={brandOverlay}/>
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 45%, rgba(173,122,40,0.08) 0%, transparent 50%)"}}/>
    <div style={cornerAccent("tl")}/><div style={cornerAccent("tr")}/><div style={cornerAccent("bl")}/><div style={cornerAccent("br")}/>
    <div style={{textAlign:"center",padding:"80px 72px",position:"relative",zIndex:2}}>
      <div style={{fontFamily:F.d,fontSize:160,fontWeight:300,lineHeight:1,color:C.copper,marginBottom:12,textShadow:"0 4px 40px rgba(173,122,40,0.15)"}}>{number}</div>
      <div style={{fontFamily:F.b,fontWeight:300,fontSize:18,letterSpacing:".35em",textTransform:"uppercase",color:"#EDE5D8",marginBottom:40}}>{label}</div>
      <div style={copperLine(60)}/>
      {context&&<p style={{fontFamily:F.d,fontStyle:"italic",fontSize:26,fontWeight:300,lineHeight:1.6,color:"rgba(222,211,191,0.4)",margin:"40px auto 0",maxWidth:600}}>{context}</p>}
    </div>
    <div style={{...socFoot,color:"rgba(222,211,191,0.2)"}}>Stokeshire Designer Doodles</div>
  </div>
}
function SocCarouselText({slideNumber,totalSlides,headline,body,footer}){
  return <div style={{width:1080,height:1350,background:"linear-gradient(175deg,#1C1C1C 0%,#2A2118 100%)",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px 80px",position:"relative"}}>
    <div style={brandOverlay}/>
    <div style={{position:"relative",zIndex:2}}><div style={{fontFamily:F.b,fontWeight:300,fontSize:13,letterSpacing:".3em",color:"rgba(222,211,191,0.2)"}}>{slideNumber} / {totalSlides}</div></div>
    <div style={{position:"relative",zIndex:2}}>
      <h2 style={{fontFamily:F.d,fontSize:48,fontWeight:300,lineHeight:1.2,color:"#EDE5D8",margin:"0 0 28px"}}>{headline}</h2>
      <div style={{...copperLine(48),margin:"0 0 28px"}}/>
      <p style={{fontFamily:F.b,fontWeight:300,fontSize:19,lineHeight:1.8,color:"rgba(222,211,191,0.5)",margin:0,maxWidth:800}}>{body}</p>
    </div>
    <div style={{position:"relative",zIndex:2,fontFamily:F.b,fontWeight:300,fontSize:13,letterSpacing:".3em",textTransform:"uppercase",color:"rgba(222,211,191,0.2)"}}>{footer||"Stokeshire Designer Doodles"}</div>
  </div>
}
function SocCtaCard({headline,subtitle,ctaText,url}){
  return <div style={{width:1080,height:1350,background:"linear-gradient(175deg,#1C1C1C 0%,#2A2118 50%,#1C1C1C 100%)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative"}}>
    <div style={brandOverlay}/>
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%, rgba(173,122,40,0.04) 0%, transparent 50%)"}}/>
    <div style={cornerAccent("tl")}/><div style={cornerAccent("tr")}/><div style={cornerAccent("bl")}/><div style={cornerAccent("br")}/>
    <div style={{textAlign:"center",padding:"80px 80px",position:"relative",zIndex:2}}>
      <div style={copperLine(60)}/>
      <h2 style={{fontFamily:F.d,fontSize:52,fontWeight:300,lineHeight:1.2,color:"#EDE5D8",margin:"52px 0 24px"}}>{headline}</h2>
      {subtitle&&<p style={{fontFamily:F.b,fontWeight:300,fontSize:20,lineHeight:1.65,color:"rgba(222,211,191,0.4)",margin:"0 0 48px",maxWidth:650}}>{subtitle}</p>}
      <div style={copperLine(60)}/>
      {ctaText&&<div style={{display:"inline-block",marginTop:48,padding:"16px 52px",border:"1px solid rgba(173,122,40,0.35)",borderRadius:1,fontFamily:F.b,fontWeight:300,fontSize:14,letterSpacing:".3em",textTransform:"uppercase",color:C.copper,background:"rgba(173,122,40,0.04)"}}>{ctaText}</div>}
      {url&&<p style={{fontFamily:F.b,fontWeight:300,fontSize:14,color:"rgba(222,211,191,0.2)",marginTop:20,letterSpacing:".08em"}}>{url}</p>}
    </div>
    <div style={{...socFoot,color:"rgba(222,211,191,0.15)"}}>Stokeshire Designer Doodles</div>
  </div>
}

const SOC_CARDS={"editorial-dark":SocEditorialDark,"statement-cream":SocStatementCream,"split-editorial":SocSplitEditorial,"stat-card":SocStatCard,"carousel-text":SocCarouselText,"cta-card":SocCtaCard};

// ═══ BLOG IMAGE LIBRARY ═══
const BLOG_IMAGES=[
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/1709842075736-EX8K59CVFR4V8L0A2RZC/family-playing-with-australian-mountain-doodle-puppy.jpg",label:"Family with AMD Puppy",cat:"Lifestyle"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/0c2dd0f1-dd88-4d9b-8f93-d5d1d5bca96d/stella-temperament-assessment.jpg",label:"Stella Assessment",cat:"Training"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/1706625037453-2KGPMYHK2NK8CS4XWX7V/alby-bernedoodle-snow.jpg",label:"Alby in Snow",cat:"Lifestyle"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/b3ba0fcf-5adf-4d3a-8ca5-4c43bc2fb9de/stokes-family-forest-doodle.jpg",label:"Stokes Family Forest",cat:"Brand"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/50de18c6-28ca-4c27-8f22-5d88b9fcbf5c/doodle-puppies-group.jpg",label:"Doodle Puppies Group",cat:"Puppies"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/4f7ef024-6cd2-4ae3-8b26-be0ca3a1a0d1/bernedoodle-puppies-litter.jpg",label:"Bernedoodle Litter",cat:"Puppies"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/97ddf7e5-0e14-4e85-b7e0-6a0bc59d4d83/mini-bernedoodles-3-week.jpg",label:"Mini Bernedoodles 3wk",cat:"Puppies"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/1640021174478-S0RCVHX3RQKL2XD0G8HH/stokeshire-facility-ribfalls.jpg",label:"Facility at Ribfalls",cat:"Brand"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/8979ae64-5d99-48d1-a77b-aa3f7cbdaa5f/bernedoodle-12-week-graduation.jpg",label:"Bernedoodle Graduation",cat:"Training"},
  {url:"https://images.squarespace-cdn.com/content/v1/5b1cba79620b85e042964846/4e14babc-76e8-4f19-8e1f-cf1a24e70a01/luxury-breeder-stokeshire.jpg",label:"Luxury Breeder",cat:"Brand"},
];

// ═══ PRESET CAROUSELS ═══
const PRESET_CAROUSELS=[
  {name:"Temperament Testing",desc:"Why we test every puppy before placement",slides:[
    {template:"editorial-dark",props:{tagline:"The Science Behind Selection",headline:"Why We Temperament Test Every Puppy",accentWord:"Every Puppy",subtitle:"Matching the right dog to the right family is not a guess. It is a process.",backgroundImage:BLOG_IMAGES[1].url}},
    {template:"carousel-text",props:{slideNumber:2,totalSlides:6,headline:"What Is Temperament Testing?",body:"A structured series of behavioral assessments conducted between weeks 7 and 8. We measure prey drive, sound sensitivity, touch tolerance, social attraction, and recovery from startle.",footer:"Stokeshire Designer Doodles"}},
    {template:"stat-card",props:{number:"49",label:"Individual Data Points per Puppy",context:"Every puppy is scored across seven behavioral categories. Not a feeling. A measurement."}},
    {template:"carousel-text",props:{slideNumber:4,totalSlides:6,headline:"Why It Matters",body:"A therapy-grade companion requires more than good genetics. The right temperament, matched to the right family, determines long-term success.",footer:"Stokeshire Designer Doodles"}},
    {template:"statement-cream",props:{quote:"We did not choose our puppy. The data chose for us. And it was the best decision we never had to make.",attribution:"The Whitfield Family - Chicago, IL",divider:true}},
    {template:"cta-card",props:{headline:"Read the Full Guide",subtitle:"How temperament testing shapes every placement at Stokeshire.",ctaText:"Link in Bio",url:"wisconsindesignerdoodles.com"}},
  ]},
  {name:"Doodle School",desc:"What happens in the first 12 weeks",slides:[
    {template:"editorial-dark",props:{tagline:"Our Curriculum",headline:"What Is Doodle School?",accentWord:"Doodle School",subtitle:"Four weeks of foundational training before your puppy comes home. Not daycare. A curriculum."}},
    {template:"carousel-text",props:{slideNumber:2,totalSlides:6,headline:"Weeks 1-3: Foundation",body:"Crate training, house training, leash introduction, basic impulse control. The fundamentals that make the first week home feel effortless.",footer:"Stokeshire Designer Doodles"}},
    {template:"carousel-text",props:{slideNumber:3,totalSlides:6,headline:"Week 4: Socialization",body:"Novel surfaces, sounds, people, and environments. We build confidence through structured exposure, not flooding.",footer:"Stokeshire Designer Doodles"}},
    {template:"stat-card",props:{number:"100+",label:"Socialization Experiences",context:"Each puppy encounters over 100 novel stimuli during Doodle School. Intentional, documented, measured."}},
    {template:"statement-cream",props:{quote:"Our puppy came home and slept through the night. She already knew her name. Doodle School changed everything.",attribution:"The Park Family - Minneapolis, MN",divider:true}},
    {template:"cta-card",props:{headline:"Learn About Doodle School",subtitle:"The training program that sets every Stokeshire puppy apart.",ctaText:"Link in Bio",url:"wisconsindesignerdoodles.com"}},
  ]},
  {name:"Breed Spotlight: AMD",desc:"Australian Mountain Doodle overview",slides:[
    {template:"editorial-dark",props:{tagline:"Breed Spotlight",headline:"The Australian Mountain Doodle",accentWord:"Australian Mountain Doodle",subtitle:"Three breeds. One intention. The calm of the Bernese, the intelligence of the Poodle, the resilience of the Australian Shepherd.",backgroundImage:BLOG_IMAGES[0].url}},
    {template:"carousel-text",props:{slideNumber:2,totalSlides:6,headline:"What Makes an AMD Different?",body:"A tri-breed cross that combines the best temperament traits of three working breeds. Lower-shedding coats, stable nervous systems, and exceptional trainability.",footer:"Stokeshire Designer Doodles"}},
    {template:"stat-card",props:{number:"3",label:"Foundation Breeds",context:"Bernese Mountain Dog for calm. Poodle for intelligence. Australian Shepherd for resilience. Brought together with purpose, not chance."}},
    {template:"carousel-text",props:{slideNumber:4,totalSlides:6,headline:"Size and Temperament",body:"Standard AMDs typically range from 50 to 80 pounds. They are known for their gentle disposition, making them exceptional family companions and therapy candidates.",footer:"Stokeshire Designer Doodles"}},
    {template:"statement-cream",props:{quote:"We researched every doodle breed for two years. The AMD was the only one that checked every box for our family.",attribution:"The Henderson Family - Madison, WI",divider:true}},
    {template:"cta-card",props:{headline:"Explore the AMD Breed",subtitle:"Everything you need to know about the Australian Mountain Doodle.",ctaText:"Link in Bio",url:"wisconsindesignerdoodles.com/australian-mountain-doodle"}},
  ]},
];

// ═══ UTILITIES ═══
function csvParse(t,skip=0){const rows=csvSplitRows(t).slice(skip);if(rows.length<2)return[];const hs=csvLine(rows[0]);return rows.slice(1).map(l=>{const vs=csvLine(l);const r={};hs.forEach((h,i)=>{r[h]=vs[i]||""});return r}).filter(r=>Object.values(r).some(v=>v))}
function csvSplitRows(t){const rows=[];let cur="",q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(ch==='"')q=!q;else if(!q&&(ch==="\n"||(ch==="\r"&&t[i+1]==="\n"&&++i))){if(cur.trim())rows.push(cur);cur="";continue}cur+=ch}if(cur.trim())rows.push(cur);return rows}
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
    {n:"No Hypoallergenic Promise",p:(()=>{const lc=out.toLowerCase();if(!lc.includes("hypoallergenic"))return true;return lc.includes("lower-shedding")&&(lc.includes("no dog is truly")||lc.includes("not truly hypoallergenic")||lc.includes("no coat is completely"))})()},
    {n:"Hedged Language",p:/often|typically|may|around|generally/.test(out)},
    {n:"Stokeshire Voice Marker",p:out.includes("At Stokeshire")},
    {n:"Commerce Opportunities",p:out.includes("[COMMERCE")||out.includes("Commerce")},
    {n:"Word Count 2000+",p:out.split(/\s+/).length>2000},
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

const Card=({children,sx={},onClick,...rest})=><div style={{background:C.white,borderRadius:10,border:`1px solid ${C.warmGray}`,padding:"20px 24px",...sx}} onClick={onClick} {...rest}>{children}</div>;

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
  const [socImgFilter,setSocImgFilter]=useState("All");
  const socRef=useRef(null);
  // Schema Generator
  const [schType,setSchType]=useState("blog");
  const [schFields,setSchFields]=useState({});
  const [schOutput,setSchOutput]=useState("");
  const [schCopied,setSchCopied]=useState(false);
  const [schFaqs,setSchFaqs]=useState([{q:"",a:""}]);

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
      // Extract JSON robustly - find the first { to last }
      let jsonStr=raw.replace(/```json|```/g,"").trim();
      const firstBrace=jsonStr.indexOf("{");const lastBrace=jsonStr.lastIndexOf("}");
      if(firstBrace===-1||lastBrace===-1)throw new Error("No JSON object found in model response");
      jsonStr=jsonStr.substring(firstBrace,lastBrace+1);
      let carousel;
      try{carousel=JSON.parse(jsonStr)}catch(pe){throw new Error("Failed to parse carousel JSON: "+pe.message)}
      if(!carousel.slides||!Array.isArray(carousel.slides)||!carousel.slides.length)throw new Error("Carousel has no slides array");
      // Validate each slide has required props
      carousel.slides=carousel.slides.filter(s=>s&&s.template&&s.props);
      if(!carousel.slides.length)throw new Error("No valid slides after filtering");
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
      const a=document.createElement("a");const dn=new Date().toISOString().slice(0,10);const sl=socUrl?socUrl.split("/").pop()?.replace(/[^a-z0-9-]/gi,""):"carousel";a.download=`${dn}_${sl}_${String(socActive+1).padStart(2,"0")}.png`;a.href=dataUrl;a.click();
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
        // Wait for React render + paint (double rAF + safety margin)
        await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(ok,200))));
        const dataUrl=await toPng(socRef.current,{width:1080,height:1350,pixelRatio:1,style:{transform:"none",transformOrigin:"top left"}});
        const base64=dataUrl.split(",")[1];
        await driveUpload(`${String(i+1).padStart(2,"0")}_slide.png`,base64,folder.id);
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

  // Load a preset carousel
  const socLoadPreset=useCallback((preset)=>{
    const total=preset.slides.length;
    const slides=preset.slides.map((s,i)=>{
      const props={...s.props};
      if(s.template==="carousel-text"){props.slideNumber=i+1;props.totalSlides=total}
      return{template:s.template,props};
    });
    const carousel={caption:"",slides};
    setSocCarousel(carousel);setSocCaption("");setSocActive(0);
    if(slides.length){const f=slides[0];setSocTpl(f.template);setSocProps({...SOC_DEFAULTS[f.template],...f.props})}
    setSocToast("Loaded: "+preset.name);setTimeout(()=>setSocToast(null),2500);
  },[]);

  // Batch download all slides as PNGs (no Drive needed)
  const socDownloadAll=useCallback(async()=>{
    if(!socCarousel?.slides?.length||!socRef.current)return;
    setSocLoading(true);setSocStatus("Downloading all slides...");
    try{
      const{toPng}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm");
      for(let i=0;i<socCarousel.slides.length;i++){
        setSocStatus(`Rendering slide ${i+1}/${socCarousel.slides.length}...`);
        const s=socCarousel.slides[i];
        setSocTpl(s.template);setSocProps({...SOC_DEFAULTS[s.template],...s.props});setSocActive(i);
        await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(ok,200))));
        const dataUrl=await toPng(socRef.current,{width:1080,height:1350,pixelRatio:1,style:{transform:"none",transformOrigin:"top left"}});
        const a=document.createElement("a");const dn=new Date().toISOString().slice(0,10);const sl=socUrl?socUrl.split("/").pop()?.replace(/[^a-z0-9-]/gi,""):"carousel";a.download=`${dn}_${sl}_${String(i+1).padStart(2,"0")}.png`;a.href=dataUrl;a.click();
        await new Promise(ok=>setTimeout(ok,300));
      }
      setSocStatus("");setSocToast("All "+socCarousel.slides.length+" slides downloaded");setTimeout(()=>setSocToast(null),3000);
    }catch(e){console.error(e);setSocStatus("");setSocToast("Batch download failed: "+e.message);setTimeout(()=>setSocToast(null),4000)}
    finally{setSocLoading(false)}
  },[socCarousel]);

  // Insert blog image into current slide
  const socInsertImage=useCallback((url)=>{
    const tpl=socTpl;
    if(tpl==="editorial-dark"){setSocProps(p=>({...p,backgroundImage:url}))}
    else if(tpl==="split-editorial"){setSocProps(p=>({...p,imageUrl:url}))}
    else{setSocToast("This template doesn\'t support images");setTimeout(()=>setSocToast(null),2500);return}
    if(socCarousel?.slides?.length){
      const updated={...socCarousel,slides:[...socCarousel.slides]};
      updated.slides[socActive]={...updated.slides[socActive],props:{...updated.slides[socActive].props}};
      if(tpl==="editorial-dark")updated.slides[socActive].props.backgroundImage=url;
      else if(tpl==="split-editorial")updated.slides[socActive].props.imageUrl=url;
      setSocCarousel(updated);
    }
    setSocToast("Image inserted");setTimeout(()=>setSocToast(null),2000);
  },[socTpl,socCarousel,socActive]);

  // ═══ SCHEMA GENERATOR ═══
  const SITE="https://www.wisconsindesignerdoodles.com";
  const schPageTypes=[
    {id:"blog",name:"Blog Post",desc:"FAQPage schema for blog posts (supplements Squarespace auto Article)"},
    {id:"puppy",name:"Puppy Listing",desc:"Product schema with availability toggle for individual puppy pages"},
    {id:"litter",name:"Litter Page",desc:"ItemList schema linking to individual puppy pages"},
    {id:"breed",name:"Breed Pillar",desc:"WebPage + FAQPage + Dataset in @graph for breed authority pages"},
  ];

  const schResetFields=useCallback((type)=>{
    setSchOutput("");setSchCopied(false);
    if(type==="blog"){setSchFields({title:"",slug:"",description:"",datePublished:"",imageUrl:""});setSchFaqs([{q:"",a:""}])}
    else if(type==="puppy"){setSchFields({name:"",slug:"",breed:"",gender:"",description:"",imageUrl:"",sku:"",status:"InStock",litterUrl:""})}
    else if(type==="litter"){setSchFields({title:"",slug:"",description:"",damName:"",sireName:"",imageUrl:"",puppies:JSON.stringify([{name:"Puppy 1",url:"/puppies-for-sale/puppy-1"},{name:"Puppy 2",url:"/puppies-for-sale/puppy-2"}],null,2)})}
    else if(type==="breed"){setSchFields({title:"",slug:"",description:"",breedName:"",imageUrl:""});setSchFaqs([{q:"",a:""}])}
  },[]);

  useEffect(()=>{schResetFields(schType)},[schType]);

  const schGenerate=useCallback(()=>{
    const f=schFields;const base=SITE;
    let json="";

    if(schType==="blog"){
      const faqs=schFaqs.filter(fq=>fq.q.trim()&&fq.a.trim());
      if(!faqs.length){setSchOutput("// Add at least one FAQ with both question and answer");return}
      json=JSON.stringify({
        "@context":"https://schema.org",
        "@type":"FAQPage",
        "@id":`${base}${f.slug||"/blog/post"}/#faqpage`,
        "url":`${base}${f.slug||"/blog/post"}/`,
        "name":f.title||"FAQ",
        "mainEntity":faqs.map(fq=>({"@type":"Question","name":fq.q,"acceptedAnswer":{"@type":"Answer","text":fq.a}})),
        "inLanguage":"en-US"
      },null,2);
    }

    else if(schType==="puppy"){
      json=JSON.stringify({
        "@context":"https://schema.org",
        "@graph":[
          {
            "@type":"WebPage",
            "@id":`${base}${f.slug||"/puppies-for-sale/puppy"}/#webpage`,
            "url":`${base}${f.slug||"/puppies-for-sale/puppy"}/`,
            "name":f.name||"Puppy",
            "description":f.description||"",
            "isPartOf":{"@id":`${base}/#website`},
            "inLanguage":"en-US"
          },
          {
            "@type":"Product",
            "@id":`${base}${f.slug||"/puppies-for-sale/puppy"}/#product`,
            "name":f.name||"Puppy",
            "description":f.description||"",
            "image":f.imageUrl?[f.imageUrl]:[],
            "sku":f.sku||"",
            "brand":{"@type":"Brand","name":"Stokeshire Designer Doodles"},
            "category":f.breed||"Designer Doodle",
            "offers":{
              "@type":"Offer",
              "url":`${base}${f.slug||"/puppies-for-sale/puppy"}/`,
              "availability":`https://schema.org/${f.status==="SoldOut"?"SoldOut":"InStock"}`,
              "itemCondition":"https://schema.org/NewCondition",
              "seller":{"@id":`${base}/#business`}
            },
            "additionalProperty":[
              {"@type":"PropertyValue","name":"Gender","value":f.gender||""},
              {"@type":"PropertyValue","name":"Breed","value":f.breed||""}
            ]
          },
          {
            "@type":"BreadcrumbList",
            "@id":`${base}${f.slug||"/puppies-for-sale/puppy"}/#breadcrumb`,
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":`${base}/`},
              {"@type":"ListItem","position":2,"name":"Available Puppies","item":`${base}/available-puppies/`},
              {"@type":"ListItem","position":3,"name":f.name||"Puppy","item":`${base}${f.slug||"/puppies-for-sale/puppy"}/`}
            ]
          }
        ]
      },null,2);
    }

    else if(schType==="litter"){
      let puppies=[];
      try{puppies=JSON.parse(f.puppies||"[]")}catch{puppies=[]}
      json=JSON.stringify({
        "@context":"https://schema.org",
        "@graph":[
          {
            "@type":"WebPage",
            "@id":`${base}${f.slug||"/puppies-for-sale/litter"}/#webpage`,
            "url":`${base}${f.slug||"/puppies-for-sale/litter"}/`,
            "name":f.title||"Litter Page",
            "description":f.description||"",
            "isPartOf":{"@id":`${base}/#website`},
            "inLanguage":"en-US"
          },
          {
            "@type":"ItemList",
            "@id":`${base}${f.slug||"/puppies-for-sale/litter"}/#itemlist`,
            "name":f.title||"Litter",
            "description":f.description||"",
            "numberOfItems":puppies.length,
            "itemListElement":puppies.map((p,i)=>({"@type":"ListItem","position":i+1,"name":p.name||`Puppy ${i+1}`,"url":`${base}${p.url||""}`}))
          },
          {
            "@type":"BreadcrumbList",
            "@id":`${base}${f.slug||"/puppies-for-sale/litter"}/#breadcrumb`,
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":`${base}/`},
              {"@type":"ListItem","position":2,"name":"Available Puppies","item":`${base}/available-puppies/`},
              {"@type":"ListItem","position":3,"name":f.title||"Litter","item":`${base}${f.slug||"/puppies-for-sale/litter"}/`}
            ]
          }
        ]
      },null,2);
    }

    else if(schType==="breed"){
      const faqs=schFaqs.filter(fq=>fq.q.trim()&&fq.a.trim());
      json=JSON.stringify({
        "@context":"https://schema.org",
        "@graph":[
          {
            "@type":"WebPage",
            "@id":`${base}${f.slug||"/breed"}/#webpage`,
            "url":`${base}${f.slug||"/breed"}/`,
            "name":f.title||"Breed Page",
            "description":f.description||"",
            "isPartOf":{"@id":`${base}/#website`},
            "about":{"@id":`${base}${f.slug||"/breed"}/#dataset`},
            "inLanguage":"en-US"
          },
          ...(faqs.length?[{
            "@type":"FAQPage",
            "@id":`${base}${f.slug||"/breed"}/#faqpage`,
            "mainEntity":faqs.map(fq=>({"@type":"Question","name":fq.q,"acceptedAnswer":{"@type":"Answer","text":fq.a}}))
          }]:[]),
          {
            "@type":"Dataset",
            "@id":`${base}${f.slug||"/breed"}/#dataset`,
            "name":`${f.breedName||"Breed"} - Breed Information`,
            "description":`Comprehensive breed data for ${f.breedName||"this breed"} from Stokeshire Designer Doodles`,
            "creator":{"@id":`${base}/#business`},
            "license":"https://creativecommons.org/licenses/by-nc-nd/4.0/",
            "inLanguage":"en-US"
          },
          {
            "@type":"BreadcrumbList",
            "@id":`${base}${f.slug||"/breed"}/#breadcrumb`,
            "itemListElement":[
              {"@type":"ListItem","position":1,"name":"Home","item":`${base}/`},
              {"@type":"ListItem","position":2,"name":f.breedName||"Breed","item":`${base}${f.slug||"/breed"}/`}
            ]
          }
        ]
      },null,2);
    }

    const wrapped=`<script type="application/ld+json">\n${json}\n</script>`;
    setSchOutput(wrapped);
  },[schType,schFields,schFaqs]);

  const schCopy=useCallback(()=>{
    if(!schOutput)return;
    navigator.clipboard.writeText(schOutput);
    setSchCopied(true);setTimeout(()=>setSchCopied(false),2500);
  },[schOutput]);

  const TABS=[{id:"intel",icon:"🔍",label:"Keyword Intel"},{id:"studio",icon:"✍️",label:"Content Studio"},{id:"pipeline",icon:"📋",label:"Pipeline"},{id:"social",icon:"📸",label:"Social Studio"},{id:"schema",icon:"🏗️",label:"Schema"},{id:"settings",icon:"⚙️",label:"Settings"}];
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

            {/* Preset Carousels */}
            <Card sx={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase"}}>Preset Carousels</div>
                  <div style={{fontSize:11,color:C.stone,marginTop:2}}>One-click branded carousels for common content types</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {PRESET_CAROUSELS.map(p=>(
                  <button key={p.name} onClick={()=>socLoadPreset(p)} style={{textAlign:"left",padding:"14px 16px",borderRadius:8,border:`1px solid ${C.warmGray}`,background:C.white,cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.copper} onMouseLeave={e=>e.currentTarget.style.borderColor=C.warmGray}>
                    <div style={{fontSize:13,fontWeight:600,color:C.ink,marginBottom:4}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.slate}}>{p.desc}</div>
                    <div style={{fontSize:10,color:C.stone,marginTop:6}}>{p.slides.length} slides</div>
                  </button>
                ))}
              </div>
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

                {/* Image Library */}
                <div style={{marginTop:20}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:8}}>Image Library</div>
                  <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                    {["All","Lifestyle","Puppies","Training","Brand"].map(c=>(
                      <button key={c} onClick={()=>setSocImgFilter(c)} style={{padding:"3px 10px",borderRadius:12,fontSize:10,fontFamily:F.b,border:socImgFilter===c?`1px solid ${C.copper}`:`1px solid ${C.warmGray}`,background:socImgFilter===c?C.copperGlow:"transparent",color:socImgFilter===c?C.copper:C.slate,cursor:"pointer"}}>{c}</button>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,maxHeight:200,overflowY:"auto"}}>
                    {BLOG_IMAGES.filter(img=>socImgFilter==="All"||img.cat===socImgFilter).map((img,i)=>(
                      <div key={i} onClick={()=>socInsertImage(img.url)} style={{cursor:"pointer",borderRadius:4,overflow:"hidden",border:`1px solid ${C.warmGray}`,transition:"border-color .2s",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.copper} onMouseLeave={e=>e.currentTarget.style.borderColor=C.warmGray}>
                        <img src={img.url+"?format=100w"} alt={img.label} style={{width:"100%",height:60,objectFit:"cover",display:"block"}} loading="lazy"/>
                        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(28,28,28,0.7)",padding:"2px 4px",fontSize:8,color:C.cream,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{img.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:C.stone,marginTop:4}}>Click to insert into current slide (editorial-dark or split-editorial)</div>
                </div>
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
                  {socCarousel&&socCarousel.slides?.length>1&&<Btn onClick={socDownloadAll} disabled={socLoading} v="ghost" sx={{width:"100%",fontSize:11,marginBottom:8}}>{socLoading?"Downloading...":"Download All PNGs (No Drive)"}</Btn>}
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

        {/* ═══ SCHEMA GENERATOR ═══ */}
        {tab==="schema"&&(
          <div className="fi">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontFamily:F.d,fontSize:22,fontWeight:600,color:C.ink}}>Schema Generator</div>
                <div style={{fontSize:12,color:C.slate,marginTop:4}}>Generate JSON-LD for Page Header Code Injection. References site-wide @id anchors automatically.</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:24}}>
              {/* Left: Type selector + Fields */}
              <div>
                <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>Page Type</div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
                  {schPageTypes.map(t=>(
                    <button key={t.id} onClick={()=>setSchType(t.id)} style={{textAlign:"left",padding:"12px 14px",borderRadius:6,border:schType===t.id?`2px solid ${C.copper}`:`1px solid ${C.warmGray}`,background:schType===t.id?C.white:"transparent",cursor:"pointer"}}>
                      <div style={{fontSize:13,fontWeight:schType===t.id?600:400,color:C.ink}}>{t.name}</div>
                      <div style={{fontSize:10,color:C.slate,lineHeight:1.4,marginTop:2}}>{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>Fields</div>

                {/* Dynamic fields based on type */}
                {schType==="blog"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div><label style={ls}>Post Title</label><input value={schFields.title||""} onChange={e=>setSchFields(p=>({...p,title:e.target.value}))} style={is} placeholder="Temperament Testing Puppies: Why It Works"/></div>
                  <div><label style={ls}>URL Slug</label><input value={schFields.slug||""} onChange={e=>setSchFields(p=>({...p,slug:e.target.value}))} style={is} placeholder="/stokeshire-doodle-puppy-blog/post-slug"/></div>
                  <div><label style={ls}>Description</label><input value={schFields.description||""} onChange={e=>setSchFields(p=>({...p,description:e.target.value}))} style={is} placeholder="One-sentence summary"/></div>
                  <div style={{marginTop:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{...ls,margin:0}}>FAQ Questions</label>
                      <button onClick={()=>setSchFaqs(p=>[...p,{q:"",a:""}])} style={{background:"none",border:"none",color:C.copper,fontSize:11,cursor:"pointer",fontFamily:F.b,letterSpacing:".05em"}}>+ Add Question</button>
                    </div>
                    {schFaqs.map((fq,i)=>(
                      <div key={i} style={{background:C.creamDark,borderRadius:6,padding:12,marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:10,color:C.stone}}>Q{i+1}</span>
                          {schFaqs.length>1&&<button onClick={()=>setSchFaqs(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,fontSize:11,cursor:"pointer"}}>Remove</button>}
                        </div>
                        <input value={fq.q} onChange={e=>{const u=[...schFaqs];u[i].q=e.target.value;setSchFaqs(u)}} style={{...is,fontSize:12,marginBottom:6}} placeholder="Question text (must match visible page content)"/>
                        <textarea value={fq.a} onChange={e=>{const u=[...schFaqs];u[i].a=e.target.value;setSchFaqs(u)}} style={{...is,fontSize:12,resize:"vertical",minHeight:60}} placeholder="Answer text (600-1200 chars, must match page)"/>
                      </div>
                    ))}
                  </div>
                </div>}

                {schType==="puppy"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div><label style={ls}>Puppy Name</label><input value={schFields.name||""} onChange={e=>setSchFields(p=>({...p,name:e.target.value}))} style={is} placeholder="Emerald"/></div>
                  <div><label style={ls}>URL Slug</label><input value={schFields.slug||""} onChange={e=>setSchFields(p=>({...p,slug:e.target.value}))} style={is} placeholder="/puppies-for-sale/emerald-bernedoodle-mavi-benny-2026"/></div>
                  <div><label style={ls}>Breed</label><input value={schFields.breed||""} onChange={e=>setSchFields(p=>({...p,breed:e.target.value}))} style={is} placeholder="F1B Bernedoodle"/></div>
                  <div><label style={ls}>Gender</label><select value={schFields.gender||""} onChange={e=>setSchFields(p=>({...p,gender:e.target.value}))} style={is}><option value="">Select</option><option>Female</option><option>Male</option></select></div>
                  <div><label style={ls}>Description</label><textarea value={schFields.description||""} onChange={e=>setSchFields(p=>({...p,description:e.target.value}))} style={{...is,resize:"vertical",minHeight:60}} placeholder="Short personality summary"/></div>
                  <div><label style={ls}>Image URL</label><input value={schFields.imageUrl||""} onChange={e=>setSchFields(p=>({...p,imageUrl:e.target.value}))} style={is} placeholder="https://images.squarespace-cdn.com/..."/></div>
                  <div><label style={ls}>SKU</label><input value={schFields.sku||""} onChange={e=>setSchFields(p=>({...p,sku:e.target.value}))} style={is} placeholder="STK-EMERALD-260121-BND-MM-F-YLW-MAVI.BENNY-08"/></div>
                  <div><label style={ls}>Availability</label><select value={schFields.status||"InStock"} onChange={e=>setSchFields(p=>({...p,status:e.target.value}))} style={is}><option value="InStock">Available (InStock)</option><option value="SoldOut">Placed (SoldOut)</option></select></div>
                  <div><label style={ls}>Litter Page URL (optional)</label><input value={schFields.litterUrl||""} onChange={e=>setSchFields(p=>({...p,litterUrl:e.target.value}))} style={is} placeholder="/puppies-for-sale/mavi-benny-litter"/></div>
                </div>}

                {schType==="litter"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div><label style={ls}>Litter Title</label><input value={schFields.title||""} onChange={e=>setSchFields(p=>({...p,title:e.target.value}))} style={is} placeholder="Mavi x Benny - F1B Bernedoodle Litter"/></div>
                  <div><label style={ls}>URL Slug</label><input value={schFields.slug||""} onChange={e=>setSchFields(p=>({...p,slug:e.target.value}))} style={is} placeholder="/puppies-for-sale/mavi-benny-litter"/></div>
                  <div><label style={ls}>Description</label><textarea value={schFields.description||""} onChange={e=>setSchFields(p=>({...p,description:e.target.value}))} style={{...is,resize:"vertical",minHeight:50}} placeholder="Litter overview"/></div>
                  <div><label style={ls}>Dam Name</label><input value={schFields.damName||""} onChange={e=>setSchFields(p=>({...p,damName:e.target.value}))} style={is} placeholder="Mavi"/></div>
                  <div><label style={ls}>Sire Name</label><input value={schFields.sireName||""} onChange={e=>setSchFields(p=>({...p,sireName:e.target.value}))} style={is} placeholder="Benny"/></div>
                  <div><label style={ls}>Puppies JSON (name + url per puppy)</label><textarea value={schFields.puppies||""} onChange={e=>setSchFields(p=>({...p,puppies:e.target.value}))} style={{...is,resize:"vertical",minHeight:120,fontFamily:"ui-monospace,SFMono-Regular,monospace",fontSize:11}} placeholder='[{"name":"Emerald","url":"/puppies-for-sale/emerald"}]'/></div>
                </div>}

                {schType==="breed"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div><label style={ls}>Page Title</label><input value={schFields.title||""} onChange={e=>setSchFields(p=>({...p,title:e.target.value}))} style={is} placeholder="Australian Mountain Doodle - Breed Guide"/></div>
                  <div><label style={ls}>URL Slug</label><input value={schFields.slug||""} onChange={e=>setSchFields(p=>({...p,slug:e.target.value}))} style={is} placeholder="/australian-mountain-doodle"/></div>
                  <div><label style={ls}>Breed Name</label><input value={schFields.breedName||""} onChange={e=>setSchFields(p=>({...p,breedName:e.target.value}))} style={is} placeholder="Australian Mountain Doodle"/></div>
                  <div><label style={ls}>Description</label><textarea value={schFields.description||""} onChange={e=>setSchFields(p=>({...p,description:e.target.value}))} style={{...is,resize:"vertical",minHeight:50}} placeholder="Page meta description"/></div>
                  <div style={{marginTop:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label style={{...ls,margin:0}}>FAQ Questions</label>
                      <button onClick={()=>setSchFaqs(p=>[...p,{q:"",a:""}])} style={{background:"none",border:"none",color:C.copper,fontSize:11,cursor:"pointer",fontFamily:F.b,letterSpacing:".05em"}}>+ Add Question</button>
                    </div>
                    {schFaqs.map((fq,i)=>(
                      <div key={i} style={{background:C.creamDark,borderRadius:6,padding:12,marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:10,color:C.stone}}>Q{i+1}</span>
                          {schFaqs.length>1&&<button onClick={()=>setSchFaqs(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,fontSize:11,cursor:"pointer"}}>Remove</button>}
                        </div>
                        <input value={fq.q} onChange={e=>{const u=[...schFaqs];u[i].q=e.target.value;setSchFaqs(u)}} style={{...is,fontSize:12,marginBottom:6}} placeholder="Question text"/>
                        <textarea value={fq.a} onChange={e=>{const u=[...schFaqs];u[i].a=e.target.value;setSchFaqs(u)}} style={{...is,fontSize:12,resize:"vertical",minHeight:60}} placeholder="Answer text (600-1200 chars)"/>
                      </div>
                    ))}
                  </div>
                </div>}

                <Btn onClick={schGenerate} sx={{width:"100%",marginTop:16}}>Generate Schema</Btn>
              </div>

              {/* Right: Output */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".15em",textTransform:"uppercase"}}>Output</div>
                  {schOutput&&<Btn onClick={schCopy} v={schCopied?"success":"secondary"} sx={{fontSize:10,padding:"6px 14px"}}>{schCopied?"Copied":"Copy to Clipboard"}</Btn>}
                </div>

                {schOutput?<Card sx={{maxHeight:600,overflowY:"auto"}}>
                  <pre style={{fontFamily:"ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",fontSize:12,color:C.ink,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>{schOutput}</pre>
                </Card>:<Card sx={{textAlign:"center",padding:60,background:C.creamDark}}>
                  <div style={{fontSize:28,marginBottom:12}}>🏗️</div>
                  <div style={{fontFamily:F.d,fontSize:18,color:C.ink,marginBottom:8}}>Select a page type and fill in the fields</div>
                  <div style={{fontSize:12,color:C.slate,maxWidth:400,marginInline:"auto",lineHeight:1.6}}>
                    The generator outputs JSON-LD wrapped in a script tag. Copy and paste into the page's Settings → Advanced → Page Header Code Injection in Squarespace.
                  </div>
                </Card>}

                {schOutput&&<div style={{marginTop:16}}>
                  <Card sx={{background:C.ink,border:"none"}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>How to Use</div>
                    <div style={{fontSize:12,color:"rgba(222,211,191,.5)",lineHeight:1.7}}>
                      <div>1. Copy the output above</div>
                      <div>2. Open the page in Squarespace editor</div>
                      <div>3. Go to Page Settings (gear icon) → Advanced</div>
                      <div>4. Paste into Page Header Code Injection</div>
                      <div>5. Save and publish</div>
                      <div>6. Validate at validator.schema.org</div>
                      <div>7. Test at search.google.com/test/rich-results</div>
                    </div>
                  </Card>

                  <Card sx={{marginTop:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.copper,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>Cross-References</div>
                    <div style={{fontSize:12,color:C.slate,lineHeight:1.7}}>
                      <div>This schema references these site-wide @id anchors:</div>
                      <div style={{marginTop:6,fontFamily:"ui-monospace,monospace",fontSize:11,color:C.ink}}>
                        <div>#website - WebSite entity</div>
                        <div>#business - LocalBusiness entity</div>
                        <div>#org - Organization entity</div>
                        <div>#author - James G. Stokes (Person)</div>
                      </div>
                      <div style={{marginTop:8,color:C.stone,fontSize:11}}>These are defined in your site-wide Header Code Injection. Do not duplicate them on individual pages.</div>
                    </div>
                  </Card>
                </div>}
              </div>
            </div>
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
        <span style={{fontSize:11,color:C.stone}}>Content Engine v7 · Voice Library · Dual-AI Review · Social Studio+ · Schema Generator · Memory Bank</span>
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.copper},${C.copperLight},${C.copper})`,zIndex:999}}/>
    </div>
  );
}
