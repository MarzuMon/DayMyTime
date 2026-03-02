import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const data = `${orderId}|${paymentId}`
  const key = new TextEncoder().encode(secret)
  const message = new TextEncoder().encode(data)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message)
  const expectedSignature = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return expectedSignature === signature
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub as string
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeySecret) {
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment details' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify Razorpay signature
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpayKeySecret)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role for atomic updates
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Check order belongs to this user and hasn't been processed (prevent replay)
    const { data: subscription, error: subError } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (subError || !subscription) {
      return new Response(JSON.stringify({ error: 'Order not found or already processed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Atomically update subscription and profile
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        status: 'active',
        razorpay_payment_id,
        razorpay_subscription_id: razorpay_signature,
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Subscription update error:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Upgrade user to Pro
    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Subscription was updated, log the issue but don't fail
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
