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
    
    // 1. Determine theme based on semantic analysis of the prompt
    let themeName = 'cyberpunk'; // default
    
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
          themeName = theme;
          break;
        }
      }
      if (themeName !== 'cyberpunk') break;
    }
    
    // 2. Define visual tokens for each theme preset
    const THEMES = {
      cyberpunk: {
        primary: "#00f2fe",      // Cyan
        secondary: "#ff007f",    // Pink/Magenta
        tertiary: "#8b5cf6",     // Purple
        background: "linear-gradient(135deg, #030712 0%, #080710 50%, #030305 100%)",
        titleFont: "'Space Grotesk', sans-serif",
        bodyFont: "'Inter', sans-serif"
      },
      hydrocarbon: {
        primary: "#eab308",      // Liquid Gold
        secondary: "#10b981",    // Green/Eco
        tertiary: "#f59e0b",     // Amber
        background: "linear-gradient(135deg, #020617 0%, #0a0b06 60%, #020202 100%)",
        titleFont: "'Outfit', sans-serif",
        bodyFont: "'Space Mono', monospace"
      },
      sunset: {
        primary: "#f97316",      // Orange
        secondary: "#ef4444",    // Red
        tertiary: "#ec4899",     // Hot Pink
        background: "linear-gradient(135deg, #030712 0%, #15090f 50%, #020104 100%)",
        titleFont: "'Syne', sans-serif",
        bodyFont: "'Inter', sans-serif"
      },
      corporate: {
        primary: "#06b6d4",      // Cyan Teal
        secondary: "#3b82f6",    // Royal Blue
        tertiary: "#10b981",     // Mint Green
        background: "linear-gradient(135deg, #020617 0%, #050b14 50%, #020306 100%)",
        titleFont: "'Cabinet Grotesk', sans-serif",
        bodyFont: "'Inter', sans-serif"
      }
    };
    
    const activeTheme = THEMES[themeName];
    
    // 3. Programmatically generate visual variety parameters per slide index
    const styledSlides = slidesSequence.map((slide, idx) => {
      const isFirst = (idx === 0);
      const isLast = (idx === slidesSequence.length - 1);
      
      // Alternate card text alignment (visual consistency yet unique layouts)
      let align = 'left';
      if (isFirst || isLast || slide.type === 'quote') {
        align = 'center';
      } else if (idx % 2 === 0) {
        align = 'left';
      } else {
        // Subtle offset variations for alternations
        align = 'left';
      }
      
      // Let's create beautiful title and subtitle inline CSS strings!
      let titleStyle = `font-family: ${activeTheme.titleFont}; font-weight: 900; letter-spacing: -0.02em;`;
      
      if (isFirst) {
        titleStyle += ` font-size: 2.1em !important; background: linear-gradient(135deg, #ffffff 20%, ${activeTheme.primary} 70%, ${activeTheme.secondary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(0,0,0,0.5);`;
      } else if (isLast) {
        titleStyle += ` font-size: 1.9em !important; background: linear-gradient(135deg, #ffffff 30%, ${activeTheme.secondary} 70%, ${activeTheme.tertiary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none !important;`;
      } else {
        titleStyle += ` font-size: 1.3em !important; background: linear-gradient(135deg, #ffffff 40%, ${activeTheme.primary} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none !important; margin-bottom: 15px;`;
      }
      
      let subtitleStyle = `font-family: ${activeTheme.bodyFont}; font-size: 0.62em; line-height: 1.45; color: #94a3b8;`;
      if (isFirst) {
        subtitleStyle = `font-family: ${activeTheme.bodyFont}; font-size: 1.0em; line-height: 1.55; color: #cbd5e1; font-weight: 400;`;
      }
      
      // Assign custom card border glowing color based on index to distribute visual weights
      let cardBorder = `rgba(255, 255, 255, 0.08)`;
      if (isFirst) {
        cardBorder = `rgba(255, 255, 255, 0.12)`;
      } else if (idx % 3 === 0) {
        cardBorder = `rgba(0, 242, 254, 0.22)`;
      } else if (idx % 3 === 1) {
        cardBorder = `rgba(139, 92, 246, 0.22)`;
      } else {
        cardBorder = `rgba(255, 0, 127, 0.22)`;
      }
      
      // Formulate unique slide-specific background gradients to allow visual transition dynamics
      let slideBackground = activeTheme.background;
      if (idx > 0 && idx < slidesSequence.length - 1) {
        // Apply slight background color shift variations to transition along the presentation timeline
        const offset = Math.round((idx / slidesSequence.length) * 15);
        if (themeName === 'cyberpunk') {
          slideBackground = `linear-gradient(135deg, #030712 0%, #0c081${offset.toString(16)} 50%, #030305 100%)`;
        } else if (themeName === 'hydrocarbon') {
          slideBackground = `linear-gradient(135deg, #020617 0%, #0d1${offset.toString(16)}0a 60%, #020202 100%)`;
        } else if (themeName === 'sunset') {
          slideBackground = `linear-gradient(135deg, #030712 0%, #1${offset.toString(16)}090f 50%, #020104 100%)`;
        } else {
          slideBackground = `linear-gradient(135deg, #020617 0%, #051${offset.toString(16)}14 50%, #020306 100%)`;
        }
      }
      
      // Attach style configuration object
      const styledCopy = {
        ...slide,
        style: {
          theme_name: themeName,
          accent_color: activeTheme.primary,
          accent_color_secondary: activeTheme.secondary,
          accent_color_tertiary: activeTheme.tertiary,
          background_gradient: slideBackground,
          title_style: titleStyle,
          subtitle_style: subtitleStyle,
          card_border: cardBorder,
          card_padding: isFirst || isLast ? "40px" : "25px",
          layout_align: align,
          title_font: activeTheme.titleFont,
          body_font: activeTheme.bodyFont
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
