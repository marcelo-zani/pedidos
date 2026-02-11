// App Logic
const STATE = {
    products: [],
    cart: {}, // { productId: quantity }
    search: ''
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

    // Event Listeners
    document.getElementById('search-input').addEventListener('input', (e) => {
        STATE.search = e.target.value.toLowerCase();
        renderProducts();
    });

    document.getElementById('btn-checkout').addEventListener('click', () => {
        if (Object.keys(STATE.cart).length === 0) return alert('Seu carrinho está vazio!');

        if (confirm('Deseja finalizar e salvar este pedido?')) {
            const order = saveOrder(STATE.cart, STATE.products);
            alert(`Pedido #${order.id} salvo com sucesso!`);
            STATE.cart = {};
            updateCartUI();
            renderProducts();
        }
    });
}

async function fetchProducts() {
    try {
        // In real app, fetch from API or Google Sheet
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

    renderProducts(); // Re-render to update UI state
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
