import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Route map: action -> { endpoint, method, bodyBuilder, validate }
type ActionConfig = {
  endpoint: string | ((extra: Record<string, unknown>) => string)
  method: string
  body?: (extra: Record<string, unknown>, wh?: unknown) => unknown
  validate?: (extra: Record<string, unknown>) => string | null
}

const actions: Record<string, ActionConfig> = {
  // Instance — confirmed working on UAZapi v2
  status:           { endpoint: '/instance/status', method: 'GET' },
  connect:          { endpoint: '/instance/connect', method: 'POST' },
  disconnect:       { endpoint: '/instance/disconnect', method: 'POST' },
  restart:          { endpoint: '/instance/disconnect', method: 'POST' }, // v2 has no restart; disconnect+connect as workaround
  getInstanceInfo:  { endpoint: '/instance/status', method: 'GET' },     // v2 has no /instance/info; reuse /instance/status

  // Contacts — v2 uses /contacts/list (POST) for listing
  getContacts:    { endpoint: '/contacts/list', method: 'POST', body: () => ({ page: 1, pageSize: 100 }) },

  // Contact actions — confirmed on UAZapi v2
  checkNumber:    { endpoint: '/chat/check', method: 'POST', body: e => ({ numbers: [String(e.phone).replace('@s.whatsapp.net', '')] }), validate: e => e.phone ? null : 'phone necessário' },
  blockContact:   { endpoint: '/chat/block', method: 'POST', body: e => ({ number: String(e.phone).includes('@') ? e.phone : e.phone + '@s.whatsapp.net' }), validate: e => e.phone ? null : 'phone necessário' },

  // Chat — confirmed working on UAZapi v2
  getChats:      { endpoint: '/chat/find', method: 'POST', body: () => ({ sort: '-wa_lastMsgTimestamp', limit: 50, offset: 0 }) },
  getMessages:   { endpoint: '/message/find', method: 'POST', body: e => ({ chatid: e.phone, limit: e.count || 50 }), validate: e => e.phone ? null : 'phone necessário' },
  markAsRead:    { endpoint: '/chat/read', method: 'POST', body: e => ({ number: e.chatId }), validate: e => e.chatId ? null : 'chatId necessário' },
  archiveChat:   { endpoint: '/chat/archive', method: 'POST', body: e => ({ chatid: e.chatId, archive: e.archive ?? true }), validate: e => e.chatId ? null : 'chatId necessário' },
  muteChat:      { endpoint: '/chat/mute', method: 'POST', body: e => ({ chatid: e.chatId, mute: e.mute ?? true }), validate: e => e.chatId ? null : 'chatId necessário' },
  pinChat:       { endpoint: '/chat/pin', method: 'POST', body: e => ({ chatid: e.chatId, pin: e.pin ?? true }), validate: e => e.chatId ? null : 'chatId necessário' },
  deleteChat:    { endpoint: '/chat/delete', method: 'POST', body: e => ({ chatid: e.chatId }), validate: e => e.chatId ? null : 'chatId necessário' },

  // Send — all POST, confirmed working
  sendText:     { endpoint: '/send/text', method: 'POST', body: e => ({ number: e.phone, text: e.message }), validate: e => e.phone && e.message ? null : 'phone e message necessários' },
  sendImage:    { endpoint: '/send/image', method: 'POST', body: e => ({ number: e.phone, image: e.image, caption: e.caption || '' }), validate: e => e.phone && e.image ? null : 'phone e image necessários' },
  sendDocument: { endpoint: '/send/document', method: 'POST', body: e => ({ number: e.phone, document: e.document, fileName: e.fileName || 'file' }), validate: e => e.phone && e.document ? null : 'phone e document necessários' },
  sendAudio:    { endpoint: '/send/audio', method: 'POST', body: e => ({ number: e.phone, audio: e.audio }), validate: e => e.phone && e.audio ? null : 'phone e audio necessários' },
  sendVideo:    { endpoint: '/send/video', method: 'POST', body: e => ({ number: e.phone, video: e.video, caption: e.caption || '' }), validate: e => e.phone && e.video ? null : 'phone e video necessários' },
  sendLocation: { endpoint: '/send/location', method: 'POST', body: e => ({ number: e.phone, lat: e.lat, lng: e.lng, name: e.name || '', address: e.address || '' }), validate: e => e.phone && e.lat && e.lng ? null : 'phone, lat e lng necessários' },
  sendContact:  { endpoint: '/send/contact', method: 'POST', body: e => ({ number: e.phone, contact: e.contact }), validate: e => e.phone && e.contact ? null : 'phone e contact necessários' },
  sendSticker:  { endpoint: '/send/sticker', method: 'POST', body: e => ({ number: e.phone, sticker: e.sticker }), validate: e => e.phone && e.sticker ? null : 'phone e sticker necessários' },
  sendLink:     { endpoint: '/send/linkpreview', method: 'POST', body: e => ({ number: e.phone, url: e.url, title: e.title || '', description: e.description || '' }), validate: e => e.phone && e.url ? null : 'phone e url necessários' },
  sendButtons:  { endpoint: '/send/buttons', method: 'POST', body: e => ({ number: e.phone, title: e.title, text: e.text, buttons: e.buttons }), validate: e => e.phone && e.buttons ? null : 'phone e buttons necessários' },
  sendList:     { endpoint: '/send/list', method: 'POST', body: e => ({ number: e.phone, title: e.title, text: e.text, buttonText: e.buttonText, sections: e.sections }), validate: e => e.phone && e.sections ? null : 'phone e sections necessários' },
  sendPoll:     { endpoint: '/send/poll', method: 'POST', body: e => ({ number: e.phone, name: e.name, options: e.options, selectableCount: e.selectableCount || 1 }), validate: e => e.phone && e.name && e.options ? null : 'phone, name e options necessários' },
  sendReaction: { endpoint: '/send/reaction', method: 'POST', body: e => ({ number: e.phone, messageid: e.messageId, reaction: e.reaction }), validate: e => e.phone && e.messageId ? null : 'phone e messageId necessários' },

  // Message actions
  deleteMessage: { endpoint: '/message/delete', method: 'POST', body: e => ({ number: e.phone, messageid: e.messageId }), validate: e => e.phone && e.messageId ? null : 'phone e messageId necessários' },
  editMessage:   { endpoint: '/message/edit', method: 'POST', body: e => ({ number: e.phone, messageid: e.messageId, text: e.text }), validate: e => e.phone && e.messageId && e.text ? null : 'phone, messageId e text necessários' },

  // Groups — confirmed on UAZapi v2
  getGroups:              { endpoint: '/group/list', method: 'GET' },
  createGroup:            { endpoint: '/group/create', method: 'POST', body: e => ({ name: e.name, participants: e.participants }), validate: e => e.name && e.participants ? null : 'name e participants necessários' },
  getGroupInviteLink:     { endpoint: (e) => `/group/invitelink/${e.groupId}`, method: 'GET', validate: e => e.groupId ? null : 'groupId necessário' },
  // Note: group participant management (add/remove/promote/demote) and group metadata updates
  // (description, name, photo) are NOT available in UAZapi v2.
  // Group members can be viewed via getGroups which returns Participants in each group.
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: user.id })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const UAZAPI_URL = Deno.env.get('UAZAPI_URL')?.replace(/\/$/, '')
    if (!UAZAPI_URL) {
      return new Response(JSON.stringify({ error: 'UAZAPI_URL não configurado' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action, instanceToken, webhookConfig, extraData } = await req.json()

    if (!instanceToken) {
      return new Response(JSON.stringify({ error: 'Token da instância necessário' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Special case: webhook
    if (action === 'webhook') {
      if (!webhookConfig) {
        return new Response(JSON.stringify({ error: 'webhookConfig necessário' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const apiUrl = `${UAZAPI_URL}/webhook`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': instanceToken },
        body: JSON.stringify(webhookConfig),
      })
      const responseText = await response.text()
      let data
      try { data = JSON.parse(responseText) } catch { return new Response(JSON.stringify({ error: `Resposta inválida: ${responseText.slice(0, 100)}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
      return new Response(JSON.stringify(data), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Special case: testEndpoint
    if (action === 'testEndpoint') {
      const extra = (extraData || {}) as Record<string, unknown>
      if (!extra.endpoint) {
        return new Response(JSON.stringify({ error: 'endpoint necessário' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const apiUrl = `${UAZAPI_URL}${extra.endpoint}`
      const method = (extra.method as string) || 'GET'
      const fetchOpts: RequestInit = { method, headers: { 'Content-Type': 'application/json', 'token': instanceToken } }
      if (extra.body) fetchOpts.body = JSON.stringify(extra.body)
      const response = await fetch(apiUrl, fetchOpts)
      const responseText = await response.text()
      let data
      try { data = JSON.parse(responseText) } catch { return new Response(JSON.stringify({ error: `Resposta inválida: ${responseText.slice(0, 100)}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
      return new Response(JSON.stringify(data), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Standard actions
    const config = actions[action]
    if (!config) {
      return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const extra = (extraData || {}) as Record<string, unknown>
    if (config.validate) {
      const err = config.validate(extra)
      if (err) {
        return new Response(JSON.stringify({ error: err }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const endpoint = typeof config.endpoint === 'function' ? config.endpoint(extra) : config.endpoint
    const apiUrl = `${UAZAPI_URL}${endpoint}`
    console.log(`UAZapi request: ${config.method} ${apiUrl}`)

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: { 'Content-Type': 'application/json', 'token': instanceToken },
    }
    if (config.body) {
      fetchOptions.body = JSON.stringify(config.body(extra, webhookConfig))
    }

    const response = await fetch(apiUrl, fetchOptions)
    const responseText = await response.text()
    console.log(`UAZapi response: ${response.status} ${responseText.slice(0, 500)}`)

    let data
    try { data = JSON.parse(responseText) } catch {
      return new Response(JSON.stringify({ error: `Resposta inválida: ${responseText.slice(0, 100)}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify(data), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('UAZapi manager error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
