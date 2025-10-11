ALTER TABLE "teams" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "raw_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_raw_id_unique" UNIQUE("raw_id");