import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuardaBackup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sq_guarda_original: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sq_guarda_siac: string | null;

  @Column({ type: 'varchar', length: 2 })
  cd_loja: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  nu_nota: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  cd_fornece: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  sg_serie: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_emissao: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_iniguar: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_fimguar: Date | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  cd_usuario: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  in_app: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  in_fimapp: string | null;

  @Column({ type: 'simple-json', nullable: true })
  guarda_snapshot: any | null;

  @Column({ type: 'simple-json', nullable: true })
  produtos_snapshot: any | null;

  @Column({ type: 'timestamp' })
  deleted_at: Date;

  @Column({ type: 'varchar', length: 50 })
  deleted_reason: string;

  @Column({ type: 'varchar', length: 50 })
  deleted_source: string;
}
