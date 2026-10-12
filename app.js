const hiragana = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'];
const katakana = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'];
const vowels = ['あ','い','う','え','お'];
const words = [
  {word:'ねこ', picture:'🐈', category:'どうぶつ'}, {word:'いぬ', picture:'🐕', category:'どうぶつ'},
  {word:'うさぎ', picture:'🐇', category:'どうぶつ'}, {word:'さかな', picture:'🐠', category:'どうぶつ'},
  {word:'りんご', picture:'🍎', category:'たべもの'}, {word:'ばなな', picture:'🍌', category:'たべもの'},
  {word:'おにぎり', picture:'🍙', category:'たべもの'}, {word:'いちご', picture:'🍓', category:'たべもの'},
  {word:'くるま', picture:'🚗', category:'のりもの'}, {word:'でんしゃ', picture:'🚃', category:'のりもの'},
  {word:'はな', picture:'🌷', category:'しぜん'}, {word:'たいよう', picture:'☀️', category:'しぜん'},
  {word:'くつ', picture:'👟', category:'みのまわり'}, {word:'ぼうし', picture:'🧢', category:'みのまわり'},
  {word:'にこにこ', picture:'😊', category:'きもち'}, {word:'おどる', picture:'💃', category:'うごき'}
];
const categories = ['ぜんぶ', ...new Set(words.map(item => item.category))];
const stickerSet = ['🌷','🌈','🐣','🍓','⭐','🦋','🐬','🍀','🎈','🐻','🌙','🍰','🐳','💐','🧁','🪁','🌟','🐰','🍉','🌼','🦄','🎀','🐞','🍒'];
const STORE_KEY = 'moji-no-tane-v1';
const ASSET_CHARS = {hiragana, katakana};
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const statusBadge = document.querySelector('#connectionStatus');
const toastEl = document.querySelector('#toast');
let state = loadState();
let currentView = 'home';
let scriptChoice = 'hiragana';
let categoryChoice = 'ぜんぶ';
let toastTimer;
let availableJapaneseVoices = [];

function loadState() {
  try { return {...{letterCount:{}, wordCount:{}, stickers:[], setupComplete:false, sound:true, totalSessions:0}, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}')}; }
  catch { return {letterCount:{}, wordCount:{}, stickers:[], setupComplete:false, sound:true, totalSessions:0}; }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function toast(message) {
  toastEl.textContent = message; toastEl.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2300);
}
function say(text) {
  if (!state.sound || !('speechSynthesis' in window)) { toast('この たんまつでは おんせいを つかえないみたい'); return; }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP'; utterance.rate = .9; utterance.pitch = 1.04; utterance.volume = 1;
  const voices = speechSynthesis.getVoices().filter(voice => voice.lang?.toLowerCase().startsWith('ja'));
  availableJapaneseVoices = voices;
  const savedVoice = voices.find(voice => voice.voiceURI === state.voiceURI);
  const gentleVoice = voices.find(voice => /kyoko|nanami|enhanced|premium|natural/i.test(voice.name));
  utterance.voice = savedVoice || gentleVoice || voices.find(voice => voice.lang?.toLowerCase() === 'ja-jp') || voices[0] || null;
  speechSynthesis.speak(utterance);
}
function todayRecommendation() {
  const all = [...hiragana, ...katakana];
  return all.find(letter => !(state.letterCount?.[letter] > 0)) || all.reduce((least, letter) => (state.letterCount[letter] || 0) < (state.letterCount[least] || 0) ? letter : least, all[0]);
}
function render() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.nav === currentView || (currentView === 'lesson' && btn.dataset.nav === 'letters')));
  if (currentView === 'home') renderHome();
  if (currentView === 'letters') renderLetters();
  if (currentView === 'words') renderWords();
  if (currentView === 'stickers') renderStickers();
  statusBadge.classList.toggle('ready', Boolean(state.setupComplete));
  statusBadge.innerHTML = `<i></i> ${state.setupComplete ? 'おてほん準備OK' : 'おてほん未準備'}`;
}
function renderHome() {
  const routeLetters = [...hiragana, ...katakana];
  const total = routeLetters.filter(letter => state.letterCount?.[letter] > 0).length;
  const next = todayRecommendation();
  const nextIndex = routeLetters.indexOf(next);
  const previous = nextIndex > 0 ? routeLetters[nextIndex - 1] : '・';
  const after = nextIndex < routeLetters.length - 1 ? routeLetters[nextIndex + 1] : '✓';
  app.innerHTML = `<section class="page">
    <div class="town-heading"><div><span class="eyebrow">あいうえおちょう</span><h1>ことばのまち</h1></div><span class="town-marker" aria-hidden="true">✿</span></div>
    <section class="town-map" aria-label="練習の道しるべ"><div class="map-caption"><span>つぎの もじ</span><span class="map-progress">${total} / 92</span></div><div class="map-route"><span class="route-stop ${nextIndex>0?'passed':'future'}">${previous}</span><span class="route-path"></span><button class="route-stop current" data-letter="${next}" aria-label="${next}の練習をはじめる">${next}</button><span class="route-path"></span><span class="route-stop future">${after}</span></div><button class="button map-button" data-letter="${next}">「${next}」から はじめる</button></section>
    ${!state.setupComplete ? `<div class="setup-banner"><div><strong>書き順のおてほんを準備</strong><p>準備後はネットなしでも書き順を見られます。音声は端末の日本語音声設定により変わります。</p><div class="setup-progress"><span id="setupProgress"></span></div></div><button id="setupButton" class="button soft small">じゅんびする</button></div>` : ''}
    <div class="section-heading"><h2>どの道をすすむ？</h2></div>
    <div class="quick-grid">
      <button class="quick-card" data-nav="letters"><span class="route-glyph">あ</span><strong>もじの道</strong><small>ひらがな・カタカナ</small></button>
      <button class="quick-card" data-nav="words"><span class="route-glyph">ねこ</span><strong>ことばの道</strong><small>ことばをつづけて書く</small></button>
      <button class="quick-card" data-nav="stickers"><span class="route-glyph">✿</span><strong>スタンプ帳</strong><small>${state.stickers.length}こ</small></button>
    </div>
    <div class="progress-card"><span class="progress-bubble">${total}</span><div class="progress-copy"><strong>れんしゅうした もじ</strong><small>ひらがな・カタカナ あわせて 92もじ</small></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, total / 92 * 100)}%"></div></div></div>
    </section>`;
  document.querySelector('#setupButton')?.addEventListener('click', prepareOffline);
}
function renderLetters() {
  const letters = ASSET_CHARS[scriptChoice];
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">すきな もじから えらんでね</span><h1>もじを かこう</h1></div><div class="segmented" aria-label="もじの種類"><button class="${scriptChoice==='hiragana'?'selected':''}" data-script="hiragana">ひらがな</button><button class="${scriptChoice==='katakana'?'selected':''}" data-script="katakana">カタカナ</button></div></div>
    <p class="subtext">あかい しるしは、れんしゅうした もじだよ。どれからでも はじめられるよ。</p><div class="kana-grid">${letters.map(letter => `<button class="kana-card ${state.letterCount[letter]?'done':''}" data-letter="${letter}" aria-label="${letter} をれんしゅう">${letter}</button>`).join('')}</div><p class="empty-note">${state.setupComplete ? 'おてほんは オフラインでもみられるよ。' : 'おてほんのじゅんびは ホームからできるよ。'}</p></section>`;
}
function renderWords() {
  const shown = words.filter(item => categoryChoice === 'ぜんぶ' || item.category === categoryChoice);
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">ことばのまち</span><h1>ことばの道</h1><p class="subtext">絵をえらんで、ことばをひとつづきに書こう。</p></div><button class="button soft small" id="randomWord">おまかせ</button></div>
    <div class="category-row">${categories.map(category => `<button class="chip ${category===categoryChoice?'selected':''}" data-category="${category}">${category}</button>`).join('')}</div>
    <div class="word-grid">${shown.map(item => `<button class="word-card" data-word="${item.word}"><span class="word-picture">${item.picture}</span><strong>${item.word}</strong><small>${item.category} ・ ${state.wordCount[item.word] ? 'れんしゅうしたよ' : 'やってみよう'}</small></button>`).join('')}</div>
    </section>`;
  document.querySelector('#randomWord').addEventListener('click', () => beginWord(shown[Math.floor(Math.random()*shown.length)]));
}
function renderStickers() {
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">ことばのまち</span><h1>スタンプ帳</h1></div></div><div class="sticker-summary"><span>✿</span><div><b>${state.stickers.length}</b> <span>こ</span><p class="subtext">れんしゅうのあとにもらったスタンプ</p></div></div><div class="sticker-board">${stickerSet.map((sticker,index) => `<div class="sticker ${state.stickers.includes(index)?'':'locked'}" aria-label="${state.stickers.includes(index)?'もらったスタンプ':'これからもらうスタンプ'}">${sticker}</div>`).join('')}</div></section>`;
}
function openLesson(letter, {word=null, index=0}={}) {
  const isHira = hiragana.includes(letter);
  const group = isHira ? 'hiragana' : 'katakana';
  const file = `./assets/strokes/${group}/${letter}.svg`;
  const lessonLetters = word ? [...word.word] : [letter];
  const context = word ? 'ことばのまち・ことばの道' : 'ことばのまち・もじの道';
  const title = word ? `「${word.word}」を つづけてかこう` : `「${letter}」を かいてみよう`;
  const guideMarkup = lessonLetters.length > 1
    ? `<div class="guide-word" style="--guide-count:${lessonLetters.length}">${lessonLetters.map(char => { const decomposed=char.normalize('NFD'); const baseChar=decomposed[0]; const mark=decomposed.includes('\u3099')?'てんてん':decomposed.includes('\u309a')?'まる':''; const charGroup=hiragana.includes(baseChar)?'hiragana':'katakana'; return `<figure><img class="guide-img" src="./assets/strokes/${charGroup}/${baseChar}.svg?play=${Date.now()}" alt="${char} の書き順"><figcaption>${char}</figcaption>${mark?`<small class="guide-mark">${mark}</small>`:''}</figure>`; }).join('')}</div>`
    : `<div class="guide-stack"><img class="guide-img" src="${file}?play=${Date.now()}" alt="${letter} の書き順"><div class="guide-label">おてほん</div></div>`;
  const ghostMarkup = word ? lessonLetters.map(char => `<span>${char}</span>`).join('') : letter;
  const cellCount = lessonLetters.length;
  modal.innerHTML = `<div class="lesson"><div class="lesson-top"><div class="lesson-title"><span class="brand-mark">${word ? '道' : 'あ'}</span><div><span class="eyebrow">${context}</span><h2>${title}</h2></div></div><button class="close-button" aria-label="とじる">×</button></div>
  <div class="lesson-layout ${word ? 'word-lesson' : ''}"><div class="guide-card">${guideMarkup}<div class="guide-label">おてほんの書き順</div><div class="guide-actions"><button class="button secondary small" id="replayGuide">↻ もういちど</button><button class="button soft small" id="hearLetter">♪ ${word ? 'ことば' : 'もじ'}をきく</button></div></div>
  <div class="write-card"><div class="write-instructions"><strong>${word ? '左から つづけて書こう' : 'おてほんを見て書こう'}</strong><button class="text-button" id="hideGuide">おてほんを かくす</button></div><div class="canvas-wrap ${word ? 'word-canvas' : ''}" style="--cell-count:${cellCount}"><span id="ghostChar" class="ghost-char ${word ? 'word-ghost' : ''}">${ghostMarkup}</span><canvas id="writeCanvas" aria-label="${word ? `${word.word}をつづけて書く` : `${letter}を書く`}キャンバス"></canvas></div><div class="canvas-controls"><button class="button secondary small" id="undoStroke">↶ ひとつもどす</button><button class="button secondary small" id="clearCanvas">けす</button></div></div></div>
  <div class="lesson-bottom"><span class="lesson-route-label">${word ? `ことばの道　・　${word.word.length}もじ` : 'もじの道'}</span><button class="button" id="finishLesson">${word ? 'このことばをおわる' : 'できた！ スタンプをもらう'}</button></div></div>`;
  modal.showModal();
  setupCanvas(document.querySelector('#writeCanvas'));
  document.querySelector('.close-button').onclick = () => modal.close();
  document.querySelector('#replayGuide').onclick = () => document.querySelectorAll('.guide-img').forEach(image => { const url=new URL(image.src); url.searchParams.set('play',Date.now()); image.src=url.toString(); });
  document.querySelector('#hearLetter').onclick = () => say(word ? word.word : letter);
  let ghostVisible = true;
  document.querySelector('#hideGuide').onclick = event => { ghostVisible = !ghostVisible; document.querySelector('#ghostChar').hidden = !ghostVisible; event.currentTarget.textContent = ghostVisible ? 'おてほんを かくす' : 'おてほんを みる'; };
  document.querySelector('#clearCanvas').onclick = () => { canvasStrokes = []; redrawCanvas(); };
  document.querySelector('#undoStroke').onclick = () => { canvasStrokes.pop(); redrawCanvas(); };
  document.querySelector('#finishLesson').onclick = () => {
    completeSession(letter, word);
  };
}
let canvasStrokes = [];
let activeStroke = null;
let canvasCtx = null;
function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d'); canvasCtx = ctx; canvasStrokes = []; activeStroke = null;
  const resize = () => {
    const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width*ratio); canvas.height = Math.round(rect.height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0); redrawCanvas();
  };
  requestAnimationFrame(resize);
  const point = event => { const rect=canvas.getBoundingClientRect(); return {x:event.clientX-rect.left,y:event.clientY-rect.top}; };
  canvas.onpointerdown = event => { event.preventDefault(); canvas.setPointerCapture(event.pointerId); activeStroke=[point(event)]; canvasStrokes.push(activeStroke); redrawCanvas(); };
  canvas.onpointermove = event => { if(!activeStroke)return; activeStroke.push(point(event)); redrawCanvas(); };
  canvas.onpointerup = canvas.onpointercancel = () => { activeStroke=null; };
  window.addEventListener('resize', resize, {once:true});
}
function redrawCanvas() {
  const canvas=document.querySelector('#writeCanvas'); if(!canvasCtx||!canvas)return;
  const ctx=canvasCtx, ratio=window.devicePixelRatio||1, width=canvas.width/ratio, height=canvas.height/ratio;
  ctx.clearRect(0,0,width,height); ctx.lineWidth=Math.max(7,Math.min(width,height)*.04); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#d2796e';
  for(const stroke of canvasStrokes){ if(!stroke.length)continue; ctx.beginPath(); ctx.moveTo(stroke[0].x,stroke[0].y); if(stroke.length===1){ctx.lineTo(stroke[0].x+.01,stroke[0].y+.01);} else {for(const p of stroke.slice(1))ctx.lineTo(p.x,p.y);} ctx.stroke(); }
}
function completeSession(letter, word) {
  if (word) {
    for (const char of word.word) {
      const baseChar=char.normalize('NFD')[0];
      state.letterCount[baseChar]=(state.letterCount[baseChar]||0)+1;
    }
    state.wordCount[word.word]=(state.wordCount[word.word]||0)+1;
  } else if (letter) state.letterCount[letter]=(state.letterCount[letter]||0)+1;
  const stamp = (state.totalSessions||0)%stickerSet.length;
  if (!state.stickers.includes(stamp)) state.stickers.push(stamp);
  state.totalSessions=(state.totalSessions||0)+1;
  saveState(); modal.close(); render(); toast(`できたね！ ${stickerSet[stamp]} シールをもらったよ`);
}
function beginWord(item) { if(!item)return; openLesson(item.word[0], {word:item}); }
async function prepareOffline() {
  if (!('serviceWorker' in navigator)) { toast('このブラウザではオフラインじゅんびができないみたい'); return; }
  const button=document.querySelector('#setupButton'); if(button){button.disabled=true;button.textContent='じゅんび中…';}
  const progress=document.querySelector('#setupProgress');
  try {
    const registration=await navigator.serviceWorker.ready;
    const chars=[...new Set([...hiragana,...katakana])];
    for(let i=0;i<chars.length;i++){
      const ch=chars[i], group=hiragana.includes(ch)?'hiragana':'katakana';
      const response=await fetch(`./assets/strokes/${group}/${ch}.svg`,{cache:'reload'});
      if(!response.ok)throw new Error(`準備できません: ${ch}`);
      const cache=await caches.open('moji-assets-v1'); await cache.put(`./assets/strokes/${group}/${ch}.svg`,response.clone());
      if(progress)progress.style.width=`${Math.round((i+1)/chars.length*100)}%`;
      if(button)button.textContent=`じゅんび中 ${i+1}/${chars.length}`;
    }
    state.setupComplete=true; saveState(); render(); toast('じゅんびできたよ！ オフラインでもつかえるよ');
  } catch(error) { console.error(error); if(button){button.disabled=false;button.textContent='もういちど';} toast('じゅんびできなかったよ。ネットをたしかめてね'); }
}
document.addEventListener('click', event => {
  const nav=event.target.closest('[data-nav]'); if(nav){ currentView=nav.dataset.nav; render(); app.focus(); return; }
  const letterButton=event.target.closest('[data-letter]'); if(letterButton){ openLesson(letterButton.dataset.letter); return; }
  const scriptButton=event.target.closest('[data-script]'); if(scriptButton){ scriptChoice=scriptButton.dataset.script; renderLetters(); return; }
  const categoryButton=event.target.closest('[data-category]'); if(categoryButton){ categoryChoice=categoryButton.dataset.category; renderWords(); return; }
  const wordButton=event.target.closest('[data-word]'); if(wordButton){ beginWord(words.find(item=>item.word===wordButton.dataset.word)); return; }
});
document.querySelector('#soundToggle').addEventListener('click',()=>{
  modal.innerHTML=`<div class="sound-setting"><div><h2>おとのせってい</h2><p>この端末で使える日本語の声を選べます。声の種類は端末によってちがいます。</p><label class="voice-label" for="voiceChoice">よみあげる声</label><select class="voice-select" id="voiceChoice"><option value="">端末のおまかせ</option></select><div id="voiceNote" class="voice-note"></div><button class="button small" id="testVoice" ${state.sound?'':'disabled'}>あいうえおをきく</button></div><button class="pill-toggle" id="toggleSound">${state.sound?'おんせい ON':'おんせい OFF'}</button></div>`;
  modal.showModal();
  const voiceChoice=document.querySelector('#voiceChoice');
  const voiceNote=document.querySelector('#voiceNote');
  const populateVoices=()=>{
    const speechApi=window.speechSynthesis;
    availableJapaneseVoices=speechApi ? speechApi.getVoices().filter(voice=>voice.lang?.toLowerCase().startsWith('ja')) : [];
    voiceChoice.replaceChildren(new Option('端末のおまかせ',''));
    availableJapaneseVoices.forEach(voice=>voiceChoice.add(new Option(`${voice.name}（${voice.lang}）`,voice.voiceURI)));
    voiceChoice.value=state.voiceURI||'';
    voiceNote.textContent=availableJapaneseVoices.length?'声をききくらべて、聞きやすいものを選んでください。':'この端末から日本語の声を読み込めません。';
  };
  populateVoices();
  if(window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged',populateVoices,{once:true});
  voiceChoice.onchange=()=>{state.voiceURI=voiceChoice.value;saveState();};
  document.querySelector('#toggleSound').onclick=()=>{state.sound=!state.sound;saveState();modal.close();};
  document.querySelector('#testVoice').onclick=()=>say('あいうえお。ねこ。');
});
window.addEventListener('online',()=>toast('ネットにつながったよ')); window.addEventListener('offline',()=>toast('オフラインだよ。じゅんびずみなら つかえるよ'));
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
