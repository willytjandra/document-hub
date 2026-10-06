alter table public.documents
add column updated_at timestamp with time zone not null default now();

create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);