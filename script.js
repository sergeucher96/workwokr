const tg = window.Telegram.WebApp;
let catalogData = [];
let currentViewState = 'main';

tg.expand();
tg.setHeaderColor('secondary_bg_color');
tg.setBackgroundColor('bg_color');
tg.ready();

tg.BackButton.onClick(() => {
    if (currentViewState === 'details' || currentViewState === 'category') {
        renderCatalog(catalogData);
    }
});

async function initApp() {
    const loader = document.getElementById('loader');
    try {
        const [catRes, quoteRes] = await Promise.all([
            fetch('data.json').then(r => r.json()),
            fetch('quotes.json').then(r => r.json())
        ]);
        
        catalogData = catRes.categories;
        if (quoteRes.length) renderQuote(quoteRes);
        renderCatalog(catalogData);
        
    } catch (e) {
        document.getElementById('main-content').innerHTML = '<div style="text-align:center; padding:50px; opacity:0.5;">Ошибка загрузки данных</div>';
    } finally {
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

function renderQuote(quotes) {
    const textEl = document.getElementById('motivation-text');
    const authorEl = document.getElementById('motivation-author');
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    
    authorEl.innerText = `— ${q.author}`;
    let i = 0;
    
    function type() {
        if (i < q.text.length) {
            textEl.innerHTML = q.text.substring(0, i + 1) + '<span class="typing-cursor"></span>';
            i++;
            setTimeout(type, 35);
        } else {
            textEl.innerHTML = q.text;
            authorEl.style.opacity = '0.6';
        }
    }
    setTimeout(type, 500);
}

function renderCatalog(categories) {
    currentViewState = 'main';
    tg.BackButton.hide();
    document.getElementById('main-header').style.display = 'block';
    const main = document.getElementById('main-content');
    main.innerHTML = '';

    const bestItems = [];
    categories.forEach(cat => {
        cat.items.forEach(item => {
            if (item.is_best) bestItems.push({ ...item, catId: cat.id });
        });
    });

    if (bestItems.length > 0) {
        renderSection(main, "🔥 Лучшее", "Проверенные временем сервисы", bestItems, null);
    }

    categories.forEach(cat => {
        renderSection(main, cat.title, cat.subtitle, cat.items, cat.id);
    });
    
    main.scrollTo(0,0);
}

function renderSection(parent, title, subtitle, items, catId) {
    const section = document.createElement('section');
    section.className = 'content-section';
    const isBest = !catId;
    const cardsHtml = items.map(item => createCardHtml(item, catId || item.catId)).join('');
    
    section.innerHTML = `
        <div class="section-header">
            <div>
                <h2 class="${isBest ? 'best-title' : ''}">${title}</h2>
                <p class="section-subtitle">${subtitle}</p>
            </div>
            ${catId ? `<span class="see-all" onclick="showCategory('${catId}')">Все</span>` : ''}
        </div>
        <div class="horizontal-scroll">${cardsHtml}</div>
    `;
    parent.appendChild(section);
}

function createCardHtml(item, catId) {
    const itemData = encodeURIComponent(JSON.stringify(item));
    return `<div class="card" onclick="openDetails('${itemData}')">
        <img src="${item.icon}" class="card-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25694.png'">
        <div class="card-title">${item.title}</div>
        <div class="card-stats">
            <span class="card-rating">★ ${item.rating}</span>
            <div class="minpay-box">
                <span class="minpay-label">Вывод от</span>
                <span class="card-minpay">${item.min_withdrawal}</span>
            </div>
        </div>
        <div class="card-desc">${item.desc.substring(0, 45)}...</div>
        <div class="card-btn">Подробнее</div>
    </div>`;
}

function showCategory(catId) {
    const category = catalogData.find(c => c.id === catId);
    currentViewState = 'category';
    tg.BackButton.show();
    tg.HapticFeedback.impactOccurred('medium');
    
    document.getElementById('main-header').style.display = 'none';
    const main = document.getElementById('main-content');
    
    const cardsHtml = category.items.map(item => createCardHtml(item, catId)).join('');
    
    main.innerHTML = `
        <div class="item-page">
            <div class="category-info">
                <h1>${category.title}</h1>
                <p>${category.description || category.subtitle}</p>
            </div>
            <div class="grid-layout">
                ${cardsHtml}
            </div>
        </div>
    `;
    main.scrollTo(0,0);
}

function openDetails(encodedItem) {
    const item = JSON.parse(decodeURIComponent(encodedItem));
    currentViewState = 'details';
    tg.BackButton.show();
    tg.HapticFeedback.selectionChanged();
    
    document.getElementById('main-header').style.display = 'none';
    const main = document.getElementById('main-content');
    
    main.innerHTML = `
        <div class="item-page">
            <div class="details-card">
                <img src="${item.icon}" class="details-logo" onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25694.png'">
                <h1 style="margin:0 0 20px 0; color:var(--text-color);">${item.title}</h1>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <small>Рейтинг</small>
                        <span>★ ${item.rating}</span>
                    </div>
                    <div class="stat-box">
                        <small>Мин. вывод</small>
                        <span>${item.min_withdrawal}</span>
                    </div>
                </div>

                <div class="description-box">
                    <b>О сервисе</b>
                    <p>${item.desc}</p>
                </div>

                <div class="details-actions">
                    <div class="action-btn" onclick="tg.openLink('${item.url}')">Начать работу</div>
                    <div class="secondary-btn" onclick="tg.openLink('${item.instruction_url || '#'}')">Инструкция</div>
                </div>
            </div>
        </div>
    `;
    main.scrollTo(0,0);
}

initApp();
