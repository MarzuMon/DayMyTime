import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { teamId, email, invitedBy } = await req.json()

    if (!teamId || !email || !invitedBy) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('email', email)
      .maybeSingle()

    if (existing && existing.status === 'pending') {
      return new Response(JSON.stringify({ error: 'Invitation already sent to this email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If previously declined/expired, delete and re-invite
    if (existing) {
      await supabase.from('team_invitations').delete().eq('id', existing.id)
    }

    // Get team name for the email
    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()

    // Get inviter name
    const { data: inviter } = await supabase.from('profiles').select('display_name').eq('id', invitedBy).single()

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({ team_id: teamId, email, invited_by: invitedBy })
      .select()
      .single()

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For now, return success with the token (email sending can be added with Resend later)
    return new Response(JSON.stringify({ 
      success: true, 
      invitation: {
        id: invitation.id,
        token: invitation.token,
        team_name: team?.name || 'Unknown Team',
        inviter_name: inviter?.display_name || 'Someone',
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
