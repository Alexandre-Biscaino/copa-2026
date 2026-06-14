// ============================================
// MATA-MATA - Chaveamento Completo
// VERSÃO COM CARDS PREMIUM (igual fase de grupos)
// ============================================

import { results, saveMatchResult, getWinner } from './storage.js';
import { getClassificacao, getMelhoresTerceiros } from './classificacao.js';
import { getMatchResultText, getMatchResultTextSimple } from './resultados.js';
import { getBandeira } from './bandeiras.js';

let chaveamento = {
    oitavas: [],
    quartas: [],
    semi: [],
    final: null,
    terceiroLugar: null
};

// Confrontos das oitavas
const confrontosOitavasTemplate = [
    { id: 'O1', pos1: '1A', pos2: '3CDF' }, { id: 'O2', pos1: '2B', pos2: '1F' },
    { id: 'O3', pos1: '1C', pos2: '3ABF' }, { id: 'O4', pos1: '2D', pos2: '1E' },
    { id: 'O5', pos1: '1G', pos2: '3EHI' }, { id: 'O6', pos1: '2H', pos2: '1J' },
    { id: 'O7', pos1: '1I', pos2: '3DJK' }, { id: 'O8', pos1: '2K', pos2: '1L' },
    { id: 'O9', pos1: '1B', pos2: '3ADF' }, { id: 'O10', pos1: '2F', pos2: '1A' },
    { id: 'O11', pos1: '1D', pos2: '3BEG' }, { id: 'O12', pos1: '2E', pos2: '1C' },
    { id: 'O13', pos1: '1H', pos2: '3FGI' }, { id: 'O14', pos1: '2J', pos2: '1G' },
    { id: 'O15', pos1: '1K', pos2: '3HIL' }, { id: 'O16', pos1: '2L', pos2: '1I' }
];

function getTimePorPosicao(posicao) {
    const classificacao = getClassificacao();
    const melhoresTerceiros = getMelhoresTerceiros();
    
    const pos = posicao.charAt(0);
    const grupo = posicao.charAt(1);
    
    if (pos === '1') {
        const ranking = classificacao[grupo];
        if (ranking && ranking[0] && ranking[0].jogos === 3) return ranking[0].time;
        return null;
    }
    if (pos === '2') {
        const ranking = classificacao[grupo];
        if (ranking && ranking[1] && ranking[1].jogos === 3) return ranking[1].time;
        return null;
    }
    if (pos === '3') {
        const gruposPossiveis = posicao.substring(1).split('');
        for (let g of gruposPossiveis) {
            const ranking = classificacao[g];
            if (ranking && ranking[0] && ranking[0].jogos === 3) {
                const terceiro = melhoresTerceiros.find(t => t.grupo === g);
                if (terceiro) return terceiro.time;
            }
        }
    }
    return null;
}

function isFaseGruposCompleta() {
    const classificacao = getClassificacao();
    for (let grupo of 'ABCDEFGHIJKL'.split('')) {
        const ranking = classificacao[grupo];
        if (!ranking || ranking.length === 0) return false;
        for (let time of ranking) {
            if (time.jogos < 3) return false;
        }
    }
    return true;
}

// Formatar resultado com cards premium (igual fase de grupos)
function formatarResultadoPremium(jogo) {
    if (!jogo.resultado) return null;
    
    const res = jogo.resultado;
    const tempoNormal = `${res.goalsA} - ${res.goalsB}`;
    const temProrrogacao = res.hasExtraTime;
    const temPenaltis = res.hasPenalties;
    const golsProrrogacao = `${res.etGoalsA || 0} - ${res.etGoalsB || 0}`;
    const golsPenaltis = `${res.penA || 0} - ${res.penB || 0}`;
    const iconPenaltis = temPenaltis ? (res.penA > res.penB ? '🏆' : '⚽') : '';
    
    let html = `<div class="result-premium-container" style="padding: 8px; margin: 0;">`;
    html += `<div class="result-cards" style="gap: 4px;">`;
    
    // Card 1: Tempo Normal
    html += `<div class="result-card result-card-normal" style="padding: 4px 8px; min-width: 60px;">
        <div class="result-card-title" style="font-size: 8px;">📋 TEMPO</div>
        <div class="result-card-score" style="font-size: 14px;">${tempoNormal}</div>
    </div>`;
    
    // Card 2: Prorrogação (se houver)
    if (temProrrogacao) {
        html += `<div class="result-card result-card-et" style="padding: 4px 8px; min-width: 60px;">
            <div class="result-card-title" style="font-size: 8px;">⏱️ PRO</div>
            <div class="result-card-score" style="font-size: 14px;">${golsProrrogacao}</div>
        </div>`;
    }
    
    // Card 3: Pênaltis (se houver)
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
    const gruposCompletos = isFaseGruposCompleta();
    if (!gruposCompletos) {
        return { oitavas: [], quartas: [], semi: [], final: null, terceiroLugar: null, faseGruposIncompleta: true };
    }
    
    const oitavas = [];
    confrontosOitavasTemplate.forEach(confronto => {
        const time1 = getTimePorPosicao(confronto.pos1);
        const time2 = getTimePorPosicao(confronto.pos2);
        if (time1 && time2) {
            oitavas.push({
                id: confronto.id,
                timeA: time1,
                timeB: time2,
                resultado: results[confronto.id] || null,
                vencedor: null
            });
        }
    });
    
    oitavas.forEach(jogo => {
        if (jogo.resultado) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
    });
    
    const quartas = [];
    for (let i = 0; i < oitavas.length; i += 2) {
        if (oitavas[i] && oitavas[i+1]) {
            quartas.push({
                id: `Q${Math.floor(i/2)+1}`,
                timeA: oitavas[i].vencedor,
                timeB: oitavas[i+1].vencedor,
                resultado: results[`Q${Math.floor(i/2)+1}`] || null,
                vencedor: null
            });
        }
    }
    
    quartas.forEach(jogo => {
        if (jogo.resultado && jogo.timeA && jogo.timeB) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
    });
    
    const semi = [];
    for (let i = 0; i < quartas.length; i += 2) {
        if (quartas[i] && quartas[i+1]) {
            semi.push({
                id: `S${Math.floor(i/2)+1}`,
                timeA: quartas[i].vencedor,
                timeB: quartas[i+1].vencedor,
                resultado: results[`S${Math.floor(i/2)+1}`] || null,
                vencedor: null
            });
        }
    }
    
    semi.forEach(jogo => {
        if (jogo.resultado && jogo.timeA && jogo.timeB) {
            const winner = getWinner({ id: jogo.id }, jogo.resultado);
            jogo.vencedor = winner === 'A' ? jogo.timeA : (winner === 'B' ? jogo.timeB : null);
        }
    });
    
    let final = null;
    if (semi[0] && semi[1]) {
        final = {
            id: 'F1',
            timeA: semi[0].vencedor,
            timeB: semi[1].vencedor,
            resultado: results['F1'] || null,
            vencedor: null
        };
        if (final.resultado && final.timeA && final.timeB) {
            const winner = getWinner({ id: 'F1' }, final.resultado);
            final.vencedor = winner === 'A' ? final.timeA : (winner === 'B' ? final.timeB : null);
        }
    }
    
    let terceiroLugar = null;
    if (semi[2] && semi[3]) {
        terceiroLugar = {
            id: 'T1',
            timeA: semi[2].vencedor,
            timeB: semi[3].vencedor,
            resultado: results['T1'] || null,
            vencedor: null
        };
    }
    
    return { oitavas, quartas, semi, final, terceiroLugar, faseGruposIncompleta: false };
}

export function renderMataMata() {
    const container = document.getElementById('mataMataContainer');
    if (!container) return;
    
    const chave = initChaveamento();
    
    if (chave.faseGruposIncompleta) {
        container.innerHTML = `<div class="mata-mata-container"><div class="empty" style="padding: 60px 20px; text-align: center;">
            🏆 <strong style="font-size: 18px;">AGUARDANDO FASE DE GRUPOS</strong><br><br>
            ⚽ Para visualizar o chaveamento do mata-mata,<br>
            é necessário que TODOS os jogos da fase de grupos<br>
            tenham sido realizados e os resultados cadastrados.<br><br>
            📊 Volte para a aba "JOGOS" e complete os placares!
        </div></div>`;
        return;
    }
    
    if (chave.oitavas.length === 0) {
        container.innerHTML = `<div class="mata-mata-container"><div class="empty" style="padding: 60px 20px; text-align: center;">
            ⚠️ <strong>Não foi possível gerar o chaveamento</strong><br><br>
            Verifique se todos os grupos têm classificação definida.
        </div></div>`;
        return;
    }
    
    let html = `<div class="mata-mata-container">
        <h2 class="mata-mata-title">🏆 FASE DE MATA-MATA</h2>
        
        <div class="fase-container">
            <h3 class="fase-title">⚽ OITAVAS DE FINAL</h3>
            <div class="jogos-grid">${renderJogosLista(chave.oitavas)}</div>
        </div>`;
    
    if (chave.quartas.length > 0) {
        html += `<div class="fase-container">
            <h3 class="fase-title">🏅 QUARTAS DE FINAL</h3>
            <div class="jogos-grid">${renderJogosLista(chave.quartas)}</div>
        </div>`;
    }
    
    if (chave.semi.length > 0) {
        html += `<div class="fase-container">
            <h3 class="fase-title">🌟 SEMIFINAIS</h3>
            <div class="jogos-grid semi-grid">${renderJogosLista(chave.semi)}</div>
        </div>`;
    }
    
    if (chave.final) {
        html += `<div class="final-container">
            <div class="final-card">
                <h3 class="final-title">🏆 FINAL</h3>
                ${renderJogoFinal(chave.final)}
            </div>`;
    }
    
    if (chave.terceiroLugar) {
        html += `<div class="terceiro-card">
            <h3 class="terceiro-title">🥉 TERCEIRO LUGAR</h3>
            ${renderJogoFinal(chave.terceiroLugar)}
            </div>`;
    }
    
    html += `</div></div>`;
    
    container.innerHTML = html;
    
    document.querySelectorAll('.mata-mata-jogo').forEach(el => {
        const jogoId = el.dataset.jogoId;
        const jogo = encontrarJogoPorId(chave, jogoId);
        if (jogo && jogo.timeA && jogo.timeB) {
            el.addEventListener('click', () => abrirModalMataMata(jogo));
        }
    });
}

function renderJogosLista(jogos) {
    if (!jogos || jogos.length === 0) return '<div class="empty">Aguardando resultados das fases anteriores...</div>';
    
    return jogos.map(jogo => {
        const temTimes = jogo.timeA && jogo.timeB;
        const resultadoHTML = formatarResultadoPremium(jogo);
        
        return `
            <div class="mata-mata-jogo ${jogo.resultado ? 'realizado' : ''}" data-jogo-id="${jogo.id}">
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
    
    return `
        <div class="mata-mata-jogo final-jogo ${jogo.resultado ? 'realizado' : ''}" data-jogo-id="${jogo.id}">
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

function encontrarJogoPorId(chave, id) {
    const todasFases = [
        ...(chave.oitavas || []), ...(chave.quartas || []), ...(chave.semi || []),
        chave.final, chave.terceiroLugar
    ].filter(Boolean);
    return todasFases.find(j => j.id === id);
}

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
            if (typeof window.renderClassificacao === 'function') window.renderClassificacao();
            if (typeof window.renderEstatisticas === 'function') window.renderEstatisticas();
        });
    });
}