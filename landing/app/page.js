import {
  PenLine, Cpu, Compass, BarChart2,
  Bot, Server, Layers, Database, Sigma, SlidersHorizontal,
} from 'lucide-react';
import Animate        from './components/Animate';
import AnimatedNumber from './components/AnimatedNumber';
import styles from './page.module.css';

const PRINCIPLES = [
  {
    num: '01 /',
    title: 'Vectores, no reglas',
    desc: 'Cada ticket se convierte en un vector de 384 dimensiones. La similitud emerge de la geometría del lenguaje, no de listas de palabras clave ni expresiones regulares.',
  },
  {
    num: '02 /',
    title: 'Multilingüe por diseño',
    desc: 'El modelo paraphrase-multilingual-MiniLM-L12-v2 fue entrenado en 50+ idiomas. Detecta duplicados en español, inglés, y más sin configuración adicional.',
  },
  {
    num: '03 /',
    title: 'Umbrales ajustables',
    desc: 'Los ángulos de corte para "duplicado", "relacionado" y "diferente" son parámetros en base de datos. Se calibran en tiempo real desde el panel de configuración.',
  },
  {
    num: '04 /',
    title: 'Sin dependencias de la nube',
    desc: 'El modelo de embeddings corre completamente en el servidor Node.js con @xenova/transformers. Sin APIs externas, sin costos por token, sin latencia de red.',
  },
];

const STEPS = [
  { num: '01', Icon: PenLine,   title: 'Ingresa tus tickets',      desc: 'Escribe manualmente o selecciona tickets guardados en la base de datos.' },
  { num: '02', Icon: Cpu,       title: 'Embedding semántico',      desc: 'Cada ticket se transforma en un vector de 384 dimensiones con MiniLM-L12-v2.' },
  { num: '03', Icon: Compass,   title: 'Ángulo del coseno',        desc: 'Se calcula θ = arccos(⟨u,v⟩ / ‖u‖·‖v‖) para cada par posible.' },
  { num: '04', Icon: BarChart2, title: 'Clasificación por umbral', desc: 'El ángulo determina si el par es Duplicado, Relacionado o Diferente.' },
];

const TECH = [
  { Icon: Bot,               title: 'MiniLM-L12-v2',       desc: 'Modelo multilingüe de embeddings de oraciones. 384 dimensiones, rápido y preciso en español.', tag: 'ML / NLP' },
  { Icon: Server,            title: 'Node.js + Express',   desc: 'Backend en ESM con pool de conexiones MySQL, caché de embeddings y API REST.', tag: 'Backend' },
  { Icon: Layers,            title: 'React + Vite',        desc: 'Frontend SPA con CSS Modules, React Router y componentes de visualización de resultados.', tag: 'Frontend' },
  { Icon: Database,          title: 'MySQL (Railway)',      desc: 'Base de datos relacional con tablas para tickets, comparaciones, sesiones y configuración.', tag: 'Base de datos' },
  { Icon: Sigma,             title: 'Ángulo del coseno',   desc: 'Fórmula θ = arccos(⟨u,v⟩ / ‖u‖·‖v‖). Similitud = (1 − θ/(π/2)) × 100%.', tag: 'Matemática' },
  { Icon: SlidersHorizontal, title: 'Umbrales calibrados', desc: 'Thresholds 0.95 rad (duplicado) y 1.20 rad (relacionado) calibrados para texto en español.', tag: 'Config' },
];

export default function Page() {
  return (
    <main className={styles.page}>

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          Detec<span>Ticket</span>
        </div>
        <a href="http://localhost:5173" className={styles.navCta}>
          Ir a la app →
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroNoise} />
        <div className={styles.heroEyebrow}>
          <span className={styles.heroEyebrowDot} />
          Detección semántica de tickets
        </div>
        <h1 className={styles.heroTitle}>
          Detectando duplicados.<br />
          <em>Eliminando ruido.</em>
        </h1>
        <p className={styles.heroSub}>
          DetecTicket usa embeddings de lenguaje y ángulo del coseno para identificar
          tickets duplicados y relacionados en tu base de datos, sin reglas manuales.
        </p>
        <div className={styles.heroActions}>
          <a href="http://localhost:5173" className={styles.heroBtnPrimary}>
            Abrir la app →
          </a>
          <a href="#como-funciona" className={styles.heroBtnGhost}>
            Cómo funciona
          </a>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>
              <AnimatedNumber value="384" duration={1000} delay={600} />
            </span>
            <span className={styles.heroStatLabel}>Dimensiones</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>
              <AnimatedNumber value="50+" duration={800} delay={700} />
            </span>
            <span className={styles.heroStatLabel}>Idiomas</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>
              <AnimatedNumber value="100%" duration={700} delay={800} />
            </span>
            <span className={styles.heroStatLabel}>On-premise</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>O(n²)</span>
            <span className={styles.heroStatLabel}>Comparaciones</span>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className={styles.section}>
        <div className={styles.about}>
          <Animate from="left" delay={0}>
            <div className={styles.sectionEyebrow}>Agencia & Tecnología</div>
            <h2 className={styles.sectionTitle}>
              Construido sobre vectores,<br />no promesas.
            </h2>
            <p className={styles.aboutDesc}>
              Los equipos de soporte reciben cientos de tickets por semana. Muchos describen
              el <strong>mismo problema con palabras distintas</strong>. DetecTicket convierte
              cada descripción en un punto del espacio vectorial y mide el ángulo entre ellos:
              cuanto menor el ángulo, mayor la similitud semántica.
            </p>
            <p className={styles.aboutDesc} style={{ marginTop: 16 }}>
              Sin reglas frágiles, sin diccionarios, sin sinónimos hardcodeados.
              Solo <strong>geometría del lenguaje</strong>.
            </p>
          </Animate>
          <Animate from="right" delay={120}>
            <div className={styles.aboutVisual}>
              <div className={styles.aboutOrbit} />
              <div className={styles.aboutCircle}>
                <div className={styles.aboutCircleInner}>
                  <span className={styles.aboutCircleValue}>θ</span>
                  <span className={styles.aboutCircleLabel}>ángulo</span>
                </div>
              </div>
            </div>
          </Animate>
        </div>
      </section>

      {/* ── Principles ── */}
      <section className={styles.section}>
        <Animate from="bottom" delay={0}>
          <div className={styles.sectionEyebrow}>Nuestros Principios</div>
          <h2 className={styles.sectionTitle}>¿Por qué DetecTicket?</h2>
        </Animate>
        <div className={styles.principlesGrid}>
          {PRINCIPLES.map((p, i) => (
            <Animate key={p.num} className={styles.principle} delay={80 + i * 80}>
              <span className={styles.principleNum}>{p.num}</span>
              <div className={styles.principleBody}>
                <div className={styles.principleTitle}>{p.title}</div>
                <p className={styles.principleDesc}>{p.desc}</p>
              </div>
            </Animate>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <div id="como-funciona" className={styles.howBg}>
        <section className={styles.section}>
          <Animate from="bottom" delay={0}>
            <div className={styles.sectionEyebrow}>El Proceso</div>
            <h2 className={styles.sectionTitle}>¿Cómo funciona?</h2>
            <p className={styles.sectionSub}>
              Cuatro pasos desde el texto hasta el resultado — todo en el servidor, sin APIs externas.
            </p>
          </Animate>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <Animate key={s.num} className={styles.step} delay={120 + i * 80}>
                <span className={styles.stepNum}>{s.num}</span>
                <div className={styles.stepIcon}>
                  <s.Icon size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.stepTitle}>{s.title}</div>
                <p className={styles.stepDesc}>{s.desc}</p>
              </Animate>
            ))}
          </div>
        </section>
      </div>

      {/* ── Formula ── */}
      <section className={styles.section}>
        <div className={styles.formulaSection}>
          <Animate from="left" delay={0}>
            <div className={styles.sectionEyebrow}>La Fórmula</div>
            <h2 className={styles.sectionTitle}>
              Similitud<br />geométrica.
            </h2>
            <p className={styles.formulaDesc}>
              El ángulo entre dos vectores de embedding captura la <strong>similitud
              semántica</strong> con una sola operación. Un ángulo θ cercano a 0° indica
              tickets prácticamente idénticos; cercano a 90° indica temas completamente distintos.
            </p>
            <p className={styles.formulaDesc} style={{ marginTop: 14 }}>
              La similitud porcentual se calcula como <strong>(1 − θ/(π/2)) × 100%</strong>,
              convirtiendo el ángulo en un porcentaje intuitivo.
            </p>
          </Animate>
          <Animate from="right" delay={140}>
            <div className={styles.formulaDisplay}>
              <span className={styles.formulaName}>Ángulo del Coseno</span>
              <div className={styles.formulaEq}>
                <span className={styles.formulaTheta}>θ</span>
                <span className={styles.formulaOp}>=</span>
                <span className={styles.formulaFn}>arccos</span>
                <span className={styles.formulaParen}>(</span>
                <div className={styles.formulaFraction}>
                  <span className={`${styles.formulaFractionText} ${styles.formulaHL}`}>⟨u, v⟩</span>
                  <div className={styles.formulaDivLine} />
                  <span className={styles.formulaFractionText}>
                    <span className={styles.formulaHL}>‖u‖</span>
                    {' · '}
                    <span className={styles.formulaHL}>‖v‖</span>
                  </span>
                </div>
                <span className={styles.formulaParen}>)</span>
              </div>
            </div>
          </Animate>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className={styles.section}>
        <Animate from="bottom" delay={0}>
          <div className={styles.sectionEyebrow}>Stack Tecnológico</div>
          <h2 className={styles.sectionTitle}>Construido con las herramientas de hoy.</h2>
        </Animate>
        <div className={styles.techGrid}>
          {TECH.map((t, i) => (
            <Animate key={t.title} className={styles.techCard} delay={80 + i * 60}>
              <div className={styles.techCardIcon}>
                <t.Icon size={22} strokeWidth={1.5} />
              </div>
              <div className={styles.techCardTitle}>{t.title}</div>
              <p className={styles.techCardDesc}>{t.desc}</p>
              <span className={styles.techCardTag}>{t.tag}</span>
            </Animate>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <Animate from="bottom" delay={0}>
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>
            Empieza a detectar<br />
            <em>duplicados ahora.</em>
          </h2>
          <p className={styles.ctaSub}>
            Abre la app, agrega tus tickets y obtén resultados en segundos.
            Sin configuración, sin registro.
          </p>
          <a href="http://localhost:5173" className={styles.ctaBtn}>
            Abrir DetecTicket →
          </a>
        </section>
      </Animate>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Detec<span>Ticket</span></div>
        <span>Detección semántica de tickets duplicados. On-premise.</span>
      </footer>
    </main>
  );
}
