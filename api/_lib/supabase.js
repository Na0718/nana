// api/_lib/supabase.js
// Supabase 客户端 — 单例模式，按需初始化

const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let supabaseAdmin = null;

function getSupabase() {
  if (supabase) return supabase;
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  return supabase;
}

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return supabaseAdmin;
}

module.exports = { getSupabase, getSupabaseAdmin };
