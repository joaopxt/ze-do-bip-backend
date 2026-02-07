import { Compra } from 'src/compra/entities/compra.entity';
import { Estoquista } from 'src/estoquista/entities/estoquista.entity';
import { ProdutosGuarda } from 'src/produtos_guarda/entities/produtos_guarda.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';

@Entity()
@Index(['sq_guarda'], { unique: true })
export class Guarda {
  @PrimaryGeneratedColumn()
  sq_guarda: number;

  // ID do SIAC para sincronização (ex: "0000047752")
  @Column({ type: 'varchar', length: 10, nullable: true, unique: true })
  sq_guarda_siac: string;

  @Column({ type: 'varchar', length: 2 })
  cd_loja: string;

  @Column({ type: 'timestamp', nullable: true })
  dt_emissao: Date;

  @Column({ type: 'varchar', length: 8, nullable: true })
  hr_emissao: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  in_tipogua: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  cd_fornece: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  sg_serie: string;

  @Column({ type: 'varchar', length: 6 })
  nu_nota: string;

  @Column({ type: 'timestamp', nullable: true })
  dt_iniguar: Date;

  @Column({ type: 'varchar', length: 8, nullable: true })
  hr_iniguar: string;

  @Column({ type: 'timestamp', nullable: true })
  dt_fimguar: Date;

  @Column({ type: 'varchar', length: 8, nullable: true })
  hr_fimguar: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  cd_usuario: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  in_app: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  in_fimapp: string;

  @ManyToMany(() => Estoquista, (estoquista) => estoquista.guarda_estoquista)
  @JoinTable()
  guarda_estoquista: Estoquista[];

  @OneToMany(() => Compra, (compra) => compra.guarda)
  compra: Compra[];

  @OneToMany(() => ProdutosGuarda, (produto) => produto.guarda)
  produtos_guarda: ProdutosGuarda[];
}
