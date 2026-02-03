import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`products_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`alt\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_images_order_idx\` ON \`products_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_images_parent_id_idx\` ON \`products_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_images_image_idx\` ON \`products_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`alt\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_images_order_idx\` ON \`_products_v_version_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_images_parent_id_idx\` ON \`_products_v_version_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_images_image_idx\` ON \`_products_v_version_images\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`title\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`slug\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`description\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`short_description\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`category\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`sku\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_title\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_slug\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_description\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_short_description\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_category\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_sku\` text;`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`products_images\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_images\`;`)
  await db.run(sql`DROP INDEX \`products_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`title\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`slug\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`description\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`short_description\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`category\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`sku\`;`)
  await db.run(sql`DROP INDEX \`_products_v_version_version_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_title\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_slug\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_description\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_short_description\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_category\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_sku\`;`)
}
