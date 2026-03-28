// --- Configurações Principais Kei Sampaio ---
const PIX_KEY = "1150f286-83b6-4bba-a2ef-19ddf94cf48e";
const RECEIVER_NAME = "KEI SAMPAIO";
const RECEIVER_CITY = "CONTAGEM";
const WHATSAPP_NUMBER = "5533920008206";

// Dados
let rawProducts = JSON.parse(localStorage.getItem('products')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all';

// Zoom Modal State
let currentZoomedProductIdx = null;
let currentZoomedImgIdx = 0;

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  renderProducts();
  updateCartUI();
});

// Sincronizar carrinho entre abas
window.addEventListener('storage', (e) => {
  if (e.key === 'cart' || e.key === 'products') {
    rawProducts = JSON.parse(localStorage.getItem('products')) || [];
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
    renderProducts();
  }
});

// --- Vitrine & Categorias ---
function renderCategories() {
  const categories = JSON.parse(localStorage.getItem('categories')) || ['Todos', 'Dia das Mães', 'Dia dos Namorados'];
  const container = document.getElementById('categories-tabs');
  container.innerHTML = categories.map(c => `
    <div class="tab ${currentCategory === c.toLowerCase() || (c === 'Todos' && currentCategory === 'all') ? 'active' : ''}" 
         onclick="filterByCategory('${c === 'Todos' ? 'all' : c}')">${c}</div>
  `).join('');
}

function filterByCategory(cat) {
  currentCategory = cat.toLowerCase();
  renderCategories();
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById('products-grid');
  const filtered = currentCategory === 'all' 
    ? rawProducts 
    : rawProducts.filter(p => p.category.toLowerCase() === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#aaa;">Nenhum produto nesta categoria 🌸</div>`;
    return;
  }

  container.innerHTML = filtered.map((p, pIdx) => {
    const images = Array.isArray(p.img) ? p.img : [p.img];
    return `
      <div class="product-card" id="card-${p.id}">
        ${p.price_old ? `<span class="promo-badge">PROMOÇÃO</span>` : ''}
        <div class="product-image-container">
          <img src="${images[0]}" alt="${p.title}" id="img-main-${p.id}" onclick="zoomImage(${pIdx}, 0)">
          ${images.length > 1 ? `
            <div class="carousel-nav">
              <span class="nav-btn" onclick="prevCardImg(${pIdx}, event)">❮</span>
              <span class="nav-btn" onclick="nextCardImg(${pIdx}, event)">❯</span>
            </div>
          ` : ''}
        </div>
        <div class="product-info">
          <div>
            <h3 class="product-title">${p.title}</h3>
            <div style="font-size:0.75rem; color:#aaa; margin-top:5px; margin-bottom: 5px;">${p.category}</div>
            <div class="product-price-box">
              ${p.price_old ? `<span class="old-price">R$ ${p.price_old.toFixed(2)}</span>` : ''}
              <span class="current-price">R$ ${p.price_current.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <button class="btn-add" onclick="addToCart(${p.id})">Adicionar no Carrinho</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- Lógica do Carrinho ---
function addToCart(productId) {
  const p = rawProducts.find(prod => prod.id === productId);
  if (!p) return;
  cart.push({...p});
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  
  const btn = event.target;
  const original = btn.innerText;
  btn.innerText = "✅ Adicionado!";
  btn.style.background = "#25d366";
  btn.style.color = "white";
  setTimeout(() => { btn.innerText = original; btn.style.background = ""; btn.style.color = ""; }, 1000);
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  // Sincronizar com localStorage para evitar bug do contador fantasma
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  document.getElementById('cart-count').innerText = cart.length;
  const itemsContainer = document.getElementById('cart-items');
  const totalValEl = document.getElementById('cart-total-value');
  const footer = document.getElementById('cart-footer');
  const empty = document.getElementById('cart-empty');

  if (cart.length === 0) {
    itemsContainer.innerHTML = "";
    totalValEl.innerText = "R$ 0,00";
    footer.style.display = "none";
    empty.style.display = "block";
  } else {
    footer.style.display = "block";
    empty.style.display = "none";
    itemsContainer.innerHTML = cart.map((item, idx) => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <img src="${Array.isArray(item.img) ? item.img[0] : item.img}" class="cart-item-img">
          <div class="cart-item-details">
            <span class="cart-item-title">${item.title}</span>
            <span class="cart-item-price">R$ ${item.price_current.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <span onclick="removeFromCart(${idx})" style="color:red; cursor:pointer; font-weight:800; padding:10px;">✕</span>
      </div>
    `).join('');
    
    const total = cart.reduce((sum, i) => sum + i.price_current, 0);
    totalValEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}

// --- Modais ---
function toggleCartModal(show) { document.getElementById('cart-modal').style.display = show ? 'flex' : 'none'; }
function togglePixModal(show) { document.getElementById('pix-modal').style.display = show ? 'flex' : 'none'; }

function zoomImage(pIdx, iIdx) { 
  currentZoomedProductIdx = pIdx;
  currentZoomedImgIdx = iIdx;
  const p = rawProducts[pIdx];
  const images = Array.isArray(p.img) ? p.img : [p.img];
  document.getElementById('zoomed-image').src = images[iIdx];
  document.getElementById('image-modal').style.display = 'flex';
}

function closeImageZoom() { document.getElementById('image-modal').style.display = 'none'; }

function nextZoomImg() { changeZoomImg(1); }
function prevZoomImg() { changeZoomImg(-1); }

function changeZoomImg(dir) {
  const p = rawProducts[currentZoomedProductIdx];
  const images = Array.isArray(p.img) ? p.img : [p.img];
  currentZoomedImgIdx = (currentZoomedImgIdx + dir + images.length) % images.length;
  document.getElementById('zoomed-image').src = images[currentZoomedImgIdx];
}

// --- Card Carousel ---
let currentCardIndices = {}; // {productId: currentImageIndex}

function nextCardImg(pIdx, e) { e.stopPropagation(); changeCardImg(pIdx, 1); }
function prevCardImg(pIdx, e) { e.stopPropagation(); changeCardImg(pIdx, -1); }

function changeCardImg(pIdx, dir) {
  const p = rawProducts[pIdx];
  const id = p.id;
  const images = Array.isArray(p.img) ? p.img : [p.img];
  currentCardIndices[id] = ((currentCardIndices[id] || 0) + dir + images.length) % images.length;
  document.getElementById(`img-main-${id}`).src = images[currentCardIndices[id]];
}

// --- Pagamento ---
function proceedToPayment() {
  const name = document.getElementById('user-name').value.trim();
  if (!name) { alert("Por favor, digite seu nome! 🌸"); return; }
  
  logSale(name);
  generatePixQR();
  toggleCartModal(false);
  togglePixModal(true);
}

function logSale(customer) {
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  const now = new Date();
  const sale = {
    id: Date.now(),
    customer: customer,
    total: total,
    items: cart.map(i => i.title),
    date: now.toLocaleDateString('pt-BR')
  };
  let sales = JSON.parse(localStorage.getItem('sales')) || [];
  sales.push(sale);
  localStorage.setItem('sales', JSON.stringify(sales));
}

function generatePixQR() {
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  const payload = generatePixPayload(PIX_KEY, total, RECEIVER_NAME, RECEIVER_CITY);
  const qrcodeDiv = document.getElementById("qrcode");
  qrcodeDiv.innerHTML = "";
  new QRCode(qrcodeDiv, { text: payload, width: 180, height: 180 });
}

function copyPixKey() {
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  const payload = generatePixPayload(PIX_KEY, total, RECEIVER_NAME, RECEIVER_CITY);
  navigator.clipboard.writeText(payload);
  const btn = document.getElementById('btn-copy');
  btn.innerText = "✅ Código Copiado!";
  setTimeout(() => btn.innerText = "📋 Copiar Código PIX", 2000);
}

function sendWhatsAppReceipt() {
  const name = document.getElementById('user-name').value.trim();
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  
  // Filtrar para não enviar links Base64 (que quebram o link do WhatsApp por serem longos demais)
  const items = cart.map(i => {
    let imgPart = "";
    const imgUrl = Array.isArray(i.img) ? i.img[0] : i.img;
    if (imgUrl && !imgUrl.startsWith('data:')) {
      imgPart = `%0A  _Foto:_ ${imgUrl}`;
    }
    return `• ${i.title}${imgPart}`;
  }).join('%0A%0A');

  const msg = `Olá! Meu nome é *${name}* e enviei o pagamento de R$ ${total.toFixed(2)} pelo meu pedido: %0A%0A${items}%0A%0AAqui está o comprovante! ✨`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

// --- PIX Payload Generator (EMV QRCPS Robust) ---
function generatePixPayload(key, amount, name, city) {
  const getTLV = (tag, value) => {
    const val = String(value);
    return tag + val.length.toString().padStart(2, '0') + val;
  };

  // GUI + Key
  const gui = getTLV('00', 'br.gov.bcb.pix');
  const keyTlv = getTLV('01', key);
  const merchantAccountInfo = getTLV('26', gui + keyTlv);

  const payload = [
    getTLV('00', '01'), // Payload Format Indicator
    merchantAccountInfo,
    getTLV('52', '0000'), // Merchant Category Code
    getTLV('53', '986'), // Transaction Currency (BRL)
    getTLV('54', amount.toFixed(2)),
    getTLV('58', 'BR'), // Country Code
    getTLV('59', name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25)), 
    getTLV('60', city.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15)),
    getTLV('62', getTLV('05', '***')), // Additional Data (Reference)
    '6304' // CRC16 Placeholder
  ].join('');

  return payload + crc16(payload);
}

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
