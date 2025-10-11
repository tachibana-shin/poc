CREATE TABLE "authors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "authors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chapters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"raw_id" integer NOT NULL,
	"manga_id" integer NOT NULL,
	"order" integer NOT NULL,
	"number" varchar NOT NULL,
	"name" varchar NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chapters_raw_id_unique" UNIQUE("raw_id")
);
--> statement-breakpoint
CREATE TABLE "link_manga_tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "link_manga_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mangaId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mangas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mangas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"raw_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"cover_url" varchar NOT NULL,
	"cover_mobile_url" varchar NOT NULL,
	"panorama_url" varchar NOT NULL,
	"panorama_mobile_url" varchar NOT NULL,
	"panorama_dominant_color" varchar NOT NULL,
	"panorama_dominant_color_2" varchar NOT NULL,
	"newest_chapter_number" varchar NOT NULL,
	"newest_chapter_id" integer NOT NULL,
	"newest_chapter_created_at" varchar NOT NULL,
	"author" integer NOT NULL,
	"description" varchar NOT NULL,
	"full_description" varchar NOT NULL,
	"official_url" varchar,
	"is_region_limited" boolean NOT NULL,
	"is_ads" boolean NOT NULL,
	"chapters_count" integer NOT NULL,
	"views_count" integer NOT NULL,
	"is_nsfw" boolean NOT NULL,
	"team" integer NOT NULL,
	"titles" json[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mangas_raw_id_unique" UNIQUE("raw_id"),
	CONSTRAINT "mangas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar NOT NULL,
	"is_ads" boolean NOT NULL,
	"facebook_address" varchar NOT NULL,
	"views_count" integer NOT NULL,
	"translations_count" integer NOT NULL,
	"main_page_blocks" varchar NOT NULL,
	"avatar_url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_manga_id_mangas_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_manga_tags" ADD CONSTRAINT "link_manga_tags_mangaId_mangas_id_fk" FOREIGN KEY ("mangaId") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_manga_tags" ADD CONSTRAINT "link_manga_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mangas" ADD CONSTRAINT "mangas_author_authors_id_fk" FOREIGN KEY ("author") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mangas" ADD CONSTRAINT "mangas_team_teams_id_fk" FOREIGN KEY ("team") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;