HEALTHYDAY - PROYECTO ESCOLAR
================================

CONTENIDO
- index.html: estructura de la página.
- css/styles.css: diseño visual y adaptación a celular.
- js/app.js: hábitos, progreso, puntos, agua, horarios y notificaciones.
- manifest.json: datos básicos para instalar como aplicación web.
- sw.js: service worker básico.

CÓMO EJECUTAR
1. Descomprime la carpeta HealthyDay.
2. Abre la carpeta en Visual Studio Code.
3. Ejecuta index.html con la extensión Live Server.
   También puedes abrir index.html directamente en el navegador,
   pero algunas funciones PWA requieren Live Server o HTTPS.

CÓMO USAR
- Pulsa los círculos de cada tarjeta para completar un hábito.
- Pulsa “+ Registrar vaso” para llenar el vaso de agua.
- Usa “Editar horarios” para cambiar las horas.
- Pulsa la campana y acepta el permiso para activar notificaciones.

IMPORTANTE SOBRE LOS RECORDATORIOS
Las notificaciones de esta versión se comprueban mientras la página está
abierta (y el navegador mantiene activa la pestaña). Los navegadores no
garantizan alarmas puntuales si se cierra la página o se detiene el navegador.
Para notificaciones fiables con la aplicación cerrada se necesita un servicio
push y un servidor que programe/envíe esos avisos.

DATOS
Los hábitos, puntos y vasos se guardan en LocalStorage del navegador.
El progreso diario se reinicia automáticamente al cambiar de fecha.
