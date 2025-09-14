// Seletores
const hamburgerButton = document.getElementById("hamburger-button");
const sideMenu = document.getElementById("side-menu");
const overlay = document.getElementById("overlay");
const menuLinks = document.querySelectorAll(".nav-link");
const contentSections = document.querySelectorAll(".content-section");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results-container");
const favoritesList = document.getElementById("favorites-list");
const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history-button");
const compileButton = document.getElementById("compile-button");
const compilationModal = document.getElementById("compilation-modal");
const closeModalButton = compilationModal?.querySelector(".close-button");
const compilationContent = document.getElementById("compilation-content");
const downloadPdfButton = document.getElementById("download-pdf-button");
const copyReportButton = document.getElementById("copy-report-button");
const alertKeywordsInput = document.getElementById("alert-keywords");
const saveAlertButton = document.getElementById("save-alert-button");
const alertsListContainer = document.getElementById("alerts-list");

// Estado da Aplicação
let currentResults = [];
let favorites = JSON.parse(localStorage.getItem("medIAFavorites")) || [];
let searchHistory = JSON.parse(localStorage.getItem("medIASearchHistory")) || [];
let savedAlerts = JSON.parse(localStorage.getItem("medIAAlerts")) || [];
let generatedReports = JSON.parse(localStorage.getItem("medIAGeneratedReports")) || 0;
let dailySearches = JSON.parse(localStorage.getItem("medIADailySearches")) || {};

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const MAX_RESULTS = 15;
const DEFAULT_SEARCH_TERM = "med IA";

// Funções do Menu
function toggleMenu() {
    console.log('Toggle menu clicked');
    hamburgerButton.classList.toggle("open");
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("visible");
    document.body.style.overflow = sideMenu.classList.contains("open") ? "hidden" : "";
}

function closeMenu() {
    hamburgerButton.classList.remove("open");
    sideMenu.classList.remove("open");
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
}

function showContentSection(targetId) {
    contentSections.forEach(section => {
        section.classList.remove("active-section");
    });
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add("active-section");
        window.scrollTo(0, 0);
    }
    menuLinks.forEach(link => {
        link.classList.remove("active");
        if (link.dataset.target === targetId) {
            link.classList.add("active");
        }
    });
    closeMenu();
}

// Funções de Busca
async function performSearch(query) {
    resultsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="info-message">Buscando artigos...</p>
        </div>
    `;
    currentResults = [];
    const finalQuery = query.trim() === "" ? DEFAULT_SEARCH_TERM : query.trim();
    
    try {
        const searchUrl = `${PUBMED_BASE_URL}esearch.fcgi?db=pubmed&term=${encodeURIComponent(finalQuery)}&retmax=${MAX_RESULTS}&retmode=json`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.esearchresult && data.esearchresult.idlist && data.esearchresult.idlist.length > 0) {
            const ids = data.esearchresult.idlist.join(",");
            await fetchAndDisplaySummaries(ids);
            saveSearchTerm(finalQuery);
        } else {
            resultsContainer.innerHTML = '<p class="info-message">Nenhum artigo encontrado para esta busca.</p>';
        }
    } catch (error) {
        console.error("Erro ao buscar no PubMed:", error);
        resultsContainer.innerHTML = '<p class="info-message">Erro ao buscar artigos. Tente novamente.</p>';
    }
}

async function fetchAndDisplaySummaries(ids) {
    try {
        const summaryUrl = `${PUBMED_BASE_URL}esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
        const response = await fetch(summaryUrl);
        const data = await response.json();
        
        if (data.result) {
            currentResults = processPubMedResults(data.result);
            displayResults(currentResults);
        }
    } catch (error) {
        console.error("Erro ao buscar resumos:", error);
        resultsContainer.innerHTML = '<p class="info-message">Erro ao obter detalhes dos artigos.</p>';
    }
}

function processPubMedResults(pubmedData) {
    const uids = pubmedData.uids;
    return uids.map(uid => {
        const article = pubmedData[uid];
        return {
            id: uid,
            title: article.title || "Título não disponível",
            authors: article.authors ? article.authors.map(a => a.name).join(", ") : "Autores não disponíveis",
            journal: article.source || "Journal não disponível",
            pubDate: article.pubdate || "Data não disponível",
            url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
        };
    });
}

function displayResults(results) {
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p class="info-message">Nenhum resultado para exibir.</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(article => {
        const isFavorite = favorites.some(fav => fav.id === article.id);
        return `
            <div class="result-item">
                <h3>${article.title}</h3>
                <p><strong><i class="fas fa-users"></i> Autores:</strong> ${article.authors}</p>
                <p><strong><i class="fas fa-book"></i> Journal:</strong> ${article.journal} (${article.pubDate})</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Ver no PubMed</a>
                <button class="favorite-button ${isFavorite ? "active" : ""}" data-id="${article.id}">
                    <i class="fas fa-heart"></i> ${isFavorite ? "Remover Favorito" : "Favoritar"}
                </button>
            </div>
        `;
    }).join("");
    
    addFavoriteButtonListeners();
}

// Funções de Favoritos
function toggleFavorite(articleId) {
    const articleIndex = favorites.findIndex(fav => fav.id === articleId);
    
    if (articleIndex > -1) {
        favorites.splice(articleIndex, 1);
    } else {
        const article = currentResults.find(res => res.id === articleId);
        if (article) favorites.push(article);
    }
    
    localStorage.setItem("medIAFavorites", JSON.stringify(favorites));
    
    if (document.getElementById("favorites-section").classList.contains("active-section")) {
        displayFavorites();
    }
    
    updateFavoriteButtonState(articleId);
}

function displayFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="info-message">Nenhum artigo favoritado ainda.</p>';
        return;
    }
    
    favoritesList.innerHTML = favorites.map(article => `
        <div class="result-item list-item">
            <div>
                <h3>${article.title}</h3>
                <p>${article.authors} - ${article.journal} (${article.pubDate})</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">Ver no PubMed</a>
            </div>
            <button class="secondary-button" data-id="${article.id}">Remover</button>
        </div>
    `).join("");
    
    document.querySelectorAll("#favorites-list button").forEach(button => {
        button.addEventListener("click", () => toggleFavorite(button.dataset.id));
    });
}

function addFavoriteButtonListeners() {
    document.querySelectorAll(".favorite-button").forEach(button => {
        button.addEventListener("click", () => toggleFavorite(button.dataset.id));
    });
}

function updateFavoriteButtonState(articleId) {
    const button = resultsContainer.querySelector(`.favorite-button[data-id="${articleId}"]`);
    if (button) {
        const isFavorite = favorites.some(fav => fav.id === articleId);
        button.textContent = isFavorite ? "Remover Favorito" : "Favoritar";
        button.classList.toggle("active", isFavorite);
    }
}

// Funções de Histórico
function saveSearchTerm(term) {
    searchHistory = searchHistory.filter(item => item !== term);
    searchHistory.unshift(term);
    if (searchHistory.length > 20) searchHistory.pop();
    localStorage.setItem("medIASearchHistory", JSON.stringify(searchHistory));
    
    // Atualizar estatísticas diárias
    const today = new Date().toISOString().split('T')[0];
    dailySearches[today] = (dailySearches[today] || 0) + 1;
    localStorage.setItem("medIADailySearches", JSON.stringify(dailySearches));
    
    displayHistory();
    updateStats();
}

function displayHistory() {
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<p class="info-message">Nenhuma busca realizada ainda.</p>';
        return;
    }
    
    historyList.innerHTML = searchHistory.map(term => `
        <div class="list-item">
            <span>${term}</span>
            <button class="secondary-button" data-term="${term}">Buscar Novamente</button>
        </div>
    `).join("");
    
    document.querySelectorAll("#history-list button").forEach(button => {
        button.addEventListener("click", () => {
            const term = button.dataset.term;
            searchInput.value = term;
            showContentSection("search-section");
            performSearch(term);
        });
    });
}

function clearHistory() {
    searchHistory = [];
    localStorage.removeItem("medIASearchHistory");
    displayHistory();
}

// Funções de Alertas
function saveAlert() {
    const keywords = alertKeywordsInput.value.trim();
    if (keywords && !savedAlerts.includes(keywords)) {
        savedAlerts.push(keywords);
        localStorage.setItem("medIAAlerts", JSON.stringify(savedAlerts));
        alertKeywordsInput.value = "";
        displayAlerts();
        updateStats();
    }
}

function deleteAlert(keywords) {
    savedAlerts = savedAlerts.filter(item => item !== keywords);
    localStorage.setItem("medIAAlerts", JSON.stringify(savedAlerts));
    displayAlerts();
}

function displayAlerts() {
    const alertsList = alertsListContainer.querySelector("p.info-message")?.parentElement || alertsListContainer;
    
    if (savedAlerts.length === 0) {
        alertsList.innerHTML = '<h3>Alertas Salvos:</h3><p class="info-message">Nenhum alerta configurado.</p>';
        return;
    }
    
    alertsList.innerHTML = '<h3>Alertas Salvos:</h3>' + savedAlerts.map(keywords => `
        <div class="list-item">
            <span>${keywords}</span>
            <div>
                <button class="secondary-button" data-keywords="${keywords}">Verificar Agora</button>
                <button class="secondary-button" data-delete="${keywords}">Remover</button>
            </div>
        </div>
    `).join("");
    
    document.querySelectorAll("#alerts-list button[data-keywords]").forEach(button => {
        button.addEventListener("click", () => {
            const keywords = button.dataset.keywords;
            searchInput.value = keywords;
            showContentSection("search-section");
            performSearch(keywords);
        });
    });
    
    document.querySelectorAll("#alerts-list button[data-delete]").forEach(button => {
        button.addEventListener("click", () => deleteAlert(button.dataset.delete));
    });
}

// Funções de Compilação
async function generateCompilation() {
    if (currentResults.length === 0) {
        alert("Realize uma busca primeiro para gerar um compilado.");
        return;
    }
    
    const top5Results = currentResults.slice(0, 5);
    compilationContent.innerHTML = '<p class="info-message">Buscando resumos para o Top 5...</p>';
    compilationModal.style.display = "block";
    document.body.style.overflow = "hidden";
    
    try {
        const ids = top5Results.map(article => article.id).join(",");
        const fetchUrl = `${PUBMED_BASE_URL}efetch.fcgi?db=pubmed&id=${ids}&retmode=xml&rettype=abstract`;
        const response = await fetch(fetchUrl);
        const xmlText = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
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
    downloadPdfButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PDF...';
    
    html2pdf().set(opt).from(element).save().then(() => {
        downloadPdfButton.disabled = false;
        downloadPdfButton.innerHTML = '<i class="fas fa-download"></i> Download PDF';
        
        // Atualizar estatísticas
        generatedReports++;
        localStorage.setItem("medIAGeneratedReports", generatedReports);
        updateStats();
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Erro ao gerar o PDF. Tente novamente.");
        downloadPdfButton.disabled = false;
        downloadPdfButton.innerHTML = '<i class="fas fa-download"></i> Download PDF';
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

// Funções de Estatísticas
function updateStats() {
    // Atualizar contadores
    document.getElementById("total-searches").textContent = searchHistory.length;
    document.getElementById("total-favorites").textContent = favorites.length;
    document.getElementById("total-alerts").textContent = savedAlerts.length;
    document.getElementById("total-reports").textContent = generatedReports;
    
    // Atualizar gráfico de buscas
    updateSearchesChart();
}

function updateSearchesChart() {
    const chartContainer = document.getElementById("searches-chart");
    const last7Days = getLast7Days();
    
    if (Object.keys(dailySearches).length === 0) {
        chartContainer.innerHTML = '<p class="info-message">Nenhuma busca realizada ainda.</p>';
        return;
    }
    
    let chartHTML = '<div class="chart-bars">';
    last7Days.forEach(day => {
        const count = dailySearches[day] || 0;
        const height = count > 0 ? (count / Math.max(...Object.values(dailySearches))) * 100 : 0;
        const date = new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        chartHTML += `
            <div class="chart-bar">
                <div class="bar" style="height: ${height}%"></div>
                <span class="bar-label">${date}</span>
                <span class="bar-value">${count}</span>
            </div>
        `;
    });
    chartHTML += '</div>';
    
    chartContainer.innerHTML = chartHTML;
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
}

function displayStats() {
    updateStats();
}

// Funções de Ajustes
function applyDarkModePreference() {
    const isDark = localStorage.getItem("medIADarkMode") === "true";
    document.body.classList.toggle("dark-mode", isDark);
    darkModeToggle?.classList.toggle("active", isDark);
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    darkModeToggle?.classList.toggle("active", isDark);
    localStorage.setItem("medIADarkMode", isDark);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    applyDarkModePreference();
    showContentSection("landing-page");
    
    if (hamburgerButton) {
        hamburgerButton.addEventListener("click", toggleMenu);
    }
    
    if (overlay) {
        overlay.addEventListener("click", closeMenu);
    }
    
    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showContentSection(link.dataset.target);
            if (link.dataset.target === "favorites-section") displayFavorites();
            if (link.dataset.target === "history-section") displayHistory();
            if (link.dataset.target === "alerts-section") displayAlerts();
            if (link.dataset.target === "stats-section") displayStats();
        });
    });
    
    if (searchButton) {
        searchButton.addEventListener("click", () => performSearch(searchInput.value));
    }
    
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") performSearch(searchInput.value);
        });
    }
    
    if (compileButton) {
        compileButton.addEventListener("click", generateCompilation);
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeCompilationModal);
    }
    
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener("click", downloadReportAsPDF);
    }
    
    if (copyReportButton) {
        copyReportButton.addEventListener("click", copyReportToClipboard);
    }
    
    window.addEventListener("click", (e) => {
        if (e.target === compilationModal) closeCompilationModal();
    });
    
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener("click", clearHistory);
    }
    
    if (saveAlertButton) {
        saveAlertButton.addEventListener("click", saveAlert);
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", toggleDarkMode);
    }
    
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