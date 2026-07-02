import { io } from 'socket.io-client'
const BASE='http://localhost:4200'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const connect=()=>new Promise(res=>{const s=io(BASE,{transports:['websocket']});s.on('connect',()=>res(s))})
const emit=(s,ev,arg)=>new Promise(res=>arg===undefined?s.emit(ev,res):s.emit(ev,arg,res))
let pass=0,fail=0
const check=(l,c)=>{console.log((c?'✅':'❌')+' '+l);c?pass++:fail++}

const main=async()=>{
  const admin=await connect()
  const g0=await emit(admin,'spam:ensure')
  check('admin gets active game', !!g0.gameId && g0.status==='waiting')
  const gameId=g0.gameId

  // config
  const cfg=await emit(admin,'spam:config',{gameId,title:'Audit Round',duration:30,targets:'truevindo, gimfly'})
  check('config applied', !('error'in cfg)&&cfg.title==='Audit Round'&&cfg.duration===30&&cfg.targets.length===2)

  // player 1 joins
  const p1=await connect()
  const j1=await emit(p1,'spam:join',{gameId,name:'Andhika',deviceId:'dev-aaa'})
  check('player 1 joins', j1.ok===true && j1.score===0)

  // refresh: same device rejoins → same player id
  p1.close()
  const p1b=await connect()
  const j1b=await emit(p1b,'spam:join',{gameId,name:'Andhika',deviceId:'dev-aaa'})
  check('REFRESH: same device = same player, no duplicate', j1b.ok===true && j1b.playerId===j1.playerId && j1b.state.playerCount===1)

  // player 2
  const p2=await connect()
  const j2=await emit(p2,'spam:join',{gameId,name:'Sari',deviceId:'dev-bbb'})
  check('player 2 joins (count=2)', j2.ok===true && j2.state.playerCount===2)

  // submit before start → not-running
  const early=await emit(p1b,'spam:submit',{gameId,word:'truevindo'})
  check('submit before start rejected', early.ok===false && early.reason==='not-running')

  // start → starting with server timeline
  let endedPayload=null
  admin.on('spam:ended',p=>{endedPayload=p})
  const started=await emit(admin,'spam:start',{gameId,duration:30})
  check('start begins countdown', !('error'in started)&&started.status==='starting'&&started.startsAt>Date.now())

  // wait for countdown to elapse (3s) → running
  await sleep(3400)
  const s1=(await emit(admin,'spam:ensure'))
  check('after countdown: running', s1.status==='running')

  // valid hit
  const h1=await emit(p1b,'spam:submit',{gameId,word:'truevindo'})
  check('valid hit scores +1 with rank', h1.ok===true && h1.score===1 && h1.rank===1)

  // rapid second hit within 90ms → too-fast
  const h2=await emit(p1b,'spam:submit',{gameId,word:'gimfly'})
  check('too-fast hit rejected (anti-bot)', h2.ok===false && h2.reason==='too-fast')

  // wrong word
  await sleep(120)
  const h3=await emit(p1b,'spam:submit',{gameId,word:'salah'})
  check('wrong word rejected', h3.ok===false && h3.reason==='mismatch')

  // second target word also valid
  const h4=await emit(p1b,'spam:submit',{gameId,word:'gimfly'})
  check('alternate target word accepted', h4.ok===true && h4.score===2)

  // player 2 scores once
  const h5=await emit(p2,'spam:submit',{gameId,word:'truevindo'})
  check('player 2 scores', h5.ok===true && h5.rank===2)

  // stop → ended + winner
  await emit(admin,'spam:stop',{gameId}).catch(()=>{})
  admin.emit('spam:stop',{gameId})
  await sleep(400)
  check('ended payload broadcast with winner', !!endedPayload && endedPayload.winner?.name==='Andhika' && endedPayload.totalHits===3)

  // resetTime keeps players + scores
  admin.emit('spam:reset-time',{gameId})
  await sleep(200)
  const s2=await emit(admin,'spam:ensure')
  check('reset timer keeps players & scores', s2.status==='waiting' && s2.playerCount===2 && s2.totalHits===3)

  // reset game wipes players
  admin.emit('spam:reset',{gameId})
  await sleep(200)
  const s3=await emit(admin,'spam:ensure')
  check('reset game wipes players', s3.playerCount===0 && s3.totalHits===0)

  // unknown game id
  const ghost=await emit(p2,'spam:watch',{gameId:'spam-nonexist'})
  check('unknown game id rejected', 'error'in ghost)

  console.log(`\n=== AUDIT: ${pass} passed, ${fail} failed ===`)
  admin.close();p1b.close();p2.close();process.exit(fail?1:0)
}
main().catch(e=>{console.error('ERR',e);process.exit(1)})
