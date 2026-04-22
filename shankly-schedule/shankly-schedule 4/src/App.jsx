import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { ref, onValue, set, push, remove } from 'firebase/database'

// ── CONSTANTS ──────────────────────────────
const PASSWORD = 'Shankly2026'
const GOLD  = '#F5C518'
const BLACK = '#0a0a0a'
const GRAY  = '#1a1a1a'
const GRAY2 = '#242424'
const GRAY3 = '#333'
const WHITE = '#f0ede6'
const DIM   = '#777'
const BLUE  = '#4fc3f7'
const GREEN = '#81c784'
const RED   = '#e74c3c'

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── HELPERS ───────────────────────────────
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function isToday(d) {
  const t = new Date(); t.setHours(0,0,0,0)
  return new Date(d).setHours(0,0,0,0) === t.getTime()
}
function fmtLong(d) { return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` }
function fmt12(t) {
  if (!t) return ''
  const [h,m] = t.split(':').map(Number)
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`
}
function todayAtMidnight() { const d = new Date(); d.setHours(0,0,0,0); return d }
function getNext7() {
  const today = todayAtMidnight()
  return Array.from({length:7}, (_,i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d })
}
function roleLabel(r) { return r==='group' ? 'Groups Only' : r==='solo' ? '1-on-1s Only' : 'Groups + 1-on-1s' }
function roleBadgeStyle(r) {
  if (r==='group') return { background:'rgba(245,197,24,0.13)', color:GOLD }
  if (r==='solo')  return { background:'rgba(79,195,247,0.13)',  color:BLUE }
  return { background:'rgba(129,199,132,0.13)', color:GREEN }
}

// ── SHARED STYLES ─────────────────────────
const S = {
  page:    { minHeight:'100vh', background:BLACK, color:WHITE, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" },
  header:  { background:BLACK, borderBottom:`1px solid rgba(245,197,24,0.18)`, padding:'13px 18px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 },
  brand:   { fontSize:21, fontWeight:900, letterSpacing:3, textTransform:'uppercase', color:GOLD },
  tag:     { fontSize:10, letterSpacing:2, textTransform:'uppercase', color:DIM, marginLeft:10 },
  input:   { width:'100%', background:BLACK, border:`1px solid ${GRAY3}`, borderRadius:7, color:WHITE, fontFamily:'inherit', fontSize:14, padding:'10px 12px', outline:'none', WebkitAppearance:'none', appearance:'none', boxSizing:'border-box' },
  label:   { display:'block', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:DIM, marginBottom:6 },
}

// ── BUTTON ────────────────────────────────
function Btn({ gold, outline, onClick, children, style={}, disabled=false }) {
  const [h, setH] = useState(false)
  const base = { fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:7, cursor:'pointer', border:'none', letterSpacing:0.3, transition:'all 0.15s', fontFamily:'inherit', whiteSpace:'nowrap', opacity:disabled?0.5:1, ...style }
  if (gold)    return <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base, background:h?'#ffd740':GOLD, color:BLACK}}>{children}</button>
  if (outline) return <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base, background:'transparent', color:h?GOLD:WHITE, border:`1px solid ${h?GOLD:GRAY3}`}}>{children}</button>
  return <button disabled={disabled} onClick={onClick} style={{...base, background:'transparent', border:'none', color:DIM, fontSize:20}}>{children}</button>
}

// ── MODAL ─────────────────────────────────
function Modal({ open, onClose, title, children, wide=false }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:GRAY,border:`1px solid rgba(245,197,24,0.18)`,borderRadius:14,padding:'26px 24px',width:'100%',maxWidth:wide?500:460,maxHeight:'92vh',overflowY:'auto',animation:'popIn 0.18s ease'}}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{fontSize:24,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:GOLD,marginBottom:20}}>{title}</div>
        {children}
      </div>
    </div>
  )
}

// ── FIELD ─────────────────────────────────
function Field({ label, children }) {
  return <div style={{marginBottom:14}}><label style={S.label}>{label}</label>{children}</div>
}

// ── TOAST ─────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  return <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:GOLD,color:BLACK,fontWeight:700,fontSize:13,padding:'10px 22px',borderRadius:30,zIndex:999,pointerEvents:'none',whiteSpace:'nowrap'}}>{msg}</div>
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [view, setView]           = useState('landing')   // landing | password | ops | coach
  const [coaches, setCoaches]     = useState([])
  const [sessions, setSessions]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState('')
  const [opsDate, setOpsDate]     = useState(todayAtMidnight)
  const [activeCoach, setActive]  = useState(null)
  const [pwError, setPwError]     = useState('')
  const [pwVal, setPwVal]         = useState('')

  // Modals
  const [soloOpen,   setSoloOpen]   = useState(false)
  const [groupOpen,  setGroupOpen]  = useState(false)
  const [coachOpen,  setCoachOpen]  = useState(false)

  // Forms
  const blankSolo  = { client:'', date:'', time:'', dur:'60', coachId:'', notes:'' }
  const blankGroup = { name:'', repeat:'weekly', dow:'1', date:'', time:'', dur:'60', coachId:'' }
  const blankNew   = { name:'', role:'mixed' }
  const [soloF,  setSoloF]  = useState(blankSolo)
  const [groupF, setGroupF] = useState(blankGroup)
  const [newC,   setNewC]   = useState(blankNew)

  // ── FIREBASE SYNC ──
  useEffect(() => {
    const coachRef   = ref(db, 'coaches')
    const sessionRef = ref(db, 'sessions')
    let coachDone = false, sessDone = false
    const unsub1 = onValue(coachRef,   snap => { setCoaches(objToArr(snap.val()));   coachDone=true; if(sessDone) setLoading(false) })
    const unsub2 = onValue(sessionRef, snap => { setSessions(objToArr(snap.val())); sessDone=true;  if(coachDone) setLoading(false) })
    return () => { unsub1(); unsub2() }
  }, [])

  function objToArr(obj) {
    if (!obj) return []
    return Object.entries(obj).map(([id, val]) => ({ ...val, id }))
  }

  // ── TOAST ──
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(t)
  }, [toast])

  // ── SESSION HELPERS ──
  function getSessionsForCoach(coachId, date) {
    const dk  = dateKey(date)
    const dow = date.getDay()
    return sessions.filter(s => {
      if (s.coachId !== coachId) return false
      if (s.type === 'solo')     return s.date === dk
      if (s.repeat === 'weekly') return s.dow === dow
      if (s.repeat === 'once')   return s.date === dk
      return false
    }).sort((a,b) => a.time > b.time ? 1 : -1)
  }

  function eligibleCoaches(roles) { return coaches.filter(c => roles.includes(c.role)) }

  // ── FIREBASE WRITES ──
  async function saveSolo() {
    if (!soloF.client || !soloF.date || !soloF.time || !soloF.coachId) { setToast('Fill in all required fields'); return }
    await push(ref(db,'sessions'), { type:'solo', clientName:soloF.client, date:soloF.date, time:soloF.time, duration:parseInt(soloF.dur), coachId:soloF.coachId, notes:soloF.notes, repeat:'once' })
    setSoloOpen(false); setSoloF(blankSolo); setToast('1-on-1 assigned ✓')
  }

  async function saveGroup() {
    if (!groupF.name || !groupF.time || !groupF.coachId) { setToast('Fill in all required fields'); return }
    if (groupF.repeat==='once' && !groupF.date) { setToast('Pick a date'); return }
    const sess = { type:'group', name:groupF.name, time:groupF.time, duration:parseInt(groupF.dur), coachId:groupF.coachId, repeat:groupF.repeat }
    if (groupF.repeat==='weekly') sess.dow = parseInt(groupF.dow)
    else sess.date = groupF.date
    await push(ref(db,'sessions'), sess)
    setGroupOpen(false); setGroupF(blankGroup); setToast('Group session added ✓')
  }

  async function addCoach() {
    if (!newC.name.trim()) { setToast('Enter a coach name'); return }
    await push(ref(db,'coaches'), { name:newC.name.trim(), role:newC.role })
    setNewC(blankNew); setToast(`${newC.name.trim()} added ✓`)
  }

  async function removeCoach(id) {
    await remove(ref(db,`coaches/${id}`))
    // remove their sessions too
    const toRemove = sessions.filter(s => s.coachId === id)
    await Promise.all(toRemove.map(s => remove(ref(db,`sessions/${s.id}`))))
    if (activeCoach === id) setActive(null)
    setToast('Coach removed')
  }

  async function removeSession(id) {
    await remove(ref(db,`sessions/${id}`))
    setToast('Session removed')
  }

  // ── PASSWORD ──
  function checkPassword() {
    if (pwVal === PASSWORD) { setPwError(''); setPwVal(''); setView('ops') }
    else { setPwError('Incorrect password. Try again.'); setPwVal('') }
  }

  // ══════════════════════════════════════════
  // LANDING
  // ══════════════════════════════════════════
  if (view === 'landing') return (
    <div style={{...S.page, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', textAlign:'center'}}>
      <div style={{fontSize:54,fontWeight:900,letterSpacing:6,textTransform:'uppercase',color:GOLD,lineHeight:1}}>SHANKLY</div>
      <div style={{fontSize:11,letterSpacing:4,textTransform:'uppercase',color:DIM,margin:'6px 0 52px'}}>Elite Training · Schedule</div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',maxWidth:540,width:'100%'}}>
        <LandingCard icon="⚡" title="OPS VIEW" desc="Assign sessions, manage coaches, see the full day" onClick={() => setView('password')} />
        <LandingCard icon="📋" title="COACH VIEW" desc="See your personal schedule for today and the week ahead" onClick={() => setView('coach')} />
      </div>
    </div>
  )

  // ══════════════════════════════════════════
  // PASSWORD
  // ══════════════════════════════════════════
  if (view === 'password') return (
    <div style={{...S.page, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', textAlign:'center'}}>
      <div style={{fontSize:38,fontWeight:900,letterSpacing:5,textTransform:'uppercase',color:GOLD,marginBottom:4}}>SHANKLY</div>
      <div style={{fontSize:10,letterSpacing:3,textTransform:'uppercase',color:DIM,marginBottom:40}}>Ops Access</div>
      <div style={{background:GRAY,border:`1px solid rgba(245,197,24,0.18)`,borderRadius:14,padding:'32px 28px',width:'100%',maxWidth:360}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Staff Only</div>
        <div style={{fontSize:12,color:DIM,marginBottom:22}}>Enter the ops password to continue</div>
        <input
          style={{...S.input, marginBottom:12, letterSpacing:2, textAlign:'center', fontSize:16}}
          type="password" placeholder="••••••••••"
          value={pwVal} onChange={e=>setPwVal(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&checkPassword()}
          autoFocus
        />
        {pwError && <div style={{fontSize:12,color:RED,marginBottom:12}}>{pwError}</div>}
        <Btn gold onClick={checkPassword} style={{width:'100%',padding:12,fontSize:14}}>Enter</Btn>
        <div onClick={()=>{setView('landing');setPwError('');setPwVal('')}} style={{fontSize:12,color:DIM,cursor:'pointer',marginTop:16,textDecoration:'underline'}}>← Back</div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════
  // OPS VIEW
  // ══════════════════════════════════════════
  if (view === 'ops') return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{display:'flex',alignItems:'baseline'}}>
          <span style={S.brand}>SHANKLY</span>
          <span style={S.tag}>Ops</span>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <Btn outline onClick={()=>setCoachOpen(true)}>Manage Coaches</Btn>
          <Btn outline onClick={()=>{ setGroupF({...blankGroup, coachId: eligibleCoaches(['group','mixed'])[0]?.id||''}); setGroupOpen(true) }}>+ Group</Btn>
          <Btn gold   onClick={()=>{ setSoloF({...blankSolo, date:dateKey(opsDate), coachId: eligibleCoaches(['solo','mixed'])[0]?.id||''}); setSoloOpen(true) }}>+ Assign 1-on-1</Btn>
          <Btn onClick={()=>setView('landing')} style={{fontSize:20,color:DIM}} title="Home">⌂</Btn>
        </div>
      </div>

      <div style={{padding:'18px 16px'}}>
        {/* Date Nav */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          <NavBtn onClick={()=>{ const d=new Date(opsDate); d.setDate(d.getDate()-1); setOpsDate(d) }}>‹</NavBtn>
          <span style={{fontSize:21,fontWeight:900,letterSpacing:1,textTransform:'uppercase'}}>{fmtLong(opsDate)}</span>
          {isToday(opsDate) && <span style={{background:GOLD,color:BLACK,fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',padding:'3px 10px',borderRadius:20}}>Today</span>}
          <NavBtn onClick={()=>{ const d=new Date(opsDate); d.setDate(d.getDate()+1); setOpsDate(d) }}>›</NavBtn>
          <Btn outline onClick={()=>setOpsDate(todayAtMidnight())} style={{fontSize:11,padding:'6px 11px'}}>Jump to Today</Btn>
        </div>

        {/* Legend */}
        <div style={{display:'flex',gap:16,marginBottom:14}}>
          {[[GOLD,'Group'],[BLUE,'1-on-1']].map(([c,l])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:DIM}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:c}}/>{l}
            </div>
          ))}
        </div>

        {/* Coach Grid */}
        {loading ? <Spinner/> : coaches.length === 0
          ? <div style={{textAlign:'center',padding:'60px 20px',color:DIM}}>No coaches yet. Click <strong style={{color:GOLD}}>Manage Coaches</strong> to add your team.</div>
          : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
              {coaches.map(coach => {
                const sess = getSessionsForCoach(coach.id, opsDate)
                const tagStyle = coach.role==='group' ? {background:'rgba(245,197,24,0.13)',color:GOLD} : coach.role==='solo' ? {background:'rgba(79,195,247,0.13)',color:BLUE} : {background:'rgba(129,199,132,0.13)',color:GREEN}
                const tagText  = coach.role==='group' ? 'GRP' : coach.role==='solo' ? '1:1' : 'MIX'
                return (
                  <div key={coach.id} style={{background:GRAY,borderRadius:10,border:`1px solid ${GRAY2}`,overflow:'hidden'}}>
                    <div style={{padding:'10px 13px',borderBottom:`1px solid ${GRAY2}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                      <div style={{fontWeight:700,fontSize:13}}>{coach.name}</div>
                      <span style={{fontSize:9,fontWeight:800,letterSpacing:1,padding:'2px 7px',borderRadius:4,...tagStyle}}>{tagText}</span>
                    </div>
                    <div style={{padding:9}}>
                      {sess.length===0
                        ? <div style={{fontSize:11,color:GRAY3,textAlign:'center',padding:'14px 0'}}>No sessions</div>
                        : sess.map(s=>(
                          <div key={s.id} style={{background:GRAY2,borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,position:'relative'}}>
                            <div style={{fontSize:15,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                            <div style={{fontSize:11,color:DIM,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'calc(100% - 20px)'}}>
                              {s.type==='solo'?`1:1 · ${s.clientName}`:s.name}
                            </div>
                            <button onClick={()=>removeSession(s.id)} style={{position:'absolute',top:5,right:6,background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:15,lineHeight:1,padding:0,transition:'color 0.15s'}}
                              onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=GRAY3}>×</button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* ── Assign 1-on-1 Modal ── */}
      <Modal open={soloOpen} onClose={()=>setSoloOpen(false)} title="Assign 1-on-1">
        <Field label="Client Name *"><input style={S.input} value={soloF.client} onChange={e=>setSoloF(f=>({...f,client:e.target.value}))} placeholder="e.g. Marcus Johnson"/></Field>
        <Field label="Date *"><input type="date" style={S.input} value={soloF.date} onChange={e=>setSoloF(f=>({...f,date:e.target.value}))}/></Field>
        <Field label="Time *"><input type="time" style={S.input} value={soloF.time} onChange={e=>setSoloF(f=>({...f,time:e.target.value}))}/></Field>
        <Field label="Duration">
          <select style={S.input} value={soloF.dur} onChange={e=>setSoloF(f=>({...f,dur:e.target.value}))}>
            <option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option>
          </select>
        </Field>
        <Field label="Assign Coach *">
          <select style={S.input} value={soloF.coachId} onChange={e=>setSoloF(f=>({...f,coachId:e.target.value}))}>
            {eligibleCoaches(['solo','mixed']).length===0
              ? <option value="">No eligible coaches</option>
              : eligibleCoaches(['solo','mixed']).map(c=><option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
        </Field>
        <Field label="Notes (optional)"><input style={S.input} value={soloF.notes} onChange={e=>setSoloF(f=>({...f,notes:e.target.value}))} placeholder="e.g. GK focus, bring pinnies"/></Field>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
          <Btn outline onClick={()=>setSoloOpen(false)}>Cancel</Btn>
          <Btn gold onClick={saveSolo}>Assign Session</Btn>
        </div>
      </Modal>

      {/* ── Add Group Modal ── */}
      <Modal open={groupOpen} onClose={()=>setGroupOpen(false)} title="Add Group Session">
        <Field label="Session Name *"><input style={S.input} value={groupF.name} onChange={e=>setGroupF(f=>({...f,name:e.target.value}))} placeholder="e.g. U12 Technical Training"/></Field>
        <Field label="Repeats">
          <select style={S.input} value={groupF.repeat} onChange={e=>setGroupF(f=>({...f,repeat:e.target.value}))}>
            <option value="weekly">Weekly (all summer)</option>
            <option value="once">One time only</option>
          </select>
        </Field>
        {groupF.repeat==='weekly'
          ? <Field label="Day of Week">
              <select style={S.input} value={groupF.dow} onChange={e=>setGroupF(f=>({...f,dow:e.target.value}))}>
                {DAYS.map((d,i)=><option key={d} value={i}>{d}</option>)}
              </select>
            </Field>
          : <Field label="Date *"><input type="date" style={S.input} value={groupF.date} onChange={e=>setGroupF(f=>({...f,date:e.target.value}))}/></Field>
        }
        <Field label="Time *"><input type="time" style={S.input} value={groupF.time} onChange={e=>setGroupF(f=>({...f,time:e.target.value}))}/></Field>
        <Field label="Duration">
          <select style={S.input} value={groupF.dur} onChange={e=>setGroupF(f=>({...f,dur:e.target.value}))}>
            <option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option>
          </select>
        </Field>
        <Field label="Assign Coach *">
          <select style={S.input} value={groupF.coachId} onChange={e=>setGroupF(f=>({...f,coachId:e.target.value}))}>
            {eligibleCoaches(['group','mixed']).length===0
              ? <option value="">No eligible coaches</option>
              : eligibleCoaches(['group','mixed']).map(c=><option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
        </Field>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
          <Btn outline onClick={()=>setGroupOpen(false)}>Cancel</Btn>
          <Btn gold onClick={saveGroup}>Add Session</Btn>
        </div>
      </Modal>

      {/* ── Manage Coaches Modal ── */}
      <Modal open={coachOpen} onClose={()=>setCoachOpen(false)} title="Manage Coaches" wide>
        <div style={{maxHeight:260,overflowY:'auto',marginBottom:16}}>
          {coaches.length===0
            ? <div style={{color:DIM,fontSize:13,textAlign:'center',padding:20}}>No coaches yet</div>
            : coaches.map(c=>(
              <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:BLACK,borderRadius:7,marginBottom:6,border:`1px solid ${GRAY2}`,gap:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                  <div style={{fontSize:11,color:DIM,marginTop:2}}>{roleLabel(c.role)}</div>
                </div>
                <button onClick={()=>removeCoach(c.id)} style={{background:'transparent',border:`1px solid #922`,color:RED,fontSize:11,padding:'4px 10px',borderRadius:5,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.target.style.background='#922';e.target.style.color='#fff'}}
                  onMouseLeave={e=>{e.target.style.background='transparent';e.target.style.color=RED}}>Remove</button>
              </div>
            ))
          }
        </div>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:DIM,marginBottom:10}}>Add New Coach</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',borderTop:`1px solid ${GRAY3}`,paddingTop:16}}>
          <input style={{...S.input,flex:1,minWidth:130}} placeholder="Coach name" value={newC.name}
            onChange={e=>setNewC(n=>({...n,name:e.target.value}))}
            onKeyDown={e=>e.key==='Enter'&&addCoach()}/>
          <select style={{...S.input,flex:1,minWidth:160}} value={newC.role} onChange={e=>setNewC(n=>({...n,role:e.target.value}))}>
            <option value="mixed">Mixed (Groups + 1-on-1s)</option>
            <option value="group">Groups Only</option>
            <option value="solo">1-on-1s Only</option>
          </select>
          <Btn gold onClick={addCoach}>Add</Btn>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}>
          <Btn outline onClick={()=>setCoachOpen(false)}>Done</Btn>
        </div>
      </Modal>

      <Toast msg={toast}/>
    </div>
  )

  // ══════════════════════════════════════════
  // COACH VIEW
  // ══════════════════════════════════════════
  const currentCoach = coaches.find(c => c.id === activeCoach)
  const next7 = getNext7()

  return (
    <div style={{...S.page, display:'flex', flexDirection:'column'}}>
      {/* Header */}
      <div style={{...S.header, flexDirection:'column', alignItems:'flex-start', gap:2}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
          <div style={{display:'flex',alignItems:'baseline'}}>
            <span style={S.brand}>SHANKLY</span>
            <span style={S.tag}>Schedule</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:11,color:DIM}}>{new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
            <Btn onClick={()=>setView('landing')} style={{fontSize:20,color:DIM}}>⌂</Btn>
          </div>
        </div>
        {currentCoach
          ? <div style={{marginTop:4}}>
              <div style={{fontSize:30,fontWeight:900,letterSpacing:1,textTransform:'uppercase',lineHeight:1}}>{currentCoach.name}</div>
              <span style={{display:'inline-block',fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',padding:'3px 9px',borderRadius:4,marginTop:5,...roleBadgeStyle(currentCoach.role)}}>{roleLabel(currentCoach.role)}</span>
            </div>
          : <div style={{fontSize:13,color:DIM,marginTop:4}}>Select your name below</div>
        }
      </div>

      {/* Sessions */}
      <div style={{flex:1,padding:'18px 16px',overflowY:'auto'}}>
        {loading ? <Spinner/> : !currentCoach
          ? <div style={{textAlign:'center',padding:'60px 20px',color:DIM}}>Select your name below to see your schedule</div>
          : next7.map(day => {
              const sess = getSessionsForCoach(currentCoach.id, day)
              const today = isToday(day)
              return (
                <div key={dateKey(day)} style={{marginBottom:26}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:today?GOLD:DIM,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${today?'rgba(245,197,24,0.25)':GRAY2}`}}>
                    {today ? 'Today' : fmtLong(day)}
                  </div>
                  {sess.length===0
                    ? <div style={{fontSize:12,color:GRAY3,textAlign:'center',padding:'16px 0'}}>No sessions scheduled</div>
                    : sess.map(s=>(
                      <div key={s.id} style={{background:GRAY,borderRadius:9,padding:'13px 15px',marginBottom:8,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,display:'flex',alignItems:'flex-start',gap:14}}>
                        <div>
                          <div style={{fontSize:21,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                          <div style={{fontSize:10,color:DIM,marginTop:3}}>{s.duration}min</div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                          <div style={{fontSize:11,color:DIM}}>{s.type==='solo'?(s.notes||'No notes'):`Group Session · ${s.duration}min`}</div>
                        </div>
                        <div style={{width:8,height:8,borderRadius:'50%',marginTop:5,flexShrink:0,background:s.type==='solo'?BLUE:GOLD}}/>
                      </div>
                    ))
                  }
                </div>
              )
            })
        }
      </div>

      {/* Coach Picker */}
      <div style={{background:GRAY,borderTop:`1px solid rgba(245,197,24,0.18)`,padding:'12px 16px',position:'sticky',bottom:0}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:DIM,marginBottom:8}}>Select Coach</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {coaches.length===0
            ? <span style={{fontSize:12,color:DIM}}>No coaches added yet</span>
            : coaches.map(c=>(
              <button key={c.id} onClick={()=>setActive(c.id)}
                style={{background:activeCoach===c.id?GOLD:GRAY2, border:`1px solid ${activeCoach===c.id?GOLD:GRAY3}`, color:activeCoach===c.id?BLACK:WHITE, fontSize:12, padding:'5px 12px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontWeight:activeCoach===c.id?700:500, transition:'all 0.15s'}}>
                {c.name.replace('Coach ','')}
              </button>
            ))
          }
        </div>
      </div>

      <Toast msg={toast}/>
    </div>
  )
}

// ── SMALL COMPONENTS ──────────────────────
function LandingCard({ icon, title, desc, onClick }) {
  const [h, setH] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?'#1f1f1f':GRAY, border:`1px solid ${h?GOLD:GRAY3}`, borderRadius:16, padding:'36px 28px', flex:1, minWidth:200, cursor:'pointer', transition:'all 0.2s', textAlign:'center', transform:h?'translateY(-4px)':'none'}}>
      <div style={{fontSize:34,marginBottom:14}}>{icon}</div>
      <div style={{fontSize:20,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:GOLD,marginBottom:8}}>{title}</div>
      <div style={{fontSize:12,color:DIM,lineHeight:1.6}}>{desc}</div>
    </div>
  )
}

function NavBtn({ onClick, children }) {
  const [h,setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:GRAY2, border:`1px solid ${h?GOLD:GRAY3}`, color:h?GOLD:WHITE, width:34, height:34, borderRadius:7, cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s'}}>
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 20px'}}>
      <div style={{width:28,height:28,border:`3px solid ${GRAY3}`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
