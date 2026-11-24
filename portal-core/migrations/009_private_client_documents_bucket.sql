-- Private staging document storage; no browser policies or public access.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('nextgenca-client-documents','nextgenca-client-documents',false,10485760,array['application/pdf','image/png','image/jpeg'])
on conflict (id) do nothing;
-- Grant no storage.objects client policies until ownership-bound upload/download APIs exist.
