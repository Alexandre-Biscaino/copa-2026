// ============================================
// BANDEIRAS - Versão com imagens (fallback para emojis)
// ============================================

// Mapeamento de sigla para código do país (para imagem)
const codigoPais = {
    'MX': 'mx', 'KR': 'kr', 'CZ': 'cz', 'ZA': 'za',
    'BR': 'br', 'AR': 'ar', 'DE': 'de', 'FR': 'fr',
    'ES': 'es', 'PT': 'pt', 'GB': 'gb', 'NL': 'nl',
    'BE': 'be', 'US': 'us', 'UY': 'uy', 'CO': 'co',
    'JP': 'jp', 'IT': 'it', 'HR': 'hr', 'SE': 'se',
    'DK': 'dk', 'CH': 'ch', 'AT': 'at', 'TR': 'tr',
    'PL': 'pl', 'RS': 'rs', 'NO': 'no', 'SCO': 'gb-sct',
    'UA': 'ua', 'MA': 'ma', 'SN': 'sn', 'TN': 'tn',
    'EG': 'eg', 'DZ': 'dz', 'NG': 'ng', 'CM': 'cm',
    'CI': 'ci', 'GH': 'gh', 'CD': 'cd', 'CV': 'cv',
    'AU': 'au', 'IR': 'ir', 'SA': 'sa', 'QA': 'qa',
    'IQ': 'iq', 'UZ': 'uz', 'JO': 'jo', 'NZ': 'nz',
    'CA': 'ca', 'PA': 'pa', 'HT': 'ht', 'CW': 'cw',
    'BA': 'ba', 'PY': 'py', 'EC': 'ec'
};

export function getBandeira(sigla) {
    if (!sigla) return '🏁';
    
    const codigo = codigoPais[sigla];
    if (codigo) {
        // Usar imagem SVG do Flagpedia (gratuito)
        return `<img src="https://flagpedia.net/data/flags/icon/72x54/${codigo}.png" 
                     class="flag-img" 
                     alt="${sigla}" 
                     style="width: 24px; height: 18px; vertical-align: middle; display: inline-block;">`;
    }
    return '🏁';
}

// Versão emoji (fallback se quiser tentar)
export function getBandeiraEmoji(sigla) {
    const emojis = {
        'MX': '🇲🇽', 'KR': '🇰🇷', 'CZ': '🇨🇿', 'ZA': '🇿🇦',
        'BR': '🇧🇷', 'AR': '🇦🇷', 'DE': '🇩🇪', 'FR': '🇫🇷',
        'ES': '🇪🇸', 'PT': '🇵🇹', 'GB': '🏴', 'NL': '🇳🇱',
        'BE': '🇧🇪', 'US': '🇺🇸', 'UY': '🇺🇾', 'CO': '🇨🇴',
        'JP': '🇯🇵', 'IT': '🇮🇹', 'HR': '🇭🇷', 'SE': '🇸🇪',
        'DK': '🇩🇰', 'CH': '🇨🇭', 'AT': '🇦🇹', 'TR': '🇹🇷',
        'PL': '🇵🇱', 'RS': '🇷🇸', 'NO': '🇳🇴', 'SCO': '🏴',
        'UA': '🇺🇦', 'MA': '🇲🇦', 'SN': '🇸🇳', 'TN': '🇹🇳',
        'EG': '🇪🇬', 'DZ': '🇩🇿', 'NG': '🇳🇬', 'CM': '🇨🇲',
        'CI': '🇨🇮', 'GH': '🇬🇭', 'CD': '🇨🇩', 'CV': '🇨🇻',
        'AU': '🇦🇺', 'IR': '🇮🇷', 'SA': '🇸🇦', 'QA': '🇶🇦',
        'IQ': '🇮🇶', 'UZ': '🇺🇿', 'JO': '🇯🇴', 'NZ': '🇳🇿',
        'CA': '🇨🇦', 'PA': '🇵🇦', 'HT': '🇭🇹', 'CW': '🇨🇼',
        'BA': '🇧🇦', 'PY': '🇵🇾', 'EC': '🇪🇨'
    };
    return emojis[sigla] || '🏁';
}