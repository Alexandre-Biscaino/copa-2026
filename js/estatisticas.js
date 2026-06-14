// ============================================
// ESTATÍSTICAS - Gráficos e Dados Avançados
// VERSÃO DEFINITIVA - CORES DINÂMICAS (MODO CLARO/ESCURO)
// ============================================

import { results, getWinner } from './storage.js';
import { matches } from './dados.js';
import { getClassificacao } from './classificacao.js';

let charts = {};

// Obter cor do texto baseada no tema atual
function getTextColor() {
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    // Se fundo for claro (rgb próximo de branco), texto escuro
    if (bgColor === '#f0f4f8' || bgColor === '#e2e8f0' || bgColor === '#ffffff') {
        return '#1e293b'; // texto escuro para modo claro
    }
    return '#eef4f8'; // texto claro para modo escuro
}

function getGridColor() {
    const textColor = getTextColor();
    return textColor === '#1e293b' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
}

// Calcular todas as estatísticas
export function calcularEstatisticas() {
    let totalGols = 0;
    let totalJogos = 0;
    let maiorPlacarA = 0;
    let maiorPlacarB = 0;
    let golsPorTime = {};
    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    let golsPorGrupo = { A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, I:0, J:0, K:0, L:0 };
    
    matches.forEach(match => {
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
        
        if (golsA > maiorPlacarA || (golsA === maiorPlacarA && golsB > maiorPlacarB)) {
            maiorPlacarA = golsA;
            maiorPlacarB = golsB;
        }
        
        golsPorTime[match.a] = (golsPorTime[match.a] || 0) + golsA;
        golsPorTime[match.b] = (golsPorTime[match.b] || 0) + golsB;
        golsPorGrupo[match.g] = (golsPorGrupo[match.g] || 0) + golsA + golsB;
        
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
    
    return { totalGols, totalJogos, mediaGols, maiorPlacar, artilheiros, vitorias, empates, derrotas, golsPorTime, golsPorGrupo };
}

function atualizarCards(stats) {
    const elements = ['totalGols', 'mediaGols', 'totalJogos', 'maiorPlacar'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = stats[id === 'maiorPlacar' ? 'maiorPlacar' : id];
    });
}

function destroyCharts() {
    Object.values(charts).forEach(chart => { if (chart) try { chart.destroy(); } catch(e) {} });
    charts = {};
}

function criarGraficoArtilheiros(stats) {
    const ctx = document.getElementById('artilheirosChart')?.getContext('2d');
    if (!ctx || stats.artilheiros.length === 0) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    charts.artilheiros = new Chart(ctx, {
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
                tooltip: { backgroundColor: '#112a3b', titleColor: '#2fcf8e', bodyColor: '#eef4f8', borderColor: '#2fcf8e', borderWidth: 1 }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor, font: { size: 11 } }, grid: { color: gridColor }, title: { display: true, text: 'Gols', color: textColor, font: { size: 10 } } },
                x: { ticks: { color: textColor, font: { size: 9 }, rotation: 25, autoSkip: true, maxRotation: 45, minRotation: 25 }, grid: { display: false } }
            }
        }
    });
}

function criarGraficoGolsTime(stats) {
    const ctx = document.getElementById('golsTimeChart')?.getContext('2d');
    if (!ctx) return;
    
    const topTimes = Object.entries(stats.golsPorTime).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (topTimes.length === 0) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    charts.golsTime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTimes.map(t => t[0]),
            datasets: [{
                label: 'Total de Gols',
                data: topTimes.map(t => t[1]),
                backgroundColor: 'rgba(88, 182, 255, 0.7)',
                borderColor: '#58b6ff',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor, font: { size: 12 } } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#58b6ff', bodyColor: '#eef4f8', borderColor: '#58b6ff', borderWidth: 1 }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 2, color: textColor, font: { size: 11 } }, grid: { color: gridColor }, title: { display: true, text: 'Gols', color: textColor, font: { size: 10 } } },
                x: { ticks: { color: textColor, font: { size: 9 }, rotation: 25, autoSkip: true }, grid: { display: false } }
            }
        }
    });
}

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
                legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#eef4f8', bodyColor: '#eef4f8' }
            }
        }
    });
}

function criarGraficoGolsGrupo(stats) {
    const ctx = document.getElementById('golsGrupoChart')?.getContext('2d');
    if (!ctx) return;
    
    const textColor = getTextColor();
    const gridColor = getGridColor();
    
    charts.golsGrupo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(stats.golsPorGrupo),
            datasets: [{
                label: 'Total de Gols por Grupo',
                data: Object.values(stats.golsPorGrupo),
                backgroundColor: 'rgba(243, 182, 43, 0.15)',
                borderColor: '#f3b62b',
                borderWidth: 3,
                pointBackgroundColor: '#f3b62b',
                pointBorderColor: textColor === '#1e293b' ? '#fff' : '#0a1a26',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 10,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor, font: { size: 12, weight: 'bold' } } },
                tooltip: { backgroundColor: '#112a3b', titleColor: '#f3b62b', bodyColor: '#eef4f8', borderColor: '#f3b62b', borderWidth: 1, callbacks: { label: (ctx) => `Gols: ${ctx.raw}` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor, font: { size: 11 } }, grid: { color: gridColor }, title: { display: true, text: 'Total de Gols', color: textColor, font: { size: 10 } } },
                x: { ticks: { color: textColor, font: { size: 13, weight: 'bold' } }, grid: { display: false }, title: { display: true, text: 'Grupos', color: textColor, font: { size: 10 } } }
            }
        }
    });
}

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

export function renderEstatisticas() {
    const stats = calcularEstatisticas();
    atualizarCards(stats);
    destroyCharts();
    setTimeout(() => {
        criarGraficoArtilheiros(stats);
        criarGraficoGolsTime(stats);
        criarGraficoResultados(stats);
        criarGraficoGolsGrupo(stats);
        atualizarTabelaArtilheiros(stats);
    }, 50);
}