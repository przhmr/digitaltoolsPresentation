import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
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

    // 1. Extract the team password from the Authorization Bearer header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Acceso denegado: Falta cabecera de Autorización." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const inputPassword = authHeader.replace("Bearer ", "")

    // 2. Fetch the correct team password from the team_auth table
    const { data: dbAuth, error: dbError } = await supabase
      .from("team_auth")
      .select("value")
      .eq("key", "team_password")
      .single()

    if (dbError || !dbAuth) {
      return new Response(
        JSON.stringify({ error: "Error en el servidor: No se pudo verificar la contraseña del equipo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Compare the passwords
    if (inputPassword !== dbAuth.value) {
      return new Response(
        JSON.stringify({ error: "Acceso denegado: Contraseña de equipo incorrecta." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Extract the generation prompt
    const { prompt } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "El prompt de generación es requerido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 5. Query Gemini
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
    
    // Clean markdown wrappers
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
