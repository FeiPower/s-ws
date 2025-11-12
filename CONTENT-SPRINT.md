## Concepto de Experiencia: Growth Spiral

Experiencia interactiva inmersiva donde el usuario navega a través de la Espiral de Fibonacci, descubriendo cómo la metodología se traduce en crecimiento progresivo.

- Nivel 0 (Núcleo): Principios y marca central
- Nivel 1 (Azul): Discovery — Investigación
- Nivel 2 (Verde): Strategy — Arquitectura
- Nivel 3 (Naranja): Execution — Construcción
- Nivel 4 (Púrpura): Scale — Crecimiento
- Nivel 5+ (Infinito): Feedback loops y mejora continua

---

## Arquitectura Visual

**Hero (Pantalla principal):**
- Canvas full-screen con la espiral completa
- 4 espirales concéntricas por fase (Azul, Verde, Naranja, Púrpura)
- Nodos pulsantes (agentes) y líneas de feedback (opcional)
- Overlay de instrucciones: “Scroll to zoom · Drag to explore · Space for menu”
- Indicador de foco (gradiente radial + anillo pulsante)

**Interacción por nivel de zoom:**
- < 1.5x: Vista general de fases y componentes
- 1.5x – φ: Discovery en foco, tiles revelan info
- φ – φ²: Strategy en foco, descripciones completas
- φ² – φ³: Execution en foco, acceso a documentación
- > φ³: Scale dominante, métricas y casos

**Estados de tiles (16 componentes):**
- Reposo: 30% opacidad, escala 0.8x
- Aproximación: 60% opacidad, borde por fase
- Foco: 100% opacidad, escala 1.0x, glow
- Click: 1.05x, abre modal con detalle

---

## Menú Radial

Acceso con Space, M o click prolongado. Acciones:
- Home (reset)
- Sections (navegar fases)
- Search (buscar contenido)
- Contact (formulario)

---

## Modales

- Modal de componente: Metodología, herramientas, artefactos
- Modal de contacto: Validación, selección de tipo de proyecto
- Glassmorphism, focus trap, cierre con Escape

---

## Secciones del Sitio

- Primary Experience (/): Espiral interactiva
- Linear Fallback (/linear): Navegación tradicional para SEO/a11y
- Case Studies (/cases): Casos por tipo de proyecto
- Methodology (/methodology): Matemática, arquitectura, principios
- Team (/team): Agentes especializados
- Resources (/resources): Frameworks, OKRs, plantillas
- Blog (/blog): Artículos y perspectivas
- Contact (/contact): Formularios y newsletter

---

## Diseño Visual

**Paleta:**
- Fondo: #0a0a0a
- Texto: #f5f5f5
- Acento: #fbbf24
- Fases: Azul #0b3a53; Verde #1e5631; Naranja #b45309; Púrpura #5a189a

**Tipografía:**
- Inter 700 (headlines), 400 (body), 600 (CTAs)

**Componentes UI:**
- Botones (primary/secondary/ghost)
- Cards con blur y hover glow
- Formularios con validación y feedback visual

---

## Animaciones y Microinteracciones

**Canvas:**
- Rotación suave de la espiral
- Nodos pulsantes por fase
- Feedback loops con opacidad
- Focus overlay suave

**UI:**
- Tiles fade-in on focus (≈400ms)
- Modales (backdrop + scale)
- Botones (hover scale/glow)
- Validación (error/success states)

Respeta `prefers-reduced-motion` desactivando animaciones cuando aplica.

---

## Conversión Progresiva

- Awareness: “Explore the spiral”
- Interest: “Learn More” en tiles
- Consideration: Menú radial con “Contact”
- Decision: Footer “Start Your Growth Journey” / “Schedule Demo”

---

## Performance y Accesibilidad

**Optimización:**
- requestAnimationFrame (60 fps)
- Passive listeners
- Dynamic imports
- Islands Architecture (Astro)
- Canvas 2D (WebGL opcional)

**Métricas objetivo:**
- LCP < 2.5s
- 55–60 fps (desktop), 45+ (móvil)
- Lighthouse ≥ 90 (SEO, Performance, A11y)
- Bundle < 50KB (gzip)

**Accesibilidad:**
- ARIA labels
- Navegación por teclado completa
- Screen reader support
- Focus trap en modales
- Contraste AA/AAA

---

## Multiplataforma

- Desktop: Canvas full-screen, menú interactivo, tooltips
- Tablet: Responsive, touch support
- Mobile: Gestos táctiles, menú compacto, modales adaptativos

---

Este documento describe la visión de la experiencia en espiral: no solo comunicar la metodología, sino encarnarla de forma interactiva, permitiendo descubrir progresivamente cada fase y componente a través del zoom y la exploración.