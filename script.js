const CARD_POOL = [
  { name: "AZのフラエッテ", rarity: "★★",    img: "assets/cards/AZのフラエッテ_ポケカ.png" },
  { name: "アーゴヨン", rarity: "★★",    img: "assets/cards/アーゴヨン_ポケカ.png" },
  { name: "アーマーガア", rarity: "◆◆",    img: "assets/cards/アーマーガア_ポケカ.png" },
  { name: "アーマルド", rarity: "★",    img: "assets/cards/アーマルド_ポケカ.png" },
  { name: "アクジキング", rarity: "★",  img: "assets/cards/アクジキング_ポケカ.png" },
  { name: "アグノム", rarity: "★★",  img: "assets/cards/アグノム_ポケカ.png" },
  { name: "アシレーヌ", rarity: "★★",  img: "assets/cards/アシレーヌ_ポケカ.png" },
  { name: "アズマオウ", rarity: "◆", img: "assets/cards/アズマオウ_ポケカ.png" },
  { name: "アブソル", rarity: "★★", img: "assets/cards/アブソル_ポケカ.png" },
  { name: "アブソル",rarity: "★★",img: "assets/cards/アブソル2_ポケカ.png" },
  { name: "アママイコ", rarity: "◆",  img: "assets/cards/アママイコ_ポケカ.png" },
  { name: "アマルルガ", rarity: "◆◆",  img: "assets/cards/アマルルガ_ポケカ.png" },
  { name: "アメモース", rarity: "◆",  img: "assets/cards/アメモース_ポケカ.png" },
  { name: "アラブルタケ", rarity: "★", img: "assets/cards/アラブルタケ_ポケカ.png" },
  { name: "アルセウス", rarity: "★★★", img: "assets/cards/アルセウス_ポケカ.png" },
  { name: "アルセウス",rarity: "★★★",img: "assets/cards/アルセウス2_ポケカ.png" }
];

// =========================
// 2) DOM
// =========================
const packScreen = document.getElementById("pack-screen");
const cardsScreen = document.getElementById("cards-screen");
const packButton = document.getElementById("pack");
const cardImage = document.getElementById("card-image");
const cardName = document.getElementById("card-name");
const cardMeta = document.getElementById("card-meta");
const nextButton = document.getElementById("next-button");
const thumbs = document.getElementById("thumbs");

// =========================
// 3) 状態
// =========================
let startY = 0;
let openedCards = [];
let currentIndex = 0;

// =========================
// 4) 体感最速：プリロード + 次カード先読み
// =========================
const imageCache = new Map();   // key: path, value: Image
let preloadDone = false;

function preloadImagesAll() {
  if (preloadDone) return Promise.resolve();
  preloadDone = true;

  const unique = [...new Set(CARD_POOL.map(c => c.img).filter(Boolean))];
  const tasks = unique.map(src => preloadOne(src));

  // 失敗しても止めない（1枚欠けても動く）
  return Promise.allSettled(tasks).then(() => {});
}

function preloadOne(src) {
  if (!src) return Promise.resolve();
  if (imageCache.has(src)) {
    const img = imageCache.get(src);
    if (img.complete) return Promise.resolve();
    // 読み込み中なら Promise を返す
  }

  return new Promise((resolve) => {
    const img = imageCache.get(src) || new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = src;

    imageCache.set(src, img);

    if (img.complete) {
      resolve();
      return;
    }

    const done = () => resolve();
    img.onload = done;
    img.onerror = done; // 404等でも止めない
  });
}

function preloadNextCard() {
  const next = openedCards[currentIndex + 1];
  if (next && next.img) preloadOne(next.img);
}

// =========================
// 5) 抽選（重複あり）
// =========================
function sampleCards(count) {
  const cards = [];
  for (let i = 0; i < count; i += 1) {
    const randomIndex = Math.floor(Math.random() * CARD_POOL.length);
    cards.push(CARD_POOL[randomIndex]);
  }
  return cards;
}

// =========================
// 6) SVGダミー（保険）
// =========================
function rarityColor(rarity) {
  if (rarity.length >= 4) return ["#ffe08b", "#ff4f87"];
  if (rarity.length === 3) return ["#a4ffe8", "#4097ff"];
  if (rarity.length === 2) return ["#d0c2ff", "#8457ff"];
  return ["#c7ffd0", "#32ad60"];
}

function createCardSvg(card, index) {
  const [topColor, bottomColor] = rarityColor(card.rarity || "◆");
  const safeName = card.name || "CARD";
  const safeRarity = card.rarity || "◆";
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 520'>
  <defs>
    <linearGradient id='bg${index}' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${topColor}'/>
      <stop offset='100%' stop-color='${bottomColor}'/>
    </linearGradient>
  </defs>
  <rect width='360' height='520' rx='24' fill='url(#bg${index})'/>
  <rect x='20' y='20' width='320' height='480' rx='18' fill='rgba(255,255,255,0.2)'/>
  <circle cx='180' cy='220' r='86' fill='rgba(255,255,255,0.35)'/>
  <text x='180' y='82' text-anchor='middle' font-size='32' font-weight='700' fill='#ffffff'>${safeName}</text>
  <text x='180' y='245' text-anchor='middle' font-size='78' fill='rgba(255,255,255,0.9)'>⬢</text>
  <text x='180' y='420' text-anchor='middle' font-size='28' font-weight='700' fill='#fff'>RARITY ${safeRarity}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// =========================
// 7) UI
// =========================
function renderThumbs() {
  thumbs.innerHTML = "";
  openedCards.forEach((_, idx) => {
    const dot = document.createElement("span");
    dot.className = "thumb";
    if (idx < currentIndex) dot.classList.add("revealed");
    if (idx === currentIndex) dot.classList.add("active");
    thumbs.appendChild(dot);
  });
}

function setCardImageFast(card, index) {
  // 1) キャッシュ済みなら即表示
  if (card.img && imageCache.has(card.img)) {
    const cached = imageCache.get(card.img);
    if (cached.complete) {
      cardImage.src = cached.src;
      return;
    }
  }

  // 2) まだなら、いったんダミーを一瞬出してから差し替える（体感改善）
  cardImage.src = createCardSvg(card, index);

  if (card.img) {
    preloadOne(card.img).then(() => {
      const cached = imageCache.get(card.img);
      if (!cached) return;
      // 途中で別カードに移ってたら上書きしない
      if (openedCards[currentIndex] === card) {
        cardImage.src = cached.src;
      }
    });
  }
}

function renderCurrentCard() {
  const card = openedCards[currentIndex];

  setCardImageFast(card, currentIndex);
  cardImage.alt = `${card.name} のカード画像`;
  cardName.textContent = card.name;
  cardMeta.textContent = `${card.rarity} / ${currentIndex + 1}枚目`;

  nextButton.textContent =
    currentIndex === openedCards.length - 1
      ? "もう一度パックを開く"
      : "タップして次のカードへ";

  renderThumbs();
  preloadNextCard(); // 次の1枚を先読み
}

// =========================
// 8) パック開封
// =========================
function openPack() {
  openedCards = sampleCards(5);
  currentIndex = 0;
  packScreen.classList.remove("active");
  cardsScreen.classList.add("active");
  renderCurrentCard();
}

// =========================
// 9) イベント
// =========================

// 初回表示時に全部プリロード（最初だけ少し待つが、以後爆速）
preloadImagesAll();

packButton.addEventListener("touchstart", (event) => {
  startY = event.touches[0].clientY;
});

packButton.addEventListener("touchend", (event) => {
  const endY = event.changedTouches[0].clientY;
  const deltaY = endY - startY;
  if (deltaY < -60) {
    packButton.classList.add("opened");
    setTimeout(() => {
      packButton.classList.remove("opened");
      openPack();
    }, 250);
  }
});

// PCでも動くようにクリックでも開封
packButton.addEventListener("click", () => {
  openPack();
});

// カード画面は「ボタン」以外でもタップで次へ行けるように（体感UP）
cardsScreen.addEventListener("click", (e) => {
  // ボタン押下と二重発火しないように
  if (e.target && e.target.id === "next-button") return;
  nextButton.click();
});

nextButton.addEventListener("click", () => {
  if (currentIndex >= openedCards.length - 1) {
    cardsScreen.classList.remove("active");
    packScreen.classList.add("active");
    return;
  }
  currentIndex += 1;
  renderCurrentCard();
});
