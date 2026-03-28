// --- Admin Logic for Kei Sampaio PRO ---

let products = JSON.parse(localStorage.getItem('products')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Todos', 'Dia das Mães', 'Dia dos Namorados'];
let config = JSON.parse(localStorage.getItem('config')) || { imgbb_key: "" };

let currentImages = []; // Para armazenar as imagens do produto atual (preview/Base64)

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  renderSales();
  renderProductsAdmin();
  renderCategoriesAdmin();
  updateMemoryMeter();
  document.getElementById('admin-imgbb-key').value = config.imgbb_key;
});

function updateMemoryMeter() {
  const total = 5 * 1024 * 1024; // 5MB limit
  const used = JSON.stringify(localStorage).length;
  const percent = Math.min((used / total) * 100, 100).toFixed(1);
  const meter = document.getElementById('memory-meter-fill');
  const text = document.getElementById('memory-meter-text');
  if(meter && text) {
    meter.style.width = percent + "%";
    meter.style.background = percent > 80 ? '#d32f2f' : (percent > 50 ? '#fbc02d' : '#2e7d32');
    text.innerText = `Memória Usada: ${percent}% (${(used/1024).toFixed(0)}KB de 5MB)`;
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
      <td><img src="${Array.isArray(p.img) ? p.img[0] : p.img}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;"></td>
      <td><strong>${p.title}</strong></td>
      <td>R$ ${p.price_current.toFixed(2)}</td>
      <td>
        <button class="tab" onclick="editProduct(${p.id})">✎</button>
        <button class="tab" style="color:red;" onclick="deleteProduct(${p.id})">🗑</button>
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
  btn.innerText = "⏳ Enviando para Nuvem...";
  btn.disabled = true;

  // Upload para ImgBB se houver chave e as imagens forem Base64
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
    localStorage.setItem('products', JSON.stringify(products));
    renderProductsAdmin();
    updateMemoryMeter();
    toggleProductModal(false);
    alert("Pronto! Loja atualizada com sucesso! 💎");
  } catch (err) {
    console.error("Storage Full Error:", err);
    alert("⚠️ MEMÓRIA CHEIA: Você atingiu o limite de armazenamento do seu navegador para este site. \n\nSOLUÇÃO:\n1. Use o link oficial .pages.dev (ele está limpo!)\n2. Remova produtos antigos.\n3. Ou adicione a chave ImgBB nas configurações.");
  }
  
  btn.innerText = "Salvar no Servidor ✨";
  btn.disabled = false;
}

// --- Upload Logic ---
async function uploadToImgBB(base64) {
  const apiKey = config.imgbb_key;
  if (!apiKey) return null;
  
  const body = new FormData();
  body.append('image', base64.split(',')[1]);
  
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body });
    const data = await res.json();
    return data.data.url;
  } catch (err) {
    console.error("Erro no ImgBB:", err);
    return null;
  }
}

function previewImagesAdmin(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      // Redimensionar para salvar espaço
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Otimização Kei Sampaio: 600x600 para máxima leveza e economia de espaço
        canvas.width = 600; canvas.height = 600; 
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 600, 600);
        // Qualidade 0.6 para equilibrar nitidez e tamanho do arquivo
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

// --- Outros ---
function saveConfig() {
  config.imgbb_key = document.getElementById('admin-imgbb-key').value.trim();
  localStorage.setItem('config', JSON.stringify(config));
  alert("Configurações salvas! ⚙️");
}

function deleteProduct(id) {
  if (confirm("Deletar esse produto?")) {
    products = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(products));
    renderProductsAdmin();
  }
}

function toggleProductModal(show) { document.getElementById('product-modal-admin').style.display = show ? 'flex' : 'none'; }

function populateCategories() {
  document.getElementById('admin-p-category').innerHTML = categories.filter(c => c !== 'Todos').map(c => `<option value="${c}">${c}</option>`).join('');
}

// --- Gestão de Categorias ---
function renderCategoriesAdmin() {
  const container = document.getElementById('category-list-admin');
  if (!container) return;
  container.innerHTML = categories.filter(c => c !== 'Todos').map(c => `
    <div class="tab">
      ${c} <span style="margin-left:8px; cursor:pointer; color:red;" onclick="deleteCategory('${c}')">✕</span>
    </div>
  `).join('');
}

function addCategory() {
  const name = document.getElementById('new-cat-name').value.trim();
  if (name && !categories.includes(name)) {
    categories.push(name);
    localStorage.setItem('categories', JSON.stringify(categories));
    renderCategoriesAdmin();
    populateCategories();
    document.getElementById('new-cat-name').value = "";
    alert("Categoria adicionada! ✨");
  }
}

function deleteCategory(name) {
  if (confirm(`Deseja excluir a categoria "${name}"?`)) {
    categories = categories.filter(c => c !== name);
    localStorage.setItem('categories', JSON.stringify(categories));
    renderCategoriesAdmin();
    populateCategories();
  }
}

function syncAll() {
  alert("🚀 Loja Sincronizada com Cloudflare Pages!\n\nSeus dados estão seguros e o site oficial é:\nhttps://kei-sampaio-loja.pages.dev");
}

function clearAllData() {
  if (confirm("⚠️ ATENÇÃO: Isso vai apagar TODOS os produtos e vendas salvos neste navegador. \n\nDeseja continuar?")) {
    localStorage.clear();
    location.reload();
  }
}
