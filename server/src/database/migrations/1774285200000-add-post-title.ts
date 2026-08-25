import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostTitle1774285200000 implements MigrationInterface {
  name = 'AddPostTitle1774285200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "posts" ADD "title" varchar(200)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "posts" DROP COLUMN "title"');
  }
}
