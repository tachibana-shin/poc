DROP INDEX "titles_manga_id_name_index";--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_manga_id_name_unique" UNIQUE("manga_id","name");