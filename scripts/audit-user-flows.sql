-- Manual integration audit for the deployed schema. All fixtures, notifications,
-- sale evidence and queue effects are rolled back inside the subtransaction.
-- No real account, session, message, email, photo or collection is modified.
-- Run through a trusted database-admin connection, never the public Data API.
create or replace function pg_temp.trackdash_audit_user_flows()
returns jsonb language plpgsql as $$
declare
  seller uuid := gen_random_uuid(); buyer uuid := gen_random_uuid(); stranger uuid := gen_random_uuid();
  product uuid; release uuid; item uuid; wish uuid; share uuid; convo uuid; offer uuid; counter uuid; sale uuid; purchased uuid;
  stage text := 'fixtures'; passed jsonb := '[]'::jsonb; denied boolean;
begin
  begin
    select r.product_id,r.id into product,release from public.product_releases r
      where r.id='9058782c-0e3c-5a3d-9f9c-391365d3e81e';
    if release is null then raise exception 'Audit Release missing'; end if;
    insert into auth.users(id,email,raw_user_meta_data,aud,role,created_at,updated_at)
      select u, 'qa_'||replace(u::text,'-','')||'@example.test',
        jsonb_build_object('username','qa_'||replace(u::text,'-','')), 'authenticated','authenticated',now(),now()
      from unnest(array[seller,buyer,stranger]) u;
    if (select count(*) from public.profiles where id in (seller,buyer,stranger))<>3 then raise exception 'Profile creation failed'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'collection CRUD';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',seller,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',seller::text,true);
    execute 'set local role authenticated';
    insert into public.collection_items(user_id,product_id,release_id,condition,acquisition_price,notes)
      values(seller,product,release,'Sealed',20,'audit fixture') returning id into item;
    update public.collection_items set notes='audit updated' where id=item;
    if not exists(select 1 from public.collection_items where id=item and notes='audit updated') then raise exception 'Collection persistence failed'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'wishlist CRUD';
    insert into public.wishlist_items(user_id,product_id,release_id,priority,target_price)
      values(seller,product,release,'Medium',25) returning id into wish;
    update public.wishlist_items set priority='High',target_price=30 where id=wish;
    if not exists(select 1 from public.wishlist_items where id=wish and priority='High' and target_price=30) then raise exception 'Wishlist persistence failed'; end if;
    delete from public.wishlist_items where id=wish;
    if exists(select 1 from public.wishlist_items where id=wish) then raise exception 'Wishlist delete failed'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'collection isolation';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    if exists(select 1 from public.collection_items where id=item) then raise exception 'Private collection exposed'; end if;
    update public.collection_items set notes='unauthorized' where id=item;
    if found then raise exception 'Foreign collection writable'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'open to offers';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',seller,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',seller::text,true);
    insert into public.collector_profiles(user_id,username) select id,username from public.profiles where id=seller;
    insert into public.collection_shares(collection_item_id,user_id,product_id,release_id,condition,share_mode,asking_price,asking_currency)
      values(item,seller,product,release,'Sealed','open_to_offers',30,'EUR') returning id into share;
    passed := passed || jsonb_build_array(stage);

    stage := 'contact request and pending-message guard';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    insert into public.conversations(collection_share_id,product_id,release_id,owner_id,requester_id,owner_username,requester_username,request_message)
      select share,product,release,seller,buyer,s.username,b.username,'audit request'
      from public.collector_profiles s,public.profiles b where s.user_id=seller and b.id=buyer
      returning id into convo;
    denied := false;
    begin
      insert into public.messages(conversation_id,sender_id,body) values(convo,buyer,'pending message must fail');
    exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Pending conversation allowed chat'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'accept contact and bidirectional messages';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',seller,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',seller::text,true);
    update public.conversations set status='accepted' where id=convo and owner_id=seller;
    insert into public.messages(conversation_id,sender_id,body) values(convo,seller,'audit seller message');
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    insert into public.messages(conversation_id,sender_id,body) values(convo,buyer,'audit buyer message');
    if (select count(*) from public.messages where conversation_id=convo)<>2 then raise exception 'Conversation messages missing'; end if;
    insert into public.conversation_reads(conversation_id,user_id,last_read_at) values(convo,buyer,now());
    passed := passed || jsonb_build_array(stage);

    stage := 'outsider isolation';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',stranger,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',stranger::text,true);
    if exists(select 1 from public.conversations where id=convo) or exists(select 1 from public.messages where conversation_id=convo) then raise exception 'Conversation exposed to outsider'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'direct offer';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    select o.offer_id into offer from public.trackdash_start_marketplace_offer(share,25,'EUR') o;
    if offer is null then raise exception 'Offer not created'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'counteroffer and acceptance';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',seller,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',seller::text,true);
    select public.trackdash_create_marketplace_offer(convo,30,'EUR') into counter;
    denied := false;
    begin perform public.trackdash_respond_marketplace_offer(counter,'accepted');
    exception when others then if sqlerrm='You cannot respond to your own offer' then denied:=true; else raise; end if; end;
    if not denied then raise exception 'Self acceptance permitted'; end if;
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    perform public.trackdash_respond_marketplace_offer(counter,'accepted');
    if not exists(select 1 from public.marketplace_offers where id=counter and status='accepted' and deal_status='open') then raise exception 'Accepted deal missing'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'sale report';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',seller,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',seller::text,true);
    select public.trackdash_report_marketplace_sale(counter,30,5,'EUR',current_date,30,null,null) into sale;
    if not exists(select 1 from public.marketplace_sales where id=sale and status='pending_confirmation') then raise exception 'Sale did not await buyer'; end if;
    if not exists(select 1 from public.collection_items where id=item) then raise exception 'Unconfirmed sale removed seller copy'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'buyer confirmation and collection transfer';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true);
    perform set_config('request.jwt.claim.sub',buyer::text,true);
    perform public.trackdash_respond_marketplace_sale(sale,'confirmed');
    select id into purchased from public.collection_items where user_id=buyer and release_id=release and acquisition_source='TrackDash';
    if purchased is null then raise exception 'Buyer collection transfer missing'; end if;
    if not exists(select 1 from public.collection_items where id=purchased and acquisition_price=30 and acquisition_currency='EUR') then raise exception 'Buyer purchase cost incorrect'; end if;
    if not exists(select 1 from public.collection_item_transfers where sale_id=sale and seller_item_snapshot->>'notes'='audit updated') then raise exception 'Transfer snapshot missing'; end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'remove purchased collection copy';
    delete from public.collection_items where id=purchased and user_id=buyer;
    if exists(select 1 from public.collection_items where id=purchased) then raise exception 'Buyer cannot remove purchased copy'; end if;
    if not exists(select 1 from public.collection_item_transfers where sale_id=sale and buyer_collection_item_id is null)
      or not exists(select 1 from public.marketplace_sales where id=sale and status='confirmed') then
      raise exception 'Removing a live copy erased sale history';
    end if;
    passed := passed || jsonb_build_array(stage);

    stage := 'account deletion cascades';
    execute 'reset role';
    delete from auth.users where id=buyer;
    if exists(select 1 from public.profiles where id=buyer) or exists(select 1 from public.collection_items where user_id=buyer) or exists(select 1 from public.wishlist_items where user_id=buyer) then raise exception 'Account data remains'; end if;
    passed := passed || jsonb_build_array(stage);
    raise sqlstate 'ZA001';
  exception
    when sqlstate 'ZA001' then return jsonb_build_object('ok',true,'passed',passed,'rolled_back',true);
    when others then return jsonb_build_object('ok',false,'failed_stage',stage,'error',sqlerrm,'sqlstate',sqlstate,'passed',passed,'rolled_back',true);
  end;
end;
$$;
select pg_temp.trackdash_audit_user_flows() as audit;
