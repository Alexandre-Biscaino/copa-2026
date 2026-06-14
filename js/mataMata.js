// ============================================
// MATA-MATA - Chaveamento Completo (48 Seleções)
// COM EXIBIÇÃO PARCIAL ENQUANTO GRUPOS NÃO TERMINAM
// CORRIGIDO CONFORME TABELA OFICIAL
// ============================================

import { results, saveMatchResult, getWinner } from './storage.js';
import { getClassificacao, getMelhoresTerceiros } from './classificacao.js';
import { getMatchResultText, getMatchResultTextSimple } from './resultados.js';
import { getBandeira } from './bandeiras.js';

// --- SISTEMA DE OVERRIDE MANUAL PARA 16-AVOS ---
const overrides16Avos = JSON.parse(localStorage.getItem('overrides16Avos') || '{}');

window.forcarVencedor16 = function(jogoId, timeVencedor) {
    if(timeVencedor && timeVencedor.trim()) {
        overrides16Avos[jogoId] = timeVencedor.trim();
    } else {
        delete overrides16Avos[jogoId];
    }
    localStorage.setItem('overrides16Avos', JSON.stringify(overrides16Avos));
    renderMataMata();
    alert(`✅ Classificado alterado com sucesso!\n\nO time ${timeVencedor} avançará para as oitavas.`);
};

// Template dos confrontos de 16-avos - Conforme tabela oficial
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
    { id: '85', pos1: '1B', pos2: '3EFGIJ', local: 'VANCOUVER', horario: '8H', data: '3 JUL' },
    { id: '86', pos1: '1J', pos2: '2H', local: 'MIAMI', horario: '19H', data: '3 JUL' },
    { id: '87', pos1: '1K', pos2: '3DEIJL', local: 'KANSAS CITY', horario: '22H30', data: '3 JUL' },
    { id: '88', pos1: '2D', pos2: '2G', local: 'DALLAS', horario: '15H', data: '3 JUL' }
];

// Template das oitavas
const oitavasTemplate = [
    { id: '89', jogoOrigem1: '74', jogoOrigem2: '77', local: 'FILADÉLFIA', horario: '18H', data: '4 JUL' },
    { id: '90', jogoOrigem1: '73', jogoOrigem2: '75', local: 'HOUSTON', horario: '14H', data: '4 JUL' },
    { id: '91', jogoOrigem1: '76', jogoOrigem2: '79', local: 'NOVA YORK/NOVA JERSEY', horario: '17H', data: '5 JUL' },
    { id: '92', jogoOrigem1: '83', jogoOrigem2: '81', local: 'CIDADE DO MÉXICO', horario: '21H', data: '5 JUL' },
    { id: '93', jogoOrigem1: '84', jogoOrigem2: '82', local: 'DALLAS', horario: '16H', data: '6 JUL' },
    { id: '94', jogoOrigem1: '86', jogoOrigem2: '85', local: 'SEATTLE', horario: '21H', data: '6 JUL' },
    { id: '95', jogoOrigem1: '88', jogoOrigem2: '87', local: 'ATLANTA', horario: '13H', data: '7 JUL' },
    { id: '96', jogoOrigem1: '80', jogoOrigem2: '78', local: 'VANCOUVER', horario: '17H', data: '7 JUL' }
];

// Template das quartas
const quartasTemplate = [
    { id: '97', jogoOrigem1: '89', jogoOrigem2: '90', local: 'BOSTON', horario: '17H', data: '9 JUL' },
    { id: '98', jogoOrigem1: '93', jogoOrigem2: '94', local: 'LOS ANGELES', horario: '16H', data: '18 JUL' },
    { id: '99', jogoOrigem1: '91', jogoOrigem2: '92', local: 'MIAMI', horario: '18H', data: '11 JUL' },
    { id: '100', jogoOrigem1: '95', jogoOrigem2: '96', local: 'KANSAS CITY', horario: '22H', data: '11 JUL' }
];

// Template das semifinais
const semiTemplate = [
    { id: '101', jogoOrigem1: '97', jogoOrigem2: '98', local: 'DALLAS', horario: '16H', data: '14 JUL' },
    { id: '102', jogoOrigem1: '99', jogoOrigem2: '100', local: 'ATLANTA', horario: '16H', data: '15 JUL' }
];

// Template da final
const finalTemplate = { id: '103', jogoOrigem1: '101', jogoOrigem2: '102', local: 'MIAMI', horario: '18H', data: '18 JUL' };

// Template do terceiro lugar
const terceiroTemplate = { id: '104', jogoOrigem1: '101', jogoOrigem2: '102', local: 'MIAMI', horario: '15H', data: '17 JUL' };

// Variável global para controle de terceiros usados
let terceirosUsadosGlobal = [];

function getTimePorPosicao(posicao) {
    const classificacao = getClassificacao();
    const melhoresTerceiros = getMelhoresTerceiros();
    
    // Formato: "1A", "2B", "3ABCDEF" etc.
    if (posicao.startsWith('1') || posicao.startsWith('2')) {
        const grupo = posicao.charAt(1);
        const pos = parseInt(posicao.charAt(0)) - 1;
        
        const ranking = classificacao[grupo];
        if (ranking && ranking[pos] && ranking[pos].jogos === 3) {
            return ranking[pos].time;
        }
        return null;
    }
    
    if (posicao.startsWith('3')) {
        // Formato: "3ABCDEF" - grupos possíveis para terceiros
        const gruposPossiveis = posicao.substring(1).split('');
        
        // Pega os melhores terceiros classificados
        for (let i = 0; i < melhoresTerceiros.length; i++) {
            const terceiro = melhoresTerceiros[i];
            if (gruposPossiveis.includes(terceiro.grupo)) {
                // Verifica se já foi usado em outro confronto
                if (!terceirosUsadosGlobal.includes(terceiro.time)) {
                    terceirosUsadosGlobal.push(terceiro.time);
                    return terceiro.time;
                }
            }
        }
    }
    
    return null;
}

// Função para obter vencedor de um jogo por ID
function getVencedorPorJogoId(jogoId, dezesseisAvosMap, oitavasMap, quartasMap, semiMap) {
    // Primeiro verifica nos 16-avos
    if (dezesseisAvosMap && dezesseisAvosMap[jogoId]) {
        return dezesseisAvosMap[jogoId].vencedor;
    }
    // Depois nas oitavas
    if (oitavasMap && oitavasMap[jogoId]) {
        return oitavasMap[jogoId].vencedor;
    }
    // Depois nas quartas
    if (quartasMap && quartasMap[jogoId]) {
        return quartasMap[jogoId].vencedor;
    }
    // Depois nas semi
    if (semiMap && semiMap[jogoId]) {
        return semiMap[jogoId].vencedor;
    }
    return null;
}

export function initChaveamento() {
    // Reseta o controle de terceiros usados
    terceirosUsadosGlobal = [];
    
    // 1. 16-AVOS DE FINAL (16 jogos)
    const dezesseisAvos = confrontos16AvosTemplate.map(confronto => {
        const timeA = getTimePorPosicao(confronto.pos1);
        const timeB = getTimePorPosicao(confronto.pos2);
        
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || `🏁 ${confronto.pos1}`,
            timeB: timeB || `🏁 ${confronto.pos2}`,
            local: confronto.local,
            horario: confronto.horario,
            data: confronto.data,
            resultado: results[confronto.id] || null,
            vencedor: null,
            incompleto: incompleto
        };
        
        // Aplica overrides
        if (!incompleto && overrides16Avos[confronto.id]) {
            const overrideWinner = overrides16Avos[confronto.id];
            if (overrideWinner === jogo.timeA || overrideWinner === jogo.timeB) {
                jogo.vencedor = overrideWinner;
            }
        }
        
        // Calcula vencedor pelo resultado
        if (!jogo.vencedor && !incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        
        return jogo;
    });
    
    // Cria maps para acesso rápido
    const dezesseisAvosMap = {};
    dezesseisAvos.forEach(j => { dezesseisAvosMap[j.id] = j; });
    
    // 2. OITAVAS
    const oitavas = oitavasTemplate.map(confronto => {
        const timeA = getVencedorPorJogoId(confronto.jogoOrigem1, dezesseisAvosMap, null, null, null);
        const timeB = getVencedorPorJogoId(confronto.jogoOrigem2, dezesseisAvosMap, null, null, null);
        
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || `🏆 VENC.${confronto.jogoOrigem1}`,
            timeB: timeB || `🏆 VENC.${confronto.jogoOrigem2}`,
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
    
    // 3. QUARTAS
    const quartas = quartasTemplate.map(confronto => {
        const timeA = getVencedorPorJogoId(confronto.jogoOrigem1, dezesseisAvosMap, oitavasMap, null, null);
        const timeB = getVencedorPorJogoId(confronto.jogoOrigem2, dezesseisAvosMap, oitavasMap, null, null);
        
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || `🏆 VENC.${confronto.jogoOrigem1}`,
            timeB: timeB || `🏆 VENC.${confronto.jogoOrigem2}`,
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
    
    // 4. SEMIFINAIS
    const semi = semiTemplate.map(confronto => {
        const timeA = getVencedorPorJogoId(confronto.jogoOrigem1, dezesseisAvosMap, oitavasMap, quartasMap, null);
        const timeB = getVencedorPorJogoId(confronto.jogoOrigem2, dezesseisAvosMap, oitavasMap, quartasMap, null);
        
        const incompleto = (!timeA || !timeB);
        
        const jogo = {
            id: confronto.id,
            timeA: timeA || `🏆 VENC.${confronto.jogoOrigem1}`,
            timeB: timeB || `🏆 VENC.${confronto.jogoOrigem2}`,
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
    
    // 5. FINAL
    let final = null;
    let terceiroLugar = null;
    
    if (semi.length === 2) {
        const s1 = semi[0];
        const s2 = semi[1];
        
        // Final
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
                timeA: s1.vencedor || '🏆 VENC.101',
                timeB: s2.vencedor || '🏆 VENC.102',
                local: finalTemplate.local,
                horario: finalTemplate.horario,
                data: finalTemplate.data,
                resultado: null,
                vencedor: null,
                incompleto: true
            };
        }
        
        // Terceiro lugar
        const perdedorS1 = s1.vencedor === s1.timeA ? s1.timeB : s1.timeA;
        const perdedorS2 = s2.vencedor === s2.timeA ? s2.timeB : s2.timeA;
        
        if (perdedorS1 && perdedorS2 && !s1.incompleto && !s2.incompleto && 
            !perdedorS1.includes('🏆') && !perdedorS2.includes('🏆')) {
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
                timeA: perdedorS1 || '🥉 PERD.101',
                timeB: perdedorS2 || '🥉 PERD.102',
                local: terceiroTemplate.local,
                horario: terceiroTemplate.horario,
                data: terceiroTemplate.data,
                resultado: null,
                vencedor: null,
                incompleto: true
            };
        }
    }
    
    return {
        dezesseisAvos,
        oitavas,
        quartas,
        semi,
        final,
        terceiroLugar,
    };
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
    if (!jogo.local) return '';
    return `
        <div class="jogo-info" style="font-size: 10px; color: #aaa; text-align: center; margin-top: 5px; padding-top: 5px; border-top: 1px solid #333;">
            📍 ${jogo.local} | 🕐 ${jogo.horario} | 📅 ${jogo.data}
        </div>
    `;
}

export function renderMataMata() {
    const container = document.getElementById('mataMataContainer');
    if (!container) return;
    
    const chave = initChaveamento();
    
    // Conta quantos jogos estão disponíveis
    const jogosDisponiveis = chave.dezesseisAvos.filter(j => !j.incompleto && j.timeA && j.timeB && !j.timeA.includes('🏁') && !j.timeB.includes('🏁')).length;
    
    let html = `
        <div class="mata-mata-container">
            <h2 class="mata-mata-title">🏆 FASE DE MATA-MATA</h2>
            <div style="margin-bottom: 15px; padding: 8px; background: #2a2a2a; border-radius: 8px; text-align: center; font-size: 12px; color: #ffd700;">
                ℹ️ Os confrontos vão aparecendo conforme os grupos são finalizados<br>
                <strong>📊 Jogos disponíveis: ${jogosDisponiveis}/16</strong>
            </div>
            
            <div class="fase-container">
                <h3 class="fase-title">🔥 16-AVOS DE FINAL</h3>
                <div class="jogos-grid">${renderJogosLista(chave.dezesseisAvos, true)}</div>
            </div>
    `;
    
    // Só mostra fases seguintes se houver jogos avançados
    const hasOitavas = chave.oitavas.some(j => !j.incompleto);
    if (hasOitavas || chave.oitavas.length > 0) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">⚽ OITAVAS DE FINAL</h3>
                <div class="jogos-grid oitavas-grid">${renderJogosLista(chave.oitavas)}</div>
            </div>
        `;
    } else {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">⚽ OITAVAS DE FINAL</h3>
                <div class="empty-message">Aguardando resultados dos 16-avos...</div>
            </div>
        `;
    }
    
    const hasQuartas = chave.quartas.some(j => !j.incompleto);
    if (hasQuartas) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🏅 QUARTAS DE FINAL</h3>
                <div class="jogos-grid quartas-grid">${renderJogosLista(chave.quartas)}</div>
            </div>
        `;
    } else {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🏅 QUARTAS DE FINAL</h3>
                <div class="empty-message">Aguardando resultados das oitavas...</div>
            </div>
        `;
    }
    
    const hasSemi = chave.semi.some(j => !j.incompleto);
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
                <div class="empty-message">Aguardando resultados das quartas...</div>
            </div>
        `;
    }
    
    if (chave.final) {
        const hasFinal = !chave.final.incompleto;
        html += `
            <div class="final-container">
                <div class="final-card">
                    <h3 class="final-title">🏆 FINAL</h3>
                    ${renderJogoFinal(chave.final)}
                </div>
            </div>
        `;
    }
    
    if (chave.terceiroLugar) {
        html += `
            <div class="terceiro-card">
                <h3 class="terceiro-title">🥉 TERCEIRO LUGAR</h3>
                ${renderJogoFinal(chave.terceiroLugar)}
            </div>
        `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Adiciona eventos de clique
    document.querySelectorAll('.mata-mata-jogo').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.btn-override')) return;
            
            const jogoId = el.dataset.jogoId;
            const jogo = encontrarJogoPorId(chave, jogoId);
            if (jogo && jogo.timeA && jogo.timeB && !jogo.incompleto && 
                !jogo.timeA.includes('🏁') && !jogo.timeB.includes('🏁') && 
                !jogo.timeA.includes('🏆') && !jogo.timeB.includes('🏆') &&
                !jogo.timeA.includes('🥉') && !jogo.timeB.includes('🥉')) {
                abrirModalMataMata(jogo);
            } else if (jogo && jogo.incompleto) {
                alert('⏳ Este confronto ainda não está disponível.\nComplete os jogos da fase de grupos para definir os classificados.');
            } else if (jogo && (jogo.timeA.includes('🏁') || jogo.timeB.includes('🏁'))) {
                alert('⏳ Aguardando definição dos classificados dos grupos.');
            }
        });
    });
}

function renderJogosLista(jogos, is16Avos = false) {
    if (!jogos || jogos.length === 0) {
        return '<div class="empty">Aguardando definição dos confrontos...</div>';
    }
    
    return jogos.map(jogo => {
        const hasRealTeams = jogo.timeA && jogo.timeB && 
                            !jogo.timeA.includes('🏁') && !jogo.timeB.includes('🏁') &&
                            !jogo.timeA.includes('🏆') && !jogo.timeB.includes('🏆') &&
                            !jogo.timeA.includes('🥉') && !jogo.timeB.includes('🥉');
        
        // Se o jogo está incompleto (time faltando), mostra placeholder
        if (jogo.incompleto || !hasRealTeams) {
            return `
                <div class="mata-mata-jogo incomplete" style="opacity: 0.6; background: #1a1a2e;">
                    <div class="jogo-time">
                        <span class="jogo-flag">⏳</span>
                        <span class="jogo-nome" style="color: #888;">${jogo.timeA || 'Aguardando...'}</span>
                    </div>
                    <div class="jogo-placar-container">
                        <span class="jogo-placar">?</span>
                    </div>
                    <div class="jogo-time">
                        <span class="jogo-nome" style="color: #888;">${jogo.timeB || 'Aguardando...'}</span>
                        <span class="jogo-flag">⏳</span>
                    </div>
                    ${renderInfoJogo(jogo)}
                </div>
            `;
        }
        
        const resultadoHTML = formatarResultadoPremium(jogo);
        
        let editBtn = '';
        if (is16Avos && jogo.resultado) {
            const isOverridden = overrides16Avos[jogo.id] ? true : false;
            const overrideText = isOverridden ? ' (Override ativo)' : '';
            
            editBtn = `
                <button class="btn-override" 
                        style="background:${isOverridden ? '#ff9800' : 'var(--card)'}; 
                               border:1px solid #fff; 
                               border-radius:5px; 
                               font-size:10px; 
                               padding:3px 6px; 
                               cursor:pointer;
                               color:white;
                               margin-bottom: 5px;"
                        onclick="event.stopPropagation();
                                 if(confirm('Deseja forçar/alterar o classificado dessa partida?')){ 
                                     const w = prompt('Digite o nome EXATO do classificado (${jogo.timeA} ou ${jogo.timeB}) ou deixe em branco para resetar:'); 
                                     if(w && w.trim()) forcarVencedor16('${jogo.id}', w.trim());
                                     else if(w === '') forcarVencedor16('${jogo.id}', '');
                                 }">
                        ⚙️ EDITAR${overrideText}
                       </button>
            `;
        }
        
        return `
            <div class="mata-mata-jogo ${jogo.resultado ? 'realizado' : ''}" 
                 data-jogo-id="${jogo.id}"
                 style="position: relative;">
                ${editBtn ? `<div style="position: absolute; top: -12px; right: 5px; z-index: 10;">${editBtn}</div>` : ''}
                <div class="jogo-time ${jogo.vencedor === jogo.timeA ? 'vencedor' : ''}">
                    <span class="jogo-flag">${getBandeira(jogo.timeA)}</span>
                    <span class="jogo-nome">${jogo.timeA || '???'}</span>
                </div>
                <div class="jogo-placar-container">
                    ${resultadoHTML || '<span class="jogo-placar">x</span>'}
                </div>
                <div class="jogo-time ${jogo.vencedor === jogo.timeB ? 'vencedor' : ''}">
                    <span class="jogo-nome">${jogo.timeB || '???'}</span>
                    <span class="jogo-flag">${getBandeira(jogo.timeB)}</span>
                </div>
                ${renderInfoJogo(jogo)}
            </div>
        `;
    }).join('');
}

function renderJogoFinal(jogo) {
    if (!jogo) return '<div class="empty">Aguardando...</div>';
    
    const hasRealTeams = jogo.timeA && jogo.timeB && 
                        !jogo.timeA.includes('🏁') && !jogo.timeB.includes('🏁') &&
                        !jogo.timeA.includes('🏆') && !jogo.timeB.includes('🏆') &&
                        !jogo.timeA.includes('🥉') && !jogo.timeB.includes('🥉');
    
    const resultadoHTML = formatarResultadoPremium(jogo);
    const isIncomplete = jogo.incompleto || !hasRealTeams;
    
    return `
        <div class="mata-mata-jogo final-jogo ${jogo.resultado ? 'realizado' : ''} ${isIncomplete ? 'incomplete' : ''}" 
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
            ${renderInfoJogo(jogo)}
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
    if (jogo.timeA.includes('🏁') || jogo.timeB.includes('🏁')) return;
    if (jogo.timeA.includes('🏆') || jogo.timeB.includes('🏆')) return;
    if (jogo.timeA.includes('🥉') || jogo.timeB.includes('🥉')) return;
    
    const match = {
        id: jogo.id,
        a: jogo.timeA,
        b: jogo.timeB,
        fa: getBandeira(jogo.timeA),
        fb: getBandeira(jogo.timeB),
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