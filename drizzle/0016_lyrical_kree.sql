ALTER TABLE "titles" DROP CONSTRAINT "titles_manga_id_primary_unique";--> statement-breakpoint
CREATE INDEX "titles_manga_id_primary_index" ON "titles" USING btree ("manga_id","primary");