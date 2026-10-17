# Terra — Laboratoire géologique

Démo locale React + Vite + Three.js en français. Elle associe des scènes 3D manipulables à des données topographiques et géophysiques ouvertes, ainsi qu’à un scan 3D fossilifère texturé. Les photos de roches sont de vrais échantillons 2D.

## Lancer sous Windows

Dans PowerShell, ouvrir ce dossier puis exécuter :

```powershell
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite (par défaut `http://127.0.0.1:5173/`). Pour une version de production : `npm run build`.

## Application Android

Le projet inclut une enveloppe Android Capacitor. Avec Android SDK, Java 17+ et un appareil Android autorisé en débogage USB :

```powershell
npm install
npm run android:apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Pour actualiser les fichiers natifs après une modification web, utilisez `npm run android:sync`, puis `npm run android:apk` pour reconstruire l’APK.

## Contenu et limites

- **Volcan** : cône animé et décor topographique dérivé du DEM lidar du mont St. Helens (USGS, levé 2009, résolution source 10 m); le relief est allégé et verticalement adapté à l’écran.
- **Tectonique** : les frontières divergentes et transformantes restent des schémas. En mode convergent, le maillage de la plaque Cocos provient de la grille de profondeur USGS Slab2; « Carte en français » ouvre aussi une carte détaillée (Eric Gaba/Sting, CC BY-SA 2.5).
- **Sédiments & fossiles** : scan 3D texturé du site fossilifère Cerro Ballena (Smithsonian, CC0), numérisé par photogrammétrie et scan laser, plus une galerie de photographies documentées.
- **Roches** : photothèque locale de 18 échantillons; filtres par roches ignées, sédimentaires et métamorphiques.

Les modèles et données traités sont inclus dans `public/models/`; ils restent disponibles hors ligne. Le décodeur Draco nécessaire au scan compressé est également fourni dans `public/draco/` pour éviter une dépendance à un CDN. Le scan 3D de Cerro Ballena est CC0. Les données USGS de relief et de Slab2 sont des données scientifiques ouvertes; voir les liens, références de levé et méthodes dans `public/references/credits.md`. Les photographies de roches viennent de la collection GeoDIL / Ward’s University Rock Collection; les 18 fichiers intégrés ont été contrôlés comme CC0 au téléchargement. La carte tectonique est une œuvre d’Eric Gaba (Sting), sous licence CC BY-SA 2.5. Le paquet Android embarque ces ressources locales : scènes, modèles, textures et photographies fonctionnent sans connexion; seuls les liens externes vers les sources demandent Internet.

Les seules surfaces issues de mesures réelles sont le terrain USGS du mont St. Helens, la grille de profondeur Slab2 pour la subduction Cocos et le scan fossilifère de Cerro Ballena. Le cône animé, les effets d’éruption, les mouvements de plaques et les autres limites restent des illustrations pédagogiques; les échelles des scènes sont ajustées pour l’observation et ne sont pas quantitatives. Une photo de terrain ou un scan local ne représente pas toute la diversité d’une formation géologique.

## Régénérer les maillages locaux

Le script `scripts/build-open-geology-assets.py` réduit les sources scientifiques en maillages JSON compacts pour le navigateur. Il requiert Python 3, `rasterio`, `h5py` et `numpy`, ainsi que le fichier USGS `10m_DEM.zip` lié dans les crédits. Exemple PowerShell :

```powershell
python scripts/build-open-geology-assets.py C:\chemin\vers\10m_DEM.zip
```

Le scan GLB Smithsonian déjà inclus ne passe pas par ce script.
