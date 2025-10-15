CREATE TABLE "titles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "titles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"raw_id" integer NOT NULL,
	"manga_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"primary" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "titles_raw_id_unique" UNIQUE("raw_id"),
	CONSTRAINT "titles_manga_id_primary_unique" UNIQUE("manga_id","primary")
);
--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_manga_id_mangas_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "titles_manga_id_name_index" ON "titles" USING btree ("manga_id","name");