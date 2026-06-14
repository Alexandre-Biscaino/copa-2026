// ============================================
// SCRIPT PRINCIPAL - Renderização e Navegação
// VERSÃO COMPLETA COM MATA-MATA E ESTATÍSTICAS
// ============================================

import { matches, groupColor, matchDateTime, formatDayHeader, status, groups } from './js/dados.js';
import { results, loadFromStorage, toggleTheme } from './js/storage.js';
import { openModal, getMatchResultText, getMatchResultTextSimple, initModal } from './js/resultados.js';
import { renderClassificacao, calcularClassificacao } from './js/classificacao.js';
import { renderMataMata, initChaveamento } from './js/mataMata.js';
import { renderEstatisticas } from './js/estatisticas.js';
import { getBandeira } from './js/bandeiras.js';

// Variáveis de filtro
let activeGroup = 'all';
let currentView = 'jogos'; // 'jogos', 'classificacao', 'mataMata' ou 'estatisticas'

// Elementos DOM
const listContainer = document.getElementById('list');
const searchInput = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');
const groupPillsEl = document.getElementById('groupPills');
const resultCountSpan = document.getElementById('resultCount');
const tickerElement = document.getElementById('ticker');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados salvos
    loadFromStorage();
    
    // Inicializar modal
    initModal();
    
    // Calcular classificação inicial
    calcularClassificacao();
    
    // Popular filtros
    populateDateFilter();
    populateGroupPills();
    
    // Configurar eventos
    searchInput?.addEventListener('input', () => {
        if (currentView === 'jogos') renderJogos();
    });
    statusFilter?.addEventListener('change', () => {
        if (currentView === 'jogos') renderJogos();
    });
    dateFilter?.addEventListener('change', () => {
        if (currentView === 'jogos') renderJogos();
    });
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar botão de tema
    setupThemeToggle();
    
    // Renderizar tudo
    renderJogos();
    renderTicker();
    renderClassificacao();
    renderMataMata();
    renderEstatisticas();
    
    // Atualizar a cada 30 segundos
    setInterval(() => {
        renderTicker();
        if (currentView === 'jogos') renderJogos();
        if (currentView === 'classificacao') renderClassificacao();
        if (currentView === 'mataMata') renderMataMata();
        if (currentView === 'estatisticas') renderEstatisticas();
    }, 30000);
});

// Configurar navegação entre telas
function setupNavigation() {
    const btnJogos = document.getElementById('navJogos');
    const btnClassificacao = document.getElementById('navClassificacao');
    const btnMataMata = document.getElementById('navMataMata');
    const btnEstatisticas = document.getElementById('navEstatisticas');
    const viewJogos = document.getElementById('viewJogos');
    const viewClassificacao = document.getElementById('viewClassificacao');
    const viewMataMata = document.getElementById('viewMataMata');
    const viewEstatisticas = document.getElementById('viewEstatisticas');
    
    if (btnJogos) {
        btnJogos.addEventListener('click', () => {
            currentView = 'jogos';
            btnJogos.classList.add('active');
            btnClassificacao?.classList.remove('active');
            btnMataMata?.classList.remove('active');
            btnEstatisticas?.classList.remove('active');
            viewJogos.classList.add('active-view');
            viewClassificacao?.classList.remove('active-view');
            viewMataMata?.classList.remove('active-view');
            viewEstatisticas?.classList.remove('active-view');
            renderJogos();
        });
    }
    
    if (btnClassificacao) {
        btnClassificacao.addEventListener('click', () => {
            currentView = 'classificacao';
            btnClassificacao.classList.add('active');
            btnJogos.classList.remove('active');
            btnMataMata?.classList.remove('active');
            btnEstatisticas?.classList.remove('active');
            viewClassificacao.classList.add('active-view');
            viewJogos.classList.remove('active-view');
            viewMataMata?.classList.remove('active-view');
            viewEstatisticas?.classList.remove('active-view');
            renderClassificacao();
        });
    }
    
    if (btnMataMata) {
        btnMataMata.addEventListener('click', () => {
            currentView = 'mataMata';
            btnMataMata.classList.add('active');
            btnJogos.classList.remove('active');
            btnClassificacao.classList.remove('active');
            btnEstatisticas?.classList.remove('active');
            viewMataMata.classList.add('active-view');
            viewJogos.classList.remove('active-view');
            viewClassificacao.classList.remove('active-view');
            viewEstatisticas?.classList.remove('active-view');
            renderMataMata();
        });
    }
    
    if (btnEstatisticas) {
        btnEstatisticas.addEventListener('click', () => {
            currentView = 'estatisticas';
            btnEstatisticas.classList.add('active');
            btnJogos.classList.remove('active');
            btnClassificacao.classList.remove('active');
            btnMataMata?.classList.remove('active');
            viewEstatisticas.classList.add('active-view');
            viewJogos.classList.remove('active-view');
            viewClassificacao.classList.remove('active-view');
            viewMataMata?.classList.remove('active-view');
            renderEstatisticas();
        });
    }
}

// Configurar botão de tema escuro/claro
function setupThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            toggleTheme();
            // Re-renderizar para atualizar cores
            renderJogos();
            renderClassificacao();
            renderMataMata();
            renderEstatisticas();
            renderTicker();
        });
    }
}

// Popular filtro de datas
function populateDateFilter() {
    if (!dateFilter) return;
    
    const uniqueDates = [...new Set(matches.map(m => m.date))].sort();
    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDayHeader(date);
        dateFilter.appendChild(option);
    });
}

// Popular filtro de grupos (pílulas)
function populateGroupPills() {
    if (!groupPillsEl) return;
    
    const allPill = document.createElement('div');
    allPill.className = 'pill active';
    allPill.textContent = 'Todos os grupos';
    allPill.dataset.value = 'all';
    allPill.onclick = () => {
        activeGroup = 'all';
        updateActivePill();
        if (currentView === 'jogos') renderJogos();
    };
    groupPillsEl.appendChild(allPill);
    
    groups.forEach(g => {
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.textContent = `Grupo ${g}`;
        pill.dataset.value = g;
        pill.onclick = () => {
            activeGroup = g;
            updateActivePill();
            if (currentView === 'jogos') renderJogos();
        };
        groupPillsEl.appendChild(pill);
    });
}

// Atualizar estilo das pílulas ativas
function updateActivePill() {
    const pills = document.querySelectorAll('.pill');
    pills.forEach(pill => {
        if (pill.dataset.value === activeGroup) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

// Renderizar lista de jogos filtrada
export function renderJogos() {
    if (!listContainer) return;
    
    const searchTerm = searchInput?.value.trim().toLowerCase() || '';
    const statusValue = statusFilter?.value || 'all';
    const dateValue = dateFilter?.value || 'all';
    
    let filtered = matches.filter(match => {
        if (activeGroup !== 'all' && match.g !== activeGroup) return false;
        if (dateValue !== 'all' && match.date !== dateValue) return false;
        if (statusValue !== 'all' && status(match) !== statusValue) return false;
        if (searchTerm) {
            const teamNames = `${match.a} ${match.b}`.toLowerCase();
            if (!teamNames.includes(searchTerm)) return false;
        }
        return true;
    });
    
    filtered.sort((a, b) => matchDateTime(a) - matchDateTime(b));
    
    // Atualizar contador
    if (resultCountSpan) {
        resultCountSpan.innerHTML = `<b>${filtered.length}</b> jogo${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;
    }
    
    if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="empty">⚽ Nenhum jogo encontrado com esses filtros.</div>`;
        return;
    }
    
    let lastDate = null;
    let html = '';
    
    filtered.forEach(match => {
        if (match.date !== lastDate) {
            html += `<div class="day-header">${formatDayHeader(match.date)}</div>`;
            lastDate = match.date;
        }
        
        const st = status(match);
        const resultHtml = getMatchResultText(match);
        const resultSimple = getMatchResultTextSimple(match);
        const liveHtml = st === 'live' ? '<span class="live-tag">● EM ANDAMENTO</span>' : '';
        const corGrupo = groupColor(match.g);
        
        html += `
            <div class="match ${st === 'live' ? 'live' : ''} ${st === 'done' ? 'done' : ''}" data-match-id="${match.id}">
                <div class="m-time">${match.time}<small>BRASÍLIA</small></div>
                <div class="m-teams">
                    <div class="team"><span class="flag">${getBandeira(match.fa)}</span>${match.a}</div>
                    <span class="x">x</span>
                    <div class="team"><span class="flag">${getBandeira(match.fb)}</span>${match.b}</div>
                    ${resultHtml ? `<div class="result-premium-wrapper" title="${resultSimple.replace(/<[^>]*>/g, '')}">${resultHtml}</div>` : ''}
                    ${liveHtml}
                </div>
                <div class="m-side">
                    <span class="badge" style="background:${corGrupo}22;color:${corGrupo};border:1px solid ${corGrupo}55;">GRUPO ${match.g}</span>
                    <span class="m-venue">${match.venue}</span>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
    
    // Adicionar eventos de clique nos jogos
    document.querySelectorAll('.match').forEach(element => {
        const matchId = element.dataset.matchId;
        const match = matches.find(m => m.id === matchId);
        if (match) {
            element.addEventListener('click', () => openModal(match, () => {
                renderJogos();
                renderClassificacao();
                renderMataMata();
                renderEstatisticas();
                renderTicker();
            }));
        }
    });
}

// Renderizar ticker (próximo jogo)
export function renderTicker() {
    if (!tickerElement) return;
    
    const now = new Date();
    const live = matches.filter(m => status(m) === 'live');
    const upcoming = matches.filter(m => status(m) === 'upcoming')
        .sort((a, b) => matchDateTime(a) - matchDateTime(b));
    
    let target = live[0];
    let label = 'AGORA';
    let cls = 'live';
    
    if (!target && upcoming.length) {
        target = upcoming[0];
        label = 'PRÓXIMO JOGO';
        cls = 'upcoming';
    }
    
    if (!target) {
        tickerElement.className = 'ticker';
        tickerElement.innerHTML = `
            <div class="ticker-label">🏆 TORNEIO</div>
            <div class="ticker-main">✅ Fase de grupos encerrada! Acesse a aba MATA-MATA</div>
        `;
        return;
    }
    
    tickerElement.className = `ticker ${cls}`;
    const dt = matchDateTime(target);
    let metaText;
    
    if (cls === 'live') {
        metaText = 'em andamento';
    } else {
        const diffMs = dt - now;
        const h = Math.floor(diffMs / 3600000);
        const min = Math.floor((diffMs % 3600000) / 60000);
        metaText = h > 0 ? `em <b>${h}h ${min}min</b>` : `em <b>${min} min</b>`;
    }
    
    tickerElement.innerHTML = `
        <div class="ticker-label">${label} · Grupo ${target.g} · ${target.venue}</div>
        <div class="dot"></div>
        <div class="ticker-main">${getBandeira(target.fa)} ${target.a} <span style="color:var(--text-dim);font-size:0.7em;"> x </span> ${target.b} ${getBandeira(target.fb)}</div>
        <div class="ticker-meta">${formatDayHeader(target.date)}, ${target.time}<br>${metaText}</div>
    `;
}

// Funções globais para serem chamadas por outros módulos
window.renderJogos = renderJogos;
window.renderTicker = renderTicker;
window.renderClassificacao = renderClassificacao;
window.renderMataMata = renderMataMata;
window.renderEstatisticas = renderEstatisticas;
window.getBandeira = getBandeira;