DROP INDEX "title_search_index";--> statement-breakpoint
CREATE INDEX "link_manga_authors_authorId_index" ON "link_manga_authors" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "link_manga_tags_tagId_index" ON "link_manga_tags" USING btree ("tagId");--> statement-breakpoint
CREATE INDEX "title_search_index" ON "titles" USING gin ("name" gin_trgm_ops);