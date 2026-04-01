/**
 * Description: Admin reset — set user password to initial value (same as employee login id / local email part).
 * Deploy: `supabase secrets set EHUB_PASSWORD_RESET_SECRET=...` (same value as app VITE_EHUB_PASSWORD_RESET_SECRET).
 * Requires service_role (injected in hosted Edge runtime).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ehub-reset-secret",
};

const MIN_LEN = 6;
const DEFAULT_DOMAIN = "sbsmc.workspace";
const LOCAL_PART_RE = /^[a-zA-Z0-9._+-]+$/;

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function effectiveDomain(raw: string | undefined): string {
  const d = (raw ?? "").trim().replace(/^@/, "");
  return d || DEFAULT_DOMAIN;
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const want = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === want);
    if (hit) return hit.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const serverSecret = Deno.env.get("EHUB_PASSWORD_RESET_SECRET")?.trim() ?? "";
  const clientSecret = req.headers.get("x-ehub-reset-secret")?.trim() ?? "";
  if (!serverSecret || clientSecret !== serverSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { loginId?: string; emailDomain?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const loginId = String(body.loginId ?? "").trim();
  const emailDomain = effectiveDomain(body.emailDomain);

  if (!loginId || !LOCAL_PART_RE.test(loginId) || loginId.length < MIN_LEN) {
    return json({ error: "사번 형식이 올바르지 않습니다." }, 400);
  }

  const email = `${loginId}@${emailDomain}`;

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const userId = await findUserIdByEmail(admin, email);
    if (!userId) {
      return json({ error: "해당 사번 계정을 찾을 수 없습니다." }, 404);
    }

    const { error: upErr } = await admin.auth.admin.updateUserById(userId, {
      password: loginId,
    });
    if (upErr) {
      return json({ error: upErr.message || "비밀번호 초기화에 실패했습니다." }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
