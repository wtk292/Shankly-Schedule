import { useState, useEffect, useRef } from 'react'
import { db } from './firebase.js'
import { ref, onValue, push, remove, set } from 'firebase/database'

const PASSWORD = 'Shankly2026'
const GOLD='#F5C518',BLACK='#0a0a0a',GRAY='#1a1a1a',GRAY2='#242424',GRAY3='#333',WHITE='#f0ede6',DIM='#666',BLUE='#4fc3f7',GREEN='#81c784',RED='#e74c3c',PURPLE='#ce93d8',ORANGE='#ffb74d'
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAYS_FULL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_S=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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
  if(r==='group')return{background:'rgba(245,197,24,0.13)',color:GOLD}
  if(r==='solo')return{background:'rgba(79,195,247,0.13)',color:BLUE}
  return{background:'rgba(129,199,132,0.13)',color:GREEN}
}
function objToArr(obj){if(!obj)return[];return Object.entries(obj).map(([id,val])=>({...val,id}))}
function getWeekStart(){const d=todayMidnight();d.setDate(d.getDate()-d.getDay());return d}
function getWeekEnd(){const d=getWeekStart();d.setDate(d.getDate()+6);return d}
function fmtTime(ts){const d=new Date(ts);return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}

const inp={width:'100%',background:BLACK,border:`1px solid ${GRAY3}`,borderRadius:7,color:WHITE,fontFamily:'inherit',fontSize:14,padding:'10px 12px',outline:'none',WebkitAppearance:'none',appearance:'none',boxSizing:'border-box'}
const lbl={display:'block',fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:DIM,marginBottom:6}
const PAGE={minHeight:'100vh',background:BLACK,color:WHITE,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"}
const HDR={background:BLACK,borderBottom:`1px solid rgba(245,197,24,0.18)`,padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}

function Btn({gold,outline,danger,onClick,children,style={},disabled=false}){
  const[h,setH]=useState(false)
  const base={fontSize:12,fontWeight:700,padding:'8px 14px',borderRadius:7,cursor:disabled?'not-allowed':'pointer',border:'none',letterSpacing:0.3,transition:'all 0.15s',fontFamily:'inherit',whiteSpace:'nowrap',opacity:disabled?0.5:1,...style}
  if(gold)return<button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,background:h?'#ffd740':GOLD,color:BLACK}}>{children}</button>
  if(danger)return<button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,background:h?'#922':'transparent',color:h?WHITE:RED,border:'1px solid #922'}}>{children}</button>
  if(outline)return<button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,background:'transparent',color:h?GOLD:WHITE,border:`1px solid ${h?GOLD:GRAY3}`}}>{children}</button>
  return<button disabled={disabled} onClick={onClick} style={{...base,background:'transparent',border:'none',color:DIM}}>{children}</button>
}

function ToggleBtn({active,onClick,children}){
  return<button onClick={onClick} style={{background:active?GOLD:GRAY2,border:`1px solid ${active?GOLD:GRAY3}`,color:active?BLACK:WHITE,fontSize:11,fontWeight:700,padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',letterSpacing:0.5}}>{children}</button>
}

function NavBtn({onClick,children}){
  const[h,setH]=useState(false)
  return<button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:GRAY2,border:`1px solid ${h?GOLD:GRAY3}`,color:h?GOLD:WHITE,width:32,height:32,borderRadius:7,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>{children}</button>
}

function Modal({open,onClose,title,children,wide=false}){
  if(!open)return null
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:GRAY,border:`1px solid rgba(245,197,24,0.2)`,borderRadius:14,padding:'26px 24px',width:'100%',maxWidth:wide?520:460,maxHeight:'92vh',overflowY:'auto',animation:'popIn 0.18s ease'}}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{fontSize:22,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:GOLD,marginBottom:20}}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function Field({label,children}){return<div style={{marginBottom:14}}><label style={lbl}>{label}</label>{children}</div>}

function Toast({msg}){
  if(!msg)return null
  return<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:GOLD,color:BLACK,fontWeight:700,fontSize:13,padding:'10px 22px',borderRadius:30,zIndex:999,pointerEvents:'none',whiteSpace:'nowrap'}}>{msg}</div>
}

function Spinner(){
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 20px'}}>
      <div style={{width:26,height:26,border:`3px solid ${GRAY3}`,borderTopColor:GOLD,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
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
        {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,letterSpacing:1,color:DIM,padding:'4px 0'}}>{d}</div>)}
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
              style={{aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:'pointer',transition:'all 0.15s',gap:2,background:isSelected?GOLD:isTodayDay?'rgba(245,197,24,0.15)':'transparent',border:isTodayDay&&!isSelected?`1px solid rgba(245,197,24,0.4)`:'1px solid transparent'}}>
              <span style={{fontSize:13,fontWeight:isTodayDay||isSelected?700:400,color:isSelected?BLACK:isTodayDay?GOLD:WHITE,lineHeight:1}}>{day}</span>
              {dots.length>0&&<div style={{display:'flex',gap:2}}>{dots.slice(0,3).map((c,idx)=><div key={idx} style={{width:4,height:4,borderRadius:'50%',background:isSelected?BLACK:c}}/>)}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatPill({label,value,color}){
  return(
    <div style={{background:GRAY,border:`1px solid ${GRAY2}`,borderRadius:10,padding:'12px 16px',flex:1,minWidth:90,textAlign:'center'}}>
      <div style={{fontSize:26,fontWeight:900,color,lineHeight:1}}>{value}</div>
      <div style={{fontSize:10,color:DIM,marginTop:4,letterSpacing:0.5}}>{label}</div>
    </div>
  )
}

function PinPad({value,onChange,maxLen=4}){
  const digits=['1','2','3','4','5','6','7','8','9','','0','⌫']
  return(
    <div>
      <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:20}}>
        {Array.from({length:maxLen}).map((_,i)=>(
          <div key={i} style={{width:14,height:14,borderRadius:'50%',background:value.length>i?GOLD:GRAY3,transition:'background 0.15s'}}/>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,maxWidth:240,margin:'0 auto'}}>
        {digits.map((d,i)=>(
          d===''?<div key={i}/>:
          <button key={i} onClick={()=>{
            if(d==='⌫')onChange(value.slice(0,-1))
            else if(value.length<maxLen)onChange(value+d)
          }} style={{background:GRAY2,border:`1px solid ${GRAY3}`,color:d==='⌫'?DIM:WHITE,fontSize:d==='⌫'?18:20,fontWeight:700,padding:'16px 0',borderRadius:10,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
            onMouseLeave={e=>e.currentTarget.style.borderColor=GRAY3}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

function SoloModal({open,onClose,form,setForm,coaches,onSave}){
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

function GroupModal({open,onClose,form,setForm,coaches,onSave}){
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

function EventModal({open,onClose,form,setForm,coaches,onSave}){
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
          {coaches.length===0?<span style={{fontSize:12,color:DIM}}>No coaches yet</span>
            :coaches.map(c=>{
              const selected=(form.coachIds||[]).includes(c.id)
              return<button key={c.id} onClick={()=>toggleCoach(c.id)}
                style={{background:selected?GOLD:GRAY2,border:`1px solid ${selected?GOLD:GRAY3}`,color:selected?BLACK:WHITE,fontSize:11,padding:'5px 11px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',fontWeight:selected?700:400,transition:'all 0.15s'}}>
                {c.name.replace('Coach ','')}
              </button>
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
  const[messages,setMessages]=useState([])
  const[announcement,setAnnouncement]=useState(null)
  const[availability,setAvailability]=useState({})
  const[timeOffRequests,setTimeOffRequests]=useState([])
  const[loading,setLoading]=useState(true)
  const[toast,setToast]=useState('')
  const[loggedInCoach,setLoggedInCoach]=useState(null)

  const[opsDate,setOpsDate]=useState(todayMidnight)
  const[summaryDate,setSummaryDate]=useState(todayMidnight)
  const[pwVal,setPwVal]=useState('')
  const[pwError,setPwError]=useState('')
  const[opsCalView,setOpsCalView]=useState('list')
  const[opsCalMonth,setOpsCalMonth]=useState({year:new Date().getFullYear(),month:new Date().getMonth()})
  const[opsSelDay,setOpsSelDay]=useState(null)

  const[coachCalView,setCoachCalView]=useState('list')
  const[coachCalMonth,setCoachCalMonth]=useState({year:new Date().getFullYear(),month:new Date().getMonth()})
  const[coachSelDay,setCoachSelDay]=useState(null)
  const[coachTab,setCoachTab]=useState('schedule')

  const[facCalMonth,setFacCalMonth]=useState({year:new Date().getFullYear(),month:new Date().getMonth()})
  const[facSelDay,setFacSelDay]=useState(null)

  const[pinVal,setPinVal]=useState('')
  const[pinError,setPinError]=useState('')

  const[soloOpen,setSoloOpen]=useState(false)
  const[groupOpen,setGroupOpen]=useState(false)
  const[coachMgmtOpen,setCoachMgmtOpen]=useState(false)
  const[eventOpen,setEventOpen]=useState(false)
  const[editOpen,setEditOpen]=useState(false)
  const[editSession,setEditSession]=useState(null)
  const[announceOpen,setAnnounceOpen]=useState(false)
  const[availOpen,setAvailOpen]=useState(false)
  const[statsOpen,setStatsOpen]=useState(false)
  const[timeOffOpen,setTimeOffOpen]=useState(false)
  const[timeOffReqOpen,setTimeOffReqOpen]=useState(false)

  const blankSolo={client:'',date:'',time:'',dur:'60',coachId:'',notes:''}
  const blankGroup={name:'',repeat:'weekly',dow:'1',date:'',time:'',dur:'60',coachId:''}
  const blankEvent={title:'',date:'',startTime:'',endTime:'',coachIds:[],brand:'both'}
  const blankNewCoach={name:'',role:'mixed',pin:'',isAdmin:false}
  const blankTimeOffReq={startDate:'',endDate:'',reason:''}
  const[soloF,setSoloF]=useState(blankSolo)
  const[groupF,setGroupF]=useState(blankGroup)
  const[eventF,setEventF]=useState(blankEvent)
  const[editF,setEditF]=useState({})
  const[newCoach,setNewCoach]=useState(blankNewCoach)
  const[announceText,setAnnounceText]=useState('')
  const[availCoach,setAvailCoach]=useState('')
  const[availDate,setAvailDate]=useState('')
  const[chatMsg,setChatMsg]=useState('')
  const[editCoach,setEditCoach]=useState(null)
  const[editCoachPin,setEditCoachPin]=useState('')
  const[timeOffReqF,setTimeOffReqF]=useState(blankTimeOffReq)
  const chatEndRef=useRef(null)

  useEffect(()=>{
    let d=[false,false,false,false,false,false,false]
    const check=()=>{if(d.every(Boolean))setLoading(false)}
    const u1=onValue(ref(db,'coaches'),s=>{setCoaches(objToArr(s.val()));d[0]=true;check()})
    const u2=onValue(ref(db,'sessions'),s=>{setSessions(objToArr(s.val()));d[1]=true;check()})
    const u3=onValue(ref(db,'facEvents'),s=>{setEvents(objToArr(s.val()));d[2]=true;check()})
    const u4=onValue(ref(db,'announcement'),s=>{setAnnouncement(s.val());d[3]=true;check()})
    const u5=onValue(ref(db,'availability'),s=>{setAvailability(s.val()||{});d[4]=true;check()})
    const u6=onValue(ref(db,'chat'),s=>{setMessages(objToArr(s.val()).sort((a,b)=>a.ts-b.ts));d[5]=true;check()})
    const u7=onValue(ref(db,'timeOff'),s=>{setTimeOffRequests(objToArr(s.val()));d[6]=true;check()})
    return()=>{u1();u2();u3();u4();u5();u6();u7()}
  },[])

  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2400);return()=>clearTimeout(t)},[toast])
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'})},[messages,coachTab])

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

  const pendingTimeOff=timeOffRequests.filter(r=>r.status==='pending')

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
    if(!editF.time||!editF.coachId){setToast('Fill in required fields');return}
    const updates={...editSession,...editF,duration:parseInt(editF.dur||editSession.duration)}
    delete updates.id
    await set(ref(db,`sessions/${editSession.id}`),updates)
    setEditOpen(false);setToast('Session updated ✓')
  }

  async function addCoach(){
    if(!newCoach.name.trim()){setToast('Enter a name');return}
    if(!newCoach.pin||newCoach.pin.length<4){setToast('PIN must be at least 4 digits');return}
    if(coaches.some(c=>c.pin===newCoach.pin)){setToast('That PIN is already taken');return}
    await push(ref(db,'coaches'),{name:newCoach.name.trim(),role:newCoach.role,pin:newCoach.pin,isAdmin:newCoach.isAdmin||false})
    setNewCoach(blankNewCoach);setToast(`${newCoach.name.trim()} added ✓`)
  }

  async function removeCoach(id){
    await remove(ref(db,`coaches/${id}`))
    await Promise.all(sessions.filter(s=>s.coachId===id).map(s=>remove(ref(db,`sessions/${s.id}`))))
    setToast('Coach removed')
  }

  async function updateCoachPin(){
    if(!editCoachPin||editCoachPin.length<4){setToast('PIN must be at least 4 digits');return}
    if(coaches.some(c=>c.pin===editCoachPin&&c.id!==editCoach.id)){setToast('That PIN is already taken');return}
    await set(ref(db,`coaches/${editCoach.id}/pin`),editCoachPin)
    setEditCoach(null);setEditCoachPin('');setToast('PIN updated ✓')
  }

  async function toggleAdminStatus(coach){
    await set(ref(db,`coaches/${coach.id}/isAdmin`),!coach.isAdmin)
    setToast(`${coach.name} ${!coach.isAdmin?'is now an admin':'is no longer an admin'}`)
  }

  async function removeSession(id){await remove(ref(db,`sessions/${id}`));setToast('Session removed')}

  async function saveEvent(){
    if(!eventF.title||!eventF.date||!eventF.startTime){setToast('Fill in required fields');return}
    await push(ref(db,'facEvents'),{title:eventF.title,date:eventF.date,startTime:eventF.startTime,endTime:eventF.endTime,coachIds:eventF.coachIds,brand:eventF.brand})
    setEventOpen(false);setEventF(blankEvent);setToast('Event added ✓')
  }

  async function removeEvent(id){await remove(ref(db,`facEvents/${id}`));setToast('Event removed')}

  async function saveAnnouncement(){
    if(!announceText.trim()){setToast('Enter a message');return}
    await set(ref(db,'announcement'),{text:announceText.trim(),ts:Date.now()})
    setAnnounceOpen(false);setAnnounceText('');setToast('Announcement posted ✓')
  }

  async function clearAnnouncement(){await remove(ref(db,'announcement'));setToast('Cleared')}

  async function toggleAvailability(){
    if(!availCoach||!availDate){setToast('Select coach and date');return}
    const current=availability[availCoach]?.[availDate]
    if(current)await remove(ref(db,`availability/${availCoach}/${availDate}`))
    else await set(ref(db,`availability/${availCoach}/${availDate}`),true)
    setToast(current?'Marked available':'Marked unavailable')
  }

  async function sendMessage(){
    if(!chatMsg.trim()||!loggedInCoach)return
    await push(ref(db,'chat'),{coachId:loggedInCoach.id,coachName:loggedInCoach.name,text:chatMsg.trim(),ts:Date.now()})
    setChatMsg('')
  }

  async function submitTimeOffRequest(){
    if(!timeOffReqF.startDate||!timeOffReqF.endDate){setToast('Select start and end dates');return}
    if(!loggedInCoach)return
    await push(ref(db,'timeOff'),{coachId:loggedInCoach.id,coachName:loggedInCoach.name,startDate:timeOffReqF.startDate,endDate:timeOffReqF.endDate,reason:timeOffReqF.reason,status:'pending',submittedAt:Date.now()})
    setTimeOffReqOpen(false);setTimeOffReqF(blankTimeOffReq);setToast('Time off request submitted ✓')
  }

  async function approveTimeOff(req){
    const start=new Date(req.startDate+'T00:00:00'),end=new Date(req.endDate+'T00:00:00')
    let cur=new Date(start)
    while(cur<=end){await set(ref(db,`availability/${req.coachId}/${dateKey(cur)}`),true);cur=addDays(cur,1)}
    await set(ref(db,`timeOff/${req.id}/status`),'approved')
    setToast('Approved — dates marked unavailable')
  }

  async function denyTimeOff(id){await set(ref(db,`timeOff/${id}/status`),'denied');setToast('Request denied')}
  async function deleteTimeOffRequest(id){await remove(ref(db,`timeOff/${id}`));setToast('Request deleted')}

  function checkOpsPassword(){
    if(pwVal===PASSWORD){setPwError('');setPwVal('');setView('ops')}
    else{setPwError('Incorrect password.');setPwVal('')}
  }

  function checkPin(pin){
    const coach=coaches.find(c=>c.pin===pin)
    if(coach){setLoggedInCoach(coach);setPinVal('');setPinError('');setCoachTab('schedule');setView('coach')}
    else{setPinError('Incorrect PIN. Try again.');setPinVal('')}
  }

  function logout(){setLoggedInCoach(null);setView('landing');setCoachTab('schedule')}

  useEffect(()=>{
    if(pinVal.length>=4&&view==='pin'){checkPin(pinVal)}
  },[pinVal,coaches])

  if(view==='landing')return(
    <div style={{...PAGE,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 20px',textAlign:'center'}}>
      <div style={{fontSize:52,fontWeight:900,letterSpacing:6,textTransform:'uppercase',color:GOLD,lineHeight:1}}>SHANKLY</div>
      <div style={{fontSize:11,letterSpacing:4,textTransform:'uppercase',color:DIM,margin:'6px 0 52px'}}>Elite Training · Schedule</div>
      <div style={{display:'flex',flexDirection:'column',gap:14,width:'100%',maxWidth:340}}>
        <button onClick={()=>{setPinVal('');setPinError('');setView('pin')}}
          style={{background:GOLD,border:'none',color:BLACK,fontSize:16,fontWeight:900,padding:'18px',borderRadius:12,cursor:'pointer',letterSpacing:1,fontFamily:'inherit',transition:'all 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.background='#ffd740'}
          onMouseLeave={e=>e.currentTarget.style.background=GOLD}>
          🔐 Coach Login
        </button>
        <button onClick={()=>{setPwVal('');setPwError('');setView('password')}}
          style={{background:'transparent',border:`1px solid ${GRAY3}`,color:WHITE,fontSize:14,fontWeight:700,padding:'16px',borderRadius:12,cursor:'pointer',letterSpacing:0.5,fontFamily:'inherit',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=GOLD}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=GRAY3;e.currentTarget.style.color=WHITE}}>
          ⚡ Staff Login
        </button>
      </div>
    </div>
  )

  if(view==='pin')return(
    <div style={{...PAGE,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,fontWeight:900,letterSpacing:5,textTransform:'uppercase',color:GOLD,marginBottom:4}}>SHANKLY</div>
      <div style={{fontSize:10,letterSpacing:3,textTransform:'uppercase',color:DIM,marginBottom:32}}>Coach Login</div>
      <div style={{background:GRAY,border:`1px solid rgba(245,197,24,0.2)`,borderRadius:14,padding:'32px 28px',width:'100%',maxWidth:340}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Enter your PIN</div>
        <div style={{fontSize:12,color:DIM,marginBottom:24}}>Your unique code</div>
        <PinPad value={pinVal} onChange={v=>{setPinError('');setPinVal(v)}} maxLen={6}/>
        {pinError&&<div style={{fontSize:12,color:RED,marginTop:16}}>{pinError}</div>}
        <div onClick={()=>{setView('landing');setPinVal('');setPinError('')}} style={{fontSize:12,color:DIM,cursor:'pointer',marginTop:20,textDecoration:'underline'}}>← Back</div>
      </div>
    </div>
  )

  if(view==='password')return(
    <div style={{...PAGE,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,fontWeight:900,letterSpacing:5,textTransform:'uppercase',color:GOLD,marginBottom:4}}>SHANKLY</div>
      <div style={{fontSize:10,letterSpacing:3,textTransform:'uppercase',color:DIM,marginBottom:36}}>Ops Access</div>
      <div style={{background:GRAY,border:`1px solid rgba(245,197,24,0.2)`,borderRadius:14,padding:'32px 28px',width:'100%',maxWidth:360}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Staff Only</div>
        <div style={{fontSize:12,color:DIM,marginBottom:22}}>Enter the ops password to continue</div>
        <input style={{...inp,marginBottom:12,letterSpacing:3,textAlign:'center',fontSize:16}} type="password" placeholder="••••••••••"
          value={pwVal} onChange={e=>setPwVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkOpsPassword()} autoFocus/>
        {pwError&&<div style={{fontSize:12,color:RED,marginBottom:12}}>{pwError}</div>}
        <Btn gold onClick={checkOpsPassword} style={{width:'100%',padding:12,fontSize:14}}>Enter</Btn>
        <div onClick={()=>{setView('landing');setPwError('');setPwVal('')}} style={{fontSize:12,color:DIM,cursor:'pointer',marginTop:16,textDecoration:'underline'}}>← Back</div>
      </div>
    </div>
  )

  if(view==='ops'){
    const pendingCount=pendingTimeOff.length
    return(
      <div style={PAGE}>
        <div style={HDR}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:GOLD}}>SHANKLY</span>
            <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:DIM}}>Ops</span>
          </div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
            <Btn outline onClick={()=>setCoachMgmtOpen(true)}>Coaches</Btn>
            <Btn outline onClick={()=>setAvailOpen(true)}>Availability</Btn>
            <Btn outline onClick={()=>setStatsOpen(true)}>Stats</Btn>
            <Btn outline onClick={()=>{setAnnounceText(announcement?.text||'');setAnnounceOpen(true)}}>📢</Btn>
            <button onClick={()=>setTimeOffOpen(true)} style={{background:'transparent',border:`1px solid ${pendingCount>0?ORANGE:GRAY3}`,color:pendingCount>0?ORANGE:WHITE,fontSize:12,fontWeight:700,padding:'8px 14px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              Time Off{pendingCount>0&&<span style={{background:ORANGE,color:BLACK,fontSize:9,fontWeight:900,padding:'1px 5px',borderRadius:10,marginLeft:5}}>{pendingCount}</span>}
            </button>
            <Btn outline onClick={()=>{setGroupF({...blankGroup,coachId:eligibleCoaches(['group','mixed'])[0]?.id||''});setGroupOpen(true)}}>+ Group</Btn>
            <Btn gold onClick={()=>{setSoloF({...blankSolo,date:dateKey(opsDate),coachId:eligibleCoaches(['solo','mixed'])[0]?.id||''});setSoloOpen(true)}}>+ 1-on-1</Btn>
            {loggedInCoach
              ?<Btn outline onClick={()=>setView('coach')}>← My Schedule</Btn>
              :<button onClick={()=>setView('landing')} style={{background:'transparent',border:`1px solid ${GRAY3}`,color:DIM,fontSize:12,fontWeight:700,padding:'8px 14px',borderRadius:7,cursor:'pointer',fontFamily:'inherit'}}>Log Out</button>
            }
          </div>
        </div>

        {announcement&&(
          <div style={{background:'rgba(245,197,24,0.08)',borderBottom:`1px solid rgba(245,197,24,0.2)`,padding:'10px 16px',display:'flex',alignItems:'center',gap:10,justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}><span>📢</span><span style={{fontSize:12,color:WHITE}}>{announcement.text}</span></div>
            <button onClick={clearAnnouncement} style={{background:'transparent',border:'none',color:DIM,cursor:'pointer',fontSize:18}}>×</button>
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
                {isToday(opsDate)&&<span style={{background:GOLD,color:BLACK,fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',padding:'2px 8px',borderRadius:20}}>Today</span>}
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
            {[[GOLD,'Group'],[BLUE,'1-on-1'],[PURPLE,'Facility'],[ORANGE,'Unavailable']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:DIM}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}
              </div>
            ))}
          </div>

          {opsCalView==='list'&&(
            loading?<Spinner/>:coaches.length===0
              ?<div style={{textAlign:'center',padding:'60px 20px',color:DIM}}>No coaches yet. Click <strong style={{color:GOLD}}>Coaches</strong> to add your team.</div>
              :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10}}>
                {coaches.map(coach=>{
                  const sess=getSessionsForCoach(coach.id,opsDate)
                  const unavail=!isCoachAvailable(coach.id,opsDate)
                  const tagStyle=coach.role==='group'?{background:'rgba(245,197,24,0.13)',color:GOLD}:coach.role==='solo'?{background:'rgba(79,195,247,0.13)',color:BLUE}:{background:'rgba(129,199,132,0.13)',color:GREEN}
                  const tagText=coach.role==='group'?'GRP':coach.role==='solo'?'1:1':'MIX'
                  return(
                    <div key={coach.id} style={{background:GRAY,borderRadius:10,border:`1px solid ${unavail?'rgba(255,183,77,0.4)':GRAY2}`,overflow:'hidden',opacity:unavail?0.75:1}}>
                      <div style={{padding:'9px 12px',borderBottom:`1px solid ${GRAY2}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                        <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:5}}>
                          {coach.name}
                          {coach.isAdmin&&<span style={{fontSize:8,background:'rgba(245,197,24,0.2)',color:GOLD,padding:'1px 5px',borderRadius:4,fontWeight:800}}>ADMIN</span>}
                        </div>
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          {unavail&&<span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:4,background:'rgba(255,183,77,0.15)',color:ORANGE}}>OFF</span>}
                          <span style={{fontSize:9,fontWeight:800,letterSpacing:1,padding:'2px 6px',borderRadius:4,...tagStyle}}>{tagText}</span>
                        </div>
                      </div>
                      <div style={{padding:8}}>
                        {unavail&&sess.length===0
                          ?<div style={{fontSize:11,color:ORANGE,textAlign:'center',padding:'12px 0'}}>Unavailable</div>
                          :sess.length===0
                            ?<div style={{fontSize:11,color:GRAY3,textAlign:'center',padding:'12px 0'}}>No sessions</div>
                            :sess.map(s=>(
                              <div key={s.id} style={{background:GRAY2,borderRadius:6,padding:'7px 9px',marginBottom:5,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,position:'relative'}}>
                                <div style={{fontSize:14,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                                <div style={{fontSize:10,color:DIM,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'calc(100% - 38px)'}}>{s.type==='solo'?`1:1 · ${s.clientName}`:s.name}</div>
                                <div style={{position:'absolute',top:4,right:4,display:'flex',gap:3}}>
                                  <button onClick={()=>openEdit(s)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:12,lineHeight:1,padding:0,transition:'color 0.15s'}}
                                    onMouseEnter={e=>e.target.style.color=GOLD} onMouseLeave={e=>e.target.style.color=GRAY3}>✎</button>
                                  <button onClick={()=>removeSession(s.id)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:14,lineHeight:1,padding:0,transition:'color 0.15s'}}
                                    onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=GRAY3}>×</button>
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
                <div style={{marginTop:16,background:GRAY,borderRadius:10,padding:14,border:`1px solid ${GRAY2}`}}>
                  <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:GOLD,marginBottom:10}}>{fmtLong(opsSelDay)}</div>
                  {getAllSessionsOnDate(opsSelDay).length===0&&getEventsOnDate(dateKey(opsSelDay)).length===0
                    ?<div style={{fontSize:12,color:DIM,textAlign:'center',padding:'12px 0'}}>No sessions or events</div>
                    :<>
                      {getAllSessionsOnDate(opsSelDay).sort((a,b)=>a.time>b.time?1:-1).map(s=>{
                        const coach=coaches.find(c=>c.id===s.coachId)
                        return(
                          <div key={s.id} style={{background:GRAY2,borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:700}}>{fmt12(s.time)} · {s.type==='solo'?`1:1 · ${s.clientName}`:s.name}</div>
                              <div style={{fontSize:11,color:DIM,marginTop:2}}>{coach?.name||'Unknown'}</div>
                            </div>
                            <div style={{display:'flex',gap:6}}>
                              <button onClick={()=>openEdit(s)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:14,transition:'color 0.15s'}}
                                onMouseEnter={e=>e.target.style.color=GOLD} onMouseLeave={e=>e.target.style.color=GRAY3}>✎</button>
                              <button onClick={()=>removeSession(s.id)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:16,padding:'0 4px',transition:'color 0.15s'}}
                                onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=GRAY3}>×</button>
                            </div>
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

        <div style={{position:'fixed',bottom:20,right:20,zIndex:40}}>
          <Btn gold onClick={()=>setEventOpen(true)} style={{fontSize:12,padding:'10px 16px',borderRadius:30,boxShadow:'0 4px 20px rgba(245,197,24,0.3)'}}>+ Facility Event</Btn>
        </div>

        <SoloModal open={soloOpen} onClose={()=>setSoloOpen(false)} form={soloF} setForm={setSoloF} coaches={eligibleCoaches(['solo','mixed'])} onSave={saveSolo}/>
        <GroupModal open={groupOpen} onClose={()=>setGroupOpen(false)} form={groupF} setForm={setGroupF} coaches={eligibleCoaches(['group','mixed'])} onSave={saveGroup}/>
        <EventModal open={eventOpen} onClose={()=>setEventOpen(false)} form={eventF} setForm={setEventF} coaches={coaches} onSave={saveEvent}/>

        <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit Session">
          {editSession&&<>
            <Field label="Time *"><input type="time" style={inp} value={editF.time||''} onChange={e=>setEditF(f=>({...f,time:e.target.value}))}/></Field>
            <Field label="Duration">
              <select style={inp} value={editF.dur||'60'} onChange={e=>setEditF(f=>({...f,dur:e.target.value}))}>
                <option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option>
              </select>
            </Field>
            <Field label="Coach">
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

        <Modal open={coachMgmtOpen} onClose={()=>setCoachMgmtOpen(false)} title="Manage Coaches" wide>
          <div style={{maxHeight:260,overflowY:'auto',marginBottom:16}}>
            {coaches.length===0
              ?<div style={{color:DIM,fontSize:13,textAlign:'center',padding:20}}>No coaches yet</div>
              :coaches.map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:BLACK,borderRadius:7,marginBottom:6,border:`1px solid ${GRAY2}`,gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:6}}>
                      {c.name}
                      {c.isAdmin&&<span style={{fontSize:9,background:'rgba(245,197,24,0.15)',color:GOLD,padding:'1px 6px',borderRadius:4,fontWeight:800}}>ADMIN</span>}
                    </div>
                    <div style={{fontSize:11,color:DIM,marginTop:2}}>{roleLabel(c.role)} · PIN: {c.pin||'—'}</div>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <button onClick={()=>toggleAdminStatus(c)}
                      style={{background:c.isAdmin?'rgba(245,197,24,0.12)':'transparent',border:`1px solid ${c.isAdmin?GOLD:GRAY3}`,color:c.isAdmin?GOLD:DIM,fontSize:10,padding:'3px 8px',borderRadius:5,cursor:'pointer',fontFamily:'inherit'}}>
                      {c.isAdmin?'Admin ✓':'Make Admin'}
                    </button>
                    <button onClick={()=>{setEditCoach(c);setEditCoachPin('')}}
                      style={{background:'transparent',border:`1px solid ${GRAY3}`,color:WHITE,fontSize:11,padding:'4px 8px',borderRadius:5,cursor:'pointer',fontFamily:'inherit'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=GRAY3}>Reset PIN</button>
                    <Btn danger onClick={()=>removeCoach(c.id)}>Remove</Btn>
                  </div>
                </div>
              ))
            }
          </div>
          {editCoach&&(
            <div style={{background:GRAY2,borderRadius:8,padding:'14px',marginBottom:16,border:`1px solid ${GOLD}`}}>
              <div style={{fontSize:12,fontWeight:700,color:GOLD,marginBottom:10}}>Reset PIN for {editCoach.name}</div>
              <PinPad value={editCoachPin} onChange={setEditCoachPin} maxLen={6}/>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
                <Btn outline onClick={()=>setEditCoach(null)}>Cancel</Btn>
                <Btn gold onClick={updateCoachPin}>Save PIN</Btn>
              </div>
            </div>
          )}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:DIM,marginBottom:10,marginTop:4}}>Add New Coach</div>
          <div style={{borderTop:`1px solid ${GRAY3}`,paddingTop:16}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
              <input style={{...inp,flex:1,minWidth:130}} placeholder="Coach name" value={newCoach.name} onChange={e=>setNewCoach(n=>({...n,name:e.target.value}))}/>
              <select style={{...inp,flex:1,minWidth:130}} value={newCoach.role} onChange={e=>setNewCoach(n=>({...n,role:e.target.value}))}>
                <option value="mixed">Mixed</option>
                <option value="group">Groups Only</option>
                <option value="solo">1-on-1s Only</option>
              </select>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:DIM,marginBottom:12,cursor:'pointer'}}>
              <input type="checkbox" checked={newCoach.isAdmin||false} onChange={e=>setNewCoach(n=>({...n,isAdmin:e.target.checked}))}/>
              Admin access (can access Ops from coach login)
            </label>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:DIM,marginBottom:8}}>Set PIN (min 4 digits)</div>
              <PinPad value={newCoach.pin} onChange={v=>setNewCoach(n=>({...n,pin:v}))} maxLen={6}/>
            </div>
            <Btn gold onClick={addCoach} style={{width:'100%',padding:10}}>Add Coach</Btn>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
            <Btn outline onClick={()=>setCoachMgmtOpen(false)}>Done</Btn>
          </div>
        </Modal>

        <Modal open={announceOpen} onClose={()=>setAnnounceOpen(false)} title="Announcement">
          <p style={{fontSize:12,color:DIM,marginBottom:14}}>Coaches see this when they open the app.</p>
          <Field label="Message"><textarea style={{...inp,minHeight:80,resize:'vertical'}} value={announceText} onChange={e=>setAnnounceText(e.target.value)} placeholder="e.g. Bring extra pinnies today."/></Field>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
            {announcement&&<Btn danger onClick={()=>{clearAnnouncement();setAnnounceOpen(false)}}>Clear</Btn>}
            <Btn outline onClick={()=>setAnnounceOpen(false)}>Cancel</Btn>
            <Btn gold onClick={saveAnnouncement}>Post</Btn>
          </div>
        </Modal>

        <Modal open={availOpen} onClose={()=>setAvailOpen(false)} title="Coach Availability" wide>
          <p style={{fontSize:12,color:DIM,marginBottom:16}}>Mark a coach as unavailable on a specific date.</p>
          <Field label="Coach">
            <select style={inp} value={availCoach} onChange={e=>setAvailCoach(e.target.value)}>
              <option value="">Select a coach</option>
              {coaches.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" style={inp} value={availDate} onChange={e=>setAvailDate(e.target.value)}/></Field>
          {availCoach&&availDate&&(
            <div style={{fontSize:12,color:DIM,marginBottom:14}}>
              Status: <strong style={{color:!availability[availCoach]?.[availDate]?GREEN:ORANGE}}>{!availability[availCoach]?.[availDate]?'Available':'Unavailable'}</strong>
            </div>
          )}
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
            <Btn outline onClick={()=>setAvailOpen(false)}>Done</Btn>
            <Btn gold onClick={toggleAvailability}>Toggle</Btn>
          </div>
          <div style={{marginTop:20,borderTop:`1px solid ${GRAY3}`,paddingTop:16}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:DIM,marginBottom:10}}>Currently Unavailable</div>
            {Object.entries(availability).flatMap(([cId,dates])=>
              Object.entries(dates).filter(([,v])=>v).map(([dk])=>{
                const coach=coaches.find(c=>c.id===cId)
                return(
                  <div key={cId+dk} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:GRAY2,borderRadius:6,marginBottom:5}}>
                    <span style={{fontSize:12}}>{coach?.name||'Unknown'} · {dk}</span>
                    <button onClick={async()=>{await remove(ref(db,`availability/${cId}/${dk}`));setToast('Removed')}}
                      style={{background:'transparent',border:'none',color:DIM,cursor:'pointer',fontSize:14}}>×</button>
                  </div>
                )
              })
            )}
          </div>
        </Modal>

        <Modal open={statsOpen} onClose={()=>setStatsOpen(false)} title="Session Stats" wide>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:DIM,marginBottom:12}}>1-on-1 Assignments per Coach</div>
          {coaches.length===0?<div style={{fontSize:12,color:DIM,textAlign:'center',padding:20}}>No coaches yet</div>
            :coaches.map(c=>{
              const summerCount=getSoloCount(c.id,'summer'),weekCount=getSoloCount(c.id,'week')
              const maxSummer=Math.max(...coaches.map(x=>getSoloCount(x.id,'summer')),1)
              return(
                <div key={c.id} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:600}}>{c.name}</span>
                    <div style={{display:'flex',gap:12}}>
                      <span style={{fontSize:11,color:DIM}}>Week: <strong style={{color:WHITE}}>{weekCount}</strong></span>
                      <span style={{fontSize:11,color:DIM}}>Total: <strong style={{color:GOLD}}>{summerCount}</strong></span>
                    </div>
                  </div>
                  <div style={{background:GRAY2,borderRadius:4,height:6,overflow:'hidden'}}>
                    <div style={{background:GOLD,height:'100%',borderRadius:4,width:`${(summerCount/maxSummer)*100}%`,transition:'width 0.3s'}}/>
                  </div>
                </div>
              )
            })
          }
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}><Btn outline onClick={()=>setStatsOpen(false)}>Close</Btn></div>
        </Modal>

        <Modal open={timeOffOpen} onClose={()=>setTimeOffOpen(false)} title="Time Off Requests" wide>
          {timeOffRequests.length===0
            ?<div style={{fontSize:13,color:DIM,textAlign:'center',padding:'20px 0'}}>No time off requests</div>
            :['pending','approved','denied'].map(status=>{
              const reqs=timeOffRequests.filter(r=>r.status===status)
              if(reqs.length===0)return null
              const statusColor=status==='pending'?ORANGE:status==='approved'?GREEN:RED
              return(
                <div key={status} style={{marginBottom:20}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:statusColor,marginBottom:10}}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                  {reqs.map(r=>(
                    <div key={r.id} style={{background:GRAY2,borderRadius:8,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${statusColor}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{r.coachName}</div>
                          <div style={{fontSize:12,color:DIM,marginBottom:2}}>{r.startDate} → {r.endDate}</div>
                          {r.reason&&<div style={{fontSize:12,color:WHITE,marginTop:4}}>"{r.reason}"</div>}
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          {status==='pending'&&<>
                            <Btn gold onClick={()=>approveTimeOff(r)} style={{fontSize:11,padding:'5px 10px'}}>Approve</Btn>
                            <Btn danger onClick={()=>denyTimeOff(r.id)} style={{fontSize:11,padding:'5px 10px'}}>Deny</Btn>
                          </>}
                          <button onClick={()=>deleteTimeOffRequest(r.id)} style={{background:'transparent',border:'none',color:GRAY3,cursor:'pointer',fontSize:16}}
                            onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=GRAY3}>×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          }
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}><Btn outline onClick={()=>setTimeOffOpen(false)}>Close</Btn></div>
        </Modal>

        <Toast msg={toast}/>
      </div>
    )
  }

  if(view==='coach'&&loggedInCoach){
    const TABS=['schedule','facility','summary','chat','time off']
    return(
      <div style={{...PAGE,display:'flex',flexDirection:'column'}}>
        <div style={{...HDR,flexDirection:'column',alignItems:'stretch',gap:8}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20,fontWeight:900,letterSpacing:3,textTransform:'uppercase',color:GOLD}}>SHANKLY</span>
              {loggedInCoach.isAdmin&&(
                <button onClick={()=>setView('ops')} style={{background:'rgba(245,197,24,0.12)',border:`1px solid rgba(245,197,24,0.4)`,color:GOLD,fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,cursor:'pointer',fontFamily:'inherit'}}>
                  ⚡ Ops
                </button>
              )}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:11,color:DIM}}>{loggedInCoach.name}</span>
              <button onClick={logout} style={{background:'transparent',border:`1px solid ${GRAY3}`,color:DIM,fontSize:11,padding:'5px 10px',borderRadius:6,cursor:'pointer',fontFamily:'inherit'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=RED}
                onMouseLeave={e=>e.currentTarget.style.borderColor=GRAY3}>Log Out</button>
            </div>
          </div>

          {announcement&&(
            <div style={{background:'rgba(245,197,24,0.08)',border:`1px solid rgba(245,197,24,0.2)`,borderRadius:8,padding:'8px 12px',display:'flex',gap:8,alignItems:'center'}}>
              <span>📢</span><span style={{fontSize:12,color:WHITE}}>{announcement.text}</span>
            </div>
          )}

          <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:2}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setCoachTab(t)}
                style={{background:coachTab===t?GOLD:GRAY2,border:`1px solid ${coachTab===t?GOLD:GRAY3}`,color:coachTab===t?BLACK:WHITE,fontSize:11,fontWeight:700,padding:'7px 10px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',whiteSpace:'nowrap',textTransform:'capitalize',flexShrink:0}}>
                {t}
              </button>
            ))}
          </div>

          {coachTab==='schedule'&&(
            <div style={{display:'flex',gap:6}}>
              <ToggleBtn active={coachCalView==='list'} onClick={()=>setCoachCalView('list')}>☰ List</ToggleBtn>
              <ToggleBtn active={coachCalView==='calendar'} onClick={()=>setCoachCalView('calendar')}>📅 Calendar</ToggleBtn>
            </div>
          )}
        </div>

        {coachTab==='schedule'&&(
          <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
            {loading?<Spinner/>:coachCalView==='list'
              ?getNext7().map(day=>{
                const sess=getSessionsForCoach(loggedInCoach.id,day)
                const today=isToday(day)
                const unavail=!isCoachAvailable(loggedInCoach.id,day)
                return(
                  <div key={dateKey(day)} style={{marginBottom:22}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:today?GOLD:DIM,marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${today?'rgba(245,197,24,0.25)':GRAY2}`,display:'flex',alignItems:'center',gap:8}}>
                      {today?'Today':fmtLong(day)}
                      {unavail&&<span style={{fontSize:9,background:'rgba(255,183,77,0.15)',color:ORANGE,padding:'1px 6px',borderRadius:10,fontWeight:700}}>OFF</span>}
                    </div>
                    {sess.length===0
                      ?<div style={{fontSize:12,color:GRAY3,textAlign:'center',padding:'12px 0'}}>{unavail?'Unavailable':'No sessions scheduled'}</div>
                      :sess.map(s=>(
                        <div key={s.id} style={{background:GRAY,borderRadius:9,padding:'12px 14px',marginBottom:7,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,display:'flex',alignItems:'flex-start',gap:12}}>
                          <div style={{minWidth:60}}>
                            <div style={{fontSize:19,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                            <div style={{fontSize:10,color:DIM,marginTop:2}}>{s.duration}min</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                            <div style={{fontSize:11,color:DIM}}>{s.type==='solo'?(s.notes||'No notes'):`Group · ${s.duration}min`}</div>
                          </div>
                          <div style={{width:7,height:7,borderRadius:'50%',marginTop:5,flexShrink:0,background:s.type==='solo'?BLUE:GOLD}}/>
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
                  onDayClick={d=>setCoachSelDay(d)} getDayDots={dk=>getCoachDayDots(dk,loggedInCoach.id)}/>
                {coachSelDay&&(
                  <div style={{marginTop:14,background:GRAY,borderRadius:10,padding:14,border:`1px solid ${GRAY2}`}}>
                    <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:GOLD,marginBottom:10}}>{fmtLong(coachSelDay)}</div>
                    {getSessionsForCoach(loggedInCoach.id,coachSelDay).length===0
                      ?<div style={{fontSize:12,color:DIM,textAlign:'center',padding:'12px 0'}}>No sessions this day</div>
                      :getSessionsForCoach(loggedInCoach.id,coachSelDay).map(s=>(
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
        )}

        {coachTab==='facility'&&(
          <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,justifyContent:'center'}}>
              <NavBtn onClick={()=>changeMonth(facCalMonth,-1,setFacCalMonth)}>‹</NavBtn>
              <span style={{fontSize:16,fontWeight:900,textTransform:'uppercase'}}>{MONTHS[facCalMonth.month]} {facCalMonth.year}</span>
              <NavBtn onClick={()=>changeMonth(facCalMonth,1,setFacCalMonth)}>›</NavBtn>
            </div>
            <div style={{display:'flex',gap:14,marginBottom:12,justifyContent:'center',flexWrap:'wrap'}}>
              {[[PURPLE,'Event'],[GOLD,'Goalz'],[GREEN,'Shankly']].map(([c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:DIM}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>{l}
                </div>
              ))}
            </div>
            <MonthCalendar year={facCalMonth.year} month={facCalMonth.month} selectedDay={facSelDay}
              onDayClick={d=>setFacSelDay(d)}
              getDayDots={dk=>getEventsOnDate(dk).map(e=>e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE)}/>
            {facSelDay&&(
              <div style={{marginTop:14,background:GRAY,borderRadius:10,padding:14,border:`1px solid ${GRAY2}`}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:GOLD,marginBottom:10}}>{fmtLong(facSelDay)}</div>
                {getEventsOnDate(dateKey(facSelDay)).length===0
                  ?<div style={{fontSize:12,color:DIM,textAlign:'center',padding:'12px 0'}}>No events</div>
                  :getEventsOnDate(dateKey(facSelDay)).sort((a,b)=>a.startTime>b.startTime?1:-1).map(e=>{
                    const bc=e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE
                    return(
                      <div key={e.id} style={{background:GRAY2,borderRadius:8,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${bc}`}}>
                        <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{e.title}</div>
                        <div style={{fontSize:12,color:DIM}}>{fmt12(e.startTime)}{e.endTime?' – '+fmt12(e.endTime):''}</div>
                      </div>
                    )
                  })
                }
              </div>
            )}
            <div style={{marginTop:20}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:DIM,marginBottom:10}}>Upcoming</div>
              {events.filter(e=>new Date(e.date+'T00:00:00')>=todayMidnight()).sort((a,b)=>a.date>b.date?1:-1).slice(0,8).map(e=>{
                const bc=e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE
                const d=new Date(e.date+'T00:00:00')
                return(
                  <div key={e.id} onClick={()=>{setFacSelDay(d);setFacCalMonth({year:d.getFullYear(),month:d.getMonth()})}}
                    style={{background:GRAY,borderRadius:8,padding:'10px 13px',marginBottom:7,borderLeft:`3px solid ${bc}`,cursor:'pointer'}}>
                    <div style={{fontSize:13,fontWeight:700}}>{e.title}</div>
                    <div style={{fontSize:11,color:DIM,marginTop:2}}>{fmtLong(d)} · {fmt12(e.startTime)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {coachTab==='summary'&&(()=>{
          const allSess=getAllSessionsOnDate(summaryDate).sort((a,b)=>a.time>b.time?1:-1)
          const allEvts=getEventsOnDate(dateKey(summaryDate)).sort((a,b)=>a.startTime>b.startTime?1:-1)
          return(
            <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
                <NavBtn onClick={()=>{const d=new Date(summaryDate);d.setDate(d.getDate()-1);setSummaryDate(d)}}>‹</NavBtn>
                <span style={{fontSize:17,fontWeight:900,textTransform:'uppercase'}}>{fmtLong(summaryDate)}</span>
                {isToday(summaryDate)&&<span style={{background:GOLD,color:BLACK,fontSize:9,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',padding:'2px 8px',borderRadius:20}}>Today</span>}
                <NavBtn onClick={()=>{const d=new Date(summaryDate);d.setDate(d.getDate()+1);setSummaryDate(d)}}>›</NavBtn>
                <Btn outline onClick={()=>setSummaryDate(todayMidnight())} style={{fontSize:10,padding:'5px 10px'}}>Today</Btn>
              </div>
              {loading?<Spinner/>:<>
                <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
                  <StatPill label="Total" value={allSess.length} color={GOLD}/>
                  <StatPill label="1-on-1s" value={allSess.filter(s=>s.type==='solo').length} color={BLUE}/>
                  <StatPill label="Groups" value={allSess.filter(s=>s.type==='group').length} color={GREEN}/>
                  <StatPill label="Coaches" value={[...new Set(allSess.map(s=>s.coachId))].length} color={PURPLE}/>
                </div>
                {allSess.length===0&&allEvts.length===0
                  ?<div style={{textAlign:'center',padding:'60px 20px',color:DIM}}>No sessions or events</div>
                  :<>
                    {allSess.length>0&&(
                      <div style={{marginBottom:24}}>
                        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:DIM,marginBottom:12}}>All Sessions</div>
                        {allSess.map(s=>{
                          const coach=coaches.find(c=>c.id===s.coachId)
                          return(
                            <div key={s.id} style={{background:GRAY,borderRadius:9,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${s.type==='solo'?BLUE:GOLD}`,display:'flex',alignItems:'center',gap:14}}>
                              <div style={{minWidth:68}}>
                                <div style={{fontSize:18,fontWeight:900,lineHeight:1}}>{fmt12(s.time)}</div>
                                <div style={{fontSize:10,color:DIM,marginTop:2}}>{s.duration}min</div>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:14,fontWeight:700}}>{s.type==='solo'?`1-on-1 · ${s.clientName}`:s.name}</div>
                                <div style={{fontSize:11,color:DIM,marginTop:2}}>{coach?.name||'Unknown'}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {allEvts.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:DIM,marginBottom:12}}>Facility Events</div>
                        {allEvts.map(e=>{
                          const bc=e.brand==='goalz'?GOLD:e.brand==='shankly'?GREEN:PURPLE
                          return(
                            <div key={e.id} style={{background:GRAY,borderRadius:9,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${bc}`}}>
                              <div style={{fontSize:14,fontWeight:700}}>{e.title}</div>
                              <div style={{fontSize:11,color:DIM,marginTop:2}}>{fmt12(e.startTime)}{e.endTime?' – '+fmt12(e.endTime):''}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                }
              </>}
            </div>
          )
        })()}

        {coachTab==='chat'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{flex:1,padding:'16px',overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
              {messages.length===0
                ?<div style={{textAlign:'center',padding:'60px 20px',color:DIM,fontSize:13}}>No messages yet. Say something!</div>
                :messages.map(m=>{
                  const isMe=m.coachId===loggedInCoach.id
                  return(
                    <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start'}}>
                      {!isMe&&<div style={{fontSize:10,color:DIM,marginBottom:3,paddingLeft:4}}>{m.coachName}</div>}
                      <div style={{background:isMe?GOLD:GRAY2,color:isMe?BLACK:WHITE,borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'10px 14px',maxWidth:'80%',fontSize:14,lineHeight:1.5}}>
                        {m.text}
                      </div>
                      <div style={{fontSize:10,color:DIM,marginTop:3,paddingLeft:4,paddingRight:4}}>{fmtTime(m.ts)}</div>
                    </div>
                  )
                })
              }
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:'12px 16px',borderTop:`1px solid ${GRAY2}`,display:'flex',gap:10,alignItems:'center',background:GRAY}}>
              <input style={{...inp,flex:1}} placeholder="Type a message..." value={chatMsg}
                onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}/>
              <Btn gold onClick={sendMessage} style={{padding:'10px 16px'}}>Send</Btn>
            </div>
          </div>
        )}

        {coachTab==='time off'&&(
          <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700}}>My Time Off Requests</div>
              <Btn gold onClick={()=>setTimeOffReqOpen(true)} style={{fontSize:12,padding:'8px 14px'}}>+ New Request</Btn>
            </div>
            {timeOffRequests.filter(r=>r.coachId===loggedInCoach.id).length===0
              ?<div style={{textAlign:'center',padding:'40px 20px',color:DIM,fontSize:13}}>No requests yet.</div>
              :timeOffRequests.filter(r=>r.coachId===loggedInCoach.id).sort((a,b)=>b.submittedAt-a.submittedAt).map(r=>{
                const statusColor=r.status==='pending'?ORANGE:r.status==='approved'?GREEN:RED
                const statusLabel=r.status==='pending'?'Pending':r.status==='approved'?'Approved':'Denied'
                return(
                  <div key={r.id} style={{background:GRAY,borderRadius:9,padding:'14px 16px',marginBottom:10,border:`1px solid ${GRAY2}`,borderLeft:`3px solid ${statusColor}`}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{r.startDate} → {r.endDate}</div>
                    {r.reason&&<div style={{fontSize:12,color:DIM,marginBottom:6}}>"{r.reason}"</div>}
                    <span style={{fontSize:10,fontWeight:700,letterSpacing:1,padding:'2px 8px',borderRadius:20,background:`${statusColor}22`,color:statusColor}}>{statusLabel}</span>
                  </div>
                )
              })
            }
          </div>
        )}

        <Modal open={timeOffReqOpen} onClose={()=>setTimeOffReqOpen(false)} title="Request Time Off">
          <Field label="Start Date *"><input type="date" style={inp} value={timeOffReqF.startDate} onChange={e=>setTimeOffReqF(f=>({...f,startDate:e.target.value}))}/></Field>
          <Field label="End Date *"><input type="date" style={inp} value={timeOffReqF.endDate} onChange={e=>setTimeOffReqF(f=>({...f,endDate:e.target.value}))}/></Field>
          <Field label="Reason (optional)">
            <textarea style={{...inp,minHeight:70,resize:'vertical'}} value={timeOffReqF.reason} onChange={e=>setTimeOffReqF(f=>({...f,reason:e.target.value}))} placeholder="e.g. Family vacation"/>
          </Field>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
            <Btn outline onClick={()=>setTimeOffReqOpen(false)}>Cancel</Btn>
            <Btn gold onClick={submitTimeOffRequest}>Submit Request</Btn>
          </div>
        </Modal>

        <Toast msg={toast}/>
      </div>
    )
  }

  return null
}
