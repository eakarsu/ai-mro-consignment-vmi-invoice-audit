import React,{useEffect,useState} from "react";
export function displayValue(v){ if(v===false) return "No"; if(v===true) return "Yes"; if(v===0) return "0"; if(v===""||v==null) return "Not provided"; if(Array.isArray(v)&&!v.length) return "None reported."; return String(v); }
export default function FeaturePackPanel({feature,request}){
  const [insights,setInsights]=useState([]); const [error,setError]=useState("");
  useEffect(()=>{ let on=true; request(`/api/features/${feature.id}/insights`).then(d=>{if(on) setInsights(d.insights||[]);}).catch(e=>{if(on) setError(e.message);}); return ()=>{on=false;}; },[feature.id]);
  async function download(format){ const t=localStorage.getItem("domain_recovery_token"); const r=await fetch(`/api/features/${feature.id}/export?format=${format}`,{headers:t?{Authorization:`Bearer ${t}`}:{}}); if(!r.ok){setError(`Export failed (${r.status})`); return;} const blob=await r.blob(); const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=`${feature.id}-records.${format}`; a.click(); URL.revokeObjectURL(u); }
  return <section className="panel" aria-label="Domain insights and export"><div className="moduleTitle"><div><h3>Domain insights (deterministic fallback)</h3><p>Labelled local analysis over your own records. No AI call is made when you see aiGenerated: No.</p></div><div className="buttonRow"><button type="button" className="secondary" onClick={()=>download("csv")}>Export CSV</button><button type="button" className="secondary" onClick={()=>download("json")}>Export JSON</button></div></div>
  {error&&<p className="error" role="alert">{error}</p>}
  {insights.length? insights.map(i=><article key={i.id}><h4>{i.title}</h4><p><strong>AI generated:</strong> {displayValue(i.aiGenerated)} · <strong>Source:</strong> {i.label||i.generatedBy}</p><p>{displayValue(i.summary)}</p>
  <div className="detailGrid">{(i.metrics||[]).map(m=><div key={m.label}><span>{m.label}</span><strong>{displayValue(m.value)}</strong></div>)}</div>
  {(i.sections||[]).map(s=><section key={s.title}><h5>{s.title}</h5><p>{displayValue(s.detail)}</p></section>)}
  <p><strong>Has open:</strong> {displayValue(i.flags?.hasOpen)} · <strong>Has high risk:</strong> {displayValue(i.flags?.hasHighRisk)} · <strong>Has records:</strong> {displayValue(i.flags?.hasRecords)}</p></article>) : <p className="muted">No insights yet. Records reviewed: 0.</p>}
  </section>;
}
