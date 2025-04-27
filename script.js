const abstractsMap = {};
        const pubmedArticles = xmlDoc.getElementsByTagName("PubmedArticle");
        
        for (let item of pubmedArticles) {
            const pmidElement = item.querySelector("MedlineCitation > PMID");
            const abstractElements = item.querySelectorAll("Article > Abstract > AbstractText");
            
            if (pmidElement) {
                let abstractText = "Resumo não disponível.";
                if (abstractElements.length > 0) {
                    abstractText = Array.from(abstractElements)
                        .map(el => el.textContent)
                        .join(" ");
                }
                abstractsMap[pmidElement.textContent] = abstractText;
            }
        }
        
        let contentHTML = `<h2>Top 5 Artigos com Resumos</h2>`;
        contentHTML += `<p><strong>Busca realizada em:</strong> ${new Date().toLocaleString('pt-BR')}</p>`;
        
        top5Results.forEach(article => {
            contentHTML += `
                <div class="compilation-item">
                    <h3>${article.title}</h3>
                    <p><strong>Autores:</strong> ${article.authors}</p>
                    <p><strong>Revista:</strong> ${article.journal} (${article.pubDate})</p>
                    <p><strong>Resumo:</strong><br/>${abstractsMap[article.id] || 'Resumo não disponível.'}</p>
                    <p><a href="${article.url}" target="_blank" rel="noopener noreferrer">Ver no PubMed</a></p>
                </div>
            `;
        });
        
        compilationContent.innerHTML = contentHTML;
    } catch (error) {
        console.error("Erro ao gerar compilado:", error);
        compilationContent.innerHTML = '<p class="info-message">Erro ao buscar resumos. Tente novamente.</p>';
    }
}

function closeCompilationModal() {
    compilationModal.style.display = "none";
    document.body.style.overflow = "";
}

function downloadReportAsPDF() {
    const element = compilationContent;
    if (!element || !element.innerHTML) {
        alert("Gere um relatório válido antes de tentar fazer o download.");
        return;
    }
    
    const opt = {
        margin: [0.5, 0.5],
        filename: `relatorio_med_ia_${new Date().toISOString().slice(0,10)}.pdf`,
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
        alert("Erro ao gerar o PDF. Tente novamente.");
        downloadPdfButton.disabled = false;
        downloadPdfButton.textContent = "Download PDF";
    });
}

function copyReportToClipboard() {
    const content = compilationContent.innerText;
    if (!content) {
        alert("Gere um relatório válido antes de tentar copiar.");
        return;
    }
    
    navigator.clipboard.writeText(content).then(() => {
        const originalText = copyReportButton.textContent;
        copyReportButton.textContent = "Copiado!";
        setTimeout(() => {
            copyReportButton.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Não foi possível copiar o relatório.');
    });
}

function applyDarkModePreference() {
    const isDark = localStorage.getItem("medIADarkMode") === "true";
    document.body.classList.toggle("dark-mode", isDark);
    darkModeToggle.classList.toggle("active", isDark);
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    darkModeToggle.classList.toggle("active", isDark);
    localStorage.setItem("medIADarkMode", isDark);
}

document.addEventListener("DOMContentLoaded", () => {
    applyDarkModePreference();
    showContentSection("landing-page");
    
    hamburgerButton.addEventListener("click", toggleMenu);
    overlay.addEventListener("click", closeMenu);
    
    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showContentSection(link.dataset.target);
            if (link.dataset.target === "favorites-section") displayFavorites();
            if (link.dataset.target === "history-section") displayHistory();
            if (link.dataset.target === "alerts-section") displayAlerts();
        });
    });
    
    searchButton.addEventListener("click", () => performSearch(searchInput.value));
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") performSearch(searchInput.value);
    });
    
    compileButton.addEventListener("click", generateCompilation);
    closeModalButton.addEventListener("click", closeCompilationModal);
    downloadPdfButton.addEventListener("click", downloadReportAsPDF);
    copyReportButton.addEventListener("click", copyReportToClipboard);
    
    window.addEventListener("click", (e) => {
        if (e.target === compilationModal) closeCompilationModal();
    });
    
    clearHistoryButton.addEventListener("click", clearHistory);
    saveAlertButton.addEventListener("click", saveAlert);
    darkModeToggle.addEventListener("click", toggleDarkMode);
    
    let touchStartX = 0;
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0 && !sideMenu.classList.contains('open')) {
                toggleMenu();
            } else if (diff < 0 && sideMenu.classList.contains('open')) {
                toggleMenu();
            }
        }
    });
});