import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('enderecos_id')
export class EnderecoId {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  endereco: string;
}
