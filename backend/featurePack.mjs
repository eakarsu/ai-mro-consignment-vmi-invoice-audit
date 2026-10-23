// Feature pack: search/filter, CSV/JSON export, deterministic domain insights (offline fallback).
export const DOMAIN = ["Billed vs supported variance summary", "Overbilling outlier scan", "Invoice priority queue"];
export function filterRecords(rows, q={}) {
  const search=String(q.search||q.q||"").trim().toLowerCase();
  const status=String(q.status||"").trim(); const risk=String(q.risk||"").trim();
  return (rows||[]).filter(r=>{
    if(status && r.status!==status) return false;
    if(risk && r.risk!==risk) return false;
    if(!search) return true;
    return [r.reference,r.title,r.owner,r.status,r.risk].some(v=>String(v??"").toLowerCase().includes(search));
  });
}
export function recordsToCsv(rows){
  const cols=["id","reference","title","status","owner","risk","due_date","amount"];
  const esc=v=>{ if(v===null||v===undefined) return ""; const s=String(v); return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s; };
  return [cols.join(","), ...(rows||[]).map(r=>cols.map(c=>esc(c==="due_date"?String(r.due_date??"").slice(0,10):r[c])).join(","))].join("\n")+"\n";
}
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
export function buildInsights(rows){
  const list=rows||[]; const total=list.reduce((s,r)=>s+num(r.amount),0);
  const open=list.filter(r=>!["Approved","Closed"].includes(r.status));
  const high=list.filter(r=>["High","Critical"].includes(r.risk));
  const closed=list.filter(r=>r.status==="Closed");
  const mk=(id,title,summary,extra={})=>({id,title,aiGenerated:false,generatedBy:"deterministic-fallback",label:"Deterministic fallback (no AI call)",summary,
    metrics:[{label:"Records reviewed",value:list.length},{label:"Total amount",value:total},{label:"Open records",value:open.length},{label:"High-risk records",value:high.length},{label:"Closed records",value:closed.length}],
    sections:[{title:"Records reviewed",detail:`${list.length} record(s) totalling ${total}.`},{title:"Open items",detail: open.length? open.slice(0,5).map(r=>`${r.reference}: ${r.title} (${r.status})`).join("; ") : "None reported."},{title:"High-risk items",detail: high.length? high.slice(0,5).map(r=>`${r.reference}: ${r.title} (${r.risk})`).join("; ") : "None reported."}],
    flags:{hasOpen:open.length>0,hasHighRisk:high.length>0,hasRecords:list.length>0}, ...extra});
  return [
    mk("variance-summary", DOMAIN[0], list.length? `${DOMAIN[0]}: ${open.length} open of ${list.length} records, total ${total}.` : `${DOMAIN[0]}: no records yet (0).`),
    mk("outlier-scan", DOMAIN[1], high.length? `${DOMAIN[1]}: ${high.length} high-risk record(s) need review.` : `${DOMAIN[1]}: no high-risk outliers (0).`),
    mk("priority-queue", DOMAIN[2], open.length? `${DOMAIN[2]}: prioritise ${open.slice(0,3).map(r=>r.reference).join(", ")}.` : `${DOMAIN[2]}: queue empty (0 open).`),
  ];
}
export function mountFeaturePack(app,{pool,auth,featureById}){
  app.get("/api/features/:id/export", auth, async (req,res,next)=>{ try{ const f=featureById(req.params.id); const rows=(await pool.query("SELECT * FROM feature_records WHERE feature_id=$1 ORDER BY updated_at DESC,id DESC",[f.id])).rows; const filtered=filterRecords(rows,req.query); const fmt=String(req.query.format||"json").toLowerCase(); if(fmt==="csv"){ res.setHeader("Content-Type","text/csv; charset=utf-8"); res.setHeader("Content-Disposition",`attachment; filename="${f.id}-records.csv"`); return res.send(recordsToCsv(filtered)); } if(fmt!=="json") return res.status(422).json({error:"format must be csv or json"}); return res.json({items:filtered,total:filtered.length}); }catch(e){next(e);} });
  app.get("/api/features/:id/insights", auth, async (req,res,next)=>{ try{ const f=featureById(req.params.id); const rows=(await pool.query("SELECT * FROM feature_records WHERE feature_id=$1 ORDER BY updated_at DESC,id DESC",[f.id])).rows; return res.json({featureId:f.id, aiGenerated:false, generatedBy:"deterministic-fallback", insights:buildInsights(filterRecords(rows,req.query))}); }catch(e){next(e);} });
}
