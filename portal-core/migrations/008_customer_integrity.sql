-- Staging migration: enforce customer ownership relationships at DB level.
-- Review and repair existing orphan rows before applying to nonempty databases.
alter table portal_private.orders
  add constraint portal_orders_customer_fk foreign key (customer_id)
  references portal_private.customer_accounts(id);
alter table portal_private.service_codes
  add constraint portal_codes_customer_fk foreign key (customer_id)
  references portal_private.customer_accounts(id);
alter table portal_private.entitlements
  add constraint portal_entitlements_customer_fk foreign key (customer_id)
  references portal_private.customer_accounts(id);
-- Application must still enforce matching customer_id across order/code/entitlement.
