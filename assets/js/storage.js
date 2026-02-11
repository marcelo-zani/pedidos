// Storage & History Logic

const STORAGE_KEY = 'nek_orders_history';

function getHistory() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveOrder(cart, products) {
    const history = getHistory();

    const orderItems = [];
    let total = 0;

    Object.entries(cart).forEach(([id, qty]) => {
        const p = products.find(x => x.id === id);
        if (p) {
            orderItems.push({
                id: p.id,
                name: p.name,
                price: p.price,
                qty: qty,
                total: p.price * qty
            });
            total += p.price * qty;
        }
    });

    const newOrder = {
        id: Date.now(), // simple ID
        date: new Date().toISOString(),
        items: orderItems,
        total: total,
        user: localStorage.getItem('nek_user') || 'unknown'
    };

    history.unshift(newOrder); // Add to top
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return newOrder;
}

// History UI
document.addEventListener('DOMContentLoaded', () => {
    const btnHistory = document.getElementById('btn-history');
    if (btnHistory) {
        btnHistory.addEventListener('click', showHistoryModal);
    }
});

function showHistoryModal() {
    // Create Modal on the fly
    let modal = document.getElementById('history-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'history-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Histórico de Pedidos</h2>
                    <button onclick="closeModal()">×</button>
                </div>
                <div class="modal-body" id="history-list">
                    <!-- Orders here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    renderHistoryList();
    modal.classList.add('visible');
}

window.closeModal = () => {
    document.getElementById('history-modal').classList.remove('visible');
};

function renderHistoryList() {
    const list = document.getElementById('history-list');
    const history = getHistory();

    if (history.length === 0) {
        list.innerHTML = '<p class="empty-msg">Nenhum pedido salvo.</p>';
        return;
    }

    list.innerHTML = history.map(order => `
        <div class="order-item">
            <div class="order-header">
                <strong>Pedido #${order.id}</strong>
                <span>${new Date(order.date).toLocaleDateString()}</span>
            </div>
            <div class="order-summary">
                <span>${order.items.length} itens</span>
                <strong>R$ ${order.total.toFixed(2)}</strong>
            </div>
            <div class="order-details">
                ${order.items.map(i => `<div class="mini-item">${i.qty}x ${i.name}</div>`).join('')}
            </div>
        </div>
    `).join('');
}
