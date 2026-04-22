import { useState, useEffect } from 'react'
import { db } from './firebase.js'
import { ref, onValue, push, remove, set } from 'firebase/database'

const PASSWORD = 'Shankly2026'
const GOLD   = '#F5C518'
const BLACK  = '#0a0a0a'
const GRAY   = '#1a1a1a'
const GRAY2  = '#242424'
const GRAY3  = '#333'
const WHITE  = '#f0ede6'
const DIM    = '#666'
const BLUE   = '#4fc3f7'
const GREEN  = '#81c784'
const RED    = '#e74c3c'
const PURPLE = '#ce93d8'
const ORANGE = '#ffb74d'

const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_S  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function isToday(d){const t=new Date();t.setHours(0,0,0,0);return new Date(d).setHours(0,0,0,0)===t.getTime()}
function fmtLong(d){return `${DAYS_FULL[d.getDay()]}, ${MONTHS_S[d.getMonth()]} ${d.getDate()}`}
function fmt12(t){if(!t)return '';const[h,m]=t.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
function todayMidnight(){const d=new Date();d.setHours(0,0,0,0);return d}
function getNext7(){const t=todayMidnight();return Array.from({length:7},(_,i)=>{const d=new Date(t);d.setDate(t.getDate()+i);return d})}
function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function getFirstDayOfMonth(y,m){return new Date(y,m,1).getDay()}
function roleLabel(r){return r==='group'?'Groups Only':r==='solo'?'1-on-1s Only':'Groups + 1-on-1s'}
function roleBadgeStyle(r){
  if(r==='group')return{background:'rgba(245,197,24,0.13)',color:'#F5C518'}
  if(r==='solo')return{background:'rgba(79,195,247,0.13)',color:'#4fc3f7'}
  return{background:'rgba(129,199,132,0.13)',color:'#81c784'}
}
function objToArr(obj){if(!obj)return[];return Object.entries(obj).map(([id,val])=>({...val,id}))}
function getWeekStart(){const d=todayMidnight();d.setDate(d.getDate()-d.getDay());return d}
function getWeekEnd(){const d=getWeekStart();d.setDate(d.getDate()+6);return d}

const inp={width:'100%',background:'#0a0a0a',border:'1px solid #333',borderRadius:7,color:'#f0ede6',fontFamily:'inherit',fontSize:14,padding:'10px 12px',outline:'none',WebkitAppearance:'none',appearance:'none',boxSizing:'border-box'}
const lbl={display:'block',fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#666',marginBottom:6}

function Btn({gold,outline,danger,onClick,children,style={},disabled=false}){
  const[h,setH]=useState(false)
  const base={fontSize:12,fontWeight:700,padding:'8px 14px',borderRadius:7,cursor:disabled?'not-allowed':'pointer',border:'none',letterSpacing:0.3,transition:'all 0.15s',fontFamily:'inherit',whiteSpace:'nowrap',opacity:disabled?0.5:1,...style}
  if(gold)return<button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,background:h?'#ffd740':'#F5C518',color:'#0a0a0a'}}>{children}</button>
  if(danger)return<button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,background:h?'#922':'transparent',color:h?'#f0ede6':'#e74c3c',border:'1px solid #922'}}>{children}</button>
  if(outline)return<button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,background:'transparent',color:h?'#F5C518':'#f0ede6',border:`1px solid ${h?'#F5C518':'#333'}`}}>{children}</button>
  return<button disabled={disabled} onClick={onClick} style={{...base,background:'transparent',border:'none',color:'#666'}}>{children}</button>
}

function HomeBtn({onClick}){
  const[h,setH]=useState(false)
  return<button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:h?'#F5C518':'rgba(245,197,24,0.12)',border:`1px solid ${h?'#F5C518':'rgba(245,197,24,0.3)'}`,color:h?'#0a0a0a':'#F5C518',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:13,fontWeight:700,letterSpacing:1,transition:'all 0.15s',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
    ⌂ <span style={{fontSize:11}}>Home</span>
  </button>
}

function ToggleBtn({active,onClick,children}){
  return<button onClick={onClick} style={{background:active?'#F5C518':'#242424',border:`1px solid ${active?'#F5C518':'#333'}`,color:active?'#0a0a0a':'#f0ede6',fontSize:11,fontWeight:700,padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',letterSpacing:0.5}}>{children}</button>
}

function NavBtn({onClick,children}){
  const[h,setH]=useState(false)
  return<button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:'#242424',border:`1px solid ${h?'#F5C518':'#333'}`,color:h?'#F5C518':'#f0ede6',width:32,height:32,borderRadius:7,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>{children}</button>
}

function Modal({open,onClose,title,children,wide=false}){
  if(!open)return null
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#1a1a1a',border:'1px solid rgba(245,197,24,0.2)',borderRadius:14,padding:'26px 24px',width:'100%',maxWidth:wide?520:460,maxHeight:'92vh',overflowY:'auto',animation:'popIn 0.18s ease'}}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{fontSize:22,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:'#F5C518',marginBottom:20}}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function Field({label,children}){return<div style={{marginBottom:14}}><label style={lbl}>{label}</label>{children}</div>}

function Toast({msg}){
  if(!msg)return null
  return<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#F5C518',color:'#0a0a0a',fontWeight:700,fontSize:13,padding:'10px 22px',borderRadius:30,zIndex:999,pointerEvents:'none',whiteSpace:'nowrap'}}>{msg}</div>
}

function Spinner(){
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 20px'}}>
      <div style={{width:26,height:26,border:'3px solid #333',borderTopColor:'#F5C518',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function MonthCalendar({year,month,onDayClick,getDayDots,selectedDay}){
  const daysInMonth=getDaysInMonth(year,month)
  const firstDay=getFirstDayOfMonth(year,month)
  const cells=[]
  for(let i=0;i<firstDay;i++)cells.push(null)
  for(let d=1;d<=daysInMonth;d++)cells.push(d)
  const today=new Date()
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
        {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,letterSpacing:1,color:'#666',padding:'4px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
        {cells.map((day,i)=>{
          if(!day)return<div key={`e${i}`}/>
          const thisDate=new Date(year,month,day)
          const dk=dateKey(thisDate)
          const isTodayDay=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===day
          const isSelected=selectedDay&&dateKey(selectedDay)===dk
          const dots=getDayDots?getDayDots(dk):[]
          return(
            <div key={day} onClick={()=>onDayClick&&onDayClick(thisDate)}
              style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:'pointer',transition:'all 0.15s',gap:2,background:isSelected?'#F5C518':isTodayDay?'rgba(245,197,24,0.15)':'transparent',border:isTodayDay&&!isSelected?'1px solid rgba(245,197,24,0.4)':'1px solid transparent'}}>
              <span style={{fontSize:13,fontWeight:isTodayDay||isSelected?700:400,color:isSelected?'#0a0a0a':isTodayDay?'#F5C518':'#f0ede6',lineHeight:1}}>{day}</span>
              {dots.length>0&&<div style={{display:'flex',gap:2}}>{dots.slice(0,3).map((c,idx)=><div key={idx} style={{width:4,height:4,borderRadius:'50%',background:isSelected?'#0a0a0a':c}}/>)}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatPill({label,value,color}){
  return(
    <div style={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:10,padding:'12px 16px',flex:1,minWidth:90,textAlign:'center'}}>
      <div style={{fontSize:26,fontWeight:900,color:color,lineHeight:1}}>{value}</div>
      <div style={{fontSize:10,color:'#666',marginTop:4,letterSpacing:0.5}}>{label}</div>
    </div>
  )
}

function LandingCard({icon,title,desc,onClick}){
  const[h,setH]=useState(false)
  return(
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?'#1f1f1f':'#1a1a1a',border:`1px solid ${h?'#F5C518':'#333'}`,borderRadius:14,padding:'26px 20px',flex:1,minWidth:140,cursor:'pointer',transition:'all 0.2s',textAlign:'center',transform:h?'translateY(-3px)':'none'}}>
      <div style={{fontSize:28,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:15,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:'#F5C518',marginBottom:6}}>{title}</div>
      <div style={{fontSize:11,color:'#666',lineHeight:1.6}}>{desc}</div>
    </div>
  )
}

function SoloModal({open,onClose,form,setForm,coaches,onSave,inp}){
  return(
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

function GroupModal({open,onClose,form,setForm,coaches,onSave,inp}){
  return(
    <Modal open={open} onClose={onClose} title="Add Group Session">
      <Field label="Session Name *"><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. U12 Technical Training"/></Field>
      <Field label="Repeats">
        <select style={inp} value={form.repeat} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))}>
          <option value="weekly">Weekly (all summer)</option><option value="once">One time only</option>
        </select>
      </Field>
      {form.repeat==='weekly'
        ?<Field label="Day of Week">
          <select style={inp} value={form.dow} onChange={e=>setForm(f=>({...f,dow:e.target.value}))}>
            {DAYS_FULL.map((d,i)=><option key={d} value={i}>{d}</option>)}
          </select>
        </Field>
        :<Field label="Date *"><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
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

function CoachMgmtModal({open,onClose,coaches,newC,setNewC,onAdd,onRemove,inp}){
  return(
    <Modal open={open} onClose={onClose} title="Manage Coaches" wide>
      <div style={{maxHeight:260,overflowY:'auto',marginBottom:16}}>
        {coaches.length===0
          ?<div style={{color:'#666',fontSize:13,textAlign:'center',padding:20}}>No coaches yet</div>
          :coaches.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'#0a0a0a',borderRadius:7,marginBottom:6,border:'1px solid #242424',gap:10}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                <div style={{fontSize:11,color:'#666',marginTop:2}}>{roleLabel(c.role)}</div>
              </div>
              <Btn danger onClick={()=>onRemove(c.id)}>Remove</Btn>
            </div>
          ))
        }
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#666',marginBottom:10}}>Add New Coach</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',borderTop:'1px solid #333',paddingTop:16}}>
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

function EventModal({open,onClose,form,setForm,coaches,onSave,inp}){
  function toggleCoach(id){
    const ids=form.coachIds||[]
    setForm(f=>({...f,coachIds:ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]}))
  }
  return(
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
            ?<span style={{fontSize:12,color:'#666'}}>No coaches added yet</span>
            :coaches.map(c=>{
              const selected=(form.coachIds||[]).includes(c.id)
              return(
                <button key={c.id} onClick={()=>toggleCoach(c.id)}
                  style={{background:selected?'#F5C518':'#242424',border:`1px solid ${selected?'#F5C518':'#333'}`,color:selected?'#0a0a0a':'#f0ede6',fontSize:11,padding:'5px 11px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontWeight:selected?700:400,transition:'all 0.15s'}}>
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

export default function App(){
  const[view,setView]=useState('landing')
  const[coaches,setCoaches]=useState([])
  const[sessions,setSessions]=useState([])
  const[events,setEvents]=useState([])
  const[announcement,setAnnouncement]=useState(null)
  const[availability,setAvailability]=useState({})
  const[loading,setLoading]=useState(true)
  const[toast,setToast]=useState('')
  const[opsDate,setOpsDate]=useState(todayMidnight)
  const[summaryDate,setSummaryDate]=useState(todayMidnight)
  const[activeCoach,setActive]=useState(null)
  const[pwVal,setPwVal]=useState('')
  const[pwError,setPwError]=useState('')

  const now=new Date()
  const[opsCalView,setOpsCalView]=useState('list')
  const[coachCalView,setCoachCalView]=useState('list')
  const[opsCalMonth,setOpsCalMonth]=useState({year:now.getFullYear(),month:now.getMonth()})
  const[coachCalMonth,setCoachCalMonth]=useState({year:now.getFullYear(),month:now.getMonth()})
  const[opsSelDay,setOpsSelDay]=useState(null)
  const[coachSelDay,setCoachSelDay]=useState(null)
  const[facCalMonth,setFacCalMonth]=useState({year:now.getFullYear(),month:now.getMonth()})
  const[facSelDay,setFacSelDay]=useState(null)

  const[soloOpen,setSoloOpen]=useState(false)
  const[groupOpen,setGroupOpen]=useState(false)
  const[coachOpen,setCoachOpen]=useState(false)
  const[eventOpen,setEventOpen]=useState(false)
  const[editOpen,setEditOpen]=useState(false)
  const[editSession,setEditSession]=useState(null)
  const[announceOpen,setAnnounceOpen]=useState(false)
  const[availOpen,setAvailOpen]=useState(false)
  const[statsOpen,setStatsOpen]=useState(false)

  const blankSolo={client:'',date:'',time:'',dur:'60',coachId:'',notes:''}
  const blankGroup={name:'',repeat:'weekly',dow:'1',date:'',time:'',dur:'60',coachId:''}
  const blankNew={name:'',role:'mixed'}
  const blankEvent={title:'',date:'',startTime:'',endTime:'',coachIds:[],brand:'both'}
  const[soloF,setSoloF]=useState(blankSolo)
  const[groupF,setGroupF]=useState(blankGroup)
  const[newC,setNewC]=useState(blankNew)
  const[eventF,setEventF]=useState(blankEvent)
  const[editF,setEditF]=useState({})
  const[announceText,setAnnounceText]=useState('')
  const[availCoach,setAvailCoach]=useState('')
  const[availDate,setAvailDate]=useState('')

  useEffect(()=>{
    let d1=false,d2=false,d3=false,d4=false,d5=false
    const check=()=>{if(d1&&d2&&d3&&d4&&d5)setLoading(false)}
    const u1=onValue(ref(db,'coaches'),snap=>{setCoaches(objToArr(snap.val()));d1=true;check()})
    const u2=onValue(ref(db,'sessions'),snap=>{setSessions(objToArr(snap.val()));d2=true;check()})
    const u3=onValue(ref(db,'facEvents'),snap=>{setEvents(objToArr(snap.val()));d3=true;check()})
    const u4=onValue(ref(db,'announcement'),snap=>{setAnnouncement(snap.val());d4=true;check()})
    const u5=onValue(ref(db,'availability'),snap=>{setAvailability(snap.val()||{});d5=true;check()})
    return()=>{u1();u2();u3();u4();u5()}
  },[])

  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2400);return()=>clearTimeout(t)},[toast])

  function getSessionsForCoach(coachId,date){
    const dk=dateKey(date),dow=date.getDay()
    return sessions.filter(s=>{
      if(s.coachId!==coachId)return false
      if(s.type==='solo')return s.date===dk
      if(s.repeat==='weekly')return s.dow===dow
      if(s.repeat==='once')return s.date===dk
      return false
    }).sort((a,b)=>a.time>b.time?1:-1)
  }

  function getAllSessionsOnDate(date){
    const dk=dateKey(date),dow=date.getDay()
    return sessions.filter(s=>{
      if(s.type==='solo')return s.date===dk
      if(s.repeat==='weekly')return s.dow===dow
      if(s.repeat==='once')return s.date===dk
      return false
    })
  }

  function getEventsOnDate(dk){return events.filter(e=>e.date===dk)}
  function eligibleCoaches(roles){return coaches.filter(c=>roles.includes(c.role))}
  function isCoachAvailable(coachId,date){return!availability[coachId]?.[dateKey(date)]}

  function getSoloCount(coachId,period){
    const ws=getWeekStart(),we=getWeekEnd()
    return sessions.filter(s=>{
      if(s.coachId!==coachId||s.type!=='solo')return false
      if(period==='week'){const d=new Date(s.date+'T00:00:00');return d>=ws&&d<=we}
      return true
    }).length
  }

  function getOpsDayDots(dk){
    const date=new Date(dk+'T00:00:00')
    const sess=getAllSessionsOnDate(date),evts=getEventsOnDate(dk),dots=[]
    if(sess.some(s=>s.type==='group'))dots.push(GOLD)
    if(sess.some(s=>s.type==='solo'))dots.push(BLUE)
    if(evts.length>0)dots.push(PURPLE)
    return dots
  }

  function getCoachDayDots(dk,coachId){
    const date=new Date(dk+'T00:00:00')
    const sess=getSessionsForCoach(coachId,date),dots=[]
    if(sess.some(s=>s.type==='group'))dots.push(GOLD)
    if(sess.some(s=>s.type==='solo'))dots.push(BLUE)
    return dots
  }

  async function saveSolo(){
    if(!soloF.client||!soloF.date||!soloF.time||!soloF.coachId){setToast('Fill in all required fields');return}
    await push(ref(db,'sessions'),{type:'solo',clientName:soloF.client,date:soloF.date,time:soloF.time,duration:parseInt(soloF.dur),coachId:soloF.coachId,notes:soloF.notes,repeat:'once'})
    setSoloOpen(false);setSoloF(blankSolo);setToast('1-on-1 assigned ✓')
  }

  async function saveGroup(){
    if(!groupF.name||!groupF.time||!groupF.coachId){setToast('Fill in all required fields');return}
    if(groupF.repeat==='once'&&!groupF.date){setToast('Pick a date');return}
    const sess={type:'group',name:groupF.name,time:groupF.time,duration:parseInt(groupF.dur),coachId:groupF.coachId,repeat:groupF.repeat}
    if(groupF.repeat==='weekly')sess.dow=parseInt(groupF.dow)
    else sess.date=groupF.date
    await push(ref(db,'sessions'),sess)
    setGroupOpen(false);setGroupF(blankGroup);setToast('Group session added ✓')
  }

  async function saveEdit(){
    if(!editF.time||!editF.coachId){setToast('Fill in all required fields');return}
    const updates={...editSession,...editF,duration:parseInt(editF.dur||editSession.duration)}
    delete updates.id
    await set(ref(db,`sessions/${editSession.id}`),updates)
    setEditOpen(false);setToast('Session updated ✓')
  }

  async function addCoach(){
    if(!newC.name.trim()){setToast('Enter a coach name');return}
    await push(ref(db,'coaches'),{name:newC.name.trim(),role:newC.role})
    setNewC(blankNew);setToast(`${newC.name.trim()} added ✓`)
  }

  async function removeCoach(id){
    await remove(ref(db,`coaches/${id}`))
    await Promise.all(sessions.filter(s=>s.coachId===id).map(s=>remove(ref(db,`sessions/${s.id}`))))
    if(activeCoach===id)setActive(null)
    setToast('Coach removed')
  }

  async function removeSession(id){await remove(ref(db,`sessions/${id}`));setToast('Session removed')}

  async function saveEvent(){
    if(!eventF.title||!eventF.date||!eventF.startTime){setToast('Fill in required fields');return}
    await push(ref(db,'facEvents'),{title:eventF.title,date:eventF.date,startTime:eventF.startTime,endTime:eventF.endTime,coachIds:eventF.coachIds,brand:eventF.brand})
    setEventOpen(false);setEventF(blankEvent);setToast('Facility event added ✓')
  }

  async function removeEvent(id){await remove(ref(db,`facEvents/${id}`));setToast('Event removed')}

  async function saveAnnouncement(){
    if(!announceText.trim()){setToast('Enter an announcement');return}
    await set(ref(db,'announcement'),{text:announceText.trim(),ts:Date.now()})
    setAnnounceOpen(false);setAnnounceText('');setToast('Announcement posted ✓')
  }

  async function clearAnnouncement(){await remove(ref(db,'announcement'));setToast('Announcement cleared')}

  async function toggleAvailability(){
    if(!availCoach||!availDate){setToast('Select coach and date');return}
    const current=availability[availCoach]?.[availDate]
    if(current)await remove(ref(db,`availability/${availCoach}/${availDate}`))
    else await set(ref(db,`availability/${availCoach}/${availDate}`),true)
    setToast(current?'Marked available':'Marked unavailable')
  }

  function checkPassword(){
    if(pwVal===PASSWORD){setPwError('');setPwVal('');setView('ops')}
    else{setPwError('Incorrect password. Try again.');setPwVal('')}
  }

  function changeMonth(cur,dir,setter){
    let{year,month}=cur;month+=dir
    if(month>11){month=0;year++}
    if(month<0){month=11;year--}
    setter({year,month})
  }

  function openEdit(s){
    setEditSession(s)
    setEditF({time:s.time,coachId:s.coachId,notes:s.notes||'',dur:String(s.duration),date:s.date||'',dow:String(s.dow||1),repeat:s.repeat,clientName:s.clientName||''})
    setEditOpen(true)
  }

  const PAGE={minHeight:'100vh',background:'#0a0a0a',color:'#f0ede6',fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}
  const HDR={background:'#0a0a0a',borderBottom:'1px solid rgba(245,197,24,0.18)',padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}

  if(view==='landing')return(
    <div style={{...PAGE,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 20px',textAlign:'center'}}>
      {announcement&&(
        <div style={{background:'rgba(245,197,24,0.1)',border:'1px solid rgba(245,197,24,0.3)',borderRadius:10,padding:'12px 18px',marginBottom:28,maxWidth:500,width:'100%',display:'flex',gap:10,alignItems:'flex-start'}}>
          <span style={{fontSize:16}}>📢</span>
          <div style={{fontSize:13,color:'#f0ede6',lineHeight:1.5,textAlign:'left'}}>{announcement.text}</div>
        </div>
      )}
      <div style={{fontSize:52,fontWeight:900,letterSpacing:6,textTransform:'uppercase',color:'#F5C518',lineHeight:1}}>SHANKLY</div>
      <div style={{fontSize:11,letterSpacing:4,textTransform:'uppercase',color:'#666',margin:'6px 0 48px'}}>Elite Training · Schedule</div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',maxWidth:640,width:'100%'}}>
        <LandingCard icon="⚡" title="OPS VIEW"      desc="Assign sessions, manage coaches, full control"      onClick={()=>setView('password')}/>
        <LandingCard icon="📋" title="COACH VIEW"    desc="See your personal schedule for the week ahead"     onClick={()=>setView('coach')}/>
        <LandingCard icon="🏟️" title="FACILITY"      desc="See what's happening at Goalz & Shankly"          onClick={()=>setView('facility')}/>
        <LandingCard icon="📊" title="DAILY SUMMARY" desc="Full day schedule across all coaches"              onClick={()=>setView('summary')}/>
      </div>
    </div>
  )

  if(view==='password')return(
    <div style={{...PAGE,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,fontWeight:900,letterSpacing:5,textTransform:'uppercase',color:'#F5C518',marginBottom:4}}>SHANKLY</div>
      <div style={{fontSize:10,letterSpacing:3,textTransform:'uppercase',color:'#666',marginBottom:36}}>Ops Access</div>
      <div style={{background:'#1a1a1a',border:'1px solid rgba(245,197,24,0.2)',borderRadius:14,padding:'32px 28px',width:'100%',maxWidth:360}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Staff Only</div>
        <div style={{fontSize:12,color:'#666',marginBottom:22}}>Enter the ops password to continue</div>
        <input style={{...inp,marginBottom:12,letterSpacing:3,textAlign:'center',fontSize:16}} type="password" placeholder="••••••••••"
          value={pwVal} onChange={e=>setPwVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkPassword()} autoFocus/>
        {pwError&&<div style={{fontSize:12,color:'#e74c3c',marginBottom:12}}>{pwError}</div>}
        <Btn gold onClick={checkPassword} style={{width:'100%',padding:12,fontSize:14}}>Enter</Btn>
        <div onClick={()=>{setView('landing');setPwError('');setPwVal('')}} style={{fontSize:12,color:'#666',cursor:'pointer',marginTop:16,textDecoration:'underline'}}>← Back to Home</div>
      </div>
    </div>
  )

  if(view==='ops')return(
    <div style={PAGE}>
      <div style={HDR}>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:'#F5C518'}}>SHANKLY</span>
          <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#666'}}>Ops</span>
        </div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
          <Btn outline onClick={()=>setCoachOpen(true)}>Coaches</Btn>
          <Btn outline onClick={()=>setAvailOpen(true)}>Availability</Btn>
          <Btn outline onClick={()=>setStatsOpen(true)}>Stats</Btn>
          <Btn outline onClick={()=>{setAnnounceText(announcement?.text||'');setAnnounceOpen(true)}}>📢 Announce</Btn>
          <Btn outline onClick={()=>{setGroupF({...blankGroup,coachId:eligibleCoaches(['group','mixed'])[0]?.id||''});setGroupOpen(true)}}>+ Group</Btn>
          <Btn gold onClick={()=>{setSoloF({...blankSolo,date:dateKey(opsDate),coachId:eligibleCoaches(['solo','mixed'])[0]?.id||''});setSoloOpen(true)}}>+ 1-on-1</Btn>
          <HomeBtn onClick={()=>setView('landing')}/>
        </div>
      </div>

      {announcement&&(
        <div style={{background:'rgba(245,197,24,0.08)',borderBottom:'1px solid rgba(245,197,24,0.2)',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span>📢</span>
            <span style={{fontSize:12,color:'#f0ede6'}}>{announcement.text}</span>
          </div>
          <button onClick={clearAnnouncement} style={{background:'transparent',border:'none',color:'#666',cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
        </div>
      )}

      <div style={{padding:'16px'}}>
        <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
          <ToggleBtn active={opsCalView==='list'} onClick={()=>setOpsCalView('list')}>☰ List</ToggleBtn>
          <ToggleBtn active={opsCalView==='calendar'} onClick={()=>setOpsCalView('calendar')}>📅 Calendar</ToggleBtn>
          {opsCalView==='list'&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexWrap:'wrap'}}>
              <NavBtn onClick={()=>{const d=new Date(opsDate);d.setDate(d.getDate()-1);setOpsDate(d)}}>‹</NavBtn>
              <span style={{fontSize:16,fontWeight:800,textTransform:'uppercase'}}>{fmtLong(opsDate)}</span>
              {isToday(opsDate)&&<span style={{background:'#F5C518',color:'#0a0a0a',fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',padding:'2px 8px',borderRadius:20}}>Today</span>}
              <NavBtn onClick={()=>{const d=new Date(opsDate);d.setDate(d.getDate()+1);setOpsDate(d)}}>›</NavBtn>
              <Btn outline onClick={()=>setOpsDate(todayMidnight())} style={{fontSize:10,padding:'5px 10px'}}>Today</Btn>
            </div>
          )}
          {opsCalView==='calendar'&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
              <NavBtn onClick={()=>changeMonth(opsCalMonth,-1,setOpsCalMonth)}>‹</NavBtn>
              <span style={{fontSize:14,fontWeight:800,textTransform:'uppercase'}}>{MONTHS[opsCalMonth.month]} {opsCalMonth.year}</span>
              <NavBtn onClick={()=>changeMonth(opsCalMonth,1,setOpsCalMonth)}>›</NavBtn>
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:14,marginBottom:14,flexWrap:'wrap'}}>
          {[['#F5C518','Group'],['#4fc3f7','1-on-1'],['#ce93d8','Facility'],['#ffb74d','Unavailable']].map(([c,l])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#666'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}
            </div>
          ))}
        </div>

        {opsCalView==='list'&&(
          loading?<Spinner/>:coaches.length===0
            ?<div style={{textAlign:'center',padding:'60px 20px',color:'#666'}}>No coaches yet. Click <strong style={{color:'#F5C518'}}>Coaches</strong> to add your team.</div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10}}>
              {coaches.map(coach=>{
                const sess=getSessionsForCoach(coach.id,opsDate)
                const unavail=!isCoachAvailable(coach.id,opsDate)
                const tagStyle=coach.role==='group'?{background:'rgba(245,197,24,0.13)',color:'#F5C518'}:coach.role==='solo'?{background:'rgba(79,195,247,0.13)',color:'#4fc3f7'}:{background:'rgba(129,199,132,0.13)',color:'#81c784'}
                const tagText=coach.role==='group'?'GRP':coach.role==='solo'?'1:1':'MIX'
                return(
                  <div key={coach.id} style={{background:'#1a1a1a',borderRadius:10,border:`1px solid ${unavail?'rgba(255,183,77,0.4)':'#242424'}`,overflow:'hidden',opacity:unavail?0.75:1}}>
                    <div style={{padding:'9px 12px',borderBottom:'1px solid #242424',display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                      <div style={{fontWeight:700,fontSize:13}}>{coach.name}</div>
                      <div style={{display:'flex',gap:4,alignItems:'center'}}>
                        {unavail&&<span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:4,background:'rgba(255,183,77,0.15)',color:'#ffb74d'}}>OFF</span>}
                        <span style={{fontSize:9,fontWeight:800,letterSpacing:1,padding:'2px 6px',borderRadius:4,...tagStyle}}>{tagText}</span>
                      </div>
                    </div>
                    <div style={{padding:8}}>
                      {unavail&&sess.length===0
                        ?<div style={{fontSize:11,color:'#ffb74d',textAlign:'center',padding:'12px 0'}}>Unavailable</div>
                        :sess.length===0
                          ?<div style={{fontSize:11,color:'#333',textAlign:'center',padding:'12px 0'}}>No sessions</div>
                          :sess.map(s=>(
                            <div key={s.id} style={{background:'#242424',borderRadius:6,padding:'7px 9px',marginBottom:5,borderLeft:`3px solid ${s.type==='solo'?'#4fc3f7':'#F5C518'}`,position:'relative'}}>
                              <div style={{fontSize:14,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                              <div style={{fontSize:10,color:'#666',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'calc(100% - 38px)'}}>{s.type==='solo'?`1:1 · ${s.clientName}`:s.name}</div>
                              <div style={{position:'absolute',top:4,right:4,display:'flex',gap:3}}>
                                <button onClick={()=>openEdit(s)} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',fontSize:12,lineHeight:1,padding:0,transition:'color 0.15s'}}
                                  onMouseEnter={e=>e.target.style.color='#F5C518'} onMouseLeave={e=>e.target.style.color='#333'}>✎</button>
                                <button onClick={()=>removeSession(s.id)} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',fontSize:14,lineHeight:1,padding:0,transition:'color 0.15s'}}
                                  onMouseEnter={e=>e.target.style.color='#e74c3c'} onMouseLeave={e=>e.target.style.color='#333'}>×</button>
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )
              })}
            </div>
        )}

        {opsCalView==='calendar'&&(
          <div>
            <MonthCalendar year={opsCalMonth.year} month={opsCalMonth.month} selectedDay={opsSelDay}
              onDayClick={d=>setOpsSelDay(d)} getDayDots={dk=>getOpsDayDots(dk)}/>
            {opsSelDay&&(
              <div style={{marginTop:16,background:'#1a1a1a',borderRadius:10,padding:14,border:'1px solid #242424'}}>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#F5C518',marginBottom:10}}>{fmtLong(opsSelDay)}</div>
                {getAllSessionsOnDate(opsSelDay).length===0&&getEventsOnDate(dateKey(opsSelDay)).length===0
                  ?<div style={{fontSize:12,color:'#666',textAlign:'center',padding:'12px 0'}}>No sessions or events</div>
                  :<>
                    {getAllSessionsOnDate(opsSelDay).sort((a,b)=>a.time>b.time?1:-1).map(s=>{
                      const coach=coaches.find(c=>c.id===s.coachId)
                      return(
                        <div key={s.id} style={{background:'#242424',borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${s.type==='solo'?'#4fc3f7':'#F5C518'}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700}}>{fmt12(s.time)} · {s.type==='solo'?`1:1 · ${s.clientName}`:s.name}</div>
                            <div style={{fontSize:11,color:'#666',marginTop:2}}>{coach?.name||'Unknown'}</div>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>openEdit(s)} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',fontSize:14,transition:'color 0.15s'}}
                              onMouseEnter={e=>e.target.style.color='#F5C518'} onMouseLeave={e=>e.target.style.color='#333'}>✎</button>
                            <button onClick={()=>removeSession(s.id)} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',fontSize:16,padding:'0 4px',transition:'color 0.15s'}}
                              onMouseEnter={e=>e.target.style.color='#e74c3c'} onMouseLeave={e=>e.target.style.color='#333'}>×</button>
                          </div>
                        </div>
                      )
                    })}
                    {getEventsOnDate(dateKey(opsSelDay)).map(e=>(
                      <div key={e.id} style={{background:'#242424',borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:'3px solid #ce93d8',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700}}>{fmt12(e.startTime)} · {e.title}</div>
                          <div style={{fontSize:11,color:'#666',marginTop:2}}>{e.brand==='both'?'Goalz + Shankly':e.brand==='goalz'?'Goalz':'Shankly'}</div>
                        </div>
                        <button onClick={()=>removeEvent(e.id)} style={{background:'transparent',border:'none',color:'#333',cursor:'pointer',fontSize:16,padding:'0 4px',transition:'color 0.15s'}}
                          onMouseEnter={e2=>e2.target.style.color='#e74c3c'} onMouseLeave={e2=>e2.target.style.color='#333'}>×</button>
                      </div>
                    ))}
                  </>
                }
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{position:'fixed',bottom:20,right:20,zIndex:40}}>
        <Btn gold onClick={()=>setEventOpen(true)} style={{fontSize:12,padding:'10px 16px',borderRadius:30,boxShadow:'0 4px 20px rgba(245,197,24,0.3)'}}>+ Facility Event</Btn>
      </div>

      <SoloModal open={soloOpen} onClose={()=>setSoloOpen(false)} form={soloF} setForm={setSoloF} coaches={eligibleCoaches(['solo','mixed'])} onSave={saveSolo} inp={inp}/>
      <GroupModal open={groupOpen} onClose={()=>setGroupOpen(false)} form={groupF} setForm={setGroupF} coaches={eligibleCoaches(['group','mixed'])} onSave={saveGroup} inp={inp}/>
      <CoachMgmtModal open={coachOpen} onClose={()=>setCoachOpen(false)} coaches={coaches} newC={newC} setNewC={setNewC} onAdd={addCoach} onRemove={removeCoach} inp={inp}/>
      <EventModal open={eventOpen} onClose={()=>setEventOpen(false)} form={eventF} setForm={setEventF} coaches={coaches} onSave={saveEvent} inp={inp}/>

      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit Session">
        {editSession&&<>
          <Field label="Time *"><input type="time" style={inp} value={editF.time||''} onChange={e=>setEditF(f=>({...f,time:e.target.value}))}/></Field>
          <Field label="Duration">
            <select style={inp} value={editF.dur||'60'} onChange={e=>setEditF(f=>({...f,dur:e.target.value}))}>
              <option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option>
            </select>
          </Field>
          <Field label="Assign Coach *">
            <select style={inp} value={editF.coachId||''} onChange={e=>setEditF(f=>({...f,coachId:e.target.value}))}>
              {coaches.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {editSession.type==='solo'&&<Field label="Client Name"><input style={inp} value={editF.clientName||''} onChange={e=>setEditF(f=>({...f,clientName:e.target.value}))}/></Field>}
          {editSession.type==='solo'&&<Field label="Notes"><input style={inp} value={editF.notes||''} onChange={e=>setEditF(f=>({...f,notes:e.target.value}))}/></Field>}
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
            <Btn outline onClick={()=>setEditOpen(false)}>Cancel</Btn>
            <Btn gold onClick={saveEdit}>Save Changes</Btn>
          </div>
        </>}
      </Modal>

      <Modal open={announceOpen} onClose={()=>setAnnounceOpen(false)} title="Announcement">
        <p style={{fontSize:12,color:'#666',marginBottom:14}}>Coaches see this on the landing page when they open the app.</p>
        <Field label="Message">
          <textarea style={{...inp,minHeight:80,resize:'vertical'}} value={announceText} onChange={e=>setAnnounceText(e.target.value)} placeholder="e.g. Bring extra pinnies today. Field 2 is closed."/>
        </Field>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
          {announcement&&<Btn danger onClick={()=>{clearAnnouncement();setAnnounceOpen(false)}}>Clear</Btn>}
          <Btn outline onClick={()=>setAnnounceOpen(false)}>Cancel</Btn>
          <Btn gold onClick={saveAnnouncement}>Post</Btn>
        </div>
      </Modal>

      <Modal open={availOpen} onClose={()=>setAvailOpen(false)} title="Coach Availability" wide>
        <p style={{fontSize:12,color:'#666',marginBottom:16}}>Mark a coach as unavailable on a specific date. They show as OFF in the ops view.</p>
        <Field label="Coach">
          <select style={inp} value={availCoach} onChange={e=>setAvailCoach(e.target.value)}>
            <option value="">Select a coach</option>
            {coaches.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" style={inp} value={availDate} onChange={e=>setAvailDate(e.target.value)}/></Field>
        {availCoach&&availDate&&(
          <div style={{fontSize:12,color:'#666',marginBottom:14}}>
            Status: <strong style={{color:!availability[availCoach]?.[availDate]?'#81c784':'#ffb74d'}}>{!availability[availCoach]?.[availDate]?'Available':'Unavailable'}</strong>
          </div>
        )}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
          <Btn outline onClick={()=>setAvailOpen(false)}>Done</Btn>
          <Btn gold onClick={toggleAvailability}>Toggle</Btn>
        </div>
        <div style={{marginTop:20,borderTop:'1px solid #333',paddingTop:16}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#666',marginBottom:10}}>Currently Unavailable</div>
          {Object.entries(availability).flatMap(([cId,dates])=>
            Object.entries(dates).filter(([,v])=>v).map(([dk])=>{
              const coach=coaches.find(c=>c.id===cId)
              return(
                <div key={cId+dk} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:'#242424',borderRadius:6,marginBottom:5}}>
                  <span style={{fontSize:12}}>{coach?.name||'Unknown'} · {dk}</span>
                  <button onClick={async()=>{await remove(ref(db,`availability/${cId}/${dk}`));setToast('Removed')}}
                    style={{background:'transparent',border:'none',color:'#666',cursor:'pointer',fontSize:14}}>×</button>
                </div>
              )
            })
          )}
        </div>
      </Modal>

      <Modal open={statsOpen} onClose={()=>setStatsOpen(false)} title="Session Stats" wide>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#666',marginBottom:12}}>1-on-1 Assignments per Coach</div>
        {coaches.length===0
          ?<div style={{fontSize:12,color:'#666',textAlign:'center',padding:20}}>No coaches yet</div>
          :coaches.map(c=>{
            const summerCount=getSoloCount(c.id,'summer')
            const weekCount=getSoloCount(c.id,'week')
            const maxSummer=Math.max(...coaches.map(x=>getSoloCount(x.id,'summer')),1)
            return(
              <div key={c.id} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600}}>{c.name}</span>
                  <div style={{display:'flex',gap:12}}>
                    <span style={{fontSize:11,color:'#666'}}>This week: <strong style={{color:'#f0ede6'}}>{weekCount}</strong></span>
                    <span style={{fontSize:11,color:'#666'}}>Total: <strong style={{color:'#F5C518'}}>{summerCount}</strong></span>
                  </div>
                </div>
                <div style={{background:'#242424',borderRadius:4,height:6,overflow:'hidden'}}>
                  <div style={{background:'#F5C518',height:'100%',borderRadius:4,width:`${(summerCount/maxSummer)*100}%`,transition:'width 0.3s'}}/>
                </div>
              </div>
            )
          })
        }
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}>
          <Btn outline onClick={()=>setStatsOpen(false)}>Close</Btn>
        </div>
      </Modal>

      <Toast msg={toast}/>
    </div>
  )

  if(view==='coach'){
    const currentCoach=coaches.find(c=>c.id===activeCoach)
    const next7=getNext7()
    return(
      <div style={{...PAGE,display:'flex',flexDirection:'column'}}>
        <div style={{...HDR,flexDirection:'column',alignItems:'stretch',gap:10}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:'#F5C518'}}>SHANKLY</span>
              <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#666',marginLeft:8}}>Schedule</span>
            </div>
            <HomeBtn onClick={()=>setView('landing')}/>
          </div>
          {announcement&&(
            <div style={{background:'rgba(245,197,24,0.08)',border:'1px solid rgba(245,197,24,0.2)',borderRadius:8,padding:'8px 12px',display:'flex',gap:8,alignItems:'center'}}>
              <span>📢</span>
              <span style={{fontSize:12,color:'#f0ede6'}}>{announcement.text}</span>
            </div>
          )}
          {coaches.length===0
            ?<div style={{fontSize:13,color:'#666',textAlign:'center',padding:'8px 0'}}>No coaches added yet</div>
            :<div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {coaches.map(c=>(
                <button key={c.id} onClick={()=>setActive(c.id)}
                  style={{background:activeCoach===c.id?'#F5C518':'#242424',border:`1px solid ${activeCoach===c.id?'#F5C518':'#333'}`,color:activeCoach===c.id?'#0a0a0a':'#f0ede6',fontSize:13,padding:'8px 16px',borderRadius:24,cursor:'pointer',fontFamily:'inherit',fontWeight:activeCoach===c.id?800:500,transition:'all 0.15s'}}>
                  {c.name}
                </button>
              ))}
            </div>
          }
          {currentCoach&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',padding:'3px 9px',borderRadius:4,...roleBadgeStyle(currentCoach.role)}}>{roleLabel(currentCoach.role)}</span>
              <div style={{display:'flex',gap:6}}>
                <ToggleBtn active={coachCalView==='list'} onClick={()=>setCoachCalView('list')}>☰ List</ToggleBtn>
                <ToggleBtn active={coachCalView==='calendar'} onClick={()=>setCoachCalView('calendar')}>📅 Calendar</ToggleBtn>
              </div>
            </div>
          )}
        </div>

        <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
          {loading?<Spinner/>:!currentCoach
            ?<div style={{textAlign:'center',padding:'60px 20px',color:'#666',fontSize:14}}>Select your name above to see your schedule</div>
            :coachCalView==='list'
              ?next7.map(day=>{
                const sess=getSessionsForCoach(currentCoach.id,day)
                const today=isToday(day)
                const unavail=!isCoachAvailable(currentCoach.id,day)
                return(
                  <div key={dateKey(day)} style={{marginBottom:22}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:today?'#F5C518':'#666',marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${today?'rgba(245,197,24,0.25)':'#242424'}`,display:'flex',alignItems:'center',gap:8}}>
                      {today?'Today':fmtLong(day)}
                      {unavail&&<span style={{fontSize:9,background:'rgba(255,183,77,0.15)',color:'#ffb74d',padding:'1px 6px',borderRadius:10,fontWeight:700}}>OFF</span>}
                    </div>
                    {sess.length===0
                      ?<div style={{fontSize:12,color:'#333',textAlign:'center',padding:'12px 0'}}>{unavail?'Unavailable':'No sessions scheduled'}</div>
                      :sess.map(s=>(
                        <div key={s.id} style={{background:'#1a1a1a',borderRadius:9,padding:'12px 14px',marginBottom:7,borderLeft:`3px solid ${s.type==='solo'?'#4fc3f7':'#F5C518'}`,display:'flex',alignItems:'flex-start',gap:12}}>
                          <div style={{minWidth:60}}>
                            <div style={{fontSize:19,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                            <div style={{fontSize:10,color:'#666',marginTop:2}}>{s.duration}min</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                            <div style={{fontSize:11,color:'#666'}}>{s.type==='solo'?(s.notes||'No notes'):`Group Session · ${s.duration}min`}</div>
                          </div>
                          <div style={{width:7,height:7,borderRadius:'50%',marginTop:5,flexShrink:0,background:s.type==='solo'?'#4fc3f7':'#F5C518'}}/>
                        </div>
                      ))
                    }
                  </div>
                )
              })
              :<div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,justifyContent:'center'}}>
                  <NavBtn onClick={()=>changeMonth(coachCalMonth,-1,setCoachCalMonth)}>‹</NavBtn>
                  <span style={{fontSize:15,fontWeight:800,textTransform:'uppercase'}}>{MONTHS[coachCalMonth.month]} {coachCalMonth.year}</span>
                  <NavBtn onClick={()=>changeMonth(coachCalMonth,1,setCoachCalMonth)}>›</NavBtn>
                </div>
                <MonthCalendar year={coachCalMonth.year} month={coachCalMonth.month} selectedDay={coachSelDay}
                  onDayClick={d=>setCoachSelDay(d)} getDayDots={dk=>getCoachDayDots(dk,currentCoach.id)}/>
                {coachSelDay&&(
                  <div style={{marginTop:14,background:'#1a1a1a',borderRadius:10,padding:14,border:'1px solid #242424'}}>
                    <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#F5C518',marginBottom:10}}>{fmtLong(coachSelDay)}</div>
                    {getSessionsForCoach(currentCoach.id,coachSelDay).length===0
                      ?<div style={{fontSize:12,color:'#666',textAlign:'center',padding:'12px 0'}}>No sessions this day</div>
                      :getSessionsForCoach(currentCoach.id,coachSelDay).map(s=>(
                        <div key={s.id} style={{background:'#242424',borderRadius:6,padding:'9px 11px',marginBottom:6,borderLeft:`3px solid ${s.type==='solo'?'#4fc3f7':'#F5C518'}`}}>
                          <div style={{fontSize:14,fontWeight:700}}>{fmt12(s.time)} · {s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                          <div style={{fontSize:11,color:'#666',marginTop:2}}>{s.duration}min{s.type==='solo'&&s.notes?' · '+s.notes:''}</div>
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

  if(view==='summary'){
    const allSess=getAllSessionsOnDate(summaryDate).sort((a,b)=>a.time>b.time?1:-1)
    const allEvts=getEventsOnDate(dateKey(summaryDate)).sort((a,b)=>a.startTime>b.startTime?1:-1)
    return(
      <div style={PAGE}>
        <div style={HDR}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:'#F5C518'}}>SHANKLY</span>
            <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#666'}}>Daily Summary</span>
          </div>
          <HomeBtn onClick={()=>setView('landing')}/>
        </div>
        <div style={{padding:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
            <NavBtn onClick={()=>{const d=new Date(summaryDate);d.setDate(d.getDate()-1);setSummaryDate(d)}}>‹</NavBtn>
            <span style={{fontSize:18,fontWeight:900,textTransform:'uppercase',letterSpacing:1}}>{fmtLong(summaryDate)}</span>
            {isToday(summaryDate)&&<span style={{background:'#F5C518',color:'#0a0a0a',fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',padding:'2px 8px',borderRadius:20}}>Today</span>}
            <NavBtn onClick={()=>{const d=new Date(summaryDate);d.setDate(d.getDate()+1);setSummaryDate(d)}}>›</NavBtn>
            <Btn outline onClick={()=>setSummaryDate(todayMidnight())} style={{fontSize:10,padding:'5px 10px'}}>Today</Btn>
          </div>
          {loading?<Spinner/>:<>
            <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
              <StatPill label="Total Sessions" value={allSess.length} color="#F5C518"/>
              <StatPill label="1-on-1s" value={allSess.filter(s=>s.type==='solo').length} color="#4fc3f7"/>
              <StatPill label="Groups" value={allSess.filter(s=>s.type==='group').length} color="#81c784"/>
              <StatPill label="Coaches Working" value={[...new Set(allSess.map(s=>s.coachId))].length} color="#ce93d8"/>
            </div>
            {allSess.length===0&&allEvts.length===0
              ?<div style={{textAlign:'center',padding:'60px 20px',color:'#666'}}>No sessions or events on this day</div>
              :<>
                {allSess.length>0&&(
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'#666',marginBottom:12}}>Sessions</div>
                    {allSess.map(s=>{
                      const coach=coaches.find(c=>c.id===s.coachId)
                      return(
                        <div key={s.id} style={{background:'#1a1a1a',borderRadius:9,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${s.type==='solo'?'#4fc3f7':'#F5C518'}`,display:'flex',alignItems:'center',gap:14}}>
                          <div style={{minWidth:68}}>
                            <div style={{fontSize:18,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                            <div style={{fontSize:10,color:'#666',marginTop:2}}>{s.duration}min</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700}}>{s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                            <div style={{fontSize:11,color:'#666',marginTop:2}}>{coach?.name||'Unknown coach'}{s.type==='solo'&&s.notes?' · '+s.notes:''}</div>
                          </div>
                          <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,background:s.type==='solo'?'#4fc3f7':'#F5C518'}}/>
                        </div>
                      )
                    })}
                  </div>
                )}
                {allEvts.length>0&&(
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'#666',marginBottom:12}}>Facility Events</div>
                    {allEvts.map(e=>{
                      const bc=e.brand==='goalz'?'#F5C518':e.brand==='shankly'?'#81c784':'#ce93d8'
                      return(
                        <div key={e.id} style={{background:'#1a1a1a',borderRadius:9,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${bc}`,display:'flex',alignItems:'center',gap:14}}>
                          <div style={{minWidth:68}}>
                            <div style={{fontSize:18,fontWeight:900,lineHeight:1}}>{fmt12(e.startTime)}</div>
                            {e.endTime&&<div style={{fontSize:10,color:'#666',marginTop:2}}>{fmt12(e.endTime)}</div>}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700}}>{e.title}</div>
                            <div style={{fontSize:11,color:'#666',marginTop:2}}>{e.brand==='both'?'Goalz + Shankly':e.brand==='goalz'?'Goalz':'Shankly'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'#666',marginBottom:12}}>Coach Breakdown</div>
                  {coaches.map(coach=>{
                    const sess=getSessionsForCoach(coach.id,summaryDate)
                    const unavail=!isCoachAvailable(coach.id,summaryDate)
                    if(sess.length===0&&!unavail)return null
                    return(
                      <div key={coach.id} style={{background:'#1a1a1a',borderRadius:8,padding:'10px 14px',marginBottom:8,border:'1px solid #242424'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:sess.length>0?8:0}}>
                          <span style={{fontWeight:700,fontSize:13}}>{coach.name}</span>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            {unavail&&<span style={{fontSize:9,background:'rgba(255,183,77,0.15)',color:'#ffb74d',padding:'2px 6px',borderRadius:10,fontWeight:700}}>OFF</span>}
                            <span style={{fontSize:11,color:'#666'}}>{sess.length} session{sess.length!==1?'s':''}</span>
                          </div>
                        </div>
                        {sess.map(s=>(
                          <div key={s.id} style={{fontSize:12,color:'#666',paddingLeft:8,borderLeft:`2px solid ${s.type==='solo'?'#4fc3f7':'#F5C518'}`,marginBottom:4}}>
                            {fmt12(s.time)} · {s.type==='solo'?`1:1 ${s.clientName}`:s.name}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </>
            }
          </>}
        </div>
        <Toast msg={toast}/>
      </div>
    )
  }

  if(view==='facility'){
    const selDk=facSelDay?dateKey(facSelDay):null
    const selEvents=selDk?getEventsOnDate(selDk):[]
    return(
      <div style={PAGE}>
        <div style={HDR}>
          <div>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:'#F5C518'}}>SHANKLY</span>
            <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#666',marginLeft:8}}>Facility</span>
          </div>
          <HomeBtn onClick={()=>setView('landing')}/>
        </div>
        <div style={{padding:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,justifyContent:'center'}}>
            <NavBtn onClick={()=>changeMonth(facCalMonth,-1,setFacCalMonth)}>‹</NavBtn>
            <span style={{fontSize:18,fontWeight:900,textTransform:'uppercase',letterSpacing:1}}>{MONTHS[facCalMonth.month]} {facCalMonth.year}</span>
            <NavBtn onClick={()=>changeMonth(facCalMonth,1,setFacCalMonth)}>›</NavBtn>
          </div>
          <div style={{display:'flex',gap:14,marginBottom:14,justifyContent:'center',flexWrap:'wrap'}}>
            {[['#ce93d8','Event'],['#F5C518','Goalz'],['#81c784','Shankly']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#666'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}
              </div>
            ))}
          </div>
          <MonthCalendar year={facCalMonth.year} month={facCalMonth.month} selectedDay={facSelDay}
            onDayClick={d=>setFacSelDay(d)}
            getDayDots={dk=>getEventsOnDate(dk).map(e=>e.brand==='goalz'?'#F5C518':e.brand==='shankly'?'#81c784':'#ce93d8')}/>
          {facSelDay&&(
            <div style={{marginTop:16,background:'#1a1a1a',borderRadius:12,padding:16,border:'1px solid #242424'}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'#F5C518',marginBottom:12}}>{fmtLong(facSelDay)}</div>
              {selEvents.length===0
                ?<div style={{fontSize:13,color:'#666',textAlign:'center',padding:'16px 0'}}>No events scheduled</div>
                :selEvents.sort((a,b)=>a.startTime>b.startTime?1:-1).map(e=>{
                  const bc=e.brand==='goalz'?'#F5C518':e.brand==='shankly'?'#81c784':'#ce93d8'
                  const bl=e.brand==='both'?'Goalz + Shankly':e.brand==='goalz'?'Goalz':'Shankly'
                  const involvedCoaches=coaches.filter(c=>e.coachIds&&e.coachIds.includes(c.id))
                  return(
                    <div key={e.id} style={{background:'#242424',borderRadius:8,padding:'12px 14px',marginBottom:10,borderLeft:`3px solid ${bc}`}}>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{e.title}</div>
                      <div style={{fontSize:12,color:'#666',marginBottom:4}}>{fmt12(e.startTime)}{e.endTime?' – '+fmt12(e.endTime):''}</div>
                      <span style={{fontSize:10,fontWeight:700,letterSpacing:1,padding:'2px 8px',borderRadius:20,background:`${bc}22`,color:bc}}>{bl}</span>
                      {involvedCoaches.length>0&&(
                        <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:5}}>
                          {involvedCoaches.map(c=><span key={c.id} style={{fontSize:10,background:'#333',color:'#f0ede6',padding:'2px 8px',borderRadius:20}}>{c.name}</span>)}
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </div>
          )}
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'#666',marginBottom:12}}>Upcoming Events</div>
            {events.length===0
              ?<div style={{fontSize:13,color:'#666',textAlign:'center',padding:'20px 0'}}>No facility events yet</div>
              :events.filter(e=>new Date(e.date+'T00:00:00')>=todayMidnight()).sort((a,b)=>a.date>b.date?1:-1).slice(0,10).map(e=>{
                const bc=e.brand==='goalz'?'#F5C518':e.brand==='shankly'?'#81c784':'#ce93d8'
                const d=new Date(e.date+'T00:00:00')
                return(
                  <div key={e.id} onClick={()=>{setFacSelDay(d);setFacCalMonth({year:d.getFullYear(),month:d.getMonth()})}}
                    style={{background:'#1a1a1a',borderRadius:8,padding:'11px 14px',marginBottom:8,borderLeft:`3px solid ${bc}`,cursor:'pointer',transition:'background 0.15s'}}
                    onMouseEnter={e2=>e2.currentTarget.style.background='#242424'}
                    onMouseLeave={e2=>e2.currentTarget.style.background='#1a1a1a'}>
                    <div style={{fontSize:13,fontWeight:700}}>{e.title}</div>
                    <div style={{fontSize:11,color:'#666',marginTop:2}}>{fmtLong(d)} · {fmt12(e.startTime)}</div>
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
