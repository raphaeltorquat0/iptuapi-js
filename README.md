# IPTU API - JavaScript/TypeScript SDK

SDK oficial para integracao com a IPTU API. Acesso a dados de IPTU e ITBI de Sao Paulo, Belo Horizonte e Recife.

[![npm version](https://img.shields.io/npm/v/iptuapi)](https://www.npmjs.com/package/iptuapi)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

## Instalacao

```bash
npm install iptuapi
```

ou com yarn:

```bash
yarn add iptuapi
```

ou com pnpm:

```bash
pnpm add iptuapi
```

## Requisitos

- Node.js 18+
- TypeScript 5.0+ (opcional, para tipagem)

## Uso Rapido

```typescript
import { IPTUClient } from 'iptuapi';

const client = new IPTUClient('sua_api_key');

// Consulta por endereco
const imoveis = await client.consultaEndereco('Avenida Paulista', '1000', 'sp');
for (const imovel of imoveis) {
  console.log(`SQL: ${imovel.sql}`);
  console.log(`Valor Venal: R$ ${imovel.valorVenal?.toLocaleString('pt-BR')}`);
}

// Consulta por SQL (Starter+)
const dados = await client.consultaSQL('008.045.0123-4', 'sp');
```

### CommonJS

```javascript
const { IPTUClient } = require('iptuapi');

const client = new IPTUClient('sua_api_key');
```

## Configuracao

### Cliente Basico

```typescript
import { IPTUClient } from 'iptuapi';

const client = new IPTUClient('sua_api_key');
```

### Configuracao Avancada

```typescript
import { IPTUClient } from 'iptuapi';

const client = new IPTUClient('sua_api_key', {
  baseUrl: 'https://iptuapi.com.br/api/v1',
  timeout: 60000, // 60 segundos
  retryConfig: {
    maxRetries: 5,
    initialDelay: 1000,      // ms
    maxDelay: 30000,         // ms
    backoffFactor: 2.0,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  },
});
```

---

## Endpoints de Consulta IPTU

### Consulta por Endereco

Busca dados de IPTU por logradouro e numero. Disponivel em **todos os planos**.

```typescript
const imoveis = await client.consultaEndereco('Avenida Paulista', '1000', 'sp');

for (const imovel of imoveis) {
  console.log(`SQL: ${imovel.sql}`);
  console.log(`Bairro: ${imovel.bairro}`);
  console.log(`Area Terreno: ${imovel.areaTerreno} m2`);
  console.log(`Area Construida: ${imovel.areaConstruida} m2`);
  console.log(`Valor Venal: R$ ${imovel.valorVenal?.toLocaleString('pt-BR')}`);
}
```

**Parametros:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| logradouro | string | Sim | Nome da rua/avenida |
| numero | string | Sim | Numero do imovel |
| cidade | Cidade | Nao | Codigo da cidade (sp, bh, recife). Default: sp |

**Tipo Imovel:**

```typescript
interface Imovel {
  sql: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep?: string;
  areaTerreno?: number;
  areaConstruida?: number;
  valorVenal?: number;
  valorVenalTerreno?: number;
  valorVenalConstrucao?: number;
  anoConstrucao?: number;
  uso?: string;
  padrao?: string;
}
```

---

### Consulta por SQL/Indice Cadastral

Busca por identificador unico do imovel. Disponivel a partir do plano **Starter**.

```typescript
// Sao Paulo - numero SQL
const imoveis = await client.consultaSQL('008.045.0123-4', 'sp');

// Belo Horizonte - indice cadastral
const imoveisBH = await client.consultaSQL('007028 005 0086', 'bh');

// Recife - sequencial
const imoveisRecife = await client.consultaSQL('123456', 'recife');
```

---

### Consulta por CEP

Busca todos os imoveis de um CEP. Disponivel em **todos os planos**.

```typescript
const imoveis = await client.consultaCEP('01310-100', 'sp');
console.log(`Encontrados: ${imoveis.length} imoveis`);
```

---

### Consulta Zoneamento

Retorna informacoes de zoneamento por coordenadas. Disponivel em **todos os planos**.

```typescript
const zoneamento = await client.consultaZoneamento(-23.5505, -46.6333);

console.log(`Zona: ${zoneamento.zona}`);
console.log(`Uso Permitido: ${zoneamento.usoPermitido}`);
console.log(`Coeficiente: ${zoneamento.coeficienteAproveitamento}`);
```

---

## Endpoints de Valuation

### Estimativa de Valor de Mercado

Calcula valor estimado de mercado. Disponivel a partir do plano **Pro**.

```typescript
const avaliacao = await client.valuationEstimate({
  areaTerreno: 250,
  areaConstruida: 180,
  bairro: 'Pinheiros',
  cidade: 'sp',
  zona: 'ZM',
  tipoUso: 'Residencial',
  tipoPadrao: 'Medio',
  anoConstrucao: 2010,
});

console.log(`Valor Estimado: R$ ${avaliacao.valorEstimado.toLocaleString('pt-BR')}`);
console.log(`Confianca: ${(avaliacao.confianca * 100).toFixed(1)}%`);
console.log(`Faixa: R$ ${avaliacao.valorMinimo.toLocaleString('pt-BR')} - R$ ${avaliacao.valorMaximo.toLocaleString('pt-BR')}`);
```

**Tipo Valuation:**

```typescript
interface Valuation {
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  confianca: number;
  valorM2: number;
  metodologia: string;
  dataReferencia: string;
}
```

---

### Buscar Comparaveis

Retorna imoveis similares para comparacao. Disponivel a partir do plano **Pro**.

```typescript
const comparaveis = await client.valuationComparables({
  bairro: 'Pinheiros',
  areaMin: 150,
  areaMax: 250,
  cidade: 'sp',
  limit: 10,
});

for (const comp of comparaveis) {
  console.log(`SQL: ${comp.sql}`);
  console.log(`Area: ${comp.areaConstruida} m2`);
  console.log(`Valor: R$ ${comp.valorVenal.toLocaleString('pt-BR')}`);
}
```

---

## Endpoints de ITBI

### Status da Transacao ITBI

Consulta status de uma transacao ITBI. Disponivel em **todos os planos**.

```typescript
const status = await client.itbiStatus('ITBI-2024-123456', 'sp');

console.log(`Protocolo: ${status.protocolo}`);
console.log(`Status: ${status.status}`);
console.log(`Valor Transacao: R$ ${status.valorTransacao.toLocaleString('pt-BR')}`);
console.log(`Valor ITBI: R$ ${status.valorITBI.toLocaleString('pt-BR')}`);
```

**Tipo ITBIStatus:**

```typescript
interface ITBIStatus {
  protocolo: string;
  status: string;
  dataSolicitacao: string;
  valorTransacao: number;
  valorVenalReferencia: number;
  baseCalculo: number;
  aliquota: number;
  valorITBI: number;
  dataAprovacao?: string;
}
```

---

### Calculo de ITBI

Calcula valor do ITBI para uma transacao. Disponivel em **todos os planos**.

```typescript
const calculo = await client.itbiCalcular({
  sql: '008.045.0123-4',
  valorTransacao: 500000,
  cidade: 'sp',
});

console.log(`Base de Calculo: R$ ${calculo.baseCalculo.toLocaleString('pt-BR')}`);
console.log(`Aliquota: ${(calculo.aliquota * 100).toFixed(1)}%`);
console.log(`Valor ITBI: R$ ${calculo.valorITBI.toLocaleString('pt-BR')}`);
```

---

### Historico de Transacoes ITBI

Retorna historico de transacoes de um imovel. Disponivel a partir do plano **Starter**.

```typescript
const historico = await client.itbiHistorico('008.045.0123-4', 'sp');

for (const tx of historico) {
  console.log(`${tx.dataTransacao} - R$ ${tx.valorTransacao.toLocaleString('pt-BR')} (${tx.tipoTransacao})`);
}
```

---

### Aliquotas ITBI

Retorna aliquotas vigentes por cidade. Disponivel em **todos os planos**.

```typescript
const aliquotas = await client.itbiAliquotas('sp');

console.log(`Aliquota Padrao: ${(aliquotas.aliquotaPadrao * 100).toFixed(1)}%`);
console.log(`Aliquota SFH: ${(aliquotas.aliquotaFinanciamentoSFH * 100).toFixed(2)}%`);
console.log(`Base Legal: ${aliquotas.baseLegal}`);
```

---

### Isencoes ITBI

Verifica isencoes aplicaveis. Disponivel em **todos os planos**.

```typescript
const isencoes = await client.itbiIsencoes('sp');

for (const isencao of isencoes) {
  console.log(`- ${isencao.tipo}: ${isencao.descricao}`);
  console.log(`  Requisitos: ${isencao.requisitos.join(', ')}`);
}
```

---

### Guia ITBI

Gera guia de pagamento do ITBI. Disponivel a partir do plano **Starter**.

```typescript
const guia = await client.itbiGuia({
  sql: '008.045.0123-4',
  valorTransacao: 500000,
  comprador: {
    nome: 'Joao da Silva',
    documento: '123.456.789-00',
    email: 'joao@email.com',
  },
  vendedor: {
    nome: 'Maria Santos',
    documento: '987.654.321-00',
  },
  cidade: 'sp',
});

console.log(`Protocolo: ${guia.protocolo}`);
console.log(`Codigo de Barras: ${guia.codigoBarras}`);
console.log(`Vencimento: ${guia.dataVencimento}`);
console.log(`Valor: R$ ${guia.valorITBI.toLocaleString('pt-BR')}`);
```

---

### Validar Guia ITBI

Valida autenticidade de uma guia. Disponivel em **todos os planos**.

```typescript
const validacao = await client.itbiValidarGuia('ITBI-2024-789012', 'sp');

if (validacao.valido) {
  console.log('Guia valida!');
  if (validacao.pago) {
    console.log(`Pago em: ${validacao.dataPagamento}`);
    console.log(`Valor pago: R$ ${validacao.valorPago?.toLocaleString('pt-BR')}`);
  }
} else {
  console.log('Guia invalida!');
}
```

---

### Simular ITBI

Simula calculo sem gerar guia. Disponivel em **todos os planos**.

```typescript
const simulacao = await client.itbiSimular({
  valorTransacao: 500000,
  cidade: 'sp',
  tipoFinanciamento: 'sfh',
  valorFinanciado: 400000,
});

console.log(`Valor ITBI Total: R$ ${simulacao.valorITBITotal.toLocaleString('pt-BR')}`);
console.log(`  - Parte financiada (SFH): R$ ${simulacao.valorITBIFinanciado.toLocaleString('pt-BR')}`);
console.log(`  - Parte nao financiada: R$ ${simulacao.valorITBINaoFinanciado.toLocaleString('pt-BR')}`);
console.log(`Economia com SFH: R$ ${simulacao.economiaSFH.toLocaleString('pt-BR')}`);
```

**Tipo ITBISimulacao:**

```typescript
interface ITBISimulacao {
  valorTransacao: number;
  valorFinanciado: number;
  valorNaoFinanciado: number;
  aliquotaSFH: number;
  aliquotaPadrao: number;
  valorITBIFinanciado: number;
  valorITBINaoFinanciado: number;
  valorITBITotal: number;
  economiaSFH: number;
}
```

---

## Tratamento de Erros

```typescript
import {
  IPTUClient,
  IPTUAPIError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ServerError,
  TimeoutError,
  NetworkError,
} from 'iptuapi';

const client = new IPTUClient('sua_api_key');

try {
  const imoveis = await client.consultaEndereco('Rua Teste', '100');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log(`API Key invalida: ${error.message}`);
  } else if (error instanceof ForbiddenError) {
    console.log(`Plano nao autorizado. Requer: ${error.requiredPlan}`);
  } else if (error instanceof NotFoundError) {
    console.log(`Imovel nao encontrado: ${error.resource}`);
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limit excedido. Retry em ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    console.log('Parametros invalidos:');
    for (const [field, messages] of Object.entries(error.errors)) {
      console.log(`  ${field}: ${messages.join(', ')}`);
    }
  } else if (error instanceof ServerError) {
    console.log(`Erro no servidor (retryable): ${error.message}`);
  } else if (error instanceof TimeoutError) {
    console.log(`Timeout apos ${error.timeoutSeconds}s`);
  } else if (error instanceof NetworkError) {
    console.log(`Erro de conexao: ${error.message}`);
  } else if (error instanceof IPTUAPIError) {
    console.log(`Erro: ${error.message}`);
    console.log(`Request ID: ${error.requestId}`);
  }
}
```

### Propriedades dos Erros

```typescript
try {
  const imoveis = await client.consultaEndereco('Rua Teste', '100');
} catch (error) {
  if (error instanceof IPTUAPIError) {
    console.log(`Status Code: ${error.statusCode}`);
    console.log(`Request ID: ${error.requestId}`);
    console.log(`Retryable: ${error.isRetryable() ? 'Sim' : 'Nao'}`);

    // Converter para JSON
    const errorData = error.toJSON();
    console.log(errorData);
  }
}
```

### Verificar Tipo de Erro

```typescript
try {
  const imoveis = await client.consultaEndereco('Rua Teste', '100');
} catch (error) {
  if (error instanceof IPTUAPIError && error.isRetryable()) {
    const waitTime = error instanceof RateLimitError ? error.retryAfter : 5;
    console.log(`Aguardando ${waitTime}s antes de tentar novamente...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    const imoveis = await client.consultaEndereco('Rua Teste', '100');
  }
}
```

---

## Hierarquia de Excecoes

```
IPTUAPIError (base)
├── AuthenticationError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── RateLimitError (429) - retryable
├── ValidationError (400, 422)
├── ServerError (5xx) - retryable
├── TimeoutError (408) - retryable
└── NetworkError - retryable
```

---

## Rate Limiting

```typescript
// Verificar rate limit apos requisicao
const rateLimitInfo = client.rateLimitInfo;
if (rateLimitInfo) {
  console.log(`Limite: ${rateLimitInfo.limit}`);
  console.log(`Restantes: ${rateLimitInfo.remaining}`);
  console.log(`Reset em: ${rateLimitInfo.resetAt.toISOString()}`);
}

// ID da ultima requisicao (util para suporte)
console.log(`Request ID: ${client.lastRequestId}`);
```

### Limites por Plano

| Plano | Requisicoes/mes | Requisicoes/minuto |
|-------|-----------------|-------------------|
| Free | 100 | 10 |
| Starter | 5.000 | 60 |
| Pro | 50.000 | 300 |
| Enterprise | Ilimitado | 1.000 |

---

## Cidades Suportadas

| Codigo | Cidade | Identificador | Registros |
|--------|--------|---------------|-----------|
| sp | Sao Paulo | Numero SQL | 4.5M+ |
| bh | Belo Horizonte | Indice Cadastral | 800K+ |
| recife | Recife | Sequencial | 400K+ |

---

## Exemplo Completo

```typescript
import { IPTUClient, RateLimitError, IPTUAPIError } from 'iptuapi';

async function main() {
  const client = new IPTUClient(process.env.IPTU_API_KEY!, {
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
    },
  });

  // Lista de enderecos para consultar
  const enderecos = [
    { logradouro: 'Avenida Paulista', numero: '1000' },
    { logradouro: 'Rua Augusta', numero: '500' },
    { logradouro: 'Avenida Faria Lima', numero: '3000' },
  ];

  for (const endereco of enderecos) {
    try {
      const imoveis = await client.consultaEndereco(
        endereco.logradouro,
        endereco.numero,
        'sp'
      );

      for (const imovel of imoveis) {
        console.log(`SQL: ${imovel.sql}, Valor Venal: R$ ${imovel.valorVenal?.toLocaleString('pt-BR')}`);
      }

      // Verificar rate limit
      const rateLimitInfo = client.rateLimitInfo;
      if (rateLimitInfo && rateLimitInfo.remaining < 10) {
        console.log(`Atencao: Apenas ${rateLimitInfo.remaining} requisicoes restantes`);
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(`Rate limit atingido. Aguardando ${error.retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
      } else if (error instanceof IPTUAPIError) {
        console.log(`Erro ao consultar ${endereco.logradouro}: ${error.message}`);
      }
    }
  }

  // Exemplo ITBI
  console.log('\n--- Simulacao ITBI ---');
  try {
    const simulacao = await client.itbiSimular({
      valorTransacao: 800000,
      cidade: 'sp',
      tipoFinanciamento: 'sfh',
      valorFinanciado: 600000,
    });
    console.log(`Valor ITBI: R$ ${simulacao.valorITBITotal.toLocaleString('pt-BR')}`);
    console.log(`Economia com SFH: R$ ${simulacao.economiaSFH.toLocaleString('pt-BR')}`);
  } catch (error) {
    if (error instanceof IPTUAPIError) {
      console.log(`Erro na simulacao ITBI: ${error.message}`);
    }
  }
}

main();
```

---

## Testes

```bash
# Instalar dependencias
npm install

# Rodar testes
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Build

```bash
# Compilar TypeScript
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## Licenca

Copyright (c) 2025-2026 IPTU API. Todos os direitos reservados.

Este software e propriedade exclusiva da IPTU API. O uso esta sujeito aos termos de servico disponiveis em https://iptuapi.com.br/termos

---

## Links

- [Documentacao](https://iptuapi.com.br/docs)
- [API Reference](https://iptuapi.com.br/docs/api)
- [Portal do Desenvolvedor](https://iptuapi.com.br/dashboard)
- [Suporte](mailto:suporte@iptuapi.com.br)
