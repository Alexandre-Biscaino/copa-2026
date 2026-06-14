// ============================================
// MATA-MATA - Chaveamento Completo (48 Seleções)
// COM SISTEMA DE EDIÇÃO MANUAL PARA 16-AVOS
// ============================================

import { results, saveMatchResult, getWinner } from './storage.js';
import { getClassificacao, getMelhoresTerceiros } from './classificacao.js';
import { getMatchResultText, getMatchResultTextSimple } from './resultados.js';
import { getBandeira } from './bandeiras.js';

// --- SISTEMA DE OVERRIDE MANUAL PARA 16-AVOS ---
// Permite corrigir classificações por cartões ou ranking FIFA
const overrides16Avos = JSON.parse(localStorage.getItem('overrides16Avos') || '{}');

// Função global para forçar vencedor manualmente
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
// -----------------------------------------------

// Template dos confrontos de 16-avos (baseado na classificação da fase de grupos)
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

/**
 * Obtém o time baseado na posição do grupo
 * Ex: '1A' = 1º lugar do Grupo A
 *     '3ABC' = Melhor 3º entre grupos A,B,C
 */
function getTimePorPosicao(posicao) {
    const classificacao = getClassificacao();
    const melhoresTerceiros = getMelhoresTerceiros();
    const pos = posicao.charAt(0);
    const grupo = posicao.charAt(1);
    
    // 1º ou 2º lugar do grupo
    if (pos === '1' || pos === '2') {
        const ranking = classificacao[grupo];
        const idx = parseInt(pos) - 1;
        if (ranking && ranking[idx] && ranking[idx].jogos === 3) {
            return ranking[idx].time;
        }
        return null;
    }
    
    // 3º lugar (melhores terceiros)
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

/**
 * Verifica se todos os jogos da fase de grupos foram realizados
 */
function isFaseGruposCompleta() {
    const classificacao = getClassificacao();
    const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    for (let grupo of grupos) {
        const ranking = classificacao[grupo];
        if (!ranking || ranking.length === 0) return false;
        for (let time of ranking) {
            if (time.jogos < 3) return false;
        }
    }
    return true;
}

/**
 * Formata o resultado com cards premium (estilo fase de grupos)
 */
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

/**
 * Inicializa todo o chaveamento do mata-mata
 */
export function initChaveamento() {
    // Verifica se fase de grupos está completa
    if (!isFaseGruposCompleta()) {
        return { faseGruposIncompleta: true };
    }
    
    // 1. 16-AVOS DE FINAL (16 jogos)
    const dezesseisAvos = confrontos16AvosTemplate
        .map(confronto => {
            const timeA = getTimePorPosicao(confronto.pos1);
            const timeB = getTimePorPosicao(confronto.pos2);
            
            // Só cria o jogo se ambos os times existirem
            if (!timeA || !timeB) return null;
            
            return {
                id: confronto.id,
                timeA: timeA,
                timeB: timeB,
                resultado: results[confronto.id] || null,
                vencedor: null
            };
        })
        .filter(jogo => jogo !== null);
    
    // Aplica overrides manuais e calcula vencedores
    dezesseisAvos.forEach(jogo => {
        // Verifica override manual (para casos de cartões/ranking FIFA)
        if (overrides16Avos[jogo.id]) {
            const overrideWinner = overrides16Avos[jogo.id];
            // Valida se o override é um dos times do jogo
            if (overrideWinner === jogo.timeA || overrideWinner === jogo.timeB) {
                jogo.vencedor = overrideWinner;
            } else {
                console.warn(`Override inválido para ${jogo.id}: ${overrideWinner}`);
                delete overrides16Avos[jogo.id];
                localStorage.setItem('overrides16Avos', JSON.stringify(overrides16Avos));
            }
        }
        
        // Se não tem override mas tem resultado, calcula normalmente
        if (!jogo.vencedor && jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
    });
    
    // 2. OITAVAS DE FINAL (8 jogos)
    const oitavas = [];
    for (let i = 0; i < dezesseisAvos.length; i += 2) {
        if (dezesseisAvos[i] && dezesseisAvos[i+1]) {
            const jogo = {
                id: `O${Math.floor(i/2)+1}`,
                timeA: dezesseisAvos[i].vencedor,
                timeB: dezesseisAvos[i+1].vencedor,
                resultado: results[`O${Math.floor(i/2)+1}`] || null,
                vencedor: null
            };
            
            if (jogo.resultado && jogo.timeA && jogo.timeB) {
                const winner = getWinner({ id: jogo.id }, jogo.resultado);
                jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
            }
            oitavas.push(jogo);
        }
    }
    
    // 3. QUARTAS DE FINAL (4 jogos)
    const quartas = [];
    for (let i = 0; i < oitavas.length; i += 2) {
        if (oitavas[i] && oitavas[i+1]) {
            const jogo = {
                id: `Q${Math.floor(i/2)+1}`,
                timeA: oitavas[i].vencedor,
                timeB: oitavas[i+1].vencedor,
                resultado: results[`Q${Math.floor(i/2)+1}`] || null,
                vencedor: null
            };
            
            if (jogo.resultado && jogo.timeA && jogo.timeB) {
                const winner = getWinner({ id: jogo.id }, jogo.resultado);
                jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
            }
            quartas.push(jogo);
        }
    }
    
    // 4. SEMIFINAIS (2 jogos)
    const semi = [];
    for (let i = 0; i < quartas.length; i += 2) {
        if (quartas[i] && quartas[i+1]) {
            const jogo = {
                id: `S${Math.floor(i/2)+1}`,
                timeA: quartas[i].vencedor,
                timeB: quartas[i+1].vencedor,
                resultado: results[`S${Math.floor(i/2)+1}`] || null,
                vencedor: null
            };
            
            if (jogo.resultado && jogo.timeA && jogo.timeB) {
                const winner = getWinner({ id: jogo.id }, jogo.resultado);
                jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
            }
            semi.push(jogo);
        }
    }
    
    // 5. FINAL E TERCEIRO LUGAR
    let final = null;
    let terceiroLugar = null;
    
    if (semi.length === 2) {
        // FINAL
        if (semi[0].vencedor && semi[1].vencedor) {
            final = {
                id: 'F1',
                timeA: semi[0].vencedor,
                timeB: semi[1].vencedor,
                resultado: results['F1'] || null,
                vencedor: null
            };
            if (final.resultado) {
                const winner = getWinner({ id: 'F1' }, final.resultado);
                final.vencedor = winner === 'A' ? final.timeA : final.timeB;
            }
        }
        
        // TERCEIRO LUGAR (perdedores das semifinais)
        const perdedorS1 = semi[0].vencedor === semi[0].timeA ? semi[0].timeB : semi[0].timeA;
        const perdedorS2 = semi[1].vencedor === semi[1].timeA ? semi[1].timeB : semi[1].timeA;
        
        if (perdedorS1 && perdedorS2) {
            terceiroLugar = {
                id: 'T1',
                timeA: perdedorS1,
                timeB: perdedorS2,
                resultado: results['T1'] || null,
                vencedor: null
            };
            if (terceiroLugar.resultado) {
                const winner = getWinner({ id: 'T1' }, terceiroLugar.resultado);
                terceiroLugar.vencedor = winner === 'A' ? terceiroLugar.timeA : terceiroLugar.timeB;
            }
        }
    }
    
    return {
        dezesseisAvos,
        oitavas,
        quartas,
        semi,
        final,
        terceiroLugar,
        faseGruposIncompleta: false
    };
}

/**
 * Renderiza todo o chaveamento do mata-mata na tela
 */
export function renderMataMata() {
    const container = document.getElementById('mataMataContainer');
    if (!container) return;
    
    const chave = initChaveamento();
    
    // Caso fase de grupos não esteja completa
    if (chave.faseGruposIncompleta || !chave.dezesseisAvos || chave.dezesseisAvos.length === 0) {
        container.innerHTML = `
            <div class="mata-mata-container">
                <div class="empty" style="padding: 60px 20px; text-align: center;">
                    🏆 <strong style="font-size: 18px;">AGUARDANDO FASE DE GRUPOS</strong><br><br>
                    ⚽ Para visualizar o chaveamento do mata-mata,<br>
                    é necessário que TODOS os jogos da fase de grupos<br>
                    tenham sido realizados e os resultados cadastrados.<br><br>
                    📊 Volte para a aba "JOGOS" e complete os placares!
                </div>
            </div>
        `;
        return;
    }
    
    // Monta o HTML do chaveamento
    let html = `
        <div class="mata-mata-container">
            <h2 class="mata-mata-title">🏆 FASE DE MATA-MATA</h2>
            
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
    
    // Adiciona eventos de clique para abrir modal de resultados
    document.querySelectorAll('.mata-mata-jogo').forEach(el => {
        el.addEventListener('click', (e) => {
            // Não abre modal se clicou no botão de edição
            if (e.target.closest('.btn-override')) return;
            
            const jogoId = el.dataset.jogoId;
            const jogo = encontrarJogoPorId(chave, jogoId);
            if (jogo && jogo.timeA && jogo.timeB) {
                abrirModalMataMata(jogo);
            }
        });
    });
}

/**
 * Renderiza uma lista de jogos
 * @param {Array} jogos - Lista de jogos
 * @param {boolean} is16Avos - Se é fase de 16-avos (mostra botão de edição)
 */
function renderJogosLista(jogos, is16Avos = false) {
    if (!jogos || jogos.length === 0) {
        return '<div class="empty">Aguardando resultados das fases anteriores...</div>';
    }
    
    return jogos.map(jogo => {
        const resultadoHTML = formatarResultadoPremium(jogo);
        
        // Botão de edição manual (apenas para 16-avos e se já tiver resultado)
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
                               color:white;"
                        onclick="event.stopPropagation();
                                 if(confirm('Deseja forçar/alterar o classificado dessa partida?\\n\\nIsso é útil para casos de desempate por cartões ou ranking FIFA.')){ 
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

/**
 * Renderiza um jogo final (estilo especial)
 */
function renderJogoFinal(jogo) {
    if (!jogo) return '<div class="empty">Aguardando...</div>';
    
    const resultadoHTML = formatarResultadoPremium(jogo);
    
    return `
        <div class="mata-mata-jogo final-jogo ${jogo.resultado ? 'realizado' : ''}" 
             data-jogo-id="${jogo.id}">
            <div class="jogo-time ${jogo.vencedor === jogo.timeA ? 'vencedor' : ''}">
                <span class="jogo-flag">${getBandeira(jogo.timeA)}</span>
                <span class="jogo-nome final-nome">${jogo.timeA || '???'}</span>
            </div>
            <div class="jogo-placar-container">
                ${resultadoHTML || '<span class="jogo-placar final-placar">x</span>'}
            </div>
            <div class="jogo-time ${jogo.vencedor === jogo.timeB ? 'vencedor' : ''}">
                <span class="jogo-nome final-nome">${jogo.timeB || '???'}</span>
                <span class="jogo-flag">${getBandeira(jogo.timeB)}</span>
            </div>
        </div>
    `;
}

/**
 * Encontra um jogo pelo ID em todo o chaveamento
 */
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

/**
 * Abre o modal para inserir/editar resultado de um jogo do mata-mata
 */
function abrirModalMataMata(jogo) {
    if (!jogo.timeA || !jogo.timeB) return;
    
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
            // Atualiza outras partes da interface se necessário
            if (typeof window.renderClassificacao === 'function') {
                window.renderClassificacao();
            }
            if (typeof window.renderEstatisticas === 'function') {
                window.renderEstatisticas();
            }
        });
    });
}