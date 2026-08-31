ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_releases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "release_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "collection_item_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "collection_item_value_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "collection_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wishlist_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "market_estimates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "price_points" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "price_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "brands_public_read" ON "brands" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "categories_public_read" ON "categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "product_images_public_read" ON "product_images" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "product_releases_public_read" ON "product_releases" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "products_public_read" ON "products" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "release_images_public_read" ON "release_images" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "collection_item_photos_owner_all" ON "collection_item_photos" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from "collection_items"
        where "collection_items"."id" = "collection_item_photos"."collection_item_id"
        and "collection_items"."user_id" = (select auth.uid())
      )) WITH CHECK (exists (
        select 1 from "collection_items"
        where "collection_items"."id" = "collection_item_photos"."collection_item_id"
        and "collection_items"."user_id" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "collection_item_value_history_owner_read" ON "collection_item_value_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from "collection_items"
        where "collection_items"."id" = "collection_item_value_history"."collection_item_id"
        and "collection_items"."user_id" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "collection_items_owner_all" ON "collection_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ("collection_items"."user_id" = (select auth.uid())) WITH CHECK ("collection_items"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "wishlist_items_owner_all" ON "wishlist_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ("wishlist_items"."user_id" = (select auth.uid())) WITH CHECK ("wishlist_items"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "market_estimates_public_read" ON "market_estimates" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "price_points_authenticated_read" ON "price_points" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "price_sources_public_read" ON "price_sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);