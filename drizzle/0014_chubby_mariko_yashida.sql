CREATE INDEX "chapters_manga_id_order_desc_idx" ON "chapters" USING btree ("manga_id","order" desc);--> statement-breakpoint
CREATE INDEX "chapters_views_count_order_desc_idx" ON "chapters" USING btree ("views_count" desc);--> statement-breakpoint
CREATE INDEX "mangas_views_count_order_desc_idx" ON "mangas" USING btree ("views_count" desc);