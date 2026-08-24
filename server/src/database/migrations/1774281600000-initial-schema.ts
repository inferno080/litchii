import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1774281600000 implements MigrationInterface {
  name = 'InitialSchema1774281600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL,
        "username" varchar(30) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_profiles_username" UNIQUE ("username"),
        CONSTRAINT "CHK_profiles_username_format"
          CHECK ("username" ~ '^[a-z0-9_]{3,30}$'),
        CONSTRAINT "FK_profiles_auth_user"
          FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_id" uuid NOT NULL,
        "entry_date" date NOT NULL,
        "icon" varchar(64),
        "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_posts_author_date" UNIQUE ("author_id", "entry_date"),
        CONSTRAINT "FK_posts_author" FOREIGN KEY ("author_id")
          REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "post_id" uuid NOT NULL,
        "parent_id" uuid,
        "author_id" uuid NOT NULL,
        "text" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_comments_text_not_blank" CHECK (length(trim("text")) > 0),
        CONSTRAINT "FK_comments_post" FOREIGN KEY ("post_id")
          REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parent_id")
          REFERENCES "comments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_author" FOREIGN KEY ("author_id")
          REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comments_post_parent_created"
        ON "comments" ("post_id", "parent_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "comment_votes" (
        "user_id" uuid NOT NULL,
        "comment_id" uuid NOT NULL,
        "value" smallint NOT NULL,
        CONSTRAINT "PK_comment_votes" PRIMARY KEY ("user_id", "comment_id"),
        CONSTRAINT "CHK_comment_votes_value" CHECK ("value" IN (-1, 1)),
        CONSTRAINT "FK_comment_votes_user" FOREIGN KEY ("user_id")
          REFERENCES "profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comment_votes_comment" FOREIGN KEY ("comment_id")
          REFERENCES "comments"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "set_updated_at"()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER "TRG_posts_updated_at"
      BEFORE UPDATE ON "posts"
      FOR EACH ROW EXECUTE FUNCTION "set_updated_at"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER "TRG_posts_updated_at" ON "posts"');
    await queryRunner.query('DROP FUNCTION "set_updated_at"');
    await queryRunner.query('DROP TABLE "comment_votes"');
    await queryRunner.query('DROP TABLE "comments"');
    await queryRunner.query('DROP TABLE "posts"');
    await queryRunner.query('DROP TABLE "profiles"');
  }
}
