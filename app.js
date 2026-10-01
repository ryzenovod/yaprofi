(() => {
  const KEY = 'yaprofi-market-host-v2';
  const isDisplay = new URLSearchParams(location.search).has('display');

  const events = [
    {title:'Глобальная рецессия', desc:'Ведущий раскрывает после 2-го или 4-го раунда.', e:-2,a:-2,t:-3},
    {title:'Инвестиционный бум', desc:'Деньги резко уходят в цифровые активы.', e:0,a:0,t:4},
    {title:'Логистический кризис', desc:'Дорожают базовые цепочки.', e:3,a:2,t:-1},
    {title:'Перепроизводство', desc:'Излишки давят на рынок.', e:-1,a:-4,t:0},
    {title:'Рынок ждёт новостей', desc:'Цены не меняются, но игроки получают время на перестройку.', e:0,a:0,t:0},
    {title:'Эффект домино', desc:'Падение одного сектора тянет за собой другие.', e:-2,a:1,t:-2},
    {title:'Госзаказ', desc:'Появляется крупный гарантированный спрос.', e:2,a:0,t:3},
    {title:'Дефицит сырья', desc:'Производители платят больше.', e:4,a:1,t:0},
    {title:'Студенческий сезон', desc:'Активность сообществ повышает спрос.', e:0,a:2,t:2},
    {title:'Обвал доверия', desc:'Игроки выходят из сложных активов.', e:0,a:0,t:-4},
    {title:'Разворот рынка', desc:'Все рынки отскакивают.', e:1,a:1,t:1},
    {title:'Стресс-тест', desc:'Самый дорогой рынок −5, самый дешёвый +5.', special:'stress'}
  ];
  const tactics = [
    ['Инсайдер','Перед торгами посмотрите одну случайную карту любой команды. На цены карта не влияет.'],
    ['Разведка','Посмотрите две верхние карты колоды. Одну оставьте себе, вторую положите вниз.'],
    ['Лоббист','После раскрытия увеличьте один эффект вашей карты на 1 в ту же сторону.'],
    ['Стоп-сигнал','Отмените один эффект −2 или −3, сыгранный любой командой против одного рынка.'],
    ['Усиление тренда','Выберите рынок, который уже изменился в плюс. Добавьте ещё +2.'],
    ['Контртренд','Рынок с самой низкой текущей ценой получает +3.'],
    ['Токсичный сброс','Если цена рынка ниже нуля, его цена дополнительно −2.'],
    ['Хедж','Выберите свой актив. До конца раунда при финальном подсчёте он считается по цене не ниже 0.'],
    ['Опцион','До начала торгов зафиксируйте цену одного рынка для одной сделки вашей команды.'],
    ['Новостной шум','Все команды одновременно сбрасывают по одной карте и берут новую.'],
    ['Принудительный аукцион','Команда с наибольшим запасом выбранного актива выставляет 2 единицы на открытые торги.'],
    ['Двойной ход','В этот раунд ваша команда может сыграть вторую карту после раскрытия первой волны.']
  ];
  const missions = [
    ['Диверсификация','Минимум 3 единицы каждого актива.'],['Энергетический магнат','Минимум 10 Энергии.'],['Агрохолдинг','Минимум 10 Агро.'],['Технологический фонд','Минимум 10 Технологий.'],['Кэш — тоже позиция','100+ наличными.'],['Антикризис','Капитал выше 300, если хотя бы один рынок ниже 0.'],['Переговорщики','Сделки минимум с 4 разными командами.'],['Риск-менеджеры','Не больше 8 единиц любого одного актива.'],['Контрарианы','Минимум 6 единиц актива с самой низкой финальной ценой.'],['Монополисты','12+ единиц любого одного актива.'],['Быстрые сделки','Минимум 8 сделок за игру.'],['Охотники за отскоком','Купить актив ниже 0 и удержать минимум 5 единиц до финала.']
  ];
  const hostLines = {
    'Торги':'«Торги открыты. Цена на экране — ориентир, но условия сделки определяете вы сами».',
    'Карты':'«Биржа закрыта. Руки убрали от жетонов. Каждая команда выкладывает одну карту».',
    'Событие':'«На рынок приходит внешняя новость. Сначала смотрим эффект — потом открываем следующий раунд».',
    'Подсчёт':'«Торги завершены. Считаем весь портфель по финальным ценам плюс бонус секретной задачи».',
    'Пауза':'«Пауза. Зафиксируйте состояние команды и ничего не передавайте между столами».'
  };

  const freshState = () => ({
    round:1, phase:'Торги', prices:{energy:10,agro:10,tech:10}, previous:{energy:10,agro:10,tech:10},
    timer:{duration:360, remaining:360, running:false, endAt:null}, sound:true,
    history:[], eventDeck:[], currentEvent:null, eventApplied:false,
    teams:Array.from({length:6},(_,i)=>({name:`Команда ${i+1}`, cash:150, energy:5, agro:5, tech:5, bonus:false}))
  });
  let state = loadState();

  function loadState(){
    try{const raw=localStorage.getItem(KEY); if(!raw) return freshState(); const parsed=JSON.parse(raw); return {...freshState(),...parsed,timer:{...freshState().timer,...parsed.timer},prices:{...freshState().prices,...parsed.prices},previous:{...freshState().previous,...parsed.previous}};}catch{return freshState();}
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function snapshot(reason){
    state.history.unshift({at:new Date().toISOString(), prices:{...state.prices}, reason});
    state.history=state.history.slice(0,40); save();
  }
  function toast(msg){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1700)}
  function fmt(sec){sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
  function signed(n){return n>0?`+${n}`:`${n}`}

  function ensureTimerSync(){
    if(state.timer.running && state.timer.endAt){state.timer.remaining=Math.max(0,(state.timer.endAt-Date.now())/1000);if(state.timer.remaining<=0){state.timer.remaining=0;state.timer.running=false;state.timer.endAt=null;save();beepEnd();}}
  }
  function setTimer(seconds){state.timer.duration=seconds;state.timer.remaining=seconds;state.timer.running=false;state.timer.endAt=null;save();renderAll();}
  function toggleTimer(){ensureTimerSync();if(state.timer.running){state.timer.running=false;state.timer.endAt=null;}else{if(state.timer.remaining<=0)state.timer.remaining=state.timer.duration;state.timer.running=true;state.timer.endAt=Date.now()+state.timer.remaining*1000;}save();renderAll();}
  function beepEnd(){if(!state.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;const ctx=new A();[0,0.18,0.36].forEach((d,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=660+(i*110);g.gain.setValueAtTime(.07,ctx.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.14);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.15)});}catch{}}

  function changePrices(delta, reason){
    state.previous={...state.prices};
    state.prices.energy+=delta.energy||0; state.prices.agro+=delta.agro||0; state.prices.tech+=delta.tech||0;
    snapshot(reason); renderAll();
  }
  function applyStress(){
    const entries=Object.entries(state.prices);const max=Math.max(...entries.map(([,v])=>v)),min=Math.min(...entries.map(([,v])=>v));
    const delta={energy:0,agro:0,tech:0}; entries.forEach(([k,v])=>{if(v===max)delta[k]-=5;if(v===min)delta[k]+=5}); changePrices(delta,'Новость: Стресс-тест');
  }
  function undo(){if(!state.history.length){toast('История пуста');return}const current=state.history.shift(); const target=state.history[0]?.prices || state.previous; if(target){state.prices={...target};state.previous={...target};save();renderAll();toast(`Отменено: ${current.reason||'изменение'}`)}}

  function drawEvent(){
    if(!state.eventDeck.length) state.eventDeck=shuffle([...Array(events.length).keys()]);
    const idx=state.eventDeck.pop();state.currentEvent=idx;state.eventApplied=false;save();renderAll();
  }
  function applyEvent(){if(state.currentEvent===null||state.eventApplied)return;const ev=events[state.currentEvent];if(ev.special==='stress')applyStress();else changePrices({energy:ev.e,agro:ev.a,tech:ev.t},`Новость: ${ev.title}`);state.eventApplied=true;save();renderAll();}
  function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

  function totalFor(t){return Number(t.cash||0)+Number(t.energy||0)*state.prices.energy+Number(t.agro||0)*state.prices.agro+Number(t.tech||0)*state.prices.tech+(t.bonus?20:0)}

  function renderController(){
    if(isDisplay)return;
    ensureTimerSync();
    document.getElementById('roundLabel').textContent=`РАУНД ${state.round} / 6`;
    document.getElementById('phaseSelect').value=state.phase;
    const t=document.getElementById('timerText');t.textContent=fmt(state.timer.remaining);document.getElementById('timerStatus').textContent=state.timer.running?'ИДЁТ':'ГОТОВ';
    document.getElementById('startPauseBtn').textContent=state.timer.running?'❚❚ Пауза':'▶ Старт';
    const pct=state.timer.duration?Math.max(0,Math.min(100,(state.timer.remaining/state.timer.duration)*100)):0;document.getElementById('timerRing').style.setProperty('--progress',`${pct}%`);
    document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',Number(b.dataset.seconds)===state.timer.duration));
    document.getElementById('soundBtn').textContent=state.sound?'🔊':'🔇';
    renderPrices(); renderFlow(); renderEvent(); renderHistory(); renderTeams();
  }
  function renderPrices(){
    ['energy','agro','tech'].forEach(k=>{const p=state.prices[k],prev=state.previous[k];const price=document.getElementById(`${k}Price`);price.textContent=p;price.classList.toggle('negative',p<0);const d=p-prev;document.getElementById(`${k}Delta`).textContent=d===0?'без изменений':`${d>0?'рост':'падение'} ${signed(d)}`;});
  }
  function renderFlow(){document.getElementById('hostLine').textContent=hostLines[state.phase]||hostLines['Торги'];const title={Торги:'Раунд: свободные торги',Карты:'Биржа закрыта: вскрытие карт',Событие:'Внешний шок рынка',Подсчёт:'Финальный капитал',Пауза:'Пауза'}[state.phase];document.getElementById('flowTitle').textContent=title;}
  function renderEvent(){
    const card=document.getElementById('eventCard');const apply=document.getElementById('applyEventBtn');if(state.currentEvent===null){card.innerHTML='<div class="event-no">?</div><h2>Готово к раскрытию</h2><p>После 2-го и 4-го раунда нажми кнопку. Карта не повторится, пока колода не закончится.</p><div class="event-effects"><span>⚡ —</span><span>🌾 —</span><span>◆ —</span></div>';apply.disabled=true;return}
    const ev=events[state.currentEvent];const effects=ev.special?'<span>самый дорогой −5</span><span>самый дешёвый +5</span>':`<span>⚡ ${signed(ev.e)}</span><span>🌾 ${signed(ev.a)}</span><span>◆ ${signed(ev.t)}</span>`;card.innerHTML=`<div class="event-no">НОВОСТЬ ${state.currentEvent+1} / 12</div><h2>${ev.title}</h2><p>${ev.desc}</p><div class="event-effects">${effects}</div>`;apply.disabled=state.eventApplied;apply.textContent=state.eventApplied?'Применено ✓':'Применить к ценам';
  }
  function renderHistory(){const box=document.getElementById('historyList');if(!state.history.length){box.innerHTML='<div class="ref-item"><strong>Пока пусто</strong><span>Изменения цен появятся здесь.</span></div>';return}box.innerHTML=state.history.map(h=>`<div class="history-item"><time>${new Date(h.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time><div class="history-values"><span>⚡ ${h.prices.energy}</span><span>🌾 ${h.prices.agro}</span><span>◆ ${h.prices.tech}</span></div><div class="history-reason">${h.reason||''}</div></div>`).join('')}
  function renderTeams(){const body=document.getElementById('teamsBody');if(!body)return;body.innerHTML=state.teams.map((t,i)=>`<tr data-team="${i}"><td><input class="team-input" data-field="name" type="text" value="${escapeHtml(t.name)}"></td><td><input class="team-input" data-field="cash" type="number" value="${t.cash}"></td><td><input class="team-input" data-field="energy" type="number" value="${t.energy}"></td><td><input class="team-input" data-field="agro" type="number" value="${t.agro}"></td><td><input class="team-input" data-field="tech" type="number" value="${t.tech}"></td><td><input class="team-input" data-field="bonus" type="checkbox" ${t.bonus?'checked':''}></td><td>${totalFor(t)}</td></tr>`).join('');const rank=state.teams.map((t,i)=>({i,name:t.name,total:totalFor(t)})).sort((a,b)=>b.total-a.total).slice(0,3);document.getElementById('podium').innerHTML=rank.map((r,j)=>`<div class="podium-item"><span>${['1 МЕСТО','2 МЕСТО','3 МЕСТО'][j]}</span><b>${escapeHtml(r.name)}</b><span>${r.total} капитала</span></div>`).join('')}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}

  function renderDisplay(){
    if(!isDisplay)return; state=loadState();ensureTimerSync();document.getElementById('displayRound').textContent=`РАУНД ${state.round} / 6`;document.getElementById('displayPhase').textContent=state.phase.toUpperCase();const timer=document.getElementById('displayTimer');timer.textContent=fmt(state.timer.remaining);timer.classList.toggle('danger',state.timer.remaining<=10&&state.timer.running);['Energy','Agro','Tech'].forEach((name,idx)=>{const key=['energy','agro','tech'][idx],el=document.getElementById(`display${name}`);el.textContent=state.prices[key];el.classList.toggle('negative',state.prices[key]<0)});const eventBox=document.getElementById('displayEvent');if(state.currentEvent!==null&&state.phase==='Событие'){const ev=events[state.currentEvent];eventBox.hidden=false;document.getElementById('displayEventTitle').textContent=ev.title;document.getElementById('displayEventEffect').textContent=ev.special==='stress'?'Самый дорогой рынок −5 · самый дешёвый +5':`⚡ ${signed(ev.e)} · 🌾 ${signed(ev.a)} · ◆ ${signed(ev.t)}`;}else eventBox.hidden=true;
  }
  function renderAll(){renderController();renderDisplay()}

  function bind(){
    if(isDisplay){document.getElementById('controllerView').hidden=true;document.querySelector('.topbar').hidden=true;document.getElementById('displayView').hidden=false;setInterval(renderDisplay,250);window.addEventListener('storage',renderDisplay);document.addEventListener('dblclick',()=>document.documentElement.requestFullscreen?.());renderDisplay();return}
    document.getElementById('startPauseBtn').onclick=toggleTimer;document.getElementById('resetTimerBtn').onclick=()=>setTimer(state.timer.duration);document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.seconds)));
    document.getElementById('phaseSelect').onchange=e=>{state.phase=e.target.value;if(state.phase==='Торги'&&state.timer.duration!==360)setTimer(360);else{save();renderAll()}};
    document.getElementById('nextRoundBtn').onclick=()=>{if(state.round<6)state.round++;state.phase='Торги';setTimer(360);toast(`Раунд ${state.round}`)};document.getElementById('prevRoundBtn').onclick=()=>{if(state.round>1)state.round--;save();renderAll()};
    document.querySelectorAll('.asset .stepper button').forEach(b=>b.onclick=()=>{const asset=b.closest('.asset').dataset.asset,delta=Number(b.dataset.change);changePrices({[asset]:delta},`${asset}: ${signed(delta)}`)});
    document.getElementById('applyBatchBtn').onclick=()=>{const d={energy:Number(document.getElementById('batchEnergy').value)||0,agro:Number(document.getElementById('batchAgro').value)||0,tech:Number(document.getElementById('batchTech').value)||0};changePrices(d,'Сумма карт команд');['batchEnergy','batchAgro','batchTech'].forEach(id=>document.getElementById(id).value=0)};
    document.getElementById('undoBtn').onclick=undo;document.getElementById('drawEventBtn').onclick=drawEvent;document.getElementById('applyEventBtn').onclick=applyEvent;document.getElementById('resetEventsBtn').onclick=()=>{state.eventDeck=[];state.currentEvent=null;state.eventApplied=false;save();renderAll();toast('Колода собрана заново')};
    document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active')});
    document.getElementById('teamsBody').addEventListener('input',e=>{const tr=e.target.closest('tr');if(!tr)return;const i=Number(tr.dataset.team),field=e.target.dataset.field;if(!field)return;state.teams[i][field]=field==='bonus'?e.target.checked:(field==='name'?e.target.value:Number(e.target.value)||0);save();renderTeams()});document.getElementById('teamsBody').addEventListener('change',e=>{if(e.target.dataset.field==='bonus'){const tr=e.target.closest('tr');state.teams[Number(tr.dataset.team)].bonus=e.target.checked;save();renderTeams()}});
    document.getElementById('tacticsList').innerHTML=tactics.map(([a,b])=>`<div class="ref-item"><strong>${a}</strong><span>${b}</span></div>`).join('');document.getElementById('missionsList').innerHTML=missions.map(([a,b])=>`<div class="ref-item"><strong>${a} · +20</strong><span>${b}</span></div>`).join('');
    document.getElementById('projectorBtn').onclick=()=>window.open(`${location.pathname}?display=1`,'yaprofiDisplay','popup=yes,width=1440,height=900');document.getElementById('fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();document.getElementById('soundBtn').onclick=()=>{state.sound=!state.sound;save();renderAll()};
    document.getElementById('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`yaprofi-market-session-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
    document.getElementById('importInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());state={...freshState(),...data};save();renderAll();toast('Сессия импортирована')}catch{toast('Не удалось прочитать JSON')}};
    document.getElementById('hardResetBtn').onclick=()=>{if(confirm('Сбросить всю игру? Это удалит цены, таймер, события и таблицу команд.')){state=freshState();save();renderAll();toast('Новая игра готова')}};
    document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();toggleTimer()}if(e.key.toLowerCase()==='n'){if(state.round<6)state.round++;state.phase='Торги';setTimer(360)}if(e.key.toLowerCase()==='f')document.documentElement.requestFullscreen?.()});
    window.addEventListener('storage',()=>{state=loadState();renderAll()});
  }

  bind();renderAll();setInterval(()=>{if(!isDisplay&&state.timer.running){ensureTimerSync();save();renderController()}},250);
})();
