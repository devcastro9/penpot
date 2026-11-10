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

Configura un token público nuevo (pk.) en config.local.js, a partir de config.example.js:

    window.GUIACOFRE_CONFIG = {
      mapboxAccessToken: 'TU_TOKEN_PUBLICO_MAPBOX'
    };

config.local.js está excluido de Git. En cada despliegue debes crear ese archivo junto a index.html antes de servir la web. El token sigue siendo visible en el navegador; el archivo local evita incluirlo en los commits.

Obtén el token en tu cuenta de Mapbox. Limita sus URL autorizadas al dominio de la aplicación; no uses un token secreto (sk.). Consulta la [guía oficial](https://docs.mapbox.com/mapbox-gl-js/guides/).

Sirve la carpeta mediante HTTP en localhost o HTTPS en producción. La geolocalización requiere un contexto seguro y permiso del usuario. Sin token, la lista y los filtros siguen disponibles y el mapa muestra un aviso de configuración.

## Publicar en GitHub Pages

1. En Settings > Pages, selecciona GitHub Actions como Source.
2. En Settings > Secrets and variables > Actions, crea el secreto MAPBOX_ACCESS_TOKEN con un token publico de Mapbox (pk.).
3. Sube los cambios a main. El flujo .github/workflows/pages.yml publica automaticamente la web.
4. Consulta el resultado en Actions. La URL prevista es https://devcastro9.github.io/penpot/.

El flujo genera config.local.js durante el despliegue y publica solo los archivos de la web. El token no queda en los commits, pero sera visible en la web publicada porque es un token publico para el navegador. Configura sus URL autorizadas en Mapbox para permitir https://devcastro9.github.io.
