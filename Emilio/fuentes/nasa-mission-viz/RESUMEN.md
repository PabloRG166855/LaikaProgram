# NASA mission-viz

Resumen para agentes de desarrollo. Sirve para poner en el juego órbitas del sistema solar, una lista de asteroides potencialmente peligrosos y trayectorias de ejemplo generadas con GMAT. No sirve como efeméride de vuelo ni como paquete de arte.

- Repositorio: https://github.com/nasa/mission-viz
- Demo publicada: https://nasa.github.io/mission-viz/
- Qué es: software web para visualizar misiones espaciales. Orrerys, un propagador kepleriano y trayectorias exportadas desde el General Mission Analysis Tool (GMAT) de NASA.
- Autoría visible en las páginas: Daniel A. O'Neil, dentro de la organización `nasa` de GitHub.
- Actividad: el repositorio se creó el 28 de abril de 2022 y el último push es del 16 de mayo de 2022. El material didáctico es de 2015 a 2018. La época que usa el calendario de las demos es el 9 de diciembre de 2014.
- Consultado para este resumen: 14 de noviembre de 2026.
- Datos locales: [datos/](datos/).

## Qué cargar en el juego

| Necesidad | Archivo | Confianza |
| --- | --- | --- |
| Mercurio, Venus, Tierra y Marte con elementos keplerianos | [datos/planetas-interiores-keplerianos.json](datos/planetas-interiores-keplerianos.json) | Buena para un orrery. No es un kernel de JPL. |
| Periodo, semieje y excentricidad de los nueve cuerpos clásicos, de Mercurio a Plutón | [datos/periodos-sistema-solar.json](datos/periodos-sistema-solar.json) | Buena en tamaño y periodo. Mercurio está redondeado a 88 días. |
| 50 asteroides potencialmente peligrosos | [datos/asteroides-pha.json](datos/asteroides-pha.json) | Útil como reparto de 2014. No dice si hoy son una amenaza. |
| Posición de la Luna, 22 jul 2014 a 12 ago 2014 | [datos/trayectoria-luna-geocentrica.json](datos/trayectoria-luna-geocentrica.json) | La mejor pieza de esta fuente. El mínimo coincide con el perigeo real del 10 ago 2014. |
| Sonda en la misma ventana de fechas | [datos/trayectoria-tierra-luna-sonda.json](datos/trayectoria-tierra-luna-sonda.json) | Trayectoria de ejemplo. Acercamiento, no captura lunar. |
| Subida de órbita baja a radio geoestacionario | [datos/trayectoria-hohmann-leo-geo.json](datos/trayectoria-hohmann-leo-geo.json) | Muestra GMAT corta, 150 puntos. |
| Elipse terrestre de ejemplo, mal llamada Molniya | [datos/trayectoria-eliptica-ejemplo.json](datos/trayectoria-eliptica-ejemplo.json) | Solo si hace falta una elipse de tres días. |

## Qué no usar

- Los ángulos `inclination`, `omega`, `raan` y `tau` de `RMarkdown/PlanetaryOrbits.json`. El comentario del archivo los trata como cabeceo, guiñada y alabeo de una elipse dibujada. En la Tierra, ese `raan` vale 23.4392811 grados, que es la oblicuidad del eje, no el nodo de la órbita. La inclinación de la Tierra en ese archivo es 7.155 grados, la inclinación del ecuador solar, no la de la órbita. Esas cifras no están copiadas en los JSON.
- La Luna de `InnerSolarSystem.html`. El semieje 0.15 UA y el periodo 0.3 años están inflados para que quepa en la escena heliocéntrica. La inclinación 5.14 grados y la excentricidad 0.0549006 sí son los valores reales respecto a la eclíptica, citados de [stjarnhimlen.se](http://www.stjarnhimlen.se/comp/ppcomp.html). El descarte queda anotado en [datos/luna-demo-no-usable.json](datos/luna-demo-no-usable.json).
- El propagador tal como está escrito. En `OrbitalPropagator.js` y en `InnerSolarSystem.html` el semilatus rectum se calcula con `oE^2`. En JavaScript `^` es XOR, no un cuadrado. Con excentricidades menores que 1 el término vale 2, el semilatus rectum sale negativo y la órbita dibujada es falsa. Las funciones de anomalía media, excéntrica y verdadera sí están bien planteadas.
- La etiqueta de la ontología `has_Eccentric_Anomaly`. En el JSON-LD ese campo guarda el periodo sidéreo en años terrestres (Tierra = 1, Marte = 1.881), no la anomalía excéntrica.
- Mezclar ángulos de los dos archivos de planetas interiores. La demo de asteroides mueve el argumento del perihelio de Venus a 54.9 grados y el de Marte a 286.5 grados, y pone el nodo de la Tierra en 0. El archivo kepleriano es el que hay que preferir. La variante está en [datos/planetas-interiores-demo-pha.json](datos/planetas-interiores-demo-pha.json) solo para no perderla.
- Texturas, el modelo `TrianaSatellite.x3d`, bibliotecas (`x3dom.js`, Three.js r79, jQuery) y los PDF. No hay licencia del repositorio que autorice a meterlos en el juego. Triana es el nombre original de DSCOVR, que fue al punto L1 Sol-Tierra. En la demo Tierra-Luna ese modelo es un muñeco, no la nave de la trayectoria.
- Decir que la sonda entra en órbita lunar. El `index.html` del repositorio lo dice. Las coordenadas no. Ver más abajo.

## Planetas interiores

Unidades: semieje en UA, ángulos en grados, periodo en años sidéreos respecto a la Tierra. Orden original del constructor: semieje, inclinación, argumento del perihelio, excentricidad, nodo ascendente, anomalía media, periodo.

La anomalía media no tiene época declarada con rigor. El calendario de la demo empieza el 9 de diciembre de 2014, pero los comentarios citan una tabla de la Universidad de Reading y un capítulo didáctico de la Universidad de Texas, no un kernel SPICE. Usar los ángulos como pose inicial.

| Cuerpo | Semieje (UA) | Excentricidad | Inclinación | Nodo ascendente | Arg. perihelio | Anomalía media | Periodo (años) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mercurio | 0.38709893 | 0.20563069 | 7.00487 | 48.33167 | 77.46 | 252.25 | 0.240846 |
| Venus | 0.72333199 | 0.00677323 | 3.39471 | 76.68069 | 131.77 | 181.98 | 0.615 |
| Tierra | 1.00000011 | 0.01671022 | 0.00005 | -11.26064 | 100.47 | 100.47 | 1 |
| Marte | 1.5236623 | 0.09341233 | 1.85061 | 49.57854 | 336.04084084 | 355.43 | 1.881 |

Fuentes que cita el propio repositorio para estos números: [Reading](http://www.met.rdg.ac.uk/~ross/Astronomy/Planets.html), [UT Austin, anomalía media](http://farside.ph.utexas.edu/teaching/celestial/Celestial/node34.html) y la página de periodos orbitales de Wikipedia.

## Periodos del sistema solar

Del archivo `PlanetaryOrbits.json`. Periodo en días, semieje en UA. Neptuno venía como el texto `"60,182"` con una coma; aquí está en 60182. Plutón figura como planeta porque así está en la fuente.

| Cuerpo | Semieje (UA) | Excentricidad | Periodo (días) |
| --- | ---: | ---: | ---: |
| Mercurio | 0.387098 | 0.20563 | 88 |
| Venus | 0.723332 | 0.006772 | 224.701 |
| Tierra | 1 | 0.016708 | 365.256363 |
| Marte | 1.523679 | 0.0934 | 686.971 |
| Júpiter | 5.2044 | 0.0489 | 4332.59 |
| Saturno | 9.5826 | 0.0565 | 10759.22 |
| Urano | 19.2184 | 0.046381 | 30688.5 |
| Neptuno | 30.110387 | 0.009456 | 60182 |
| Plutón | 39.48 | 0.2488 | 90560 |

Júpiter, Saturno, Urano, Neptuno y Plutón no tienen en esta fuente un juego de ángulos keplerianos aprovechable. Si el juego los necesita en orientación, hay que traer otra fuente.

## Asteroides potencialmente peligrosos

Cincuenta objetos en [datos/asteroides-pha.json](datos/asteroides-pha.json), con el mismo esquema que los planetas interiores. Salen de la tabla `neo_elem` del Center for Near Earth Object Studies de JPL, ordenada por MOID, y están pegados en `X3Dom/InnerSolarSystem.html`. La página dice que el modelo usa datos de JPL y cita *Orbital Mechanics: Theory and Applications*, de Tom Logsdon (Wiley), para las ecuaciones.

CNEOS llama potencialmente peligroso a un asteroide con MOID respecto a la Tierra de 0.05 UA o menos y magnitud absoluta H de 22 o menos. Esa definición no está escrita en el repositorio; es la de la tabla que el repositorio cita. El archivo no trae MOID, H, diámetro, masa ni probabilidad de impacto.

Rangos de la lista: semieje de 0.92 a 2.74 UA, excentricidad de 0.05 a 0.889, inclinación de 0.2 a 48.8 grados. Dos nombres que el juego puede querer reconocer:

- `Apophis` es (99942) Apophis. El código usa el nombre.
- `1999JU3` es (162173) Ryugu, el objetivo de Hayabusa2. El archivo conserva la designación provisional.

La lista es una fotografía de mediados de la década de 2010. No afirma que esos objetos sigan en una lista de riesgo. 2011 AG5 es el caso claro: estuvo en las listas y salió cuando hubo más observaciones. Para riesgo actual hace falta otra fuente, por ejemplo el Sentry de CNEOS.

La escena avisa: los objetos no están a escala.

## Trayectorias GMAT

Formato común en los cuatro JSON de trayectoria: `muestras[]` con `fecha`, `hora`, `x_km`, `y_km`, `z_km`. El repositorio no nombra el marco. Los radios cuadran con coordenadas cartesianas geocéntricas en kilómetros, que es lo que exporta GMAT. No bautizar el marco como EarthMJ2000Eq ni ningún otro nombre que el archivo no dice.

La demo de Hohmann divide las coordenadas entre 10000 para dibujarlas. La demo Tierra-Luna las multiplica por 0.000006. Esas escalas son de pantalla. Los JSON guardan kilómetros.

En la escena Tierra-Luna la esfera terrestre tiene radio 0.1594525, y un comentario dice que antes era 0.63781 (el radio terrestre, 6378.1 km, en unidades de la escena vieja). Con la escala 0.000006 de la trayectoria, un globo a escala mediría unos 0.038. El globo dibujado es unas cuatro veces demasiado grande respecto al camino, y la Luna de la escena (radio 0.0265 frente a 0.159 de la Tierra) también está fuera de la proporción real. Animar con los kilómetros del JSON, no con los radios de las esferas.

### Hohmann, órbita baja a radio geoestacionario

150 puntos, del 1 ene 2000 11:59:28 al 2 ene 2000 18:33:08. Radio mínimo 7015.4 km (1 ene 2000 13:13:15). Radio máximo 42165.1 km (2 ene 2000 04:03:51), el radio de la órbita geoestacionaria. El texto de la página solo dice "de una órbita baja a una más alta". Con un radio terrestre de 6378 km, el mínimo queda a unos 640 km de altitud. Esa altitud es una lectura, no un número escrito en la fuente.

### Luna

1269 puntos, del 22 jul 2014 11:29:10.811 al 12 ago 2014 22:07:27.467, las mismas marcas de tiempo que la sonda. Radio geocéntrico entre 356895.6 km (10 ago 2014 17:35:35) y 406567.0 km (28 jul 2014 03:20:20). El mínimo es el perigeo lunar del 10 de agosto de 2014.

### Sonda hacia la Luna

Misma ventana y mismas 1269 marcas. Radio geocéntrico entre 8619.6 km (23 jul 2014 20:48:49, un perigeo a unos 2200 km de altitud) y 415207.9 km (29 jul 2014 07:22:20). La distancia mínima al centro de la Luna, restando las dos series punto a punto, es 9200.4 km el 29 jul 2014 06:39:00. Después las trayectorias se separan. Es un acercamiento de ejemplo, no una inserción en órbita lunar baja. El radio lunar es unos 1737 km, así que 9200 km al centro deja la sonda a unos 7500 km de la superficie.

### Elipse de ejemplo

155 puntos con el mismo arranque, 22 jul 2014 11:29:10.811, y cierre exacto tres días después. Radio de 8603.6 km a 158428.8 km. El tutorial la llama Molniya. Una Molniya clásica dura unas 12 horas y tiene el apogeo cerca de 40000 km. Esta no. El primer punto de la sonda es casi el simétrico en X e Y de este primer punto: es un recorte del mismo trabajo en GMAT, no una segunda misión.

## Cómo propagar una órbita

Para planetas y asteroides, propagar con las fórmulas que el código intentaba usar. No copiar el JavaScript.

Elementos: semieje `a`, excentricidad `e`, inclinación `i`, argumento del perihelio `ω`, nodo ascendente `Ω`, anomalía media inicial `M0`. Ángulos de entrada en radianes dentro de las fórmulas.

1. Movimiento medio, con el periodo `P` en las mismas unidades de tiempo que el paso `Δt`: `n = 2π / P`.
2. Anomalía media: `M = M0 + n Δt`. Llevar `M` al rango que use el atan.
3. Anomalía excéntrica `E`, ecuación de Kepler `E - e sin E = M`, por Newton-Raphson. El código para cuando `|f/f'| < 0.0001`, con `f = E - e sin E - M` y `f' = 1 - e cos E`, y arranca en `E = M`.
4. Anomalía verdadera `ν = 2 atan2( sqrt(1+e) sin(E/2), sqrt(1-e) cos(E/2) )`. La forma con `tan` del código falla al cruzar ±90 grados; `atan2` no.
5. Radio: `r = a (1 - e²) / (1 + e cos ν)`.
6. Posición heliocéntrica, con el Sol en el origen y la eclíptica como plano de referencia:

```
x = r ( cos(ω+ν) cos Ω - cos i sin(ω+ν) sin Ω )
y = r ( cos(ω+ν) sin Ω + cos i sin(ω+ν) cos Ω )
z = r ( sin(ω+ν) sin i )
```

El periodo de los planetas interiores y de los asteroides está en años terrestres. El de la tabla del sistema solar está en días. No mezclarlos. 1 año de esa tabla de interiores equivale a 365.25 días en el movimiento medio que usa la demo (`n = 2π / (periodo_en_años * 365.25)` da radianes por día).

Esto es un Kepler de dos cuerpos. No incluye perturbaciones. Para un orrery de juego basta. Para un encuentro o una fecha concreta, no.

## Ontología

Hay una ontología pequeña de órbitas heliocéntricas que importa la Space Situational Awareness Ontology de Robert Rovetto (2014). Las propiedades útiles ya están aplanadas en los JSON: semieje, excentricidad, inclinación, nodo, argumento del perihelio, anomalía media, periodo. El archivo `SSAO_Rovetto.owl` pesa unos 440 KB y no aporta cifras de juego. No se descargó.

Los comentarios de `PlanetaryOrbits.json` describen inclinación, nodo y argumento del perihelio como cabeceo, guiñada y alabeo. Por eso esos ángulos no se copiaron. El mismo archivo define la excentricidad como el cociente del semieje menor y el semieje mayor. Esa frase no es la fórmula que hay que programar: la excentricidad de los JSON ya es el número `e` adimensional, y el radio se calcula con `a (1 - e²) / (1 + e cos ν)`.

## Licencia y atribución

El repositorio no tiene licencia en la raíz. La API de GitHub devuelve `license: null`. El archivo `X3Dom/LICENSE` es la licencia MIT o GPL de la biblioteca X3DOM, de 2009, no una licencia de NASA sobre los datos. Varias páginas llevan la metaetiqueta de copyright "Daniel O'Neil".

Consecuencia práctica: usar los hechos numéricos reunidos en este resumen y en `datos/`. No copiar al juego el JavaScript, los PDF, las texturas `EarthImage.jpg` y `Moon_Flat.jpg`, ni `TrianaSatellite.x3d`. Si el juego muestra la procedencia, basta con: elementos y trayectorias de ejemplo tomados del repositorio público nasa/mission-viz (Daniel A. O'Neil), con asteroides de una tabla de JPL CNEOS de mediados de la década de 2010.

## Lo que no se descargó

Los PDF son tutoriales de cómo armar la visualización (importar Excel a Protégé, dibujar una elipse en R, exportar una trayectoria desde GMAT). No añaden cifras distintas a las de este resumen. Están en el repositorio si alguien quiere el procedimiento de Ge MAT:

- `OntologyDrivenOrrery/20160830_Importing_the_SpaceSituationalAwarenessOntology_and_Exporting_JSONLD.pdf`
- `RMarkdown/20180515_Generating_an_HTMLTable_and_3D_Plot_with_R_from_JSONLD.pdf`
- `RMarkdown/Elliptical_Orbit_Design.html` (el tutorial de la elipse, más de 1 MB de HTML)
- `X3Dom/20150611_WebBasedMissionVisualizationSystem.pdf`
- `X3Dom/20150918_WebVisualization_of_a_GMAT_GeneratedTrajectory_Part1.pdf`
- `X3Dom/20150923_WebVisualization_of_a_GMAT_generatedTrajectory_Part2.pdf`
- `X3Dom/20151102_WebVisualization_of_a_GMAT_generatedTrajectory_Part3.pdf`

Para más fidelidad que esta fuente, el siguiente paso no es otro archivo de mission-viz. Es Horizons o un kernel SPICE para planetas y Luna, y el Small-Body Database o Sentry de CNEOS para asteroides.
