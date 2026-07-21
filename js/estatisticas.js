// ============================================
// ESTATÍSTICAS - Gráficos e Dados Avançados
// VERSÃO CORRIGIDA - NOMES COMPOSTOS
// ============================================

import { results, getWinner } from './storage.js';
import { matches } from './dados.js';
import { getClassificacao } from './classificacao.js';
import { initChaveamento } from './mataMata.js';

let charts = {};

// Destrói qualquer Chart.js já registrado nesse canvas (proteção extra contra
// chamadas concorrentes/duplicadas de renderEstatisticas, que causam o erro
// "Canvas is already in use... must be destroyed before the canvas can be reused")
function destroyExistingChartOnCanvas(canvas) {
    if (!canvas) return;
    const existing = typeof Chart !== 'undefined' && Chart.getChart ? Chart.getChart(canvas) : null;
    if (existing) {
        try { existing.destroy(); } catch (e) {}
    }
}

// ============================================
// FUNÇÃO QUE UNE TODAS AS FASES (GRUPOS + MATA-MATA)
// ============================================

function getTodosOsJogos() {
    const chave = initChaveamento();
    
    let mataMata = [];
    
    if (chave.dezesseisAvos) mataMata.push(...chave.dezesseisAvos);
    if (chave.oitavas) mataMata.push(...chave.oitavas);
    if (chave.quartas) mataMata.push(...chave.quartas);
    if (chave.semi) mataMata.push(...chave.semi);
    
    // FINAL - ID 103
    const finalResult = results['103'];
    if (finalResult) {
        let timeA = chave.final?.timeA || 'Finalista A';
        let timeB = chave.final?.timeB || 'Finalista B';
        mataMata.push({
            id: '103', timeA, timeB, resultado: finalResult,
            incompleto: false, local: 'MIAMI', horario: '18H', data: '18 JUL'
        });
    }
    
    // TERCEIRO LUGAR - ID 104
    const terceiroResult = results['104'];
    if (terceiroResult) {
        let timeA = chave.terceiroLugar?.timeA || 'Perdedor Semi 1';
        let timeB = chave.terceiroLugar?.timeB || 'Perdedor Semi 2';
        mataMata.push({
            id: '104', timeA, timeB, resultado: terceiroResult,
            incompleto: false, local: 'NOVA YORK/NOVA JERSEY', horario: '16H', data: '19 JUL'
        });
    }

    mataMata = mataMata.filter(j => j && j.timeA && j.timeB);

    const formatados = mataMata.map(j => ({
        id: j.id, a: j.timeA, b: j.timeB,
        g: 'MM', date: j.data || '2026-07-18', time: j.horario || '00:00'
    }));

    return [...matches, ...formatados];
}

function getJogosPorTime() {
    const jogosPorTime = {};
    getTodosOsJogos().forEach(match => {
        if (results[match.id]) {
            jogosPorTime[match.a] = (jogosPorTime[match.a] || 0) + 1;
            jogosPorTime[match.b] = (jogosPorTime[match.b] || 0) + 1;
        }
    });
    return jogosPorTime;
}

function getTextColor() {
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bgColor === '#f0f4f8' || bgColor === '#e2e8f0' || bgColor === '#ffffff') {
        return '#1e293b';
    }
    return '#eef4f8';
}

function getGridColor() {
    const textColor = getTextColor();
    return textColor === '#1e293b' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
}

// ============================================
// CÁLCULO DOS ARTILHEIROS INDIVIDUAIS
// ============================================

export function calcularArtilheiros() {
    const artilheirosMap = {};
    const timePorJogador = {};
    const jogosPorJogador = {};
    const todosJogos = getTodosOsJogos();
    
    // Expressão regular para capturar: Nome (gols) (time) ou Nome (gols)
    const regexArtilheiro = /^(.+?)\s*\((\d+)\)(?:\s*\((.*?)\))?$/;
    
    // Primeiro, construir um mapa de jogadores para times
    for (const [matchId, result] of Object.entries(results)) {
        if (!result.artilheiros) continue;
        const match = todosJogos.find(m => m.id === matchId);
        if (!match) continue;
        
        const golsA = (result.goalsA || 0) + (result.etGoalsA || 0);
        const golsB = (result.goalsB || 0) + (result.etGoalsB || 0);
        const artilheirosList = result.artilheiros.split(',').map(item => item.trim());
        
        artilheirosList.forEach(item => {
            const matchPattern = item.match(regexArtilheiro);
            if (matchPattern) {
                const nome = matchPattern[1].trim();
                const timeExplicito = matchPattern[3];
                if (timeExplicito) {
                    timePorJogador[nome] = timeExplicito.toUpperCase();
                } else {
                    if (golsA > 0) timePorJogador[nome] = match.a;
                    else if (golsB > 0) timePorJogador[nome] = match.b;
                }
            } else {
                // Tenta extrair nome sem parênteses
                const nome = item.replace(/\(.*?\)/g, '').trim();
                if (nome) {
                    if (golsA > 0) timePorJogador[nome] = match.a;
                    else if (golsB > 0) timePorJogador[nome] = match.b;
                }
            }
        });
    }
    
    // Agora contabilizar os gols
    for (const [matchId, result] of Object.entries(results)) {
        if (!result.artilheiros) continue;
        const match = todosJogos.find(m => m.id === matchId);
        if (!match) continue;
        
        const artilheirosList = result.artilheiros.split(',').map(item => item.trim());
        
        artilheirosList.forEach(item => {
            let nome, gols;
            
            const matchPattern = item.match(regexArtilheiro);
            if (matchPattern) {
                nome = matchPattern[1].trim();
                gols = parseInt(matchPattern[2]) || 1;
            } else {
                // Caso não tenha parênteses, assume 1 gol
                nome = item.replace(/\(.*?\)/g, '').trim();
                gols = 1;
            }
            
            if (!nome) return;
            
            // Se o jogador já tem um time mapeado, usa ele, senão tenta inferir
            let time = timePorJogador[nome];
            if (!time) {
                // Tenta inferir o time pelo nome do jogador
                const nomeLower = nome.toLowerCase();
                const timeA = match.a.toLowerCase();
                const timeB = match.b.toLowerCase();
                
                if (nomeLower.includes(timeA) || timeA.includes(nomeLower)) {
                    time = match.a;
                } else if (nomeLower.includes(timeB) || timeB.includes(nomeLower)) {
                    time = match.b;
                } else {
                    // Verifica jogadores famosos
                    const famosos = {
                        'mbappe': 'França',
                        'messi': 'Argentina',
                        'haaland': 'Noruega',
                        'bellingham': 'Inglaterra',
                        'kane': 'Inglaterra',
                        'vinicius': 'Brasil',
                        'neymar': 'Brasil',
                        'cristiano': 'Portugal',
                        'modric': 'Croácia',
                        'lewandowski': 'Polônia',
                        'salah': 'Egito',
                        'mane': 'Senegal',
                        'de bruyne': 'Bélgica',
                        'griezmann': 'França',
                        'dembele': 'França',
                        'oyarzabal': 'Espanha',
                        'sarr': 'Senegal',
                        'martinez': 'Argentina',
                        'havertz': 'Alemanha',
                        'gakpo': 'Holanda',
                        'balogun': 'EUA'
                    };
                    
                    for (const [key, value] of Object.entries(famosos)) {
                        if (nomeLower.includes(key)) {
                            time = value;
                            break;
                        }
                    }
                }
                
                if (time) timePorJogador[nome] = time;
            }
            
            if (!artilheirosMap[nome]) {
                artilheirosMap[nome] = { nome, gols: 0, time: time || '?', jogos: 0 };
            }
            artilheirosMap[nome].gols += gols;
            artilheirosMap[nome].jogos += 1;
        });
    }
    
    return Object.values(artilheirosMap)
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 20);
}

// ============================================
// CÁLCULO DOS GOLS CONTRA
// ============================================

export function calcularGolsContra() {
    const golsContraMap = {};
    const todosJogos = getTodosOsJogos();
    const regexGolsContra = /^(.+?)\s*\((\d+)\)(?:\s*\((.*?)\))?$/;
    
    for (const [matchId, result] of Object.entries(results)) {
        if (!result.golsContra) continue;
        const match = todosJogos.find(m => m.id === matchId);
        if (!match) continue;
        
        const golsContraList = result.golsContra.split(',').map(item => item.trim());
        
        golsContraList.forEach(item => {
            let nome, gols;
            const matchPattern = item.match(regexGolsContra);
            if (matchPattern) {
                nome = matchPattern[1].trim();
                gols = parseInt(matchPattern[2]) || 0;
            } else {
                nome = item.replace(/\(.*?\)/g, '').trim();
                gols = 1;
            }
            if (!nome) return;
            
            const golsA = (result.goalsA || 0) + (result.etGoalsA || 0);
            const golsB = (result.goalsB || 0) + (result.etGoalsB || 0);
            let time = (golsA < golsB) ? match.a : match.b;
            
            if (!golsContraMap[nome]) {
                golsContraMap[nome] = { nome, gols: 0, time, jogos: 0 };
            }
            golsContraMap[nome].gols += gols;
            golsContraMap[nome].jogos += 1;
        });
    }
    
    return Object.values(golsContraMap).sort((a, b) => b.gols - a.gols).slice(0, 20);
}

// ============================================
// CÁLCULO DAS ESTATÍSTICAS
// ============================================

export function calcularEstatisticas() {
    let totalGols = 0, totalJogos = 0;
    let maiorPlacarA = 0, maiorPlacarB = 0;
    let golsPorTime = {}, golsSofridosPorTime = {};
    let vitorias = 0, empates = 0, derrotas = 0;
    let golsPorGrupo = { A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, I:0, J:0, K:0, L:0 };
    let placares = {};
    let pontosCampeao = [], nomeCampeao = null, faseCampeao = [];
    let isCopaFinalizada = false;
    
    const todosJogos = getTodosOsJogos();
    
    todosJogos.forEach(match => {
        const res = results[match.id];
        if (!res) return;
        
        totalJogos++;
        let golsA = res.goalsA, golsB = res.goalsB;
        if (res.hasExtraTime) {
            golsA += res.etGoalsA || 0;
            golsB += res.etGoalsB || 0;
        }
        totalGols += golsA + golsB;
        
        if (golsA > maiorPlacarA || (golsA === maiorPlacarA && golsB > maiorPlacarB)) {
            maiorPlacarA = golsA;
            maiorPlacarB = golsB;
        }
        
        golsPorTime[match.a] = (golsPorTime[match.a] || 0) + golsA;
        golsPorTime[match.b] = (golsPorTime[match.b] || 0) + golsB;
        golsSofridosPorTime[match.a] = (golsSofridosPorTime[match.a] || 0) + golsB;
        golsSofridosPorTime[match.b] = (golsSofridosPorTime[match.b] || 0) + golsA;
        
        if (match.g && match.g !== 'MM') {
            golsPorGrupo[match.g] = (golsPorGrupo[match.g] || 0) + golsA + golsB;
        }
        
        const placarStr = `${Math.min(golsA, golsB)}-${Math.max(golsA, golsB)}`;
        placares[placarStr] = (placares[placarStr] || 0) + 1;
        
        const winner = getWinner(match, res);
        if (winner === 'A') vitorias++;
        else if (winner === 'B') derrotas++;
        else empates++;
    });
    
    const mediaGols = totalJogos > 0 ? (totalGols / totalJogos).toFixed(2) : 0;
    const maiorPlacar = `${maiorPlacarA} - ${maiorPlacarB}`;
    
    const artilheiros = Object.entries(golsPorTime)
        .map(([time, gols]) => ({ time, gols }))
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 10);
    
    const defesa = Object.entries(golsSofridosPorTime)
        .map(([time, gols]) => ({ time, gols }))
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 10);
    
    const placarMaisComum = Object.entries(placares)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const chave = initChaveamento();
    if (chave.final && chave.final.resultado && chave.final.vencedor) {
        nomeCampeao = chave.final.vencedor;
        isCopaFinalizada = true;
    }
    
    if (isCopaFinalizada && nomeCampeao) {
        let jogosGrupos = matches
            .filter(m => m.a === nomeCampeao || m.b === nomeCampeao)
            .sort((a, b) => matchDateTime(a) - matchDateTime(b))
            .map(m => ({ ...m, faseTorneio: 'Grupos' }));
            
        let jogosMataMata = [];
        const fasesMataMata = [
            { arr: chave.dezesseisAvos, nome: '16 avos' },
            { arr: chave.oitavas, nome: 'Oitavas' },
            { arr: chave.quartas, nome: 'Quartas' },
            { arr: chave.semi, nome: 'Semifinal' },
            { arr: [chave.final], nome: 'Final' }
        ];
        
        fasesMataMata.forEach(fase => {
            const jogoFase = fase.arr.find(j => j && !j.incompleto && (j.timeA === nomeCampeao || j.timeB === nomeCampeao));
            if (jogoFase && jogoFase.resultado) {
                jogosMataMata.push({
                    id: jogoFase.id,
                    a: jogoFase.timeA,
                    b: jogoFase.timeB,
                    faseTorneio: fase.nome
                });
            }
        });
        
        const jogosCampeao = [...jogosGrupos, ...jogosMataMata];
        let pontosAcumulados = 0;
        
        jogosCampeao.forEach((match, index) => {
            const res = results[match.id];
            if (!res) return;
            const winner = getWinner({id: match.id, a: match.a, b: match.b}, res);
            let pontosJogo = 0;
            if (winner === 'A' && match.a === nomeCampeao) pontosJogo = 3;
            else if (winner === 'B' && match.b === nomeCampeao) pontosJogo = 3;
            else if (!winner) pontosJogo = 1;
            pontosAcumulados += pontosJogo;
            faseCampeao.push({
                jogo: index + 1,
                pontos: pontosAcumulados,
                fase: match.faseTorneio,
                adversario: match.a === nomeCampeao ? match.b : match.a,
                golsFeitos: match.a === nomeCampeao ? res.goalsA : res.goalsB,
                golsSofridos: match.a === nomeCampeao ? res.goalsB : res.goalsA,
                venceu: winner === 'A' ? match.a === nomeCampeao : (winner === 'B' ? match.b === nomeCampeao : false)
            });
        });
        pontosCampeao = faseCampeao.map(p => ({ jogo: p.jogo, pontos: p.pontos, fase: p.fase }));
    }
    
    return {
        totalGols, totalJogos, mediaGols, maiorPlacar, artilheiros,
        defesa, vitorias, empates, derrotas, golsPorTime, golsPorGrupo,
        placarMaisComum, pontosCampeao, nomeCampeao, faseCampeao, isCopaFinalizada
    };
}

function matchDateTime(m) {
    return new Date(`${m.date}T${m.time}:00-03:00`);
}

function atualizarCards(stats) {
    document.getElementById('totalGols').textContent = stats.totalGols;
    document.getElementById('mediaGols').textContent = stats.mediaGols;
    document.getElementById('totalJogos').textContent = stats.totalJogos;
    document.getElementById('maiorPlacar').textContent = stats.maiorPlacar;
}

function destroyCharts() {
    Object.values(charts).forEach(chart => { if (chart) try { chart.destroy(); } catch(e) {} });
    charts = {};
}

function criarGraficoAtaque(stats) {
    const ctx = document.getElementById('ataqueChart')?.getContext('2d');
    if (!ctx || stats.artilheiros.length === 0) return;
    destroyExistingChartOnCanvas(ctx.canvas);
    const textColor = getTextColor(), gridColor = getGridColor();
    charts.ataque = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.artilheiros.map(t => t.time),
            datasets: [{
                label: 'Gols Marcados', data: stats.artilheiros.map(t => t.gols),
                backgroundColor: 'rgba(47, 207, 142, 0.7)', borderColor: '#2fcf8e', borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } }, tooltip: { backgroundColor: '#112a3b', titleColor: '#2fcf8e', bodyColor: '#eef4f8' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Gols', color: textColor } }, x: { ticks: { color: textColor, font: { size: 9 }, rotation: 25 }, grid: { display: false } } }
        }
    });
}

function criarGraficoDefesa(stats) {
    const ctx = document.getElementById('defesaChart')?.getContext('2d');
    if (!ctx || stats.defesa.length === 0) return;
    destroyExistingChartOnCanvas(ctx.canvas);
    const textColor = getTextColor(), gridColor = getGridColor();
    charts.defesa = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.defesa.map(t => t.time),
            datasets: [{
                label: 'Gols Sofridos', data: stats.defesa.map(t => t.gols),
                backgroundColor: 'rgba(255, 107, 94, 0.7)', borderColor: '#ff6b5e', borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } }, tooltip: { backgroundColor: '#112a3b', titleColor: '#ff6b5e', bodyColor: '#eef4f8' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Gols Sofridos', color: textColor } }, x: { ticks: { color: textColor, font: { size: 9 }, rotation: 25 }, grid: { display: false } } }
        }
    });
}

function criarGraficoPlacar(stats) {
    const ctx = document.getElementById('placarChart')?.getContext('2d');
    if (!ctx || stats.placarMaisComum.length === 0) return;
    destroyExistingChartOnCanvas(ctx.canvas);
    const textColor = getTextColor(), gridColor = getGridColor();
    charts.placar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.placarMaisComum.map(p => p[0]),
            datasets: [{
                label: 'Frequência', data: stats.placarMaisComum.map(p => p[1]),
                backgroundColor: 'rgba(243, 182, 43, 0.7)', borderColor: '#f3b62b', borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } }, tooltip: { backgroundColor: '#112a3b', titleColor: '#f3b62b', bodyColor: '#eef4f8' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } } }
        }
    });
}

function criarGraficoResultados(stats) {
    const ctx = document.getElementById('resultadosChart')?.getContext('2d');
    if (!ctx) return;
    destroyExistingChartOnCanvas(ctx.canvas);
    const textColor = getTextColor();
    charts.resultados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Vitórias (Mandante)', 'Empates', 'Vitórias (Visitante)'],
            datasets: [{ data: [stats.vitorias, stats.empates, stats.derrotas], backgroundColor: ['#2fcf8e', '#f3b62b', '#ff6b5e'], borderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { color: textColor } }, tooltip: { backgroundColor: '#112a3b', bodyColor: '#eef4f8' } }
        }
    });
}

function criarGraficoEvolucao(stats) {
    const ctx = document.getElementById('evolucaoChart')?.getContext('2d');
    if (!ctx) return;
    destroyExistingChartOnCanvas(ctx.canvas);
    const textColor = getTextColor(), gridColor = getGridColor();
    
    if (!stats.isCopaFinalizada || stats.pontosCampeao.length === 0) {
        const parent = ctx.canvas.parentElement;
        let oldMsg = parent.querySelector('.evolucao-placeholder');
        if (oldMsg) oldMsg.remove();
        const msg = document.createElement('div');
        msg.className = 'evolucao-placeholder';
        msg.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:${textColor};opacity:0.8;pointer-events:none;`;
        msg.innerHTML = `<div style="font-size:48px;">🏆</div><div>Aguardando definição do campeão</div>`;
        parent.style.position = 'relative'; parent.appendChild(msg);
        charts.evolucao = new Chart(ctx, { type: 'line', data: { labels: [''], datasets: [{ data: [0], fill: false }] }, options: { scales: { y: { display: false }, x: { display: false } } } });
        return;
    }
    
    let oldMsg = ctx.canvas.parentElement.querySelector('.evolucao-placeholder');
    if (oldMsg) oldMsg.remove();
    
    const pontos = stats.pontosCampeao.map(p => p.pontos);
    const labels = stats.pontosCampeao.map(p => `${p.fase || 'Jogo'}\n(Jogo ${p.jogo})`);
    
    charts.evolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${stats.nomeCampeao} - Pontos Acumulados`, data: pontos,
                backgroundColor: 'rgba(243, 182, 43, 0.15)', borderColor: '#f3b62b', borderWidth: 3,
                pointBackgroundColor: '#f3b62b', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 7, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } }, tooltip: { backgroundColor: '#112a3b', titleColor: '#f3b62b', bodyColor: '#eef4f8' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor, font: { size: 9 } }, grid: { display: false } } }
        }
    });
}

function criarGraficoArtilheirosIndividuais() {
    const ctx = document.getElementById('artilheirosIndividuaisChart')?.getContext('2d');
    if (!ctx) return;
    destroyExistingChartOnCanvas(ctx.canvas);
    const ranking = calcularArtilheiros();
    const textColor = getTextColor(), gridColor = getGridColor();
    
    if (ranking.length === 0) {
        const parent = ctx.canvas.parentElement;
        let oldMsg = parent.querySelector('.artilheiros-placeholder');
        if (oldMsg) oldMsg.remove();
        const msg = document.createElement('div');
        msg.className = 'artilheiros-placeholder';
        msg.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:${textColor};opacity:0.7;pointer-events:none;`;
        msg.innerHTML = `<div style="font-size:48px;">⚽</div><div>Nenhum artilheiro cadastrado</div>`;
        parent.style.position = 'relative'; parent.appendChild(msg);
        charts.artilheirosIndividuais = new Chart(ctx, { type: 'bar', data: { labels: [''], datasets: [{ data: [0] }] }, options: { scales: { y: { display: false }, x: { display: false } } } });
        return;
    }
    
    let oldMsg = ctx.canvas.parentElement.querySelector('.artilheiros-placeholder');
    if (oldMsg) oldMsg.remove();
    
    const top = ranking.slice(0, 15);
    charts.artilheirosIndividuais = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(p => p.nome),
            datasets: [{
                label: 'Gols', data: top.map(p => p.gols),
                backgroundColor: 'rgba(243, 182, 43, 0.7)', borderColor: '#f3b62b', borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { labels: { color: textColor } }, tooltip: { backgroundColor: '#112a3b', titleColor: '#f3b62b', bodyColor: '#eef4f8' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor, font: { size: 10 }, rotation: 25 }, grid: { display: false } } }
        }
    });
}

function atualizarTabelaArtilheiros(stats) {
    const tbody = document.getElementById('artilheirosTableBody');
    if (!tbody) return;
    
    const jogosPorTime = getJogosPorTime();
    
    if (stats.artilheiros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum resultado cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = stats.artilheiros.map((time, idx) => {
        const jogos = jogosPorTime[time.time] || 0;
        const media = jogos > 0 ? (time.gols / jogos).toFixed(2) : '0.00';
        return `
            <tr class="${idx === 0 ? 'destaque' : ''}">
                <td><strong>${idx + 1}º</strong></td>
                <td style="text-align:left">${time.time}</td>
                <td style="font-weight:800">⚽ ${time.gols}</td>
                <td>${jogos}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

function atualizarTabelaArtilheirosIndividuais() {
    const tbody = document.getElementById('artilheirosIndividuaisBody');
    if (!tbody) return;
    const ranking = calcularArtilheiros();
    
    if (ranking.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum artilheiro cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = ranking.slice(0, 20).map((item, idx) => {
        const media = item.jogos > 0 ? (item.gols / item.jogos).toFixed(2) : '0.00';
        return `
            <tr class="${idx === 0 ? 'destaque' : ''}">
                <td><strong>${idx + 1}º</strong></td>
                <td style="text-align:left"><strong>${item.nome}</strong></td>
                <td>${item.time || 'N/A'}</td>
                <td style="font-weight:800">⚽ ${item.gols}</td>
                <td>${item.jogos}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

function atualizarTabelaGolsContra() {
    const tbody = document.getElementById('golsContraBody');
    if (!tbody) return;
    const golsContra = calcularGolsContra();
    
    if (golsContra.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum gol contra cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = golsContra.map((item, idx) => {
        const media = item.jogos > 0 ? (item.gols / item.jogos).toFixed(2) : '0.00';
        return `
            <tr class="${idx === 0 ? 'destaque' : ''}">
                <td><strong>${idx + 1}º</strong></td>
                <td style="text-align:left"><strong>${item.nome}</strong></td>
                <td>${item.time || '?'}</td>
                <td style="color: var(--coral); font-weight:800;">⚠️ ${item.gols}</td>
                <td>${item.jogos}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

let renderEstatisticasToken = 0;

export function renderEstatisticas() {
    const stats = calcularEstatisticas();
    atualizarCards(stats);
    destroyCharts();
    
    // Token de proteção: se renderEstatisticas() for chamada de novo antes deste
    // setTimeout disparar (ex: duas chamadas seguidas ao salvar um jogo do mata-mata),
    // apenas a chamada mais recente efetivamente desenha os gráficos. Isso evita a
    // corrida que causava "Canvas is already in use" e travava o restante do render
    // (incluindo o gráfico/tabela de artilheiros individuais).
    const meuToken = ++renderEstatisticasToken;
    
    setTimeout(() => {
        if (meuToken !== renderEstatisticasToken) return;
        criarGraficoAtaque(stats);
        criarGraficoDefesa(stats);
        criarGraficoPlacar(stats);
        criarGraficoResultados(stats);
        criarGraficoEvolucao(stats);
        criarGraficoArtilheirosIndividuais();
        atualizarTabelaArtilheirosIndividuais();
        atualizarTabelaArtilheiros(stats);
        atualizarTabelaGolsContra();
    }, 100);
}