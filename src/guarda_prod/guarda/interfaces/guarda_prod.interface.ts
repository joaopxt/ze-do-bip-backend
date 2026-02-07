/**
 * Interfaces para o módulo de GuardaProd - NestJS
 */

export interface GuardaProd {
  sg_serie?: string;
  cd_fornece: string;
  cd_loja: string;
  dt_emissao: string;
  hr_emissao: string;
  no_fornecedor: string;
  nu_nota: string;
  qtd_itens: number;
  sq_guarda: string;
  status: string;
  cd_estoqui?: string; // Código do estoquista
}

export interface Produto {
  id: string; // Ex: "010013250002"
  cd_fabrica: string;
  cd_produto: string;
  cod_barras: string[]; // Array de códigos de barra
  endereco: string;
  no_produto: string;
  quantidade: number;
}

export interface EstoquistaDetalhe {
  cd_estoquista: string;
  estoquista: string;
  qt_itens: number;
}

export interface DetalhesGuardaProd {
  cd_fornece: string;
  cd_loja: string;
  dt_emissao: string;
  dt_fimguar: string;
  dt_iniguar: string;
  estoquistas: EstoquistaDetalhe[];
  hr_emissao: string;
  hr_fimguar: string;
  hr_iniguar: string;
  no_fornecedor: string;
  nu_nota: string;
  produtos: Produto[];
}

export interface GuardaProdResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    cd_loja: string;
    regiao: string;
    loja: string;
    timestamp: string;
    [key: string]: any;
  };
}

export interface ApiCallResult {
  success: boolean;
  data?: any;
  error?: string;
  latency?: string;
  timestamp: string;
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  loja: string;
}
