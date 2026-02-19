const CARD_POOL = [
  { name: "リーフィア", rarity: "★" },
  { name: "ヒトカゲ", rarity: "◆" },
  { name: "フシギダネ", rarity: "◆" },
  { name: "ゼニガメ", rarity: "◆" },
  { name: "ピカチュウ", rarity: "★★" },
  { name: "ゲンガー", rarity: "★★" },
  { name: "ルカリオ", rarity: "★★" },
  { name: "カイリュー", rarity: "★★★" },
  { name: "ミュウ", rarity: "★★★" },
  { name: "ミライドン", rarity: "★★★★" }
];

const packScreen = document.getElementById("pack-screen");
const cardsScreen = document.getElementById("cards-screen");
const packButton = document.getElementById("pack");
const cardImage = document.getElementById("card-image");
const cardName = document.getElementById("card-name");
const cardMeta = document.getElementById("card-meta");
const nextButton = document.getElementById("next-button");
const thumbs = document.getElementById("thumbs");

let startY = 0;
let openedCards = [];
let currentIndex = 0;

function sampleCards(count) {
  const cards = [];
  for (let i = 0; i < count; i += 1) {
    const randomIndex = Math.floor(Math.random() * CARD_POOL.length);
    cards.push(CARD_POOL[randomIndex]);
  }
  return cards;
}

function rarityColor(rarity) {
  if (rarity.length >= 4) return ["#ffe08b", "#ff4f87"];
  if (rarity.length === 3) return ["#a4ffe8", "#4097ff"];
  if (rarity.length === 2) return ["#d0c2ff", "#8457ff"];
  return ["#c7ffd0", "#32ad60"];
}

function createCardSvg(card, index) {
  const [topColor, bottomColor] = rarityColor(card.rarity);
  const safeName = card.name;
  const safeRarity = card.rarity;
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

function renderCurrentCard() {
  const card = openedCards[currentIndex];
  cardImage.src = createCardSvg(card, currentIndex);
  cardImage.alt = `${card.name} のダミーカード画像`;
  cardName.textContent = card.name;
  cardMeta.textContent = `${card.rarity} / ${currentIndex + 1}枚目`; 

  if (currentIndex === openedCards.length - 1) {
    nextButton.textContent = "もう一度パックを開く";
  } else {
    nextButton.textContent = "タップして次のカードへ";
  }

  renderThumbs();
}

function openPack() {
  openedCards = sampleCards(5);
  currentIndex = 0;
  packScreen.classList.remove("active");
  cardsScreen.classList.add("active");
  renderCurrentCard();
}

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

packButton.addEventListener("click", () => {
  openPack();
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
