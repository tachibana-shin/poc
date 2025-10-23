DROP INDEX "pages_hash_index";--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "hash" DROP NOT NULL;