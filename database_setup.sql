-- Run this AFTER the six tables and RLS policies from the earlier setup.
-- Adds safe server-side invitation creation and joining.
create or replace function public.create_couple_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
  v_code text;
begin
  if v_user is null then raise exception 'Please log in first.'; end if;
  select couple_id into v_couple from public.couple_members where user_id=v_user limit 1;
  if v_couple is null then
    insert into public.couples(created_by) values(v_user) returning id into v_couple;
    insert into public.couple_members(couple_id,user_id,role) values(v_couple,v_user,'owner');
  end if;
  if (select count(*) from public.couple_members where couple_id=v_couple) >= 2 then
    raise exception 'This couple space already has two members.';
  end if;
  v_code := lpad((floor(random()*1000000))::int::text,6,'0');
  insert into public.couple_invites(couple_id,code,created_by)
  values(v_couple,v_code,v_user);
  return v_code;
end;
$$;

create or replace function public.join_couple_invite(invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.couple_invites%rowtype;
begin
  if v_user is null then raise exception 'Please log in first.'; end if;
  select * into v_invite from public.couple_invites
  where code=invite_code and used_by is null and expires_at>now()
  for update;
  if not found then raise exception 'Invalid or expired invitation code.'; end if;
  if exists(select 1 from public.couple_members where user_id=v_user) then
    raise exception 'You are already connected to a couple space.'; end if;
  if (select count(*) from public.couple_members where couple_id=v_invite.couple_id)>=2 then
    raise exception 'This couple space is full.'; end if;
  insert into public.couple_members(couple_id,user_id,role)
  values(v_invite.couple_id,v_user,'member');
  update public.couple_invites set used_by=v_user,used_at=now() where id=v_invite.id;
end;
$$;

revoke all on function public.create_couple_invite() from public;
revoke all on function public.join_couple_invite(text) from public;
grant execute on function public.create_couple_invite() to authenticated;
grant execute on function public.join_couple_invite(text) to authenticated;
