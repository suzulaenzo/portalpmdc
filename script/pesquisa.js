const files = [
    '/alvaraprocedimento.html',
    '/anistia2025.html',
    '/sitealvara.html',
    '/siteatendimento.html',
    '/siteautonomo.html',
    '/sitecertidoes.html',
    '/siteformularios.html',
    '/siteiptu.html',
    '/siteiss.html',
    '/siteitbi.html',
    '/sitelegislacao.html',
    '/sitemanuais.html',
    '/sitenfse.html',
    '/siteplantaofiscal.html',
    '/sitetransitorio.html'
];

// Mapa de imagens do index.html
let pageImagesMap = {};
let allEntries = []; // índice geral para busca

async function loadPageImages() {
    try {
        const response = await fetch('index.html');
        const text = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const cards = tempDiv.querySelectorAll('.option-card');
        cards.forEach(card => {
            const pageName = card.getAttribute('data-page-title') || card.textContent.trim();
            const img = card.querySelector('img');
            if (img) {
                pageImagesMap[pageName] = img.src;
            }
        });
    } catch (error) {
        console.error('Erro ao carregar index.html', error);
    }
}

async function buildIndex() {
    allEntries = [];

    const selectors = [
        '.iss-text-container',
        '.text-content-after-cards',
        '.grid-container',
        '.accordion',
        '.main-section'
    ];

    for (const file of files) {
        try {
            const response = await fetch(file);
            const text = await response.text();

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;

            const pageTitleElement = tempDiv.querySelector('title');
            const pageTitle = pageTitleElement ? pageTitleElement.textContent.trim() : file;

            // Procura imagem mais próxima do título
            let pageImgSrc = '';
            for (const key in pageImagesMap) {
                if (pageTitle.includes(key)) {
                    pageImgSrc = pageImagesMap[key];
                    break;
                }
            }

            // Indexa os cards
            const cards = tempDiv.querySelectorAll('.option-card');
            cards.forEach(card => {
                const cardText = card.textContent.trim();
                allEntries.push({
                    page: file,
                    title: pageTitle,
                    text: cardText,
                    pageImg: pageImgSrc,
                    cardImg: card.querySelector('img')?.src || ''
                });
            });

            // Indexa cada document-entry (fake-link + descrição)
            const accordions = tempDiv.querySelectorAll('.accordion-content');
            accordions.forEach((accordion, accIndex) => {
                const accordionId = accordion.id || `accordion-${file}-${accIndex}`;
                if (!accordion.id) accordion.id = accordionId;

                const entries = accordion.querySelectorAll('.document-entry');
                entries.forEach((entry, entryIndex) => {
                    const fakeLinkEl = entry.querySelector('a.fake-link');
                    const docDescEl = entry.querySelector('.document-description');

                    if (fakeLinkEl || docDescEl) {
                        allEntries.push({
                            page: file,
                            title: pageTitle,
                            fakeLinkText: fakeLinkEl ? fakeLinkEl.textContent.trim() : '',
                            docDescText: docDescEl ? docDescEl.textContent.trim() : '',
                            pageImg: pageImagesMap[pageTitle] || '',
                            cardImg: '',
                            accordionId: accordionId
                        });
                    }
                });
            });

            // Remove scripts e styles
            tempDiv.querySelectorAll('script, style, noscript').forEach(el => el.remove());

            // Indexa texto das seções principais
            let pageText = '';
            selectors.forEach(sel => {
                tempDiv.querySelectorAll(sel).forEach(el => {
                    pageText += ' ' + el.textContent.trim();
                });
            });
            pageText = pageText.replace(/\s+/g, ' ');

            if (pageText) {
                allEntries.push({
                    page: file,
                    title: pageTitle,
                    text: pageText,
                    pageImg: pageImgSrc,
                    cardImg: ''
                });
            }

        } catch (error) {
            console.error('Erro ao carregar', file, error);
        }
    }

    // 🔍 Entrada especial para PLANTÃO FISCAL (indexa cada <h4> das .section-item)
    try {
        const response = await fetch('/siteplantaofiscal.html');
        const text = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        // Captura todos os h4 dentro das .section-item
        const sectionItems = tempDiv.querySelectorAll('.section-item h4');
        sectionItems.forEach((h4, index) => {
            const sectionTitle = h4.textContent.trim();

            // Pega o texto completo da mesma seção
            const sectionDiv = h4.closest('.section-item');
            const sectionText = sectionDiv ? sectionDiv.textContent.trim() : '';

            // Adiciona como uma entrada separada no índice
            allEntries.push({
                page: 'siteplantaofiscal.html',
                title: 'PMDC - Plantão Fiscal',
                text: ' ' + sectionText,
                keywords: ['telefone', 'contato', 'fale conosco', 'número', 'numero'],
                pageImg: pageImagesMap['Plantão Fiscal'] || '',
                cardImg: '',
                sectionId: `section-${index}`
            });
        });

    } catch (error) {
        console.error('Erro ao indexar siteplantaofiscal.html', error);
    }
}



async function searchInHTMLs(filter) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (!filter) {
        resultsContainer.style.display = 'none';
        return;
    }

    const fuse = new Fuse(allEntries, {
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'text', weight: 0.3 },
            { name: 'fakeLinkText', weight: 0.6 },
            { name: 'docDescText', weight: 0.6 },
            { name: 'keywords', weight: 0.8 }
        ],
        threshold: 0.4,
        includeScore: true
    });

    const results = fuse.search(filter);

    if (results.length === 0) {
        const noResult = document.createElement('div');
        noResult.classList.add('no-results');
        noResult.textContent = 'Nenhum resultado encontrado';
        resultsContainer.appendChild(noResult);
    } else {
        results.slice(0, 20).forEach(res => {
            const item = res.item;
            const div = document.createElement('div');
            div.classList.add('result-item');

            let displayText = '';
            if (item.text) displayText += item.text.substring(0, 200) + '... ';
            if (item.fakeLinkText) displayText += `${item.fakeLinkText}. `;
            if (item.docDescText) displayText += ` ${item.docDescText}. `;

            div.innerHTML = `
                ${item.pageImg ? `<img src="${item.pageImg}" style="margin-right:10px; filter: brightness(0) invert(0);">` : ''}
                <strong style="margin-right:10px;">${item.title}</strong>
                ${item.cardImg ? `<img src="${item.cardImg}" style="margin-left:10px; margin-right:20px; filter: brightness(0) invert(0);">` : ''}
                <div>${displayText}</div>
            `;

            div.addEventListener('click', () => {
                if (item.accordionId) {
                    window.location.href = item.page + '#' + item.accordionId;
                } else {
                    window.location.href = item.page;
                }
            });

            resultsContainer.appendChild(div);
        });
    }

    resultsContainer.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadPageImages();
    await buildIndex();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const filter = searchInput.value.toLowerCase();
            searchInHTMLs(filter);
        });
    }
});














// Lógica do Pop-up e Carrossel
document.addEventListener('DOMContentLoaded', function() {
const popupOverlay = document.getElementById('popup-overlay');
const popupCloseBtn = document.getElementById('popup-close-btn');
const carouselItems = document.querySelectorAll('.carousel-item');
let slideIndex = 0;
let autoSlideInterval;

function showSlides() {
    carouselItems.forEach((item, index) => {
        item.classList.remove('active');
    });
    
    const activeItem = carouselItems[slideIndex];
    activeItem.classList.add('active');

    const img = activeItem.querySelector('img');
    if (img.complete) {
        adjustPopupSize(img);
    } else {
        img.onload = () => adjustPopupSize(img);
    }
}

function plusSlides(n) {
    slideIndex = (slideIndex + n + carouselItems.length) % carouselItems.length;
    showSlides();
    resetAutoSlide();
}

function autoAdvanceSlides() {
    slideIndex = (slideIndex + 1) % carouselItems.length;
    showSlides();
}

function startAutoSlide() {
    autoSlideInterval = setInterval(autoAdvanceSlides, 6000); // Avança a cada 6 segundos
}

function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
}

// Função para ajustar o tamanho do pop-up dinamicamente
function adjustPopupSize(imgElement) {
    const popupContainer = document.getElementById('popup-container');
    const carouselWrapper = document.getElementById('carousel-wrapper');

    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;

    const viewportMaxWidth = window.innerWidth * 0.8; // Baseado no max-width: 80vw do CSS
    const viewportMaxHeight = window.innerHeight * 0.9; // Baseado no max-height: 90vh do CSS

    const cssPadding = 10; // 10px de padding em cada lado (top, bottom, left, right) do CSS
    const availableWidth = viewportMaxWidth - (cssPadding * 2);
    const availableHeight = viewportMaxHeight - (cssPadding * 2);

    let newImgWidth = naturalWidth;
    let newImgHeight = naturalHeight;

    // Ajustar as dimensões da imagem para caber no espaço disponível, mantendo a proporção
    if (newImgWidth > availableWidth) {
        newImgHeight = (availableWidth / newImgWidth) * newImgHeight;
        newImgWidth = availableWidth;
    }

    if (newImgHeight > availableHeight) {
        newImgWidth = (availableHeight / newImgHeight) * newImgWidth;
        newImgHeight = availableHeight;
    }

    // Aplicar as novas dimensões ao carousel wrapper (que conterá a imagem)
    carouselWrapper.style.width = `${newImgWidth}px`;
    carouselWrapper.style.height = `${newImgHeight}px`;

    // O popupContainer deve ter o tamanho do carouselWrapper + padding
    popupContainer.style.width = `${newImgWidth + (cssPadding * 2)}px`;
    popupContainer.style.height = `${newImgHeight + (cssPadding * 2)}px`;
}

// Função para abrir o pop-up
function openPopup() {
    popupOverlay.style.display = 'flex'; // Mostra o pop-up
    slideIndex = 0; // Começa sempre no primeiro slide
    showSlides(); // Exibe o primeiro slide e ajusta o tamanho
    startAutoSlide();
}

// Função para fechar o pop-up
function closePopup() {
    popupOverlay.style.display = 'none'; // Esconde o pop-up
    clearInterval(autoSlideInterval); // Para o avanço automático
}

// Event Listeners
if (popupCloseBtn) {
    popupCloseBtn.addEventListener('click', closePopup);
}

// Adiciona as funções ao escopo global para serem acessíveis pelos botões do carrossel
window.plusSlides = plusSlides;

// Adiciona listener para redimensionamento da janela
window.addEventListener('resize', () => {
    if (popupOverlay.style.display === 'flex') { // Se o pop-up estiver aberto
        const activeImg = document.querySelector('#carousel-wrapper .carousel-item.active img');
        if (activeImg) {
            adjustPopupSize(activeImg);
        }
    }
});

openPopup();
});