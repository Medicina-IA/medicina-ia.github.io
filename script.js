// Fecha o menu ao clicar em qualquer link
menuLinks.forEach(link => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = link.dataset.target;
        showContentSection(targetId);
        closeMenu(); // Fecha o menu em dispositivos móveis
    });
});

// Evita scroll no body quando o menu está aberto
function toggleMenu() {
    hamburgerButton.classList.toggle("open");
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("visible");
    
    // Previne scroll no body
    if (sideMenu.classList.contains("open")) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }
}

// Evita scroll no body quando o menu está aberto
function toggleMenu() {
    hamburgerButton.classList.toggle("open");
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("visible");
    // Previne scroll no body
    if (sideMenu.classList.contains("open")) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }
}

// Corrige scroll em dispositivos móveis
function showContentSection(targetId) {
    contentSections.forEach(section => {
        section.classList.remove("active-section");
    });
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add("active-section");
        // Garante que o scroll volta ao topo
        window.scrollTo(0, 0);
    }
    menuLinks.forEach(link => {
        link.classList.remove("active");
        if (link.dataset.target === targetId) {
            link.classList.add("active");
        }
    });
    closeMenu(); // Fecha menu em mobile
}

// Adiciona melhor suporte para touch em dispositivos móveis
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// Melhora o feedback visual para botões em touch
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('touchstart', () => {
        button.classList.add('button-active');
    });
    button.addEventListener('touchend', () => {
        button.classList.remove('button-active');
    });
});

// Otimiza a busca para mobile
const handleSearch = () => {
    if (searchInput.value.trim() !== '') {
        performSearch(searchInput.value);
    } else {
        performSearch(DEFAULT_SEARCH_TERM);
    }
};

// Ajusta o modal para mobile
function showModal() {
    compilationModal.style.display = "block";
    document.body.style.overflow = "hidden"; // Previne scroll no background
}

function closeCompilationModal() {
    compilationModal.style.display = "none";
    document.body.style.overflow = ""; // Restaura scroll
}

// Otimiza o download de PDF para mobile
function downloadReportAsPDF() {
    const element = compilationContentWrapper;
    if (!element || !compilationContent.innerHTML || compilationContent.querySelector('.loading-indicator') || compilationContent.querySelector('.error-message')) {
        alert("Gere um relatório válido antes de tentar fazer o download.");
        return;
    }
    const searchTerm = searchInput.value.trim() || DEFAULT_SEARCH_TERM;
    const filename = `relatorio_med_ia_${searchTerm.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    const opt = {
        margin: [0.5, 0.5], // Melhores margens para mobile
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    downloadPdfButton.disabled = true;
    downloadPdfButton.textContent = "Gerando PDF...";
    html2pdf().set(opt).from(element).save().then(() => {
        downloadPdfButton.disabled = false;
        downloadPdfButton.textContent = "Download PDF";
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
        downloadPdfButton.disabled = false;
        downloadPdfButton.textContent = "Download PDF";
    });
}

// Adiciona suporte a gesture
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && !sideMenu.classList.contains('open')) {
            // Swipe right - open menu
            toggleMenu();
        } else if (diff < 0 && sideMenu.classList.contains('open')) {
            // Swipe left - close menu
            toggleMenu();
        }
    }
}

// Ajusta o viewport para teclado virtual em mobile
if ('visualViewport' in window) {
    window.visualViewport.addEventListener('resize', () => {
        document.documentElement.style.height = `${window.visualViewport.height}px`;
    });
}