DROP INDEX "title_search_index";--> statement-breakpoint
CREATE INDEX "title_search_index" ON "titles" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "views_count";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "translations_count";