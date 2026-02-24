import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload).slice(0, 500))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const instanceToken = req.headers.get('token') || payload?.token || payload?.instance?.token
    
    let instanceId: string | null = null
    if (instanceToken) {
      const { data: inst } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('instance_token', instanceToken)
        .maybeSingle()
      instanceId = inst?.id || null
    }

    const evento = payload?.evento || payload?.event || ''
    
    // Connection status events
    if (evento === 'connection' || evento === 'status' || payload?.status !== undefined) {
      const newStatus = payload?.status || payload?.state || 'disconnected'
      const phone = payload?.phone || payload?.phoneNumber || null

      if (instanceId) {
        await supabase
          .from('whatsapp_instances')
          .update({ status: newStatus, phone })
          .eq('id', instanceId)
        
        console.log(`Instance ${instanceId} status updated to: ${newStatus}`)
      }

      return new Response(JSON.stringify({ ok: true, type: 'connection' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Message events
    if (evento === 'messages' || evento === 'message' || payload?.message || payload?.body) {
      const msg = payload?.message || payload
      const fromNumber = msg?.from || msg?.sender || msg?.remoteJid || payload?.from || ''
      const toNumber = msg?.to || payload?.to || ''
      const body = msg?.body || msg?.text || msg?.content || payload?.body || ''
      const messageType = msg?.type || msg?.messageType || payload?.type || 'text'
      const mediaUrl = msg?.mediaUrl || msg?.media?.url || null
      const isFromMe = msg?.fromMe || msg?.isFromMe || false
      const messageId = msg?.id || msg?.messageId || payload?.messageId || null

      const { error: insertError } = await supabase
        .from('whatsapp_messages')
        .insert({
          instance_id: instanceId,
          message_id: messageId,
          from_number: fromNumber || 'unknown',
          to_number: toNumber,
          body,
          message_type: messageType,
          media_url: mediaUrl,
          is_from_me: isFromMe,
          status: 'received',
          raw_data: payload,
        })

      if (insertError) {
        console.error('Error saving message:', insertError)
        return new Response(JSON.stringify({ ok: false, error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Message saved from ${fromNumber}`)

      // Check if it's a group message and trigger AI agent (non-blocking)
      const isGroup = fromNumber.includes('@g.us') || toNumber.includes('@g.us')
      if (isGroup && !isFromMe && instanceId && body) {
        const groupId = fromNumber.includes('@g.us') ? fromNumber : toNumber
        const senderNumber = fromNumber.includes('@g.us') ? (msg?.participant || msg?.author || '') : fromNumber
        const senderName = msg?.notifyName || msg?.pushName || senderNumber

        // Fire and forget - don't await to keep webhook fast
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
        
        fetch(`${SUPABASE_URL}/functions/v1/whatsapp-ai-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            groupId,
            instanceId,
            messageBody: body,
            senderNumber,
            senderName,
          }),
        }).catch(err => console.error('AI agent trigger error:', err))
      }

      return new Response(JSON.stringify({ ok: true, type: 'message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Unknown event type:', evento)
    return new Response(JSON.stringify({ ok: true, type: 'unknown', evento }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook receiver error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
