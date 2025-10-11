CREATE TABLE "link_manga_authors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "link_manga_authors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mangaId" integer NOT NULL,
	"authorId" integer NOT NULL,
	CONSTRAINT "link_manga_authors_mangaId_authorId_unique" UNIQUE("mangaId","authorId")
);
--> statement-breakpoint
ALTER TABLE "mangas" DROP CONSTRAINT "mangas_author_authors_id_fk";
--> statement-breakpoint
ALTER TABLE "link_manga_authors" ADD CONSTRAINT "link_manga_authors_mangaId_mangas_id_fk" FOREIGN KEY ("mangaId") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_manga_authors" ADD CONSTRAINT "link_manga_authors_authorId_authors_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mangas" DROP COLUMN "author";--> statement-breakpoint
ALTER TABLE "link_manga_tags" ADD CONSTRAINT "link_manga_tags_mangaId_tagId_unique" UNIQUE("mangaId","tagId");