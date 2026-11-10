# Penpot en Docker

Comandos utiles para penpot:

## Comandos para iniciar Penpot
```
docker compose -p penpot -f docker-compose.yaml up -d
```

## Comandos para parar Penpot
```
docker compose -p penpot -f docker-compose.yaml down
```


## Mapa de GuiaCofre

El directorio usa Mapbox GL JS y Streets v12, con agrupación de marcadores, filtros, fichas y geolocalización.

Configura tu token público (pk.) en la etiqueta meta de index.html:

    <meta name="mapbox-access-token" content="TU_TOKEN_PUBLICO_MAPBOX">

Obtén el token en tu cuenta de Mapbox. Limita sus URL autorizadas al dominio de la aplicación; no uses un token secreto (sk.). Consulta la [guía oficial](https://docs.mapbox.com/mapbox-gl-js/guides/).

Sirve la carpeta mediante HTTP en localhost o HTTPS en producción. La geolocalización requiere un contexto seguro y permiso del usuario. Sin token, la lista y los filtros siguen disponibles y el mapa muestra un aviso de configuración.
