create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_domain text;
begin
  email_domain := split_part(new.email, '@', 2);

  insert into public.companies (id, name, domain)
  values (email_domain, email_domain, email_domain)
  on conflict (id) do nothing;

  insert into public.profiles (
    id,
    email,
    name,
    plan,
    is_owner,
    is_approved,
    role,
    company_id,
    created_at
  )
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'Starter',
    false,
    false,
    'csm',
    email_domain,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    company_id = coalesce(public.profiles.company_id, excluded.company_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
