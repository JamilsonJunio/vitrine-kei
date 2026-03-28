// --- Admin Logic for Kei Sampaio PRO (v3.0 - IndexedDB Powered) ---

let products = [];
let sales = [];
let categories = ['Todos', 'Dia das Mães', 'Dia dos Namorados'];
let currentImages = [];

// --- Configuração ---
const DB_NAME = 'KeiSampaioDB';
const STORES = ['products', 'sales', 'categories', 'config'];
const CLOUD_API = '/functions/api/data';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); });
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    } catch (e) { reject(e); }
  });
}

async function dbSet(store, key, val) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    } catch (e) { reject(e); }
  });
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
  await migrateFromLocalStorage();
  await loadData();
  initTabs();
  renderSales();
  renderProductsAdmin();
  renderCategoriesAdmin();
  updateMemoryMeter();
});

async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem('migrated_v3');
  if (migrated) return;

  console.log("Migrando dados do LocalStorage para o Armazém...");
  const oldProducts = JSON.parse(localStorage.getItem('products')) || [];
  const oldSales = JSON.parse(localStorage.getItem('sales')) || [];
  const oldCats = JSON.parse(localStorage.getItem('categories')) || categories;
  const oldConfig = JSON.parse(localStorage.getItem('config')) || config;

  if (oldProducts.length) await dbSet('products', 'list', oldProducts);
  if (oldSales.length) await dbSet('sales', 'list', oldSales);
  await dbSet('categories', 'list', oldCats);
  await dbSet('config', 'main', oldConfig);

  localStorage.setItem('migrated_v3', 'true');
  console.log("Migração concluída com sucesso!");
}

async function loadData() {
  products = await dbGet('products', 'list') || [];
  sales = await dbGet('sales', 'list') || [];
  categories = await dbGet('categories', 'list') || categories;
  config = await dbGet('config', 'main') || config;
}

function updateMemoryMeter() {
  // Agora o limite é o disco do usuário (centenas de MB), não os 5MB do LocalStorage
  const used = JSON.stringify(products).length + JSON.stringify(sales).length;
  const text = document.getElementById('memory-meter-text');
  const meter = document.getElementById('memory-meter-fill');
  if (text && meter) {
    text.innerText = `Armazém Ativado (Espaço utilizado: ${(used/1024).toFixed(0)}KB)`;
    meter.style.width = "100%";
    meter.style.background = "#2e7d32"; // Sempre verde (Saudável)
  }
}

// --- Abas ---
function initTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab, .admin-section').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });
}

// --- Vendas ---
function renderSales() {
  const container = document.getElementById('sales-log');
  const today = new Date().toLocaleDateString('pt-BR');
  const todaySales = sales.filter(s => s.date === today);
  const totalDay = todaySales.reduce((s, v) => s + v.total, 0);
  const totalMonth = sales.reduce((s, v) => s + v.total, 0);

  document.getElementById('stat-total-day').innerText = `R$ ${totalDay.toFixed(2)}`;
  document.getElementById('stat-count-day').innerText = todaySales.length;
  document.getElementById('stat-total-month').innerText = `R$ ${totalMonth.toFixed(2)}`;

  container.innerHTML = sales.sort((a,b) => b.id - a.id).map(s => `
    <tr><td>${s.date}</td><td><strong>${s.customer}</strong></td><td>R$ ${s.total.toFixed(2)}</td></tr>
  `).join('');
}

// --- Produtos ---
function renderProductsAdmin() {
  const container = document.getElementById('product-list-admin');
  container.innerHTML = products.map(p => `
    <tr>
      <td style="width: 70px;">
        <img src="${Array.isArray(p.img) ? p.img[0] : p.img}" style="width:50px; height:50px; border-radius:10px; object-fit:cover; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      </td>
      <td>
        <div style="font-weight:700; color:#333;">${p.title}</div>
        <div style="font-size:0.7rem; color:#aaa; margin-top:2px;" class="show-mobile-only">${p.category}</div>
      </td>
      <td class="hide-mobile">
        <span style="background:#f0f0f0; padding:4px 10px; border-radius:8px; font-size:0.75rem; color:#666;">${p.category}</span>
      </td>
      <td style="font-weight:800; color:var(--primary);">
        R$ ${p.price_current.toFixed(2)}
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <button class="btn-action" onclick="editProduct(${p.id})" style="border:none; background:#eee; padding:8px; border-radius:8px; cursor:pointer;">✎</button>
          <button class="btn-action" onclick="deleteProduct(${p.id})" style="border:none; background:#ffebee; color:#d32f2f; padding:8px; border-radius:8px; cursor:pointer;">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddProduct() {
  currentImages = [];
  document.getElementById('product-form-admin').reset();
  document.getElementById('admin-p-id').value = "";
  document.getElementById('modal-title-admin').innerText = "Novo Produto";
  document.getElementById('admin-img-previews-container').innerHTML = "";
  populateCategories();
  toggleProductModal(true);
}

function editProduct(id) {
  const p = products.find(prod => prod.id === id);
  if (!p) return;
  
  currentImages = Array.isArray(p.img) ? [...p.img] : [p.img];
  document.getElementById('admin-p-id').value = p.id;
  document.getElementById('admin-p-title').value = p.title;
  document.getElementById('admin-p-price').value = p.price_current;
  document.getElementById('admin-p-price-old').value = p.price_old || "";
  document.getElementById('admin-p-category').value = p.category;
  document.getElementById('admin-p-desc').value = p.description;
  
  renderPreviews();
  populateCategories();
  toggleProductModal(true);
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('admin-p-id').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerText = "⏳ Salvando...";
  btn.disabled = true;

  const finalImages = [];
  for (let img of currentImages) {
    if (img.startsWith('data:') && config.imgbb_key) {
      const remoteUrl = await uploadToImgBB(img);
      if (remoteUrl) finalImages.push(remoteUrl);
    } else {
      finalImages.push(img);
    }
  }

  const pData = {
    id: id ? parseInt(id) : Date.now(),
    title: document.getElementById('admin-p-title').value,
    price_current: parseFloat(document.getElementById('admin-p-price').value),
    price_old: parseFloat(document.getElementById('admin-p-price-old').value) || null,
    category: document.getElementById('admin-p-category').value,
    description: document.getElementById('admin-p-desc').value,
    img: finalImages.length > 0 ? finalImages : ['https://placehold.co/400x400?text=No+Image']
  };

  if (id) {
    const idx = products.findIndex(p => p.id === parseInt(id));
    products[idx] = pData;
  } else {
    products.push(pData);
  }

  try {
    await dbSet('products', 'list', products);
    renderProductsAdmin();
    updateMemoryMeter();
    toggleProductModal(false);
    alert("Pronto! Loja atualizada com sucesso! 💎");
  } catch (err) {
    console.error("Erro ao salvar:", err);
    alert("❌ Erro ao salvar o produto no banco de dados. Tente novamente ou use o botão de Reset nas configurações.");
  }
  
  btn.innerText = "Salvar no Servidor ✨";
  btn.disabled = false;
}

async function uploadToImgBB(base64) {
  const apiKey = config.imgbb_key;
  if (!apiKey) return null;
  const body = new FormData();
  body.append('image', base64.split(',')[1]);
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body });
    const data = await res.json();
    return data.data.url;
  } catch (err) { return null; }
}

function previewImagesAdmin(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 600; 
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 600, 600);
        currentImages.push(canvas.toDataURL('image/jpeg', 0.6));
        renderPreviews();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  const container = document.getElementById('admin-img-previews-container');
  container.innerHTML = currentImages.map((img, idx) => `
    <div class="img-preview-box">
      <img src="${img}" style="width:100%;height:100%;object-fit:cover;">
      <button class="btn-remove-img" onclick="removePreview(${idx})">✕</button>
    </div>
  `).join('');
}

function removePreview(idx) {
  currentImages.splice(idx, 1);
  renderPreviews();
}

async function saveConfig() {
  config.imgbb_key = document.getElementById('admin-imgbb-key').value.trim();
  await dbSet('config', 'main', config);
  alert("Configurações salvas! ⚙️");
}

async function deleteProduct(id) {
  if (confirm("Deletar esse produto?")) {
    products = products.filter(p => p.id !== id);
    await dbSet('products', 'list', products);
    renderProductsAdmin();
    updateMemoryMeter();
  }
}

function toggleProductModal(show) { document.getElementById('product-modal-admin').style.display = show ? 'flex' : 'none'; }
function populateCategories() {
  document.getElementById('admin-p-category').innerHTML = categories.filter(c => c !== 'Todos').map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderCategoriesAdmin() {
  const container = document.getElementById('category-list-admin');
  if (!container) return;
  container.innerHTML = categories.filter(c => c !== 'Todos').map(c => `
    <div class="tab">
      ${c} <span style="margin-left:8px; cursor:pointer; color:red;" onclick="deleteCategory('${c}')">✕</span>
    </div>
  `).join('');
}

async function addCategory() {
  const name = document.getElementById('new-cat-name').value.trim();
  if (name && !categories.includes(name)) {
    categories.push(name);
    await dbSet('categories', 'list', categories);
    renderCategoriesAdmin();
    populateCategories();
    document.getElementById('new-cat-name').value = "";
    alert("Categoria adicionada! ✨");
  }
}

async function deleteCategory(name) {
  if (confirm(`Deseja excluir a categoria "${name}"?`)) {
    categories = categories.filter(c => c !== name);
    await dbSet('categories', 'list', categories);
    renderCategoriesAdmin();
    populateCategories();
  }
}

async function syncAll() {
  const overlay = document.getElementById('sync-overlay');
  const bar = document.getElementById('sync-bar-fill');
  const status = document.getElementById('sync-status-text');
  
  overlay.style.display = 'flex';
  bar.style.width = '0%';
  status.innerText = "Sincronizando loja...";

  try {
    // Passo 1: Preparar dados
    bar.style.width = '30%';
    const data = {
      products,
      sales,
      categories,
      lastSync: Date.now()
    };

    // Passo 2: Enviar
    bar.style.width = '60%';
    const res = await fetch(CLOUD_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Erro na resposta do servidor");

    // Passo 3: Finalizar
    bar.style.width = '100%';
    status.innerText = "Loja Sincronizada! ✅";
    
    setTimeout(() => {
      overlay.style.display = 'none';
      alert("🚀 Sucesso! Sua loja foi salva na nuvem e está pronta para ser aberta no celular.");
    }, 1000);

  } catch (err) {
    console.error(err);
    overlay.style.display = 'none';
    alert("❌ Falha na Sincronização.\n\nVerifique se o banco de dados KV está configurado no seu painel Cloudflare.");
  }
}

async function loadFromCloud() {
  if (!confirm("Isso irá substituir os dados atuais deste navegador pelos dados salvos na nuvem. Continuar?")) return;
  
  try {
    const res = await fetch(CLOUD_API);
    const data = await res.json();
    
    if (data.products) {
      products = data.products;
      sales = data.sales || [];
      categories = data.categories || categories;
      
      await dbSet('products', 'list', products);
      await dbSet('sales', 'list', sales);
      await dbSet('categories', 'list', categories);
      
      location.reload();
    } else {
      alert("Nenhum dado encontrado na nuvem.");
    }
  } catch (err) {
    alert("Erro ao baixar dados: " + err.message);
  }
}

async function clearAllData() {
  if (confirm("⚠️ ATENÇÃO: Isso vai apagar TODOS os produtos e vendas salvos neste navegador. \n\nDeseja continuar?")) {
    const db = await openDB();
    const tx = db.transaction(STORES, 'readwrite');
    STORES.forEach(s => tx.objectStore(s).clear());
    tx.oncomplete = () => {
        localStorage.removeItem('migrated_v3');
        location.reload();
    }
  }
}
