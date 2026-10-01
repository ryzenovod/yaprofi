(() => {
  const KEY = 'yaprofi-market-host-v2';
  const isDisplay = new URLSearchParams(location.search).has('display');
  const assets = ['energy', 'agro', 'tech'];
  const phases = ['Торги', 'Карты', 'Событие', 'Подсчёт', 'Пауза'];
  const maxHistory = 40;

  const events = [
    {title:'Глобальная рецессия', desc:'Ведущий раскрывает после 2-го или 4-го раунда.', e:-2,a:-2,t:-3},
    {title:'Инвестиционный бум', desc:'Деньги резко уходят в цифровые активы.', e:0,a:0,t:4},
    {title:'Логистический кризис', desc:'Дорожают базовые цепочки.', e:3,a:2,t:-1},
    {title:'Перепроизводство', desc:'Излишки давят на рынок.', e:-1,a:-4,t:0},
    {title:'Рынок ждёт новостей', desc:'Цены не меняются.', e:0,a:0,t:0},
    {title:'Эффект домино', desc:'Падение одного сектора тянет за собой другие.', e:-2,a:1,t:-2},
    {title:'Госзаказ', desc:'Появляется крупный гарантированный спрос.', e:2,a:0,t:3},
    {title:'Дефицит сырья', desc:'Производители платят больше.', e:4,a:1,t:0},
    {title:'Студенческий сезон', desc:'Активность сообществ повышает спрос.', e:0,a:2,t:2},
    {title:'Обвал доверия', desc:'Игроки выходят из сложных активов.', e:0,a:0,t:-4},
    {title:'Разворот рынка', desc:'Все рынки отскакивают.', e:1,a:1,t:1},
    {title:'Стресс-тест', desc:'Все рынки с максимальной ценой −5, с минимальной +5. При равенстве всех цен изменения компенсируются.', special:'stress'}
  ];
  const tactics = [
    [
      "Инсайдер",
      "До торгов • занимает слот раунда. Выберите другую команду. Она перемешивает карты в руке и показывает вам одну случайную карту, затем возвращает её в руку. Если карт нет, эффекта нет. Цены не меняются."
    ],
    [
      "Разведка",
      "До торгов • занимает слот раунда. Посмотрите две верхние карты влияния. Одну добавьте в руку, вторую положите вниз колоды. Если колода кончилась, продолжите с перемешанным сбросом. Если доступна только одна карта, возьмите её. Цены не меняются."
    ],
    [
      "Лоббист",
      "После раскрытия обеих волн. Выберите один ненулевой компонент любой обычной ценовой карты: рынок и карту команды. Усильте его на 1 в его сторону. Применяется после «Стоп-сигнала» и «Хеджа»; обнулённый компонент не восстанавливает."
    ],
    [
      "Стоп-сигнал",
      "После раскрытия обеих волн. Отмените один напечатанный компонент −2 или −3 по одному рынку на любой обычной ценовой карте. Остальные компоненты сохраняются. Применяется первым, перед «Хеджем» и «Лоббистом». Тактики и новости не отменяет."
    ],
    [
      "Усиление тренда",
      "После расчёта промежуточных цен. Выберите один рынок, у которого сумма исправленных обычных карт этого раунда положительна. Добавьте его цене +2. Если такого рынка нет, эффекта нет. Условие проверяется до остальных ценовых тактик."
    ],
    [
      "Контртренд",
      "После расчёта промежуточных цен. Выберите один рынок с самой низкой промежуточной ценой. Добавьте его цене +3. При равенстве выбирайте любой из рынков с минимальной ценой. Проверка — до остальных ценовых тактик."
    ],
    [
      "Токсичный сброс",
      "После расчёта промежуточных цен. Выберите один рынок с промежуточной ценой ниже 0. Уменьшите его цену ещё на 2. Если отрицательных цен нет, эффекта нет. Проверка — до остальных ценовых тактик."
    ],
    [
      "Хедж",
      "После раскрытия обеих волн. Выберите один отрицательный компонент любой обычной ценовой карты. Уменьшите его модуль на 2, максимум до нуля: −4 станет −2, −1 станет 0. Применяется после «Стоп-сигнала», перед «Лоббистом». Рыночную цену нулём не ограничивает."
    ],
    [
      "Опцион",
      "До торгов • занимает слот раунда. Запишите рынок и его текущую цену. После расчёта цен, до новости, за 30 секунд совершите одну добровольную сделку с одним его жетоном по записанной цене. При цене ниже 0 отдающий жетон доплачивает её модуль; при нуле денег нет. Контрагент вправе отказаться. Расчёт сразу."
    ],
    [
      "Новостной шум",
      "До торгов • занимает слот раунда. Каждая команда выбирает одну карту из руки. Все одновременно кладут выбранные карты в сброс, затем по порядку номеров берут по одной новой. Команда без карт пропускает обмен. Пустую колоду пополните перемешанным сбросом. Цены не меняются."
    ],
    [
      "Принудительный аукцион",
      "До торгов • занимает слот раунда. Выберите рынок и команду с наибольшим запасом актива. Аукцион: 2 жетона одним лотом, 30 секунд. Ставки целые, положительные, выше прежней и не больше наличных. Последняя ставка выигрывает. Без ставок сделки нет."
    ],
    [
      "Двойной ход",
      "Общее раскрытие • первая волна. После раскрытия первой волны сыграйте ещё одну обычную ценовую карту из руки. Дополнительную тактику играть нельзя. Обе волны входят в общий расчёт и доступны для «Стоп-сигнала», «Хеджа» и «Лоббиста». Если ценовой карты нет, дополнительного эффекта нет."
    ]
  ];
  const missions = [
    [
      "Диверсификация",
      "Закончите игру минимум с 3 жетонами каждого актива."
    ],
    [
      "Энергетический магнат",
      "Закончите игру минимум с 10 жетонами Энергии."
    ],
    [
      "Агрохолдинг",
      "Закончите игру минимум с 10 жетонами Агро."
    ],
    [
      "Технологический фонд",
      "Закончите игру минимум с 10 жетонами Технологий."
    ],
    [
      "Кэш — тоже позиция",
      "Закончите игру минимум со 100 наличными."
    ],
    [
      "Антикризис",
      "В финале: базовый капитал строго выше 300 и хотя бы одна цена ниже 0. Капитал проверяется до бонуса задачи."
    ],
    [
      "Переговорщики",
      "Совершите сделки минимум с 4 разными командами."
    ],
    [
      "Риск-менеджеры",
      "Закончите игру с запасом не более 8 жетонов каждого актива. Нулевой запас допустим."
    ],
    [
      "Контрарианы",
      "В финале держите минимум 6 жетонов актива с самой низкой ценой. При равенстве подходит любой из рынков с минимальной ценой."
    ],
    [
      "Монополисты",
      "Закончите игру минимум с 12 жетонами любого одного актива."
    ],
    [
      "Быстрые сделки",
      "Совершите минимум 8 завершённых сделок с передачей активов."
    ],
    [
      "Охотники за отскоком",
      "Купите хотя бы один жетон актива, когда его цена на экране ниже 0. В финале держите минимум 5 жетонов этого актива."
    ]
  ];
  const hostLines = {
    'Торги':'«Торги открыты. У вас шесть минут».',
    'Карты':'«Биржа закрыта. Выберите карты и раскройте их по сигналу».',
    'Событие':'«Открываем новость. Меняем цены и начинаем следующий раунд».',
    'Подсчёт':'«Торги закончились. Посчитайте капитал и проверьте секретную задачу».',
    'Пауза':'«Пауза. Сделки пока не заключаем».'
  };

  const freshState = () => ({
    round:1, phase:'Торги', prices:{energy:10,agro:10,tech:10}, previous:{energy:10,agro:10,tech:10},
    timer:{duration:360, remaining:360, running:false, endAt:null, notified:false}, sound:true,
    history:[], undo:[], eventDeck:[], currentEvent:null, eventApplied:false,
    teams:Array.from({length:6},(_,i)=>({name:`Команда ${i+1}`, cash:150, energy:5, agro:5, tech:5, bonus:false}))
  });
  let state = loadState();

  function assertObject(value){
    if(!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
    return value;
  }
  function hasOwn(object, key){
    return Object.prototype.hasOwnProperty.call(object, key);
  }
  function requireKeys(object, keys){
    keys.forEach(key => {
      if(!hasOwn(object, key)) throw new Error(`Missing ${key}`);
    });
  }
  function strictNumber(value){
    if(typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Expected finite number');
    return value;
  }
  function strictBoolean(value){
    if(typeof value !== 'boolean') throw new Error('Expected boolean');
    return value;
  }
  function finiteNumber(value, fallback){
    if(value === undefined || value === null || value === '') return fallback;
    const number = Number(value);
    if(!Number.isFinite(number)) throw new Error('Expected finite number');
    return number;
  }
  function clamp(number, min, max){return Math.min(max, Math.max(min, number))}
  function sanitizePrices(value, fallback){
    if(value === undefined) return {...fallback};
    const raw = assertObject(value);
    requireKeys(raw, assets);
    return {
      energy:strictNumber(raw.energy),
      agro:strictNumber(raw.agro),
      tech:strictNumber(raw.tech)
    };
  }
  function sanitizeTimer(value, fallback){
    if(value === undefined) return {...fallback};
    const raw = assertObject(value);
    requireKeys(raw, ['duration', 'remaining', 'running', 'endAt']);
    if(raw.notified !== undefined) strictBoolean(raw.notified);
    return {
      duration:Math.max(0, strictNumber(raw.duration)),
      remaining:Math.max(0, strictNumber(raw.remaining)),
      running:strictBoolean(raw.running),
      endAt:raw.endAt === null ? null : strictNumber(raw.endAt),
      notified:raw.notified === undefined ? fallback.notified : raw.notified
    };
  }
  function sanitizeHistory(value, fallback = []){
    if(value === undefined) return fallback.slice(0, maxHistory);
    if(!Array.isArray(value)) throw new Error('Expected history array');
    return value.slice(0, maxHistory).map(item => {
      const raw = assertObject(item);
      requireKeys(raw, ['at', 'prices', 'reason']);
      if(typeof raw.at !== 'string' || typeof raw.reason !== 'string') throw new Error('Invalid history item');
      return {
        at:raw.at,
        prices:sanitizePrices(raw.prices, freshState().prices),
        reason:raw.reason
      };
    });
  }
  function sanitizeEventDeck(value, fallback = []){
    if(value === undefined) return fallback.slice();
    if(!Array.isArray(value)) throw new Error('Expected event deck array');
    const deck = value.map(index => strictNumber(index));
    const unique = new Set(deck);
    if(unique.size !== deck.length || deck.some(index => !Number.isInteger(index) || index < 0 || index >= events.length)){
      throw new Error('Invalid event deck');
    }
    return deck;
  }
  function sanitizeEventIndex(value, fallback = null){
    if(value === undefined) return fallback;
    if(value === null) return null;
    const index = strictNumber(value);
    if(!Number.isInteger(index) || index < 0 || index >= events.length) throw new Error('Invalid event index');
    return index;
  }
  function sanitizeTeams(value, fallback){
    if(value === undefined) return fallback.map(team => ({...team}));
    if(!Array.isArray(value) || value.length !== 6) throw new Error('Expected six teams');
    return value.map(team => {
      const raw = assertObject(team);
      requireKeys(raw, ['name', 'cash', 'energy', 'agro', 'tech', 'bonus']);
      if(typeof raw.name !== 'string') throw new Error('Expected team name string');
      return {
        name:raw.name,
        cash:strictNumber(raw.cash),
        energy:strictNumber(raw.energy),
        agro:strictNumber(raw.agro),
        tech:strictNumber(raw.tech),
        bonus:strictBoolean(raw.bonus)
      };
    });
  }
  function sanitizeUndo(value, fallback = []){
    if(value === undefined) return fallback.slice(0, maxHistory);
    if(!Array.isArray(value)) throw new Error('Expected undo array');
    return value.slice(0, maxHistory).map(item => {
      const raw = assertObject(item);
      if(raw.prices === undefined || raw.previous === undefined || raw.currentEvent === undefined || raw.eventApplied === undefined){
        throw new Error('Invalid undo baseline');
      }
      return {
        prices:sanitizePrices(raw.prices, freshState().prices),
        previous:sanitizePrices(raw.previous, freshState().previous),
        currentEvent:sanitizeEventIndex(raw.currentEvent, null),
        eventApplied:strictBoolean(raw.eventApplied)
      };
    });
  }
  function sanitizeState(input){
    const base = freshState();
    const raw = assertObject(input);
    requireKeys(raw, ['round', 'phase', 'prices', 'previous', 'timer', 'teams']);
    const round = Math.round(strictNumber(raw.round));
    if(!phases.includes(raw.phase)) throw new Error('Invalid phase');
    if(raw.sound !== undefined) strictBoolean(raw.sound);
    if(raw.eventApplied !== undefined) strictBoolean(raw.eventApplied);
    return {
      round:clamp(round, 1, 6),
      phase:raw.phase,
      prices:sanitizePrices(raw.prices, base.prices),
      previous:sanitizePrices(raw.previous, base.previous),
      timer:sanitizeTimer(raw.timer, base.timer),
      sound:raw.sound === undefined ? base.sound : raw.sound,
      history:sanitizeHistory(raw.history, base.history),
      undo:sanitizeUndo(raw.undo, base.undo),
      eventDeck:sanitizeEventDeck(raw.eventDeck, base.eventDeck),
      currentEvent:sanitizeEventIndex(raw.currentEvent, base.currentEvent),
      eventApplied:raw.eventApplied === undefined ? base.eventApplied : raw.eventApplied,
      teams:sanitizeTeams(raw.teams, base.teams)
    };
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return freshState();
      return sanitizeState(JSON.parse(raw));
    }catch{
      return freshState();
    }
  }
  function save(){
    try{
      localStorage.setItem(KEY, JSON.stringify(state));
    }catch{
      toast('Не удалось сохранить сессию');
    }
  }
  function pushHistory(reason){
    state.history.unshift({at:new Date().toISOString(), prices:{...state.prices}, reason:String(reason || '')});
    state.history = state.history.slice(0, maxHistory);
  }
  function pushUndo(){
    state.undo.unshift({
      prices:{...state.prices},
      previous:{...state.previous},
      currentEvent:state.currentEvent,
      eventApplied:state.eventApplied
    });
    state.undo = state.undo.slice(0, maxHistory);
  }
  function toast(msg){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1700)}
  function fmt(sec){sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
  function signed(n){return n>0?`+${n}`:`${n}`}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}

  function projectTimer(timer, now = Date.now()){
    if(timer.running && timer.endAt){
      const remaining = Math.max(0, (timer.endAt - now) / 1000);
      return {remaining, expired:remaining <= 0};
    }
    return {remaining:Math.max(0, timer.remaining), expired:timer.remaining <= 0};
  }
  function ensureTimerSync(){
    const projected = projectTimer(state.timer);
    if(state.timer.running){
      state.timer.remaining = projected.remaining;
      if(projected.expired){
        state.timer.remaining = 0;
        state.timer.running = false;
        state.timer.endAt = null;
        if(!state.timer.notified){
          state.timer.notified = true;
          save();
          beepEnd();
          return;
        }
      }
    }
  }
  function setTimer(seconds){
    state.timer.duration = seconds;
    state.timer.remaining = seconds;
    state.timer.running = false;
    state.timer.endAt = null;
    state.timer.notified = false;
    save();
    renderAll({forceTeams:true});
  }
  function toggleTimer(){
    ensureTimerSync();
    if(state.timer.running){
      state.timer.running = false;
      state.timer.endAt = null;
    }else{
      if(state.timer.remaining <= 0) state.timer.remaining = state.timer.duration;
      state.timer.running = true;
      state.timer.endAt = Date.now() + state.timer.remaining * 1000;
      state.timer.notified = false;
    }
    save();
    renderAll();
  }
  function beepEnd(){if(!state.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;const ctx=new A();[0,0.18,0.36].forEach((d,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=660+(i*110);g.gain.setValueAtTime(.07,ctx.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.14);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.15)});}catch{}}

  function changePrices(delta, reason, options = {}){
    const cleanDelta = {
      energy:finiteNumber(delta.energy, 0),
      agro:finiteNumber(delta.agro, 0),
      tech:finiteNumber(delta.tech, 0)
    };
    const nextPrices = {
      energy:state.prices.energy + cleanDelta.energy,
      agro:state.prices.agro + cleanDelta.agro,
      tech:state.prices.tech + cleanDelta.tech
    };
    assets.forEach(asset => strictNumber(nextPrices[asset]));
    pushUndo();
    state.previous = {...state.prices};
    state.prices = nextPrices;
    if(options.markEventApplied) state.eventApplied = true;
    pushHistory(reason);
    save();
    renderAll();
  }
  function stressDelta(){
    const entries = Object.entries(state.prices);
    const max = Math.max(...entries.map(([,v]) => v));
    const min = Math.min(...entries.map(([,v]) => v));
    const delta = {energy:0, agro:0, tech:0};
    entries.forEach(([key, value]) => {
      if(value === max) delta[key] -= 5;
      if(value === min) delta[key] += 5;
    });
    return delta;
  }
  function undo(){
    if(!state.undo.length){toast('История пуста');return}
    const baseline = state.undo.shift();
    const current = state.history.shift();
    state.prices = {...baseline.prices};
    state.previous = {...baseline.previous};
    state.currentEvent = baseline.currentEvent;
    state.eventApplied = baseline.eventApplied;
    save();
    renderAll();
    toast(`Отменено: ${current?.reason || 'изменение'}`);
  }

  function drawEvent(){
    if(!state.eventDeck.length) state.eventDeck = shuffle([...Array(events.length).keys()]);
    const idx = state.eventDeck.pop();
    state.currentEvent = idx;
    state.eventApplied = false;
    save();
    renderAll();
  }
  function applyEvent(){
    if(state.currentEvent === null || state.eventApplied) return;
    const ev = events[state.currentEvent];
    const delta = ev.special === 'stress' ? stressDelta() : {energy:ev.e, agro:ev.a, tech:ev.t};
    changePrices(delta, `Новость: ${ev.title}`, {markEventApplied:true});
  }
  function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

  function totalFor(t){
    return Number(t.cash || 0) + Number(t.energy || 0) * state.prices.energy + Number(t.agro || 0) * state.prices.agro + Number(t.tech || 0) * state.prices.tech + (t.bonus ? 20 : 0);
  }
  function goNextRound(){
    if(state.round >= 6) return;
    if(state.round < 6){
      state.round += 1;
      state.phase = 'Торги';
      state.timer.duration = 360;
      state.timer.remaining = 360;
      state.timer.running = false;
      state.timer.endAt = null;
      state.timer.notified = false;
      save();
      renderAll({forceTeams:true});
      toast(`Раунд ${state.round}`);
      return;
    }
  }

  function renderController(options = {}){
    if(isDisplay) return;
    ensureTimerSync();
    document.getElementById('roundLabel').textContent = `РАУНД ${state.round} / 6`;
    document.getElementById('phaseSelect').value = state.phase;
    const projected = projectTimer(state.timer);
    const t = document.getElementById('timerText');
    t.textContent = fmt(projected.remaining);
    document.getElementById('timerStatus').textContent = state.timer.running ? 'ИДЁТ' : (projected.expired ? 'ВРЕМЯ' : (projected.remaining < state.timer.duration ? 'ПАУЗА' : 'ГОТОВ'));
    document.getElementById('startPauseBtn').textContent = state.timer.running ? 'Пауза' : 'Старт';
    const pct = state.timer.duration ? Math.max(0, Math.min(100, (projected.remaining / state.timer.duration) * 100)) : 0;
    document.getElementById('timerRing').style.setProperty('--progress', `${pct}%`);
    document.querySelectorAll('.preset').forEach(b => b.classList.toggle('active', Number(b.dataset.seconds) === state.timer.duration));
    const soundBtn = document.getElementById('soundBtn');
    soundBtn.textContent = state.sound ? 'Звук' : 'Без звука';
    soundBtn.title = state.sound ? 'Звук включён' : 'Звук выключен';
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    document.getElementById('prevRoundBtn').disabled = state.round <= 1;
    document.getElementById('nextRoundBtn').disabled = state.round >= 6;
    renderPrices();
    renderFlow();
    renderEvent();
    renderHistory();
    if(options.forceTeams || !document.getElementById('teamsBody')?.children.length) renderTeamsTable();
    else renderTeamTotals();
  }
  function renderPrices(){
    assets.forEach(k => {
      const p = state.prices[k], prev = state.previous[k];
      const price = document.getElementById(`${k}Price`);
      price.textContent = p;
      price.classList.toggle('negative', p < 0);
      const d = p - prev;
      document.getElementById(`${k}Delta`).textContent = d === 0 ? 'без изменений' : `${d > 0 ? 'рост' : 'падение'} ${signed(d)}`;
    });
  }
  function renderFlow(){
    document.getElementById('hostLine').textContent = hostLines[state.phase] || hostLines['Торги'];
    const title = {Торги:'Раунд: свободные торги',Карты:'Биржа закрыта: вскрытие карт',Событие:'Новость рынка',Подсчёт:'Финальный капитал',Пауза:'Пауза'}[state.phase];
    document.getElementById('flowTitle').textContent = title;
  }
  function renderEvent(){
    const card = document.getElementById('eventCard');
    const apply = document.getElementById('applyEventBtn');
    if(state.currentEvent === null){
      card.innerHTML = '<div class="event-no">?</div><h2>Готово к раскрытию</h2><p>После раундов 2 и 4 вытяните новость и примените её к ценам.</p><div class="event-effects"><span>Энергия —</span><span>Агро —</span><span>Технологии —</span></div>';
      apply.disabled = true;
      apply.textContent = 'Применить к ценам';
      return;
    }
    const ev = events[state.currentEvent];
    const effects = ev.special ? '<span>все максимальные −5</span><span>все минимальные +5</span>' : `<span>Энергия ${signed(ev.e)}</span><span>Агро ${signed(ev.a)}</span><span>Технологии ${signed(ev.t)}</span>`;
    card.innerHTML = `<div class="event-no">НОВОСТЬ ${state.currentEvent + 1} / 12</div><h2>${ev.title}</h2><p>${ev.desc}</p><div class="event-effects">${effects}</div>`;
    apply.disabled = state.eventApplied;
    apply.textContent = state.eventApplied ? 'Применено ✓' : 'Применить к ценам';
  }
  function renderHistory(){
    const box = document.getElementById('historyList');
    if(!state.history.length){
      box.innerHTML = '<div class="ref-item"><strong>Пока пусто</strong><span>Изменения цен появятся здесь.</span></div>';
      return;
    }
    box.innerHTML = state.history.map(h => `<div class="history-item"><time>${escapeHtml(new Date(h.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}))}</time><div class="history-values"><span>Энергия ${h.prices.energy}</span><span>Агро ${h.prices.agro}</span><span>Технологии ${h.prices.tech}</span></div><div class="history-reason">${escapeHtml(h.reason || '')}</div></div>`).join('');
  }
  function renderTeamsTable(){
    const body = document.getElementById('teamsBody');
    if(!body) return;
    body.innerHTML = state.teams.map((t,i) => `<tr data-team="${i}"><td><input class="team-input" data-field="name" type="text" aria-label="Название команды ${i + 1}" value="${escapeHtml(t.name)}"></td><td><input class="team-input" data-field="cash" type="number" aria-label="Деньги команды ${i + 1}" value="${t.cash}"></td><td><input class="team-input" data-field="energy" type="number" aria-label="Энергия команды ${i + 1}" value="${t.energy}"></td><td><input class="team-input" data-field="agro" type="number" aria-label="Агро команды ${i + 1}" value="${t.agro}"></td><td><input class="team-input" data-field="tech" type="number" aria-label="Технологии команды ${i + 1}" value="${t.tech}"></td><td><input class="team-input" data-field="bonus" type="checkbox" aria-label="Секретная задача команды ${i + 1}" ${t.bonus?'checked':''}></td><td data-field="total">${totalFor(t)}</td></tr>`).join('');
    renderPodium();
  }
  function updateTeamTotal(index){
    const row = document.querySelector(`#teamsBody tr[data-team="${index}"] [data-field="total"]`);
    if(row) row.textContent = totalFor(state.teams[index]);
  }
  function renderPodium(){
    const podium = document.getElementById('podium');
    if(!podium) return;
    const rank = state.teams.map((t,i) => ({i, name:t.name, total:totalFor(t)})).sort((a,b) => b.total - a.total).slice(0,3);
    podium.innerHTML = rank.map((r,j) => `<div class="podium-item"><span>${['1 МЕСТО','2 МЕСТО','3 МЕСТО'][j]}</span><b>${escapeHtml(r.name)}</b><span>${r.total} капитала</span></div>`).join('');
  }
  function renderTeamTotals(){
    state.teams.forEach((_, index) => updateTeamTotal(index));
    renderPodium();
  }

  function renderDisplay(){
    if(!isDisplay) return;
    state = loadState();
    const projected = projectTimer(state.timer);
    document.getElementById('displayRound').textContent = `РАУНД ${state.round} / 6`;
    document.getElementById('displayPhase').textContent = state.phase.toUpperCase();
    const timer = document.getElementById('displayTimer');
    timer.textContent = fmt(projected.remaining);
    timer.classList.toggle('danger', projected.remaining <= 10 && state.timer.running);
    ['Energy','Agro','Tech'].forEach((name,idx) => {
      const key = assets[idx], el = document.getElementById(`display${name}`);
      el.textContent = state.prices[key];
      el.classList.toggle('negative', state.prices[key] < 0);
    });
    const eventBox = document.getElementById('displayEvent');
    if(state.currentEvent !== null && state.phase === 'Событие'){
      const ev = events[state.currentEvent];
      eventBox.hidden = false;
      document.getElementById('displayEventTitle').textContent = ev.title;
      document.getElementById('displayEventEffect').textContent = ev.special === 'stress' ? 'Все максимальные −5 · все минимальные +5' : `Энергия ${signed(ev.e)} · Агро ${signed(ev.a)} · Технологии ${signed(ev.t)}`;
    }else eventBox.hidden = true;
  }
  function renderAll(options = {}){renderController(options);renderDisplay()}

  function readBatchNumber(id){
    const value = document.getElementById(id).value;
    return finiteNumber(value, 0);
  }
  function readTeamNumber(input, currentValue){
    if(input.value === '') return currentValue;
    return finiteNumber(input.value, currentValue);
  }
  function bind(){
    if(isDisplay){
      document.getElementById('controllerView').hidden = true;
      document.querySelector('.topbar').hidden = true;
      document.getElementById('displayView').hidden = false;
      setInterval(renderDisplay, 250);
      window.addEventListener('storage', renderDisplay);
      document.addEventListener('dblclick', () => document.documentElement.requestFullscreen?.());
      renderDisplay();
      return;
    }
    document.getElementById('startPauseBtn').onclick = toggleTimer;
    document.getElementById('resetTimerBtn').onclick = () => setTimer(state.timer.duration);
    document.querySelectorAll('.preset').forEach(b => b.onclick = () => setTimer(Number(b.dataset.seconds)));
    document.getElementById('phaseSelect').onchange = e => {
      state.phase = e.target.value;
      if(state.phase === 'Торги' && state.timer.duration !== 360) setTimer(360);
      else{save();renderAll()}
    };
    document.getElementById('nextRoundBtn').onclick = goNextRound;
    document.getElementById('prevRoundBtn').onclick = () => {
      if(state.round > 1) state.round--;
      save();
      renderAll({forceTeams:true});
    };
    document.querySelectorAll('.asset .stepper button').forEach(b => b.onclick = () => {
      const asset = b.closest('.asset').dataset.asset, delta = Number(b.dataset.change);
      changePrices({[asset]:delta}, `${asset}: ${signed(delta)}`);
    });
    document.getElementById('applyBatchBtn').onclick = () => {
      try{
        const d = {energy:readBatchNumber('batchEnergy'), agro:readBatchNumber('batchAgro'), tech:readBatchNumber('batchTech')};
        changePrices(d, 'Сумма карт команд');
        ['batchEnergy','batchAgro','batchTech'].forEach(id => document.getElementById(id).value = 0);
      }catch{
        toast('Проверьте изменения цен');
      }
    };
    document.getElementById('undoBtn').onclick = undo;
    document.getElementById('drawEventBtn').onclick = drawEvent;
    document.getElementById('applyEventBtn').onclick = applyEvent;
    document.getElementById('resetEventsBtn').onclick = () => {state.eventDeck=[];state.currentEvent=null;state.eventApplied=false;save();renderAll();toast('Колода собрана заново')};
    document.querySelectorAll('.tab').forEach(btn => btn.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
    document.getElementById('teamsBody').addEventListener('input', e => {
      const tr = e.target.closest('tr');
      if(!tr) return;
      const i = Number(tr.dataset.team), field = e.target.dataset.field;
      if(!field) return;
      try{
        state.teams[i][field] = field === 'bonus' ? e.target.checked : (field === 'name' ? e.target.value : readTeamNumber(e.target, state.teams[i][field]));
      }catch{
        toast('Проверьте число в таблице');
        return;
      }
      save();
      updateTeamTotal(i);
      renderPodium();
    });
    document.getElementById('teamsBody').addEventListener('change', e => {
      if(e.target.dataset.field !== 'bonus') return;
      const tr = e.target.closest('tr');
      const i = Number(tr.dataset.team);
      state.teams[i].bonus = e.target.checked;
      save();
      updateTeamTotal(i);
      renderPodium();
    });
    document.getElementById('tacticsList').innerHTML = tactics.map(([a,b]) => `<div class="ref-item"><strong>${a}</strong><span>${b}</span></div>`).join('');
    document.getElementById('missionsList').innerHTML = missions.map(([a,b]) => `<div class="ref-item"><strong>${a} · +20</strong><span>${b}</span></div>`).join('');
    document.getElementById('projectorBtn').onclick = () => window.open(`${location.pathname}?display=1`,'yaprofiDisplay','popup=yes,width=1440,height=900');
    document.getElementById('fullscreenBtn').onclick = () => document.documentElement.requestFullscreen?.();
    document.getElementById('soundBtn').onclick = () => {state.sound=!state.sound;save();renderAll()};
    document.getElementById('exportBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `yaprofi-market-session-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    document.getElementById('importInput').onchange = async e => {
      const file = e.target.files[0];
      if(!file) return;
      try{
        const data = sanitizeState(JSON.parse(await file.text()));
        state = data;
        save();
        renderAll({forceTeams:true});
        toast('Сессия импортирована');
      }catch{
        toast('Не удалось прочитать JSON');
      }finally{
        e.target.value = '';
      }
    };
    document.getElementById('hardResetBtn').onclick = () => {
      if(confirm('Сбросить всю игру? Это удалит цены, таймер, события и таблицу команд.')){
        state = freshState();
        save();
        renderAll({forceTeams:true});
        toast('Новая игра готова');
      }
    };
    document.addEventListener('keydown', e => {
      if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
      if(e.code === 'Space'){e.preventDefault();toggleTimer()}
      if(e.key.toLowerCase() === 'n') goNextRound();
      if(e.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
    });
    window.addEventListener('storage', () => {state=loadState();renderAll({forceTeams:true})});
  }

  bind();
  renderAll({forceTeams:true});
  setInterval(() => {
    if(!isDisplay && state.timer.running){
      ensureTimerSync();
      renderController();
    }
  }, 250);
})();
