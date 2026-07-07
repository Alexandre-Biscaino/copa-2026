// ============================================
// MATA-MATA - Chaveamento Completo (48 Seleções)
// COM NOTIFICAÇÕES PREMIUM
// ============================================

import { results, getWinner } from './storage.js';
import { getClassificacao, getMelhoresTerceiros } from './classificacao.js';
import { getBandeira } from './bandeiras.js';

// --- SISTEMA DE OVERRIDE MANUAL DE EQUIPES ---
const overrideEquipes = JSON.parse(localStorage.getItem('overrideEquipes') || '{}');

window.alterarEquipes = function(jogoId, novoA, novoB) {
    // Se os dois campos estiverem vazios, removemos a customização
    if (!novoA && !novoB) {
        delete overrideEquipes[jogoId];
    } else {
        overrideEquipes[jogoId] = { a: novoA, b: novoB };
    }
    localStorage.setItem('overrideEquipes', JSON.stringify(overrideEquipes));
    renderMataMata();
    
    showNotification(`✅ Confronto atualizado com sucesso!`, 'success');
};

// =========================================================================
// NOVO: MODAL PREMIUM PARA ALTERAR AS SELEÇÕES DA PARTIDA
// =========================================================================
window.abrirModalOverride = function(jogoId, timeA, timeB) {
    const modalId = 'overrideModalPremium';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'notification-modal active';
        document.body.appendChild(modal);
    } else {
        modal.classList.add('active');
    }

    // Pega os nomes atuais (ou os que já foram customizados)
    const salvo = overrideEquipes[jogoId] || {};
    const tA = salvo.a !== undefined ? salvo.a : (timeA !== 'null' ? timeA : '');
    const tB = salvo.b !== undefined ? salvo.b : (timeB !== 'null' ? timeB : '');

    modal.innerHTML = `
        <div class="notification-card" style="max-width: 450px; text-align: center;">
            <div class="notification-icon">⚙️</div>
            <h3 class="notification-title">Alterar Seleções</h3>
            <p class="notification-message">Corrija ou altere os times que jogarão este confronto.</p>
            
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px; background: var(--bg-deep); padding: 16px; border-radius: 12px; border: 1px solid var(--line);">
                <div style="flex: 1; text-align: left;">
                    <label style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px; display: block; font-family: 'Space Mono', monospace;">TIME 1</label>
                    <input type="text" id="overrideTimeA" value="${tA}" placeholder="Ex: Brasil" style="width: 100%; padding: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; color: var(--text); outline: none;">
                </div>
                <div style="font-family: 'Anton', sans-serif; color: var(--text-dim); margin-top: 18px;">X</div>
                <div style="flex: 1; text-align: left;">
                    <label style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px; display: block; font-family: 'Space Mono', monospace;">TIME 2</label>
                    <input type="text" id="overrideTimeB" value="${tB}" placeholder="Ex: Holanda" style="width: 100%; padding: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; color: var(--text); outline: none;">
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center; border-top: 1px solid var(--line); padding-top: 20px;">
                <button class="notification-btn" style="background: var(--green); color: #06241a;" onclick="const a = document.getElementById('overrideTimeA').value; const b = document.getElementById('overrideTimeB').value; alterarEquipes('${jogoId}', a, b); fecharOverrideModal();">💾 Salvar</button>
                <button class="notification-btn notification-btn-cancel" onclick="alterarEquipes('${jogoId}', '', ''); fecharOverrideModal();" style="border-color: var(--coral); color: var(--coral);">🔄 Restaurar Padrão</button>
                <button class="notification-btn notification-btn-cancel" onclick="fecharOverrideModal();">❌ Cancelar</button>
            </div>
        </div>
    `;
};

window.fecharOverrideModal = function() {
    const modal = document.getElementById('overrideModalPremium');
    if (modal) modal.classList.remove('active');
};

// =========================================================================
// VERSÃO CORRIGIDA DA ALOCAÇÃO DE POSIÇÕES
// =========================================================================

function getTimePorPosicao(posicao) {
    const classificacao = getClassificacao();
    const melhoresTerceiros = getMelhoresTerceiros();
    
    // Tratamento para 1º e 2º colocados dos grupos (A até L)
    if (posicao.startsWith('1') || posicao.startsWith('2')) {
        const grupo = posicao.charAt(1);
        const pos = parseInt(posicao.charAt(0)) - 1;
        const ranking = classificacao[grupo];
        
        // CORREÇÃO: Removeu-se a exigência estrita de 'jogos === 3' para evitar 
        // travamentos por inconsistência de dados no localStorage no dia do início da fase.
        if (ranking && ranking[pos]) {
            return ranking[pos].time;
        }
        return null;
    }
    
    // Tratamento dinâmico para os melhores 3º colocados
    if (posicao.startsWith('3')) {
        const gruposPossiveis = posicao.substring(1).split('');
        
        // CORREÇÃO: Agora verifica os terceiros colocados em ordem, 
        // respeitando a matriz de combinação oficial da FIFA
        for (let i = 0; i < melhoresTerceiros.length; i++) {
            const terceiro = melhoresTerceiros[i];
            if (gruposPossiveis.includes(terceiro.grupo)) {
                if (!terceirosUsadosGlobal.includes(terceiro.time)) {
                    terceirosUsadosGlobal.push(terceiro.time);
                    return terceiro.time;
                }
            }
        }
    }
    return null;
}

// Template dos confrontos de 16-avos
const confrontos16AvosTemplate = [
    { id: '73', pos1: '2A', pos2: '2B', local: 'LOS ANGELES', horario: '16H', data: '28 JUN' },
    { id: '74', pos1: '1E', pos2: '3ABCDF', local: 'BOSTON', horario: '17H30', data: '29 JUN' },
    { id: '75', pos1: '1F', pos2: '2C', local: 'MONTERREY', horario: '22H', data: '29 JUN' },
    { id: '76', pos1: '1C', pos2: '2F', local: 'HOUSTON', horario: '14H', data: '29 JUN' },
    { id: '77', pos1: '1I', pos2: '3CDFGH', local: 'NOVA YORK/NOVA JERSEY', horario: '18H', data: '30 JUN' },
    { id: '78', pos1: '2E', pos2: '2I', local: 'DALLAS', horario: '14H', data: '30 JUN' },
    { id: '79', pos1: '1A', pos2: '3CEFHI', local: 'CIDADE DO MÉXICO', horario: '22H', data: '30 JUN' },
    { id: '80', pos1: '1L', pos2: '3EHIJK', local: 'ATLANTA', horario: '13H', data: '1 JUL' },
    { id: '81', pos1: '1D', pos2: '3BEFIJ', local: 'SANTA CLARA', horario: '21H', data: '1 JUL' },
    { id: '82', pos1: '1G', pos2: '3AEHIJ', local: 'SEATTLE', horario: '17H', data: '1 JUL' },
    { id: '83', pos1: '2K', pos2: '2L', local: 'TORONTO', horario: '20H', data: '2 JUL' },
    { id: '84', pos1: '1H', pos2: '2J', local: 'LOS ANGELES', horario: '16H', data: '2 JUL' },
    { id: '85', pos1: '1B', pos2: '3EFGIJ', local: 'VANCOUVER', horario: '00H', data: '3 JUL' },
    { id: '86', pos1: '1J', pos2: '2H', local: 'MIAMI', horario: '19H', data: '3 JUL' },
    { id: '87', pos1: '1K', pos2: '3DEIJL', local: 'KANSAS CITY', horario: '22H30', data: '3 JUL' },
    { id: '88', pos1: '2D', pos2: '2G', local: 'DALLAS', horario: '15H', data: '3 JUL' }
];

// Template das oitavas
const oitavasTemplate = [
    { id: '89', jogoOrigem1: '74', jogoOrigem2: '77', local: 'FILADÉLFIA', horario: '18H', data: '4 JUL' },
    { id: '90', jogoOrigem1: '73', jogoOrigem2: '75', local: 'HOUSTON', horario: '14H', data: '4 JUL' },
    { id: '91', jogoOrigem1: '76', jogoOrigem2: '78', local: 'NOVA YORK/NOVA JERSEY', horario: '17H', data: '5 JUL' },
    { id: '92', jogoOrigem1: '79', jogoOrigem2: '80', local: 'CIDADE DO MÉXICO', horario: '21H', data: '5 JUL' },
    { id: '93', jogoOrigem1: '83', jogoOrigem2: '84', local: 'DALLAS', horario: '16H', data: '6 JUL' },
    { id: '94', jogoOrigem1: '81', jogoOrigem2: '82', local: 'SEATTLE', horario: '21H', data: '6 JUL' },
    { id: '95', jogoOrigem1: '86', jogoOrigem2: '88', local: 'ATLANTA', horario: '13H', data: '7 JUL' },
    { id: '96', jogoOrigem1: '85', jogoOrigem2: '87', local: 'VANCOUVER', horario: '17H', data: '7 JUL' }
];

// Template das quartas
const quartasTemplate = [
    { id: '97', jogoOrigem1: '89', jogoOrigem2: '90', local: 'BOSTON', horario: '17H', data: '9 JUL' },
    { id: '98', jogoOrigem1: '93', jogoOrigem2: '94', local: 'LOS ANGELES', horario: '16H', data: '10 JUL' },
    { id: '99', jogoOrigem1: '91', jogoOrigem2: '92', local: 'MIAMI', horario: '18H', data: '11 JUL' },
    { id: '100', jogoOrigem1: '95', jogoOrigem2: '96', local: 'KANSAS CITY', horario: '22H', data: '11 JUL' }
];

// Template das semifinais
const semiTemplate = [
    { id: '101', jogoOrigem1: '97', jogoOrigem2: '98', local: 'DALLAS', horario: '16H', data: '14 JUL' },
    { id: '102', jogoOrigem1: '99', jogoOrigem2: '100', local: 'ATLANTA', horario: '16H', data: '15 JUL' }
];

// Template da final
const finalTemplate = { id: '103', jogoOrigem1: '101', jogoOrigem2: '102', local: 'MIAMI', horario: '18H', data: '19 JUL' };

// Template do terceiro lugar
const terceiroTemplate = { id: '104', jogoOrigem1: '101', jogoOrigem2: '102', local: 'NOVA YORK/NOVA JERSEY', horario: '16H', data: '18 JUL' };

let terceirosUsadosGlobal = [];

function getVencedorPorJogoId(jogoId, dezesseisAvosMap, oitavasMap, quartasMap, semiMap) {
    if (dezesseisAvosMap && dezesseisAvosMap[jogoId]) {
        return dezesseisAvosMap[jogoId].vencedor;
    }
    if (oitavasMap && oitavasMap[jogoId]) {
        return oitavasMap[jogoId].vencedor;
    }
    if (quartasMap && quartasMap[jogoId]) {
        return quartasMap[jogoId].vencedor;
    }
    if (semiMap && semiMap[jogoId]) {
        return semiMap[jogoId].vencedor;
    }
    return null;
}

export function initChaveamento() {
    terceirosUsadosGlobal = [];
    
    const dezesseisAvos = confrontos16AvosTemplate.map(confronto => {
        let timeA = getTimePorPosicao(confronto.pos1);
        let timeB = getTimePorPosicao(confronto.pos2);
        
        // APLICA A CUSTOMIZAÇÃO DO USUÁRIO SE EXISTIR
        if (overrideEquipes[confronto.id]) {
            if (overrideEquipes[confronto.id].a) timeA = overrideEquipes[confronto.id].a;
            if (overrideEquipes[confronto.id].b) timeB = overrideEquipes[confronto.id].b;
        }

        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || null,
            timeB: timeB || null,
            local: confronto.local,
            horario: confronto.horario,
            data: confronto.data,
            resultado: results[confronto.id] || null,
            vencedor: null,
            incompleto: incompleto
        };
        
        // O vencedor continua sendo calculado automaticamente pelo placar!
        if (!incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        
        return jogo;
    });
    
    const dezesseisAvosMap = {};
    dezesseisAvos.forEach(j => { dezesseisAvosMap[j.id] = j; });
    
    const oitavas = oitavasTemplate.map(confronto => {
        const timeA = getVencedorPorJogoId(confronto.jogoOrigem1, dezesseisAvosMap, null, null, null);
        const timeB = getVencedorPorJogoId(confronto.jogoOrigem2, dezesseisAvosMap, null, null, null);
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || null,
            timeB: timeB || null,
            local: confronto.local,
            horario: confronto.horario,
            data: confronto.data,
            resultado: results[confronto.id] || null,
            vencedor: null,
            incompleto: incompleto,
            jogoOrigem1: confronto.jogoOrigem1,
            jogoOrigem2: confronto.jogoOrigem2
        };
        
        if (!incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        
        return jogo;
    });
    
    const oitavasMap = {};
    oitavas.forEach(j => { oitavasMap[j.id] = j; });
    
    const quartas = quartasTemplate.map(confronto => {
        const timeA = getVencedorPorJogoId(confronto.jogoOrigem1, dezesseisAvosMap, oitavasMap, null, null);
        const timeB = getVencedorPorJogoId(confronto.jogoOrigem2, dezesseisAvosMap, oitavasMap, null, null);
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || null,
            timeB: timeB || null,
            local: confronto.local,
            horario: confronto.horario,
            data: confronto.data,
            resultado: results[confronto.id] || null,
            vencedor: null,
            incompleto: incompleto,
            jogoOrigem1: confronto.jogoOrigem1,
            jogoOrigem2: confronto.jogoOrigem2
        };
        
        if (!incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        
        return jogo;
    });
    
    const quartasMap = {};
    quartas.forEach(j => { quartasMap[j.id] = j; });
    
    const semi = semiTemplate.map(confronto => {
        const timeA = getVencedorPorJogoId(confronto.jogoOrigem1, dezesseisAvosMap, oitavasMap, quartasMap, null);
        const timeB = getVencedorPorJogoId(confronto.jogoOrigem2, dezesseisAvosMap, oitavasMap, quartasMap, null);
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || null,
            timeB: timeB || null,
            local: confronto.local,
            horario: confronto.horario,
            data: confronto.data,
            resultado: results[confronto.id] || null,
            vencedor: null,
            incompleto: incompleto,
            jogoOrigem1: confronto.jogoOrigem1,
            jogoOrigem2: confronto.jogoOrigem2
        };
        
        if (!incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        
        return jogo;
    });
    
    const semiMap = {};
    semi.forEach(j => { semiMap[j.id] = j; });
    
    let final = null;
    let terceiroLugar = null;
    
    if (semi.length === 2) {
        const s1 = semi[0];
        const s2 = semi[1];
        
        if (s1.vencedor && s2.vencedor) {
            final = {
                id: finalTemplate.id,
                timeA: s1.vencedor,
                timeB: s2.vencedor,
                local: finalTemplate.local,
                horario: finalTemplate.horario,
                data: finalTemplate.data,
                resultado: results[finalTemplate.id] || null,
                vencedor: null,
                incompleto: false
            };
            if (final.resultado) {
                const winner = getWinner({ id: finalTemplate.id }, final.resultado);
                final.vencedor = winner === 'A' ? final.timeA : final.timeB;
            }
        } else {
            final = {
                id: finalTemplate.id,
                timeA: s1.vencedor || null,
                timeB: s2.vencedor || null,
                local: finalTemplate.local,
                horario: finalTemplate.horario,
                data: finalTemplate.data,
                resultado: null,
                vencedor: null,
                incompleto: true
            };
        }
        
        const perdedorS1 = s1.vencedor === s1.timeA ? s1.timeB : s1.timeA;
        const perdedorS2 = s2.vencedor === s2.timeA ? s2.timeB : s2.timeA;
        
        if (perdedorS1 && perdedorS2 && !s1.incompleto && !s2.incompleto) {
            terceiroLugar = {
                id: terceiroTemplate.id,
                timeA: perdedorS1,
                timeB: perdedorS2,
                local: terceiroTemplate.local,
                horario: terceiroTemplate.horario,
                data: terceiroTemplate.data,
                resultado: results[terceiroTemplate.id] || null,
                vencedor: null,
                incompleto: false
            };
            if (terceiroLugar.resultado) {
                const winner = getWinner({ id: terceiroTemplate.id }, terceiroLugar.resultado);
                terceiroLugar.vencedor = winner === 'A' ? terceiroLugar.timeA : terceiroLugar.timeB;
            }
        } else {
            terceiroLugar = {
                id: terceiroTemplate.id,
                timeA: perdedorS1 || null,
                timeB: perdedorS2 || null,
                local: terceiroTemplate.local,
                horario: terceiroTemplate.horario,
                data: terceiroTemplate.data,
                resultado: null,
                vencedor: null,
                incompleto: true
            };
        }
    }
    
    return { dezesseisAvos, oitavas, quartas, semi, final, terceiroLugar };
}

function formatarResultadoPremium(jogo) {
    if (!jogo || !jogo.resultado) return null;
    
    const res = jogo.resultado;
    const tempoNormal = `${res.goalsA} - ${res.goalsB}`;
    const temProrrogacao = res.hasExtraTime;
    const temPenaltis = res.hasPenalties;
    const golsProrrogacao = `${res.etGoalsA || 0} - ${res.etGoalsB || 0}`;
    const golsPenaltis = `${res.penA || 0} - ${res.penB || 0}`;
    const iconPenaltis = temPenaltis ? (res.penA > res.penB ? '🏆' : '⚽') : '';
    
    let html = `<div class="result-premium-container" style="padding: 8px; margin: 0;">`;
    html += `<div class="result-cards" style="gap: 4px;">`;
    html += `<div class="result-card result-card-normal" style="padding: 4px 8px; min-width: 60px;">
        <div class="result-card-title" style="font-size: 8px;">📋 TEMPO</div>
        <div class="result-card-score" style="font-size: 14px;">${tempoNormal}</div>
    </div>`;
    if (temProrrogacao) {
        html += `<div class="result-card result-card-et" style="padding: 4px 8px; min-width: 60px;">
            <div class="result-card-title" style="font-size: 8px;">⏱️ PRO</div>
            <div class="result-card-score" style="font-size: 14px;">${golsProrrogacao}</div>
        </div>`;
    }
    if (temPenaltis) {
        html += `<div class="result-card result-card-penalties" style="padding: 4px 8px; min-width: 60px;">
            <div class="result-card-title" style="font-size: 8px;">⚽ PEN ${iconPenaltis}</div>
            <div class="result-card-score" style="font-size: 14px;">${golsPenaltis}</div>
        </div>`;
    }
    html += `</div></div>`;
    return html;
}

function renderInfoJogo(jogo) {
    if (!jogo || !jogo.local) return '';
    return `
        <div class="jogo-info" style="font-size: 10px; color: var(--text-dim); text-align: center; margin-top: 5px; padding-top: 5px; border-top: 1px solid var(--line);">
            📍 ${jogo.local} | 🕐 ${jogo.horario} | 📅 ${jogo.data}
        </div>
    `;
}

// ============================================
// NOTIFICAÇÃO PREMIUM
// ============================================

function showNotification(message, type = 'success') {
    const notificationModal = document.getElementById('notificationModal');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationConfirmBtn = document.getElementById('notificationConfirmBtn');
    
    if (!notificationModal) return;
    
    const types = {
        success: { icon: '✅', title: 'Sucesso!' },
        error: { icon: '❌', title: 'Erro!' },
        info: { icon: 'ℹ️', title: 'Informação' },
        warning: { icon: '⚠️', title: 'Atenção' }
    };
    
    const config = types[type] || types.success;
    notificationIcon.textContent = config.icon;
    notificationTitle.textContent = config.title;
    notificationMessage.textContent = message;
    
    notificationModal.classList.add('active');
    
    notificationConfirmBtn.onclick = () => {
        notificationModal.classList.remove('active');
    };
    
    notificationModal.onclick = (e) => {
        if (e.target === notificationModal) {
            notificationModal.classList.remove('active');
        }
    };
    
    setTimeout(() => {
        notificationModal.classList.remove('active');
    }, 5000);
}

// ============================================
// RENDERIZAÇÃO PRINCIPAL
// ============================================

export function renderMataMata() {
    const container = document.getElementById('mataMataContainer');
    if (!container) return;
    
    const chave = initChaveamento();
    
    // Verificar se há jogos disponíveis
    const jogosDisponiveis = chave.dezesseisAvos.filter(j => !j.incompleto && j.timeA && j.timeB).length;
    const totalJogos = chave.dezesseisAvos.length;
    
    // Verificar se a fase de grupos está completa
    const temAlgumJogo = chave.dezesseisAvos.some(j => !j.incompleto && j.timeA && j.timeB);
    
    let html = `
        <div class="mata-mata-container">
            <h2 class="mata-mata-title">🏆 FASE DE MATA-MATA</h2>
            <div style="margin-bottom: 20px; padding: 12px; background: var(--card); border-radius: 12px; text-align: center; font-size: 13px; color: var(--gold); border: 1px solid var(--line);">
                ℹ️ Os confrontos vão aparecendo conforme os grupos são finalizados<br>
                <strong>📊 Jogos disponíveis: ${jogosDisponiveis}/${totalJogos}</strong>
            </div>
    `;
    
    // 16-AVOS
    html += `
        <div class="fase-container">
            <h3 class="fase-title">🔥 16-AVOS DE FINAL</h3>
            <div class="jogos-grid">${renderJogosLista(chave.dezesseisAvos, true)}</div>
        </div>
    `;
    
    // OITAVAS - só mostra se houver jogos
    const hasOitavas = chave.oitavas.some(j => !j.incompleto && j.timeA && j.timeB);
    if (hasOitavas) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">⚽ OITAVAS DE FINAL</h3>
                <div class="jogos-grid">${renderJogosLista(chave.oitavas)}</div>
            </div>
        `;
    } else {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">⚽ OITAVAS DE FINAL</h3>
                <div class="empty-message">⏳ Aguardando resultados dos 16-avos...</div>
            </div>
        `;
    }
    
    // QUARTAS
    const hasQuartas = chave.quartas.some(j => !j.incompleto && j.timeA && j.timeB);
    if (hasQuartas) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🏅 QUARTAS DE FINAL</h3>
                <div class="jogos-grid">${renderJogosLista(chave.quartas)}</div>
            </div>
        `;
    } else {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🏅 QUARTAS DE FINAL</h3>
                <div class="empty-message">⏳ Aguardando resultados das oitavas...</div>
            </div>
        `;
    }
    
    // SEMIFINAIS
    const hasSemi = chave.semi.some(j => !j.incompleto && j.timeA && j.timeB);
    if (hasSemi) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🌟 SEMIFINAIS</h3>
                <div class="jogos-grid semi-grid">${renderJogosLista(chave.semi)}</div>
            </div>
        `;
    } else {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🌟 SEMIFINAIS</h3>
                <div class="empty-message">⏳ Aguardando resultados das quartas...</div>
            </div>
        `;
    }
    
    // FINAIS
    if (chave.final || chave.terceiroLugar) {
        html += `<div class="finais-container">`;
        
        if (chave.terceiroLugar) {
            html += `
            <div class="terceiro-card">
                <h3 class="terceiro-title">🥉 TERCEIRO LUGAR</h3>
                ${renderJogoFinal(chave.terceiroLugar, true)}
            </div>
            `;
        }
        
        if (chave.final) {
            html += `
            <div class="final-card">
                <h3 class="final-title">🏆 GRANDE FINAL</h3>
                ${renderJogoFinal(chave.final, false)}
            </div>
            `;
        }
        
        html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Adiciona eventos de clique
    document.querySelectorAll('.mata-mata-jogo').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.btn-override')) return;
            
            const jogoId = el.dataset.jogoId;
            const jogo = encontrarJogoPorId(chave, jogoId);
            if (jogo && jogo.timeA && jogo.timeB && !jogo.incompleto) {
                abrirModalMataMata(jogo);
            } else if (jogo && jogo.incompleto) {
                showNotification('⏳ Este confronto ainda não está disponível. Complete os jogos da fase de grupos.', 'warning');
            } else if (!jogo) {
                showNotification('⏳ Aguardando definição dos classificados.', 'info');
            }
        });
    });
}

// ============================================
// RENDER JOGOS LISTA - VERSÃO CORRIGIDA
// ============================================

function renderJogosLista(jogos, is16Avos = false) {
    if (!jogos || jogos.length === 0) {
        return '<div class="empty-message">⏳ Aguardando definição dos confrontos...</div>';
    }
    
    return jogos.map(jogo => {
        const hasRealTeams = jogo.timeA && jogo.timeB;
        
        // --- BOTÃO DE EDITAR ---
        let editBtn = '';
        if (is16Avos) {
            // Mudamos a verificação para usar a nova variável overrideEquipes
            const isOverridden = overrideEquipes[jogo.id] ? true : false;
            editBtn = `
                <button class="btn-override" 
                        style="position: absolute; top: 8px; right: 10px; z-index: 10;
                               background:${isOverridden ? '#ff9800' : 'rgba(255,255,255,0.05)'}; 
                               border:1px solid ${isOverridden ? '#ff9800' : 'var(--line)'}; 
                               border-radius:6px; font-size:10px; padding:4px 8px; cursor:pointer;
                               color:${isOverridden ? '#fff' : 'var(--text-dim)'}; transition: all 0.2s ease;"
                        onclick="event.stopPropagation(); abrirModalOverride('${jogo.id}', '${jogo.timeA}', '${jogo.timeB}');">
                        ⚙️ EDITAR
                       </button>
            `;
        }

        // Jogos incompletos
        if (jogo.incompleto || !hasRealTeams) {
            return `
            <div class="mata-mata-jogo incomplete" data-jogo-id="${jogo.id}" style="position: relative;">
                ${editBtn}
                <div class="jogo-time">
                    <span class="jogo-flag">⏳</span>
                    <span class="jogo-nome" style="color: var(--text-dim);">Aguardando...</span>
                </div>
                <div class="jogo-placar-container">
                    <span class="jogo-placar" style="color: var(--text-dim);">?</span>
                </div>
                <div class="jogo-time">
                    <span class="jogo-nome" style="color: var(--text-dim);">Aguardando...</span>
                    <span class="jogo-flag">⏳</span>
                </div>
                ${jogo.local ? `<div class="jogo-info" style="opacity: 0.5;">📍 ${jogo.local} | 🕐 ${jogo.horario} | 📅 ${jogo.data}</div>` : ''}
            </div>
            `;
        }
        
        const resultadoHTML = formatarResultadoPremium(jogo);
        
        return `
            <div class="mata-mata-jogo ${jogo.resultado ? 'realizado' : ''}" 
                 data-jogo-id="${jogo.id}" style="position: relative;">
                ${editBtn}
                <div class="jogo-time ${jogo.vencedor === jogo.timeA ? 'vencedor' : ''}">
                    <span class="jogo-flag">${getBandeira(jogo.timeA)}</span>
                    <span class="jogo-nome">${jogo.timeA}</span>
                </div>
                <div class="jogo-placar-container">
                    ${resultadoHTML || '<span class="jogo-placar">x</span>'}
                </div>
                <div class="jogo-time ${jogo.vencedor === jogo.timeB ? 'vencedor' : ''}">
                    <span class="jogo-nome">${jogo.timeB}</span>
                    <span class="jogo-flag">${getBandeira(jogo.timeB)}</span>
                </div>
                ${jogo.local ? `<div class="jogo-info">📍 ${jogo.local} | 🕐 ${jogo.horario} | 📅 ${jogo.data}</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderJogoFinal(jogo, isTerceiro = false) {
    if (!jogo) return '<div class="empty">Aguardando...</div>';
    
    const hasRealTeams = jogo.timeA && jogo.timeB;
    const resultadoHTML = formatarResultadoPremium(jogo);
    const isIncomplete = jogo.incompleto || !hasRealTeams;
    const jogoClass = isTerceiro ? 'mata-mata-jogo final-jogo terceiro-jogo' : 'mata-mata-jogo final-jogo';
    
    return `
    <div class="${jogoClass} ${jogo.resultado ? 'realizado' : ''} ${isIncomplete ? 'incomplete' : ''}"
         data-jogo-id="${jogo.id}"
         style="${isIncomplete ? 'opacity: 0.6;' : ''}">
        <div class="jogo-time ${jogo.vencedor === jogo.timeA ? 'vencedor' : ''}">
            <span class="jogo-flag">${isIncomplete ? '🏆' : getBandeira(jogo.timeA)}</span>
            <span class="jogo-nome final-nome">${jogo.timeA || '???'}</span>
        </div>
        <div class="jogo-placar-container">
            ${resultadoHTML || '<span class="jogo-placar final-placar">x</span>'}
        </div>
        <div class="jogo-time ${jogo.vencedor === jogo.timeB ? 'vencedor' : ''}">
            <span class="jogo-nome final-nome">${jogo.timeB || '???'}</span>
            <span class="jogo-flag">${isIncomplete ? '🏆' : getBandeira(jogo.timeB)}</span>
        </div>
        ${jogo.local ? `<div class="jogo-info">📍 ${jogo.local} | 🕐 ${jogo.horario} | 📅 ${jogo.data}</div>` : ''}
    </div>
    `;
}

function encontrarJogoPorId(chave, id) {
    const todasFases = [
        ...(chave.dezesseisAvos || []),
        ...(chave.oitavas || []),
        ...(chave.quartas || []),
        ...(chave.semi || []),
        chave.final,
        chave.terceiroLugar
    ].filter(Boolean);
    return todasFases.find(j => j.id === id);
}

function abrirModalMataMata(jogo) {
    if (!jogo.timeA || !jogo.timeB || jogo.incompleto) return;
    
    const match = {
        id: jogo.id,
        a: jogo.timeA,
        b: jogo.timeB,
        // CORREÇÃO: Passamos apenas o nome, o getBandeira fará o resto no resultados.js
        fa: jogo.timeA, 
        fb: jogo.timeB, 
        venue: jogo.local || 'Mata-Mata',
        time: jogo.horario || '00:00',
        date: jogo.data || new Date().toISOString().split('T')[0],
        g: 'MM'
    };
    
    import('./resultados.js').then(module => {
        module.openModal(match, () => {
            renderMataMata();
            if (typeof window.renderClassificacao === 'function') {
                window.renderClassificacao();
            }
            if (typeof window.renderEstatisticas === 'function') {
                window.renderEstatisticas();
            }
        });
    });
}