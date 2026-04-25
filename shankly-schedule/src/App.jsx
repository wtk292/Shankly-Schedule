import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { ref, onValue, push, remove } from 'firebase/database'

// ── CONSTANTS ──────────────────────────────
const PASSWORD = 'Shankly2026'
const GOLD  = '#F5C518'
const BLACK = '#0a0a0a'
const GRAY  = '#1a1a1a'
const GRAY2 = '#242424'
const GRAY3 = '#333'
const WHITE = '#f0ede6'
const DIM   = '#666'
const BLUE  = '#4fc3f7'
const GREEN = '#81c784'
const RED   = '#e74c3c'
const PURPLE = '#ce93d8'

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── HELPERS ───────────────────────────────
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function isToday(d) {
  const t = new Date(); t.setHours(0,0,0,0)
  return new Date(d).setHours(0,0,0,0) === t.getTime()
}
function fmtLong(d) { return `${DAYS_FULL[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}` }
function fmt12(t) {
  if (!t) return ''
  const [h,m] = t.split(':').map(Number)
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`
}
function todayMidnight() { const d = new Date(); d.setHours(0,0,0,0); return d }
function getNext7() {
  const today = todayMidnight()
  return Array.from({length:7}, (_,i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d })
}
function getDaysInMonth(year, month) { return new Date(year, month+1, 0).getDate() }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay() }
function roleLabel(r) { return r==='group' ? 'Groups Only' : r==='solo' ? '1-on-1s Only' : 'Groups + 1-on-1s' }
function roleBadgeStyle(r) {
  if (r==='group') return { background:'rgba(245,197,24,0.13)', color:GOLD }
  if (r==='solo')  return { background:'rgba(79,195,247,0.13)',  color:BLUE }
  return { background:'rgba(129,199,132,0.13)', color:GREEN }
}
function objToArr(obj) {
  if (!obj) return []
  return Object.entries(obj).map(([id, val]) => ({ ...val, id }))
}

// ── SHARED STYLES ─────────────────────────
const inp = { width:'100%', background:BLACK, border:`1px solid ${GRAY3}`, borderRadius:7, color:WHITE, fontFamily:'inherit', fontSize:14, padding:'10px 12px', outline:'none', WebkitAppearance:'none', appearance:'none', boxSizing:'border-box' }
const lbl = { display:'block', fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:DIM, marginBottom:6 }

// ── BUTTON ────────────────────────────────
function Btn({ gold, outline, danger, onClick, children, style={}, disabled=false }) {
  const [h, setH] = useState(false)
  const base = { fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:7, cursor:disabled?'not-allowed':'pointer', border:'none', letterSpacing:0.3, transition:'all 0.15s', fontFamily:'inherit', whiteSpace:'nowrap', opacity:disabled?0.5:1, ...style }
  if (gold)    return <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base, background:h?'#ffd740':GOLD, color:BLACK}}>{children}</button>
  if (danger)  return <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base, background:h?'#922':'transparent', color:h?WHITE:RED, border:`1px solid #922`}}>{children}</button>
  if (outline) return <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base, background:'transparent', color:h?GOLD:WHITE, border:`1px solid ${h?GOLD:GRAY3}`}}>{children}</button>
  return <button disabled={disabled} onClick={onClick} style={{...base, background:'transparent', border:'none', color:DIM}}>{children}</button>
}

// ── HOME BUTTON ───────────────────────────
function HomeBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:h?GOLD:'rgba(245,197,24,0.12)', border:`1px solid ${h?GOLD:'rgba(245,197,24,0.3)'}`, color:h?BLACK:GOLD, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13, fontWeight:700, letterSpacing:1, transition:'all 0.15s', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
      ⌂ <span style={{fontSize:11}}>Home</span>
    </button>
  )
}

// ── MODAL ─────────────────────────────────
function Modal({ open, onClose, title, children, wide=false }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:GRAY,border:`1px solid rgba(245,197,24,0.2)`,borderRadius:14,padding:'26px 24px',width:'100%',maxWidth:wide?500:460,maxHeight:'92vh',overflowY:'auto',animation:'popIn 0.18s ease'}}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{fontSize:22,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:GOLD,marginBottom:20}}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <div style={{marginBottom:14}}><label style={lbl}>{label}</label>{children}</div>
}

function Toast({ msg }) {
  if (!msg) return null
  return <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:GOLD,color:BLACK,fontWeight:700,fontSize:13,padding:'10px 22px',borderRadius:30,zIndex:999,pointerEvents:'none',whiteSpace:'nowrap',animation:'fadeUp 0.2s ease'}}>{msg}</div>
}

// ── CALENDAR COMPONENT ────────────────────
function MonthCalendar({ year, month, onDayClick, getDayDots, selectedDay }) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const cells = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const today = new Date()

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4}}>
        {DAYS.map(d => <div key={d} style={{textAlign:'center', fontSize:10, fontWeight:700, letterSpacing:1, color:DIM, padding:'4px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2}}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`}/>
          const thisDate = new Date(year, month, day)
          const dk = dateKey(thisDate)
          const isTodayDay = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day
          const isSelected = selectedDay && dateKey(selectedDay) === dk
          const dots = getDayDots ? getDayDots(dk) : []

          return (
            <div key={day} onClick={()=>onDayClick&&onDayClick(thisDate)}
              style={{
                aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                borderRadius:8, cursor:'pointer', transition:'all 0.15s', gap:2,
                background: isSelected ? GOLD : isTodayDay ? 'rgba(245,197,24,0.15)' : 'transparent',
                border: isTodayDay && !isSelected ? `1px solid rgba(245,197,24,0.4)` : '1px solid transparent',
              }}>
              <span style={{fontSize:13, fontWeight:isTodayDay||isSelected?700:400, color:isSelected?BLACK:isTodayDay?GOLD:WHITE, lineHeight:1}}>{day}</span>
              {dots.length>0 && (
                <div style={{display:'flex', gap:2}}>
                  {dots.slice(0,3).map((c,idx)=><div key={idx} style={{width:4,height:4,borderRadius:'50%',background:isSelected?BLACK:c}}/>)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function App() {
  const [view, setView]         = useState('landing')
  const [coaches, setCoaches]   = useState([])
  const [sessions, setSessions] = useState([])
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')
  const [opsDate, setOpsDate]   = useState(todayMidnight)
  const [activeCoach, setActive]= useState(null)
  const [pwError, setPwError]   = useState('')
  const [pwVal, setPwVal]       = useState('')

  // calendar state
  const now = new Date()
  const [opsCalView, setOpsCalView]     = useState('list')   // list | calendar
  const [coachCalView, setCoachCalView] = useState('list')
  const [opsCalMonth, setOpsCalMonth]   = useState({ year:now.getFullYear(), month:now.getMonth() })
  const [coachCalMonth, setCoachCalMonth] = useState({ year:now.getFullYear(), month:now.getMonth() })
  const [opsSelDay, setOpsSelDay]       = useState(null)
  const [coachSelDay, setCoachSelDay]   = useState(null)
  const [facCalMonth, setFacCalMonth]   = useState({ year:now.getFullYear(), month:now.getMonth() })
  const [facSelDay, setFacSelDay]       = useState(null)

  // modals
  const [soloOpen,  setSoloOpen]  = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [dayDetailDate, setDayDetailDate] = useState(null)
  const [dayDetailCoach, setDayDetailCoach] = useState(null)

  // forms
  const blankSolo  = { client:'', date:'', time:'', dur:'60', coachId:'', notes:'' }
  const blankGroup = { name:'', repeat:'weekly', dow:'1', date:'', time:'', dur:'60', coachId:'' }
  const blankNew   = { name:'', role:'mixed' }
  const blankEvent = { title:'', date:'', startTime:'', endTime:'', coachIds:[], brand:'both' }
  const [soloF,  setSoloF]  = useState(blankSolo)
  const [groupF, setGroupF] = useState(blankGroup)
  const [newC,   setNewC]   = useState(blankNew)
  const [eventF, setEventF] = useState(blankEvent)

  // ── FIREBASE SYNC ──
  useEffect(() => {
    let d1=false,d2=false,d3=false
    const check = () => { if(d1&&d2&&d3) setLoading(false) }
    const u1 = onValue(ref(db,'coaches'),   snap => { setCoaches(objToArr(snap.val()));   d1=true; check() })
    const u2 = onValue(ref(db,'sessions'),  snap => { setSessions(objToArr(snap.val()));  d2=true; check() })
    const u3 = onValue(ref(db,'facEvents'), snap => { setEvents(objToArr(snap.val()));    d3=true; check() })
    return () => { u1(); u2(); u3() }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(t)
  }, [toast])

  // ── SESSION HELPERS ──
  function getSessionsForCoach(coachId, date) {
    const dk = dateKey(date), dow = date.getDay()
    return sessions.filter(s => {
      if (s.coachId !== coachId) return false
      if (s.type==='solo') return s.date===dk
      if (s.repeat==='weekly') return s.dow===dow
      if (s.repeat==='once') return s.date===dk
      return false
    }).sort((a,b)=>a.time>b.time?1:-1)
  }

  function getAllSessionsOnDate(date) {
    const dk = dateKey(date), dow = date.getDay()
    return sessions.filter(s => {
      if (s.type==='solo') return s.date===dk
      if (s.repeat==='weekly') return s.dow===dow
      if (s.repeat==='once') return s.date===dk
      return false
    })
  }

  function getEventsOnDate(dk) {
    return events.filter(e => e.date === dk)
  }

  function eligibleCoaches(roles) { return coaches.filter(c=>roles.includes(c.role)) }

  function getOpsDayDots(dk) {
    const date = new Date(dk+'T00:00:00')
    const sess = getAllSessionsOnDate(date)
    const evts = getEventsOnDate(dk)
    const dots = []
    if (sess.some(s=>s.type==='group')) dots.push(GOLD)
    if (sess.some(s=>s.type==='solo'))  dots.push(BLUE)
    if (evts.length>0) dots.push(PURPLE)
    return dots
  }

  function getCoachDayDots(dk, coachId) {
    const date = new Date(dk+'T00:00:00')
    const sess = getSessionsForCoach(coachId, date)
    const dots = []
    if (sess.some(s=>s.type==='group')) dots.push(GOLD)
    if (sess.some(s=>s.type==='solo'))  dots.push(BLUE)
    return dots
  }

  function getFacDayDots(dk) {
    const evts = getEventsOnDate(dk)
    return evts.length > 0 ? [PURPLE] : []
  }

  // ── FIREBASE WRITES ──
  async function saveSolo() {
    if (!soloF.client||!soloF.date||!soloF.time||!soloF.coachId) { setToast('Fill in all required fields'); return }
    await push(ref(db,'sessions'), { type:'solo', clientName:soloF.client, date:soloF.date, time:soloF.time, duration:parseInt(soloF.dur), coachId:soloF.coachId, notes:soloF.notes, repeat:'once' })
    setSoloOpen(false); setSoloF(blankSolo); setToast('1-on-1 assigned ✓')
  }

  async function saveGroup() {
    if (!groupF.name||!groupF.time||!groupF.coachId) { setToast('Fill in all required fields'); return }
    if (groupF.repeat==='once'&&!groupF.date) { setToast('Pick a date'); return }
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
    await Promise.all(sessions.filter(s=>s.coachId===id).map(s=>remove(ref(db,`sessions/${s.id}`))))
    if (activeCoach===id) setActive(null)
    setToast('Coach removed')
  }

  async function removeSession(id) {
    await remove(ref(db,`sessions/${id}`))
    setToast('Session removed')
  }

  async function saveEvent() {
    if (!eventF.title||!eventF.date||!eventF.startTime) { setToast('Fill in required fields'); return }
    await push(ref(db,'facEvents'), { title:eventF.title, date:eventF.date, startTime:eventF.startTime, endTime:eventF.endTime, coachIds:eventF.coachIds, brand:eventF.brand })
    setEventOpen(false); setEventF(blankEvent); setToast('Facility event added ✓')
  }

  async function removeEvent(id) {
    await remove(ref(db,`facEvents/${id}`))
    setToast('Event removed')
  }

  // ── PASSWORD ──
  function checkPassword() {
    if (pwVal===PASSWORD) { setPwError(''); setPwVal(''); setView('ops') }
    else { setPwError('Incorrect password. Try again.'); setPwVal('') }
  }

  // ── CALENDAR HELPERS ──
  function changeMonth(cur, dir, setter) {
    let { year, month } = cur
    month += dir
    if (month > 11) { month=0; year++ }
    if (month < 0)  { month=11; year-- }
    setter({ year, month })
  }

  function openDayDetail(date, coachId=null) {
    setDayDetailDate(date)
    setDayDetailCoach(coachId)
    setDayDetailOpen(true)
  }

  // ══════════════════════════════════════════
  // LANDING
  // ══════════════════════════════════════════
  if (view==='landing') return (
    <div style={{minHeight:'100vh',background:BLACK,color:WHITE,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 20px',textAlign:'center'}}>
      <div style={{fontSize:52,fontWeight:900,letterSpacing:6,textTransform:'uppercase',color:GOLD,lineHeight:1}}>SHANKLY</div>
      <div style={{fontSize:11,letterSpacing:4,textTransform:'uppercase',color:DIM,margin:'6px 0 48px'}}>Elite Training · Schedule</div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',maxWidth:600,width:'100%'}}>
        <LandingCard icon="⚡" title="OPS VIEW"      desc="Assign sessions, manage coaches, full schedule control" onClick={()=>setView('password')} />
        <LandingCard icon="📋" title="COACH VIEW"    desc="See your personal schedule for the week ahead"         onClick={()=>setView('coach')} />
        <LandingCard icon="🏟️" title="FACILITY"      desc="See what's happening at Goalz & Shankly this month"   onClick={()=>setView('facility')} />
      </div>
    </div>
  )

  // ══════════════════════════════════════════
  // PASSWORD
  // ══════════════════════════════════════════
  if (view==='password') return (
    <div style={{minHeight:'100vh',background:BLACK,color:WHITE,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,fontWeight:900,letterSpacing:5,textTransform:'uppercase',color:GOLD,marginBottom:4}}>SHANKLY</div>
      <div style={{fontSize:10,letterSpacing:3,textTransform:'uppercase',color:DIM,marginBottom:36}}>Ops Access</div>
      <div style={{background:GRAY,border:`1px solid rgba(245,197,24,0.2)`,borderRadius:14,padding:'32px 28px',width:'100%',maxWidth:360}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Staff Only</div>
        <div style={{fontSize:12,color:DIM,marginBottom:22}}>Enter the ops password to continue</div>
        <input style={{...inp,marginBottom:12,letterSpacing:3,textAlign:'center',fontSize:16}} type="password" placeholder="••••••••••"
          value={pwVal} onChange={e=>setPwVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkPassword()} autoFocus/>
        {pwError && <div style={{fontSize:12,color:RED,marginBottom:12}}>{pwError}</div>}
        <Btn gold onClick={checkPassword} style={{width:'100%',padding:12,fontSize:14}}>Enter</Btn>
        <div onClick={()=>{setView('landing');setPwError('');setPwVal('')}} style={{fontSize:12,color:DIM,cursor:'pointer',marginTop:16,textDecoration:'underline'}}>← Back to Home</div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════
  // OPS VIEW
  // ══════════════════════════════════════════
  if (view==='ops') {
    const displaySessions = opsCalView==='list'
      ? null
      : (opsSelDay ? getAllSessionsOnDate(opsSelDay) : [])

    return (
      <div style={{minHeight:'100vh',background:BLACK,color:WHITE,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
        {/* Header */}
        <div style={{background:BLACK,borderBottom:`1px solid rgba(245,197,24,0.18)`,padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:GOLD}}>SHANKLY</span>
            <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:DIM}}>Ops</span>
          </div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
            <Btn outline onClick={()=>setCoachOpen(true)}>Manage Coaches</Btn>
            <Btn outline onClick={()=>{ setGroupF({...blankGroup,coachId:eligibleCoaches(['group','mixed'])[0]?.id||''}); setGroupOpen(true) }}>+ Group</Btn>
            <Btn gold   onClick={()=>{ setSoloF({...blankSolo,date:dateKey(opsDate),coachId:eligibleCoaches(['solo','mixed'])[0]?.id||''}); setSoloOpen(true) }}>+ 1-on-1</Btn>
            <HomeBtn onClick={()=>setView('landing')}/>
          </div>
        </div>

        <div style={{padding:'16px 16px'}}>
          {/* View Toggle */}
          <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
            <ToggleBtn active={opsCalView==='list'}     onClick={()=>setOpsCalView('list')}>☰ List</ToggleBtn>
            <ToggleBtn active={opsCalView==='calendar'} onClick={()=>setOpsCalView('calendar')}>📅 Calendar</ToggleBtn>

            {opsCalView==='list' && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexWrap:'wrap'}}>
                <NavBtn onClick={()=>{ const d=new Date(opsDate); d.setDate(d.getDate()-1); setOpsDate(d) }}>‹</NavBtn>
                <span style={{fontSize:16,fontWeight:800,textTransform:'uppercase',letterSpacing:0.5}}>{fmtLong(opsDate)}</span>
                {isToday(opsDate) && <span style={{background:GOLD,color:BLACK,fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',padding:'2px 8px',borderRadius:20}}>Today</span>}
                <NavBtn onClick={()=>{ const d=new Date(opsDate); d.setDate(d.getDate()+1); setOpsDate(d) }}>›</NavBtn>
                <Btn outline onClick={()=>setOpsDate(todayMidnight())} style={{fontSize:10,padding:'5px 10px'}}>Today</Btn>
              </div>
            )}

            {opsCalView==='calendar' && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
                <NavBtn onClick={()=>changeMonth(opsCalMonth,-1,setOpsCalMonth)}>‹</NavBtn>
                <span style={{fontSize:14,fontWeight:800,textTransform:'uppercase',letterSpacing:0.5}}>{MONTHS[opsCalMonth.month]} {opsCalMonth.year}</span>
                <NavBtn onClick={()=>changeMonth(opsCalMonth,1,setOpsCalMonth)}>›</NavBtn>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{display:'flex',gap:14,marginBottom:14,flexWrap:'wrap'}}>
            {[[GOLD,'Group'],[BLUE,'1-on-1'],[PURPLE,'Facility Event']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:DIM}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}
              </div>
            ))}
          </div>

          {/* LIST VIEW */}
          {opsCalView==='list' && (
            loading ? <Spinner/> : coaches.length===0
              ? <EmptyState>No coaches yet. Click <strong style={{color:GOLD}}>Manage Coaches</strong> to add your team.</EmptyState>
              : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10}}>
                  {coaches.map(coach => {
                    const sess = getSessionsForCoach(coach.id, opsDate)
                    const tagStyle = coach.role==='group'?{background:'rgba(245,197,24,0.13)',color:GOLD}:coach.role==='solo'?{background:'rgba(79,195,247,0.13)',color:BLUE}:{background:'rgba(129,199,132,0.13)',color:GREEN}
                    const tagText  = coach.role==='group'?'GRP':coach.role==='solo'?'1:1':'MIX'
                    return (
                      <div key={coach.id} style={{background:GRAY,borderRadius:10,border:`1px solid ${GRAY2}`,overflow:'hidden'}}>
                        <div style={{padding:'9px 12px',borderBottom:`1px solid ${GRAY2}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                          <div style={{fontWeight:700,fontSize:13}}>{coach.name}</div>
                          <span style={{fontSize:9,fontWeight:800,letterSpacing:1,padding:'2px 6px',borderRadius:4,...tagStyle}}>{tagText}</span>
                        </div>
                        <div style={{padding:8}}>
                          {sess.length===0
                            ? <div style={{fontSize:11,color:GRAY3,textAlign:'center',padding:'12px 0'}}>No sessions</div>
                            : sess.map(s=>(
                              <div key={s.id} style={{background:GRAY2,borderRadius:6,padding:'7px 9px',marginBottom:5,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,position:'relative'}}>
                                <div style={{fontSize:14,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                                <div style={{fontSize:10,color:DIM,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'calc(100% - 18px)'}}>{s.type==='solo'?`1:1 · ${s.clientName}`:s.name}</div>
                                <button onClick={()=>removeSession(s.id)} style={{position:'absolute',top:4,right:5,background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:14,lineHeight:1,padding:0,transition:'color 0.15s'}}
                                  onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=GRAY3}>×</button>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
          )}

          {/* CALENDAR VIEW */}
          {opsCalView==='calendar' && (
            <div>
              <MonthCalendar
                year={opsCalMonth.year} month={opsCalMonth.month}
                selectedDay={opsSelDay}
                onDayClick={d=>{ setOpsSelDay(d); openDayDetail(d, null) }}
                getDayDots={dk=>getOpsDayDots(dk)}
              />
              {opsSelDay && (
                <div style={{marginTop:16,background:GRAY,borderRadius:10,padding:14,border:`1px solid ${GRAY2}`}}>
                  <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:GOLD,marginBottom:10}}>{fmtLong(opsSelDay)}</div>
                  {getAllSessionsOnDate(opsSelDay).length===0 && getEventsOnDate(dateKey(opsSelDay)).length===0
                    ? <div style={{fontSize:12,color:DIM,textAlign:'center',padding:'12px 0'}}>No sessions or events</div>
                    : <>
                        {getAllSessionsOnDate(opsSelDay).sort((a,b)=>a.time>b.time?1:-1).map(s=>{
                          const coach = coaches.find(c=>c.id===s.coachId)
                          return (
                            <div key={s.id} style={{background:GRAY2,borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:700}}>{fmt12(s.time)} · {s.type==='solo'?`1:1 · ${s.clientName}`:s.name}</div>
                                <div style={{fontSize:11,color:DIM,marginTop:2}}>{coach?.name||'Unknown coach'}</div>
                              </div>
                              <button onClick={()=>removeSession(s.id)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:16,padding:'0 4px',transition:'color 0.15s'}}
                                onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=GRAY3}>×</button>
                            </div>
                          )
                        })}
                        {getEventsOnDate(dateKey(opsSelDay)).map(e=>(
                          <div key={e.id} style={{background:GRAY2,borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${PURPLE}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:700}}>{fmt12(e.startTime)} · {e.title}</div>
                              <div style={{fontSize:11,color:DIM,marginTop:2}}>{e.brand==='both'?'Goalz + Shankly':e.brand==='goalz'?'Goalz':'Shankly'}</div>
                            </div>
                            <button onClick={()=>removeEvent(e.id)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:16,padding:'0 4px',transition:'color 0.15s'}}
                              onMouseEnter={e2=>e2.target.style.color=RED} onMouseLeave={e2=>e2.target.style.color=GRAY3}>×</button>
                          </div>
                        ))}
                      </>
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Facility Event button in ops */}
        <div style={{position:'fixed',bottom:20,right:20,zIndex:40}}>
          <Btn gold onClick={()=>setEventOpen(true)} style={{fontSize:12,padding:'10px 16px',borderRadius:30,boxShadow:'0 4px 20px rgba(245,197,24,0.3)'}}>+ Facility Event</Btn>
        </div>

        {/* Modals */}
        <SoloModal open={soloOpen} onClose={()=>setSoloOpen(false)} form={soloF} setForm={setSoloF} coaches={eligibleCoaches(['solo','mixed'])} onSave={saveSolo} inp={inp}/>
        <GroupModal open={groupOpen} onClose={()=>setGroupOpen(false)} form={groupF} setForm={setGroupF} coaches={eligibleCoaches(['group','mixed'])} onSave={saveGroup} inp={inp}/>
        <CoachMgmtModal open={coachOpen} onClose={()=>setCoachOpen(false)} coaches={coaches} newC={newC} setNewC={setNewC} onAdd={addCoach} onRemove={removeCoach} inp={inp}/>
        <EventModal open={eventOpen} onClose={()=>setEventOpen(false)} form={eventF} setForm={setEventF} coaches={coaches} onSave={saveEvent} inp={inp}/>

        <Toast msg={toast}/>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // COACH VIEW
  // ══════════════════════════════════════════
  if (view==='coach') {
    const currentCoach = coaches.find(c=>c.id===activeCoach)
    const next7 = getNext7()

    return (
      <div style={{minHeight:'100vh',background:BLACK,color:WHITE,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
        {/* Header */}
        <div style={{background:BLACK,borderBottom:`1px solid rgba(245,197,24,0.18)`,padding:'12px 16px',position:'sticky',top:0,zIndex:50}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:GOLD}}>SHANKLY</span>
              <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:DIM,marginLeft:8}}>Schedule</span>
            </div>
            <HomeBtn onClick={()=>setView('landing')}/>
          </div>

          {/* Coach Selector — centered list */}
          {coaches.length===0
            ? <div style={{fontSize:13,color:DIM,textAlign:'center',padding:'8px 0'}}>No coaches added yet</div>
            : <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
                {coaches.map(c=>(
                  <button key={c.id} onClick={()=>setActive(c.id)}
                    style={{background:activeCoach===c.id?GOLD:GRAY2, border:`1px solid ${activeCoach===c.id?GOLD:GRAY3}`, color:activeCoach===c.id?BLACK:WHITE, fontSize:13, padding:'8px 16px', borderRadius:24, cursor:'pointer', fontFamily:'inherit', fontWeight:activeCoach===c.id?800:500, transition:'all 0.15s', letterSpacing:0.3}}>
                    {c.name}
                  </button>
                ))}
              </div>
          }

          {/* Coach info + view toggle */}
          {currentCoach && (
            <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <div>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',padding:'3px 9px',borderRadius:4,...roleBadgeStyle(currentCoach.role)}}>{roleLabel(currentCoach.role)}</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <ToggleBtn active={coachCalView==='list'}     onClick={()=>setCoachCalView('list')}>☰ List</ToggleBtn>
                <ToggleBtn active={coachCalView==='calendar'} onClick={()=>setCoachCalView('calendar')}>📅 Calendar</ToggleBtn>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
          {loading ? <Spinner/> : !currentCoach
            ? <div style={{textAlign:'center',padding:'60px 20px',color:DIM,fontSize:14}}>Select your name above to see your schedule</div>
            : coachCalView==='list'
              ? next7.map(day=>{
                  const sess = getSessionsForCoach(currentCoach.id, day)
                  const today = isToday(day)
                  return (
                    <div key={dateKey(day)} style={{marginBottom:22}}>
                      <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:today?GOLD:DIM,marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${today?'rgba(245,197,24,0.25)':GRAY2}`}}>
                        {today?'Today':fmtLong(day)}
                      </div>
                      {sess.length===0
                        ? <div style={{fontSize:12,color:GRAY3,textAlign:'center',padding:'12px 0'}}>No sessions scheduled</div>
                        : sess.map(s=>(
                          <div key={s.id} style={{background:GRAY,borderRadius:9,padding:'12px 14px',marginBottom:7,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,display:'flex',alignItems:'flex-start',gap:12,animation:'fadeUp 0.2s ease'}}>
                            <div style={{minWidth:60}}>
                              <div style={{fontSize:19,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                              <div style={{fontSize:10,color:DIM,marginTop:2}}>{s.duration}min</div>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                              <div style={{fontSize:11,color:DIM}}>{s.type==='solo'?(s.notes||'No notes'):`Group Session · ${s.duration}min`}</div>
                            </div>
                            <div style={{width:7,height:7,borderRadius:'50%',marginTop:5,flexShrink:0,background:s.type==='solo'?BLUE:GOLD}}/>
                          </div>
                        ))
                      }
                    </div>
                  )
                })
              : <div>
                  {/* Calendar nav */}
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,justifyContent:'center'}}>
                    <NavBtn onClick={()=>changeMonth(coachCalMonth,-1,setCoachCalMonth)}>‹</NavBtn>
                    <span style={{fontSize:15,fontWeight:800,textTransform:'uppercase',letterSpacing:0.5}}>{MONTHS[coachCalMonth.month]} {coachCalMonth.year}</span>
                    <NavBtn onClick={()=>changeMonth(coachCalMonth,1,setCoachCalMonth)}>›</NavBtn>
                  </div>
                  <MonthCalendar
                    year={coachCalMonth.year} month={coachCalMonth.month}
                    selectedDay={coachSelDay}
                    onDayClick={d=>setCoachSelDay(d)}
                    getDayDots={dk=>getCoachDayDots(dk,currentCoach.id)}
                  />
                  {coachSelDay && (
                    <div style={{marginTop:14,background:GRAY,borderRadius:10,padding:14,border:`1px solid ${GRAY2}`}}>
                      <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:GOLD,marginBottom:10}}>{fmtLong(coachSelDay)}</div>
                      {getSessionsForCoach(currentCoach.id,coachSelDay).length===0
                        ? <div style={{fontSize:12,color:DIM,textAlign:'center',padding:'12px 0'}}>No sessions this day</div>
                        : getSessionsForCoach(currentCoach.id,coachSelDay).map(s=>(
                          <div key={s.id} style={{background:GRAY2,borderRadius:6,padding:'9px 11px',marginBottom:6,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`}}>
                            <div style={{fontSize:14,fontWeight:700}}>{fmt12(s.time)} · {s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                            <div style={{fontSize:11,color:DIM,marginTop:2}}>{s.duration}min{s.type==='solo'&&s.notes?' · '+s.notes:''}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
          }
        </div>

        <Toast msg={toast}/>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // FACILITY CALENDAR
  // ══════════════════════════════════════════
  if (view==='facility') {
    const selDk = facSelDay ? dateKey(facSelDay) : null
    const selEvents = selDk ? getEventsOnDate(selDk) : []

    return (
      <div style={{minHeight:'100vh',background:BLACK,color:WHITE,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}}>
        {/* Header */}
        <div style={{background:BLACK,borderBottom:`1px solid rgba(245,197,24,0.18)`,padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:GOLD}}>SHANKLY</span>
            <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:DIM,marginLeft:8}}>Facility</span>
          </div>
          <HomeBtn onClick={()=>setView('landing')}/>
        </div>

        <div style={{padding:'16px'}}>
          {/* Month nav */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,justifyContent:'center'}}>
            <NavBtn onClick={()=>changeMonth(facCalMonth,-1,setFacCalMonth)}>‹</NavBtn>
            <span style={{fontSize:18,fontWeight:900,textTransform:'uppercase',letterSpacing:1}}>{MONTHS[facCalMonth.month]} {facCalMonth.year}</span>
            <NavBtn onClick={()=>changeMonth(facCalMonth,1,setFacCalMonth)}>›</NavBtn>
          </div>

          {/* Brand legend */}
          <div style={{display:'flex',gap:14,marginBottom:14,justifyContent:'center',flexWrap:'wrap'}}>
            {[[PURPLE,'Event'],[GOLD,'Goalz'],[GREEN,'Shankly']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:DIM}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}
              </div>
            ))}
          </div>

          <MonthCalendar
            year={facCalMonth.year} month={facCalMonth.month}
            selectedDay={facSelDay}
            onDayClick={d=>setFacSelDay(d)}
            getDayDots={dk=>{
              const evts = getEventsOnDate(dk)
              return evts.map(e=>e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE)
            }}
          />

          {/* Selected day events */}
          {facSelDay && (
            <div style={{marginTop:16,background:GRAY,borderRadius:12,padding:16,border:`1px solid ${GRAY2}`}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:GOLD,marginBottom:12}}>{fmtLong(facSelDay)}</div>
              {selEvents.length===0
                ? <div style={{fontSize:13,color:DIM,textAlign:'center',padding:'16px 0'}}>No events scheduled</div>
                : selEvents.sort((a,b)=>a.startTime>b.startTime?1:-1).map(e=>{
                    const brandColor = e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE
                    const brandLabel = e.brand==='both'?'Goalz + Shankly':e.brand==='goalz'?'Goalz':'Shankly'
                    const involvedCoaches = coaches.filter(c=>e.coachIds&&e.coachIds.includes(c.id))
                    return (
                      <div key={e.id} style={{background:GRAY2,borderRadius:8,padding:'12px 14px',marginBottom:10,borderLeft:`3px solid ${brandColor}`}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{e.title}</div>
                            <div style={{fontSize:12,color:DIM,marginBottom:4}}>
                              {fmt12(e.startTime)}{e.endTime?' – '+fmt12(e.endTime):''}
                            </div>
                            <span style={{fontSize:10,fontWeight:700,letterSpacing:1,padding:'2px 8px',borderRadius:20,background:`${brandColor}22`,color:brandColor}}>{brandLabel}</span>
                            {involvedCoaches.length>0 && (
                              <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:5}}>
                                {involvedCoaches.map(c=>(
                                  <span key={c.id} style={{fontSize:10,background:GRAY3,color:WHITE,padding:'2px 8px',borderRadius:20}}>{c.name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* Upcoming events list */}
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:DIM,marginBottom:12}}>Upcoming Events</div>
            {events.length===0
              ? <div style={{fontSize:13,color:DIM,textAlign:'center',padding:'20px 0'}}>No facility events yet</div>
              : events
                  .filter(e=>new Date(e.date+'T00:00:00')>=todayMidnight())
                  .sort((a,b)=>a.date>b.date?1:-1)
                  .slice(0,10)
                  .map(e=>{
                    const brandColor = e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE
                    const d = new Date(e.date+'T00:00:00')
                    return (
                      <div key={e.id} onClick={()=>{ setFacSelDay(d); setFacCalMonth({year:d.getFullYear(),month:d.getMonth()}) }}
                        style={{background:GRAY,borderRadius:8,padding:'11px 14px',marginBottom:8,borderLeft:`3px solid ${brandColor}`,cursor:'pointer',transition:'background 0.15s'}}
                        onMouseEnter={e2=>e2.currentTarget.style.background=GRAY2}
                        onMouseLeave={e2=>e2.currentTarget.style.background=GRAY}>
                        <div style={{fontSize:13,fontWeight:700}}>{e.title}</div>
                        <div style={{fontSize:11,color:DIM,marginTop:2}}>{fmtLong(d)} · {fmt12(e.startTime)}</div>
                      </div>
                    )
                  })
            }
          </div>
        </div>

        <Toast msg={toast}/>
      </div>
    )
  }

  return null
}

// ══════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════

function LandingCard({ icon, title, desc, onClick }) {
  const [h,setH]=useState(false)
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?'#1f1f1f':GRAY,border:`1px solid ${h?GOLD:GRAY3}`,borderRadius:14,padding:'28px 22px',flex:1,minWidth:160,cursor:'pointer',transition:'all 0.2s',textAlign:'center',transform:h?'translateY(-3px)':'none'}}>
      <div style={{fontSize:30,marginBottom:12}}>{icon}</div>
      <div style={{fontSize:17,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:GOLD,marginBottom:7}}>{title}</div>
      <div style={{fontSize:11,color:DIM,lineHeight:1.6}}>{desc}</div>
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{background:active?GOLD:GRAY2,border:`1px solid ${active?GOLD:GRAY3}`,color:active?BLACK:WHITE,fontSize:11,fontWeight:700,padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',letterSpacing:0.5}}>
      {children}
    </button>
  )
}

function NavBtn({ onClick, children }) {
  const [h,setH]=useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:GRAY2,border:`1px solid ${h?GOLD:GRAY3}`,color:h?GOLD:WHITE,width:32,height:32,borderRadius:7,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 20px'}}>
      <div style={{width:26,height:26,border:`3px solid ${GRAY3}`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

function EmptyState({ children }) {
  return <div style={{textAlign:'center',padding:'60px 20px',color:DIM,gridColumn:'1/-1'}}>{children}</div>
}

// ── MODALS ────────────────────────────────
function SoloModal({ open, onClose, form, setForm, coaches, onSave, inp }) {
  return (
    <Modal open={open} onClose={onClose} title="Assign 1-on-1">
      <Field label="Client Name *"><input style={inp} value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} placeholder="e.g. Marcus Johnson"/></Field>
      <Field label="Date *"><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
      <Field label="Time *"><input type="time" style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field>
      <Field label="Duration">
        <select style={inp} value={form.dur} onChange={e=>setForm(f=>({...f,dur:e.target.value}))}>
          <option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option>
        </select>
      </Field>
      <Field label="Assign Coach *">
        <select style={inp} value={form.coachId} onChange={e=>setForm(f=>({...f,coachId:e.target.value}))}>
          {coaches.length===0?<option value="">No eligible coaches</option>:coaches.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Notes (optional)"><input style={inp} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. GK focus, bring pinnies"/></Field>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
        <Btn outline onClick={onClose}>Cancel</Btn>
        <Btn gold onClick={onSave}>Assign Session</Btn>
      </div>
    </Modal>
  )
}

function GroupModal({ open, onClose, form, setForm, coaches, onSave, inp }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Group Session">
      <Field label="Session Name *"><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. U12 Technical Training"/></Field>
      <Field label="Repeats">
        <select style={inp} value={form.repeat} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))}>
          <option value="weekly">Weekly (all summer)</option><option value="once">One time only</option>
        </select>
      </Field>
      {form.repeat==='weekly'
        ? <Field label="Day of Week">
            <select style={inp} value={form.dow} onChange={e=>setForm(f=>({...f,dow:e.target.value}))}>
              {DAYS_FULL.map((d,i)=><option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
        : <Field label="Date *"><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
      }
      <Field label="Time *"><input type="time" style={inp} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field>
      <Field label="Duration">
        <select style={inp} value={form.dur} onChange={e=>setForm(f=>({...f,dur:e.target.value}))}>
          <option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option>
        </select>
      </Field>
      <Field label="Assign Coach *">
        <select style={inp} value={form.coachId} onChange={e=>setForm(f=>({...f,coachId:e.target.value}))}>
          {coaches.length===0?<option value="">No eligible coaches</option>:coaches.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
        <Btn outline onClick={onClose}>Cancel</Btn>
        <Btn gold onClick={onSave}>Add Session</Btn>
      </div>
    </Modal>
  )
}

function CoachMgmtModal({ open, onClose, coaches, newC, setNewC, onAdd, onRemove, inp }) {
  return (
    <Modal open={open} onClose={onClose} title="Manage Coaches" wide>
      <div style={{maxHeight:260,overflowY:'auto',marginBottom:16}}>
        {coaches.length===0
          ? <div style={{color:DIM,fontSize:13,textAlign:'center',padding:20}}>No coaches yet</div>
          : coaches.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:BLACK,borderRadius:7,marginBottom:6,border:`1px solid ${GRAY2}`,gap:10}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                <div style={{fontSize:11,color:DIM,marginTop:2}}>{roleLabel(c.role)}</div>
              </div>
              <Btn danger onClick={()=>onRemove(c.id)}>Remove</Btn>
            </div>
          ))
        }
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:DIM,marginBottom:10}}>Add New Coach</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',borderTop:`1px solid ${GRAY3}`,paddingTop:16}}>
        <input style={{...inp,flex:1,minWidth:130}} placeholder="Coach name" value={newC.name}
          onChange={e=>setNewC(n=>({...n,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&onAdd()}/>
        <select style={{...inp,flex:1,minWidth:160}} value={newC.role} onChange={e=>setNewC(n=>({...n,role:e.target.value}))}>
          <option value="mixed">Mixed (Groups + 1-on-1s)</option>
          <option value="group">Groups Only</option>
          <option value="solo">1-on-1s Only</option>
        </select>
        <Btn gold onClick={onAdd}>Add</Btn>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}>
        <Btn outline onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  )
}

function EventModal({ open, onClose, form, setForm, coaches, onSave, inp }) {
  function toggleCoach(id) {
    const ids = form.coachIds||[]
    setForm(f=>({...f, coachIds: ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]}))
  }
  return (
    <Modal open={open} onClose={onClose} title="Add Facility Event">
      <Field label="Event Title *"><input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Adult League Night"/></Field>
      <Field label="Date *"><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
      <Field label="Start Time *"><input type="time" style={inp} value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></Field>
      <Field label="End Time"><input type="time" style={inp} value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></Field>
      <Field label="Brand">
        <select style={inp} value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}>
          <option value="both">Goalz + Shankly</option>
          <option value="goalz">Goalz Only</option>
          <option value="shankly">Shankly Only</option>
        </select>
      </Field>
      <Field label="Coaches Involved">
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
          {coaches.length===0
            ? <span style={{fontSize:12,color:DIM}}>No coaches added yet</span>
            : coaches.map(c=>{
                const selected = (form.coachIds||[]).includes(c.id)
                return (
                  <button key={c.id} onClick={()=>toggleCoach(c.id)}
                    style={{background:selected?GOLD:GRAY2,border:`1px solid ${selected?GOLD:GRAY3}`,color:selected?BLACK:WHITE,fontSize:11,padding:'5px 11px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontWeight:selected?700:400,transition:'all 0.15s'}}>
                    {c.name.replace('Coach ','')}
                  </button>
                )
              })
          }
        </div>
      </Field>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
        <Btn outline onClick={onClose}>Cancel</Btn>
        <Btn gold onClick={onSave}>Add Event</Btn>
      </div>
    </Modal>
  )
}
