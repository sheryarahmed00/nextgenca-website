-- Keep private customer mapping in sync with verified Supabase Auth accounts.
create or replace function portal_private.sync_verified_auth_customer()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null and new.email is not null then
    insert into portal_private.customer_accounts
      (provider,provider_subject,email_normalized,email_verified)
    values ('supabase',new.id::text,lower(trim(new.email)),true)
    on conflict (provider,provider_subject)
    do update set email_normalized=excluded.email_normalized,email_verified=true;
  else
    update portal_private.customer_accounts
       set email_verified=false
     where provider='supabase' and provider_subject=new.id::text;
  end if;
  return new;
end;
$$;
revoke all on function portal_private.sync_verified_auth_customer() from public, anon, authenticated;
create trigger portal_sync_verified_auth_customer
after insert or update of email,email_confirmed_at on auth.users
for each row execute function portal_private.sync_verified_auth_customer();
