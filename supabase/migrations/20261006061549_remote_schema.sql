CREATE TABLE "public"."documents" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "name"         text                     NOT NULL,
  "storage_path" text                     NOT NULL,
  "mime_type"    text,
  "size"         bigint,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "documents_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."documents"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can insert their own documents" ON "public"."documents"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can read their own documents" ON "public"."documents"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can read their own documents flreew_0" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users can upload their own documents flreew_0" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."documents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "service_role";

