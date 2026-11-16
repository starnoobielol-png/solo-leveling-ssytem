"use strict";

// Solo Leveling v0.3 — lokal data lagras i samma nyckel som tidigare versioner.
const STORAGE_KEY = "soloLevelingPlayer";
const dailyQuests = [
  { id: "pushups", name: "Push-ups", target: 50, unit: "st", xp: 10, stat: "strength", penalty: true },
  { id: "squats", name: "Squats", target: 100, unit: "st", xp: 10, stat: "strength", penalty: true },
  { id: "plank", name: "Planka", target: 180, unit: "sek", xp: 10, stat: "strength", penalty: true },
  { id: "steps", name: "Steg", target: 10000, unit: "steg", xp: 10, stat: "endurance", penalty: true },
  { id: "development", name: "Personlig utveckling", target: 30, unit: "min", xp: 10, stat: "intelligence", penalty: true },
  { id: "calories", name: "Håll kalorimålet", xp: 10, stat: "discipline", penalty: false }
];
const sideQuests = [
  { id: "gym", name: "Gym", xp: 75, stat: "strength" },
  { id: "bjj", name: "BJJ", xp: 100, stat: "strength" },
  { id: "running", name: "Löprunda", xp: 60, stat: "endurance" }
];
const rewardShop = [
  { id: "foodora", name: "Foodora", cost: 1 },
  { id: "100", name: "100", cost: 2 },
  { id: "candy", name: "Godis", cost: 3 },
  { id: "500", name: "500", cost: 6 },
  { id: "booster", name: "Booster Box", cost: 10 },
  { id: "1000", name: "1000", cost: 10 }
];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const toUTC = date => { const [y,m,d] = date.split("-").map(Number); return Date.UTC(y,m-1,d); };
const fromUTC = millis => new Date(millis).toISOString().slice(0,10);
const addDays = (date, n) => fromUTC(toUTC(date) + n * 86400000);
const dayGap = (a,b) => Math.round((toUTC(b)-toUTC(a))/86400000);
const formatDate = date => new Date(toUTC(date)).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric",timeZone:"UTC"});
const defaultPlayer = () => ({
  totalXP:0, tokens:0, streak:0, currentDate:"", perfectBonusGiven:false,
  completedQuests:{}, completedSideQuests:{}, highestLevelReached:1,
  stats:{strength:0,endurance:0,discipline:0,intelligence:0},
  restDay:false, missedDaysInRow:0, donationIssuedForStreak:false,
  donations:[], penaltyUntil:{}, penaltyHistory:[],
  dailyPerfectDates:[]
});

function loadPlayer() {
  const fresh = defaultPlayer();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return fresh;
    const p = {...fresh, ...saved};
    for (const key of ["completedQuests","completedSideQuests","penaltyUntil"]) {
      p[key] = saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key]) ? {...saved[key]} : {};
    }
    p.stats = {...fresh.stats, ...(saved.stats || {})};
    for (const key of ["totalXP","tokens","streak","highestLevelReached","missedDaysInRow"]) {
      p[key] = Number.isFinite(Number(p[key])) ? Math.max(0,Math.floor(Number(p[key]))) : fresh[key];
    }
    p.highestLevelReached = Math.max(1,p.highestLevelReached);
    p.donations = Array.isArray(saved.donations) ? saved.donations.slice(-100) : [];
    p.penaltyHistory = Array.isArray(saved.penaltyHistory) ? saved.penaltyHistory.slice(-150) : [];
    p.dailyPerfectDates = Array.isArray(saved.dailyPerfectDates) ? saved.dailyPerfectDates : [];
    p.restDay = saved.restDay === true;
    p.donationIssuedForStreak = saved.donationIssuedForStreak === true;
    return p;
  } catch (err) { console.error("Kunde inte läsa sparad data:",err); return fresh; }
}
let player = loadPlayer();
const initialToday = todayKey();
let popupQueue = [];
let lastFocus = null;

function savePlayer() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(player)); }
  catch (error) { console.error("Kunde inte spara:",error); }
}
function logPenalty(date,text) {
  player.penaltyHistory.unshift({id:`${Date.now()}-${Math.random()}`,date,text});
  player.penaltyHistory = player.penaltyHistory.slice(0,150);
}
function isPenaltyActive(questId,date=todayKey()) {
  const until = player.penaltyUntil[questId];
  return typeof until === "string" && until >= date;
}
function dailyTarget(q,date=player.currentDate) {
  if (!q.penalty) return q.name;
  const number = isPenaltyActive(q.id,date) ? Math.ceil(q.target*1.25) : q.target;
  return `${number.toLocaleString("sv-SE")} ${q.unit} ${q.name}`;
}
function finishDay(date,completed,rest) {
  if (rest) {
    player.missedDaysInRow = 0;
    player.donationIssuedForStreak = false;
    logPenalty(date,"Vilodag – inga straff");
    return;
  }
  if (completed) {
    player.missedDaysInRow = 0;
    player.donationIssuedForStreak = false;
    return;
  }
  player.streak = 0;
  player.missedDaysInRow += 1;
  const missed = dailyQuests.filter(q=>!player.completedQuests[q.id]);
  logPenalty(date,`Missad dag (${player.missedDaysInRow} i rad): ${missed.map(q=>q.name).join(", ")}`);
  for (const q of missed) {
    if (!q.penalty) continue;
    // Dag 1-4 efter missad dag. Ny miss förlänger men ökar aldrig över +25 %.
    player.penaltyUntil[q.id] = addDays(date,4);
    logPenalty(date,`${q.name}: +25 % t.o.m. ${formatDate(player.penaltyUntil[q.id])}`);
  }
  if (player.missedDaysInRow >= 3 && !player.donationIssuedForStreak) {
    const id = `${date}-${Date.now()}`;
    player.donations.push({id,triggerDate:date,confirmed:false,confirmedAt:null});
    player.donationIssuedForStreak = true;
    logPenalty(date,"Donationsstraff aktiverat: 100 kr (ingen automatisk betalning)");
  }
}
function allDailyDone() { return dailyQuests.every(q=>player.completedQuests[q.id] === true); }
function checkForNewDay() {
  const today = todayKey();
  if (!player.currentDate) { player.currentDate=today; savePlayer(); return; }
  const gap = dayGap(player.currentDate,today);
  if (gap <= 0) return;
  // Om appen varit stängd markeras även mellanliggande kalenderdagar som missade.
  // Max 370 iterationer; längre uppehåll börjar med senaste tre dagarna.
  let previousDate = player.currentDate;
  if (gap > 370) {
    previousDate = addDays(today,-3);
    player.streak = 0;
    player.missedDaysInRow = 0;
    player.donationIssuedForStreak = false;
    player.completedQuests = {};
    player.restDay = false;
    logPenalty(today,"Långt uppehåll – senaste tre dagarna kontrolleras");
  }
  const days = dayGap(previousDate,today);
  for (let i=0;i<days;i++) {
    const date=addDays(previousDate,i);
    if (i===0 && gap<=370) finishDay(date,allDailyDone(),player.restDay);
    else finishDay(date,false,false);
  }
  player.currentDate=today;
  player.completedQuests={};
  player.completedSideQuests={};
  player.perfectBonusGiven=false;
  player.restDay=false;
  savePlayer();
  render();
}
function xpNeededForLevel(level) {return Math.round(100*Math.pow(level,1.3));}
function calculateLevelData() {
  let remaining=Math.max(0,player.totalXP);
  for(let level=1;level<=1000;level++) {
    const required=xpNeededForLevel(level);
    if(remaining<required) return {level,currentXP:remaining,requiredXP:required};
    remaining-=required;
  }
  return {level:1001,currentXP:0,requiredXP:xpNeededForLevel(1001)};
}
function checkForLevelUps(showPopup=true) {
  const newLevel=calculateLevelData().level;
  if(newLevel<=player.highestLevelReached) return;
  const oldLevel=player.highestLevelReached;
  const gain=newLevel-oldLevel;
  player.highestLevelReached=newLevel;
  player.tokens+=gain;
  if(showPopup) popupQueue.push({oldLevel,newLevel,gain});
  savePlayer();
  if(showPopup) openNextPopup();
}
function openNextPopup(){
  if(!$('levelUpOverlay').hidden || popupQueue.length===0) return;
  const {oldLevel,newLevel,gain}=popupQueue.shift();
  $('levelChangeText').textContent=`LEVEL ${oldLevel} → LEVEL ${newLevel}`;
  $('levelRewardText').textContent=`+${gain} ${gain===1?'TOKEN':'TOKENS'}`;
  $('popupTokenTotal').textContent=`Totalt: ${player.tokens} tokens`;
  lastFocus=document.activeElement;
  $('levelUpOverlay').hidden=false;
  $('levelUpOverlay').setAttribute('aria-hidden','false');
  $('levelUpContinueButton').focus();
}
function closePopup(){
  $('levelUpOverlay').hidden=true;
  $('levelUpOverlay').setAttribute('aria-hidden','true');
  if(lastFocus && lastFocus.isConnected) lastFocus.focus();
  openNextPopup();
}
let xpTimer;
function showXpAnimation(amount){
  const el=$('xpToast');
  el.className=`xp-toast ${amount>=0?'gain':'loss'}`;
  el.textContent=`${amount>0?'+':''}${amount} XP`;
  void el.offsetWidth;
  el.classList.add('play');
  clearTimeout(xpTimer);
  xpTimer=setTimeout(()=>{el.className='xp-toast';el.textContent='';},900);
}
function makeQuest(q,completed,onChange,disabled=false,displayName=q.name){
  const row=document.createElement('label'); row.className='quest';
  if(completed) row.classList.add('completed');
  if(disabled) row.classList.add('rest-disabled');
  const checkbox=document.createElement('input');
  checkbox.type='checkbox';checkbox.checked=completed;checkbox.disabled=disabled;
  checkbox.addEventListener('change',()=>onChange(q,checkbox.checked));
  const info=document.createElement('div');info.className='quest-info';
  const title=document.createElement('div');title.className='quest-name';title.textContent=displayName;
  const sub=document.createElement('div');sub.className='quest-sub';sub.textContent=`+${q.xp} XP`;
  info.append(title,sub);row.append(checkbox,info);
  return row;
}
function updateQuest(q,completed,completion){
  if(Boolean(completion[q.id])===completed) return;
  completion[q.id]=completed;
  const factor=completed?1:-1;
  player.totalXP=Math.max(0,player.totalXP+q.xp*factor);
  player.stats[q.stat]=Math.max(0,(Number(player.stats[q.stat])||0)+factor);
  player.stats.discipline=Math.max(0,(Number(player.stats.discipline)||0)+factor);
  showXpAnimation(q.xp*factor);
}
function handleDailyQuest(q,checked){
  checkForNewDay();
  if(player.restDay) return;
  updateQuest(q,checked,player.completedQuests);
  const complete=allDailyDone();
  if(complete && !player.perfectBonusGiven){
    player.perfectBonusGiven=true;
    player.totalXP+=20;
    player.streak+=1;
    player.stats.discipline+=3;
    player.dailyPerfectDates.push(player.currentDate);
    if(player.dailyPerfectDates.length>120) player.dailyPerfectDates.shift();
    showXpAnimation(q.xp+20);
  }
  // Om alla uppgifter kryssas ur efter full bonus ges bonusen inte på nytt.
  // Streak och bonus behålls för dagen för att förhindra XP-farmning.
  checkForLevelUps();savePlayer();render();
}
function handleSideQuest(q,checked){
  checkForNewDay();
  updateQuest(q,checked,player.completedSideQuests);
  checkForLevelUps();savePlayer();render();
}
function toggleRestDay(){
  checkForNewDay();
  if(!player.restDay && dailyQuests.some(q=>player.completedQuests[q.id])) {
    $('restDayMessage').textContent='Ta bort dagens Daily Quest-kryss först om du vill markera vilodag.';
    return;
  }
  player.restDay=!player.restDay;
  $('restDayMessage').textContent=player.restDay?'Vilodag aktiv – dagens Daily Quests är pausade.':'Vilodag av – vanliga Daily Quests gäller.';
  savePlayer();render();
}
function renderDaily(){
  const list=$('questList');list.replaceChildren();
  for(const q of dailyQuests) list.append(makeQuest(q,!!player.completedQuests[q.id],handleDailyQuest,player.restDay,dailyTarget(q)));
  $('restDayButton').textContent=player.restDay?'Ångra vilodag':'Markera vilodag';
  $('restDayButton').disabled=!player.restDay && dailyQuests.some(q=>player.completedQuests[q.id]);
  if(player.restDay) $('restDayMessage').textContent='Vilodag aktiv – du får inget straff för denna dag.';
  else $('restDayMessage').textContent='Vilodag ger inga Daily Quest-XP och inget straff. Markera före dagens första quest.';
  const active=dailyQuests.filter(q=>q.penalty&&isPenaltyActive(q.id));
  $('penaltyHint').textContent=player.restDay?'Recovery Day — inga obligatoriska quests idag.':active.length?`${active.length} aktivt/aktiva +25 %-straff idag.`:'Klara dagens uppgifter för en Perfect Day-bonus.';
}
function renderSide(){
  const list=$('sideQuestList');list.replaceChildren();
  for(const q of sideQuests) list.append(makeQuest(q,!!player.completedSideQuests[q.id],handleSideQuest));
}
function renderPenalties(){
  const list=$('penaltyList');list.replaceChildren();
  const active=dailyQuests.filter(q=>q.penalty&&isPenaltyActive(q.id));
  $('penaltySection').hidden=active.length===0;
  for(const q of active){
    const row=document.createElement('div');row.className='penalty-row';
    const desc=document.createElement('div');
    const strong=document.createElement('strong');strong.textContent=q.name;
    const until=document.createElement('span');until.textContent=`Gäller t.o.m. ${formatDate(player.penaltyUntil[q.id])}`;
    desc.append(strong,until);
    const amount=document.createElement('div');
    const target=document.createElement('strong');target.textContent=`${Math.ceil(q.target*1.25).toLocaleString('sv-SE')} ${q.unit}`;
    const baseline=document.createElement('span');baseline.textContent=`Vanligt: ${q.target.toLocaleString('sv-SE')}`;
    amount.append(target,baseline);row.append(desc,amount);list.append(row);
  }
}
function renderDonations(){
  const list=$('donationList');list.replaceChildren();
  const pending=player.donations.filter(d=>!d.confirmed);
  $('donationSection').hidden=pending.length===0;
  for(const d of pending){
    const row=document.createElement('div');row.className='donation-row';
    const text=document.createElement('div');text.textContent=`Aktiverat ${formatDate(d.triggerDate)} · Ej bekräftat`;
    const button=document.createElement('button');button.type='button';button.className='primary-button';
    button.textContent='Jag har donerat 100 kr';
    button.addEventListener('click',()=>{
      if(!window.confirm('Bekräftar du att du själv har donerat 100 kr? Ingen betalning sker i appen.')) return;
      d.confirmed=true;d.confirmedAt=new Date().toISOString();
      logPenalty(todayKey(),`Donationsstraff från ${formatDate(d.triggerDate)} markerat som genomfört`);
      savePlayer();render();
    });
    row.append(text,button);list.append(row);
  }
}
function renderShop(){
  const list=$('shopList');list.replaceChildren();
  for(const reward of rewardShop){
    const item=document.createElement('div');item.className='shop-item';
    const info=document.createElement('div');const name=document.createElement('strong');name.textContent=reward.name;
    const cost=document.createElement('div');cost.className='shop-cost';cost.textContent=`${reward.cost} ${reward.cost===1?'token':'tokens'}`;
    info.append(name,cost);
    const button=document.createElement('button');button.type='button';button.textContent='Redeem';button.disabled=player.tokens<reward.cost;
    button.addEventListener('click',()=>{
      if(player.tokens<reward.cost)return;
      if(!window.confirm(`Använd ${reward.cost} tokens för ${reward.name}?`))return;
      player.tokens-=reward.cost;savePlayer();$('shopMessage').textContent=`${reward.name} redeemed!`;render();
    });
    item.append(info,button);list.append(item);
  }
}
function renderHistory(){
  const list=$('historyList');list.replaceChildren();
  const events=player.penaltyHistory.slice(0,30);
  if(!events.length){const p=document.createElement('p');p.className='muted small';p.textContent='Inga straffhändelser än.';list.append(p);return;}
  for(const e of events){
    const row=document.createElement('div');row.className='history-item';
    const date=document.createElement('div');date.className='history-date';date.textContent=formatDate(e.date);
    const message=document.createElement('p');message.textContent=e.text;
    row.append(date,message);list.append(row);
  }
}
function render(){
  $('dateText').textContent=new Date().toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'});
  renderDaily();renderSide();renderPenalties();renderDonations();renderShop();renderHistory();
  const lvl=calculateLevelData();
  $('levelText').textContent=lvl.level;
  $('xpText').textContent=`${lvl.currentXP.toLocaleString('sv-SE')} / ${lvl.requiredXP.toLocaleString('sv-SE')}`;
  $('totalXPText').textContent=`Total XP: ${player.totalXP.toLocaleString('sv-SE')}`;
  $('xpProgress').style.width=`${Math.min(100,100*lvl.currentXP/lvl.requiredXP)}%`;
  $('tokenCount').textContent=player.tokens;
  $('topTokenText').textContent=player.tokens;
  $('streakText').textContent=player.streak;
  for(const [id,key] of [['strengthStat','strength'],['enduranceStat','endurance'],['disciplineStat','discipline'],['intelligenceStat','intelligence']]) $(id).textContent=player.stats[key];
  $('perfectCard').hidden=!allDailyDone()||player.restDay;
}

$('restDayButton').addEventListener('click',toggleRestDay);
$('levelUpContinueButton').addEventListener('click',closePopup);
$('resetButton').addEventListener('click',()=>{
  if(!window.confirm('Radera ALL testdata (XP, tokens, quests och straffhistorik)?'))return;
  localStorage.removeItem(STORAGE_KEY);location.reload();
});

// Ladda tidigare progress, men starta inga nya rewards om data redan migrerats.
checkForNewDay();
checkForLevelUps(false);
savePlayer();
render();
setInterval(checkForNewDay,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForNewDay();});
window.addEventListener('focus',checkForNewDay);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js').catch(err=>console.error('Service Worker:',err));
  });
}
