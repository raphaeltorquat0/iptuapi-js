# Changelog

All notable changes to the IPTU API JavaScript/TypeScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.2] - 2026-01-24

### Fixed
- Rebuilt distribution to include all IPTU Tools methods (`iptuToolsCidades`, `iptuToolsCalendario`, `iptuToolsSimulador`, `iptuToolsIsencao`, `iptuToolsProximoVencimento`)
- Previously published build was missing these methods due to stale dist/ directory

## [2.1.1] - 2025-12-15

### Added
- `RequestOptions` interface for request-level configuration
- `AbortSignal` support for request cancellation
- Per-request timeout override via `RequestOptions.timeout`
- Internal `combineSignals()` method for signal management

### Changed
- All public methods now accept optional `RequestOptions` as last parameter
- Improved TypeScript types for better IDE support

### Example
```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const result = await client.consultaEndereco(
  { logradouro: "Avenida Paulista" },
  { signal: controller.signal, timeout: 10000 }
);
```

## [2.1.0] - 2025-12-01

### Added
- IPTU Tools endpoints for 2026 calendar data
  - `iptuToolsCidades()` - List cities with IPTU calendar
  - `iptuToolsCalendario()` - Get IPTU calendar for a city
  - `iptuToolsSimulador()` - Simulate payment options
  - `iptuToolsIsencao()` - Check exemption eligibility
  - `iptuToolsProximoVencimento()` - Get next due date info
- Brasilia city support
- Full TypeScript types for all IPTU Tools responses

## [2.0.0] - 2025-11-01

### Added
- Complete TypeScript rewrite
- Dual CJS/ESM build output via tsup
- Typed error classes: `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `RateLimitError`, `ValidationError`, `ServerError`, `TimeoutError`, `NetworkError`
- `isRetryable` property on all errors
- Configurable retry with exponential backoff
- Rate limit tracking via `rateLimit` and `lastRequestId` properties
- Valuation endpoints (Pro+): `valuationEstimate()`, `valuationBatch()`, `valuationComparables()`
- Data endpoints: `dadosIPTUHistorico()`, `dadosCNPJ()`, `dadosIPCACorrigir()`
- `IPTUClientOptions` for configuration
- Request/response logging

### Changed
- Client initialization: `new IPTUClient(apiKey, options?)`
- All methods return typed interfaces instead of `any`
- Minimum Node.js version: 18

### Removed
- CommonJS-only build
- Callback-based API

## [1.0.0] - 2025-09-01

### Added
- Initial release
- Basic consultation methods: `consultaEndereco()`, `consultaSQL()`, `consultaCEP()`
- Zoning query: `consultaZoneamento()`
- Support for multiple cities (SP, BH, Recife, POA, Fortaleza, Curitiba, RJ)
