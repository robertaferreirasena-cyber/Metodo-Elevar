import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SYSTEM_VAR_PREFIXES = [
  'PATH', 'HOME', 'DENO_DIR', 'HOSTNAME', 'PORT', 'TMPDIR', 'USER', 'LANG',
  'TERM', '_', 'DENO_REGION', 'DENO_DEPLOYMENT_ID', 'XDG_', 'SHLVL', 'PWD',
  'OLDPWD', 'SHELL', 'LOGNAME', 'LS_COLORS', 'LESSOPEN', 'LESSCLOSE',
]

const CREDENTIAL_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

const knownFunctionNames = [
  'sales-strategist',
  'conversation-analyzer',
  'persona-generator',
  'sequence-generator',
  'kiwify-webhook',
  'admin-create-user',
  'admin-manage-user',
  'send-scheduled-posts',
  'uazapi-manager',
  'whatsapp-webhook-receiver',
  'whatsapp-ai-agent',
  'whatsapp-followup-agent',
  'admin-credentials',
]

function isSystemVar(key: string): boolean {
  return SYSTEM_VAR_PREFIXES.some(prefix =>
    key === prefix || key.startsWith(prefix + '_') || (prefix.endsWith('_') && key.startsWith(prefix))
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate JWT manually
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token não fornecido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin or desenvolvedor role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = (roles || []).map((r: { role: string }) => r.role)
    const hasAccess = userRoles.includes('admin') || userRoles.includes('desenvolvedor')

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Requer role admin ou desenvolvedor.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Collect all env vars
    const allEnv = Deno.env.toObject()
    const secrets: Record<string, string> = {}

    for (const [key, value] of Object.entries(allEnv)) {
      if (!isSystemVar(key) && !CREDENTIAL_KEYS.includes(key)) {
        secrets[key] = value
      }
    }

    // Probe edge functions
    const probeResults = await Promise.allSettled(
      knownFunctionNames.map(async (name) => {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, { method: 'OPTIONS' })
          return { name, exists: res.status < 500 }
        } catch {
          return { name, exists: false }
        }
      })
    )

    const edgeFunctions: string[] = []
    for (const result of probeResults) {
      if (result.status === 'fulfilled' && result.value.exists) {
        edgeFunctions.push(result.value.name)
      }
    }

    const response = {
      project_url: supabaseUrl,
      anon_key: Deno.env.get('SUPABASE_ANON_KEY') || null,
      service_role_key: supabaseServiceKey,
      secrets,
      edge_functions: edgeFunctions,
      edge_functions_count: edgeFunctions.length,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Admin credentials error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
