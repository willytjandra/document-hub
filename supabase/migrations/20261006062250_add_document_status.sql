alter table public.documents
add column status text not null default 'draft';

alter table public.documents
add constraint documents_status_check
check (status in ('draft', 'active', 'archived'));