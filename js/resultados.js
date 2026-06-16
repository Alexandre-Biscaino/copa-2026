// ============================================
// RESULTADOS - Modal e Gerenciamento de Placar
// VERSÃO PREMIUM FINAL - Design por etapas
// ============================================

import { results, saveMatchResult, clearMatchResult, getWinner, hasResult } from './storage.js';
import { matches } from './dados.js';
import { renderJogos, renderTicker } from '../script.js';
import { renderClassificacao } from './classificacao.js';
import { getBandeira } from './bandeiras.js';

let currentMatch = null;
let modalCallback = null;

const modalOverlay = document.getElementById('modalOverlay');
const modalTeams = document.getElementById('modalTeams');
const goalsAInput = document.getElementById('goalsA');
const goalsBInput = document.getElementById('goalsB');
const hasExtraTimeCheck = document.getElementById('hasExtraTime');
const hasPenaltiesCheck = document.getElementById('hasPenalties');
const etGoalsAInput = document.getElementById('etGoalsA');
const etGoalsBInput = document.getElementById('etGoalsB');
const penAInput = document.getElementById('penA');
const penBInput = document.getElementById('penB');
const artilheirosInput = document.getElementById('artilheirosInput');
const golsContraInput = document.getElementById('golsContraInput');
const extraTimeFields = document.getElementById('extraTimeFields');
const penaltiesFields = document.getElementById('penaltiesFields');

export function initModal() {
    document.getElementById('saveResultBtn')?.addEventListener('click', saveResult);
    document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('resetResultBtn')?.addEventListener('click', resetResult);
    
    hasExtraTimeCheck?.addEventListener('change', () => {
        toggleExtraFields();
        if (!hasExtraTimeCheck.checked) {
            hasPenaltiesCheck.checked = false;
            togglePenaltiesFields();
        }
    });
    
    hasPenaltiesCheck?.addEventListener('change', togglePenaltiesFields);
    
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

export function openModal(match, onSaveCallback = null) {
    currentMatch = match;
    modalCallback = onSaveCallback;
    
    if (modalTeams) {
        modalTeams.innerHTML = `
            <div class="modal-team">
                <span class="flag">${getBandeira(match.fa)}</span>
                <div class="name">${match.a}</div>
            </div>
            <div class="modal-vs">VS</div>
            <div class="modal-team">
                <span class="flag">${getBandeira(match.fb)}</span>
                <div class="name">${match.b}</div>
            </div>
        `;
    }
    
    const existing = results[match.id];
    if (existing) {
        goalsAInput.value = existing.goalsA || 0;
        goalsBInput.value = existing.goalsB || 0;
        hasExtraTimeCheck.checked = existing.hasExtraTime || false;
        hasPenaltiesCheck.checked = existing.hasPenalties || false;
        etGoalsAInput.value = existing.etGoalsA || 0;
        etGoalsBInput.value = existing.etGoalsB || 0;
        penAInput.value = existing.penA || 0;
        penBInput.value = existing.penB || 0;
        
        // Carregar artilheiros existentes
        if (existing.artilheiros) {
            artilheirosInput.value = existing.artilheiros;
        } else {
            artilheirosInput.value = '';
        }
        
        // Carregar gols contra existentes
        if (existing.golsContra) {
            golsContraInput.value = existing.golsContra;
        } else {
            golsContraInput.value = '';
        }
    } else {
        goalsAInput.value = 0;
        goalsBInput.value = 0;
        hasExtraTimeCheck.checked = false;
        hasPenaltiesCheck.checked = false;
        etGoalsAInput.value = 0;
        etGoalsBInput.value = 0;
        penAInput.value = 0;
        penBInput.value = 0;
        artilheirosInput.value = '';
        golsContraInput.value = '';
    }
    
    toggleExtraFields();
    togglePenaltiesFields();
    modalOverlay?.classList.add('active');
}

export function closeModal() {
    modalOverlay?.classList.remove('active');
    currentMatch = null;
    modalCallback = null;
}

function toggleExtraFields() {
    const hasExtra = hasExtraTimeCheck.checked;
    extraTimeFields?.classList.toggle('show', hasExtra);
}

function togglePenaltiesFields() {
    const hasPenalties = hasPenaltiesCheck.checked;
    penaltiesFields?.classList.toggle('show', hasPenalties);
}

function saveResult() {
    if (!currentMatch) return;
    
    // Coletar dados dos campos
    const goalsA = parseInt(goalsAInput.value) || 0;
    const goalsB = parseInt(goalsBInput.value) || 0;
    const hasExtraTime = hasExtraTimeCheck.checked;
    const hasPenalties = hasPenaltiesCheck.checked;
    const etGoalsA = parseInt(etGoalsAInput.value) || 0;
    const etGoalsB = parseInt(etGoalsBInput.value) || 0;
    const penA = parseInt(penAInput.value) || 0;
    const penB = parseInt(penBInput.value) || 0;
    const artilheiros = artilheirosInput.value.trim() || null;
    const golsContra = golsContraInput.value.trim() || null;
    
    // Validação básica
    if (goalsA === 0 && goalsB === 0 && !hasExtraTime && !hasPenalties) {
        // Permitir 0x0, mas verificar se é intencional
        const confirmZero = confirm('⚠️ Você está registrando um placar 0x0. Deseja continuar?');
        if (!confirmZero) return;
    }
    
    // Se houve prorrogação, mas não houve gols, verificar se é intencional
    if (hasExtraTime && etGoalsA === 0 && etGoalsB === 0 && hasPenalties) {
        // Prorrogação 0x0 com pênaltis é válida
    } else if (hasExtraTime && etGoalsA === 0 && etGoalsB === 0 && !hasPenalties) {
        // Prorrogação 0x0 sem pênaltis - verificar se é intencional
        const confirmET = confirm('⚠️ Prorrogação terminou 0x0. Deseja continuar?');
        if (!confirmET) return;
    }
    
    const resultData = {
        goalsA,
        goalsB,
        hasExtraTime,
        hasPenalties,
        etGoalsA,
        etGoalsB,
        penA,
        penB,
        artilheiros,
        golsContra
    };
    
    saveMatchResult(currentMatch.id, resultData);
    closeModal();
    
    if (typeof renderJogos === 'function') renderJogos();
    if (typeof renderTicker === 'function') renderTicker();
    if (typeof renderClassificacao === 'function') renderClassificacao();
    
    // Disparar evento de atualização para estatísticas
    if (typeof window.renderEstatisticas === 'function') {
        window.renderEstatisticas();
    }
    
    if (modalCallback) modalCallback(currentMatch, resultData);
    
    // Mostrar notificação de sucesso
    showNotification('✅ Resultado salvo com sucesso!', 'success');
}

function resetResult() {
    if (!currentMatch) return;
    
    const confirmReset = confirm(`⚠️ Tem certeza que deseja limpar o resultado do jogo ${currentMatch.a} vs ${currentMatch.b}?`);
    if (!confirmReset) return;
    
    clearMatchResult(currentMatch.id);
    closeModal();
    
    if (typeof renderJogos === 'function') renderJogos();
    if (typeof renderTicker === 'function') renderTicker();
    if (typeof renderClassificacao === 'function') renderClassificacao();
    
    // Disparar evento de atualização para estatísticas
    if (typeof window.renderEstatisticas === 'function') {
        window.renderEstatisticas();
    }
    
    showNotification('🗑️ Resultado removido com sucesso!', 'info');
}

// Função auxiliar para mostrar notificações
function showNotification(message, type = 'success') {
    const notificationModal = document.getElementById('notificationModal');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationConfirmBtn = document.getElementById('notificationConfirmBtn');
    
    if (!notificationModal) return;
    
    // Configurar ícone e título baseado no tipo
    if (type === 'success') {
        notificationIcon.textContent = '✅';
        notificationTitle.textContent = 'Sucesso!';
    } else if (type === 'error') {
        notificationIcon.textContent = '❌';
        notificationTitle.textContent = 'Erro!';
    } else if (type === 'info') {
        notificationIcon.textContent = 'ℹ️';
        notificationTitle.textContent = 'Informação';
    } else if (type === 'warning') {
        notificationIcon.textContent = '⚠️';
        notificationTitle.textContent = 'Atenção';
    }
    
    notificationMessage.textContent = message;
    
    // Mostrar modal
    notificationModal.classList.add('active');
    
    // Fechar ao clicar no botão
    notificationConfirmBtn.onclick = () => {
        notificationModal.classList.remove('active');
    };
    
    // Fechar ao clicar fora
    notificationModal.onclick = (e) => {
        if (e.target === notificationModal) {
            notificationModal.classList.remove('active');
        }
    };
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
        notificationModal.classList.remove('active');
    }, 5000);
}

// ============================================
// FUNÇÃO PREMIUM - EXIBE RESULTADO EM CARDS SEPARADOS
// (SEM ARTILHEIROS - APENAS PLACAR E PRORROGAÇÃO/PÊNALTIS)
// ============================================
export function getMatchResultText(match) {
    const res = results[match.id];
    if (!res) return null;
    
    const tempoNormal = `${res.goalsA} - ${res.goalsB}`;
    const temProrrogacao = res.hasExtraTime;
    const temPenaltis = res.hasPenalties;
    const golsProrrogacao = `${res.etGoalsA || 0} - ${res.etGoalsB || 0}`;
    const golsPenaltis = `${res.penA || 0} - ${res.penB || 0}`;
    
    // Determinar ícone do vencedor dos pênaltis
    let iconPenaltis = '';
    if (temPenaltis && res.penA !== undefined && res.penB !== undefined) {
        const vencedor = res.penA > res.penB ? 'A' : (res.penB > res.penA ? 'B' : null);
        iconPenaltis = vencedor ? '🏆' : '❌';
    }
    
    // Montar HTML com cards separados (SEM ARTILHEIROS)
    let html = `<div class="result-premium-container">`;
    html += `<div class="result-teams">${getBandeira(match.fa)} ${match.a} vs ${match.b} ${getBandeira(match.fb)}</div>`;
    html += `<div class="result-cards">`;
    
    // Card 1: Tempo Normal
    html += `
        <div class="result-card result-card-normal">
            <div class="result-card-title">📋 TEMPO NORMAL</div>
            <div class="result-card-score">${tempoNormal}</div>
        </div>
    `;
    
    // Card 2: Prorrogação (se houver)
    if (temProrrogacao) {
        html += `
            <div class="result-card result-card-et">
                <div class="result-card-title">⏱️ PRORROGAÇÃO</div>
                <div class="result-card-score">${golsProrrogacao}</div>
            </div>
        `;
    }
    
    // Card 3: Pênaltis (se houver)
    if (temPenaltis) {
        html += `
            <div class="result-card result-card-penalties">
                <div class="result-card-title">⚽ PÊNALTIS ${iconPenaltis}</div>
                <div class="result-card-score">${golsPenaltis}</div>
            </div>
        `;
    }
    
    // Card 4: Artilheiros NÃO é mais exibido aqui
    // Os artilheiros ficam apenas no modal de edição
    
    html += `</div></div>`;
    
    return html;
}

// Versão texto puro para tooltip (sem HTML)
export function getMatchResultTextSimple(match) {
    const res = results[match.id];
    if (!res) return null;
    
    const normal = `${res.goalsA} - ${res.goalsB}`;
    let text = normal;
    
    if (res.hasExtraTime) {
        if (res.hasPenalties) {
            text += ` | Prorrogação: ${res.etGoalsA}-${res.etGoalsB} | Pênaltis: ${res.penA}-${res.penB}`;
        } else {
            text += ` | Prorrogação: ${res.etGoalsA}-${res.etGoalsB}`;
        }
    }
    
    if (res.artilheiros) {
        text += ` | Artilheiros: ${res.artilheiros}`;
    }
    
    if (res.golsContra) {
        text += ` | Gols Contra: ${res.golsContra}`;
    }
    
    return text;
}

export function matchHasResult(matchId) {
    return hasResult(matchId);
}

export function getMatchWinner(match) {
    const res = results[match.id];
    if (!res) return null;
    
    const winner = getWinner(match, res);
    if (winner === 'A') return match.a;
    if (winner === 'B') return match.b;
    return null;
}

// Função para obter artilheiros de um jogo específico
export function getMatchArtilheiros(matchId) {
    const res = results[matchId];
    if (res && res.artilheiros) {
        return res.artilheiros;
    }
    return null;
}

// Função para obter gols contra de um jogo específico
export function getMatchGolsContra(matchId) {
    const res = results[matchId];
    if (res && res.golsContra) {
        return res.golsContra;
    }
    return null;
}

// Função para processar artilheiros e extrair lista estruturada
export function parseArtilheiros(artilheirosString) {
    if (!artilheirosString || artilheirosString.trim() === '') {
        return [];
    }
    
    // Formato esperado: "Neymar (2), Vinicius Jr (1), Richarlison (1)"
    const items = artilheirosString.split(',').map(item => item.trim());
    const result = [];
    
    items.forEach(item => {
        // Tenta extrair nome e gols no formato "Nome (N)"
        const match = item.match(/^(.+?)\s*\((\d+)\)$/);
        if (match) {
            result.push({
                jogador: match[1].trim(),
                gols: parseInt(match[2]) || 0
            });
        } else {
            // Se não encontrar o formato, assume que é apenas o nome com 1 gol
            result.push({
                jogador: item.trim(),
                gols: 1
            });
        }
    });
    
    return result;
}

// Função para processar gols contra e extrair lista estruturada
export function parseGolsContra(golsContraString) {
    if (!golsContraString || golsContraString.trim() === '') {
        return [];
    }
    
    // Formato esperado: "Thiago Silva (1), Marquinhos (1)"
    const items = golsContraString.split(',').map(item => item.trim());
    const result = [];
    
    items.forEach(item => {
        // Tenta extrair nome e gols no formato "Nome (N)"
        const match = item.match(/^(.+?)\s*\((\d+)\)$/);
        if (match) {
            result.push({
                jogador: match[1].trim(),
                gols: parseInt(match[2]) || 0
            });
        } else {
            // Se não encontrar o formato, assume que é apenas o nome com 1 gol
            result.push({
                jogador: item.trim(),
                gols: 1
            });
        }
    });
    
    return result;
}