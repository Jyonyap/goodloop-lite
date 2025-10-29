// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 浏览器端可用的客户端（读公开数据、走 RLS）
export const supabase = createClient(url, anon)

// 仅服务器端（API 路由）使用的高权限客户端
export function adminSupabase() {
  const service = process.env.SUPABASE_SERVICE_ROLE!
  return createClient(url, service, { auth: { persistSession: false } })
}
