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
   * Plans the exact visual sequence of layouts for a presentation
   * @param {string} promptText - User presentation topic
   * @param {number} slideCount - Number of requested slides
   * @returns {Array<{type: string, topic: string}>} Sequence of planned slide layout objects
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

    // 1. Boundary slide count structural outlines
    if (slideCount <= 1) {
      return [{ type: "cover", topic: "Portada de la presentación." }];
    } else if (slideCount === 2) {
      return [
        { type: "cover", topic: "Portada de la presentación con el título principal." },
        { type: "farewell", topic: "Cierre y despedida final de la presentación." }
      ];
    } else if (slideCount === 3) {
      const bestContent = Object.keys(semanticScores).sort((a, b) => semanticScores[b] - semanticScores[a])[0] || 'categories';
      return [
        { type: "cover", topic: "Portada de la presentación con título principal." },
        { type: bestContent, topic: getTopicDescription(bestContent) },
        { type: "farewell", topic: "Cierre y despedida final de la presentación." }
      ];
    } else if (slideCount === 4) {
      const bestContent = Object.keys(semanticScores).sort((a, b) => semanticScores[b] - semanticScores[a])[0] || 'categories';
      return [
        { type: "cover", topic: "Portada de la presentación con título." },
        { type: "agenda", topic: "Agenda y hoja de ruta inicial de las secciones." },
        { type: bestContent, topic: getTopicDescription(bestContent) },
        { type: "farewell", topic: "Cierre y despedida final de la presentación." }
      ];
    }

    // 2. High-level planning for slideCount >= 5 (Cover -> Agenda -> Semantic CSP Content Slides -> Synthesis -> Farewell)
    const contentCount = slideCount - 4;
    const contentSequence = findOptimalSequence(contentCount, semanticScores);

    const finalSequence = [];
    finalSequence.push({ type: "cover", topic: "Portada de la presentación con el título principal, subtítulo y autores." });
    finalSequence.push({ type: "agenda", topic: "Agenda y hoja de ruta inicial de las secciones de la presentación." });

    contentSequence.forEach(layout => {
      finalSequence.push({ type: layout, topic: getTopicDescription(layout) });
    });

    finalSequence.push({ type: synthesisType, topic: getTopicDescription(synthesisType) });
    finalSequence.push({ type: "farewell", topic: "Cierre y despedida final con agradecimiento y contacto." });

    return finalSequence;
  }

  // Exports
  return {
    VISUAL_CATEGORIES,
    getTopicDescription,
    getSemanticScores,
    planPresentationLayouts
  };
}));
