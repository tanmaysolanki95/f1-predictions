import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    return Response.json({ status: "degraded", reason: "missing env" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const { count, error } = await supabase
    .from("seasons")
    .select("*", { count: "exact", head: true });

  if (error) {
    return Response.json({ status: "degraded", reason: error.message }, { status: 503 });
  }

  return Response.json({ status: "ok", seasons: count });
}
