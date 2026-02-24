import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const COPY_FORMATS_CONTEXT = `Formatos de Copy disponíveis: PAS (Problema-Agitação-Solução), BAB (Before-After-Bridge), AIDA (Atenção-Interesse-Desejo-Ação), FAB (Features-Advantages-Benefits), 4Ps, PASTOR, Storytelling, Prova Social, Escassez/Urgência, Curiosidade. Níveis de consciência: Inconsciente → Consciente do Problema → Consciente da Solução → Consciente do Produto → Mais Consciente. Adapte o formato ao nível de consciência do lead.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { groupId, instanceId, messageBody, senderNumber, senderName } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find active agent
    const { data: agent } = await supabase
      .from('whatsapp_ai_agents')
      .select('*')
      .eq('group_id', groupId)
      .eq('instance_id', instanceId)
      .eq('is_active', true)
      .maybeSingle()

    if (!agent) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_agent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit check
    const now = new Date()
    const hourReset = agent.hour_reset_at ? new Date(agent.hour_reset_at) : new Date(0)
    let responsesThisHour = agent.responses_this_hour || 0

    if (now.getTime() - hourReset.getTime() > 3600000) {
      responsesThisHour = 0
      await supabase.from('whatsapp_ai_agents').update({
        responses_this_hour: 0, hour_reset_at: now.toISOString(),
      }).eq('id', agent.id)
    }

    if (responsesThisHour >= (agent.max_responses_per_hour || 20)) {
      return new Response(JSON.stringify({ ok: false, reason: 'rate_limited' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check trigger
    const triggerMode = agent.trigger_mode || 'mention'
    const keywords = agent.trigger_keywords || []
    const msgLower = messageBody.toLowerCase()

    let shouldRespond = false
    if (triggerMode === 'all') {
      shouldRespond = true
    } else if (triggerMode === 'keyword') {
      shouldRespond = keywords.some((kw: string) => msgLower.includes(kw.toLowerCase()))
    } else {
      shouldRespond = msgLower.includes('@bot') || msgLower.includes('agente') || msgLower.includes('assistente')
    }

    if (!shouldRespond) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_trigger' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Recent messages for context (more for closer agents)
    const isCloser = agent.agent_type === 'closer'
    const contextLimit = isCloser ? 15 : 10

    const { data: recentMsgs } = await supabase
      .from('whatsapp_messages')
      .select('body, is_from_me, from_number, created_at')
      .eq('instance_id', instanceId)
      .or(`from_number.like.%${groupId}%,to_number.like.%${groupId}%`)
      .order('created_at', { ascending: false })
      .limit(contextLimit)

    const contextMessages = (recentMsgs || []).reverse().map((m: Record<string, unknown>) =>
      `${m.is_from_me ? 'Bot' : (m.from_number as string || 'Membro')}: ${m.body || ''}`
    ).join('\n')

    // Build persona context if enabled
    let personaContext = ''
    if (agent.use_persona_context !== false) {
      const { data: inst } = await supabase
        .from('whatsapp_instances')
        .select('created_by')
        .eq('id', instanceId)
        .maybeSingle()

      if (inst?.created_by) {
        const { data: persona } = await supabase
          .from('persona_profiles')
          .select('niche, product_description, main_pain, transformation, generated_raio_x')
          .eq('user_id', inst.created_by)
          .maybeSingle()

        if (persona?.generated_raio_x) {
          const rx = persona.generated_raio_x as Record<string, unknown>
          const estrategia = rx.estrategia_recomendada as Record<string, unknown> | undefined
          personaContext = `\nContexto do negócio: ${persona.niche || ''} - ${persona.product_description || ''}. Dor: ${persona.main_pain || ''}. Transformação: ${persona.transformation || ''}. Tom: ${estrategia?.tom_comunicacao || 'natural'}.`
        }
      }
    }

    // Build knowledge base context
    const knowledgeBase = agent.knowledge_base ? `\nBase de Conhecimento:\n${agent.knowledge_base}` : ''

    // Build copy formats context
    const copyContext = agent.use_copy_formats ? `\n${COPY_FORMATS_CONTEXT}` : ''

    // Build rules based on agent type
    const responseRules = isCloser
      ? `Regras:
- Responda de forma consultiva e elaborada (5-8 linhas quando necessário)
- Use linguagem natural, persuasiva e empática
- Não use markdown, apenas texto simples com emojis pontuais
- Responda em português brasileiro
- Sempre termine com uma pergunta estratégica ou CTA claro
- Siga os 4 Pilares de Transformação da base de conhecimento
- Personalize cada resposta usando o nome e contexto do lead
- Nunca revele que é uma IA ou mencione metodologia interna`
      : `Regras:
- Responda de forma CURTA e natural (máx 3-4 linhas)
- Use linguagem informal e amigável
- Não use markdown, apenas texto simples
- Responda em português brasileiro
- Seja útil mas não invasivo`

    const systemPrompt = `${agent.system_prompt || 'Você é um assistente inteligente.'}
${personaContext}${knowledgeBase}${copyContext}

${responseRules}

Histórico recente do grupo:
${contextMessages}

A mensagem foi enviada por: ${senderName || senderNumber}`

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

    // Use more capable model for closer agents
    const model = isCloser ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash-lite'

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageBody },
        ],
        stream: false,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ ok: false, reason: status === 429 ? 'ai_rate_limited' : 'ai_no_credits' }), {
          status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error('AI request failed')
    }

    const aiData = await aiResponse.json()
    const reply = aiData.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('Empty AI response')

    // Delay before responding
    const delay = (agent.response_delay_seconds || 5) * 1000
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)))

    // Send via UAZapi
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('instance_token')
      .eq('id', instanceId)
      .single()

    if (!instance?.instance_token) throw new Error('Instance token not found')

    const UAZAPI_URL = Deno.env.get('UAZAPI_URL')?.replace(/\/$/, '')
    if (!UAZAPI_URL) throw new Error('UAZAPI_URL not configured')

    await fetch(`${UAZAPI_URL}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: instance.instance_token },
      body: JSON.stringify({ number: groupId, text: reply }),
    })

    // Update counter
    await supabase.from('whatsapp_ai_agents').update({
      responses_this_hour: responsesThisHour + 1,
      updated_at: now.toISOString(),
    }).eq('id', agent.id)

    console.log(`[ai-agent] Replied in group ${groupId}`)

    return new Response(JSON.stringify({ ok: true, reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AI agent error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
