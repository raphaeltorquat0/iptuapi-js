# JavaScript/TypeScript SDK Status

**Última atualização:** 2026-01-24
**Versão:** 2.1.2
**Status:** 🟢 FUNCIONAL

---

## Informações

| Item | Valor |
|------|-------|
| **Versão** | 2.1.2 |
| **Registry** | npm (`npm install iptuapi`) |
| **Status** | 🟢 FUNCIONAL |
| **Mínimo** | Node.js 18+ |

## Instalação

```bash
npm install iptuapi
```

## Exemplo Rápido

```javascript
const { IPTUClient } = require('iptuapi');

const client = new IPTUClient('sua_api_key');
const cidades = await client.iptuToolsCidades();
console.log(`${cidades.total} cidades disponíveis`);
```

## Validação Automática

Este SDK é validado automaticamente:
- ✅ Instalação limpa via npm
- ✅ Import do pacote (CJS e ESM)
- ✅ Teste contra API real (`iptuToolsCidades`)
- ✅ Teste autenticado (`consultaEndereco`)

---

*Atualizado automaticamente pelo CI/CD*
