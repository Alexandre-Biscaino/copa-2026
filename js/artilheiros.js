// ============================================
// ARTILHEIROS - Processamento de Jogadores
// VERSÃO COM SUPORTE A GOLS CONTRA E SELEÇÃO
// ============================================

import { results } from './storage.js';
import { matches } from './dados.js';

// Extrair jogadores e gols do texto (ignorando gols contra)
export function processarArtilheiros(texto) {
    if (!texto || texto.trim() === '') return [];
    
    const artilheiros = [];
    const padrao = /([^,]+?)\s*\((\d+)\)/g;
    let match;
    
    while ((match = padrao.exec(texto)) !== null) {
        const nome = match[1].trim();
        const gols = parseInt(match[2]);
        if (nome && gols > 0) {
            artilheiros.push({ nome, gols });
        }
    }
    
    // Se não encontrou no formato "Nome (gols)", tentar parse simples
    if (artilheiros.length === 0) {
        const partes = texto.split(',').map(p => p.trim());
        partes.forEach(parte => {
            const matchGol = parte.match(/^(.+?)\s*\(?(\d+)\)?$/);
            if (matchGol) {
                const nome = matchGol[1].trim();
                const gols = parseInt(matchGol[2]) || 1;
                if (nome) {
                    artilheiros.push({ nome, gols });
                }
            }
        });
    }
    
    return artilheiros;
}

// Extrair gols contra do texto
export function processarGolsContra(texto) {
    if (!texto || texto.trim() === '') return [];
    
    const golsContra = [];
    const padrao = /([^,]+?)\s*\((\d+)\)/g;
    let match;
    
    while ((match = padrao.exec(texto)) !== null) {
        const nome = match[1].trim();
        const gols = parseInt(match[2]);
        if (nome && gols > 0) {
            golsContra.push({ nome, gols });
        }
    }
    
    // Se não encontrou no formato "Nome (gols)", tentar parse simples
    if (golsContra.length === 0) {
        const partes = texto.split(',').map(p => p.trim());
        partes.forEach(parte => {
            const matchGol = parte.match(/^(.+?)\s*\(?(\d+)\)?$/);
            if (matchGol) {
                const nome = matchGol[1].trim();
                const gols = parseInt(matchGol[2]) || 1;
                if (nome) {
                    golsContra.push({ nome, gols });
                }
            }
        });
    }
    
    return golsContra;
}

// Função auxiliar para identificar o time do jogador
function identificarTime(nome, match) {
    const nomeLower = nome.toLowerCase();
    const timeA = match.a.toLowerCase();
    const timeB = match.b.toLowerCase();
    
    // Tentar identificar pelo nome do time
    if (nomeLower.includes(timeA) || timeA.includes(nomeLower)) {
        return match.a;
    }
    if (nomeLower.includes(timeB) || timeB.includes(nomeLower)) {
        return match.b;
    }
    
    // Verificar jogadores famosos
    const jogadoresFamosos = {
        'Neymar': 'Brasil',
        'Vinicius': 'Brasil',
        'Richarlison': 'Brasil',
        'Messi': 'Argentina',
        'Cristiano': 'Portugal',
        'Mbappé': 'França',
        'Haaland': 'Noruega',
        'Bellingham': 'Inglaterra',
        'Kane': 'Inglaterra',
        'Modric': 'Croácia',
        'Lewandowski': 'Polônia',
        'Salah': 'Egito',
        'Mane': 'Senegal',
        'De Bruyne': 'Bélgica',
        'Griezmann': 'França',
        'Gnabry': 'Alemanha',
        'Muller': 'Alemanha',
        'Kroos': 'Alemanha',
        'Ramos': 'Espanha',
        'Pique': 'Espanha',
        'Busquets': 'Espanha',
        'Iniesta': 'Espanha',
        'Xavi': 'Espanha',
        'Puyol': 'Espanha',
        'Casillas': 'Espanha',
        'Ramos': 'Espanha',
        'Pepe': 'Portugal',
        'Jota': 'Portugal',
        'Bruno Fernandes': 'Portugal',
        'Bernardo Silva': 'Portugal',
        'Dias': 'Portugal',
        'Cancelo': 'Portugal'
    };
    
    for (const [key, value] of Object.entries(jogadoresFamosos)) {
        if (nome.includes(key)) {
            if (match.a === value || match.b === value) {
                return value;
            }
        }
    }
    
    return '?';
}

// Calcular estatísticas dos artilheiros (ignorando gols contra)
export function calcularArtilheiros() {
    const artilheirosMap = {};
    const jogosPorJogador = {};
    const timePorJogador = {};
    
    matches.forEach(match => {
        const res = results[match.id];
        if (!res) return;
        
        // Processar artilheiros normais
        if (res.artilheiros) {
            const artilheiros = processarArtilheiros(res.artilheiros);
            
            artilheiros.forEach(({ nome, gols }) => {
                if (!artilheirosMap[nome]) {
                    artilheirosMap[nome] = 0;
                    jogosPorJogador[nome] = 0;
                    timePorJogador[nome] = identificarTime(nome, match);
                }
                
                artilheirosMap[nome] += gols;
                jogosPorJogador[nome] = (jogosPorJogador[nome] || 0) + 1;
            });
        }
        
        // Processar gols contra (NÃO contam para artilheiros)
        if (res.golsContra) {
            const golsContra = processarGolsContra(res.golsContra);
            
            // Registrar gols contra separadamente (não entram no ranking)
            golsContra.forEach(({ nome, gols }) => {
                // Apenas log para debug
                console.log(`⚠️ Gol contra: ${nome} (${gols}) no jogo ${match.a} vs ${match.b}`);
            });
        }
    });
    
    // Ordenar por gols
    const ranking = Object.entries(artilheirosMap)
        .map(([nome, gols]) => ({
            nome,
            gols,
            jogos: jogosPorJogador[nome] || 0,
            time: timePorJogador[nome] || '?'
        }))
        .sort((a, b) => b.gols - a.gols)
        .slice(0, 10);
    
    return ranking;
}

// Obter lista de gols contra (para exibição separada com seleção)
export function getGolsContra() {
    const golsContraMap = {};
    
    matches.forEach(match => {
        const res = results[match.id];
        if (!res || !res.golsContra) return;
        
        const golsContra = processarGolsContra(res.golsContra);
        
        golsContra.forEach(({ nome, gols }) => {
            // Identificar a seleção do jogador que fez o gol contra
            const time = identificarTime(nome, match);
            
            if (!golsContraMap[nome]) {
                golsContraMap[nome] = {
                    nome,
                    time,
                    gols: 0,
                    jogos: 0
                };
            }
            golsContraMap[nome].gols += gols;
            golsContraMap[nome].jogos += 1;
            
            // Atualizar seleção se for diferente (pegar a que aparecer mais)
            if (golsContraMap[nome].time === '?' && time !== '?') {
                golsContraMap[nome].time = time;
            }
        });
    });
    
    return Object.values(golsContraMap)
        .sort((a, b) => b.gols - a.gols);
}