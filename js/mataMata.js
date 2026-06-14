// ============================================
// MATA-MATA - Chaveamento Completo (48 Seleções)
// COM EXIBIÇÃO PARCIAL ENQUANTO GRUPOS NÃO TERMINAM
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

// Template dos confrontos de 16-avos
const confrontos16AvosTemplate = [
    { id: '16A_1', pos1: '1A', pos2: '3CDF' }, { id: '16A_2', pos1: '2B', pos2: '1F' },
    { id: '16A_3', pos1: '1C', pos2: '3ABF' }, { id: '16A_4', pos1: '2D', pos2: '1E' },
    { id: '16A_5', pos1: '1G', pos2: '3EHI' }, { id: '16A_6', pos1: '2H', pos2: '1J' },
    { id: '16A_7', pos1: '1I', pos2: '3DJK' }, { id: '16A_8', pos1: '2K', pos2: '1L' },
    { id: '16A_9', pos1: '1B', pos2: '3ADF' }, { id: '16A_10', pos1: '2F', pos2: '1A' },
    { id: '16A_11', pos1: '1D', pos2: '3BEG' }, { id: '16A_12', pos1: '2E', pos2: '1C' },
    { id: '16A_13', pos1: '1H', pos2: '3FGI' }, { id: '16A_14', pos1: '2J', pos2: '1G' },
    { id: '16A_15', pos1: '1K', pos2: '3HIL' }, { id: '16A_16', pos1: '2L', pos2: '1I' }
];

function getTimePorPosicao(posicao) {
    const classificacao = getClassificacao();
    const melhoresTerceiros = getMelhoresTerceiros();
    const pos = posicao.charAt(0);
    const grupo = posicao.charAt(1);
    
    if (pos === '1' || pos === '2') {
        const ranking = classificacao[grupo];
        const idx = parseInt(pos) - 1;
        if (ranking && ranking[idx] && ranking[idx].jogos === 3) {
            return ranking[idx].time;
        }
        return null;
    }
    
    if (pos === '3') {
        const gruposPossiveis = posicao.substring(1).split('');
        for (let g of gruposPossiveis) {
            const ranking = classificacao[g];
            if (ranking && ranking[2] && ranking[2].jogos === 3) {
                const terceiro = melhoresTerceiros.find(t => t.grupo === g);
                if (terceiro && terceiro.time === ranking[2].time) {
                    return terceiro.time;
                }
            }
        }
    }
    return null;
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

export function initChaveamento() {
    // 1. 16-AVOS DE FINAL (16 jogos) - monta apenas os que têm os dois times definidos
    const dezesseisAvos = confrontos16AvosTemplate
        .map(confronto => {
            const timeA = getTimePorPosicao(confronto.pos1);
            const timeB = getTimePorPosicao(confronto.pos2);
            
            // Se algum time não existe, retorna jogo incompleto (placeholders)
            if (!timeA || !timeB) {
                return {
                    id: confronto.id,
                    timeA: timeA || `🏁 ${confronto.pos1}`,
                    timeB: timeB || `🏁 ${confronto.pos2}`,
                    resultado: null,
                    vencedor: null,
                    incompleto: true
                };
            }
            
            return {
                id: confronto.id,
                timeA: timeA,
                timeB: timeB,
                resultado: results[confronto.id] || null,
                vencedor: null,
                incompleto: false
            };
        });
    
    // Aplica overrides e calcula vencedores
    dezesseisAvos.forEach(jogo => {
        if (jogo.incompleto) return;
        
        if (overrides16Avos[jogo.id]) {
            const overrideWinner = overrides16Avos[jogo.id];
            if (overrideWinner === jogo.timeA || overrideWinner === jogo.timeB) {
                jogo.vencedor = overrideWinner;
            }
        }
        
        if (!jogo.vencedor && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
    });
    
    // 2. OITAVAS - só mostra se ambos os times existirem
    const oitavas = [];
    for (let i = 0; i < dezesseisAvos.length; i += 2) {
        const jogo1 = dezesseisAvos[i];
        const jogo2 = dezesseisAvos[i+1];
        
        let timeA = (jogo1 && jogo1.vencedor) ? jogo1.vencedor : null;
        let timeB = (jogo2 && jogo2.vencedor) ? jogo2.vencedor : null;
        
        const jogo = {
            id: `O${Math.floor(i/2)+1}`,
            timeA: timeA,
            timeB: timeB,
            resultado: results[`O${Math.floor(i/2)+1}`] || null,
            vencedor: null,
            incompleto: (!timeA || !timeB)
        };
        
        if (!jogo.incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        oitavas.push(jogo);
    }
    
    // 3. QUARTAS
    const quartas = [];
    for (let i = 0; i < oitavas.length; i += 2) {
        const jogo1 = oitavas[i];
        const jogo2 = oitavas[i+1];
        
        let timeA = (jogo1 && jogo1.vencedor) ? jogo1.vencedor : null;
        let timeB = (jogo2 && jogo2.vencedor) ? jogo2.vencedor : null;
        
        const jogo = {
            id: `Q${Math.floor(i/2)+1}`,
            timeA: timeA,
            timeB: timeB,
            resultado: results[`Q${Math.floor(i/2)+1}`] || null,
            vencedor: null,
            incompleto: (!timeA || !timeB)
        };
        
        if (!jogo.incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        quartas.push(jogo);
    }
    
    // 4. SEMIFINAIS
    const semi = [];
    for (let i = 0; i < quartas.length; i += 2) {
        const jogo1 = quartas[i];
        const jogo2 = quartas[i+1];
        
        let timeA = (jogo1 && jogo1.vencedor) ? jogo1.vencedor : null;
        let timeB = (jogo2 && jogo2.vencedor) ? jogo2.vencedor : null;
        
        const jogo = {
            id: `S${Math.floor(i/2)+1}`,
            timeA: timeA,
            timeB: timeB,
            resultado: results[`S${Math.floor(i/2)+1}`] || null,
            vencedor: null,
            incompleto: (!timeA || !timeB)
        };
        
        if (!jogo.incompleto && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
        semi.push(jogo);
    }
    
    // 5. FINAL
    let final = null;
    let terceiroLugar = null;
    
    if (semi.length === 2) {
        const s1 = semi[0];
        const s2 = semi[1];
        
        if (s1.vencedor && s2.vencedor) {
            final = {
                id: 'F1',
                timeA: s1.vencedor,
                timeB: s2.vencedor,
                resultado: results['F1'] || null,
                vencedor: null,
                incompleto: false
            };
            if (final.resultado) {
                const winner = getWinner({ id: 'F1' }, final.resultado);
                final.vencedor = winner === 'A' ? final.timeA : final.timeB;
            }
        } else {
            final = {
                id: 'F1',
                timeA: s1.vencedor || '🏆 ?',
                timeB: s2.vencedor || '🏆 ?',
                resultado: null,
                vencedor: null,
                incompleto: true
            };
        }
        
        // Terceiro lugar
        const perdedorS1 = s1.vencedor === s1.timeA ? s1.timeB : s1.timeA;
        const perdedorS2 = s2.vencedor === s2.timeA ? s2.timeB : s2.timeA;
        
        if (perdedorS1 && perdedorS2 && !s1.incompleto && !s2.incompleto) {
            terceiroLugar = {
                id: 'T1',
                timeA: perdedorS1,
                timeB: perdedorS2,
                resultado: results['T1'] || null,
                vencedor: null,
                incompleto: false
            };
            if (terceiroLugar.resultado) {
                const winner = getWinner({ id: 'T1' }, terceiroLugar.resultado);
                terceiroLugar.vencedor = winner === 'A' ? terceiroLugar.timeA : terceiroLugar.timeB;
            }
        } else {
            terceiroLugar = {
                id: 'T1',
                timeA: perdedorS1 || '🥉 ?',
                timeB: perdedorS2 || '🥉 ?',
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

export function renderMataMata() {
    const container = document.getElementById('mataMataContainer');
    if (!container) return;
    
    const chave = initChaveamento();
    
    // SEMPRE RENDERIZA O CHAVEAMENTO, mesmo incompleto
    let html = `
        <div class="mata-mata-container">
            <h2 class="mata-mata-title">🏆 FASE DE MATA-MATA</h2>
            <div style="margin-bottom: 15px; padding: 8px; background: #2a2a2a; border-radius: 8px; text-align: center; font-size: 12px; color: #ffd700;">
                ℹ️ Os confrontos vão aparecendo conforme os grupos são finalizados
            </div>
            
            <div class="fase-container">
                <h3 class="fase-title">🔥 16-AVOS DE FINAL</h3>
                <div class="jogos-grid">${renderJogosLista(chave.dezesseisAvos, true)}</div>
            </div>
    `;
    
    if (chave.oitavas.length > 0) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">⚽ OITAVAS DE FINAL</h3>
                <div class="jogos-grid">${renderJogosLista(chave.oitavas)}</div>
            </div>
        `;
    }
    
    if (chave.quartas.length > 0) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🏅 QUARTAS DE FINAL</h3>
                <div class="jogos-grid">${renderJogosLista(chave.quartas)}</div>
            </div>
        `;
    }
    
    if (chave.semi.length > 0) {
        html += `
            <div class="fase-container">
                <h3 class="fase-title">🌟 SEMIFINAIS</h3>
                <div class="jogos-grid semi-grid">${renderJogosLista(chave.semi)}</div>
            </div>
        `;
    }
    
    if (chave.final) {
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
            if (jogo && jogo.timeA && jogo.timeB && !jogo.incompleto) {
                abrirModalMataMata(jogo);
            } else if (jogo && jogo.incompleto) {
                alert('⏳ Este confronto ainda não está disponível.\nComplete os jogos da fase de grupos para definir os classificados.');
            }
        });
    });
}

function renderJogosLista(jogos, is16Avos = false) {
    if (!jogos || jogos.length === 0) {
        return '<div class="empty">Aguardando definição dos confrontos...</div>';
    }
    
    return jogos.map(jogo => {
        // Se o jogo está incompleto (time faltando), mostra placeholder
        if (jogo.incompleto) {
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
            </div>
        `;
    }).join('');
}

function renderJogoFinal(jogo) {
    if (!jogo) return '<div class="empty">Aguardando...</div>';
    
    const resultadoHTML = formatarResultadoPremium(jogo);
    const isIncomplete = jogo.incompleto;
    
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
        fa: getBandeira(jogo.timeA),
        fb: getBandeira(jogo.timeB),
        venue: 'Mata-Mata',
        time: '00:00',
        date: new Date().toISOString().split('T')[0],
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