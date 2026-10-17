# Sources des visuels de référence

Les copies locales servent au fonctionnement hors ligne. Les pages sources donnent les légendes et les informations de licence.

| Fichier local | Visuel | Source et crédit |
|---|---|---|
| `st-helens-2024.jpg` | Vue aérienne du mont St. Helens (2024) | [USGS — Aerial Photo of Mount St. Helens, June 2024](https://www.usgs.gov/media/images/aerial-photo-mount-st-helens-june-2024), K. Spicer, domaine public |
| `tectonic-plates-fr.svg` | Carte détaillée des plaques tectoniques et de leurs mouvements, légendes en français | [Wikimedia Commons — Tectonic plates boundaries detailed-fr](https://commons.wikimedia.org/wiki/File:Tectonic_plates_boundaries_detailed-fr.svg), Eric Gaba (Sting), CC BY-SA 2.5 |
| `slab-window.png` | Fenêtre dans une plaque tectonique, illustration 3D | [USGS — A Tectonic Slab Window in Three Dimensions](https://www.usgs.gov/media/images/a-tectonic-slab-window-three-dimensions), domaine public |
| `subduction-zone.jpg` | Coupe schématique d’une zone de subduction | [USGS — Subduction zone graphic](https://www.usgs.gov/media/images/subduction-zone-graphic), domaine public |
| `plate-boundaries.jpg` | Carte généralisée des limites des plaques | [USGS — Tectonic plate boundaries](https://www.usgs.gov/media/images/tectonic-plate-boundaries), domaine public |
| `fossil-ammonite.jpg` | Ammonite fossile polie, coquille cloisonnée en spirale | [USGS — Fossil Ammonite](https://www.usgs.gov/media/images/fossil-ammonite), Annie Scott, domaine public |
| `fossil-fish.jpg` | Poisson fossile Priscacara serrata (2696 × 1600) | [NPS — Priscacara serrata Fossil](https://npgallery.nps.gov/AssetDetail/8e3b95ea-1005-4c34-b4f0-05086409dbd4), Jim Tynsky, domaine public |
| `fossil-trilobite.jpg` | Trilobite fossile dans sa matrice rocheuse | [USGS — Trilobite Fossil](https://www.usgs.gov/media/images/trilobite-fossil), Bruce Avera Hunter, domaine public |
| `sedimentary-outcrop.jpg` | Affleurement de strates sédimentaires inclinées | [USGS — Sedimentary Rock](https://www.usgs.gov/media/images/sedimentary-rock), domaine public |

## Photographies des échantillons de roches

Les 18 photographies locales dans `public/rocks/` sont des échantillons de la collection GeoDIL / Ward’s University Rock Collection. Chaque fichier a été vérifié comme CC0 au téléchargement. La collection et ses notices sont consultables sur [Wikimedia Commons — Ward’s University Rock Collection](https://commons.wikimedia.org/wiki/Category:Ward%27s_University_Rock_Collection). CC0 ne requiert pas d’attribution, mais le projet conserve cette provenance par transparence.

La texture de matériau `public/textures/volcanic-ash-v2.jpg` est une texture de surface synthétique créée pour l’application; elle ne provient pas d’un relevé ni d’une photographie de Mount St. Helens.

## Données et modèle 3D intégrés

| Fichier local | Source et usage | Licence / traitement |
|---|---|---|
| `public/models/volcano/mount-st-helens-dem.json` | Relief du mont St. Helens et bassin supérieur de la North Fork Toutle, converti en maillage 3D local depuis le DEM lidar de 10 m de septembre 2009. [USGS Data Series 904](https://pubs.usgs.gov/publication/ds904) | Données USGS ouvertes; maillage réduit à 161 × 161 points et relief vertical ajusté pour lecture à l’écran. La forme animée du cône et les effets restent illustratifs. Source du raster : [10m_DEM.zip](https://pubs.usgs.gov/ds/0904/downloads/10m_DEM.zip). |
| `public/models/tectonics/cocos-slab2-mesh.json` | Surface de profondeur de la plaque Cocos sous l’Amérique centrale, extraite et triangulée depuis la grille USGS Slab2. [USGS Slab2 documentation](https://ghsc.code-pages.usgs.gov/esi/usgs-slab-models/) | Modèle géophysique calculé à partir de données sismologiques, non scan photographique; maillage décimé et échelle verticale adaptée à l’écran. Grille source : `cam_slab2_dep_02.24.18.grd` dans `public/models/tectonics/`, [répertoire USGS](https://apps.usgs.gov/shakemap_geodata/slabs/). |
| `public/models/fossils/cerro-ballena-mpc-677.glb` | Scan 3D texturé du site fossilifère Cerro Ballena (Chili), objet MPC 677. La documentation Smithsonian décrit une numérisation par laser et photogrammétrie. [Notice Smithsonian](https://www.si.edu/object/3d/fossil-whale-excavation-site-mpc-677:a4068a00-9712-4c8e-8948-a9e2ea27fe0a) | CC0 / domaine public; version GLB locale de qualité moyenne, 150k faces et textures 2048 px. Le modèle présente un site fossilifère réel, pas une coupe universelle de fossilisation. [API Smithsonian 3D](https://3d-api.si.edu/api-docs/). |

Les fichiers convertis sont conservés localement pour que l’exploration 3D n’ait pas besoin de requêtes réseau après le démarrage de l’application. Le script `scripts/build-open-geology-assets.py` documente leur réduction et conversion.
