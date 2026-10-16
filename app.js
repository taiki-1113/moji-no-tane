const hiragana = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'];
const katakana = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'];
const hiraganaWords = [
  {word:'ねこ', picture:'🐈'}, {word:'いぬ', picture:'🐕'}, {word:'うさぎ', picture:'🐇'}, {word:'さかな', picture:'🐠'},
  {word:'りんご', picture:'🍎'}, {word:'ばなな', picture:'🍌'}, {word:'おにぎり', picture:'🍙'}, {word:'いちご', picture:'🍓'},
  {word:'くるま', picture:'🚗'}, {word:'でんしゃ', picture:'🚃'}, {word:'はな', picture:'🌷'}, {word:'たいよう', picture:'☀️'},
  {word:'くつ', picture:'👟'}, {word:'ぼうし', picture:'🧢'}, {word:'にこにこ', picture:'😊'}, {word:'おどる', picture:'💃'}
];
const katakanaWords = [
  {word:'ネコ', picture:'🐈'}, {word:'パンダ', picture:'🐼'}, {word:'キリン', picture:'🦒'}, {word:'ライオン', picture:'🦁'},
  {word:'バス', picture:'🚌'}, {word:'タクシー', picture:'🚕'}, {word:'ピアノ', picture:'🎹'}, {word:'ボール', picture:'⚽'},
  {word:'ケーキ', picture:'🍰'}, {word:'アイス', picture:'🍦'}, {word:'パン', picture:'🍞'}, {word:'プリン', picture:'🍮'},
  {word:'チョコ', picture:'🍫'}, {word:'カメラ', picture:'📷'}, {word:'ロボット', picture:'🤖'}, {word:'ユニコーン', picture:'🦄'}
];
const words = [...hiraganaWords, ...katakanaWords];
const stickerSet = ['🌷','🌈','🐣','🍓','⭐','🦋','🐬','🍀','🎈','🐻','🌙','🍰','🐳','💐','🧁','🪁','🌟','🐰','🍉','🌼','🦄','🎀','🐞','🍒'];
const STORE_KEY = 'moji-no-tane-v1';
const ASSET_CHARS = {hiragana, katakana};
const KANA_COLUMNS = ['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','や　ゆ　よ','らりるれろ','わ　　をん'];
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const statusBadge = document.querySelector('#connectionStatus');
const toastEl = document.querySelector('#toast');
let state = loadState();
let currentView = 'letters';
let scriptChoice = 'hiragana';
let wordScriptChoice = 'both';
let currentWord = null;
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
function render() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.nav === currentView || (currentView === 'lesson' && btn.dataset.nav === 'letters')));
  if (currentView === 'letters') renderLetters();
  if (currentView === 'words') renderWords();
  if (currentView === 'stickers') renderStickers();
  statusBadge.classList.toggle('ready', Boolean(state.setupComplete));
  statusBadge.innerHTML = `<i></i> ${state.setupComplete ? 'おてほん OK' : 'おてほん じゅんび'}`;
}
function renderLetters() {
  const columns = KANA_COLUMNS.map(column => [...column].map(char => {
    if (!char.trim()) return '<span class="kana-empty" aria-hidden="true"></span>';
    const letter=scriptChoice==='katakana'?String.fromCharCode(char.charCodeAt(0)+0x60):char;
    return `<button class="kana-card ${state.letterCount[letter]?'done':''}" data-letter="${letter}" aria-label="${letter} を れんしゅう">${letter}</button>`;
  }).join('')).join('');
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">すきな もじを えらんでね</span><h1>もじを かこう</h1></div><div class="segmented" aria-label="もじの しゅるい"><button class="${scriptChoice==='hiragana'?'selected':''}" data-script="hiragana">ひらがな</button><button class="${scriptChoice==='katakana'?'selected':''}" data-script="katakana">カタカナ</button></div></div>
    ${!state.setupComplete ? `<div class="setup-banner"><div><strong>オフラインの じゅんび</strong><p>おてほんを つぎからネットなしで みられるよ。</p><div class="setup-progress"><span id="setupProgress"></span></div></div><button id="setupButton" class="button soft small">じゅんび</button></div>` : ''}
    <p class="subtext">どの もじからでも はじめられるよ。</p><div class="kana-grid" dir="rtl">${columns}</div></section>`;
  document.querySelector('#setupButton')?.addEventListener('click', prepareOffline);
}
function renderWords() {
  const shown = wordScriptChoice === 'both' ? words : wordScriptChoice === 'hiragana' ? hiraganaWords : katakanaWords;
  if (!currentWord || !shown.includes(currentWord)) currentWord = pickWord(shown);
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">ことばを つづけて かこう</span><h1>ことばを かこう</h1></div></div>
    <div class="segmented word-script" aria-label="ことばの しゅるい"><button class="${wordScriptChoice==='hiragana'?'selected':''}" data-word-script="hiragana">ひらがな</button><button class="${wordScriptChoice==='katakana'?'selected':''}" data-word-script="katakana">カタカナ</button><button class="${wordScriptChoice==='both'?'selected':''}" data-word-script="both">どちらも おまかせ</button></div>
    <article class="random-word-card"><div class="word-picture">${currentWord.picture}</div><strong class="random-word">${currentWord.word}</strong><small>${currentWord.word.length} もじ</small><div class="word-actions"><button class="button" id="startRandomWord">これを かく</button><button class="button soft" id="randomWord">つぎの ことば</button></div></article>
    </section>`;
  document.querySelector('#startRandomWord').addEventListener('click', () => beginWord(currentWord));
  document.querySelector('#randomWord').addEventListener('click', () => { currentWord = pickWord(shown, currentWord); renderWords(); });
}
function pickWord(pool, previous=null) { const choices=pool.filter(item=>item!==previous); return choices[Math.floor(Math.random()*choices.length)] || pool[0]; }
function renderStickers() {
  app.innerHTML = `<section class="page"><div class="page-header"><div><span class="eyebrow">がんばった しるし</span><h1>ごほうび</h1></div></div><div class="sticker-summary"><span>✿</span><div><b>${state.stickers.length}</b> <span>こ</span><p class="subtext">れんしゅうのあとに もらったよ</p></div></div><div class="sticker-board">${stickerSet.map((sticker,index) => `<div class="sticker ${state.stickers.includes(index)?'':'locked'}" aria-label="${state.stickers.includes(index)?'もらったスタンプ':'これから もらうスタンプ'}">${sticker}</div>`).join('')}</div></section>`;
}
function glyphMarkup(char, variant='guide') {
  if (char === 'ー') return `<span class="kana-glyph kana-glyph-long ${variant}">ー</span>`;
  const decomposed=char.normalize('NFD');
  const baseChar=decomposed[0];
  const mark=decomposed.includes('\u3099')?'dakuten':decomposed.includes('\u309a')?'handakuten':'';
  const group=hiragana.includes(baseChar)?'hiragana':'katakana';
  const small='ぁぃぅぇぉゃゅょっァィゥェォャュョッ'.includes(char);
  const source=`./assets/strokes/${group}/${baseChar}.svg`;
  const reload=variant==='guide'?`?play=${Date.now()}`:'';
  return `<span class="kana-glyph ${variant} ${small?'small-kana':''} ${mark}" aria-label="${char}"><img src="${source}${reload}" alt=""><i></i></span>`;
}
function openLesson(letter, {word=null, index=0}={}) {
  const lessonLetters = word ? [...word.word] : [letter];
  const title = word ? `「${word.word}」を つづけて かこう` : `「${letter}」を かいてみよう`;
  const guideMarkup = `<div class="guide-word ${word?'':'single-glyph'}" style="--guide-count:${lessonLetters.length}">${lessonLetters.map(char => `<figure>${glyphMarkup(char,'guide')}<figcaption>${char}</figcaption></figure>`).join('')}</div>`;
  const ghostMarkup = lessonLetters.map(char => glyphMarkup(char,'trace')).join('');
  const cellCount = lessonLetters.length;
  modal.innerHTML = `<div class="lesson"><div class="lesson-top"><div class="lesson-title"><span class="brand-mark">${word ? '♡' : 'あ'}</span><div><span class="eyebrow">${word ? 'ことばを れんしゅう' : 'もじを れんしゅう'}</span><h2>${title}</h2></div></div><button class="close-button" aria-label="とじる">×</button></div>
  <div class="lesson-layout ${word ? 'word-lesson' : ''}"><div class="guide-card">${guideMarkup}<div class="guide-label">かきかたの おてほん</div><div class="guide-actions"><button class="button secondary small" id="replayGuide">↻ もういちど</button><button class="button soft small" id="hearLetter">♪ きく</button></div></div>
  <div class="write-card"><div class="write-instructions"><strong>${word ? 'ひだりから つづけて かこう' : 'おてほんを みて かこう'}</strong><button class="text-button" id="hideGuide">おてほんを かくす</button></div><div class="canvas-wrap ${word ? 'word-canvas' : ''}" style="--cell-count:${cellCount}"><span id="ghostChar" class="ghost-char ${word ? 'word-ghost' : ''}">${ghostMarkup}</span><canvas id="writeCanvas" aria-label="${word ? `${word.word}を つづけて かく` : `${letter}を かく`}キャンバス"></canvas></div><div class="canvas-controls"><button class="button secondary small" id="undoStroke">↶ ひとつ もどす</button><button class="button secondary small" id="clearCanvas">けす</button></div></div></div>
  <div class="lesson-bottom"><span class="lesson-route-label">${word ? `${word.word.length} もじ` : 'すきな もじ'}</span><button class="button" id="finishLesson">${word ? 'できた！' : 'できた！ シールを もらう'}</button></div></div>`;
  modal.showModal();
  setupCanvas(document.querySelector('#writeCanvas'));
  document.querySelector('.close-button').onclick = () => modal.close();
  document.querySelector('#replayGuide').onclick = () => document.querySelectorAll('.kana-glyph.guide img').forEach(image => { const url=new URL(image.src); url.searchParams.set('play',Date.now()); image.src=url.toString(); });
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
    for (const char of word.word) if (hiragana.includes(char) || katakana.includes(char)) state.letterCount[char]=(state.letterCount[char]||0)+1;
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
  const button=document.querySelector('#setupButton'); if(button){button.disabled=true;button.textContent='じゅんび ちゅう…';}
  const progress=document.querySelector('#setupProgress');
  try {
    const registration=await navigator.serviceWorker.ready;
    const chars=[...new Set([...hiragana,...katakana])];
    for(let i=0;i<chars.length;i++){
      const ch=chars[i], group=hiragana.includes(ch)?'hiragana':'katakana';
      const response=await fetch(`./assets/strokes/${group}/${ch}.svg`,{cache:'reload'});
      if(!response.ok)throw new Error(`おてほんを よみこめません: ${ch}`);
      const cache=await caches.open('moji-assets-v1'); await cache.put(`./assets/strokes/${group}/${ch}.svg`,response.clone());
      if(progress)progress.style.width=`${Math.round((i+1)/chars.length*100)}%`;
      if(button)button.textContent=`じゅんび ちゅう ${i+1}/${chars.length}`;
    }
    state.setupComplete=true; saveState(); render(); toast('じゅんびできたよ！ オフラインでもつかえるよ');
  } catch(error) { console.error(error); if(button){button.disabled=false;button.textContent='もういちど';} toast('じゅんびできなかったよ。ネットをたしかめてね'); }
}
document.addEventListener('click', event => {
  const nav=event.target.closest('[data-nav]'); if(nav){ currentView=nav.dataset.nav; render(); app.focus(); return; }
  const letterButton=event.target.closest('[data-letter]'); if(letterButton){ openLesson(letterButton.dataset.letter); return; }
  const scriptButton=event.target.closest('[data-script]'); if(scriptButton){ scriptChoice=scriptButton.dataset.script; renderLetters(); return; }
  const wordScriptButton=event.target.closest('[data-word-script]'); if(wordScriptButton){ wordScriptChoice=wordScriptButton.dataset.wordScript; currentWord=null; renderWords(); return; }
});
document.querySelector('#soundToggle').addEventListener('click',()=>{
  modal.innerHTML=`<div class="sound-setting"><div><h2>おとのせってい</h2><p>この たんまつで つかえる こえを えらべるよ。</p><label class="voice-label" for="voiceChoice">よみあげる こえ</label><select class="voice-select" id="voiceChoice"><option value="">たんまつの おまかせ</option></select><div id="voiceNote" class="voice-note"></div><button class="button small" id="testVoice" ${state.sound?'':'disabled'}>あいうえおを きく</button></div><button class="pill-toggle" id="toggleSound">${state.sound?'おんせい ON':'おんせい OFF'}</button></div>`;
  modal.showModal();
  const voiceChoice=document.querySelector('#voiceChoice');
  const voiceNote=document.querySelector('#voiceNote');
  const populateVoices=()=>{
    const speechApi=window.speechSynthesis;
    availableJapaneseVoices=speechApi ? speechApi.getVoices().filter(voice=>voice.lang?.toLowerCase().startsWith('ja')) : [];
    voiceChoice.replaceChildren(new Option('たんまつの おまかせ',''));
    availableJapaneseVoices.forEach((voice,index)=>voiceChoice.add(new Option(`こえ ${index+1}`,voice.voiceURI)));
    voiceChoice.value=state.voiceURI||'';
    voiceNote.textContent=availableJapaneseVoices.length?'ためしに きいて、すきな こえを えらんでね。':'この たんまつでは にほんごの こえを つかえないみたい。';
  };
  populateVoices();
  if(window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged',populateVoices,{once:true});
  voiceChoice.onchange=()=>{state.voiceURI=voiceChoice.value;saveState();};
  document.querySelector('#toggleSound').onclick=()=>{state.sound=!state.sound;saveState();modal.close();};
  document.querySelector('#testVoice').onclick=()=>say('あいうえお。ねこ。');
});
window.addEventListener('online',()=>toast('ネットに つながったよ')); window.addEventListener('offline',()=>toast('オフラインだよ。じゅんびずみなら つかえるよ'));
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
