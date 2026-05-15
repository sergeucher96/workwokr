const tg = window.Telegram.WebApp;
let catalogData = [];
let currentViewState = 'main'; 

tg.expand();
tg.ready();

tg.BackButton.onClick(() => {
    if (currentViewState === 'details' || currentViewState === 'category') {
        showMainCatalog();
    }
});

async function initApp() {
    const loader = document.getElementById('loader');
    
    try {
        // Загружаем данные
        const [catalogRes, quotesRes] = await Promise.all([
            fetch('data.json').then(res => {
                if (!res.ok) throw new Error('data.json not found');
                return res.json();
            }),
            fetch('quotes.json').then(res => {
                if (!res.ok) throw new Error('quotes.json not found');
                return res.json();
            })
        ]);

        catalogData = catalogRes.categories || [];
        
        // Сначала рендерим всё
        if (quotesRes && quotesRes.length > 0) {
            renderQuote(quotesRes);
        }
        
        if (catalogData.length > 0) {
            renderCatalog(catalogData);
        } else {
            document.getElementById('main-content').innerHTML = '<p style="padding:20px; opacity:0.5;">Каталог пуст...</p>';
        }

    } catch (err) {
        console.error("Критическая ошибка:", err);
        // Если данные не загрузились, показываем хоть что-то
        document.getElementById('main-content').innerHTML = '<p style="padding:20px; opacity:0.5;">Ошибка загрузки данных. Проверьте файлы JSON.</p>';
    } finally {
        // Скрываем лоадер в любом случае (успех или ошибка)
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
        }, 800);
    }
}

function renderQuote(quotes) {
    const textEl = document.getElementById('motivation-text');
    const authorEl = document.getElementById('motivation-author');
    if (!textEl || !quotes.length) return;

    const q = quotes[Math.floor(Math.random() * quotes.length)];
    if (authorEl) {
        authorEl.innerText = `— ${q.author || 'Автор'}`;
        authorEl.style.opacity = '0';
    }
    
    let i = 0;
    const fullText = q.text || '';
    textEl.innerHTML = '';
    
    function type() {
        if (i < fullText.length) {
            textEl.innerHTML = fullText.substring(0, i + 1) + '<span class="typing-cursor"></span>';
            i++;
            setTimeout(type, Math.random() * 40 + 20);
        } else {
            textEl.innerHTML = fullText;
            if (authorEl) authorEl.style.opacity = '0.6';
        }
    }
    type();
}

function renderCatalog(categories) {
    currentViewState = 'main';
    tg.BackButton.hide();
    const header = document.getElementById('main-header');
    if (header) header.style.display = 'block';

    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = ''; 

    categories.forEach(cat => {
        const section = document.createElement('section');
        const items = cat.items || [];
        const cardsHtml = items.map(item => createCardHtml(item, cat.id)).join('');
        
        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>${cat.title}</h2>
                    <p class="section-subtitle">${cat.subtitle}</p>
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
            ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
            <img src="${item.icon}" class="card-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25694.png'">
            <div class="card-title">${item.title}</div>
            <div class="card-stats">
                <span class="card-rating">★ ${item.rating || '5.0'}</span>
                <span class="card-paytime">🕒 ${item.payment_time || 'н/д'}</span>
            </div>
            <div class="card-desc">${item.desc}</div>
            <div class="card-btn">Подробнее</div>
        </div>
    `;
}

function showCategory(catId) {
    const category = catalogData.find(c => c.id === catId);
    if (!category) return;
    currentViewState = 'category';
    
    tg.HapticFeedback.impactOccurred('medium');
    tg.BackButton.show();
    document.getElementById('main-header').style.display = 'none';

    const content = document.getElementById('main-content');
    const cardsHtml = category.items.map(item => createCardHtml(item, catId)).join('');
    
    content.innerHTML = `
        <div class="item-details-page">
            <header style="padding-bottom: 25px;">
                <h1 style="margin:0; font-size: 28px; font-weight: 800;">${category.title}</h1>
                <p style="color:var(--hint-color); margin:5px 0 0 0;">${category.subtitle}</p>
            </header>
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
                <h1 class="details-title">${item.title}</h1>
                
                <div class="details-stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Рейтинг</span>
                        <span class="stat-value" style="color:#ff9500;">★ ${item.rating}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Выплаты</span>
                        <span class="stat-value" style="color:#34c759;">${item.payment_time}</span>
                    </div>
                </div>
                
                <div class="details-full-desc">
                    <b>Описание:</b><br>
                    ${item.desc}<br><br>
                    <b>Детали:</b><br>
                    • Категория: ${catId}<br>
                    • Сложность: ${item.badge || 'Обычная'}
                </div>

                <div class="details-action-btn" onclick="openServiceUrl('${item.url}')">
                    Начать работу
                </div>
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

function openServiceUrl(url) {
    tg.HapticFeedback.impactOccurred('heavy');
    if (url && url !== "#") tg.openLink(url);
    else tg.showAlert("Ссылка будет добавлена скоро!");
}

function showMainCatalog() {
    renderCatalog(catalogData);
    window.scrollTo(0, 0);
}

// Запуск приложения
initApp();