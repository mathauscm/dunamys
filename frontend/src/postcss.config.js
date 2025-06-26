export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

// ===== ALTERNATIVA COMMONJS (SE NECESSÁRIO) =====
// module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };

// ===== CONFIGURAÇÃO AVANÇADA (OPCIONAL) =====
// export default {
//   plugins: {
//     'postcss-import': {},
//     'tailwindcss/nesting': {},
//     tailwindcss: {},
//     autoprefixer: {},
//     ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
//   },
// };

// ===== CONFIGURAÇÃO COMPLETA COM TODAS AS OPÇÕES =====
// import tailwindcss from 'tailwindcss';
// import autoprefixer from 'autoprefixer';
// import cssnano from 'cssnano';
// import postcssImport from 'postcss-import';
// import postcssNesting from 'tailwindcss/nesting/index.js';

// export default {
//   plugins: [
//     postcssImport(),
//     postcssNesting(),
//     tailwindcss(),
//     autoprefixer(),
//     ...(process.env.NODE_ENV === 'production' 
//       ? [
//           cssnano({
//             preset: 'default',
//           })
//         ] 
//       : []
//     ),
//   ],
// };

// ===== DESCRIÇÃO DOS PLUGINS =====

/**
 * PLUGINS UTILIZADOS:
 * 
 * 1. tailwindcss: 
 *    - Processa as classes utilitárias do Tailwind
 *    - Gera o CSS final baseado nas classes usadas
 * 
 * 2. autoprefixer:
 *    - Adiciona prefixos CSS automaticamente (-webkit-, -moz-, etc.)
 *    - Garante compatibilidade com navegadores mais antigos
 * 
 * 3. postcss-import (opcional):
 *    - Permite usar @import nos arquivos CSS
 *    - Resolve imports de outros arquivos CSS
 * 
 * 4. tailwindcss/nesting (opcional):
 *    - Permite usar CSS nesting (aninhamento)
 *    - Sintaxe similar ao Sass/SCSS
 * 
 * 5. cssnano (opcional - produção):
 *    - Minifica e otimiza o CSS final
 *    - Remove espaços, comentários e otimiza o código
 */

// ===== EXEMPLO DE USO COM NESTING =====
// Com tailwindcss/nesting habilitado, você pode usar:
// 
// .btn {
//   @apply px-4 py-2 rounded-lg;
//   
//   &:hover {
//     @apply bg-blue-600;
//   }
//   
//   &.btn-large {
//     @apply px-6 py-3 text-lg;
//   }
// }

// ===== TROUBLESHOOTING =====

/**
 * PROBLEMAS COMUNS:
 * 
 * 1. "Unknown at rule @tailwind":
 *    - Certifique-se que tailwindcss está instalado
 *    - Verifique se o PostCSS está configurado no Vite
 * 
 * 2. "Module not found postcss-import":
 *    - Instale: npm install -D postcss-import
 * 
 * 3. Classes Tailwind não funcionam:
 *    - Verifique o arquivo tailwind.config.js
 *    - Confirme que os caminhos no 'content' estão corretos
 * 
 * 4. CSS não é processado:
 *    - Verifique se o arquivo globals.css tem @tailwind directives
 *    - Confirme que o arquivo é importado no main.jsx
 */

// ===== CONFIGURAÇÃO NO VITE =====
// O Vite automaticamente detecta este arquivo postcss.config.js
// Mas você também pode configurar no vite.config.js:
//
// export default defineConfig({
//   css: {
//     postcss: {
//       plugins: [
//         tailwindcss,
//         autoprefixer,
//       ],
//     },
//   },
// });

// ===== PACKAGE.JSON DEPENDENCIES =====
// Certifique-se de ter estas dependências instaladas:
//
// "devDependencies": {
//   "tailwindcss": "^3.3.3",
//   "autoprefixer": "^10.4.15",
//   "postcss": "^8.4.28"
// }

// ===== COMANDOS PARA INSTALAR =====
// npm install -D tailwindcss autoprefixer postcss
// npm install -D postcss-import cssnano  // opcionais