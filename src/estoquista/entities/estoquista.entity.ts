import { Guarda } from 'src/guarda/entities/guarda.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class Estoquista {
  @PrimaryColumn({ type: 'varchar', length: 5 })
  codoper: string;

  @Column({ type: 'varchar', length: 55 })
  nome: string;

  @Column({ type: 'varchar', length: 5 })
  grupo: string;

  @ManyToMany(() => Guarda, (guarda) => guarda.guarda_estoquista)
  guarda_estoquista: Guarda[];
}
