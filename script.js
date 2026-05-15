const tg = window.Telegram.WebApp;
let catalogData = [];
let currentViewState = 'main'; 

// 1. Настройка полноэкранного режима и блокировка свайпа вниз
tg.expand();
if (tg.isVersionAtLeast('7.7')) {
    tg.disableVerticalSwipes();
}

// 2. Цвета интерфейса
tg.setHeaderColor('secondary_bg_color');
tg.setBackgroundColor('bg_color');

tg.ready();

// Умная кнопка "Назад"
tg.BackButton.onClick(() => {
    if (currentViewState === 'details' || currentViewState === 'category') {
        showMainCatalog();
    }
});

async function initApp() {
    const loader = document.getElementById('loader');
    try {
        const [catalogRes, quotesRes] = await Promise.all([
            fetch('data.json').then(res => res.json()),
            fetch('quotes.json').then(res => res.json())
        ]);

        catalogData = catalogRes.categories || [];
        if (quotesRes.length) renderQuote(quotesRes);
        renderCatalog(catalogData);

    } catch (err) {
        console.error("Ошибка:", err);
        document.getElementById('main-content').innerHTML = '<p style="padding:20px; text-align:center; opacity:0.5;">Ошибка данных</p>';
    } finally {
        setTimeout(() => { if (loader) loader.style.display = 'none'; }, 600);
    }
}

function renderQuote(quotes) {
    const textEl = document.getElementById('motivation-text');
    const authorEl = document.getElementById('motivation-author');
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    
    authorEl.innerText = `— ${q.author}`;
    authorEl.style.opacity = '0';
    let i = 0;
    textEl.innerHTML = '';
    
    function type() {
        if (i < q.text.length) {
            textEl.innerHTML = q.text.substring(0, i + 1) + '<span class="typing-cursor"></span>';
            i++;
            setTimeout(type, Math.random() * 40 + 20);
        } else {
            textEl.innerHTML = q.text;
            authorEl.style.opacity = '0.6';
        }
    }
    setTimeout(type, 600);
}

function renderCatalog(categories) {
    currentViewState = 'main';
    tg.BackButton.hide();
    document.getElementById('main-header').style.display = 'block';
    const content = document.getElementById('main-content');
    content.innerHTML = ''; 

    categories.forEach(cat => {
        const section = document.createElement('section');
        const cardsHtml = cat.items.map(item => createCardHtml(item, cat.id)).join('');
        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>${cat.title}</h2>
                    <p style="font-size:12px; color:var(--hint-color); margin:2px 0;">${cat.subtitle}</p>
                </div>
                <span class="see-all" onclick="showCategory('${cat.id}')">Все</span>
            </div>
            <div class="horizontal-scroll">${cardsHtml}</div>
        `;
        content.appendChild(section);
    });
}

function createCardHtml(item, catId) {
    const itemData = JSON.stringify(item).replace(/'/g, "&apos;");
    return `
        <div class="card" onclick='showItemDetails(${itemData}, "${catId}")'>
            <img src="${item.icon}" class="card-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25694.png'">
            <div class="card-title">${item.title}</div>
            <div class="card-stats">
                <span class="card-rating">★ ${item.rating}</span>
                <span class="card-paytime">🕒 ${item.payment_time}</span>
            </div>
            <div class="card-desc">${item.desc}</div>
            <div class="card-btn">Инфо</div>
        </div>
    `;
}

function showCategory(catId) {
    const category = catalogData.find(c => c.id === catId);
    currentViewState = 'category';
    tg.HapticFeedback.impactOccurred('medium');
    tg.BackButton.show();
    document.getElementById('main-header').style.display = 'none';
    const content = document.getElementById('main-content');
    const cardsHtml = category.items.map(item => createCardHtml(item, catId)).join('');
    content.innerHTML = `
        <div class="item-details-page">
            <h1 style="margin:0 0 20px 0; font-size: 24px;">${category.title}</h1>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">${cardsHtml}</div>
        </div>
    `;
    window.scrollTo(0, 0);
}

function showItemDetails(item, catId) {
    currentViewState = 'details';
    tg.HapticFeedback.selectionChanged();
    tg.BackButton.show();
    document.getElementById('main-header').style.display = 'none';
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="item-details-page">
            <div class="details-card">
                <img src="${item.icon}" class="details-logo" onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25694.png'">
                <h1 style="margin-bottom:15px; font-size: 24px;">${item.title}</h1>
                <div class="details-stats-row">
                    <div class="stat-item"><span class="stat-label">Рейтинг</span><span class="stat-value">★ ${item.rating}</span></div>
                    <div class="stat-item"><span class="stat-label">Выплаты</span><span class="stat-value">${item.payment_time}</span></div>
                </div>
                <div class="details-full-desc"><b>Описание:</b><br>${item.desc}</div>
                <div class="details-action-btn" onclick="openServiceUrl('${item.url}')">Начать работу</div>
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

function openServiceUrl(url) {
    tg.HapticFeedback.impactOccurred('heavy');
    if (url && url !== "#") tg.openLink(url);
    else tg.showAlert("Ссылка скоро появится!");
}

function showMainCatalog() {
    renderCatalog(catalogData);
    window.scrollTo(0, 0);
}

initApp();
