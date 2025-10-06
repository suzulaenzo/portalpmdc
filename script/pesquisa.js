function filterOptions() {
    const searchInput = document.getElementById('searchInput');
    const filter = searchInput.value.toLowerCase();
    const grid = document.getElementById('optionsGrid');
    const cards = grid.getElementsByClassName('option-card');

    for (let card of cards) {
        const searchText = card.getAttribute('data-search').toLowerCase();
        const cardText = card.textContent.toLowerCase();
        const searchMatch = searchText.includes(filter) || cardText.includes(filter);
        
        if (searchMatch) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    }
}

// Adiciona um console.log para debug
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de pesquisa carregado');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        console.log('Input de pesquisa encontrado');
    } else {
        console.log('Input de pesquisa NÃO encontrado');
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
