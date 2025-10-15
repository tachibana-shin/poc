DROP INDEX "title_search_index";--> statement-breakpoint
CREATE INDEX "title_search_index" ON "titles" USING gin (to_tsvector('simple', "name"));