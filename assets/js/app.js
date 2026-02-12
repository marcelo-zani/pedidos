// App Logic
const STATE = {
    products: [],
    cart: {}, // { productId: quantity }
    search: '',
    customer: {} // Transient customer data
};

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are logged in before loading data
    if (localStorage.getItem('nek_user')) {
        initApp();
    }
});

// Exposed globally for auth.js to call after login
window.loadApp = initApp;

async function initApp() {
    console.log('Initializing App...');
    await fetchProducts();
    renderProducts();
    updateCartUI();
    setupEventListeners();
}

function setupEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        STATE.search = e.target.value.toLowerCase();
        renderProducts();
    });

    // Checkout Modal Triggers
    document.getElementById('btn-checkout').addEventListener('click', () => {
        if (Object.keys(STATE.cart).length === 0) return alert('Seu carrinho está vazio!');
        openCheckoutModal();
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => document.getElementById('checkout-modal').classList.add('hidden'));
    });

    // CNPJ Search
    document.getElementById('btn-search-cnpj').addEventListener('click', handleCNPJSearch);

    // Confirm Order
    document.getElementById('btn-confirm-order').addEventListener('click', finalizeOrder);

    // Admin: Add User
    const btnAddUser = document.getElementById('btn-add-user');
    if (btnAddUser) {
        btnAddUser.addEventListener('click', () => {
            const u = document.getElementById('new-user').value;
            const p = document.getElementById('new-pass').value;
            const r = document.getElementById('new-role').value;

            if (!u || !p) return alert('Preencha usuário e senha');

            const res = window.registerUser(u, p, r);
            alert(res.message);
            if (res.success) {
                document.getElementById('new-user').value = '';
                document.getElementById('new-pass').value = '';
            }
        });
    }
}

async function fetchProducts() {
    try {
        const res = await fetch('assets/data/products.json');
        STATE.products = await res.json();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('product-list').innerHTML = '<p class="error-msg">Erro ao carregar produtos.</p>';
    }
}

function renderProducts() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    const filtered = STATE.products.filter(p =>
        p.name.toLowerCase().includes(STATE.search) ||
        p.id.includes(STATE.search)
    );

    if (filtered.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Nenhum produto encontrado.</p>';
        return;
    }

    filtered.forEach(p => {
        const qty = STATE.cart[p.id] || 0;
        const card = document.createElement('div');
        card.className = `product-card ${qty > 0 ? 'active' : ''}`;
        card.innerHTML = `
            <div class="p-img" style="background-image: url('${p.image}')"></div>
            <div class="p-info">
                <small>#${p.id}</small>
                <h3>${p.name}</h3>
                <p class="p-price">R$ ${p.price.toFixed(2)}</p>
                <div class="p-controls">
                    <button onclick="updateQty('${p.id}', -1)">-</button>
                    <span>${qty}</span>
                    <button onclick="updateQty('${p.id}', 1)">+</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

window.updateQty = (id, change) => {
    if (!STATE.cart[id]) STATE.cart[id] = 0;
    STATE.cart[id] += change;

    if (STATE.cart[id] <= 0) delete STATE.cart[id];

    renderProducts();
    updateCartUI();
};

function updateCartUI() {
    const count = Object.values(STATE.cart).reduce((a, b) => a + b, 0);
    let total = 0;

    Object.entries(STATE.cart).forEach(([id, qty]) => {
        const p = STATE.products.find(x => x.id === id);
        if (p) total += p.price * qty;
    });

    document.querySelector('.cart-count').innerText = `${count} itens`;
    document.querySelector('.cart-total').innerText = `Total: R$ ${total.toFixed(2)}`;

    const bar = document.querySelector('.cart-bar');
    if (count > 0) bar.style.transform = 'translateY(0)';
    else bar.style.transform = 'translateY(100%)';
}

function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');

    // Render Summary
    const list = document.getElementById('modal-cart-items');
    list.innerHTML = '';
    let total = 0;

    Object.entries(STATE.cart).forEach(([id, qty]) => {
        const p = STATE.products.find(x => x.id === id);
        if (p) {
            const sub = p.price * qty;
            total += sub;
            list.innerHTML += `
                <div class="summary-item">
                    <span>${qty}x ${p.name}</span>
                    <span>R$ ${sub.toFixed(2)}</span>
                </div>
            `;
        }
    });

    document.getElementById('modal-total-price').innerText = `R$ ${total.toFixed(2)}`;
}

async function handleCNPJSearch() {
    const cnpj = document.getElementById('checkout-cnpj').value.replace(/\D/g, '');
    if (cnpj.length !== 14) return alert('CNPJ inválido (deve ter 14 dígitos)');

    const btn = document.getElementById('btn-search-cnpj');
    btn.innerText = '⏳';

    try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!res.ok) throw new Error('CNPJ não encontrado');

        const data = await res.json();

        document.getElementById('checkout-razao').value = data.razao_social || '';
        document.getElementById('checkout-fantasia').value = data.nome_fantasia || '';
        document.getElementById('checkout-endereco').value = `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}`;
        document.getElementById('checkout-tel').value = data.ddd_telefone_1 || '';
        document.getElementById('checkout-email').value = data.email || '';

    } catch (error) {
        alert('Erro ao buscar CNPJ: ' + error.message);
    } finally {
        btn.innerText = '🔍';
    }
}

function finalizeOrder() {
    // Gather Customer Data
    const customer = {
        cnpj: document.getElementById('checkout-cnpj').value,
        razao: document.getElementById('checkout-razao').value,
        fantasia: document.getElementById('checkout-fantasia').value,
        endereco: document.getElementById('checkout-endereco').value,
        tel: document.getElementById('checkout-tel').value,
        email: document.getElementById('checkout-email').value
    };

    if (!customer.razao) return alert('Por favor, identifique o cliente (Razão Social obrigatória).');

    // Save/Print Logic
    const orderData = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        rep: localStorage.getItem('nek_user'),
        customer: customer,
        items: STATE.cart,
        products: STATE.products.filter(p => STATE.cart[p.id])
    };

    console.log('ORDER FINALIZED:', orderData);

    // Simulate Print/Save
    alert(`Pedido #${orderData.id} finalizado com sucesso para ${customer.razao}!\n\n(Dados prontos para impressão/envio)`);

    // Clear
    STATE.cart = {};
    updateCartUI();
    renderProducts();
    document.getElementById('checkout-modal').classList.add('hidden');

    // Reset Form
    document.querySelectorAll('#checkout-modal input').forEach(i => i.value = '');
}
