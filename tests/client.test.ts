import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IPTUClient } from '../src/client';
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '../src/errors';

describe('IPTUClient', () => {
  let client: IPTUClient;

  beforeEach(() => {
    client = new IPTUClient('test_api_key', {
      baseUrl: 'https://api.test.com/v1',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('consultaEndereco', () => {
    it('should return imoveis on success', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            sql: '008.045.0123-4',
            logradouro: 'AV PAULISTA',
            numero: '1000',
            bairro: 'BELA VISTA',
            valor_venal: 2500000.0,
          },
        ],
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
          'X-Request-ID': 'req_123',
        }),
      } as Response);

      const result = await client.consultaEndereco('Avenida Paulista', '1000');

      expect(result).toHaveLength(1);
      expect(result[0].sql).toBe('008.045.0123-4');
      expect(result[0].valorVenal).toBe(2500000.0);
    });

    it('should throw NotFoundError on 404', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Imovel nao encontrado' }),
        headers: new Headers({
          'X-Request-ID': 'req_123',
        }),
      } as Response);

      await expect(
        client.consultaEndereco('Rua Inexistente', '9999')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('authentication', () => {
    it('should throw AuthenticationError on 401', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'API Key invalida' }),
        headers: new Headers({}),
      } as Response);

      await expect(
        client.consultaEndereco('Avenida Paulista', '1000')
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('rate limit', () => {
    it('should throw RateLimitError on 429', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ detail: 'Rate limit excedido' }),
        headers: new Headers({
          'Retry-After': '60',
        }),
      } as Response);

      try {
        await client.consultaEndereco('Avenida Paulista', '1000');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
        expect((error as RateLimitError).isRetryable()).toBe(true);
      }
    });
  });

  describe('ITBI', () => {
    it('should simulate ITBI correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          valor_transacao: 500000.0,
          valor_financiado: 400000.0,
          valor_nao_financiado: 100000.0,
          aliquota_sfh: 0.005,
          aliquota_padrao: 0.03,
          valor_itbi_financiado: 2000.0,
          valor_itbi_nao_financiado: 3000.0,
          valor_itbi_total: 5000.0,
          economia_sfh: 10000.0,
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({}),
      } as Response);

      const result = await client.itbiSimular({
        valorTransacao: 500000.0,
        cidade: 'sp',
        tipoFinanciamento: 'sfh',
        valorFinanciado: 400000.0,
      });

      expect(result.valorITBITotal).toBe(5000.0);
      expect(result.economiaSFH).toBe(10000.0);
    });
  });

  describe('rate limit info', () => {
    it('should update rate limit info after request', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
        headers: new Headers({
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '50',
          'X-RateLimit-Reset': String(resetTime),
          'X-Request-ID': 'req_abc123',
        }),
      } as Response);

      await client.consultaEndereco('Avenida Paulista', '1000');

      expect(client.rateLimitInfo).not.toBeNull();
      expect(client.rateLimitInfo?.limit).toBe(100);
      expect(client.rateLimitInfo?.remaining).toBe(50);
      expect(client.lastRequestId).toBe('req_abc123');
    });
  });
});
