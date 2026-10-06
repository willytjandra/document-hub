create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own document files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);