import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const instanceId = body.instanceId;

    // Get all instances or specific one
    let instancesQuery = supabase.from('whatsapp_instances').select('id, name');
    if (instanceId) instancesQuery = instancesQuery.eq('id', instanceId);
    const { data: instances } = await instancesQuery;

    if (!instances || instances.length === 0) {
      return new Response(JSON.stringify({ message: 'No instances found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const alerts: any[] = [];

    for (const instance of instances) {
      // Get X1 conversations from last 48h
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('from_number, to_number, body, is_from_me, created_at')
        .eq('instance_id', instance.id)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) continue;

      // Group by contact phone (X1 only - no groups)
      const byContact: Record<string, typeof messages> = {};
      for (const msg of messages) {
        const phone = msg.is_from_me ? msg.to_number : msg.from_number;
        if (!phone || phone.includes('g.us')) continue; // skip groups
        if (!byContact[phone]) byContact[phone] = [];
        byContact[phone].push(msg);
      }

      // Analyze each contact
      for (const [phone, msgs] of Object.entries(byContact)) {
        if (msgs.length < 2) continue;

        const lastMsg = msgs[msgs.length - 1];
        const isLastFromLead = !lastMsg.is_from_me;

        if (!isLastFromLead) continue; // We already responded

        const lastMsgTime = new Date(lastMsg.created_at!).getTime();
        const hoursSinceLastMsg = (Date.now() - lastMsgTime) / (1000 * 60 * 60);

        if (hoursSinceLastMsg < 2) continue; // Too recent

        // Count lead messages in sequence at the end
        let leadMsgsInRow = 0;
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (!msgs[i].is_from_me) leadMsgsInRow++;
          else break;
        }

        const priority = leadMsgsInRow >= 3 ? 'high' : hoursSinceLastMsg > 12 ? 'medium' : 'low';

        // Check if alert already exists for this contact recently
        const { data: existing } = await supabase
          .from('whatsapp_followup_alerts')
          .select('id')
          .eq('instance_id', instance.id)
          .eq('contact_phone', phone)
          .eq('is_dismissed', false)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existing && existing.length > 0) continue; // Already alerted

        // Generate AI analysis
        const lastMsgs = msgs.slice(-8).map(m =>
          `${m.is_from_me ? 'Vendedor' : 'Lead'}: ${m.body}`
        ).join('\n');

        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        let alertMessage = `Lead sem resposta há ${Math.floor(hoursSinceLastMsg)}h. ${leadMsgsInRow} mensagens não respondidas.`;
        let suggestedAction = 'Envie uma mensagem de acompanhamento.';

        if (lovableApiKey) {
          try {
            const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lovableApiKey}` },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-lite',
                messages: [{
                  role: 'user',
                  content: `Analise esta conversa de vendas por WhatsApp. O lead parou de responder há ${Math.floor(hoursSinceLastMsg)} horas. Gere um diagnóstico CURTO (1 frase) e sugira uma mensagem de follow-up (1-2 frases).

Conversa:
${lastMsgs}

Responda EXATAMENTE neste formato:
DIAGNÓSTICO: [frase curta]
AÇÃO: [mensagem de follow-up sugerida]`
                }],
                max_tokens: 200,
              }),
            });

            if (aiResp.ok) {
              const aiData = await aiResp.json();
              const content = aiData.choices?.[0]?.message?.content || '';
              const diagMatch = content.match(/DIAGNÓSTICO:\s*(.+)/i);
              const actionMatch = content.match(/AÇÃO:\s*(.+)/i);
              if (diagMatch) alertMessage = diagMatch[1].trim();
              if (actionMatch) suggestedAction = actionMatch[1].trim();
            }
          } catch { /* use defaults */ }
        }

        // Get contact name from messages
        const contactName = phone; // Could enhance by looking up contacts

        alerts.push({
          instance_id: instance.id,
          contact_phone: phone,
          contact_name: contactName,
          alert_type: 'no_response',
          alert_message: alertMessage,
          suggested_action: suggestedAction,
          priority,
        });
      }
    }

    // Insert alerts
    if (alerts.length > 0) {
      const { error } = await supabase.from('whatsapp_followup_alerts').insert(alerts);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ alertsCreated: alerts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
