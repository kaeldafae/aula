// =====================================================
// CONTENIDO DEL CURSO — Aula 2.0
// Para ampliar el curso: pide a Claude la siguiente lección
// y sustituye este archivo completo en GitHub.
// =====================================================

const COURSE = {

plan30: [
  { week: 1, focus: "Comercial", tasks: ["Lección C1 + examen", "Lección C2 + examen", "Lección C3 + examen", "Caso práctico cada 2 días", "Fichas diarias (10 min)"] },
  { week: 2, focus: "Laboral", tasks: ["Lección L1 + examen", "Lección L2 + examen", "Fichas diarias (incluye repaso de Comercial)", "Examen global a final de semana"] },
  { week: 3, focus: "Contable", tasks: ["Lección CO1 + examen", "Ejercicios de clasificación a diario", "Fichas diarias acumuladas", "Repetir exámenes con nota < 8"] },
  { week: 4, focus: "Legal + consolidación", tasks: ["Lección LE1 + examen", "Examen global cronometrado (2 veces)", "Repasar todas las fichas en rojo", "Objetivo: todas las notas ≥ 8/10"] }
],

glossary: [
  { t: "AIDA", d: "Modelo del recorrido del comprador: Atención, Interés, Deseo, Acción." },
  { t: "Lead", d: "Cliente potencial que ha mostrado algún interés y del que tenemos datos de contacto." },
  { t: "Prospección", d: "Búsqueda y cualificación de clientes potenciales." },
  { t: "Objeción", d: "Resistencia o duda del cliente; señal de interés y petición de más información." },
  { t: "Cross-selling", d: "Venta cruzada: ofrecer productos complementarios al adquirido." },
  { t: "Up-selling", d: "Ofrecer una versión superior o más completa del mismo producto." },
  { t: "MAAN (BATNA)", d: "Mejor Alternativa a un Acuerdo Negociado: tu plan B si la negociación fracasa. Define tu poder negociador." },
  { t: "ZOPA", d: "Zona de Posible Acuerdo: el rango donde las posiciones de ambas partes se solapan." },
  { t: "Anclaje", d: "La primera cifra mencionada en una negociación condiciona todo el rango posterior." },
  { t: "NPS", d: "Net Promoter Score: % promotores (9-10) menos % detractores (0-6) al preguntar '¿nos recomendarías?'." },
  { t: "CLV", d: "Customer Lifetime Value: beneficio total que genera un cliente durante toda su relación con la empresa." },
  { t: "CRM", d: "Software para gestionar la relación con clientes: historial, seguimiento, oportunidades." },
  { t: "Embudo de ventas", d: "Recorrido visitante → lead → oportunidad → cliente; en cada fase se pierde un porcentaje." },
  { t: "Estatuto de los Trabajadores", d: "Norma básica que regula la relación laboral en España (mínimos que los convenios mejoran)." },
  { t: "Convenio colectivo", d: "Acuerdo entre empresas y representantes de los trabajadores que mejora el Estatuto en un sector o empresa." },
  { t: "Periodo de prueba", d: "Tiempo inicial en que ambas partes pueden romper el contrato sin indemnización ni preaviso." },
  { t: "Fijo-discontinuo", d: "Contrato indefinido para trabajos estacionales que se repiten (clave en hostelería de temporada)." },
  { t: "SMI", d: "Salario Mínimo Interprofesional: el suelo salarial legal, actualizado cada año por el Gobierno." },
  { t: "Devengo", d: "Cada concepto que suma en la nómina (salario base, complementos, dietas...)." },
  { t: "Base de cotización", d: "Cantidad sobre la que se calculan las cuotas a la Seguridad Social." },
  { t: "IRPF", d: "Impuesto sobre la renta; en nómina, la retención que la empresa ingresa a Hacienda a cuenta del trabajador." },
  { t: "Activo", d: "Bienes y derechos de la empresa: lo que tiene y lo que le deben." },
  { t: "Pasivo", d: "Obligaciones: lo que la empresa debe a terceros." },
  { t: "Patrimonio neto", d: "Activo menos pasivo: la parte que pertenece de verdad a los propietarios." },
  { t: "Partida doble", d: "Todo hecho contable se anota al menos en dos cuentas: el total del Debe siempre iguala al Haber." },
  { t: "PGC", d: "Plan General de Contabilidad: el 'reglamento' contable español." },
  { t: "Asiento", d: "Anotación de una operación en el libro Diario." },
  { t: "Responsabilidad limitada", d: "Los socios solo arriesgan lo aportado a la sociedad, no su patrimonio personal." }
],

modules: [

// ============================================================
// MÓDULO COMERCIAL
// ============================================================
{
  id: "comercial", name: "Comercial", color: "#3F5A44", icon: "🤝",
  lessons: [

  // ---------- C1 ----------
  {
    id: "com-l1",
    title: "C1 · La función comercial y el proceso de venta",
    minutes: 20,
    html: `
      <h3>1. Qué es la función comercial</h3>
      <p>La <b>función comercial</b> conecta la empresa con el mercado: identifica qué necesitan los clientes, les hace llegar el producto y convierte ese intercambio en ingresos. Es el puente entre lo que la empresa produce y lo que el cliente compra.</p>
      <div class="keybox">💡 Sin función comercial no hay ingresos: puedes tener el mejor producto del mundo, pero si nadie lo conoce ni lo compra, la empresa muere.</div>
      <h3>2. Marketing vs. ventas</h3>
      <ul>
        <li><b>Marketing</b>: crea demanda. Investiga el mercado, identifica necesidades y atrae clientes potenciales. Largo plazo.</li>
        <li><b>Ventas</b>: convierte la demanda en ingresos mediante el trato directo. Corto plazo.</li>
      </ul>
      <p>En tu mundo: el marketing de HILO sería el contenido que atrae a gestorías de Ibiza; las ventas, la demo a una gestoría concreta para que contrate.</p>
      <h3>3. Las 7 fases del proceso de venta</h3>
      <ul>
        <li><b>1. Prospección</b>: buscar y cualificar clientes potenciales (leads).</li>
        <li><b>2. Preparación</b>: investigar al cliente antes del contacto.</li>
        <li><b>3. Contacto</b>: primera aproximación, generar confianza.</li>
        <li><b>4. Presentación</b>: mostrar el producto en términos de <b>beneficios</b> para ese cliente, no de características.</li>
        <li><b>5. Objeciones</b>: responder dudas y resistencias.</li>
        <li><b>6. Cierre</b>: conseguir el compromiso de compra.</li>
        <li><b>7. Seguimiento</b>: cuidar al cliente tras la venta.</li>
      </ul>
      <div class="keybox">🧠 Para memorizar: <b>Pros-Pre-Con-Pres-O-C-S</b>.</div>
      <h3>4. El método AIDA</h3>
      <p>Cómo decide un comprador: <b>A</b>tención (captar) → <b>I</b>nterés (querer saber más) → <b>D</b>eseo (quererlo para sí) → <b>A</b>cción (comprar).</p>
      <h3>5. Objeciones: tu aliada</h3>
      <p>"Es caro" o "ya tengo proveedor" no es un rechazo: es una <b>petición de más información</b>. Quien objeta está interesado; quien no, desaparece. Se tratan escuchando, validando y respondiendo con beneficios.</p>
      <h3>6. Tipos de cierre</h3>
      <ul>
        <li><b>Directo</b>: "¿Lo dejamos firmado?"</li>
        <li><b>Alternativo</b>: dos opciones que implican comprar: "¿Plan mensual o anual?"</li>
        <li><b>Por resumen</b>: recapitular beneficios aceptados y pedir la decisión.</li>
        <li><b>De urgencia</b>: condición temporal real: "el precio de lanzamiento acaba el viernes".</li>
      </ul>
      <h3>7. Cross-selling, up-selling y postventa</h3>
      <ul>
        <li><b>Cross-selling</b>: producto complementario (hotel que ofrece el spa).</li>
        <li><b>Up-selling</b>: versión superior (habitación con vistas al mar).</li>
        <li><b>Postventa</b>: fideliza, genera recompra y referencias. <b>Retener cuesta mucho menos que captar</b>.</li>
      </ul>
      <h3>8. Dos habilidades base</h3>
      <ul>
        <li><b>Escucha activa</b>: atender, comprender y confirmar antes de responder.</li>
        <li><b>Cualificación</b>: un lead vale la pena si tiene <b>necesidad + capacidad de compra + autoridad para decidir</b>.</li>
      </ul>`,
    flashcards: [
      { q: "¿Qué es la función comercial?", a: "Las actividades que conectan empresa y mercado: identificar necesidades, hacer llegar el producto y generar ingresos." },
      { q: "Marketing vs. ventas", a: "Marketing crea demanda (largo plazo); ventas la convierte en ingresos con trato directo (corto plazo)." },
      { q: "Las 7 fases del proceso de venta, en orden", a: "Prospección · Preparación · Contacto · Presentación · Objeciones · Cierre · Seguimiento." },
      { q: "¿Qué es la prospección?", a: "Buscar y cualificar clientes potenciales (leads)." },
      { q: "¿Qué significa AIDA?", a: "Atención, Interés, Deseo, Acción." },
      { q: "¿Qué es una objeción y cómo verla?", a: "Una duda o resistencia ('es caro'). No es rechazo: es señal de interés y petición de información." },
      { q: "¿Qué es un cierre alternativo?", a: "Dar a elegir entre dos opciones que implican comprar: '¿mensual o anual?'" },
      { q: "Cross-selling", a: "Ofrecer productos complementarios. Ej.: hotel que ofrece el spa." },
      { q: "Up-selling", a: "Ofrecer una versión superior del mismo producto. Ej.: habitación con vistas." },
      { q: "¿Por qué importa la postventa?", a: "Fideliza y genera recompra y referencias. Retener cuesta mucho menos que captar." },
      { q: "¿Cuándo está cualificado un lead?", a: "Cuando tiene necesidad, capacidad de compra y autoridad para decidir." },
      { q: "¿Qué es la escucha activa?", a: "Atender, comprender y confirmar lo que dice el cliente antes de responder." }
    ],
    exam: [
      { q: "¿Orden correcto de las primeras fases de la venta?", opts: ["Contacto → Prospección → Preparación", "Prospección → Preparación → Contacto", "Preparación → Cierre → Prospección", "Presentación → Prospección → Contacto"], ok: 1, why: "Primero se buscan clientes, luego se investiga a cada uno y después se les contacta." },
      { q: "AIDA significa…", opts: ["Análisis, Inversión, Demanda, Acción", "Atención, Interés, Deseo, Acción", "Atención, Información, Decisión, Acuerdo", "Acción, Interés, Demanda, Atención"], ok: 1, why: "Las etapas mentales del comprador hasta decidirse." },
      { q: "'Me parece caro' es…", opts: ["Un rechazo definitivo", "Una objeción: petición de más información", "Una técnica de cierre", "Parte de la prospección"], ok: 1, why: "Las objeciones son señal de interés; se responden con beneficios." },
      { q: "Un hotel ofrece el spa al reservar habitación. Esto es…", opts: ["Up-selling", "Cross-selling", "Cierre directo", "Prospección"], ok: 1, why: "El spa es complementario a la habitación → venta cruzada." },
      { q: "Diferencia clave marketing / ventas:", opts: ["Son sinónimos", "Marketing crea demanda; ventas la convierte en ingresos", "Ventas crea demanda; marketing cierra", "Marketing es solo publicidad"], ok: 1, why: "Marketing trabaja a largo plazo; ventas cierra operaciones concretas." },
      { q: "La prospección consiste en…", opts: ["Presentar el producto", "Buscar y cualificar clientes potenciales", "Resolver objeciones", "El seguimiento postventa"], ok: 1, why: "Prospectar = encontrar leads y filtrar cuáles merecen la pena." },
      { q: "'¿Lo prefiere mensual o anual?' es un cierre…", opts: ["Directo", "Alternativo", "Por resumen", "De urgencia"], ok: 1, why: "Dos opciones y ambas implican comprar." },
      { q: "¿Por qué es clave la postventa?", opts: ["Es obligatoria por ley", "Retener cuesta menos que captar y genera recomendaciones", "Sustituye a la prospección", "Solo importa en productos caros"], ok: 1, why: "La fidelización genera recompra y referencias a bajo coste." },
      { q: "Un lead bien cualificado tiene…", opts: ["Necesidad, capacidad de compra y autoridad", "Solo interés", "Una empresa grande", "Presupuesto ilimitado"], ok: 0, why: "Las tres condiciones a la vez." },
      { q: "En la presentación, lo eficaz es hablar de…", opts: ["Todas las características técnicas", "Los beneficios concretos para ese cliente", "El precio desde el minuto uno", "La historia de la empresa"], ok: 1, why: "El cliente compra lo que el producto hace por él." }
    ],
    exercises: [
      { type: "order", title: "Ordena las 7 fases del proceso de venta", items: ["Prospección", "Preparación", "Contacto", "Presentación", "Objeciones", "Cierre", "Seguimiento"] },
      { type: "tf", q: "Una objeción es un rechazo definitivo y conviene retirarse.", ok: false, why: "Es una petición de información y señal de interés." },
      { type: "tf", q: "Retener a un cliente suele costar menos que captar uno nuevo.", ok: true, why: "Por eso la postventa y la fidelización son tan rentables." },
      { type: "fill", q: "El modelo que describe Atención → Interés → Deseo → Acción se llama método…", accept: ["aida"], why: "AIDA." },
      { type: "match", title: "Empareja cada concepto", pairs: [["Cross-selling", "Producto complementario"], ["Up-selling", "Versión superior"], ["Prospección", "Buscar leads"], ["Postventa", "Seguimiento tras la venta"]] },
      { type: "fill", q: "Buscar y cualificar clientes potenciales se llama…", accept: ["prospeccion", "la prospeccion"], why: "Prospección: la fase 1 de la venta." }
    ],
    cases: [
      { id: "caso-c1", title: "La demo a la gestoría", intro: "Has conseguido 20 minutos con la socia de una gestoría de Ibiza para presentar HILO. Decide bien cada paso.",
        steps: [
          { text: "Entras en la reunión. ¿Cómo empiezas?", opts: [
            { t: "Abres el portátil y lanzas la demo directamente.", good: 0, fb: "Saltarse el contacto y el diagnóstico es vender a ciegas." },
            { t: "Preguntas: '¿Cómo gestionáis hoy las altas de personal en temporada?'", good: 2, fb: "Perfecto: escucha activa para detectar la necesidad real antes de presentar." },
            { t: "Hablas 5 minutos de la historia de tu proyecto.", good: 1, fb: "Genera algo de cercanía, pero el tiempo es del cliente: pregunta por su problema." }] },
          { text: "Te dice: 'en julio nos saturamos con los contratos del hotel X'. ¿Qué presentas?", opts: [
            { t: "Todas las funciones de HILO, una a una.", good: 0, fb: "Lista de características = el cliente desconecta." },
            { t: "Solo cómo HILO automatiza altas masivas por WhatsApp, con su caso de julio como ejemplo.", good: 2, fb: "Beneficio concreto sobre SU problema: presentación quirúrgica." },
            { t: "Una comparativa de precios con la competencia.", good: 1, fb: "Aún no toca: primero valor, luego precio." }] },
          { text: "Objeción: 'me parece caro para lo que es'.", opts: [
            { t: "Bajas el precio un 30% al instante.", good: 0, fb: "Ceder sin defender el valor destroza tu margen y tu credibilidad." },
            { t: "Preguntas: '¿caro comparado con qué?' y calculas las horas que le ahorra al mes.", good: 2, fb: "Reencuadras el precio como inversión con datos." },
            { t: "Le dices que la calidad se paga.", good: 1, fb: "Defiendes el valor pero sin argumento concreto." }] },
          { text: "La conversación va bien. ¿Cómo cierras?", opts: [
            { t: "'Bueno, piénsatelo y me dices.'", good: 0, fb: "Cierre regalado al olvido: sin compromiso ni fecha." },
            { t: "'¿Empezamos con el plan mensual o te compensa el anual con descuento?'", good: 2, fb: "Cierre alternativo: ambas opciones implican avanzar." },
            { t: "'¿Te parece si te llamo la semana que viene?'", good: 1, fb: "Al menos hay siguiente paso, pero es débil: concreta día y hora." }] }
        ] }
    ]
  },

  // ---------- C2 ----------
  {
    id: "com-l2",
    title: "C2 · Negociación y tipos de cliente",
    minutes: 25,
    html: `
      <h3>1. Negociar no es regatear</h3>
      <p>Negociar es buscar un acuerdo donde <b>ambas partes ganen algo</b> (ganar-ganar). Regatear es solo pelear el precio. El buen negociador prepara, escucha y cede con cabeza.</p>
      <h3>2. Preparación: tu poder real</h3>
      <ul>
        <li><b>MAAN</b> (Mejor Alternativa a un Acuerdo Negociado, en inglés BATNA): tu plan B si no hay trato. Cuanto mejor sea tu MAAN, más fuerte negocias.</li>
        <li><b>ZOPA</b>: la zona donde tu mínimo aceptable y el máximo del otro se solapan. Si no hay ZOPA, no hay acuerdo posible.</li>
        <li>Define antes de entrar: objetivo ideal, objetivo realista y punto de ruptura.</li>
      </ul>
      <div class="keybox">💡 El que tiene mejor alternativa fuera de la mesa, manda en la mesa.</div>
      <h3>3. El método Harvard (ganar-ganar)</h3>
      <ul>
        <li><b>Separa a las personas del problema</b>: duro con el problema, suave con la persona.</li>
        <li><b>Intereses, no posiciones</b>: la posición es "quiero un 20% de descuento"; el interés real puede ser "necesito que me cuadre el presupuesto anual".</li>
        <li><b>Genera opciones</b> de beneficio mutuo antes de decidir.</li>
        <li><b>Criterios objetivos</b>: precios de mercado, datos, no pulsos de ego.</li>
      </ul>
      <h3>4. Técnicas que debes conocer</h3>
      <ul>
        <li><b>Anclaje</b>: la primera cifra dicha condiciona todo el rango. Quien ancla primero (con fundamento) lleva ventaja.</li>
        <li><b>Silencio</b>: tras decir tu precio, calla. El silencio presiona.</li>
        <li><b>Concesiones recíprocas</b>: nunca cedas gratis: "te doy X si tú me das Y". Cede cada vez menos.</li>
        <li><b>Salami</b>: pedir mejoras pequeñas una tras otra (detéctala y cierra el paquete completo).</li>
      </ul>
      <h3>5. Tipos de cliente y cómo tratarlos</h3>
      <ul>
        <li><b>Indeciso</b>: pocas opciones, mensajes de seguridad, guíale tú al cierre.</li>
        <li><b>Dominante</b>: firmeza serena y datos; no entres a pulsear su ego.</li>
        <li><b>Analítico / reflexivo</b>: cifras, pruebas, garantías y tiempo; no le presiones.</li>
        <li><b>Amable / hablador</b>: cordialidad, pero redirige con preguntas hacia el cierre.</li>
        <li><b>Sabelotodo</b>: reconoce lo que sabe ("como tú bien sabes…") y no discutas; apóyate en su criterio.</li>
      </ul>
      <h3>6. Errores que matan negociaciones</h3>
      <ul>
        <li>No preparar el MAAN (negocias con miedo).</li>
        <li>Hablar más que escuchar (regla de oro: escucha 60-70% del tiempo).</li>
        <li>Ceder rápido por incomodidad.</li>
        <li>Negociar un solo punto (precio): mete plazo, volumen, servicios, pago… y intercambia.</li>
      </ul>`,
    flashcards: [
      { q: "¿Qué es el MAAN (BATNA)?", a: "Tu Mejor Alternativa a un Acuerdo Negociado: el plan B si no hay trato. Define tu poder negociador." },
      { q: "¿Qué es la ZOPA?", a: "Zona de Posible Acuerdo: el rango donde se solapan lo mínimo que aceptas tú y lo máximo que acepta el otro." },
      { q: "¿Qué es el anclaje?", a: "La primera cifra mencionada condiciona todo el rango de la negociación." },
      { q: "Los 4 principios del método Harvard", a: "Separar personas del problema · intereses, no posiciones · generar opciones de beneficio mutuo · usar criterios objetivos." },
      { q: "Posición vs. interés", a: "Posición = lo que pide ('20% de descuento'). Interés = por qué lo pide ('cuadrar su presupuesto')." },
      { q: "Regla de las concesiones", a: "Nunca ceder gratis: pedir algo a cambio y ceder cada vez menos." },
      { q: "¿Cómo tratar a un cliente indeciso?", a: "Pocas opciones, mensajes de seguridad y guiarle activamente al cierre." },
      { q: "¿Cómo tratar a un cliente analítico?", a: "Datos, pruebas, garantías y tiempo. Sin presión." },
      { q: "¿Cómo tratar a un cliente dominante?", a: "Firmeza serena y datos; no pulsear su ego." },
      { q: "¿Cómo tratar a un sabelotodo?", a: "Reconocer su conocimiento ('como tú bien sabes…') y apoyarse en su criterio, sin discutir." },
      { q: "Técnica del salami", a: "Pedir mejoras pequeñas una tras otra. Defensa: cerrar el paquete completo de una vez." },
      { q: "¿Cuánto debe escuchar un negociador?", a: "Más de lo que habla: en torno al 60-70% del tiempo." }
    ],
    exam: [
      { q: "Tu poder en una negociación depende sobre todo de…", opts: ["Tu tono de voz", "Tu MAAN: tu alternativa si no hay acuerdo", "Hablar primero", "Conocer al otro de antes"], ok: 1, why: "Quien tiene mejor plan B puede levantarse de la mesa." },
      { q: "Si el mínimo del vendedor es 500€ y el máximo del comprador 450€…", opts: ["Hay ZOPA estrecha", "No hay ZOPA: sin acuerdo posible en precio", "Gana el comprador", "Hay que anclar más alto"], ok: 1, why: "Los rangos no se solapan; habría que meter otras variables (plazo, volumen…)." },
      { q: "'Quiero un 20% de descuento' es…", opts: ["Un interés", "Una posición", "Un MAAN", "Un criterio objetivo"], ok: 1, why: "La posición es la petición; el interés es el porqué que hay detrás." },
      { q: "El anclaje consiste en…", opts: ["Callar tras dar el precio", "Que la primera cifra condicione el rango", "Ceder al final", "Repetir la oferta"], ok: 1, why: "La primera cifra fija la referencia mental de toda la negociación." },
      { q: "Un cliente pide rebajas pequeñas una tras otra. Es la técnica…", opts: ["Anclaje", "Salami", "Silencio", "Harvard"], ok: 1, why: "Loncha a loncha se lleva el jamón: cierra el paquete completo." },
      { q: "Con un cliente indeciso conviene…", opts: ["Darle 10 opciones", "Pocas opciones y seguridad, guiándole al cierre", "Presionar con urgencia agresiva", "Dejar que decida solo en unos meses"], ok: 1, why: "El exceso de opciones le bloquea; necesita seguridad y guía." },
      { q: "Según Harvard, los acuerdos deben apoyarse en…", opts: ["La intuición", "Criterios objetivos (mercado, datos)", "La antigüedad de la relación", "La autoridad del que más grita"], ok: 1, why: "Los criterios objetivos despersonalizan el conflicto." },
      { q: "Ceder algo sin pedir nada a cambio…", opts: ["Genera buena voluntad siempre", "Enseña al otro que presionando consigue más", "Es obligatorio al empezar", "Cierra la venta antes"], ok: 1, why: "Las concesiones gratis invitan a pedir más: intercambia siempre." },
      { q: "Con un cliente analítico, lo peor es…", opts: ["Darle datos", "Presionarle para decidir ya", "Ofrecer garantías", "Enviarle una comparativa"], ok: 1, why: "Necesita tiempo y evidencia; la presión le hace huir." },
      { q: "Negociar solo el precio es un error porque…", opts: ["El precio no importa", "Pierdes variables de intercambio (plazo, volumen, servicios)", "Es ilegal", "Alarga la reunión"], ok: 1, why: "Con varias variables puedes ceder en una y ganar en otra." }
    ],
    exercises: [
      { type: "match", title: "Cada cliente con su tratamiento", pairs: [["Indeciso", "Pocas opciones y seguridad"], ["Dominante", "Firmeza serena y datos"], ["Analítico", "Pruebas y tiempo"], ["Sabelotodo", "Reconocer su criterio"]] },
      { type: "tf", q: "Quien menciona la primera cifra suele condicionar el rango de la negociación.", ok: true, why: "Es el efecto anclaje." },
      { type: "tf", q: "Lo ideal es que el negociador hable el 80% del tiempo.", ok: false, why: "Al revés: escucha el 60-70% para descubrir intereses." },
      { type: "fill", q: "Tu plan B si la negociación fracasa se llama (siglas en español)…", accept: ["maan", "el maan"], why: "MAAN: Mejor Alternativa a un Acuerdo Negociado." },
      { type: "fill", q: "La zona donde se solapan las posiciones de ambas partes se llama…", accept: ["zopa", "la zopa"], why: "ZOPA: Zona de Posible Acuerdo." },
      { type: "order", title: "Ordena una concesión bien hecha", items: ["Escuchar la petición", "Preguntar el porqué (interés)", "Ofrecer intercambio ('X si tú Y')", "Cerrar el punto y dejarlo por escrito"] }
    ],
    cases: [
      { id: "caso-c2", title: "El hotel quiere descuento", intro: "El director de un hotel de 80 habitaciones quiere HILO, pero exige un 40% de descuento. Tu MAAN: tienes otras 2 demos esta semana.",
        steps: [
          { text: "Te suelta: 'O me haces el 40% o nada'. ¿Primera reacción?", opts: [
            { t: "Aceptas: es un cliente grande.", good: 0, fb: "Ceder todo de golpe fija tu precio real un 40% abajo para siempre." },
            { t: "Preguntas con calma: '¿qué te hace falta exactamente para que te cuadre?'", good: 2, fb: "Buscas el interés detrás de la posición. Harvard puro." },
            { t: "Le dices que ese descuento es imposible y punto.", good: 1, fb: "Defiendes el precio, pero cierras la puerta sin explorar opciones." }] },
          { text: "Su interés real: el presupuesto de este año ya está cerrado. ¿Qué propones?", opts: [
            { t: "Empezar en enero a precio completo, con 2 meses de prueba gratis ahora.", good: 2, fb: "Opción de beneficio mutuo: él cuadra el año, tú proteges el precio." },
            { t: "El 40% para siempre.", good: 0, fb: "Resuelves su problema de un año regalando margen de por vida." },
            { t: "Un 10% de descuento sin más.", good: 1, fb: "Concesión unilateral: al menos pide algo a cambio (anualidad, testimonio…)." }] },
          { text: "Acepta, pero pide 'una cosita más': formación gratis. Y luego otra: soporte prioritario…", opts: [
            { t: "Vas concediendo cada cosita.", good: 0, fb: "Técnica del salami: te está laminando." },
            { t: "'Pongamos en la mesa todo lo que necesitas y cierro un paquete completo.'", good: 2, fb: "Cortas el salami: una negociación, un paquete, un cierre." },
            { t: "Te molestas y amenazas con irte.", good: 1, fb: "Tu MAAN te permite tensar, pero hay formas más elegantes de cerrar el goteo." }] }
        ] }
    ]
  },

  // ---------- C3 ----------
  {
    id: "com-l3",
    title: "C3 · Atención al cliente, fidelización y CRM",
    minutes: 22,
    html: `
      <h3>1. El servicio es parte del producto</h3>
      <p>Dos hoteles con la misma habitación no valen lo mismo si uno responde en 2 minutos y otro en 2 días. La <b>calidad de servicio</b> = expectativa vs. experiencia: si la experiencia supera la expectativa, hay satisfacción.</p>
      <h3>2. Gestión de quejas: el protocolo</h3>
      <ul>
        <li><b>1. Escuchar</b> sin interrumpir ni justificarse.</li>
        <li><b>2. Agradecer y disculparse</b>: la queja es información gratis.</li>
        <li><b>3. Resolver rápido</b> (la velocidad pesa más que la perfección).</li>
        <li><b>4. Compensar</b> si procede.</li>
        <li><b>5. Seguimiento</b>: comprobar que quedó satisfecho.</li>
      </ul>
      <div class="keybox">💡 Paradoja de la recuperación: un cliente cuya queja se resuelve muy bien puede acabar más fiel que uno que nunca tuvo problemas.</div>
      <h3>3. Medir la fidelidad: NPS</h3>
      <p>Se pregunta: "del 0 al 10, ¿nos recomendarías?". <b>Promotores</b> (9-10), pasivos (7-8), <b>detractores</b> (0-6). <b>NPS = % promotores − % detractores</b>. Un NPS positivo ya es bueno; +50 es excelente.</p>
      <h3>4. El valor de un cliente: CLV</h3>
      <p><b>Customer Lifetime Value</b>: lo que un cliente genera en toda su relación contigo. Una gestoría que paga 99€/mes durante 3 años = 3.564€, no "99€". Por eso compensa invertir en retención.</p>
      <h3>5. El embudo de ventas (funnel)</h3>
      <p>Visitante → <b>lead</b> → oportunidad → cliente. En cada fase se pierde gente: si de 100 visitas salen 10 leads y 2 clientes, tu conversión visita-cliente es del 2%. Medir el embudo te dice <b>dónde</b> se rompe tu venta.</p>
      <h3>6. CRM: la memoria comercial de la empresa</h3>
      <p>Un <b>CRM</b> (Customer Relationship Management) guarda cada contacto, llamada, propuesta y estado de cada cliente. Sin CRM, la información vive en la cabeza del comercial; con CRM, la empresa no olvida nunca. HILO, de hecho, compite por ser parte del "CRM de personal" de una gestoría.</p>
      <h3>7. Fidelización práctica</h3>
      <ul>
        <li>Programas de recompensa (descuentos por antigüedad, niveles).</li>
        <li>Comunicación proactiva: avisar antes de que pregunten.</li>
        <li>Personalización: usar el historial para anticiparte.</li>
        <li>Pedir feedback y <b>actuar</b> sobre él (encuesta sin acción = postureo).</li>
      </ul>`,
    flashcards: [
      { q: "Fórmula de la satisfacción del cliente", a: "Experiencia vs. expectativa: si la experiencia supera lo esperado, hay satisfacción." },
      { q: "Los 5 pasos del protocolo de quejas", a: "Escuchar · agradecer/disculparse · resolver rápido · compensar si procede · seguimiento." },
      { q: "Paradoja de la recuperación", a: "Un cliente cuya queja se resuelve muy bien puede acabar más fiel que uno sin incidencias." },
      { q: "¿Cómo se calcula el NPS?", a: "% promotores (9-10) menos % detractores (0-6) al preguntar '¿nos recomendarías?'." },
      { q: "¿Qué es el CLV?", a: "Customer Lifetime Value: el beneficio total que genera un cliente durante toda su relación con la empresa." },
      { q: "Fases del embudo de ventas", a: "Visitante → lead → oportunidad → cliente. En cada fase se pierde un porcentaje." },
      { q: "¿Qué es un CRM y para qué sirve?", a: "Software que guarda todo el historial de relación con cada cliente: la 'memoria comercial' de la empresa." },
      { q: "¿Qué pesa más al resolver una queja?", a: "La velocidad de respuesta (más que la perfección de la solución)." },
      { q: "4 palancas de fidelización", a: "Recompensas, comunicación proactiva, personalización y actuar sobre el feedback." },
      { q: "¿Para qué sirve medir el embudo?", a: "Para saber en qué fase exacta se rompe tu proceso de venta y arreglarla." }
    ],
    exam: [
      { q: "La satisfacción aparece cuando…", opts: ["El precio es bajo", "La experiencia supera la expectativa", "El producto es nuevo", "Hay publicidad"], ok: 1, why: "Satisfacción = experiencia menos expectativa." },
      { q: "Primer paso ante una queja:", opts: ["Justificarse", "Escuchar sin interrumpir", "Ofrecer descuento", "Derivar a otro departamento"], ok: 1, why: "Sin escucha completa no hay diagnóstico ni desahogo." },
      { q: "De 200 encuestados: 120 dan 9-10, 40 dan 7-8, 40 dan 0-6. ¿NPS?", opts: ["60", "40", "80", "20"], ok: 1, why: "60% promotores − 20% detractores = 40." },
      { q: "Un cliente de 50€/mes durante 4 años tiene un CLV de…", opts: ["50€", "600€", "2.400€", "200€"], ok: 2, why: "50 × 12 × 4 = 2.400€. Piensa en valor de vida, no en la cuota." },
      { q: "La 'paradoja de la recuperación' dice que…", opts: ["Las quejas siempre hacen perder clientes", "Una queja bien resuelta puede fidelizar más que no tener problemas", "Compensar es tirar dinero", "Hay que evitar las encuestas"], ok: 1, why: "Resolver de forma excelente demuestra que respondes cuando importa." },
      { q: "Si de 100 visitas salen 10 leads y 2 clientes, la conversión visita→cliente es…", opts: ["10%", "2%", "20%", "5%"], ok: 1, why: "2 de 100 = 2%." },
      { q: "Sin CRM, el riesgo principal es que…", opts: ["No haya ventas", "La información del cliente viva solo en la cabeza del comercial", "El producto empeore", "Suba el NPS"], ok: 1, why: "Si el comercial se va o lo olvida, la empresa pierde la relación." },
      { q: "Una encuesta de satisfacción sin plan de acción es…", opts: ["Mejor que nada siempre", "Postureo: genera expectativas que luego frustras", "Obligatoria por ley", "Un sustituto del NPS"], ok: 1, why: "Pedir opinión y no actuar daña más que no preguntar." }
    ],
    exercises: [
      { type: "order", title: "Ordena el protocolo de quejas", items: ["Escuchar sin interrumpir", "Agradecer y disculparse", "Resolver rápido", "Compensar si procede", "Hacer seguimiento"] },
      { type: "tf", q: "El NPS se calcula sumando promotores y pasivos.", ok: false, why: "Es % promotores MENOS % detractores; los pasivos no cuentan." },
      { type: "fill", q: "El beneficio total que genera un cliente en toda su relación contigo se llama (siglas)…", accept: ["clv", "el clv"], why: "Customer Lifetime Value." },
      { type: "match", title: "Empareja", pairs: [["NPS", "Promotores − detractores"], ["CLV", "Valor de vida del cliente"], ["CRM", "Historial de la relación"], ["Funnel", "Visitante → cliente"]] },
      { type: "tf", q: "Al resolver una queja, la rapidez suele pesar más que la perfección.", ok: true, why: "El cliente valora sentirse atendido ya." }
    ],
    cases: [
      { id: "caso-c3", title: "El cliente enfadado", intro: "Una gestoría cliente de HILO te escribe en mayúsculas: un fallo del sistema duplicó 12 contratos y su clienta (un hotel) está furiosa.",
        steps: [
          { text: "Su primer mensaje es muy agresivo. ¿Respuesta?", opts: [
            { t: "'No es para tanto, se arregla en un momento.'", good: 0, fb: "Minimizar su problema multiplica su enfado." },
            { t: "'Tienes toda la razón en estar molesto. Cuéntame exactamente qué ha pasado y lo arreglo ya.'", good: 2, fb: "Validas la emoción, escuchas y te pones en acción." },
            { t: "'Eso es culpa de cómo lo configurasteis.'", good: 1, fb: "Aunque fuera verdad, ahora toca resolver; el reparto de culpas, después." }] },
          { text: "Confirmas el fallo. ¿Siguiente paso?", opts: [
            { t: "Resolver hoy mismo y avisarle de cada avance sin que pregunte.", good: 2, fb: "Velocidad + comunicación proactiva: oro." },
            { t: "Abrir un ticket y que espere al procedimiento estándar (72h).", good: 0, fb: "Procedimiento correcto, cliente perdido." },
            { t: "Resolverlo y no decir nada hasta acabar.", good: 1, fb: "Resolver bien, pero el silencio durante horas alimenta su ansiedad." }] },
          { text: "Resuelto en 3 horas. ¿Cierras ahí?", opts: [
            { t: "Sí, problema resuelto, a otra cosa.", good: 1, fb: "Falta el seguimiento y quizá un gesto: es la fase que fideliza." },
            { t: "Le compensas con un mes gratis y le llamas en 2 días para confirmar que todo va bien.", good: 2, fb: "Compensación + seguimiento = paradoja de la recuperación a tu favor." },
            { t: "Le pides que borre la reseña negativa que puso.", good: 0, fb: "Primero recupera su confianza; la reseña, si acaso, la cambiará él solo." }] }
        ] }
    ]
  }
  ]
},

// ============================================================
// MÓDULO LABORAL
// ============================================================
{
  id: "laboral", name: "Laboral", color: "#7A5230", icon: "📋",
  lessons: [

  // ---------- L1 ----------
  {
    id: "lab-l1",
    title: "L1 · El contrato de trabajo",
    minutes: 25,
    html: `
      <h3>1. Qué hace que algo sea relación laboral</h3>
      <p>Hay contrato de trabajo cuando se dan 4 notas a la vez: <b>voluntariedad</b>, <b>ajenidad</b> (los frutos del trabajo son de la empresa), <b>dependencia</b> (trabajas bajo organización y dirección de otro) y <b>retribución</b>. Si faltan, no es laboral (ej.: un autónomo de verdad no tiene dependencia).</p>
      <h3>2. La pirámide de normas</h3>
      <p>El <b>Estatuto de los Trabajadores (ET)</b> fija los mínimos. Los <b>convenios colectivos</b> (como el de hostelería de Baleares que ya conoces) los mejoran por sector o empresa. El contrato individual puede mejorar el convenio, nunca empeorarlo.</p>
      <h3>3. Capacidad y forma</h3>
      <ul>
        <li>Edad mínima: <b>16 años</b> (entre 16 y 18, con autorización de padres o tutores si no está emancipado). Menores de 18: prohibidos nocturnos, horas extra y trabajos peligrosos.</li>
        <li>Forma: puede ser verbal o escrito, pero casi todos deben ser <b>por escrito</b> (temporales, a tiempo parcial, formativos…). Si no se formaliza por escrito cuando es exigible, se presume <b>indefinido y a jornada completa</b>.</li>
      </ul>
      <h3>4. Periodo de prueba</h3>
      <p>Pactado por escrito. Máximos del ET (si el convenio no dice otra cosa): <b>6 meses</b> para técnicos titulados, <b>2 meses</b> para el resto (3 en empresas de menos de 25 trabajadores). Durante la prueba, cualquiera puede romper sin indemnización ni preaviso.</p>
      <h3>5. Tipos de contrato (tras la reforma laboral de 2021/22)</h3>
      <ul>
        <li><b>Indefinido</b>: la regla general. El contrato se <b>presume indefinido</b>.</li>
        <li><b>Temporal</b> solo por dos causas: <b>circunstancias de la producción</b> (picos imprevisibles, máx. 6 meses ampliable a 12 por convenio; o situaciones previsibles muy cortas) y <b>sustitución</b> de una persona con reserva de puesto.</li>
        <li><b>Fijo-discontinuo</b>: indefinido para trabajos <b>estacionales</b> que se repiten — el contrato estrella de la hostelería de Ibiza: cada temporada hay llamamiento.</li>
        <li><b>Formativos</b>: en alternancia (compaginar trabajo y estudios) y para la obtención de práctica profesional (tras el título).</li>
      </ul>
      <div class="keybox">⚠️ El abuso de temporales encadenados o sin causa convierte el contrato en <b>indefinido</b> (y puede acarrear sanciones a la empresa).</div>
      <h3>6. Contenido mínimo</h3>
      <p>Identificación de las partes, fecha de inicio (y duración si es temporal), grupo profesional y funciones, centro de trabajo, jornada y horario, salario y pagas, vacaciones (mínimo <b>30 días naturales</b>/año), plazos de preaviso y convenio aplicable.</p>`,
    flashcards: [
      { q: "Las 4 notas de la relación laboral", a: "Voluntariedad, ajenidad, dependencia y retribución. Si falta alguna, no es relación laboral." },
      { q: "¿Qué es la ajenidad?", a: "Los frutos del trabajo pertenecen a la empresa, no al trabajador (que cobra un salario a cambio)." },
      { q: "¿Qué norma fija los mínimos laborales en España?", a: "El Estatuto de los Trabajadores. Los convenios colectivos lo mejoran; el contrato puede mejorar el convenio, nunca empeorarlo." },
      { q: "Edad mínima para trabajar", a: "16 años (con autorización de padres/tutores hasta los 18 si no está emancipado). Menores de 18: sin nocturnos, sin horas extra, sin trabajos peligrosos." },
      { q: "Si un contrato que debía ser escrito no se formaliza…", a: "Se presume celebrado por tiempo indefinido y a jornada completa." },
      { q: "Periodo de prueba: máximos del ET", a: "6 meses técnicos titulados; 2 meses el resto (3 en empresas de menos de 25 trabajadores). Siempre por escrito." },
      { q: "¿Qué se puede hacer durante el periodo de prueba?", a: "Cualquiera de las partes puede romper el contrato sin indemnización ni preaviso." },
      { q: "Las 2 únicas causas de contrato temporal", a: "Circunstancias de la producción y sustitución de persona trabajadora." },
      { q: "Duración del temporal por circunstancias de la producción", a: "Máximo 6 meses, ampliable hasta 12 por convenio colectivo." },
      { q: "¿Qué es el contrato fijo-discontinuo?", a: "Contrato indefinido para trabajos estacionales que se repiten: cada temporada la empresa hace el llamamiento. El típico de la hostelería balear." },
      { q: "Los 2 contratos formativos", a: "Formación en alternancia (trabajo + estudios) y obtención de práctica profesional (tras el título)." },
      { q: "Vacaciones mínimas legales", a: "30 días naturales al año (el convenio puede mejorarlas)." }
    ],
    exam: [
      { q: "NO es una nota de la relación laboral:", opts: ["Dependencia", "Ajenidad", "Tener título universitario", "Retribución"], ok: 2, why: "Las notas son voluntariedad, ajenidad, dependencia y retribución." },
      { q: "Un contrato temporal que debía ser escrito y se hizo verbal…", opts: ["Es nulo", "Se presume indefinido y a jornada completa", "Vale igual", "Dura máximo 1 mes"], ok: 1, why: "La falta de forma escrita exigible activa la presunción de indefinido a jornada completa." },
      { q: "Periodo de prueba máximo para un camarero (ET, empresa de 40 trabajadores):", opts: ["6 meses", "2 meses", "1 año", "15 días"], ok: 1, why: "No es técnico titulado y la empresa tiene 25 o más trabajadores: 2 meses (salvo que el convenio diga otra cosa)." },
      { q: "Desde la reforma laboral, el contrato se presume…", opts: ["Temporal", "Indefinido", "Formativo", "A tiempo parcial"], ok: 1, why: "La temporalidad necesita causa justificada; la regla general es el indefinido." },
      { q: "Un hotel de Ibiza que abre de mayo a octubre cada año debería usar…", opts: ["Temporales encadenados cada año", "Fijo-discontinuo", "Contrato de prácticas", "Contrato verbal"], ok: 1, why: "Trabajo estacional que se repite = fijo-discontinuo con llamamiento cada temporada." },
      { q: "El temporal por circunstancias de la producción dura como máximo…", opts: ["3 meses", "6 meses (12 por convenio)", "2 años", "Sin límite"], ok: 1, why: "6 meses ampliables a 12 si el convenio del sector lo permite." },
      { q: "Un menor de 18 años NO puede…", opts: ["Trabajar en hostelería", "Hacer horas extraordinarias", "Cobrar convenio", "Tener contrato indefinido"], ok: 1, why: "Prohibidos: nocturnos, horas extra y trabajos peligrosos." },
      { q: "¿Quién puede mejorar lo que dice el Estatuto?", opts: ["Nadie", "El convenio colectivo y el contrato individual", "Solo el Gobierno", "Solo los jueces"], ok: 1, why: "ET = mínimos; convenio y contrato solo pueden mejorar." },
      { q: "Durante el periodo de prueba…", opts: ["Solo la empresa puede desistir", "Cualquiera puede romper sin indemnización", "Hay que preavisar 15 días", "No se cotiza"], ok: 1, why: "Libre desistimiento de ambas partes; eso sí, se cotiza y se cobra con normalidad." },
      { q: "Contratar con temporales sin causa real provoca que…", opts: ["No pase nada", "El contrato se convierta en indefinido y haya posibles sanciones", "Se anule el contrato", "Baje la cotización"], ok: 1, why: "El fraude en la contratación temporal se castiga con la conversión en indefinido." }
    ],
    exercises: [
      { type: "match", title: "Cada situación con su contrato", pairs: [["Camarera cada verano en el mismo hotel", "Fijo-discontinuo"], ["Cubrir una baja por maternidad", "Sustitución"], ["Pico imprevisto de pedidos 3 meses", "Circunstancias de la producción"], ["Recién titulado para aprender el oficio", "Práctica profesional"]] },
      { type: "tf", q: "El contrato individual puede establecer condiciones peores que el convenio si el trabajador firma.", ok: false, why: "Nunca: el convenio es un suelo de derechos irrenunciable." },
      { type: "tf", q: "Un fijo-discontinuo es un tipo de contrato indefinido.", ok: true, why: "Indefinido para actividad estacional, con llamamiento cada temporada." },
      { type: "fill", q: "Norma básica que regula la relación laboral en España: Estatuto de los…", accept: ["trabajadores", "los trabajadores"], why: "El Estatuto de los Trabajadores." },
      { type: "fill", q: "Las vacaciones legales mínimas son de … días naturales al año (número).", accept: ["30", "treinta"], why: "30 días naturales (mejorables por convenio)." },
      { type: "order", title: "Ordena la jerarquía de normas (de la base al detalle)", items: ["Estatuto de los Trabajadores", "Convenio colectivo del sector", "Convenio de empresa / pactos", "Contrato individual"] }
    ],
    cases: []
  },

  // ---------- L2 ----------
  {
    id: "lab-l2",
    title: "L2 · La nómina: entenderla línea a línea",
    minutes: 28,
    html: `
      <h3>1. El mapa de la nómina</h3>
      <p>Toda nómina tiene 3 bloques: <b>devengos</b> (lo que sumas), <b>deducciones</b> (lo que te restan) y <b>bases de cotización</b> (sobre qué se calculan las cuotas). <b>Líquido a percibir = devengos − deducciones</b>.</p>
      <h3>2. Devengos: salariales y no salariales</h3>
      <ul>
        <li><b>Salariales</b> (cotizan y tributan): salario base, complementos (antigüedad, nocturnidad, idiomas, peligrosidad…), horas extra, pagas extraordinarias y salario en especie (máximo el <b>30%</b> del total salarial).</li>
        <li><b>No salariales</b> (compensan gastos; exentos dentro de límites): dietas y gastos de locomoción, plus de transporte, indemnizaciones.</li>
      </ul>
      <h3>3. Las pagas extraordinarias</h3>
      <p>Mínimo <b>2 al año</b> (una en Navidad y otra cuando fije el convenio). Pueden <b>prorratearse</b>: repartirse mes a mes en la nómina. Ojo: aunque no se prorrateen en el cobro, <b>siempre se prorratean en la base de cotización</b>.</p>
      <h3>4. Bases de cotización</h3>
      <ul>
        <li><b>Base de contingencias comunes (BCCC)</b>: salario mensual + prorrata de pagas extra (sin horas extra).</li>
        <li><b>Base de contingencias profesionales (BCCP)</b>: lo mismo <b>más</b> las horas extra.</li>
        <li>Existen bases mínimas y máximas por grupo de cotización, que se actualizan cada año.</li>
      </ul>
      <h3>5. Deducciones del trabajador</h3>
      <p>Porcentajes orientativos que se aplican sobre las bases (se actualizan por ley):</p>
      <ul>
        <li><b>Contingencias comunes: 4,70%</b> de la BCCC.</li>
        <li><b>Desempleo: 1,55%</b> (algo más en temporales).</li>
        <li><b>Formación profesional: 0,10%</b>.</li>
        <li><b>MEI</b> (Mecanismo de Equidad Intergeneracional): un porcentaje pequeño que sube gradualmente cada año (en 2026 ronda el 0,9% total, la mayor parte a cargo de la empresa).</li>
        <li><b>IRPF</b>: retención a cuenta de Hacienda; el % depende del salario y la situación personal y familiar.</li>
      </ul>
      <div class="keybox">💡 La empresa paga ADEMÁS sus propias cuotas (mucho mayores: en torno al 30% extra sobre la base). Por eso el "coste de empresa" es muy superior al bruto del trabajador.</div>
      <h3>6. Bruto vs. neto</h3>
      <p><b>Bruto</b>: total de devengos. <b>Neto (líquido)</b>: lo que llega al banco tras deducciones. El SMI marca el suelo salarial y se actualiza cada año por el Gobierno; el convenio (como el de hostelería de Baleares) fija tablas superiores por categoría.</p>
      <h3>7. Errores típicos que verás en la gestoría</h3>
      <ul>
        <li>Pluses salariales camuflados como "no salariales" para cotizar menos (sancionable).</li>
        <li>Olvidar la prorrata de pagas en la base.</li>
        <li>Horas extra metidas en la BCCC (van solo en la BCCP y con su cotización adicional propia).</li>
        <li>IRPF mal calculado al cambiar la situación familiar y no comunicarlo (modelo 145).</li>
      </ul>`,
    flashcards: [
      { q: "Estructura de la nómina (3 bloques)", a: "Devengos (suman), deducciones (restan) y bases de cotización. Líquido = devengos − deducciones." },
      { q: "Devengos salariales vs. no salariales", a: "Salariales: retribuyen el trabajo y cotizan (base, complementos, extras, pagas). No salariales: compensan gastos (dietas, transporte) y están exentos dentro de límites." },
      { q: "Tope del salario en especie", a: "Máximo el 30% de las percepciones salariales totales." },
      { q: "Pagas extraordinarias: mínimo legal", a: "Dos al año (Navidad + la que fije el convenio). Pueden prorratearse mes a mes." },
      { q: "¿Qué entra en la base de contingencias comunes?", a: "Salario mensual + prorrata de pagas extra. Las horas extra NO entran." },
      { q: "¿En qué base entran las horas extra?", a: "En la base de contingencias profesionales (y llevan cotización adicional propia)." },
      { q: "% del trabajador por contingencias comunes", a: "4,70% de la base de contingencias comunes." },
      { q: "¿Qué es el MEI?", a: "Mecanismo de Equidad Intergeneracional: pequeño porcentaje extra para la hucha de las pensiones, que sube gradualmente cada año (mayor parte a cargo de la empresa)." },
      { q: "¿De qué depende el % de IRPF en nómina?", a: "Del salario y de la situación personal y familiar (se comunica con el modelo 145)." },
      { q: "Bruto vs. neto", a: "Bruto = total devengos. Neto/líquido = lo que llega al banco tras deducciones." },
      { q: "¿Por qué el coste de empresa supera al bruto?", a: "Porque la empresa paga además sus propias cuotas (en torno a un 30% extra sobre la base)." },
      { q: "¿Las pagas extra cotizan aunque no se prorrateen en el cobro?", a: "Sí: en la base de cotización siempre van prorrateadas mes a mes." }
    ],
    exam: [
      { q: "Líquido a percibir =", opts: ["Devengos + deducciones", "Devengos − deducciones", "Base − IRPF", "Salario base × 12"], ok: 1, why: "Lo que suma menos lo que resta." },
      { q: "¿Cuál es percepción NO salarial?", opts: ["Plus de nocturnidad", "Dieta por comida en desplazamiento", "Horas extra", "Paga de Navidad"], ok: 1, why: "Las dietas compensan gastos: no retribuyen trabajo." },
      { q: "El salario en especie no puede superar…", opts: ["El 10% del salario", "El 30% de las percepciones salariales", "El 50% del neto", "No tiene límite"], ok: 1, why: "Tope legal del 30%." },
      { q: "En la base de contingencias comunes NO entra…", opts: ["El salario base", "La prorrata de pagas", "Las horas extraordinarias", "El plus de antigüedad"], ok: 2, why: "Las horas extra van a la base de contingencias profesionales." },
      { q: "El trabajador cotiza por contingencias comunes un…", opts: ["6,35%", "4,70%", "23,60%", "1,55%"], ok: 1, why: "4,70% (el 23,60% es la parte de la empresa)." },
      { q: "El MEI es…", opts: ["Un impuesto municipal", "Una cotización extra finalista para las pensiones que sube cada año", "Un plus de convenio", "Una retención de IRPF"], ok: 1, why: "Mecanismo de Equidad Intergeneracional." },
      { q: "Trabajador con 1.500€/mes y 2 pagas de 1.500€: su prorrata mensual de pagas es…", opts: ["125€", "250€", "300€", "1.500€"], ok: 1, why: "3.000€ anuales de pagas ÷ 12 meses = 250€/mes en la base." },
      { q: "El % de IRPF de cada trabajador depende de…", opts: ["Solo del convenio", "De su salario y situación personal/familiar", "De la edad", "Del banco donde cobra"], ok: 1, why: "Por eso se rellena el modelo 145 y se recalcula al cambiar la situación." },
      { q: "Camuflar un plus salarial como 'no salarial' sirve para…", opts: ["Nada, es neutro", "Cotizar menos: es fraude sancionable", "Subir el neto legalmente", "Mejorar el convenio"], ok: 1, why: "Reduce bases artificialmente: la Inspección lo sanciona y regulariza." },
      { q: "El SMI…", opts: ["Lo fija cada empresa", "Es el suelo salarial legal y se actualiza cada año", "Solo aplica a indefinidos", "Incluye las dietas"], ok: 1, why: "Suelo estatal anual; los convenios fijan tablas por encima." }
    ],
    exercises: [
      { type: "match", title: "Clasifica cada concepto", pairs: [["Plus de nocturnidad", "Devengo salarial"], ["Dieta de desplazamiento", "Devengo no salarial"], ["IRPF", "Deducción"], ["Cuota de desempleo", "Deducción"]] },
      { type: "tf", q: "Las horas extra entran en la base de contingencias comunes.", ok: false, why: "Van en la de contingencias profesionales, con cotización adicional." },
      { type: "tf", q: "Aunque cobres las pagas extra en junio y diciembre, cotizan prorrateadas cada mes.", ok: true, why: "La base siempre incluye la prorrata." },
      { type: "fill", q: "El trabajador cotiza por contingencias comunes el …% (con coma).", accept: ["4,70", "4,7", "4.70", "4.7"], why: "4,70% de la BCCC." },
      { type: "fill", q: "El documento donde comunicas tu situación familiar para el IRPF es el modelo…", accept: ["145", "modelo 145"], why: "Modelo 145." },
      { type: "order", title: "Ordena el cálculo de una nómina", items: ["Sumar devengos", "Calcular bases de cotización", "Aplicar cuotas del trabajador", "Aplicar retención de IRPF", "Obtener líquido a percibir"] }
    ],
    cases: []
  }
  ]
},

// ============================================================
// MÓDULO CONTABLE
// ============================================================
{
  id: "contable", name: "Contable", color: "#B97F24", icon: "🧮",
  lessons: [
  {
    id: "con-l1",
    title: "CO1 · El patrimonio y la partida doble",
    minutes: 26,
    html: `
      <h3>1. Qué es el patrimonio</h3>
      <p><b>Patrimonio = bienes + derechos − obligaciones</b>. Un bar de Ibiza: la cafetera y el local son <b>bienes</b>; lo que le deben los clientes de empresa, <b>derechos</b>; el préstamo del banco, <b>obligaciones</b>.</p>
      <h3>2. Las tres masas patrimoniales</h3>
      <ul>
        <li><b>ACTIVO</b> = bienes + derechos (lo que la empresa <b>tiene</b> y le <b>deben</b>). Se divide en <b>no corriente</b> (más de un año: maquinaria, local) y <b>corriente</b> (menos de un año: existencias, clientes, bancos, caja).</li>
        <li><b>PASIVO</b> = obligaciones con terceros (préstamos, proveedores, Hacienda).</li>
        <li><b>PATRIMONIO NETO</b> = lo que de verdad es de los dueños (capital aportado + beneficios retenidos).</li>
      </ul>
      <div class="keybox">📐 Ecuación fundamental: <b>ACTIVO = PASIVO + PATRIMONIO NETO</b>. Siempre. Todo lo que la empresa tiene (activo) se financió con deuda (pasivo) o con dinero propio (neto).</div>
      <h3>3. La cuenta: Debe y Haber</h3>
      <p>Cada elemento (Caja, Bancos, Proveedores…) tiene su <b>cuenta</b>, con dos columnas: <b>Debe</b> (izquierda) y <b>Haber</b> (derecha). Anotar en el Debe = <b>cargar</b>; en el Haber = <b>abonar</b>. Son solo convenios, no significan "bueno" o "malo".</p>
      <h3>4. Las reglas de oro del cargo y abono</h3>
      <ul>
        <li>Cuentas de <b>ACTIVO</b>: nacen y aumentan por el <b>Debe</b>; disminuyen por el Haber.</li>
        <li>Cuentas de <b>PASIVO y NETO</b>: nacen y aumentan por el <b>Haber</b>; disminuyen por el Debe.</li>
        <li><b>GASTOS</b>: se anotan en el <b>Debe</b>. <b>INGRESOS</b>: en el <b>Haber</b>.</li>
      </ul>
      <h3>5. La partida doble</h3>
      <p>Principio genial de hace 500 años: <b>toda operación toca al menos dos cuentas</b>, y la suma del Debe siempre iguala a la del Haber. Ejemplo: compras una cafetera de 1.000€ pagando por banco → cargas Maquinaria (activo que aumenta, Debe 1.000) y abonas Bancos (activo que disminuye, Haber 1.000). Cuadra.</p>
      <h3>6. El PGC y sus libros</h3>
      <ul>
        <li>El <b>Plan General de Contabilidad</b> es el reglamento contable español. Su cuadro de cuentas tiene grupos: <b>1</b> Financiación básica, <b>2</b> Activo no corriente, <b>3</b> Existencias, <b>4</b> Acreedores y deudores, <b>5</b> Cuentas financieras, <b>6</b> Compras y gastos, <b>7</b> Ventas e ingresos.</li>
        <li>Libros: <b>Diario</b> (asientos día a día) y <b>Mayor</b> (la película de cada cuenta).</li>
        <li><b>Cuentas anuales</b>: balance, cuenta de pérdidas y ganancias, estado de cambios en el patrimonio neto, estado de flujos de efectivo y memoria (las pymes pueden limitarse a balance, PyG y memoria).</li>
      </ul>
      <h3>7. El resultado</h3>
      <p><b>Resultado = ingresos − gastos</b>. Si es positivo (beneficio) engorda el patrimonio neto; si es negativo (pérdida), lo reduce.</p>`,
    flashcards: [
      { q: "Fórmula del patrimonio", a: "Patrimonio = bienes + derechos − obligaciones." },
      { q: "¿Qué es el ACTIVO?", a: "Bienes + derechos: lo que la empresa tiene y lo que le deben. Se divide en no corriente (>1 año) y corriente (<1 año)." },
      { q: "¿Qué es el PASIVO?", a: "Las obligaciones con terceros: préstamos, proveedores, deudas con Hacienda…" },
      { q: "¿Qué es el PATRIMONIO NETO?", a: "La parte que pertenece a los dueños: capital aportado + beneficios retenidos. Es activo menos pasivo." },
      { q: "Ecuación fundamental de la contabilidad", a: "ACTIVO = PASIVO + PATRIMONIO NETO. Siempre cuadra." },
      { q: "¿Qué es cargar y abonar?", a: "Cargar = anotar en el Debe (izquierda). Abonar = anotar en el Haber (derecha)." },
      { q: "¿Cómo se mueven las cuentas de ACTIVO?", a: "Nacen y aumentan por el Debe; disminuyen por el Haber." },
      { q: "¿Cómo se mueven PASIVO y NETO?", a: "Nacen y aumentan por el Haber; disminuyen por el Debe." },
      { q: "¿Dónde van gastos e ingresos?", a: "Gastos al Debe; ingresos al Haber." },
      { q: "¿Qué dice la partida doble?", a: "Toda operación toca al menos dos cuentas y la suma del Debe iguala siempre a la del Haber." },
      { q: "Grupos 6 y 7 del PGC", a: "Grupo 6: compras y gastos. Grupo 7: ventas e ingresos." },
      { q: "Libro Diario vs. libro Mayor", a: "Diario: los asientos en orden cronológico. Mayor: el detalle de movimientos de cada cuenta." },
      { q: "Las cuentas anuales del PGC", a: "Balance, PyG, estado de cambios en el PN, estado de flujos de efectivo y memoria (pymes: balance, PyG y memoria)." },
      { q: "¿Qué pasa con el beneficio?", a: "Resultado = ingresos − gastos. El beneficio aumenta el patrimonio neto; la pérdida lo reduce." }
    ],
    exam: [
      { q: "El dinero que los clientes deben a la empresa es…", opts: ["Un bien", "Un derecho (activo)", "Una obligación (pasivo)", "Patrimonio neto"], ok: 1, why: "Derecho de cobro: activo corriente (cuenta Clientes)." },
      { q: "ACTIVO = …", opts: ["PASIVO − NETO", "PASIVO + PATRIMONIO NETO", "NETO − PASIVO", "INGRESOS − GASTOS"], ok: 1, why: "Lo que tienes se financió con deuda o con fondos propios." },
      { q: "Una furgoneta de reparto es…", opts: ["Activo corriente", "Activo no corriente", "Pasivo", "Gasto"], ok: 1, why: "Permanece más de un año en la empresa." },
      { q: "Las cuentas de activo aumentan por…", opts: ["El Haber", "El Debe", "Ambos", "Ninguno"], ok: 1, why: "Activo: nace y crece por el Debe." },
      { q: "Un préstamo bancario recibido se refleja como…", opts: ["Gasto", "Pasivo que nace por el Haber", "Ingreso", "Activo no corriente"], ok: 1, why: "Es una obligación: pasivo, y los pasivos nacen por el Haber (y entra dinero: Bancos al Debe)." },
      { q: "Pagas 200€ de luz por banco. El asiento correcto:", opts: ["Debe Bancos / Haber Suministros", "Debe Suministros / Haber Bancos", "Debe Caja / Haber Bancos", "Debe Suministros / Haber Proveedores"], ok: 1, why: "El gasto (suministros) al Debe; el banco disminuye por el Haber." },
      { q: "En todo asiento…", opts: ["El Debe puede superar al Haber", "Debe y Haber suman lo mismo", "Solo se usa una cuenta", "Los gastos van al Haber"], ok: 1, why: "Es la esencia de la partida doble." },
      { q: "El grupo 7 del PGC recoge…", opts: ["Gastos", "Ventas e ingresos", "Existencias", "Bancos"], ok: 1, why: "Grupo 7 = ventas e ingresos; el 6 son compras y gastos." },
      { q: "Una pyme puede presentar como cuentas anuales mínimas…", opts: ["Solo el balance", "Balance, PyG y memoria", "Solo la memoria", "Balance y flujos de efectivo"], ok: 1, why: "El PGC de pymes permite limitarse a esos tres documentos." },
      { q: "Si los ingresos del año son 80.000€ y los gastos 65.000€…", opts: ["Pérdida de 15.000", "Beneficio de 15.000 que aumenta el neto", "Beneficio de 145.000", "No afecta al patrimonio"], ok: 1, why: "Resultado = 80.000 − 65.000 = +15.000 → engorda el patrimonio neto." }
    ],
    exercises: [
      { type: "match", title: "Clasifica cada elemento", pairs: [["Local del negocio", "Activo no corriente"], ["Deuda con proveedores", "Pasivo"], ["Capital aportado por socios", "Patrimonio neto"], ["Dinero en el banco", "Activo corriente"]] },
      { type: "match", title: "¿Debe o Haber?", pairs: [["Aumenta el activo", "Debe"], ["Aumenta el pasivo", "Haber"], ["Un gasto", "Debe"], ["Un ingreso", "Haber"]] },
      { type: "tf", q: "En un asiento correcto, el total del Debe siempre iguala al del Haber.", ok: true, why: "Partida doble: si no cuadra, hay error." },
      { type: "tf", q: "'Cargar' una cuenta significa anotar en el Haber.", ok: false, why: "Cargar = Debe; abonar = Haber." },
      { type: "fill", q: "Activo = Pasivo + …", accept: ["patrimonio neto", "neto", "el patrimonio neto", "pn"], why: "La ecuación fundamental." },
      { type: "order", title: "Ordena el ciclo contable básico", items: ["Operación del día a día", "Asiento en el Diario", "Traspaso al Mayor", "Cuentas anuales a fin de ejercicio"] }
    ],
    cases: []
  }
  ]
},

// ============================================================
// MÓDULO LEGAL / MERCANTIL
// ============================================================
{
  id: "legal", name: "Legal / Mercantil", color: "#5A5244", icon: "⚖️",
  lessons: [
  {
    id: "leg-l1",
    title: "LE1 · Formas jurídicas de la empresa",
    minutes: 22,
    html: `
      <h3>1. La decisión que lo condiciona todo</h3>
      <p>Elegir forma jurídica determina <b>cuánto arriesgas</b> (responsabilidad), <b>cuánto necesitas</b> (capital), <b>cómo tributas</b> (IRPF o Impuesto de Sociedades) y cómo se toman las decisiones.</p>
      <h3>2. Empresario individual (autónomo)</h3>
      <ul>
        <li>Sin capital mínimo, trámites rápidos y baratos.</li>
        <li><b>Responsabilidad ilimitada</b>: responde con TODO su patrimonio personal (con alguna protección para la vivienda habitual si se acoge a la figura del emprendedor de responsabilidad limitada).</li>
        <li>Tributa por <b>IRPF</b> (progresivo: cuanto más ganas, mayor porcentaje).</li>
        <li>No tiene personalidad jurídica separada: empresa y persona son lo mismo.</li>
      </ul>
      <h3>3. Sociedad Limitada (SL): la reina de las pymes</h3>
      <ul>
        <li>Desde la Ley Crea y Crece (2022): capital mínimo de <b>1€</b> (aunque con obligaciones especiales hasta alcanzar 3.000€, como destinar parte del beneficio a reserva legal).</li>
        <li><b>Responsabilidad limitada</b>: los socios solo arriesgan lo aportado.</li>
        <li>Capital dividido en <b>participaciones</b> (no se transmiten libremente: los socios tienen preferencia).</li>
        <li>Tributa por <b>Impuesto de Sociedades</b> (tipo general del 25%, con tipos reducidos para nuevas empresas y micropymes).</li>
        <li>Personalidad jurídica propia: la sociedad contrata, debe y posee por sí misma.</li>
      </ul>
      <h3>4. Sociedad Anónima (SA)</h3>
      <ul>
        <li>Capital mínimo <b>60.000€</b> (desembolso mínimo del 25% al constituir).</li>
        <li>Capital en <b>acciones</b>, libremente transmisibles → pensada para grandes empresas y para cotizar en bolsa.</li>
        <li>Responsabilidad limitada y tributación por Sociedades, como la SL.</li>
      </ul>
      <h3>5. Otras formas</h3>
      <ul>
        <li><b>Cooperativa</b>: los socios son a la vez dueños y trabajadores; gestión democrática (una persona, un voto); fiscalidad ventajosa.</li>
        <li><b>Sociedad civil / comunidad de bienes</b>: varias personas sin crear sociedad mercantil; simples, pero con <b>responsabilidad ilimitada</b>.</li>
      </ul>
      <div class="keybox">💡 Para HILO: mientras valides, autónomo es lo ágil; en cuanto haya clientes y riesgo real (contratos, datos de empleados), una SL separa tu patrimonio personal del negocio.</div>
      <h3>6. Cómo elegir: 4 preguntas</h3>
      <ul>
        <li>¿Cuánto riesgo asumo? → mucha deuda o responsabilidad = sociedad (limitada).</li>
        <li>¿Cuántos somos? → varios socios = sociedad casi siempre.</li>
        <li>¿Cuánto beneficio espero? → a partir de cierto nivel, el IS (25%) sale mejor que los tramos altos del IRPF.</li>
        <li>¿Necesito imagen/inversores? → la SL (o SA) da seriedad y permite dar entrada a socios.</li>
      </ul>`,
    flashcards: [
      { q: "Las 4 cosas que determina la forma jurídica", a: "Responsabilidad (cuánto arriesgas), capital necesario, fiscalidad (IRPF vs. IS) y forma de tomar decisiones." },
      { q: "Responsabilidad del empresario individual", a: "Ilimitada: responde con todo su patrimonio personal presente y futuro." },
      { q: "¿Cómo tributa el autónomo?", a: "Por IRPF (progresivo: a más beneficio, mayor porcentaje)." },
      { q: "Capital mínimo de la SL", a: "1€ desde la Ley Crea y Crece (2022), con obligaciones especiales hasta llegar a 3.000€." },
      { q: "Responsabilidad en la SL", a: "Limitada: los socios solo arriesgan lo que aportaron." },
      { q: "¿Cómo se divide el capital de una SL?", a: "En participaciones, que no se transmiten libremente (preferencia de los socios)." },
      { q: "Capital mínimo de la SA", a: "60.000€, con desembolso mínimo del 25% al constituirla." },
      { q: "¿Cómo se divide el capital de una SA?", a: "En acciones, libremente transmisibles (por eso es la forma de las empresas cotizadas)." },
      { q: "¿Qué impuesto pagan SL y SA?", a: "El Impuesto de Sociedades (tipo general 25%, con reducciones para nuevas empresas y micropymes)." },
      { q: "¿Qué es la personalidad jurídica propia?", a: "La sociedad es un 'sujeto' distinto de sus socios: contrata, posee y debe por sí misma." },
      { q: "Rasgo distintivo de la cooperativa", a: "Los socios son dueños y trabajadores a la vez, con gestión democrática: una persona, un voto." },
      { q: "Riesgo de la sociedad civil / comunidad de bienes", a: "Es simple de crear, pero la responsabilidad de los socios es ilimitada." }
    ],
    exam: [
      { q: "Un autónomo con deudas del negocio responde con…", opts: ["Solo el dinero del negocio", "Todo su patrimonio personal", "Nada", "Solo hasta 3.000€"], ok: 1, why: "Responsabilidad ilimitada: no hay separación de patrimonios." },
      { q: "Capital mínimo para constituir una SL hoy:", opts: ["3.000€", "1€ (con condiciones hasta los 3.000€)", "60.000€", "No existe la cifra"], ok: 1, why: "Ley Crea y Crece 2022: 1€ con obligaciones especiales (reserva legal reforzada)." },
      { q: "El capital de la SA se divide en…", opts: ["Participaciones", "Acciones", "Cuotas", "Bonos"], ok: 1, why: "Acciones libremente transmisibles; la SL usa participaciones." },
      { q: "¿Qué forma exige 60.000€ de capital mínimo?", opts: ["SL", "SA", "Cooperativa", "Autónomo"], ok: 1, why: "La Sociedad Anónima (desembolsando al menos el 25% al inicio)." },
      { q: "Las sociedades mercantiles tributan por…", opts: ["IRPF", "Impuesto de Sociedades", "IVA solamente", "No tributan"], ok: 1, why: "IS, tipo general del 25% (con reducciones para nuevas empresas)." },
      { q: "'Una persona, un voto' es propio de…", opts: ["La SA", "La cooperativa", "La SL", "El autónomo"], ok: 1, why: "Gestión democrática: seña de identidad cooperativa." },
      { q: "La gran ventaja de la SL frente al autónomo es…", opts: ["Pagar menos IVA", "Separar el patrimonio personal del empresarial", "No llevar contabilidad", "No tener que facturar"], ok: 1, why: "La responsabilidad limitada protege tu casa y tus ahorros." },
      { q: "Una sociedad civil…", opts: ["Limita la responsabilidad", "Es simple pero con responsabilidad ilimitada de los socios", "Necesita 60.000€", "Solo puede tener un socio"], ok: 1, why: "Simplicidad a cambio de responder con el patrimonio personal." }
    ],
    exercises: [
      { type: "match", title: "Cada característica con su forma", pairs: [["Capital en acciones", "SA"], ["Capital en participaciones", "SL"], ["Una persona, un voto", "Cooperativa"], ["Responsabilidad ilimitada", "Autónomo"]] },
      { type: "tf", q: "Una SL puede constituirse con 1€ de capital.", ok: true, why: "Desde la Ley Crea y Crece, con obligaciones especiales hasta los 3.000€." },
      { type: "tf", q: "El autónomo tiene personalidad jurídica separada de su negocio.", ok: false, why: "Persona y empresa son lo mismo: por eso su responsabilidad es ilimitada." },
      { type: "fill", q: "El impuesto que pagan las sociedades se llama Impuesto de…", accept: ["sociedades", "el de sociedades"], why: "Impuesto de Sociedades (tipo general 25%)." },
      { type: "fill", q: "Capital mínimo de una SA (número en euros):", accept: ["60000", "60.000", "60 000"], why: "60.000€, desembolsando al menos el 25%." }
    ],
    cases: []
  }
  ]
}
]
};
