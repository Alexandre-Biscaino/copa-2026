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
    } else {
        goalsAInput.value = 0;
        goalsBInput.value = 0;
        hasExtraTimeCheck.checked = false;
        hasPenaltiesCheck.checked = false;
        etGoalsAInput.value = 0;
        etGoalsBInput.value = 0;
        penAInput.value = 0;
        penBInput.value = 0;
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
    
    const resultData = {
        goalsA: parseInt(goalsAInput.value) || 0,
        goalsB: parseInt(goalsBInput.value) || 0,
        hasExtraTime: hasExtraTimeCheck.checked,
        hasPenalties: hasPenaltiesCheck.checked,
        etGoalsA: parseInt(etGoalsAInput.value) || 0,
        etGoalsB: parseInt(etGoalsBInput.value) || 0,
        penA: parseInt(penAInput.value) || 0,
        penB: parseInt(penBInput.value) || 0
    };
    
    saveMatchResult(currentMatch.id, resultData);
    closeModal();
    
    if (typeof renderJogos === 'function') renderJogos();
    if (typeof renderTicker === 'function') renderTicker();
    if (typeof renderClassificacao === 'function') renderClassificacao();
    
    if (modalCallback) modalCallback(currentMatch, resultData);
}

function resetResult() {
    if (!currentMatch) return;
    clearMatchResult(currentMatch.id);
    closeModal();
    
    if (typeof renderJogos === 'function') renderJogos();
    if (typeof renderTicker === 'function') renderTicker();
    if (typeof renderClassificacao === 'function') renderClassificacao();
}

// ============================================
// FUNÇÃO PREMIUM - EXIBE RESULTADO EM CARDS SEPARADOS
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
    
    // Ícone de prorrogação
    const iconProrrogacao = temProrrogacao ? '⏱️' : '';
    
    // Montar HTML com cards separados
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
    
    html += `</div></div>`;
    
    return html;
}

// Versão texto puro para tooltip (sem HTML)
export function getMatchResultTextSimple(match) {
    const res = results[match.id];
    if (!res) return null;
    
    const normal = `${res.goalsA} - ${res.goalsB}`;
    
    if (res.hasExtraTime) {
        if (res.hasPenalties) {
            return `${normal} | Prorrogação: ${res.etGoalsA}-${res.etGoalsB} | Pênaltis: ${res.penA}-${res.penB}`;
        }
        return `${normal} | Prorrogação: ${res.etGoalsA}-${res.etGoalsB}`;
    }
    return normal;
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