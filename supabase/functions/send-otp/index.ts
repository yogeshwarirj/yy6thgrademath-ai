import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "rj.yogeshwari@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, email } = await req.json();
    if (!studentName || !email) {
      throw new Error("Student name and email are required");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete any existing pending registrations for this email
    await supabase
      .from("pending_registrations")
      .delete()
      .eq("email", email);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("pending_registrations")
      .insert({ student_name: studentName, email, otp });

    if (insertError) throw insertError;

    // Send OTP via Gmail SMTP
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailAppPassword) throw new Error("GMAIL_APP_PASSWORD not configured");

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: ADMIN_EMAIL,
          password: gmailAppPassword,
        },
      },
    });

    await client.send({
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Registration OTP for ${studentName}: ${otp}`,
      content: `New student registration request:\n\nStudent Name: ${studentName}\nStudent Email: ${email}\nOTP Code: ${otp}\n\nThis OTP expires in 10 minutes.`,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
