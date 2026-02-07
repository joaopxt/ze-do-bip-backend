/**
 * Configuração dos endpoints SIAC - NestJS
 * Configurado APENAS para LOJA 01 (PECISTA)
 */

export const SiacConfig = {
  get BASE_URL(): string {
    return process.env.SIAC_BASE_URL || '';
  },

  LOJA: {
    codigo: '01',
    nome: 'PECISTA',
    regiao: 'DF',
  },

  ENDPOINTS: {
    LISTAR_GUARDAS: '/GUARDA_LISTA?',
    DETALHES_GUARDA: '/GUARDA_DETALHES?',
    INICIAR_GUARDA: '/GUARDA_INICIAR?',
    FINALIZAR_GUARDA: '/GUARDA_FINALIZAR?',
    CLIENTE: '/CLIENTE?',
    PRODUTO_CONSULTA: '/PRODUTO_CONSULTA?',
    PRODUTO_ALTERAR_ENDERECO: '/PRODUTO_ALTERAR_ENDERECO',
    ENDERECO_CONSULTA: '/ENDERECO_CONSULTA?',
  },

  TIMEOUT: 30000, // 30 segundos

  getAlterarEnderecoUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.PRODUTO_ALTERAR_ENDERECO}`;
  },

  getEnderecoConsultaUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.ENDERECO_CONSULTA}`;
  },

  getListarGuardasUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.LISTAR_GUARDAS}`;
  },

  getDetalhesGuardaUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.DETALHES_GUARDA}`;
  },

  getIniciarGuardaUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.INICIAR_GUARDA}`;
  },

  getFinalizarGuardaUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.FINALIZAR_GUARDA}`;
  },

  getTesteClienteUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.CLIENTE}`;
  },

  getProdutoUrl(): string {
    return `${this.BASE_URL}${this.ENDPOINTS.PRODUTO_CONSULTA}`;
  },

  isLojaValida(cdLoja: string): boolean {
    return cdLoja === '01';
  },

  getLojaInfo() {
    return {
      codigo: this.LOJA.codigo,
      nome: this.LOJA.nome,
      regiao: this.LOJA.regiao,
      baseUrl: this.BASE_URL,
      endpoints: this.ENDPOINTS,
    };
  },
};
