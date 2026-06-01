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

    // 4. Extract the generation prompt and optional custom systemInstruction override
    const { prompt, systemInstruction: customInstruction } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "El prompt de generación es requerido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 5. Query Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`
    
    // Use the custom systemInstruction if provided, else fall back to the default plain-text prompt wrapper
    const systemInstruction = customInstruction || `Eres un experto redactor pedagógico y diseñador de contenido académico.
Genera contenido en texto plano limpio y altamente profesional para la indicación: "${prompt}".
Reglas obligatorias:
1. Devuelve ÚNICAMENTE el texto redactado en formato plano. No utilices etiquetas HTML ni bloques de código markdown (\`\`\`html\`\`\` o \`\`\`text\`\`\`).
2. Estructura el texto con títulos claros, viñetas elegantes (puedes usar emojis descriptivos) o párrafos concisos según corresponda.
3. Asegúrate de que el texto sea extremadamente fácil de copiar y pegar en diapositivas de presentación.
4. Mantén un tono formal, educativo y profesional, restringiendo el contenido estrictamente a temáticas aptas para presentaciones de negocios, ingeniería o divulgación académica.`

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
      .replace(/```text/gi, "")
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
