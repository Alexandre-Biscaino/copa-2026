import { matches } from './dados.js';

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

export function getBandeira(entrada) {
    if (!entrada) return '🏁';
    
    let sigla = entrada;
    
    // CORREÇÃO: Removemos a limitação de caracteres.
    // Agora o sistema sempre checa se o nome procurado existe como seleção.
    const jogoEncontrado = matches.find(m => m.a === entrada || m.b === entrada);
    
    if (jogoEncontrado) {
        sigla = jogoEncontrado.a === entrada ? jogoEncontrado.fa : jogoEncontrado.fb;
    }
    
    const codigo = codigoPais[sigla];
    if (codigo) {
        return `<img src="https://flagpedia.net/data/flags/icon/72x54/${codigo}.png" 
                     class="flag-img" 
                     alt="${entrada}" 
                     style="width: 24px; height: 18px; vertical-align: middle; display: inline-block;">`;
    }
    return '🏁';
}