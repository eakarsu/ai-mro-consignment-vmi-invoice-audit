import React,{useEffect,useState} from "react";
export default function TasksPanel({request,notify}){
  const [tasks,setTasks]=useState([]); const [title,setTitle]=useState(""); const [error,setError]=useState("");
  async function load(){ try{ const d=await request("/api/tasks"); setTasks(d.tasks||[]);}catch(e){setError(e.message);} }
  useEffect(()=>{load();},[]);
  async function create(e){ e.preventDefault(); if(!title.trim()) return; try{ await request("/api/tasks",{method:"POST",body:JSON.stringify({title:title.trim()})}); setTitle(""); notify?.("Task created"); await load(); }catch(err){setError(err.message);} }
  async function update(t,status){ try{ await request(`/api/tasks/${t.id}`,{method:"PATCH",body:JSON.stringify({status})}); await load(); }catch(err){setError(err.message);} }
  return <section className="panel" aria-label="Staff tasks"><header className="pageTitle"><div><span className="eyebrow">Follow-ups</span><h2>Staff tasks</h2><p>Authenticated list, create, and status update for durable staff tasks.</p></div></header>
  {error&&<p className="error" role="alert">{error}</p>}
  <form onSubmit={create}><label>New task title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title"/></label><button className="primary" type="submit">Create task</button></form>
  {tasks.length? <div className="tableWrap"><table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Action</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{t.title}</td><td>{t.status}</td><td>{t.priority}</td><td>{t.status!=="DONE"?<button type="button" className="secondary" onClick={()=>update(t,"DONE")}>Mark done</button>:<button type="button" className="secondary" onClick={()=>update(t,"OPEN")}>Reopen</button>}</td></tr>)}</tbody></table></div> : <p className="muted">No tasks found. Open tasks: 0.</p>}
  </section>;
}
