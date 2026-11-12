-- Cancelling an order puts its stock back, and a cancelled order can't be reopened
-- (reopening would need the stock again, which may already be sold).
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if old.status = 'Cancelled' then
    raise exception 'A cancelled order cannot be reopened. Ask the customer to order again.';
  end if;

  if new.status = 'Cancelled' then
    for line in select * from jsonb_array_elements(coalesce(old.items, '[]'::jsonb)) loop
      update public.products
         set stock = stock + greatest(0, coalesce((line ->> 'quantity')::integer, 0))
       where id::text = line ->> 'id';
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_status_change on public.orders;
create trigger orders_status_change
  before update of status on public.orders
  for each row execute function public.handle_order_status_change();
