# La arquitectura de lo ausente

Exposición interactiva del capítulo 5 de *Los problemas de la filosofía* de
Bertrand Russell: **conocimiento directo y conocimiento por referencia**.

<p align="center">
  <a href="https://stevenvo780.github.io/russell-conocimiento-directo/"><strong>→ Ver la exposición en vivo</strong></a>
</p>

<p align="center">
  <a href="https://stevenvo780.github.io/russell-conocimiento-directo/presentacion">Presentación</a> ·
  <a href="./Capitulo5.md">Guion completo</a> ·
  <a href="https://stevenvo780.github.io/russell-conocimiento-directo/fuentes">Fuentes</a>
</p>

## La idea

Russell sostiene que toda proposición que podamos comprender debe componerse de
elementos conocidos directamente. Las descripciones permiten, desde ese anclaje,
pensar con sentido en mesas físicas, personajes históricos y objetos nunca
experimentados.

La exposición resume esa arquitectura en una fórmula:

> **Conocimiento directo = anclaje · conocimiento por referencia = alcance.**

## Entregables

- [`Capitulo5.md`](./Capitulo5.md): guion canónico de 27:15, aparato de citas,
  ocho diagramas Mermaid, glosario, preguntas y notas por diapositiva.
- `/`: introducción narrativa navegable.
- `/presentacion`: deck de 14 diapositivas con revelados argumentales, SVG
  adaptativos, enlaces profundos, historial, índice por actos, notas navegables,
  transiciones semánticas, puntero láser, cronómetro, gestos táctiles y pantalla
  completa.
- `/fuentes`: referencia bibliográfica y criterio editorial.

La portada responde al puntero y al avance de lectura, incorpora profundidad 3D
en los casos y permite reconstruir el ejemplo de la mesa en tres capas. Todo el
movimiento respeta `prefers-reduced-motion`.

## Atajos de la presentación

| Tecla | Acción |
|---|---|
| `←` / `→` / espacio | avanzar o retroceder un revelado/diapositiva |
| `J` / `K` | avanzar / retroceder |
| `O` o `I` | índice |
| `S` o `N` | notas del ponente |
| `L` | activar o desactivar el puntero láser |
| `F` | pantalla completa |
| `Home` / `End` | primera / última diapositiva |
| `Esc` | cerrar panel |
| `?` | ayuda |

En móvil se puede navegar deslizando horizontalmente; los ocho diagramas usan
composiciones verticales propias y no dependen de una reducción del SVG de escritorio.

## Stack

- Vite 8 + React 19 + TypeScript
- Framer Motion para transiciones sobrias
- SVG nativo para todos los diagramas
- Fontsource: Cormorant Garamond, Inter y JetBrains Mono, servidas localmente
- Playwright + axe-core para pruebas de navegación, responsive y accesibilidad

No hay backend, API, variables de entorno, analítica ni dependencias de CDN en
tiempo de ejecución. El resultado de `npm run build` es un sitio estático.

## Desarrollo

```bash
npm ci
npm run dev
```

Gates de entrega:

```bash
npm run typecheck
npm run build
npm run test:e2e
```

## Estructura

```text
.
├── Capitulo5.md           Guion canónico
├── public/                Favicon y metadatos estáticos
├── src/
│   ├── components/        Diagramas SVG
│   ├── pages/             Portada, deck y fuentes
│   ├── slides.tsx         Contenido y notas de las 14 diapositivas
│   └── styles.css         Sistema visual completo
├── tests/                 Pruebas E2E y de accesibilidad
└── vercel.json            Despliegue SPA estático
```

## Fuente y derechos

Texto primario:

> Russell, Bertrand. *Los problemas de la filosofía*. Traducción de Joaquín
> Xirau; prólogo de Emilio Lledó. Barcelona: Editorial Labor, 1995. Capítulo 5.

El repositorio publica una exposición, paráfrasis, citas breves y diagramas
originales. **No incluye** el PDF ni la transcripción integral de la traducción de
1995.

El código del micrositio se distribuye bajo licencia MIT. El texto fuente conserva
los derechos que correspondan a sus titulares.

---

Steven Vallejo · Medellín · 2026
