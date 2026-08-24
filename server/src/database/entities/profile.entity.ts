import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
