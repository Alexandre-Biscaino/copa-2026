// ============================================
// CLASSIFICAÇÃO - Tabelas de Grupos
// ============================================

import { results, getWinner } from './storage.js';
import { matches, groups, groupColor } from './dados.js';

// Estrutura para armazenar dados de cada time
let classificacao = {};

// Inicializar estrutura de classificação
export function initClassificacao() {
    // Criar estrutura para todos os grupos
    groups.forEach(grupo => {
        classificacao[grupo] = {};
        
        // Pegar todos os times únicos do grupo
        const timesDoGrupo = [...new Set(
            matches.filter(m => m.g === grupo)
                   .flatMap(m => [m.a, m.b])
        )];
        
        timesDoGrupo.forEach(time => {
            classificacao[grupo][time] = {
                time: time,
                grupo: grupo,
                jogos: 0,
                vitorias: 0,
                empates: 0,
                derrotas: 0,
                golsPro: 0,
                golsContra: 0,
                saldo: 0,
                pontos: 0
            };
        });
    });
}

// Calcular classificação atualizada com base nos resultados
export function calcularClassificacao() {
    // Resetar dados
    initClassificacao();
    
    // Percorrer todos os jogos com resultado
    matches.forEach(match => {
        const res = results[match.id];
        if (!res) return; // Sem resultado ainda
        
        const winner = getWinner(match, res);
        const golsA = res.goalsA || 0;
        const golsB = res.goalsB || 0;
        
        // Time A
        const timeA = classificacao[match.g][match.a];
        if (timeA) {
            timeA.jogos++;
            timeA.golsPro += golsA;
            timeA.golsContra += golsB;
            timeA.saldo = timeA.golsPro - timeA.golsContra;
            
            if (winner === 'A') {
                timeA.vitorias++;
                timeA.pontos += 3;
            } else if (winner === 'B') {
                timeA.derrotas++;
            } else {
                timeA.empates++;
                timeA.pontos += 1;
            }
        }
        
        // Time B
        const timeB = classificacao[match.g][match.b];
        if (timeB) {
            timeB.jogos++;
            timeB.golsPro += golsB;
            timeB.golsContra += golsA;
            timeB.saldo = timeB.golsPro - timeB.golsContra;
            
            if (winner === 'B') {
                timeB.vitorias++;
                timeB.pontos += 3;
            } else if (winner === 'A') {
                timeB.derrotas++;
            } else {
                timeB.empates++;
                timeB.pontos += 1;
            }
        }
    });
    
    // Ordenar cada grupo
    groups.forEach(grupo => {
        const times = Object.values(classificacao[grupo]);
        times.sort((a, b) => {
            if (a.pontos !== b.pontos) return b.pontos - a.pontos;
            if (a.saldo !== b.saldo) return b.saldo - a.saldo;
            if (a.golsPro !== b.golsPro) return b.golsPro - a.golsPro;
            return 0;
        });
        classificacao[grupo] = times;
    });
    
    return classificacao;
}

// Obter os melhores terceiros colocados
export function getMelhoresTerceiros() {
    const terceiros = [];
    
    groups.forEach(grupo => {
        const ranking = classificacao[grupo];
        if (ranking && ranking[2]) {
            terceiros.push({
                ...ranking[2],
                grupo: grupo
            });
        }
    });
    
    // Ordenar por critérios
    terceiros.sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.saldo !== b.saldo) return b.saldo - a.saldo;
        if (a.golsPro !== b.golsPro) return b.golsPro - a.golsPro;
        return 0;
    });
    
    // Retornar os 8 melhores
    return terceiros.slice(0, 8);
}

// Verificar se um time está classificado (1º, 2º ou melhor 3º)
export function isClassified(time, grupo, posicao) {
    const melhoresTerceiros = getMelhoresTerceiros();
    const ranking = classificacao[grupo];
    
    if (!ranking) return false;
    
    // Encontrar posição do time
    const index = ranking.findIndex(t => t.time === time);
    
    // 1º e 2º lugar sempre classificados
    if (index === 0 || index === 1) return true;
    
    // Verificar se é um dos melhores terceiros
    if (index === 2) {
        return melhoresTerceiros.some(t => t.time === time && t.grupo === grupo);
    }
    
    return false;
}

// Obter posição do time no grupo
export function getPosicaoNoGrupo(time, grupo) {
    const ranking = classificacao[grupo];
    if (!ranking) return null;
    
    const index = ranking.findIndex(t => t.time === time);
    return index !== -1 ? index + 1 : null;
}

// Renderizar tabelas de classificação na tela
export function renderClassificacao() {
    const container = document.getElementById('gruposList');
    if (!container) return;
    
    calcularClassificacao();
    const melhoresTerceiros = getMelhoresTerceiros();
    
    let html = '<div class="grupos-grid">';
    
    groups.forEach(grupo => {
        const ranking = classificacao[grupo];
        if (!ranking || ranking.length === 0) return;
        
        const corGrupo = groupColor(grupo);
        
        html += `
            <div class="grupo-card">
                <div class="grupo-header" style="color: ${corGrupo}; border-left: 4px solid ${corGrupo};">
                    GRUPO ${grupo}
                </div>
                <table class="grupo-tabela">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th style="text-align:left">Seleção</th>
                            <th>P</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>GP</th>
                            <th>GC</th>
                            <th>SG</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        ranking.forEach((time, idx) => {
            let classeLinha = '';
            let badge = '';
            
            if (idx === 0) {
                classeLinha = 'classificado-1';
                badge = '🏆';
            } else if (idx === 1) {
                classeLinha = 'classificado-2';
                badge = '✅';
            } else if (idx === 2) {
                const isMelhorTerceiro = melhoresTerceiros.some(t => t.time === time.time && t.grupo === grupo);
                if (isMelhorTerceiro) {
                    classeLinha = 'classificado-3';
                    badge = '⚠️';
                }
            }
            
            html += `
                <tr class="${classeLinha}">
                    <td><strong>${idx + 1}º</strong> ${badge}</td>
                    <td style="text-align:left"><strong>${time.time}</strong></td>
                    <td><strong>${time.pontos}</strong></td>
                    <td>${time.jogos}</td>
                    <td>${time.vitorias}</td>
                    <td>${time.empates}</td>
                    <td>${time.derrotas}</td>
                    <td>${time.golsPro}</td>
                    <td>${time.golsContra}</td>
                    <td>${time.saldo > 0 ? '+' : ''}${time.saldo}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Adicionar seção dos melhores terceiros
    if (melhoresTerceiros.length > 0) {
        html += `
            <div style="margin-top: 40px; padding: 20px; background: var(--card); border-radius: 20px; border: 1px solid var(--line);">
                <h3 style="font-family: 'Anton', sans-serif; margin-bottom: 16px; color: var(--gold);">
                    📊 8 MELHORES TERCEIROS COLOCADOS
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        `;
        
        melhoresTerceiros.forEach((time, idx) => {
            html += `
                <div style="background: var(--bg-deep); padding: 8px 16px; border-radius: 40px; border-left: 3px solid var(--gold);">
                    <strong>${idx + 1}º</strong> ${time.time} (Grupo ${time.grupo}) - ${time.pontos} pts
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Exportar classificação para uso em outras partes (mata-mata)
export function getClassificacao() {
    calcularClassificacao();
    return classificacao;
}