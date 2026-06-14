// ============================================
// STORAGE - localStorage Manager
// ============================================

// Resultados dos jogos
export let results = {};

// Tema atual ('dark' ou 'light')
export let currentTheme = 'dark';

// Carregar todos os dados salvos
export function loadFromStorage() {
    // Carregar resultados dos jogos
    const savedResults = localStorage.getItem("copa2026_results");
    if (savedResults) {
        results = JSON.parse(savedResults);
    }
    
    // Carregar tema salvo
    const savedTheme = localStorage.getItem("copa2026_theme");
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        currentTheme = savedTheme;
    } else {
        // Detectar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = prefersDark ? 'dark' : 'light';
    }
    
    applyTheme(currentTheme);
}

// Salvar resultados dos jogos
export function saveResults() {
    localStorage.setItem("copa2026_results", JSON.stringify(results));
}

// Salvar tema
export function saveTheme(theme) {
    currentTheme = theme;
    localStorage.setItem("copa2026_theme", theme);
    applyTheme(theme);
}

// Aplicar tema ao documento
export function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.style.setProperty('--bg', '#f0f4f8');
        document.documentElement.style.setProperty('--bg-deep', '#e2e8f0');
        document.documentElement.style.setProperty('--card', '#ffffff');
        document.documentElement.style.setProperty('--card-hover', '#f8fafc');
        document.documentElement.style.setProperty('--line', '#cbd5e1');
        document.documentElement.style.setProperty('--text', '#1e293b');
        document.documentElement.style.setProperty('--text-dim', '#64748b');
    } else {
        document.documentElement.style.setProperty('--bg', '#0a1a26');
        document.documentElement.style.setProperty('--bg-deep', '#061119');
        document.documentElement.style.setProperty('--card', '#112a3b');
        document.documentElement.style.setProperty('--card-hover', '#163647');
        document.documentElement.style.setProperty('--line', 'rgba(255,255,255,0.08)');
        document.documentElement.style.setProperty('--text', '#eef4f8');
        document.documentElement.style.setProperty('--text-dim', '#89a0b3');
    }
    
    // Atualizar ícone do botão de tema
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
        themeBtn.title = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    }
    
    // Forçar recriação dos gráficos para aplicar as novas cores
    setTimeout(() => {
        if (typeof window.renderEstatisticas === 'function') {
            window.renderEstatisticas();
        }
        if (typeof window.renderClassificacao === 'function') {
            window.renderClassificacao();
        }
        if (typeof window.renderJogos === 'function') {
            window.renderJogos();
        }
        if (typeof window.renderMataMata === 'function') {
            window.renderMataMata();
        }
    }, 100);
}

// Alternar tema (dark <-> light)
export function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(newTheme);
}

// Salvar resultado de um jogo específico
export function saveMatchResult(matchId, resultData) {
    results[matchId] = resultData;
    saveResults();
}

// Remover resultado de um jogo
export function clearMatchResult(matchId) {
    delete results[matchId];
    saveResults();
}

// Calcular vencedor final de uma partida
export function getWinner(match, res) {
    if (!res) return null;
    
    let winner = null;
    const normalA = res.goalsA || 0;
    const normalB = res.goalsB || 0;
    
    // Verificar prorrogação
    if (res.hasExtraTime && res.etGoalsA !== undefined && res.etGoalsB !== undefined) {
        const etA = res.etGoalsA;
        const etB = res.etGoalsB;
        if (etA > etB) winner = "A";
        else if (etB > etA) winner = "B";
        // Se empatou na prorrogação, vai para pênaltis
        else if (res.hasPenalties && res.penA !== undefined && res.penB !== undefined) {
            winner = res.penA > res.penB ? "A" : (res.penB > res.penA ? "B" : null);
        }
    }
    
    // Se não houve prorrogação ou não definiu vencedor, usar tempo normal
    if (!winner) {
        if (normalA > normalB) winner = "A";
        else if (normalB > normalA) winner = "B";
    }
    
    return winner;
}

// Formatar texto do resultado para exibição
export function getResultText(match) {
    const res = results[match.id];
    if (!res) return null;
    
    const winner = getWinner(match, res);
    const normal = `${res.goalsA} - ${res.goalsB}`;
    
    if (res.hasExtraTime) {
        if (res.hasPenalties) {
            return `${normal} (${res.etGoalsA}-${res.etGoalsB} / ${res.penA}-${res.penB} pen.)`;
        }
        return `${normal} (${res.etGoalsA}-${res.etGoalsB} prorr.)`;
    }
    return normal;
}

// Verificar se um jogo já tem resultado
export function hasResult(matchId) {
    return !!results[matchId];
}