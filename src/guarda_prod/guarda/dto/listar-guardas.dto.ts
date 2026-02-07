import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * DTO para listagem de guardas prod
 */
export class ListarGuardasProdQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^01$/, { message: 'Apenas loja 01 (PECISTA) é autorizada' })
  cd_loja?: string = '01';

  @IsOptional()
  @IsString()
  cd_usuario?: string;
}

/**
 * DTO para obter detalhes de uma guarda prod
 */
export class ObterDetalhesProdParamsDto {
  @IsString()
  sq_guarda: string;
}

export class ObterDetalhesProdQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^01$/, { message: 'Apenas loja 01 (PECISTA) é autorizada' })
  cd_loja?: string = '01';
}

/**
 * DTO para iniciar/finalizar guarda prod
 */
export class GuardaProdParamsDto {
  @IsString()
  sq_guarda: string;
}

export class GuardaProdBodyDto {
  @IsOptional()
  @IsString()
  @Matches(/^01$/, { message: 'Apenas loja 01 (PECISTA) é autorizada' })
  cd_loja?: string = '01';
}
