/**
 * Tipos e interfaces para a IPTU API.
 */

// ==================== CONFIGURACAO ====================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

export interface ClientConfig {
  baseUrl: string;
  timeout: number;
  retryConfig: RetryConfig;
}

export interface ClientOptions {
  baseUrl?: string;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
}

// ==================== RATE LIMIT ====================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

// ==================== IMOVEL ====================

export interface Imovel {
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
  testada?: number;
  fracaoIdeal?: number;
  quantidadePavimentos?: number;
}

// ==================== ZONEAMENTO ====================

export interface Zoneamento {
  zona: string;
  usoPermitido: string;
  coeficienteAproveitamento?: number;
  taxaOcupacao?: number;
  gabarito?: number;
  recuoFrontal?: number;
  legislacao?: string;
}

// ==================== VALUATION ====================

export interface Valuation {
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  confianca: number;
  valorM2: number;
  metodologia: string;
  dataReferencia: string;
}

export interface ValuationParams {
  areaTerreno: number;
  areaConstruida: number;
  bairro: string;
  cidade?: string;
  zona?: string;
  tipoUso?: string;
  tipoPadrao?: string;
  anoConstrucao?: number;
}

export interface Comparavel {
  sql: string;
  logradouro: string;
  bairro: string;
  areaConstruida: number;
  valorVenal: number;
  valorM2: number;
  distanciaKm?: number;
}

export interface ComparablesParams {
  bairro: string;
  areaMin: number;
  areaMax: number;
  cidade?: string;
  limit?: number;
}

// ==================== ITBI ====================

export interface ITBIStatus {
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

export interface ITBICalculo {
  sql: string;
  valorTransacao: number;
  valorVenalReferencia: number;
  baseCalculo: number;
  aliquota: number;
  valorITBI: number;
  isencaoAplicavel: boolean;
  fundamentacaoLegal: string;
}

export interface ITBICalculoParams {
  sql: string;
  valorTransacao: number;
  cidade?: string;
}

export interface ITBIHistorico {
  protocolo: string;
  dataTransacao: string;
  tipoTransacao: string;
  valorTransacao: number;
  valorITBI: number;
}

export interface ITBIAliquota {
  cidade: string;
  aliquotaPadrao: number;
  aliquotaFinanciamentoSFH: number;
  valorMinimoIsencao: number;
  baseLegal: string;
  vigencia: string;
}

export interface ITBIIsencao {
  tipo: string;
  descricao: string;
  requisitos: string[];
  baseLegal: string;
}

export interface Pessoa {
  nome: string;
  documento: string;
  email?: string;
}

export interface ITBIGuiaParams {
  sql: string;
  valorTransacao: number;
  comprador: Pessoa;
  vendedor: Pessoa;
  cidade?: string;
}

export interface ITBIGuia {
  protocolo: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataEmissao: string;
  dataVencimento: string;
  valorITBI: number;
}

export interface ITBIValidacao {
  protocolo: string;
  valido: boolean;
  pago: boolean;
  dataPagamento?: string;
  valorPago?: number;
}

export interface ITBISimularParams {
  valorTransacao: number;
  cidade?: string;
  tipoFinanciamento?: 'sfh' | 'nao_sfh';
  valorFinanciado?: number;
}

export interface ITBISimulacao {
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

// ==================== AVM EVALUATE ====================

export interface EvaluateParams {
  /** Numero SQL do imovel (alternativa ao endereco) */
  sql?: string;
  /** Nome da rua/avenida (alternativa ao SQL) */
  logradouro?: string;
  /** Numero do imovel */
  numero?: number;
  /** Apartamento, sala, etc. */
  complemento?: string;
  /** Bairro */
  bairro?: string;
  /** Codigo da cidade (sp, bh) */
  cidade?: string;
  /** Incluir estimativa baseada em ITBI */
  incluirItbi?: boolean;
  /** Incluir lista de imoveis comparaveis */
  incluirComparaveis?: boolean;
}

export interface AVMEstimate {
  /** Valor estimado em R$ */
  valorEstimado: number;
  /** Valor minimo do intervalo */
  valorMinimo: number;
  /** Valor maximo do intervalo */
  valorMaximo: number;
  /** Valor por m2 */
  valorM2: number;
  /** Nivel de confianca (0-1) */
  confianca: number;
  /** Versao do modelo */
  modeloVersao: string;
}

export interface ITBIMarketEstimate {
  /** Valor estimado em R$ */
  valorEstimado: number;
  /** Valor minimo da faixa */
  faixaMinima: number;
  /** Valor maximo da faixa */
  faixaMaxima: number;
  /** Valor por m2 (mediana) */
  valorM2Mediana: number;
  /** Total de transacoes analisadas */
  totalTransacoes: number;
  /** Periodo considerado */
  periodo: string;
  /** Fonte dos dados */
  fonte: string;
}

export interface FinalValuation {
  /** Valor estimado final */
  estimado: number;
  /** Valor minimo */
  minimo: number;
  /** Valor maximo */
  maximo: number;
  /** Metodo utilizado (blend_avm_itbi, avm_only, itbi_only) */
  metodo: string;
  /** Peso do AVM no calculo (0-1) */
  pesoAvm: number;
  /** Peso do ITBI no calculo (0-1) */
  pesoItbi: number;
  /** Nivel de confianca */
  confianca: number;
  /** Nota explicativa */
  nota?: string;
}

export interface PropertyEvaluation {
  /** Se a avaliacao foi bem sucedida */
  success: boolean;
  /** Dados cadastrais do imovel */
  imovel: Record<string, unknown>;
  /** Avaliacao pelo modelo ML (AVM) */
  avaliacaoAvm?: AVMEstimate;
  /** Avaliacao por transacoes ITBI reais */
  avaliacaoItbi?: ITBIMarketEstimate;
  /** Valor final combinado */
  valorFinal: FinalValuation;
  /** Imoveis comparaveis */
  comparaveis?: Record<string, unknown>;
  /** Metadados da avaliacao */
  metadata: {
    processadoEm: string;
    fontes: string[];
    cidade: string;
  };
}

// ==================== API RESPONSE ====================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  metadata?: Record<string, unknown>;
}

// ==================== CIDADE ====================

export type Cidade = 'sp' | 'bh' | 'recife';
