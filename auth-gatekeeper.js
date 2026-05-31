/**
 * 🛡️ SUPABASE MANUAL PASSWORD GATEKEEPER
 * ------------------------------------------------------------------------
 * Protege el acceso global a nivel de entrada para editor.html y AdvancedEditor.html.
 * Requiere una contraseña de equipo validada directamente contra la base de datos de Supabase.
 */

// ⚙️ INGRESA AQUÍ LAS CREDENCIALES PÚBLICAS DE TU PROYECTO DE SUPABASE
const DEFAULT_SUPABASE_URL = "https://wsmktslxrgnoxzpycymj.supabase.co"; 
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable__pV5l2sQPXzWwx90UsQTrw_PKRwzFm1";

window.addEventListener('DOMContentLoaded', async () => {
  // Clean up legacy localStorage credentials if any exist
  localStorage.removeItem('team_auth_password');

  // Read config from hardcoded constants or local storage override (if any)
  const cachedUrl = localStorage.getItem('supabase_url');
  const cachedKey = localStorage.getItem('supabase_anon_key');
  const sbUrl = cachedUrl === 'none' ? '' : (cachedUrl || DEFAULT_SUPABASE_URL);
  const sbKey = cachedKey === 'none' ? '' : (cachedKey || DEFAULT_SUPABASE_ANON_KEY);

  // If Supabase is NOT configured, run in open single-user mode (fallback compatible)
  if (!sbUrl || !sbKey) {
    console.log("⚡ Supabase credentials not configured. Running in local single-user mode.");
    return;
  }

  // Inject gatekeeper overlay styles immediately
  injectStyles();

  // Create full-screen Loading / Password lock overlay
  const overlay = document.createElement('div');
  overlay.id = 'auth-gatekeeper-overlay';
  overlay.innerHTML = `
    <div class="auth-gatekeeper-content">
      <div class="auth-glow-sphere"></div>
      <div class="auth-card">
        <div class="auth-logo-badge">🔑</div>
        <h2 id="auth-title">Cargando Suite...</h2>
        <p id="auth-desc" style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin: 10px 0 20px 0;">
          Estableciendo conexión segura con el servidor de equipo...
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

  // Define Password Check Action
  window.unlockWithPassword = async function() {
    const input = document.getElementById('team-password-input');
    const btn = document.getElementById('btn-unlock');
    if (!input || !btn) return;

    const password = input.value.trim();
    if (!password) {
      alert("Por favor, introduce la contraseña.");
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="auth-spinner-mini"></span> Verificando...`;

    try {
      // Query the team_auth table to verify if the password matches the database
      const { data, error } = await supabaseClient
        .from('team_auth')
        .select('value')
        .eq('key', 'team_password')
        .single();

      if (error || !data) {
        showError("No se pudo leer la contraseña del servidor. Verifica la tabla team_auth.");
        return;
      }

      if (password === data.value) {
        // Cached in sessionStorage for browser session lifetime
        sessionStorage.setItem('team_auth_password', password);
        sessionStorage.setItem('team_auth_last_activity', Date.now().toString());
        unlockEditor();
      } else {
        btn.disabled = false;
        btn.innerHTML = "🔓 Desbloquear Suite";
        alert("Contraseña de equipo incorrecta. Inténtalo de nuevo.");
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = "🔓 Desbloquear Suite";
      alert("Error al verificar la contraseña.");
    }
  };

  window.logoutTeamSession = function() {
    sessionStorage.removeItem('team_auth_password');
    sessionStorage.removeItem('team_auth_last_activity');
    window.location.reload();
  };

  // Check if password already stored in session storage
  const cachedPassword = sessionStorage.getItem('team_auth_password');
  if (cachedPassword) {
    try {
      const { data, error } = await supabaseClient
        .from('team_auth')
        .select('value')
        .eq('key', 'team_password')
        .single();

      if (!error && data && cachedPassword === data.value) {
        // Auto-unlock silently (fully transparent)
        unlockEditor();
        return;
      }
    } catch (e) {
      console.log("Cached password validation failed, prompting user...");
    }
  }

  // If not authenticated or cached validation failed, show Password Input UI
  showPasswordInputUI();

  // UI State Modifiers
  function showPasswordInputUI() {
    const titleEl = document.getElementById('auth-title');
    const descEl = document.getElementById('auth-desc');
    const actionEl = document.getElementById('auth-action-area');

    if (titleEl) titleEl.innerText = "Acceso Restringido 🔒";
    if (descEl) descEl.innerText = "Esta suite de diapositivas es privada. Por favor, introduce la contraseña de equipo autorizada para desbloquear el editor.";
    
    if (actionEl) {
      actionEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
          <input type="password" id="team-password-input" class="auth-input-password" placeholder="Contraseña de equipo..." onkeydown="if(event.key === 'Enter') unlockWithPassword()">
          <button id="btn-unlock" class="auth-btn-unlock" onclick="unlockWithPassword()">
            🔓 Desbloquear Suite
          </button>
        </div>
      `;
      // Auto-focus input
      setTimeout(() => {
        const input = document.getElementById('team-password-input');
        if (input) input.focus();
      }, 100);
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

  function unlockEditor() {
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
        max-width: 400px;
        padding: 20px;
      }
      .auth-glow-sphere {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, rgba(139, 92, 246, 0.04) 50%, transparent 100%);
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
      .auth-input-password {
        width: 100%;
        padding: 12px 15px;
        border-radius: 10px;
        background: rgba(5, 7, 18, 0.6);
        border: 1px solid rgba(0, 242, 254, 0.25);
        color: #fff;
        font-size: 0.85rem;
        text-align: center;
        font-family: inherit;
        outline: none;
        transition: border-color 0.25s;
        box-sizing: border-box;
      }
      .auth-input-password:focus {
        border-color: #8b5cf6;
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
      }
      .auth-btn-unlock {
        width: 100%;
        padding: 12px 20px;
        border-radius: 10px;
        background: linear-gradient(135deg, #00f2fe, #8b5cf6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 8px 20px rgba(0, 242, 254, 0.2);
        transition: transform 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }
      .auth-btn-unlock:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px rgba(0, 242, 254, 0.35);
      }
      .auth-btn-unlock:active {
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
        box-sizing: border-box;
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

  // Start Idle Tracker
  setupIdleTracker();

  // --- 🛡️ Detección Global de Inactividad (30 Minutos) ---
  function setupIdleTracker() {
    // Interceptar interacciones del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (sessionStorage.getItem('team_auth_password')) {
          sessionStorage.setItem('team_auth_last_activity', Date.now().toString());
        }
      }, { capture: true, passive: true });
    });

    // Comprobador periódico cada 10 segundos
    setInterval(() => {
      if (!sessionStorage.getItem('team_auth_password')) return;

      const lastActivity = parseFloat(sessionStorage.getItem('team_auth_last_activity') || '0');
      if (!lastActivity) {
        sessionStorage.setItem('team_auth_last_activity', Date.now().toString());
        return;
      }

      if (Date.now() - lastActivity >= 30 * 60 * 1000) {
        sessionStorage.removeItem('team_auth_password');
        sessionStorage.removeItem('team_auth_last_activity');
        alert("Tu sesión ha expirado por inactividad de 30 minutos. Por favor, introduce la contraseña de nuevo.");
        window.location.reload();
      }
    }, 10000);
  }
});
