// ============================================
// ESTATÍSTICAS - Gráficos e Dados Avançados
// VERSÃO COMPLETA: Ataque, Defesa, Evolução, Placar, Artilheiros, Gols Contra
// ============================================

import { results, getWinner } from './storage.js';
import { matches } from './dados.js';
import { getClassificacao } from './classificacao.js';
import { initChaveamento } from './mataMata.js';

let charts = {};

// ============================================
// FUNÇÃO QUE UNE TODAS AS FASES (GRUPOS + MATA-MATA)
// ============================================

function getTodosOsJogos() {
    const chave = initChaveamento();
    const mataMata = [
        ...(chave.dezesseisAvos || []),
        ...(chave.oitavas || []),
        ...(chave.quartas || []),
        ...(chave.semi || []),
        chave.final,
        chave.terceiroLugar
    ].filter(j => j && !j.incompleto && j.timeA && j.timeB);

    const formatados = mataMata.map(j => ({
        id: j.id,
        a: j.timeA,
        b: j.timeB,
        g: 'MM', // Marcador de Mata-Mata
        date: j.data,
        time: j.horario
    }));

    return [...matches, ...formatados];
}

// ============================================
// OBTER COR DO TEXTO BASEADA NO TEMA ATUAL
// ============================================

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
// CÁLCULO DOS ARTILHEIROS INDIVIDUAIS (INTELIGENTE)
// ============================================

export function calcularArtilheiros() {
    const artilheirosMap = {};
    const timePorJogador = {};
    const todosJogos = getTodosOsJogos();
    
    // PASSO 1: Dicionário Inteligente (O sistema aprende os times)
    for (const [matchId, result] of Object.entries(results)) {
        if (!result.artilheiros) continue;
        const match = todosJogos.find(m => m.id === matchId);
        if (!match) continue;
        
        const golsA = result.goalsA || 0;
        const golsB = result.goalsB || 0;
        const artilheirosList = result.artilheiros.split(',').map(item => item.trim());
        
        artilheirosList.forEach(item => {
            const matchPattern = item.match(/^(.+?)\s*\((\d+)\)$/);
            if (matchPattern) {
                const nome = matchPattern[1].trim();
                // Se só o Time A fez gol, o sistema grava que o jogador é do Time A
                if (golsA > 0 && golsB === 0) timePorJogador[nome] = match.a;
                // Se só o Time B fez gol, o sistema grava que é do Time B
                else if (golsB > 0 && golsA === 0) timePorJogador[nome] = match.b;
            }
        });
    }
    
    // PASSO 2: Contabilizar os Gols usando a memória
    for (const [matchId, result] of Object.entries(results)) {
        if (!result.artilheiros) continue;
        const match = todosJogos.find(m => m.id === matchId);
        if (!match) continue;
        
        const golsA = result.goalsA || 0;
        const golsB = result.goalsB || 0;
        const artilheirosList = result.artilheiros.split(',').map(item => item.trim());
        
        artilheirosList.forEach(item => {
            const matchPattern = item.match(/^(.+?)\s*\((\d+)\)$/);
            if (matchPattern) {
                const nome = matchPattern[1].trim();
                const gols = parseInt(matchPattern[2]) || 0;
                
                // Busca na memória. Se não achar (1º jogo do time e ambos marcaram), infere.
                let time = timePorJogador[nome];
                if (!time) {
                    time = (golsA >= golsB) ? match.a : match.b;
                    timePorJogador[nome] = time; // Salva na memória
                }
                
                if (!artilheirosMap[nome]) {
                    artilheirosMap[nome] = { nome, gols: 0, time, jogos: 0 };
                }
                artilheirosMap[nome].gols += gols;
                artilheirosMap[nome].jogos += 1;
            }
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
    
    for (const [matchId, result] of Object.entries(results)) {
        if (!result.golsContra) continue;
        
        const match = todosJogos.find(m => m.id === matchId);
        if (!match) continue;
        
        const golsContraList = result.golsContra.split(',').map(item => item.trim());
        
        golsContraList.forEach(item => {
            let nome = item.trim();
            let gols = 1;
            
            const matchPattern = item.match(/^(.+?)\s*\((\d+)\)$/);
            if (matchPattern) {
                nome = matchPattern[1].trim();
                gols = parseInt(matchPattern[2]) || 0;
            }
            
            // Gol contra é contabilizado para o time que SOFREU o gol
            const golsA = result.goalsA || 0;
            const golsB = result.goalsB || 0;
            let time = (golsA < golsB) ? match.a : match.b;
            
            if (!golsContraMap[nome]) {
                golsContraMap[nome] = { nome, gols: 0, time, jogos: 0 };
            }
            golsContraMap[nome].gols += gols;
            golsContraMap[nome].jogos += 1;
        });
    }
    
    return Object.values(golsContraMap)
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 20);
}

// ============================================
// CÁLCULO DAS ESTATÍSTICAS
// ============================================

export function calcularEstatisticas() {
    let totalGols = 0;
    let totalJogos = 0;
    let maiorPlacarA = 0;
    let maiorPlacarB = 0;
    let golsPorTime = {};
    let golsSofridosPorTime = {};
    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    let golsPorGrupo = { A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, I:0, J:0, K:0, L:0 };
    let placares = {};
    let pontosCampeao = [];
    let nomeCampeao = null;
    let faseCampeao = [];
    let isCopaFinalizada = false;
    
    const todosJogos = getTodosOsJogos();
    
    todosJogos.forEach(match => {
        const res = results[match.id];
        if (!res) return;
        
        totalJogos++;
        
        let golsA = res.goalsA;
        let golsB = res.goalsB;
        
        if (res.hasExtraTime) {
            golsA += res.etGoalsA || 0;
            golsB += res.etGoalsB || 0;
        }
        
        totalGols += golsA + golsB;
        
        // Maior placar
        if (golsA > maiorPlacarA || (golsA === maiorPlacarA && golsB > maiorPlacarB)) {
            maiorPlacarA = golsA;
            maiorPlacarB = golsB;
        }
        
        // Gols feitos por time
        golsPorTime[match.a] = (golsPorTime[match.a] || 0) + golsA;
        golsPorTime[match.b] = (golsPorTime[match.b] || 0) + golsB;
        
        // Gols sofridos por time
        golsSofridosPorTime[match.a] = (golsSofridosPorTime[match.a] || 0) + golsB;
        golsSofridosPorTime[match.b] = (golsSofridosPorTime[match.b] || 0) + golsA;
        
        // Gols por grupo (apenas para grupos)
        if (match.g && match.g !== 'MM') {
            golsPorGrupo[match.g] = (golsPorGrupo[match.g] || 0) + golsA + golsB;
        }
        
        // Placar mais comum (formato "X-Y")
        const placarStr = `${Math.min(golsA, golsB)}-${Math.max(golsA, golsB)}`;
        placares[placarStr] = (placares[placarStr] || 0) + 1;
        
        // Resultados (vitória/empate/derrota)
        const winner = getWinner(match, res);
        if (winner === 'A') vitorias++;
        else if (winner === 'B') derrotas++;
        else empates++;
    });
    
    const mediaGols = totalJogos > 0 ? (totalGols / totalJogos).toFixed(2) : 0;
    const maiorPlacar = `${maiorPlacarA} - ${maiorPlacarB}`;
    
    // Artilheiros (ordenar por gols)
    const artilheiros = Object.entries(golsPorTime)
        .map(([time, gols]) => ({ time, gols }))
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 10);
    
    // Defesa (ordenar por gols sofridos)
    const defesa = Object.entries(golsSofridosPorTime)
        .map(([time, gols]) => ({ time, gols }))
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 10);
    
    // Placar mais comum (ordenar por frequência)
    const placarMaisComum = Object.entries(placares)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    // ============================================
    // IDENTIFICAR O CAMPEÃO
    // ============================================
    
    // Obter todo o chaveamento do mata-mata atualizado
    const chave = initChaveamento();
    
    // Verificar se a Grande Final existe e se tem resultado
    if (chave.final && chave.final.resultado && chave.final.vencedor) {
        nomeCampeao = chave.final.vencedor;
        isCopaFinalizada = true;
    }
    
    // ============================================
    // EVOLUÇÃO DO CAMPEÃO
    // ============================================
    
    if (isCopaFinalizada && nomeCampeao) {
        // 1. Obter jogos da fase de grupos (ordenados por data)
        let jogosGrupos = matches
            .filter(m => m.a === nomeCampeao || m.b === nomeCampeao)
            .sort((a, b) => matchDateTime(a) - matchDateTime(b))
            .map(m => ({ ...m, faseTorneio: 'Grupos' }));
            
        // 2. Obter jogos do mata-mata (na ordem cronológica das fases)
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
        
        // Juntar todos os 8 jogos do campeão (3 grupos + 5 mata-mata)
        const jogosCampeao = [...jogosGrupos, ...jogosMataMata];
        let pontosAcumulados = 0;
        
        jogosCampeao.forEach((match, index) => {
            const res = results[match.id];
            if (!res) return;
            
            const winner = getWinner({id: match.id, a: match.a, b: match.b}, res);
            
            // Calcular pontos do jogo para a evolução
            let pontosJogo = 0;
            if (winner === 'A' && match.a === nomeCampeao) pontosJogo = 3;
            else if (winner === 'B' && match.b === nomeCampeao) pontosJogo = 3;
            else if (!winner) pontosJogo = 1; // Empate
            
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
        
        pontosCampeao = faseCampeao.map(p => ({
            jogo: p.jogo,
            pontos: p.pontos,
            fase: p.fase
        }));
    }
    
    return {
        totalGols,
        totalJogos,
        mediaGols,
        maiorPlacar,
        artilheiros,
        defesa,
        vitorias,
        empates,
        derrotas,
        golsPorTime,
        golsPorGrupo,
        placarMaisComum,
        pontosCampeao,
        nomeCampeao,
        faseCampeao,
        isCopaFinalizada
    };
}

// ============================================
// FUNÇÃO AUXILIAR PARA DATAS
// ============================================

function matchDateTime(m) {
    return new Date(`${m.date}T${m.time}:00-03:00`);
}

// ============================================
// ATUALIZAR CARDS
// ============================================

function atualizarCards(stats) {
    document.getElementById('totalGols').textContent = stats.totalGols;
    document.getElementById('mediaGols').textContent = stats.mediaGols;
    document.getElementById('totalJogos').textContent = stats.totalJogos;
    document.getElementById('maiorPlacar').textContent = stats.maiorPlacar;
}

// ============================================
// DESTRUIR GRÁFICOS
// ============================================

function destroyCharts() {
    Object.values(charts).forEach(chart => { if (chart) try { chart.destroy(); } catch(e) {} });
    charts = {};
}

// ============================================
// GRÁFICO 1: ATAQUE (Gols Feitos)
// ============================================

function criarGraficoAtaque(stats) {
    const ctx = document.getElementById('ataqueChart')?.getContext('2d');
    if (!ctx || stats.artilheiros.length === 0) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    charts.ataque = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.artilheiros.map(t => t.time),
            datasets: [{
                label: 'Gols Marcados',
                data: stats.artilheiros.map(t => t.gols),
                backgroundColor: 'rgba(47, 207, 142, 0.7)',
                borderColor: '#2fcf8e',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor, font: { size: 12 } } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#2fcf8e', bodyColor: '#eef4f8' }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Gols', color: textColor } },
                x: { ticks: { color: textColor, font: { size: 9 }, rotation: 25 }, grid: { display: false } }
            }
        }
    });
}

// ============================================
// GRÁFICO 2: DEFESA (Gols Sofridos)
// ============================================

function criarGraficoDefesa(stats) {
    const ctx = document.getElementById('defesaChart')?.getContext('2d');
    if (!ctx || stats.defesa.length === 0) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    charts.defesa = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.defesa.map(t => t.time),
            datasets: [{
                label: 'Gols Sofridos',
                data: stats.defesa.map(t => t.gols),
                backgroundColor: 'rgba(255, 107, 94, 0.7)',
                borderColor: '#ff6b5e',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor, font: { size: 12 } } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#ff6b5e', bodyColor: '#eef4f8' }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Gols Sofridos', color: textColor } },
                x: { ticks: { color: textColor, font: { size: 9 }, rotation: 25 }, grid: { display: false } }
            }
        }
    });
}

// ============================================
// GRÁFICO 3: PLACAR MAIS COMUM
// ============================================

function criarGraficoPlacar(stats) {
    const ctx = document.getElementById('placarChart')?.getContext('2d');
    if (!ctx || stats.placarMaisComum.length === 0) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    charts.placar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.placarMaisComum.map(p => p[0]),
            datasets: [{
                label: 'Frequência',
                data: stats.placarMaisComum.map(p => p[1]),
                backgroundColor: 'rgba(243, 182, 43, 0.7)',
                borderColor: '#f3b62b',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor, font: { size: 12 } } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#f3b62b', bodyColor: '#eef4f8' }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Quantidade de Jogos', color: textColor } },
                x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false }, title: { display: true, text: 'Placar', color: textColor } }
            }
        }
    });
}

// ============================================
// GRÁFICO 4: RESULTADOS DO TORNEIO (Pizza)
// ============================================

function criarGraficoResultados(stats) {
    const ctx = document.getElementById('resultadosChart')?.getContext('2d');
    if (!ctx) return;
    
    const textColor = getTextColor();
    
    charts.resultados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Vitórias (Mandante)', 'Empates', 'Vitórias (Visitante)'],
            datasets: [{ data: [stats.vitorias, stats.empates, stats.derrotas], backgroundColor: ['#2fcf8e', '#f3b62b', '#ff6b5e'], borderWidth: 0, hoverOffset: 10 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 }, usePointStyle: true } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#eef4f8', bodyColor: '#eef4f8' }
            }
        }
    });
}

// ============================================
// GRÁFICO 5: EVOLUÇÃO DO CAMPEÃO
// ============================================

function criarGraficoEvolucao(stats) {
    const ctx = document.getElementById('evolucaoChart')?.getContext('2d');
    if (!ctx) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    // Se a copa não foi finalizada ou não tem dados do campeão
    if (!stats.isCopaFinalizada || stats.pontosCampeao.length === 0) {
        // Exibir mensagem no canvas
        const canvas = document.getElementById('evolucaoChart');
        const parent = canvas.parentElement;
        
        // Remover mensagem antiga se existir
        const oldMsg = parent.querySelector('.evolucao-placeholder');
        if (oldMsg) oldMsg.remove();
        
        // Criar mensagem de aguardando
        const msg = document.createElement('div');
        msg.className = 'evolucao-placeholder';
        msg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: ${textColor};
            font-size: 18px;
            font-weight: 600;
            opacity: 0.8;
            width: 100%;
            padding: 20px;
            pointer-events: none;
        `;
        msg.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
            <div>Aguardando definição do campeão</div>
            <div style="font-size: 14px; opacity: 0.6; margin-top: 8px;">A evolução será exibida após a final</div>
        `;
        parent.style.position = 'relative';
        parent.appendChild(msg);
        
        // Ainda assim criar um gráfico vazio para não quebrar
        charts.evolucao = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Aguardando...'],
                datasets: [{
                    label: '🏆 Campeão será definido na final',
                    data: [0],
                    backgroundColor: 'rgba(243, 182, 43, 0.1)',
                    borderColor: '#f3b62b',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: '#f3b62b',
                    pointBorderColor: textColor === '#1e293b' ? '#fff' : '#0a1a26',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor, font: { size: 12 } } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } }
                }
            }
        });
        return;
    }
    
    // Remover mensagem se existir
    const canvas = document.getElementById('evolucaoChart');
    const parent = canvas.parentElement;
    const oldMsg = parent.querySelector('.evolucao-placeholder');
    if (oldMsg) oldMsg.remove();
    
    // Definir cores das fases
    const coresFase = {
        'Grupos': 'rgba(47, 207, 142, 0.2)',
        '16 avos': 'rgba(52, 152, 219, 0.2)',
        'Oitavas': 'rgba(155, 89, 182, 0.2)',
        'Quartas': 'rgba(243, 182, 43, 0.2)',
        'Semifinal': 'rgba(231, 76, 60, 0.2)',
        'Final': 'rgba(231, 76, 60, 0.4)'
    };
    
    const coresBordaFase = {
        'Grupos': '#2fcf8e',
        '16 avos': '#3498db',
        'Oitavas': '#9b59b6',
        'Quartas': '#f3b62b',
        'Semifinal': '#e74c3c',
        'Final': '#c0392b'
    };
    
    // Criar dataset com cores por fase
    const pontos = stats.pontosCampeao.map(p => p.pontos);
    const labels = stats.pontosCampeao.map(p => {
        const fase = p.fase || `Jogo ${p.jogo}`;
        return `${fase}\n(Jogo ${p.jogo})`;
    });
    
    const borderColors = stats.faseCampeao.map(p => coresBordaFase[p.fase] || '#f3b62b');
    
    charts.evolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${stats.nomeCampeao} - Pontos Acumulados`,
                data: pontos,
                backgroundColor: 'rgba(243, 182, 43, 0.15)',
                borderColor: '#f3b62b',
                borderWidth: 3,
                pointBackgroundColor: borderColors,
                pointBorderColor: textColor === '#1e293b' ? '#fff' : '#0a1a26',
                pointBorderWidth: 2,
                pointRadius: 7,
                pointHoverRadius: 12,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    labels: { 
                        color: textColor, 
                        font: { size: 12, weight: 'bold' } 
                    } 
                },
                tooltip: { 
                    backgroundColor: '#112a3b', 
                    titleColor: '#f3b62b', 
                    bodyColor: '#eef4f8',
                    borderColor: '#f3b62b',
                    borderWidth: 1,
                    callbacks: { 
                        label: (ctx) => {
                            const fase = stats.faseCampeao[ctx.dataIndex];
                            if (fase) {
                                return [
                                    `Pontos: ${ctx.raw}`,
                                    `Fase: ${fase.fase}`,
                                    `Adversário: ${fase.adversario}`,
                                    `Placar: ${fase.golsFeitos} x ${fase.golsSofridos}`,
                                    `Resultado: ${fase.venceu ? '✅ Vitória' : '❌ Derrota/Empate'}`
                                ];
                            }
                            return `Pontos: ${ctx.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1, color: textColor }, 
                    grid: { color: gridColor }, 
                    title: { display: true, text: 'Pontos Acumulados', color: textColor } 
                },
                x: { 
                    ticks: { color: textColor, font: { size: 9 } }, 
                    grid: { display: false },
                    title: { display: true, text: 'Fase do Torneio', color: textColor }
                }
            }
        }
    });
}

// ============================================
// GRÁFICO 6: ARTILHEIROS INDIVIDUAIS
// ============================================

function criarGraficoArtilheirosIndividuais() {
    const ctx = document.getElementById('artilheirosIndividuaisChart')?.getContext('2d');
    if (!ctx) return;
    
    const ranking = calcularArtilheiros();
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    if (ranking.length === 0) {
        // Exibir mensagem de "Sem dados"
        const canvas = document.getElementById('artilheirosIndividuaisChart');
        const parent = canvas.parentElement;
        const oldMsg = parent.querySelector('.artilheiros-placeholder');
        if (oldMsg) oldMsg.remove();
        
        const msg = document.createElement('div');
        msg.className = 'artilheiros-placeholder';
        msg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: ${textColor};
            font-size: 16px;
            opacity: 0.7;
            width: 100%;
            padding: 20px;
            pointer-events: none;
        `;
        msg.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 12px;">⚽</div>
            <div>Nenhum artilheiro cadastrado</div>
            <div style="font-size: 12px; margin-top: 8px;">Adicione os jogadores no cadastro de resultados</div>
        `;
        parent.style.position = 'relative';
        parent.appendChild(msg);
        
        // Criar gráfico vazio
        charts.artilheirosIndividuais = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sem dados'],
                datasets: [{
                    label: 'Gols',
                    data: [0],
                    backgroundColor: 'rgba(243, 182, 43, 0.3)',
                    borderColor: '#f3b62b',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { display: false } }
                }
            }
        });
        return;
    }
    
    // Remover placeholder se existir
    const canvas = document.getElementById('artilheirosIndividuaisChart');
    const parent = canvas.parentElement;
    const oldMsg = parent.querySelector('.artilheiros-placeholder');
    if (oldMsg) oldMsg.remove();
    
    // Pegar top 15 artilheiros para não poluir o gráfico
    const topArtilheiros = ranking.slice(0, 15);
    
    charts.artilheirosIndividuais = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topArtilheiros.map(p => p.nome),
            datasets: [{
                label: 'Gols',
                data: topArtilheiros.map(p => p.gols),
                backgroundColor: 'rgba(243, 182, 43, 0.7)',
                borderColor: '#f3b62b',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor, font: { size: 12 } } },
                tooltip: { 
                    backgroundColor: '#112a3b', 
                    titleColor: '#f3b62b', 
                    bodyColor: '#eef4f8',
                    callbacks: {
                        afterBody: function(context) {
                            const item = ranking[context[0].dataIndex];
                            if (item) {
                                return [`Time: ${item.time || 'N/A'}`, `Jogos: ${item.jogos || 0}`];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1, color: textColor }, 
                    grid: { color: gridColor }, 
                    title: { display: true, text: 'Gols', color: textColor } 
                },
                x: { 
                    ticks: { color: textColor, font: { size: 10 }, rotation: 25 }, 
                    grid: { display: false } 
                }
            }
        }
    });
}

// ============================================
// TABELA DE ARTILHEIROS POR TIME
// ============================================

function atualizarTabelaArtilheiros(stats) {
    const tbody = document.getElementById('artilheirosTableBody');
    if (!tbody) return;
    
    const classificacao = getClassificacao();
    const jogosPorTime = {};
    
    Object.values(classificacao).forEach(grupo => {
        if (grupo && Array.isArray(grupo)) {
            grupo.forEach(time => { if (time && time.time) jogosPorTime[time.time] = time.jogos; });
        }
    });
    
    if (stats.artilheiros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum resultado cadastrado ainda</td></tr>';
        return;
    }
    
    tbody.innerHTML = stats.artilheiros.map((time, idx) => {
        const jogos = jogosPorTime[time.time] || 0;
        const media = jogos > 0 ? (time.gols / jogos).toFixed(2) : '0.00';
        const destaque = idx === 0 ? 'destaque' : '';
        return `
            <tr class="${destaque}">
                <td><strong>${idx + 1}º</strong></td>
                <td style="text-align:left">${time.time}</td>
                <td class="${destaque}" style="font-weight:800">⚽ ${time.gols}</td>
                <td>${jogos}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// TABELA DE ARTILHEIROS INDIVIDUAIS
// ============================================

function atualizarTabelaArtilheirosIndividuais() {
    const tbody = document.getElementById('artilheirosIndividuaisBody');
    if (!tbody) return;
    
    const ranking = calcularArtilheiros();
    
    if (ranking.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum artilheiro cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = ranking.slice(0, 20).map((item, idx) => {
        const destaque = idx === 0 ? 'destaque' : '';
        const media = item.jogos > 0 ? (item.gols / item.jogos).toFixed(2) : '0.00';
        return `
            <tr class="${destaque}">
                <td><strong>${idx + 1}º</strong></td>
                <td style="text-align:left"><strong>${item.nome}</strong></td>
                <td>${item.time || 'N/A'}</td>
                <td class="${destaque}" style="font-weight:800">⚽ ${item.gols}</td>
                <td>${item.jogos || 0}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// TABELA DE GOLS CONTRA
// ============================================

function atualizarTabelaGolsContra() {
    const tbody = document.getElementById('golsContraBody');
    if (!tbody) return;
    
    const golsContra = calcularGolsContra();
    
    if (golsContra.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum gol contra cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = golsContra.map((item, idx) => {
        const destaque = idx === 0 ? 'destaque' : '';
        const media = item.jogos > 0 ? (item.gols / item.jogos).toFixed(2) : '0.00';
        return `
            <tr class="${destaque}">
                <td><strong>${idx + 1}º</strong></td>
                <td style="text-align:left"><strong>${item.nome}</strong></td>
                <td>${item.time || '?'}</td>
                <td style="color: var(--coral, #ff6b5e); font-weight:800;">⚠️ ${item.gols}</td>
                <td>${item.jogos || 0}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// RENDERIZAÇÃO PRINCIPAL
// ============================================

export function renderEstatisticas() {
    const stats = calcularEstatisticas();
    atualizarCards(stats);
    destroyCharts();
    
    setTimeout(() => {
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