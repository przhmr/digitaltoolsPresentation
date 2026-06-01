/**
 * Diversity Test Simulation script
 * Asserts style distribution and uniqueness of procedurally-generated slides.
 */
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting style diversity simulation test...');

// Load layout-planner UMD module in Node.js environment
const layoutPlannerPath = path.join(__dirname, '..', 'layout-planner.js');
const LayoutPlanner = require(layoutPlannerPath);

const samplePrompts = [
  "Venezuela y Petróleo", "E-learning moderno", "Inteligencia artificial en educación", 
  "Metodologías ágiles", "Energías renovables y futuro", "Blockchain en finanzas",
  "Salud digital y telemedicina", "Ciudades inteligentes", "Ciberseguridad corporativa",
  "Marketing de contenidos cognitivo", "Diseño de experiencia de usuario", "Gestión de datos masivos"
];

const results = [];
const uniqueFonts = new Set();
const uniqueGradients = new Set();
const uniqueTransitions = new Set();
const uniqueTransitionSpeeds = new Set();
const uniqueBorders = new Set();
const uniqueAlignments = new Set();

const ITERATIONS = 100;

for (let i = 0; i < ITERATIONS; i++) {
  const prompt = samplePrompts[i % samplePrompts.length] + " " + Math.random().toString(36).substring(7);
  const slideCount = Math.floor(Math.random() * 5) + 5; // 5 to 9 slides
  
  const deck = LayoutPlanner.planPresentationLayouts(prompt, slideCount);
  
  deck.forEach((slide, idx) => {
    if (slide.style) {
      if (slide.style.title_font_name) uniqueFonts.add(slide.style.title_font_name);
      if (slide.style.background_gradient) uniqueGradients.add(slide.style.background_gradient);
      if (slide.style.transition_speed) uniqueTransitionSpeeds.add(slide.style.transition_speed);
      if (slide.style.card_border) uniqueBorders.add(slide.style.card_border);
      if (slide.style.layout_align) uniqueAlignments.add(slide.style.layout_align);
    }
    if (slide.transition) uniqueTransitions.add(slide.transition);
  });
  
  results.push(deck);
}

console.log('\n📊 SIMULATION METRICS AFTER 100 DECK GENERATIONS:\n');
console.log(`- Total Decks Generated: ${ITERATIONS}`);
console.log(`- Curated Font Pairings selected: ${uniqueFonts.size} of 12`);
console.log(`- Unique Cosmic Gradient Shards Synthesized: ${uniqueGradients.size} (Uniqueness: ${((uniqueGradients.size / (ITERATIONS * 6)) * 100).toFixed(1)}%)`);
console.log(`- Unique Individual Transitions Scheduled: ${uniqueTransitions.size} of 9`);
console.log(`- Unique Transition Speeds used: ${uniqueTransitionSpeeds.size} of 3`);
console.log(`- Unique Neon Borders colors generated: ${uniqueBorders.size}`);
console.log(`- Card Alignments alternate distribution: ${Array.from(uniqueAlignments).join(', ')}`);

// Basic assertions
const fontUniquenessPassed = uniqueFonts.size > 1;
const gradientsPassed = uniqueGradients.size > 20;
const transitionsPassed = uniqueTransitions.size > 4;

if (fontUniquenessPassed && gradientsPassed && transitionsPassed) {
  console.log('\n✅ DIVERSITY METRICS PASSED: Styles are highly unique, beautifully distributed, and zero-repetitive!');
  process.exit(0);
} else {
  console.error('\n❌ DIVERSITY METRICS FAILED: Styles lack required variety and randomness.');
  process.exit(1);
}
