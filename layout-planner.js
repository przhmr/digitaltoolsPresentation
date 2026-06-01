/**
 * LayoutPlanner - Elite Slide Layout Sequence Scheduler
 * Incorporates a Constraint Satisfaction Problem (CSP) Backtracking Solver
 * with semantic tokenizing and visual rhythm alternation penalties.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LayoutPlanner = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Visual composition classification to enforce aesthetic rhythmic alternation
  const VISUAL_CATEGORIES = {
    cover: 'intro',
    agenda: 'intro',
    categories: 'grid',
    comparison_table: 'grid',
    split_flow: 'linear-split',
    split_road: 'linear-split',
    split_pipeline: 'linear-split',
    split_chart: 'data-split',
    split_network: 'graph-split',
    grid_conclusion: 'conclusion',
    conclusion: 'conclusion',
    quote: 'text',
    custom: 'canvas',
    farewell: 'outro'
  };

  /**
   * Translates a layout type to a professional, contextually-rich description
   */
  function getTopicDescription(layout) {
    switch(layout) {
      case 'categories':
        return "Conceptos principales, 3 pilares clave o características fundamentales del tema presentados en una grilla interactiva de tarjetas.";
      case 'split_flow':
        return "Flujo del proceso, fases de desarrollo o secuencia paso a paso (Fase 1, Fase 2, Fase 3) del tema.";
      case 'split_road':
        return "Hoja de ruta secuencial (roadmap), evolución histórica o hitos del desarrollo del tema con una hermosa línea de tiempo.";
      case 'split_network':
        return "Arquitectura de red, interconectividad de sistemas, topología técnica o relaciones entre componentes del tema.";
      case 'split_pipeline':
        return "Pipeline o canal de datos, flujo de entrada/salida (inputs a motor central a outputs) o embudo de procesamiento del tema.";
      case 'split_chart':
        return "Estadísticas clave, datos cuantitativos, porcentajes o métricas de rendimiento representados en un gráfico de barras CSS.";
      case 'comparison_table':
        return "Matriz comparativa, tabla de pros y contras, comparación de características o evaluación competitiva entre alternativas.";
      case 'grid_conclusion':
        return "Evaluación final, resumen estructurado en 3 tarjetas de conclusiones con un mapa de calor numérico en la fila inferior.";
      case 'conclusion':
        return "Recapitulacion de puntos clave, conclusiones principales en viñetas y métricas de impacto numérico de gran tamaño.";
      case 'quote':
        return "Cita inspiradora de alto impacto o declaración reflexiva/filosófica relacionada con el tema central de la presentación.";
      case 'custom':
        return "Lienzo de diseño libre para la integración de elementos personalizados y flexibles del tema.";
      default:
        return "Contenido complementario del tema de la presentación.";
    }
  }

  /**
   * Analyzes prompt keywords to compute semantic intensity scores for each structural layout type
   */
  function getSemanticScores(promptText) {
    const lowercasePrompt = (promptText || '').toLowerCase();
    
    const scores = {
      split_chart: 0,
      split_flow: 0,
      split_road: 0,
      split_network: 0,
      split_pipeline: 0,
      comparison_table: 0,
      categories: 0
    };

    const keywordMappings = {
      comparison_table: [
        "comparar", "diferencia", "versus", "vs", "ventajas", "desventajas", "pros", "contras", "matriz", 
        "comparativo", "diferentes", "opciones", "competencia", "comparacion", "comparación", "diferenciar", 
        "contrastar", "ventaja", "desventaja", "contraste", "alternativas", "comparar"
      ],
      split_chart: [
        "datos", "números", "numeros", "porcentaje", "estadística", "estadistica", "kpi", "métrica", "metrica", 
        "gráfico", "grafico", "crecimiento", "ventas", "finanzas", "producción", "produccion", "ingresos", 
        "cifras", "tasa", "pib", "porcentajes", "metricas", "métricas", "estadisticas", "estadísticas", 
        "rentabilidad", "financiero", "mercado", "economía", "economia", "precio", "precios", "valor", 
        "valores", "estimación", "estimacion", "estadistica", "analisis de datos"
      ],
      split_road: [
        "ruta", "camino", "hoja de ruta", "roadmap", "hitos", "historia", "evolución", "evolucion", "desarrollo", 
        "futuro", "trayectoria", "pasos", "fases", "etapas", "cronología", "cronologia", "línea de tiempo", 
        "linea de tiempo", "histórico", "historico", "siguientes pasos", "plan", "planificación", "planificacion", 
        "proyección", "proyeccion", "meta", "metas", "objetivos", "avances", "cronograma"
      ],
      split_flow: [
        "proceso", "flujo", "fase", "paso", "etapa", "secuencia", "ciclo", "metodología", "metodologia", 
        "funcionamiento", "cómo funciona", "como funciona", "operación", "operaciones", "flujograma", 
        "paso a paso", "ejecución", "ejecucion", "procedimiento", "procedimientos", "flujo de trabajo", 
        "workflow", "algoritmo", "implementación", "implementacion"
      ],
      split_network: [
        "red", "conexión", "conexion", "sistemas", "conectividad", "internet", "servidor", "cliente", 
        "arquitectura", "nube", "cloud", "topología", "topologia", "dispositivos", "comunicación", 
        "comunicaciones", "infraestructura", "nodos", "interconexión", "interconexion", "redes", 
        "servidores", "clientes", "base de datos", "db", "tecnología", "tecnologia", "api", "apis"
      ],
      split_pipeline: [
        "pipeline", "tubería", "tuberia", "etl", "procesamiento", "entrada", "salida", "inputs", "outputs", 
        "flujo de datos", "ingesta", "transformación", "transformacion", "canal", "embudo", "embudo de ventas", 
        "funnel", "orígenes", "destinos", "datos", "stream", "streaming", "procesar", "filtrado"
      ],
      categories: [
        "conceptos", "pilares", "características", "caracteristicas", "propiedades", "beneficios", "aspectos", 
        "categorías", "categorias", "elementos", "ventajas", "desventajas", "bases", "fundamentos", "claves", 
        "fundamento", "pilar", "clave", "introducción", "introduccion", "teoría", "teoria", "definiciones"
      ]
    };

    for (const [layout, keywords] of Object.entries(keywordMappings)) {
      for (const word of keywords) {
        // Semantic boundary checking (regex) to prevent false positives in substrings
        const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('\\b' + escapedWord + '\\b', 'gi');
        const matches = lowercasePrompt.match(regex);
        if (matches) {
          scores[layout] += matches.length * 20; // High score for direct word boundaries
        } else if (lowercasePrompt.includes(word)) {
          scores[layout] += 6; // Standard score for substrings
        }
      }
    }

    return scores;
  }

  /**
   * Backtracking Search CSP Solver with dynamic candidate heuristic sorting (MRV style)
   */
  function findOptimalSequence(contentCount, semanticScores) {
    const CONTENT_LAYOUTS = [
      'split_chart',
      'split_flow',
      'split_road',
      'split_network',
      'split_pipeline',
      'comparison_table',
      'categories'
    ];

    let bestSequence = [];
    let bestFitness = -Infinity;

    /**
     * Evaluates the fitness score of a candidate slide layout sequence
     */
    function evaluateSequence(seq) {
      let fitness = 0;
      const reuseCounts = {};

      for (let i = 0; i < seq.length; i++) {
        const layout = seq[i];
        
        // 1. Add semantic match intensity score
        fitness += (semanticScores[layout] || 0);

        // 2. Reuse Penalty (Enforces unique layouts across the whole presentation)
        reuseCounts[layout] = (reuseCounts[layout] || 0) + 1;
        if (reuseCounts[layout] > 1) {
          fitness -= (reuseCounts[layout] - 1) * 150; // Heavy penalty for reusing templates
        }

        // 3. Adjacency / Monotonía Penalty
        if (i > 0) {
          const prevLayout = seq[i - 1];
          if (layout === prevLayout) {
            return -Infinity; // HARD CONSTRAINT: Consecutive exact duplicate layout is prohibited
          }
          
          // 4. Structural Category Alternation (Alternate split screens and card grids)
          const cat = VISUAL_CATEGORIES[layout];
          const prevCat = VISUAL_CATEGORIES[prevLayout];
          if (cat === prevCat) {
            fitness -= 60; // SOFT CONSTRAINT PENALTY: Penalize consecutive structural categories
          }
        }
      }

      return fitness;
    }

    /**
     * Recursive search backtracking engine
     */
    function search(currentSeq) {
      if (currentSeq.length === contentCount) {
        const score = evaluateSequence(currentSeq);
        if (score > bestFitness) {
          bestFitness = score;
          bestSequence = [...currentSeq];
        }
        return;
      }

      // Candidate sorting heuristic: prioritize layouts with high semantic affinity and no previous usage
      const candidates = [...CONTENT_LAYOUTS].sort((a, b) => {
        const scoreA = semanticScores[a] - (currentSeq.includes(a) ? 120 : 0);
        const scoreB = semanticScores[b] - (currentSeq.includes(b) ? 120 : 0);
        return scoreB - scoreA;
      });

      for (const layout of candidates) {
        // Fast early pruning: prune branches that violate immediate adjacency
        if (currentSeq.length > 0 && currentSeq[currentSeq.length - 1] === layout) {
          continue;
        }
        
        currentSeq.push(layout);
        search(currentSeq);
        currentSeq.pop();
      }
    }

    search([]);
    return bestSequence;
  }

  /**
   * Semantically schedules a unified theme and slide-specific style variations
   * @param {string} promptText - User presentation topic
   * @param {Array} slidesSequence - Visual slide sequence planned
   * @returns {Array} Sequence of slides enriched with semantic 'style' JSON blocks
   */
  function planPresentationThemeAndStyles(promptText, slidesSequence) {
    const lowercasePrompt = (promptText || '').toLowerCase();
    
    // 1. Determine theme family based on semantic analysis of the prompt
    let themeFamily = 'cyberpunk'; // default
    
    const themeKeywords = {
      hydrocarbon: [
        "petroleo", "petróleo", "oil", "crudo", "carbon", "carbón", "gas", "energía", "energia", 
        "venezuela", "extracción", "extraccion", "geología", "geologia", "química", "quimica", 
        "industria", "ingeniería", "ingenieria", "minería", "mineria", "reservas"
      ],
      sunset: [
        "diseño", "diseno", "arte", "música", "musica", "marketing", "publicidad", "ventas", 
        "presentación", "presentacion", "creativo", "ideas", "innovación", "innovacion", 
        "videojuegos", "gaming", "película", "cine", "fotografía"
      ],
      corporate: [
        "negocios", "empresa", "corporativo", "finanzas", "banco", "economía", "economia", 
        "inversión", "inversion", "administración", "administracion", "gerencia", "estrategia", 
        "educación", "clase", "curso", "academia", "universidad", "salud", "medicina"
      ]
    };
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      for (const word of keywords) {
        if (lowercasePrompt.includes(word)) {
          themeFamily = theme;
          break;
        }
      }
      if (themeFamily !== 'cyberpunk') break;
    }
    
    // 2. Define highly varied premium Google Font pairings (12 sets)
    const PREMIUM_FONT_PAIRINGS = [
      { title: "Space Grotesk", body: "Inter", titleWeight: "900", spacing: "-0.03em" },
      { title: "Outfit", body: "Inter", titleWeight: "800", spacing: "-0.01em" },
      { title: "Syne", body: "Sora", titleWeight: "800", spacing: "-0.02em" },
      { title: "Cabinet Grotesk", body: "Plus Jakarta Sans", titleWeight: "900", spacing: "-0.03em" },
      { title: "Sora", body: "Inter", titleWeight: "800", spacing: "-0.02em" },
      { title: "Clash Display", body: "Plus Jakarta Sans", titleWeight: "900", spacing: "-0.02em" },
      { title: "Playfair Display", body: "Manrope", titleWeight: "900", spacing: "0em" },
      { title: "Cinzel", body: "Inter", titleWeight: "700", spacing: "0.05em" },
      { title: "Montserrat", body: "Inter", titleWeight: "900", spacing: "-0.02em" },
      { title: "Plus Jakarta Sans", body: "Inter", titleWeight: "800", spacing: "-0.02em" },
      { title: "Fraunces", body: "Manrope", titleWeight: "900", spacing: "-0.01em" },
      { title: "Sora", body: "Space Mono", titleWeight: "800", spacing: "-0.01em" }
    ];
    
    // Pick a random pairing for this generation to guarantee typographic diversity!
    const selectedPair = PREMIUM_FONT_PAIRINGS[Math.floor(Math.random() * PREMIUM_FONT_PAIRINGS.length)];
    
    const isSerif = (font) => ["Playfair Display", "Cinzel", "Fraunces", "Cormorant Garamond"].includes(font);
    
    const titleFontFamily = isSerif(selectedPair.title) ? `'${selectedPair.title}', serif` : (selectedPair.title === "Space Mono" ? `'Space Mono', monospace` : `'${selectedPair.title}', sans-serif`);
    const bodyFontFamily = isSerif(selectedPair.body) ? `'${selectedPair.body}', serif` : (selectedPair.body === "Space Mono" ? `'Space Mono', monospace` : `'${selectedPair.body}', sans-serif`);
    
    // 3. Define visual color matrices for procedural synthesis
    const COLOR_MATRICES = {
      cyberpunk: {
        primary: ["#00f2fe", "#06b6d4", "#0ea5e9", "#38bdf8"],
        secondary: ["#ff007f", "#d946ef", "#ec4899", "#f43f5e"],
        tertiary: ["#8b5cf6", "#6366f1", "#a855f7", "#818cf8"],
        bases: ["#030712", "#050508", "#080710", "#05020a"]
      },
      hydrocarbon: {
        primary: ["#eab308", "#f59e0b", "#d97706", "#fbbf24"],
        secondary: ["#10b981", "#059669", "#14b8a6", "#34d399"],
        tertiary: ["#f97316", "#d97706", "#b45309", "#f59e0b"],
        bases: ["#020617", "#050608", "#0b0c10", "#080b0c"]
      },
      sunset: {
        primary: ["#f97316", "#ea580c", "#f97316", "#fb923c"],
        secondary: ["#ef4444", "#dc2626", "#f43f5e", "#fb7185"],
        tertiary: ["#ec4899", "#db2777", "#f472b6", "#ec4899"],
        bases: ["#030712", "#0a0307", "#0d0408", "#070205"]
      },
      corporate: {
        primary: ["#06b6d4", "#0ea5e9", "#0891b2", "#38bdf8"],
        secondary: ["#3b82f6", "#2563eb", "#1d4ed8", "#60a5fa"],
        tertiary: ["#10b981", "#34d399", "#059669", "#10b981"],
        bases: ["#020617", "#050b14", "#020306", "#040810"]
      }
    };
    
    const activePalette = COLOR_MATRICES[themeFamily];
    
    // Choose dynamic specific shades for this generation
    const activePrimary = activePalette.primary[Math.floor(Math.random() * activePalette.primary.length)];
    const activeSecondary = activePalette.secondary[Math.floor(Math.random() * activePalette.secondary.length)];
    const activeTertiary = activePalette.tertiary[Math.floor(Math.random() * activePalette.tertiary.length)];
    const baseSpaceColor = activePalette.bases[Math.floor(Math.random() * activePalette.bases.length)];
    
    // Curate unique transitions per slide
    const TRANSITIONS = [
      "slide", "fade", "convex", "concave", "zoom",
      "fade-in slide-out", "slide-in fade-out", "zoom-in fade-out", "convex-in fade-out"
    ];
    const TRANSITION_SPEEDS = ["default", "fast", "slow"];
    
    // Helper to convert hex to RGB for alpha transparency in styles
    function hexToRgb(hex) {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 242, 254";
    }
    
    const primaryRgb = hexToRgb(activePrimary);
    const secondaryRgb = hexToRgb(activeSecondary);
    const tertiaryRgb = hexToRgb(activeTertiary);
    
    // 4. Programmatically generate visual variety parameters per slide index
    const styledSlides = slidesSequence.map((slide, idx) => {
      const isFirst = (idx === 0);
      const isLast = (idx === slidesSequence.length - 1);
      
      // Randomize slide transition and speed individually
      const slideTransition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
      const slideSpeed = TRANSITION_SPEEDS[Math.floor(Math.random() * TRANSITION_SPEEDS.length)];
      
      // Alternate card alignment dynamically
      let align = 'left';
      if (isFirst || isLast || slide.type === 'quote') {
        align = 'center';
      } else {
        // 3-way layout alternation (Left-aligned, Centered, Offset Left)
        const layouts = ['left', 'center', 'left'];
        align = layouts[idx % layouts.length];
      }
      
      // Select beautiful title gradients procedurally
      let titleStyle = `font-family: ${titleFontFamily}; font-weight: ${selectedPair.titleWeight}; letter-spacing: ${selectedPair.spacing};`;
      
      if (isFirst) {
        titleStyle += ` font-size: 2.15em !important; background: linear-gradient(135deg, #ffffff 15%, ${activePrimary} 65%, ${activeSecondary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 35px rgba(0,0,0,0.6);`;
      } else if (isLast) {
        titleStyle += ` font-size: 1.95em !important; background: linear-gradient(135deg, #ffffff 25%, ${activeSecondary} 70%, ${activeTertiary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none !important;`;
      } else {
        // Slide title variations: rotate gradients or introduce pure clean primary accents
        if (idx % 2 === 0) {
          titleStyle += ` font-size: 1.35em !important; background: linear-gradient(135deg, #ffffff 30%, ${activePrimary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none !important; margin-bottom: 18px;`;
        } else {
          titleStyle += ` font-size: 1.35em !important; background: linear-gradient(135deg, #ffffff 20%, ${activeSecondary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none !important; margin-bottom: 18px;`;
        }
      }
      
      let subtitleStyle = `font-family: ${bodyFontFamily}; font-size: 0.62em; line-height: 1.45; color: #94a3b8;`;
      if (isFirst) {
        subtitleStyle = `font-family: ${bodyFontFamily}; font-size: 0.95em; line-height: 1.55; color: #cbd5e1; font-weight: 400;`;
      }
      
      // Asymmetric card borders and premium neon glass styling
      const r1 = Math.floor(Math.random() * 15) + 10;
      const r2 = Math.floor(Math.random() * 20) + 10;
      const r3 = Math.floor(Math.random() * 15) + 10;
      const r4 = Math.floor(Math.random() * 25) + 10;
      const cardBorderRadius = `${r1}px ${r2}px ${r3}px ${r4}px`;
      
      // Choose neon border glowing weight
      let cardBorder = `rgba(255, 255, 255, 0.08)`;
      let glowColor = activePrimary;
      if (idx % 3 === 0) {
        cardBorder = `rgba(${primaryRgb}, 0.22)`;
        glowColor = activePrimary;
      } else if (idx % 3 === 1) {
        cardBorder = `rgba(${tertiaryRgb}, 0.22)`;
        glowColor = activeTertiary;
      } else {
        cardBorder = `rgba(${secondaryRgb}, 0.22)`;
        glowColor = activeSecondary;
      }
      
      // Procedural glass backdrop parameters
      const blurIntensity = Math.floor(Math.random() * 14) + 14; // 14px to 28px
      const cardOpacity = (0.55 + Math.random() * 0.12).toFixed(2); // 0.55 to 0.67
      const neonGlowShadow = `box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.45), inset 0 0 16px rgba(${hexToRgb(glowColor)}, 0.1), 0 4px 18px rgba(${hexToRgb(glowColor)}, 0.05);`;
      const cardStyleOverride = `border-radius: ${cardBorderRadius}; backdrop-filter: blur(${blurIntensity}px); background: rgba(10, 15, 30, ${cardOpacity}); ${neonGlowShadow}`;
      
      // Formulate unique procedurally generated background gradients per slide index to shift as we navigate
      const shiftPercent = Math.round((idx / slidesSequence.length) * 15) + 5;
      const angle = Math.floor(Math.random() * 90) + 100; // 100deg to 190deg
      
      let slideBackground = baseSpaceColor;
      if (themeFamily === 'cyberpunk') {
        slideBackground = `linear-gradient(${angle}deg, ${baseSpaceColor} 0%, #0c081${shiftPercent.toString(16)} ${40 + shiftPercent}%, #030305 100%)`;
      } else if (themeFamily === 'hydrocarbon') {
        slideBackground = `linear-gradient(${angle}deg, ${baseSpaceColor} 0%, #0d1${shiftPercent.toString(16)}0a ${45 + shiftPercent}%, #020202 100%)`;
      } else if (themeFamily === 'sunset') {
        slideBackground = `linear-gradient(${angle}deg, ${baseSpaceColor} 0%, #1${shiftPercent.toString(16)}090f ${50 + shiftPercent}%, #020104 100%)`;
      } else {
        slideBackground = `linear-gradient(${angle}deg, ${baseSpaceColor} 0%, #051${shiftPercent.toString(16)}14 ${40 + shiftPercent}%, #020306 100%)`;
      }
      
      // Assign subtle random loop micro-animations to first, last or split card layouts
      let animationName = "";
      if (idx % 4 === 0 && !isFirst && !isLast) {
        const animations = ["float", "pulse", "glow", "shimmer"];
        animationName = animations[idx % animations.length];
      }
      
      // Attach style configuration object
      const styledCopy = {
        ...slide,
        transition: slideTransition,
        transition_speed: slideSpeed,
        style: {
          theme_name: themeFamily,
          accent_color: activePrimary,
          accent_color_secondary: activeSecondary,
          accent_color_tertiary: activeTertiary,
          background_gradient: slideBackground,
          title_style: titleStyle,
          subtitle_style: subtitleStyle,
          card_border: cardBorder,
          card_padding: isFirst || isLast ? "42px" : "26px",
          card_style: cardStyleOverride,
          layout_align: align,
          title_font: titleFontFamily,
          body_font: bodyFontFamily,
          title_font_name: selectedPair.title,
          body_font_name: selectedPair.body,
          card_animation: animationName,
          transition_speed: slideSpeed
        }
      };
      
      return styledCopy;
    });
    
    return styledSlides;
  }

  /**
   * Plans the exact visual sequence of layouts and semantic styles for a presentation
   * @param {string} promptText - User presentation topic
   * @param {number} slideCount - Number of requested slides
   * @returns {Array<{type: string, topic: string, style: Object}>} Sequence of planned slide layout objects
   */
  function planPresentationLayouts(promptText, slideCount) {
    const lowercasePrompt = (promptText || '').toLowerCase();
    const semanticScores = getSemanticScores(promptText);

    // Dynamic semantic mapping for the synthesis/climax slide (Slide N-1)
    let synthesisType = "conclusion"; // default
    if (
      lowercasePrompt.includes("frase") || 
      lowercasePrompt.includes("cita") || 
      lowercasePrompt.includes("inspirational") || 
      lowercasePrompt.includes("inspirar") || 
      lowercasePrompt.includes("reflexion") || 
      lowercasePrompt.includes("reflexión") || 
      lowercasePrompt.includes("filosofía") || 
      lowercasePrompt.includes("filosofia")
    ) {
      synthesisType = "quote";
    } else if (
      lowercasePrompt.includes("evaluacion") || 
      lowercasePrompt.includes("evaluación") || 
      lowercasePrompt.includes("desempeño") || 
      lowercasePrompt.includes("desempeno") || 
      lowercasePrompt.includes("calificación") || 
      lowercasePrompt.includes("calificacion") || 
      lowercasePrompt.includes("resumen") || 
      lowercasePrompt.includes("resultado") || 
      lowercasePrompt.includes("conclusiones") ||
      lowercasePrompt.includes("logros") ||
      lowercasePrompt.includes("kpis")
    ) {
      synthesisType = "grid_conclusion";
    }

    let plannedSequence = [];

    // 1. Boundary slide count structural outlines
    if (slideCount <= 1) {
      plannedSequence = [{ type: "cover", topic: "Portada de la presentación con el título principal." }];
    } else if (slideCount === 2) {
      plannedSequence = [
        { type: "cover", topic: "Portada de la presentación con el título principal." },
        { type: "farewell", topic: "Cierre y despedida final de la presentación." }
      ];
    } else if (slideCount === 3) {
      const bestContent = Object.keys(semanticScores).sort((a, b) => semanticScores[b] - semanticScores[a])[0] || 'categories';
      plannedSequence = [
        { type: "cover", topic: "Portada de la presentación con título principal." },
        { type: bestContent, topic: getTopicDescription(bestContent) },
        { type: "farewell", topic: "Cierre y despedida final de la presentación." }
      ];
    } else if (slideCount === 4) {
      const bestContent = Object.keys(semanticScores).sort((a, b) => semanticScores[b] - semanticScores[a])[0] || 'categories';
      plannedSequence = [
        { type: "cover", topic: "Portada de la presentación con título." },
        { type: "agenda", topic: "Agenda y hoja de ruta inicial de las secciones." },
        { type: bestContent, topic: getTopicDescription(bestContent) },
        { type: "farewell", topic: "Cierre y despedida final de la presentación." }
      ];
    } else {
      // 2. High-level planning for slideCount >= 5 (Cover -> Agenda -> Semantic CSP Content Slides -> Synthesis -> Farewell)
      const contentCount = slideCount - 4;
      const contentSequence = findOptimalSequence(contentCount, semanticScores);

      plannedSequence.push({ type: "cover", topic: "Portada de la presentación con el título principal, subtítulo y autores." });
      plannedSequence.push({ type: "agenda", topic: "Agenda y hoja de ruta inicial de las secciones de la presentación." });

      contentSequence.forEach(layout => {
        plannedSequence.push({ type: layout, topic: getTopicDescription(layout) });
      });

      plannedSequence.push({ type: synthesisType, topic: getTopicDescription(synthesisType) });
      plannedSequence.push({ type: "farewell", topic: "Cierre y despedida final con agradecimiento y contacto." });
    }

    // Pipe the planned sequence through the semantic styling engine
    return planPresentationThemeAndStyles(promptText, plannedSequence);
  }

  // Exports
  return {
    VISUAL_CATEGORIES,
    getTopicDescription,
    getSemanticScores,
    planPresentationThemeAndStyles,
    planPresentationLayouts
  };
}));
