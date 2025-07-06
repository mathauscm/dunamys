// Teste simples de formatação de número
console.log('=== TESTE DE FORMATAÇÃO DE NÚMEROS BRASILEIROS ===\n');

function formatPhoneNumber(phone) {
    if (!phone) {
        throw new Error('Número de telefone é obrigatório');
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    console.log(`Formatando número: ${phone} -> ${cleanPhone} (tamanho: ${cleanPhone.length})`);
    
    // Remover código do país se já existir
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
        cleanPhone = cleanPhone.substring(2);
        console.log(`Removendo código 55 existente: ${cleanPhone}`);
    }
    
    // Validar número brasileiro
    if (cleanPhone.length === 10) {
        // Número fixo: XX + 8 dígitos
        const formatted = `55${cleanPhone}@c.us`;
        console.log(`Número fixo formatado: ${formatted}\n`);
        return formatted;
    } else if (cleanPhone.length === 11) {
        // Número celular: XX + 9 + 8 dígitos
        const formatted = `55${cleanPhone}@c.us`;
        console.log(`Número celular formatado: ${formatted}\n`);
        return formatted;
    } else {
        // Tentar mesmo assim
        const formatted = `55${cleanPhone}@c.us`;
        console.log(`ATENÇÃO - Número com tamanho inválido (${cleanPhone.length}): ${formatted}\n`);
        return formatted;
    }
}

// Testes com vários formatos
const testNumbers = [
    '11987654321',           // Celular SP
    '(11) 98765-4321',       // Celular SP formatado
    '11 98765-4321',         // Celular SP com espaço
    '+55 11 98765-4321',     // Celular SP com código país
    '5511987654321',         // Celular SP com código país sem formatação
    '1133334444',            // Fixo SP
    '(11) 3333-4444',        // Fixo SP formatado
    '+55 11 3333-4444',      // Fixo SP com código país
    '21987654321',           // Celular RJ
    '85988776655'            // Celular CE
];

testNumbers.forEach(number => {
    try {
        formatPhoneNumber(number);
    } catch (error) {
        console.log(`ERRO com ${number}: ${error.message}\n`);
    }
});

console.log('=== FIM DOS TESTES ===');