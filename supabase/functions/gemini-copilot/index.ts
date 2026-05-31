import { serve } from "https://deno.land/std@0.168/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? ""

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL o Service Role Key no están configurados en el servidor.")
    }
    if (!geminiApiKey) {
      throw new Error("La clave GEMINI_API_KEY no está configurada en los secrets de Supabase.")
    }

    // Initialize administrative Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Extract and validate user authorization JWT token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Falta cabecera de Autorización Bearer." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sesión inválida o expirada. Por favor vuelve a iniciar sesión." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Query allowed_emails database to whitelist team members
    const { data: allowed, error: dbError } = await supabase
      .from("allowed_emails")
      .select("email")
      .eq("email", user.email)
      .single()

    if (dbError || !allowed) {
      return new Response(
        JSON.stringify({
          error: `Acceso restringido: Tu correo (${user.email}) no está autorizado en la lista blanca de este equipo.`
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Extract the generation prompt
    const { prompt } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "El prompt de generación es requerido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Construct Gemini API query
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
    const systemInstruction = `Eres un experto diseñador web especializado en Reveal.js y CSS moderno con glassmorphism.
Genera un bloque de diapositiva auto-contenido en HTML premium para la indicación: "${prompt}".
Reglas obligatorias:
1. Devuelve ÚNICAMENTE código HTML directo y limpio. No uses bloques de markdown (\`\`\`html \`\`\`).
2. Usa estilos inline elegantes de CSS. Aplica colores del ecosistema (azul marino profundo, cian neón '#00f2fe', violeta '#8b5cf6', gris '#94a3b8').
3. Para tarjetas, usa la clase 'glass-card' con borde de 1px solid rgba(0, 242, 254, 0.25).
4. El tamaño de fuente de los textos debe ser pequeño, idealmente expresado en 'em' (e.g. 0.45em, 0.55em, 0.65em) para asegurar responsividad total en RevealJS.
5. Haz que sea visualmente impactante, interactivo si aplica, y con excelente micro-tipografía.`

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemInstruction }] }]
      })
    })

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text()
      throw new Error(`Error en API de Gemini: ${errorText}`)
    }

    const geminiData = await geminiRes.json()
    let htmlResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    
    // Clean markdown wrapper elements if Gemini still includes them
    htmlResult = htmlResult
      .replace(/```html/gi, "")
      .replace(/```/g, "")
      .trim()

    return new Response(
      JSON.stringify({ html: htmlResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
