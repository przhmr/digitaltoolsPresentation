/**
 * 🛡️ SUPABASE AUTHENTICATION GATEKEEPER (Google SSO & Email Whitelisting)
 * ------------------------------------------------------------------------
 * Protege el acceso global a nivel de entrada para editor.html y AdvancedEditor.html.
 * Requiere inicio de sesión con Google SSO y valida contra la tabla allowed_emails.
 */

// ⚙️ INGRESA AQUÍ LAS CREDENCIALES PÚBLICAS DE TU PROYECTO DE SUPABASE
const DEFAULT_SUPABASE_URL = ""; 
const DEFAULT_SUPABASE_ANON_KEY = "";

window.addEventListener('DOMContentLoaded', async () => {
  // Read config from hardcoded constants or local storage override (if any)
  const sbUrl = localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
  const sbKey = localStorage.getItem('supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;

  // If Supabase is NOT configured, run in open single-user mode (fallback compatible)
  if (!sbUrl || !sbKey) {
    console.log("⚡ Supabase credentials not configured. Running in local single-user mode.");
    return;
  }

  // Inject gatekeeper overlay styles immediately
  injectStyles();

  // Create full-screen loading/lock overlay
  const overlay = document.createElement('div');
  overlay.id = 'auth-gatekeeper-overlay';
  overlay.innerHTML = `
    <div class="auth-gatekeeper-content">
      <div class="auth-glow-sphere"></div>
      <div class="auth-card">
        <div class="auth-logo-badge">🔑</div>
        <h2 id="auth-title">Verificando Credenciales...</h2>
        <p id="auth-desc" style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin: 10px 0 20px 0;">
          Cargando entorno seguro de presentación de equipo...
        </p>
        <div id="auth-action-area">
          <div class="auth-spinner"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Initialize Supabase Client
  let supabaseClient = null;
  try {
    supabaseClient = supabase.createClient(sbUrl, sbKey);
    window.supabaseClient = supabaseClient; // Expose globally for sharing
  } catch (err) {
    console.error("Supabase Init Error inside Gatekeeper:", err);
    showError("Error de inicialización del servidor.");
    return;
  }

  // Define Auth Actions
  window.loginWithGoogleSSO = async function() {
    try {
      const btn = document.getElementById('btn-login-sso');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="auth-spinner-mini"></span> Conectando con Google...`;
      }
      await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
    } catch (err) {
      showError("No se pudo iniciar el flujo de autenticación.");
    }
  };

  window.logoutTeamSession = async function() {
    try {
      const btn = document.getElementById('btn-logout-sso');
      if (btn) btn.disabled = true;
      await supabaseClient.auth.signOut();
      window.location.reload();
    } catch (err) {
      window.location.reload();
    }
  };

  // Check Active Session
  try {
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) throw sessionError;

    if (!session || !session.user) {
      // 🔓 User is NOT logged in: Show Google SSO Login UI
      showLoginUI();
    } else {
      // 🔒 User is logged in: Check whitelisted allowed_emails database table
      const user = session.user;
      checkEmailWhitelist(user);
    }
  } catch (err) {
    console.error("Session verification error:", err);
    showError("No se pudo comprobar la sesión del miembro de equipo.");
  }

  // Whitelist Verification
  async function checkEmailWhitelist(user) {
    const titleEl = document.getElementById('auth-title');
    const descEl = document.getElementById('auth-desc');
    if (titleEl) titleEl.innerText = "Verificando Autorización...";
    if (descEl) descEl.innerText = `Validando permisos para tu correo: ${user.email}`;

    try {
      const { data: allowed, error: dbError } = await supabaseClient
        .from("allowed_emails")
        .select("email")
        .eq("email", user.email)
        .single();

      if (dbError || !allowed) {
        // ⛔ Email is NOT whitelisted
        showAccessDeniedUI(user.email, user.user_metadata?.avatar_url);
      } else {
        // ✅ Email is whitelisted: Let them pass!
        unlockEditor(user);
      }
    } catch (err) {
      console.error("Whitelist query error:", err);
      showAccessDeniedUI(user.email, user.user_metadata?.avatar_url);
    }
  }

  // UI State Modifiers
  function showLoginUI() {
    const titleEl = document.getElementById('auth-title');
    const descEl = document.getElementById('auth-desc');
    const actionEl = document.getElementById('auth-action-area');

    if (titleEl) titleEl.innerText = "Acceso Restringido 🔒";
    if (descEl) descEl.innerText = "Esta suite de diapositivas es privada. Por favor, inicia sesión con tu cuenta autorizada de Gmail para acceder a los editores.";
    
    if (actionEl) {
      actionEl.innerHTML = `
        <button id="btn-login-sso" class="auth-btn-google" onclick="loginWithGoogleSSO()">
          🔴 Iniciar Sesión con Google
        </button>
      `;
    }
  }

  function showAccessDeniedUI(email, avatarUrl) {
    const titleEl = document.getElementById('auth-title');
    const descEl = document.getElementById('auth-desc');
    const actionEl = document.getElementById('auth-action-area');
    const avatar = avatarUrl || 'https://www.gravatar.com/avatar/?d=mp';

    if (titleEl) titleEl.innerText = "Acceso Restringido 🚫";
    if (descEl) {
      descEl.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; gap:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); padding:8px 12px; border-radius:8px; margin-bottom:15px; text-align:left;">
          <img src="${avatar}" style="width:24px; height:24px; border-radius:50%; border:1px solid #8b5cf6;" alt="avatar">
          <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.75rem;">
            <strong style="color:#fff; display:block;">Sesión conectada</strong>
            <span style="color:#94a3b8; font-size:0.9em;">${email}</span>
          </div>
        </div>
        Lo sentimos, tu dirección de correo no está registrada en la lista blanca de este equipo de trabajo. Por favor, ponte en contacto con el administrador para solicitar acceso.
      `;
    }
    
    if (actionEl) {
      actionEl.innerHTML = `
        <button id="btn-logout-sso" class="auth-btn-secondary" onclick="logoutTeamSession()">
          🚪 Cerrar Sesión / Salir
        </button>
      `;
    }
  }

  function showError(msg) {
    const titleEl = document.getElementById('auth-title');
    const descEl = document.getElementById('auth-desc');
    const actionEl = document.getElementById('auth-action-area');

    if (titleEl) titleEl.innerText = "Error de Conexión ⚠️";
    if (descEl) descEl.innerText = msg;
    if (actionEl) {
      actionEl.innerHTML = `
        <button class="auth-btn-secondary" onclick="window.location.reload()">
          🔄 Reintentar
        </button>
      `;
    }
  }

  function unlockEditor(user) {
    const titleEl = document.getElementById('auth-title');
    const actionEl = document.getElementById('auth-action-area');
    if (titleEl) titleEl.innerText = "¡Acceso Concedido! 🔓";
    if (actionEl) actionEl.innerHTML = ``;

    // Visual fade-out transition
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay.remove();
    }, 450);
  }

  // CSS Styles injection
  function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      #auth-gatekeeper-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #030a1c;
        background-image: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.12), #030a1c 80%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.4s ease-out;
        font-family: 'Outfit', 'Inter', sans-serif;
      }
      .auth-gatekeeper-content {
        position: relative;
        width: 100%;
        max-width: 440px;
        padding: 20px;
      }
      .auth-glow-sphere {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%);
        transform: translate(-50%, -50%);
        z-index: 0;
        pointer-events: none;
      }
      .auth-card {
        position: relative;
        z-index: 1;
        background: rgba(10, 18, 38, 0.65);
        border: 1px solid rgba(0, 242, 254, 0.18);
        border-radius: 20px;
        padding: 35px 25px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.45);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
      }
      .auth-logo-badge {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        background: linear-gradient(135deg, #00f2fe, #8b5cf6);
        display: grid;
        place-items: center;
        font-size: 1.8rem;
        margin: 0 auto 20px auto;
        box-shadow: 0 8px 24px rgba(0, 242, 254, 0.35);
      }
      .auth-card h2 {
        font-size: 1.35rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 10px 0;
        background: linear-gradient(90deg, #fff, #00f2fe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .auth-btn-google {
        width: 100%;
        padding: 12px 20px;
        border-radius: 12px;
        background: linear-gradient(135deg, #ff007f, #8b5cf6);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 8px 20px rgba(255, 0, 127, 0.25);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .auth-btn-google:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px rgba(255, 0, 127, 0.4);
      }
      .auth-btn-google:active {
        transform: translateY(0);
      }
      .auth-btn-secondary {
        width: 100%;
        padding: 10px 20px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
        font-size: 0.78rem;
        cursor: pointer;
        transition: background 0.2s;
      }
      .auth-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      .auth-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(0, 242, 254, 0.15);
        border-radius: 50%;
        border-top-color: #00f2fe;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto;
      }
      .auth-spinner-mini {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        display: inline-block;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
});
