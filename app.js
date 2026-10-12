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
  utterance.lang = 'ja-JP'; utterance.rate = .78; utterance.pitch = 1.08;
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
  statusBadge.innerHTML = `<i></i> ${state.setupComplete ? 'オフラインOK' : 'オフラインじゅんび中'}`;
}
function renderHome() {
  const total = Object.keys(state.letterCount || {}).length;
  const next = todayRecommendation();
  app.innerHTML = `<section class="page">
    <div class="home-hero"><div class="hero-copy"><span class="eyebrow">きょうも たのしく もじあそび</span><h1>じょうずに かけなくても<br>だいじょうぶ ✿</h1><p>ひとつずつ ゆっくり、もじと なかよくなろう。</p><button class="button" data-letter="${next}">きょうの もじ「${next}」をかく</button></div><div class="hero-art" aria-hidden="true">🌱</div></div>
    ${!state.setupComplete ? `<div class="setup-banner"><div><strong>オフラインのじゅんび</strong><p>じゅんびがおわると、ネットがなくても もじのおてほんをみられるよ。</p><div class="setup-progress"><span id="setupProgress"></span></div></div><button id="setupButton" class="button soft small">じゅんびする</button></div>` : ''}
    <div class="section-heading"><h2>なにを してみる？</h2></div>
    <div class="quick-grid">
      <button class="quick-card" data-nav="letters"><span class="emoji">🖍️</span><strong>もじをかく</strong><small>あ〜んをれんしゅう</small></button>
      <button class="quick-card" data-nav="words"><span class="emoji">🍓</span><strong>ことばであそぶ</strong><small>えをみて かいてみよう</small></button>
      <button class="quick-card" data-nav="stickers"><span class="emoji">🎁</span><strong>シールちょう</strong><small>${state.stickers.length}まい あつめたよ</small></button>
    </div>
    <div class="progress-card"><span class="progress-bubble">🌼</span><div class="progress-copy"><strong>きょうまでに ${total}この もじを れんしゅうしたよ</strong><small>いっぽずつ すすんでいるね！</small></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, total / 92 * 100)}%"></div></div></div>
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
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">えをみて ことばを かいてみよう</span><h1>ことばの じかん</h1></div><button class="button soft small" id="randomWord">おまかせ 🎲</button></div>
    <div class="category-row">${categories.map(category => `<button class="chip ${category===categoryChoice?'selected':''}" data-category="${category}">${category}</button>`).join('')}</div>
    <div class="word-grid">${shown.map(item => `<button class="word-card" data-word="${item.word}"><span class="word-picture">${item.picture}</span><strong>${item.word}</strong><small>${item.category} ・ ${state.wordCount[item.word] ? 'れんしゅうしたよ' : 'やってみよう'}</small></button>`).join('')}</div>
    </section>`;
  document.querySelector('#randomWord').addEventListener('click', () => beginWord(shown[Math.floor(Math.random()*shown.length)]));
}
function renderStickers() {
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">れんしゅうして あつめよう</span><h1>シールちょう</h1></div></div><div class="sticker-summary"><span>💌</span><div><b>${state.stickers.length}</b> <span>まい あつめたよ！</span><p class="subtext">れんしゅうを がんばった きみに プレゼント ✨</p></div></div><div class="sticker-board">${stickerSet.map((sticker,index) => `<div class="sticker ${state.stickers.includes(index)?'':'locked'}" aria-label="${state.stickers.includes(index)?'もらったシール':'これからもらうシール'}">${sticker}</div>`).join('')}</div></section>`;
}
function openLesson(letter, {word=null, index=0}={}) {
  const isHira = hiragana.includes(letter);
  const group = isHira ? 'hiragana' : 'katakana';
  const file = `./assets/strokes/${group}/${letter}.svg`;
  const context = word ? `ことば「${word.word}」の ${index+1}もじめ` : 'もじを れんしゅう';
  modal.innerHTML = `<div class="lesson"><div class="lesson-top"><div class="lesson-title"><span class="brand-mark">✿</span><div><span class="eyebrow">${context}</span><h2>「${letter}」を かいてみよう</h2></div></div><button class="close-button" aria-label="とじる">×</button></div>
  <div class="lesson-layout"><div class="guide-card"><div class="guide-stack"><img class="guide-img" src="${file}?play=${Date.now()}" alt="${letter} の書き順アニメーション"><div class="guide-label">おてほんを よくみてみよう</div></div><div class="guide-actions"><button class="button secondary small" id="replayGuide">↻ もういちど</button><button class="button soft small" id="hearLetter">♪ おとをきく</button></div></div>
  <div class="write-card"><div class="write-instructions"><strong>じゆうに かいてみよう</strong><button class="text-button" id="hideGuide">おてほんを かくす</button></div><div class="canvas-wrap"><span id="ghostChar" class="ghost-char">${letter}</span><canvas id="writeCanvas" aria-label="文字を書くキャンバス"></canvas></div><div class="canvas-controls"><button class="button secondary small" id="undoStroke">↶ ひとつもどす</button><button class="button secondary small" id="clearCanvas">けす</button></div></div></div>
  <div class="lesson-bottom"><span class="encouragement">🌱 じぶんのペースで だいじょうぶ</span><button class="button" id="finishLesson">${word && index < word.word.length-1 ? 'つぎの もじへ →' : 'できた！ シールをもらう ✨'}</button></div></div>`;
  modal.showModal();
  setupCanvas(document.querySelector('#writeCanvas'));
  document.querySelector('.close-button').onclick = () => modal.close();
  document.querySelector('#replayGuide').onclick = () => { document.querySelector('.guide-img').src = `${file}?play=${Date.now()}`; };
  document.querySelector('#hearLetter').onclick = () => say(letter);
  let ghostVisible = true;
  document.querySelector('#hideGuide').onclick = event => { ghostVisible = !ghostVisible; document.querySelector('#ghostChar').hidden = !ghostVisible; event.currentTarget.textContent = ghostVisible ? 'おてほんを かくす' : 'おてほんを みる'; };
  document.querySelector('#clearCanvas').onclick = () => { canvasStrokes = []; redrawCanvas(); };
  document.querySelector('#undoStroke').onclick = () => { canvasStrokes.pop(); redrawCanvas(); };
  document.querySelector('#finishLesson').onclick = () => {
    if (word && index < word.word.length-1) { modal.close(); openLesson(word.word[index+1], {word,index:index+1}); return; }
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
  ctx.clearRect(0,0,width,height); ctx.lineWidth=Math.max(7,Math.min(width,height)*.04); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#ef8ca1';
  for(const stroke of canvasStrokes){ if(!stroke.length)continue; ctx.beginPath(); ctx.moveTo(stroke[0].x,stroke[0].y); if(stroke.length===1){ctx.lineTo(stroke[0].x+.01,stroke[0].y+.01);} else {for(const p of stroke.slice(1))ctx.lineTo(p.x,p.y);} ctx.stroke(); }
}
function completeSession(letter, word) {
  if (word) {
    for (const char of word.word) state.letterCount[char]=(state.letterCount[char]||0)+1;
    state.wordCount[word.word]=(state.wordCount[word.word]||0)+1;
  } else if (letter) state.letterCount[letter]=(state.letterCount[letter]||0)+1;
  const stamp = (state.totalSessions||0)%stickerSet.length;
  if (!state.stickers.includes(stamp)) state.stickers.push(stamp);
  state.totalSessions=(state.totalSessions||0)+1;
  saveState(); modal.close(); render(); toast(`できたね！ ${stickerSet[stamp]} シールをもらったよ`);
}
function beginWord(item) { if(!item)return; say(item.word); openLesson(item.word[0], {word:item,index:0}); }
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
  modal.innerHTML=`<div class="sound-setting"><div><h2>おとを きくせってい</h2><p>もじやことばの よみかたを おんせいで きけるよ。</p><button class="button small" id="testVoice">おとを きいてみる</button></div><button class="pill-toggle" id="toggleSound">${state.sound?'おんせい ON':'おんせい OFF'}</button></div>`;
  modal.showModal(); document.querySelector('#toggleSound').onclick=()=>{state.sound=!state.sound;saveState();modal.close();}; document.querySelector('#testVoice').onclick=()=>say('あいうえお');
});
window.addEventListener('online',()=>toast('ネットにつながったよ')); window.addEventListener('offline',()=>toast('オフラインだよ。じゅんびずみなら つかえるよ'));
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
