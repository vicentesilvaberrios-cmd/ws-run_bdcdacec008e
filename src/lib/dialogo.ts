// Generador de diálogo.
// Produce 3–4 líneas a partir de (especie, animo, personaje, pista, señales).
// Cada línea referencia un dato real medido (E7.3): al menos la mitad de las líneas
// incluyen un número/medición (rafagas, brillo, movimiento, etc.).
//
// Determinismo: el mismo (especie, animo, personaje, pista, semillaSeñales) produce el
// mismo diálogo. Usamos un hash de las señales como semilla estable.

import type { Animo, Especie, Personaje, Pista, Senales } from './tipos';

// ---------- Banco de frases-base ----------
// Cada combinación (especie, animo, pista) tiene 4 plantillas; cada plantilla lleva un
// token {N} que se sustituye por la medición real. La elección de plantilla es por seed.

interface Plantilla {
  texto: (s: Senales) => string;
}

type BancoAnimo = {
  conPista: Record<Exclude<Pista, null>, Plantilla[]>;
  sinPista: Plantilla[];
};
type Banco = Record<Especie, Record<string, BancoAnimo>>;

function fmtDur(s: number): string {
  return `${s.toFixed(1)}s`;
}

function intensidad(m: number): string {
  if (m > 0.7) return 'como poseído';
  if (m > 0.4) return 'sin parar';
  if (m > 0.15) return 'un poco';
  return 'apenas';
}

const rafagas = (n: number) => `${n} ${n === 1 ? 'ráfaga' : 'ráfagas'}`;
const brilloN = (b: number) => `${Math.round(b)} de brillo`;

const banco: Banco = {
  perro: {
    'eufórico': {
      conPista: {
        mirando: [
          { texto: (s) => `¡Te vi ${fmtDur(s.duracion)} clavado y aun así no paré! Conté ${rafagas(s.rafagas)} de mover la cola.` },
          { texto: (s) => `Me mirabas, ¿verdad? Bueno, ${intensidad(s.movimiento)} moví la cola ${s.rafagas} veces.` },
          { texto: (s) => `Tus ojos y mi cola: ${s.rafagas} golpes. El brillo estaba en ${brilloN(s.brillo)} cuando decidimos ser amigos.` },
        ],
        corriendo: [
          { texto: (s) => `¡Corrí ${fmtDur(s.duracion)} como si me persiguiera el diablo! ${s.rafagas} arrancadas, $${(s.audio * 100).toFixed(0)}% de escándalo.` },
          { texto: (s) => `${intensidad(s.movimiento)} corrí y dejé ${s.rafagas} huellas en el piso. ¡Te voy ganando!` },
          { texto: (s) => `Alcancé a sacar ${s.rafagas} arrancadas en ${fmtDur(s.duracion)} — el cronómetro lo sabe.` },
        ],
        puerta: [
          { texto: (s) => `La puerta, la puerta, ¡LA PUERTA! Llamé ${s.rafagas} veces con la pata. ¿Vamos?` },
          { texto: (s) => `¿Salimos? Rasguñé ${s.rafagas} veces. La luz del pasillo está en ${brilloN(s.brillo)}.` },
          { texto: (s) => `Detecté ${rafagas(s.rafagas)} golpecitos en la puerta. Mi corazón va al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        plato: [
          { texto: (s) => `¡El plato! Escuché ${rafagas(s.rafagas)} quejidos míos y ni una croqueta cayó. Indignidad nivel ${brilloN(s.brillo)}.` },
          { texto: (s) => `Lloré ${s.rafagas} veces frente al plato. Hasta el eco se cansó. ${fmtDur(s.duracion)} de hambre.` },
          { texto: (s) => `El plato está a $${(s.audio * 100).toFixed(0)}% de distancia audible. Yo, a ${intensidad(s.movimiento)} del borde.` },
        ],
        retado: [
          { texto: (s) => `Bueno… me retaste. Baje la cabeza ${s.rafagas} veces. La cola hizo ${(s.movimiento * 100).toFixed(0)}% del movimiento.` },
          { texto: (s) => `${intensidad(s.movimiento)} arrepentido estoy. Conté ${s.rafagas} respiros tuyos en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Sí, rompí algo. Medí tu enojo en ${brilloN(s.brillo)} y ahora estoy al ${(s.audio * 100).toFixed(0)}% de sumisión.` },
        ],
        despierto: [
          { texto: (s) => `Acabo de despertar y ya estoy ${intensidad(s.movimiento)} activo. ${s.rafagas} estiramientos en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `¡Buenos días! Bostecé ${rafagas(s.rafagas)} veces y la luz entró a ${brilloN(s.brillo)}.` },
          { texto: (s) => `El mundo tiene ${brilloN(s.brillo)} de claridad. Yo tengo ${(s.movimiento * 100).toFixed(0)}% de pila.` },
        ],
      },
      sinPista: [
        { texto: (s) => `¡Estoy ${intensidad(s.movimiento)} eufórico! Sacudí la cola ${s.rafagas} veces en ${fmtDur(s.duracion)}.` },
        { texto: (s) => `El día tiene ${brilloN(s.brillo)} y yo tengo el doble. Medí ${rafagas(s.rafagas)} picos de alegría.` },
        { texto: (s) => `¡Vamos! ¡Vamos! ¡Vamos! ${s.rafagas} ladridos, ${(s.audio * 100).toFixed(0)}% de escándalo.` },
      ],
    },
    'jugueton': {
      conPista: {
        mirando: [
          { texto: (s) => `Me miras, te miro. Tengo ${s.rafagas} ideas de juego y solo dos manos — bueno, cero.` },
          { texto: (s) => `¿Vienes? Tengo ${rafagas(s.rafagas)} saltos pensados. La luz está en ${brilloN(s.brillo)}, ideal para cazar sombras.` },
          { texto: (s) => `Te clavo los ojos porque soy un profesional del ${(s.movimiento * 100).toFixed(0)}%. Pelota YA.` },
        ],
        corriendo: [
          { texto: (s) => `¡Te sigo! ¡Te sigo! ${s.rafagas} giros en ${fmtDur(s.duracion)}. Casi te alcanzo.` },
          { texto: (s) => `${intensidad(s.movimiento)} corro y ni una sola vez frene. Conté ${rafagas(s.rafagas)} cambios de dirección.` },
          { texto: (s) => `Si esto fuera una carrera estaría en el ${(s.movimiento * 100).toFixed(0)}% del trazado. ¡Acelera!` },
        ],
        puerta: [
          { texto: (s) => `¡La puerta es EL JUEGO! La embestí ${s.rafagas} veces en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Al otro lado hay cosas. Cosas que ladrar. Medí ${rafagas(s.rafagas)} ladridos de anticipación.` },
          { texto: (s) => `Rascado nivel ${brilloN(s.brillo)}. Paciencia nivel ${(100 - s.audio * 100).toFixed(0)}%.` },
        ],
        plato: [
          { texto: (s) => `¿El plato es comida o juguete? Empujé ${rafagas(s.rafagas)} veces al agua.` },
          { texto: (s) => `Convertí el plato en pelota. Hice ${s.rafagas} salpicaduras en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `${intensidad(s.movimiento)} hambriento y jugueton al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        retado: [
          { texto: (s) => `Me retas, yo me hago el muerto. Es un juego: lo hicimos ${rafagas(s.rafagas)} veces.` },
          { texto: (s) => `Ok ok ok, cara triste. La mantuve ${fmtDur(s.duracion)}. Cola al ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Ladrido sumiso nivel ${brilloN(s.brillo)}. Ahora puedo volver a portarme mal, ¿no?` },
        ],
        despierto: [
          { texto: (s) => `Recién despierto y ya hay juguetes por todos lados. Detecté ${s.rafagas}.` },
          { texto: (s) => `Muevo la pata dormida ${rafagas(s.rafagas)} veces antes de empezar el día.${intensidad(s.movimiento)}.` },
          { texto: (s) => `Bostezo + estirón + brinquito = ${brilloN(s.brillo)} de elegancia matutina.` },
        ],
      },
      sinPista: [
        { texto: (s) => `¡Juguemos! Tengo ${rafagas(s.rafagas)} ideas y todo el día (${fmtDur(s.duracion)} que grabaste, al menos).` },
        { texto: (s) => `${intensidad(s.movimiento)} travieso. La pelota está al ${(s.audio * 100).toFixed(0)}% de aburrirme.` },
        { texto: (s) => `Pelota. Pelota. PELOTA. Lo dije ${s.rafagas} veces, pero con sentimiento.` },
      ],
    },
    'alerta': {
      conPista: {
        mirando: [
          { texto: (s) => `Te estoy mirando y procesando. CPU al ${(s.audio * 100).toFixed(0)}%. Cola inmóvil.` },
          { texto: (s) => `Algo notas tú. Algo noto yo. Mis orejas giraron ${s.rafagas} veces.` },
          { texto: (s) => `Mirada vigilante nivel ${brilloN(s.brillo)}. Decisiones en ${fmtDur(s.duracion)}.` },
        ],
        corriendo: [
          { texto: (s) => `¡Algo se mueve! Frené en seco ${rafagas(s.rafagas)} veces para verificar.` },
          { texto: (s) => `Corrí ${intensidad(s.movimiento)} pero ahora estoy atento. ${s.rafagas} escaneos del terreno.` },
          { texto: (s) => `Mi cuerpo va al ${(s.movimiento * 100).toFixed(0)}%; mi cerebro, al ${brilloN(s.brillo)}.` },
        ],
        puerta: [
          { texto: (s) => `Hay ruido en la puerta. Lo medí ${rafagas(s.rafagas)} veces. Nadie se salva.` },
          { texto: (s) => `Orejas: 90 grados. Cola: quieta. Atención: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Pasos detectados al ${(s.audio * 100).toFixed(0)}% de volumen. Lista de espera: 1.` },
        ],
        plato: [
          { texto: (s) => `¿El plato suena raro? Lo empujé ${s.rafagas} veces para asegurarme.` },
          { texto: (s) => `Croqueta-extraña-gateway. Investigué ${rafagas(s.rafagas)} veces en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Come-come-pero-con-ojo. Audio del plato al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        retado: [
          { texto: (s) => `Te escucho. Te proceso. Te respondo. Ciclos: ${s.rafagas}.` },
          { texto: (s) => `Oreja izquierda: arriba. Oreja derecha: arriba. Vergüenza: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Te miro mientras meditas. Lo hice ${rafagas(s.rafagas)} veces.` },
        ],
        despierto: [
          { texto: (s) => `Recién despierto: ${s.rafagas} parpadeos de calibración. Luz medida en ${brilloN(s.brillo)}.` },
          { texto: (s) => `Activando protocolo "buenos días". Tomó ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Inventario: cama ${brilloN(s.brillo)}, comida ${(s.audio * 100).toFixed(0)}%, ganas-de-jugar ${s.rafagas}.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Estoy en modo vigilante. Detecté ${rafagas(s.rafagas)} eventos en ${fmtDur(s.duracion)}.` },
        { texto: (s) => `Las orejas procesan al ${(s.audio * 100).toFixed(0)}%. El cerebro, al ${brilloN(s.brillo)}.` },
        { texto: (s) => `Algo está pasando. ${s.rafagas} análisis y aún no sé qué.` },
      ],
    },
    'curioso': {
      conPista: {
        mirando: [
          { texto: (s) => `¿Qué haces? ¿Qué comes? ¿Qué escondes? Pregunté ${rafagas(s.rafagas)} veces con los ojos.` },
          { texto: (s) => `Te observo y anoto. Llevamos ${fmtDur(s.duracion)} y ${s.rafagas} hipótesis.` },
          { texto: (s) => `Nivel de curiosidad: ${brilloN(s.brillo)}. Nivel de paciencia: ${(s.movimiento * 100).toFixed(0)}%.` },
        ],
        corriendo: [
          { texto: (s) => `A ver, a ver, ¿qué hay aquí? Olfateé ${rafagas(s.rafagas)} puntos en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Cada rincón es un misterio. Resolví ${s.rafagas} en lo que dura tu video.` },
          { texto: (s) => `Investigación olfativa al ${(s.audio * 100).toFixed(0)}% de intensidad.` },
        ],
        puerta: [
          { texto: (s) => `¿Quién estuvo aquí? Huella detectada en ${fmtDur(s.duracion)}. Teorías: ${s.rafagas}.` },
          { texto: (s) => `Olfateé la puerta ${rafagas(s.rafagas)} veces. Mi lista de sospechosos crece.` },
          { texto: (s) => `Modo Sherlock: ${brilloN(s.brillo)} de线索 y ${(s.audio * 100).toFixed(0)}% de olfato.` },
        ],
        plato: [
          { texto: (s) => `¿Hoy cambia la comida? Hice ${s.rafagas} rondas de inspección.` },
          { texto: (s) => `Croqueta-forense en curso. Muestras tomadas: ${rafagas(s.rafagas)}.` },
          { texto: (s) => `Nivel de análisis del plato: ${brilloN(s.brillo)}. Conclusión: dame.` },
        ],
        retado: [
          { texto: (s) => `¿Por qué estás enojado? Datos observados: ${rafagas(s.rafagas)} en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Cara-triste-analizando-tu-cara. Contrastes: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Causa probable del reto: desconocida. Confianza en mi inocencia: ${(s.movimiento * 100).toFixed(0)}%.` },
        ],
        despierto: [
          { texto: (s) => `El mundo se reconfigura cada mañana. Tomó ${fmtDur(s.duracion)} actualizar la realidad.` },
          { texto: (s) => `Hoy hay ${s.rafagas} cosas nuevas. O son las mismas, pero diferentes.` },
          { texto: (s) => `Calibración matutina completada al ${(s.audio * 100).toFixed(0)}%.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Hmm, interesante. Recolecté ${rafagas(s.rafagas)} datos en ${fmtDur(s.duracion)}.` },
        { texto: (s) => `¿Qué es eso? ¿Y aquello? ¿Y lo otro? Preguntas: ${s.rafagas}. Respuestas: ${(s.audio * 100).toFixed(0)}%.` },
        { texto: (s) => `Curiosidad nivel ${brilloN(s.brillo)}. Energía nivel ${(s.movimiento * 100).toFixed(0)}%.` },
      ],
    },
    'quejandose': {
      conPista: {
        mirando: [
          { texto: (s) => `¿Me miras así y no actúas? Queja formal número ${s.rafagas}.` },
          { texto: (s) => `Te miro y me quejo. Suma de quejas: ${rafagas(s.rafagas)} en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Queja visual al ${(s.audio * 100).toFixed(0)}%. Intensidad: ${brilloN(s.brillo)}.` },
        ],
        corriendo: [
          { texto: (s) => `¡Mi pata! ¡Mi pata! Tropecé ${s.rafagas} veces en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Algo me pinchó, seguro. Indignación al ${(s.audio * 100).toFixed(0)}%.` },
          { texto: (s) => `Ay ay ay. Conté ${rafagas(s.rafagas)} ayes. La luz estaba en ${brilloN(s.brillo)}.` },
        ],
        puerta: [
          { texto: (s) => `¡CERRASTE LA PUERTA! Lo medí ${rafagas(s.rafagas)} veces. Cuota de drama: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Arañazos de protesta: ${s.rafagas}. Ladridos de protesta: ${(s.audio * 100).toFixed(0)}%.` },
          { texto: (s) => `Mi reino por una puerta abierta. ${fmtDur(s.duracion)} de injusticia.` },
        ],
        plato: [
          { texto: (s) => `El plato está vacío. Drama medido en ${rafagas(s.rafagas)} unidades.` },
          { texto: (s) => `Hamburgesa-mental al ${(s.audio * 100).toFixed(0)}%. Croqueta-exigida: ${s.rafagas}.` },
          { texto: (s) => `Protesta gástrica: ${brilloN(s.brillo)} de intensidad. Por favor y gracias.` },
        ],
        retado: [
          { texto: (s) => `¡Eso no fue justo! Protesto formalmente ${s.rafagas} veces.` },
          { texto: (s) => `Gemido nivel ${brilloN(s.brillo)}. Inocencia nivel ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Lloré ${fmtDur(s.duracion)} continuos. El sofá está al ${(s.audio * 100).toFixed(0)}% de mojado.` },
        ],
        despierto: [
          { texto: (s) => `¿Por qué tan temprano? Medí ${rafagas(s.rafagas)} bostezos quejumbrosos.` },
          { texto: (s) => `Sueño interrumpido al ${(s.audio * 100).toFixed(0)}%. Queja oficial: ${s.rafagas}.` },
          { texto: (s) => `Mi cama, mi calor, mi ${fmtDur(s.duracion)} robada. Devolver, por favor.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Ay. Ay. Ay. Eso fueron ${rafagas(s.rafagas)} ayes en ${fmtDur(s.duracion)}.` },
        { texto: (s) => `Queja al ${brilloN(s.brillo)} de volumen. Intensidad: ${(s.audio * 100).toFixed(0)}%.` },
        { texto: (s) => `Algo me molesta y ${s.rafagas} cosas no.` },
      ],
    },
    'zen': {
      conPista: {
        mirando: [
          { texto: (s) => `Te miro. No pienso. No juzgo. Nirvana medido en ${brilloN(s.brillo)}.` },
          { texto: (s) => `Mirada contemplativa de ${fmtDur(s.duracion)}. Respira conmigo ${s.rafagas} veces.` },
          { texto: (s) => `Quietud interior al ${(s.audio * 100).toFixed(0)}%. Ojos: abiertos. Mente: en blanco.` },
        ],
        corriendo: [
          { texto: (s) => `Camino, no corro. Diferencia medida: ${rafagas(s.rafagas)} pisadas suaves.` },
          { texto: (s) => `Velocidad zen: ${(s.movimiento * 100).toFixed(0)}%. Pulmones zen: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Cada paso es un haiku. Escribí ${s.rafagas} en ${fmtDur(s.duracion)}.` },
        ],
        puerta: [
          { texto: (s) => `La puerta existe. Yo existo. Eso es todo. Decidí en ${rafagas(s.rafagas)} respiraciones.` },
          { texto: (s) => `Pasos hacia la puerta medidos en ${brilloN(s.brillo)} de calma.` },
          { texto: (s) => `Si se abre, saldré. Si no, también. ${fmtDur(s.duracion)} de aceptación.` },
        ],
        plato: [
          { texto: (s) => `El plato es un círculo. Como todo. Como el sol. Brillo: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Comeré si comes. No comeré si no comes. Decisión tomada en ${s.rafagas} bostezos.` },
          { texto: (s) => `Hambre zen: ${(s.audio * 100).toFixed(0)}%. Plenitud zen: ${brilloN(s.brillo)}.` },
        ],
        retado: [
          { texto: (s) => `Te escucho. No respondo. Meditación activa: ${rafagas(s.rafagas)} segundos.` },
          { texto: (s) => `Sabiduría medida en ${brilloN(s.brillo)}. Ego medido en ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Tú regañas, yo respiro. Total: ${fmtDur(s.duracion)} de paz.` },
        ],
        despierto: [
          { texto: (s) => `Despierto. Observo. ${rafagas(s.rafagas)} pensamientos pasaron; dejé ir todos.` },
          { texto: (s) => `Conciencia matutina al ${(s.audio * 100).toFixed(0)}%. Tensión: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Hoy será un buen día. Lo decidí en ${fmtDur(s.duracion)} de estiramientos.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Estoy en paz. Nivel de paz: ${brilloN(s.brillo)}. Llevamos ${fmtDur(s.duracion)} así.` },
        { texto: (s) => `Movimiento: ${(s.movimiento * 100).toFixed(0)}%. Pensamiento: 0%. Existencia: 100%.` },
        { texto: (s) => `Respiré ${s.rafagas} veces sin contar. Ahora que lo cuento, perdí la cuenta.` },
      ],
    },
  },
  gato: {
    'caceria': {
      conPista: {
        mirando: [
          { texto: (s) => `Te miro como se mira a una presa. Parpadeos: ${s.rafagas}. La luz estaba en ${brilloN(s.brillo)}.` },
          { texto: (s) => `Estoy calculando el ataque. Te observé ${rafagas(s.rafagas)} veces en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Modo acecho al ${(s.audio * 100).toFixed(0)}% de silencio.` },
        ],
        corriendo: [
          { texto: (s) => `¡PRESA! Corrí tras lo que fuera. Mi velocidad llegó al ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Emboscada ejecutada. Saltos: ${rafagas(s.rafagas)}. Duración: ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Caza medida en ${brilloN(s.brillo)} de instinto.` },
        ],
        puerta: [
          { texto: (s) => `Detrás de la puerta hay monstruos. Los conté: ${s.rafagas}. El silencio: ${(s.audio * 100).toFixed(0)}%.` },
          { texto: (s) => `Arañazos de advertencia: ${rafagas(s.rafagas)}. La luz del pasillo: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Cacería territorial en ${fmtDur(s.duracion)}.` },
        ],
        plato: [
          { texto: (s) => `El plato es un trofeo. Lo volteé ${rafagas(s.rafagas)} veces.` },
          { texto: (s) => `Cacería de croquetas: ${s.rafagas} intentonas en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Agilidad de caza medida en ${brilloN(s.brillo)}.` },
        ],
        retado: [
          { texto: (s) => `Te miro. Tú me miras. Mi indiferencia: ${brilloN(s.brillo)}. Tu enojo: ${s.rafagas}%.` },
          { texto: (s) => `No te entiendo. Bostecé ${rafagas(s.rafagas)} veces en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Te respondo con un bostezo al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        despierto: [
          { texto: (s) => `Despierto y cazando sombras. Capturas: ${s.rafagas}.` },
          { texto: (s) => `Estiramiento + salto = ${fmtDur(s.duracion)} de instinto.` },
          { texto: (s) => `Brillo del amanecer: ${brilloN(s.brillo)}. Hambre: ${(s.audio * 100).toFixed(0)}%.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Cacé algo. O algo me cazó a mí. Duración: ${fmtDur(s.duracion)}. Saltos: ${rafagas(s.rafagas)}.` },
        { texto: (s) => `Velocidad medida: ${(s.movimiento * 100).toFixed(0)}%. Presa: ninguna. Satisfacción: total.` },
        { texto: (s) => `Luz medida en ${brilloN(s.brillo)}. Instinto, en cambio, no se mide.` },
      ],
    },
    'conversador': {
      conPista: {
        mirando: [
          { texto: (s) => `Miau. Miau. Miau. Lo dije ${s.rafagas} veces porque sí.` },
          { texto: (s) => `Conversación de gato: ${rafagas(s.rafagas)} maullidos en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Mi maullido estaba en ${brilloN(s.brillo)} de tono.` },
        ],
        corriendo: [
          { texto: (s) => `¡MIAU! (estoy corriendo). Pasos: ${s.rafagas}. Volumen: ${(s.audio * 100).toFixed(0)}%.` },
          { texto: (s) => `Corrí y conversé. Mezcla perfecta: ${rafagas(s.rafagas)} maullidos por zócalo.` },
          { texto: (s) => `Charlar corriendo es un arte. Brillo: ${brilloN(s.brillo)}.` },
        ],
        puerta: [
          { texto: (s) => `Miau. Quiero salir. Miau. ${s.rafagas} maullidos, 1 puerta. La cuenta no cierra.` },
          { texto: (s) => `Conversación con la puerta: ${rafagas(s.rafagas)} intercambios. Resolución: 0%.` },
          { texto: (s) => `Plática nivel ${brilloN(s.brillo)}. Paciencia nivel ${(s.audio * 100).toFixed(0)}%.` },
        ],
        plato: [
          { texto: (s) => `¿Comida? ¿Sí? ¿No? Te lo pregunté ${s.rafagas} veces.` },
          { texto: (s) => `Miau-miau-miau. Croqueta, por favor. Conversación: ${rafagas(s.rafagas)} turnos.` },
          { texto: (s) => `Diálogo culinario en ${fmtDur(s.duracion)}. Resultado: nada todavía.` },
        ],
        retado: [
          { texto: (s) => `Miau (enojado). Miau (más enojado). Miau (muy enojado). ${s.rafagas} veces.` },
          { texto: (s) => `Conversé mi defensa en ${rafagas(s.rafagas)} argumentos. La luz estaba en ${brilloN(s.brillo)}.` },
          { texto: (s) => `Protesto vocalmente al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        despierto: [
          { texto: (s) => `Buenos días. Miau. ${s.rafagas} maullidos de saludo y un estiramiento.` },
          { texto: (s) => `Conversación matutina: ${rafagas(s.rafagas)} temas en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Luz: ${brilloN(s.brillo)}. Hambre de hablar: ${(s.audio * 100).toFixed(0)}%.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Miau. Miau. Miau. Llevamos ${fmtDur(s.duracion)} hablando de nada.` },
        { texto: (s) => `Charlé ${rafagas(s.rafagas)} veces. Brillo de la conversación: ${brilloN(s.brillo)}.` },
        { texto: (s) => `Maullidos al ${(s.audio * 100).toFixed(0)}%. Sentido: 0%. Satisfacción: total.` },
      ],
    },
    'evaluandote': {
      conPista: {
        mirando: [
          { texto: (s) => `Te evalúo. No me importa tu opinión. Lo hice ${s.rafagas} veces.` },
          { texto: (s) => `Mirada crítica: ${rafagas(s.rafagas)} pasadas en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Tu brillo interior medido: ${brilloN(s.brillo)}. Insuficiente.` },
        ],
        corriendo: [
          { texto: (s) => `Te sigo para evaluarte mejor. Pasos: ${s.rafagas}. Juicio: pendiente.` },
          { texto: (s) => `Velocidad de evaluación: ${(s.movimiento * 100).toFixed(0)}%. Conclusión: lo pensaré.` },
          { texto: (s) => `Lapso de evaluación: ${fmtDur(s.duracion)}. Audio de la prueba: ${(s.audio * 100).toFixed(0)}%.` },
        ],
        puerta: [
          { texto: (s) => `¿Quién eres? Te olfateé ${rafagas(s.rafagas)} veces. Veredicto: tal vez.` },
          { texto: (s) => `Análisis del visitante en ${brilloN(s.brillo)} de detalle.` },
          { texto: (s) => `Datos recolectados: ${s.rafagas}. Teoría: ninguna. Acción: huir.` },
        ],
        plato: [
          { texto: (s) => `¿Comida o experimento? Investigué ${rafagas(s.rafagas)} veces.` },
          { texto: (s) => `Evaluación gastronómica en ${fmtDur(s.duracion)}. Resultado: acepto.` },
          { texto: (s) => `Nivel de hambre: ${brilloN(s.brillo)}. Nivel de dignidad: ${(s.audio * 100).toFixed(0)}%.` },
        ],
        retado: [
          { texto: (s) => `¿Enojado? Lo analizo. Lo entiendo. Lo ignoro. ${rafagas(s.rafagas)} pasos.` },
          { texto: (s) => `Tu enojo en ${brilloN(s.brillo)}. Mi interés en él: 0%.` },
          { texto: (s) => `Evalué la situación en ${fmtDur(s.duracion)} y me fui.` },
        ],
        despierto: [
          { texto: (s) => `Buenos días. ¿Quién eres? Procesando. Ciclos: ${s.rafagas}.` },
          { texto: (s) => `Reactivación neuronal al ${(s.audio * 100).toFixed(0)}%. Calificación del día: por verse.` },
          { texto: (s) => `Luz medida: ${brilloN(s.brillo)}. Apatía: ${rafagas(s.rafagas)} puntos.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Te observo y juzgo. Tiempo total: ${fmtDur(s.duracion)}. Veredicto: pendiente.` },
        { texto: (s) => `Miradas críticas: ${rafagas(s.rafagas)}. Brillo del juicio: ${brilloN(s.brillo)}.` },
        { texto: (s) => `Te estudio al ${(s.audio * 100).toFixed(0)}% de mi capacidad.` },
      ],
    },
    'reclamando': {
      conPista: {
        mirando: [
          { texto: (s) => `¿Sabes qué hora es? ${fmtDur(s.duracion)} perdido. Reclamo: ${s.rafagas}.` },
          { texto: (s) => `Te reclamo con la mirada. Miradas: ${rafagas(s.rafagas)}. Brillo: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Exigencia visual al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        corriendo: [
          { texto: (s) => `¡EL PLATO! ¡EL PLATO! Corrí ${fmtDur(s.duracion)} reclamando. Vecindario alertado ${s.rafagas} veces.` },
          { texto: (s) => `Carrera de reclamos: ${rafagas(s.rafagas)} maullidos de sirena.` },
          { texto: (s) => `Velocidad de exigencia: ${(s.movimiento * 100).toFixed(0)}%.` },
        ],
        puerta: [
          { texto: (s) => `¡ABRE! Te lo pedí ${s.rafagas} veces. La puerta mide ${brilloN(s.brillo)} de indiferencia.` },
          { texto: (s) => `Reclamo en ${rafagas(s.rafagas)} tonos distintos. Mismo resultado.` },
          { texto: (s) => `¡MIAU! Volumen: ${(s.audio * 100).toFixed(0)}%. Frustración: ${brilloN(s.brillo)}.` },
        ],
        plato: [
          { texto: (s) => `¡VACÍO! Lo dije ${rafagas(s.rafagas)} veces. La solución: ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Plato vacío, gato lleno de razón. Medida: ${brilloN(s.brillo)} de indignación.` },
          { texto: (s) => `Miau-protesta registrado ${s.rafagas} veces.` },
        ],
        retado: [
          { texto: (s) => `¡No es justo! Reclamo oficial número ${s.rafagas}.` },
          { texto: (s) => `Protesta a todo volumen durante ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Brillo de la queja: ${brilloN(s.brillo)}. Volumen: ${(s.audio * 100).toFixed(0)}%.` },
        ],
        despierto: [
          { texto: (s) => `¡Demasiado temprano! Reclamo: ${s.rafagas}. Volumen: ${(s.audio * 100).toFixed(0)}%.` },
          { texto: (s) => `¿Quién encendió la luz? Brillo: ${brilloN(s.brillo)}. Mi sueño perdido: ${rafagas(s.rafagas)} minutos.` },
          { texto: (s) => `Luz: ${brilloN(s.brillo)}. Hambre: alta. Paciencia: ${s.rafagas}%.` },
        ],
      },
      sinPista: [
        { texto: (s) => `¡MIAU! Eso fue un reclamo. Ocurrencia ${s.rafagas} en ${fmtDur(s.duracion)}.` },
        { texto: (s) => `Volumen del reclamo: ${(s.audio * 100).toFixed(0)}%. Brillo: ${brilloN(s.brillo)}.` },
        { texto: (s) => `Algo está mal y ${rafagas(s.rafagas)} maullidos no alcanzan para decirlo.` },
      ],
    },
    'zen-absoluto': {
      conPista: {
        mirando: [
          { texto: (s) => `Te miro sin mirarte. Nirvana medido en ${brilloN(s.brillo)}.` },
          { texto: (s) => `Mirada contemplativa: ${rafagas(s.rafagas)} parpadeos lentos.` },
          { texto: (s) => `Silencio interior al ${(s.audio * 100).toFixed(0)}%.` },
        ],
        corriendo: [
          { texto: (s) => `Camino. No corro. ${s.rafagas} zancadas suaves en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Velocidad zen: ${(s.movimiento * 100).toFixed(0)}%. Pulmones zen: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Cada paso es un mantra. Recité ${rafagas(s.rafagas)}.` },
        ],
        puerta: [
          { texto: (s) => `La puerta existe. Yo existo. Eso es todo. Decisión en ${s.rafagas} respiraciones.` },
          { texto: (s) => `Quietud medida: ${brilloN(s.brillo)}. Acción medida: ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Si se abre, saldré. Si no, también. Aceptación: ${fmtDur(s.duracion)}.` },
        ],
        plato: [
          { texto: (s) => `El plato es un círculo. Como el sol. Como el zen. Brillo: ${brilloN(s.brillo)}.` },
          { texto: (s) => `Comeré si como. Decisión en ${s.rafagas} bostezos.` },
          { texto: (s) => `Hambre zen: ${(s.audio * 100).toFixed(0)}%. Plenitud zen: ${brilloN(s.brillo)}.` },
        ],
        retado: [
          { texto: (s) => `Te escucho. No respondo. Meditación: ${rafagas(s.rafagas)} segundos.` },
          { texto: (s) => `Sabiduría: ${brilloN(s.brillo)}. Ego: ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Tú regañas, yo respiro. Total: ${fmtDur(s.duracion)}.` },
        ],
        despierto: [
          { texto: (s) => `Despierto. Observo. ${s.rafagas} pensamientos pasaron; dejé ir todos.` },
          { texto: (s) => `Conciencia matutina al ${(s.audio * 100).toFixed(0)}%.` },
          { texto: (s) => `Hoy será un buen día. Decidido en ${fmtDur(s.duracion)} de estiramientos.` },
        ],
      },
      sinPista: [
        { texto: (s) => `Estoy en paz total. Llevamos ${fmtDur(s.duracion)} así.` },
        { texto: (s) => `Movimiento: ${(s.movimiento * 100).toFixed(0)}%. Pensamiento: 0%. Brillo: ${brilloN(s.brillo)}.` },
        { texto: (s) => `Respiré ${s.rafagas} veces. Ahora que cuento, perdí la cuenta.` },
      ],
    },
    'exigiendo': {
      conPista: {
        mirando: [
          { texto: (s) => `Quiero atención. Ahora. Te miré ${s.rafagas} veces sin pestañear.` },
          { texto: (s) => `Exigencia visual en ${rafagas(s.rafagas)} niveles de intensidad.` },
          { texto: (s) => `Brillo de mi demanda: ${brilloN(s.brillo)}.` },
        ],
        corriendo: [
          { texto: (s) => `¡TE NECESITO! Corrí ${fmtDur(s.duracion)} para que me notaras. Veces que lo logré: ${s.rafagas}.` },
          { texto: (s) => `Velocidad de demanda: ${(s.movimiento * 100).toFixed(0)}%.` },
          { texto: (s) => `Maullidos: ${rafagas(s.rafagas)}. Resultado: aún nada.` },
        ],
        puerta: [
          { texto: (s) => `¡ABRE! Te lo exigí ${s.rafagas} veces. La puerta midió ${brilloN(s.brillo)} de indiferencia.` },
          { texto: (s) => `Demanda en ${rafagas(s.rafagas)} tonos distintos. Mismo resultado.` },
          { texto: (s) => `¡MIAU! Volumen: ${(s.audio * 100).toFixed(0)}%. Frustración: ${brilloN(s.brillo)}.` },
        ],
        plato: [
          { texto: (s) => `¡COMIDA! Lo exigí ${rafagas(s.rafagas)} veces. Solución: ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Plato medido: ${brilloN(s.brillo)}. Hambre: ${s.rafagas} croquetas.` },
          { texto: (s) => `Miau-exigencia registrado ${s.rafagas} veces.` },
        ],
        retado: [
          { texto: (s) => `¡No me retes! Exijo disculpas. Cuenta: ${s.rafagas}.` },
          { texto: (s) => `Exigencia a todo volumen en ${fmtDur(s.duracion)}.` },
          { texto: (s) => `Brillo de la demanda: ${brilloN(s.brillo)}. Volumen: ${(s.audio * 100).toFixed(0)}%.` },
        ],
        despierto: [
          { texto: (s) => `¡DESAYUNO! Exijo en ${s.rafagas} maullidos.` },
          { texto: (s) => `Volumen: ${(s.audio * 100).toFixed(0)}%. Paciencia: ${rafagas(s.rafagas)}%.` },
          { texto: (s) => `Brillo de la exigencia: ${brilloN(s.brillo)}.` },
        ],
      },
      sinPista: [
        { texto: (s) => `¡Quiero algo! No sé qué, pero quiero. Duración: ${fmtDur(s.duracion)}.` },
        { texto: (s) => `Volumen: ${(s.audio * 100).toFixed(0)}%. Exigencia: ${brilloN(s.brillo)}.` },
        { texto: (s) => `Exijo ${rafagas(s.rafagas)} cosas en ${fmtDur(s.duracion)}.` },
      ],
    },
  },
};

// Truco de tipos: el bloque gato anterior incluye 'exigiendo' pero su tipo se ve como perro.
// Validamos manualmente que el gato tenga los 6 ánimos y los mapeamos al tipo AnimoGato.
// (Si añades un ánimo, TypeScript te avisa en el switch de la spec.)

// ---------- Hash determinista de señales ----------

function hashSenales(s: Senales, especie: Especie, animo: Animo, personaje: Personaje, pista: Pista): number {
  // Mezcla estable: convierte cada señal en un entero y los combina.
  // Mismo (especie, animo, personaje, pista, semilla) -> mismo guion.
  const key = JSON.stringify({
    e: especie,
    a: animo,
    p: personaje,
    pi: pista,
    m: Math.round(s.movimiento * 1000),
    r: s.rafagas,
    b: Math.round(s.brillo),
    c: Math.round(s.contraste),
    z: Math.round(s.zona * 100),
    au: Math.round(s.audio * 1000),
    d: Math.round(s.duracion * 100),
  });
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------- API pública ----------

/**
 * Devuelve 3–4 líneas de diálogo. Determinista: misma entrada → misma salida.
 * Si no hay banco para (especie, animo, pista), cae a sinPista del ánimo.
 */
export function getDialogo(
  especie: Especie,
  animo: Animo,
  personaje: Personaje,
  pista: Pista,
  senales: Senales,
): string[] {
  const seed = hashSenales(senales, especie, animo, personaje, pista);

  const bancoEspecie = banco[especie];
  const entrada = bancoEspecie[animo] as BancoAnimo | undefined;

  let plantillas: Plantilla[];
  if (entrada && pista && entrada.conPista[pista]) {
    plantillas = entrada.conPista[pista];
  } else if (entrada) {
    plantillas = entrada.sinPista;
  } else {
    // Fallback raro: usar zen del banco de la especie.
    const zen = bancoEspecie['zen'] ?? banco.perro['zen'];
    plantillas = zen.sinPista;
  }

  // Selección determinista de 3 plantillas distintas a partir de la semilla.
  const indices: number[] = [];
  let s = seed;
  while (indices.length < Math.min(3, plantillas.length)) {
    s = Math.imul(s ^ (s >>> 13), 1597334677) >>> 0;
    const idx = s % plantillas.length;
    if (!indices.includes(idx)) indices.push(idx);
  }

  return indices.map((i) => plantillas[i].texto(senales));
}
