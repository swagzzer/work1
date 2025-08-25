import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subject, message, userEmail, userName } = await req.json()

    // Validate required fields
    if (!subject || !message || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subject, message, userEmail' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create SMTP client
    const client = new SmtpClient()

    // Configure SMTP settings (you'll need to set these up in your Supabase project)
    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOSTNAME") || "smtp.gmail.com",
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      username: Deno.env.get("SMTP_USERNAME") || "",
      password: Deno.env.get("SMTP_PASSWORD") || "",
    })

    // Send email
    await client.send({
      from: Deno.env.get("SMTP_USERNAME") || "",
      to: "milovicveljko62@gmail.com",
      subject: `Support Request: ${subject}`,
      content: `
        New support request received:
        
        From: ${userName || 'Unknown'} (${userEmail})
        Subject: ${subject}
        
        Message:
        ${message}
        
        ---
        This email was sent from the Sport App support system.
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: 'Support email sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending support email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send support email' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
