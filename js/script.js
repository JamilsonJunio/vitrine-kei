// --- Storefront Logic for Kei Sampaio PRO (v3.0 - IndexedDB Powered) ---

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let categories = ['Todos', 'Dia das Mães', 'Dia dos Namorados'];
let currentCategory = 'all';

// --- IndexedDB Core (O "Armazém") ---
const DB_NAME = 'KeiSampaioDB';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products');
      if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales');
      if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories');
      if (!db.objectStoreNames.contains('config')) db.createObjectStore('config');
    };
  });
}

async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve) => {
    try {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
  });
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadStoreData();
  renderCategories();
  renderProducts();
  updateCartUI();

  // Escutar mudanças no carrinho (Sync entre abas)
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart' || e.key === 'products') {
      refreshData();
    }
  });
});

async function refreshData() {
    await loadStoreData();
    updateCartUI();
    renderProducts();
}

async function loadStoreData() {
  products = await dbGet('products', 'list') || [];
  const storedCats = await dbGet('categories', 'list');
  if (storedCats) categories = storedCats;

  // Fallback se o DB estiver vazio (transição do LocalStorage)
  if (products.length === 0) {
    products = JSON.parse(localStorage.getItem('products')) || [];
  }
}

// --- Renderização ---
function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;
  
  const filtered = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:50px; color:#888;">Nenhum produto encontrado nesta categoria. 🌸</p>';
    return;
  }

  container.innerHTML = filtered.map((p, pIdx) => {
    const images = Array.isArray(p.img) ? p.img : [p.img];
    return `
    <div class="product-card" onclick="zoomImage(${pIdx}, 0)">
      <div class="product-image-container">
        <img src="${images[0]}" alt="${p.title}" id="img-main-${p.id}">
        ${p.price_old ? `<span class="promo-badge">PROMOÇÃO</span>` : ''}
      </div>
      <div class="product-info">
        <div>
          <h3 class="product-title">${p.title}</h3>
          <div style="font-size:0.75rem; color:#aaa; margin-top:5px; margin-bottom: 5px;">${p.category}</div>
          <div class="product-price-box">
            ${p.price_old ? `<span class="old-price">R$ ${p.price_old.toFixed(2).replace('.', ',')}</span>` : ''}
            <span class="current-price">R$ ${p.price_current.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})">Adicionar no Carrinho</button>
      </div>
    </div>
  `}).join('');
}

function renderCategories() {
  const container = document.getElementById('categories-tabs');
  if (!container) return;
  
  const allCats = ['Todos', ...categories.filter(c => c !== 'Todos')];
  container.innerHTML = allCats.map(c => {
      const val = (c === 'Todos' ? 'all' : c);
      return `<div class="tab ${currentCategory === val ? 'active' : ''}" onclick="filterByCategory('${val}')">${c}</div>`;
  }).join('');
}

function filterByCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderProducts();
}

// --- Carrinho ---
function addToCart(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;
  
  cart.push({ ...p, cartId: Date.now() });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  toggleCartModal(true);
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
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
    return;
  }

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

  const total = cart.reduce((s, v) => s + v.price_current, 0);
  totalValEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function toggleCartModal(show) {
  const modal = document.getElementById('cart-modal');
  if(modal) modal.style.display = show ? 'flex' : 'none';
}

function togglePixModal(show) {
    const modal = document.getElementById('pix-modal');
    if(modal) modal.style.display = show ? 'flex' : 'none';
}

// --- Checkout & WhatsApp ---
async function proceedToPayment() {
  const name = document.getElementById('user-name').value.trim();
  if (!name) return alert("Por favor, digite seu nome. 🌸");
  
  const total = cart.reduce((s, v) => s + v.price_current, 0);
  
  // Registrar venda no banco (IndexedDB)
  const sale = {
    id: Date.now(),
    customer: name,
    total: total,
    items: cart.map(i => i.title),
    date: new Date().toLocaleDateString('pt-BR')
  };
  
  const currentSales = await dbGet('sales', 'list') || [];
  currentSales.push(sale);
  const db = await openDB();
  const tx = db.transaction('sales', 'readwrite');
  tx.objectStore('sales').put(currentSales, 'list');
  
  // Gerar PIX
  generatePixQR();
  toggleCartModal(false);
  togglePixModal(true);
}

function generatePixQR() {
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  const payload = generatePixPayload("1150f286-83b6-4bba-a2ef-19ddf94cf48e", total, "KEI SAMPAIO", "CONTAGEM");
  const qrcodeDiv = document.getElementById("qrcode");
  if(qrcodeDiv) {
    qrcodeDiv.innerHTML = "";
    new QRCode(qrcodeDiv, { text: payload, width: 180, height: 180 });
  }
}

function copyPixKey() {
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  const payload = generatePixPayload("1150f286-83b6-4bba-a2ef-19ddf94cf48e", total, "KEI SAMPAIO", "CONTAGEM");
  navigator.clipboard.writeText(payload);
  const btn = document.getElementById('btn-copy');
  if(btn) {
    btn.innerText = "✅ Código Copiado!";
    setTimeout(() => btn.innerText = "📋 Copiar Código PIX", 2000);
  }
}

function sendWhatsAppReceipt() {
  const name = document.getElementById('user-name').value.trim();
  const total = cart.reduce((sum, i) => sum + i.price_current, 0);
  
  const items = cart.map(i => `• ${i.title}`).join('%0A');
  const msg = `Olá! Meu nome é *${name}* e enviei o pagamento de R$ ${total.toFixed(2).replace('.',',')} pelo meu pedido: %0A%0A${items}%0A%0AAqui está o comprovante! ✨`;
  window.open(`https://wa.me/5533920008206?text=${msg}`, '_blank');
}

function generatePixPayload(key, amount, name, city) {
  const getTLV = (tag, value) => {
    const val = String(value);
    return tag + val.length.toString().padStart(2, '0') + val;
  };

  const merchantAccountInfo = getTLV('26', getTLV('00', 'br.gov.bcb.pix') + getTLV('01', key));

  const payload = [
    getTLV('00', '01'),
    merchantAccountInfo,
    getTLV('52', '0000'),
    getTLV('53', '986'),
    getTLV('54', amount.toFixed(2)),
    getTLV('58', 'BR'),
    getTLV('59', name),
    getTLV('60', city),
    getTLV('62', getTLV('05', '***')),
    '6304'
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

// --- Zoom Imagem ---
let currentZoomedProductIdx = null;
let currentZoomedImgIdx = 0;

function zoomImage(pIdx, iIdx) {
  currentZoomedProductIdx = pIdx;
  currentZoomedImgIdx = iIdx;
  const p = products[pIdx];
  const images = Array.isArray(p.img) ? p.img : [p.img];
  const zoomImg = document.getElementById('zoomed-image');
  if(zoomImg) {
      zoomImg.src = images[iIdx];
      document.getElementById('image-modal').style.display = 'flex';
  }
}

function closeImageZoom() {
  document.getElementById('image-modal').style.display = 'none';
}

function nextZoomImg() { changeZoomImg(1); }
function prevZoomImg() { changeZoomImg(-1); }

function changeZoomImg(dir) {
  const p = products[currentZoomedProductIdx];
  const images = Array.isArray(p.img) ? p.img : [p.img];
  currentZoomedImgIdx = (currentZoomedImgIdx + dir + images.length) % images.length;
  document.getElementById('zoomed-image').src = images[currentZoomedImgIdx];
}

// --- Fechar Modais ao clicar fora ---
window.onclick = function(event) {
  const cartModal = document.getElementById('cart-modal');
  const imageModal = document.getElementById('image-modal');
  const pixModal = document.getElementById('pix-modal');
  if (event.target == cartModal) toggleCartModal(false);
  if (event.target == imageModal) closeImageZoom();
  if (event.target == pixModal) togglePixModal(false);
}
