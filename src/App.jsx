import { useRef, useState } from 'react';
import GeologyScene from './GeologyScene.jsx';

const modules = [
  { id: 'volcano', icon: '◉', title: 'Volcans', eyebrow: 'MAGMATISME', heading: 'Quand la Terre respire', body: 'Un stratovolcan réel est un édifice composite, souvent dissymétrique, construit par des dépôts de lave et de matériaux fragmentés. Le cratère, les ravines et les cicatrices de glissement varient d’un volcan à l’autre.', tags: ['Stratovolcan', 'Cratère', 'Relief lidar'], scene: 'MONT ST. HELENS · RELIEF TOPOGRAPHIQUE USGS', fact: 'Le terrain autour du cône est dérivé d’un modèle numérique du relief de 2009; le maillage est allégé et verticalement adapté pour rester lisible dans la scène.' },
  { id: 'plates', icon: '⇄', title: 'Tectonique', eyebrow: 'DYNAMIQUE INTERNE', heading: 'Des plaques en mouvement', body: 'Les frontières de plaques sont des zones étendues et irrégulières. En subduction, une plaque océanique plonge sous une autre; dorsales et failles transforment aussi le relief et les roches.', tags: ['Divergence', 'Convergence', 'Coulissage'], scene: 'FRONTIÈRE DE PLAQUES · GÉOMÉTRIE USGS SLAB2', fact: 'En convergence, la surface de la plaque Cocos provient du modèle géophysique USGS Slab2. Sa profondeur est mise à l’échelle pour la visualisation; les autres types de limites restent schématiques.' },
  { id: 'sediments', icon: '▤', title: 'Sédiments & fossiles', eyebrow: 'TEMPS PROFOND', heading: 'Une histoire écrite en couches', body: 'Sur le terrain, les couches sédimentaires sont rarement des bandes régulières : elles plissent, s’érodent et changent de composition. Les fossiles sont des restes ou traces préservés dans certaines roches, souvent sédimentaires.', tags: ['Dépôt', 'Enfouissement', 'Scan fossilifère'], scene: 'CERRO BALLENA · SCAN 3D DU SMITHSONIAN', fact: 'Le modèle manipulable est un scan 3D du site fossilifère Cerro Ballena, au Chili. Il montre des fossiles de baleines dans leur contexte de fouille; ce n’est pas une reconstitution de l’ensemble du processus de fossilisation.' },
  { id: 'rocks', icon: '⬡', title: 'Types de roches', eyebrow: 'CYCLE DES ROCHES', heading: 'La matière se transforme', body: 'Compare de vrais échantillons photographiés. Leur apparence varie selon la composition, la taille des grains, le refroidissement et les transformations subies.', tags: ['Ignées', 'Sédimentaires', 'Métamorphiques'], scene: 'PHOTOGRAPHIES D’ÉCHANTILLONS RÉELS', fact: 'Une photo représente un échantillon précis; une même famille de roches peut présenter des textures et des couleurs très différentes.' },
];

const rocks = [
  { name: 'Granite', group: 'Ignée', file: 'granite', note: 'Roche intrusive à cristaux visibles, formée par refroidissement lent du magma en profondeur.' },
  { name: 'Basalte', group: 'Ignée', file: 'basalte', note: 'Roche volcanique sombre, généralement à grains fins, issue d’une lave refroidie.' },
  { name: 'Andésite', group: 'Ignée', file: 'andesite', note: 'Roche volcanique fréquente dans les arcs volcaniques; sa texture varie selon le refroidissement.' },
  { name: 'Gabbro', group: 'Ignée', file: 'gabbro', note: 'Roche intrusive sombre à gros cristaux, chimiquement proche du basalte.' },
  { name: 'Obsidienne', group: 'Ignée', file: 'obsidienne', note: 'Verre volcanique naturel formé par refroidissement très rapide d’une lave riche en silice.' },
  { name: 'Pierre ponce', group: 'Ignée', file: 'pierre-ponce', note: 'Roche volcanique très vésiculaire, dont les cavités résultent des gaz emprisonnés.' },
  { name: 'Rhyolite', group: 'Ignée', file: 'rhyolite', note: 'Roche volcanique riche en silice, équivalent extrusif du granite.' },
  { name: 'Tuf volcanique', group: 'Ignée', file: 'tuf', note: 'Roche consolidée à partir de cendres et fragments expulsés lors d’éruptions.' },
  { name: 'Grès', group: 'Sédimentaire', file: 'gres', note: 'Roche détritique faite de grains de sable compactés et cimentés.' },
  { name: 'Conglomérat', group: 'Sédimentaire', file: 'conglomerat', note: 'Roche composée de galets arrondis liés par une matrice ou un ciment.' },
  { name: 'Calcaire', group: 'Sédimentaire', file: 'calcaire', note: 'Roche souvent riche en calcite, pouvant se former par accumulation de débris ou précipitation.' },
  { name: 'Schiste argileux', group: 'Sédimentaire', file: 'schiste-argileux', note: 'Roche fine issue de boues consolidées, souvent fissile en feuillets.' },
  { name: 'Craie', group: 'Sédimentaire', file: 'craie', note: 'Calcaire tendre et poreux, fréquemment constitué de microfossiles calcaires.' },
  { name: 'Marbre', group: 'Métamorphique', file: 'marbre', note: 'Calcaire recristallisé sous l’effet de la chaleur et de la pression.' },
  { name: 'Gneiss', group: 'Métamorphique', file: 'gneiss', note: 'Roche métamorphique à rubanement minéral caractéristique, formée à haute température et pression.' },
  { name: 'Ardoise', group: 'Métamorphique', file: 'ardoise', note: 'Roche à débit en feuillets, issue du métamorphisme de roches argileuses.' },
  { name: 'Micaschiste', group: 'Métamorphique', file: 'micaschiste', note: 'Roche feuilletée riche en micas, dont les minéraux sont orientés par le métamorphisme.' },
  { name: 'Quartzite', group: 'Métamorphique', file: 'quartzite', note: 'Roche dure issue de la recristallisation d’un grès riche en quartz.' },
];

const references = {
  volcano: [{ title: 'Mont St. Helens — vue aérienne, 2024', image: '/references/st-helens-2024.jpg', credit: 'USGS · K. Spicer · domaine public', source: 'https://www.usgs.gov/media/images/aerial-photo-mount-st-helens-june-2024' }],
  plates: [
    { title: 'Carte détaillée des plaques tectoniques et de leurs mouvements', image: '/references/tectonic-plates-fr.svg', credit: 'Eric Gaba (Sting) · Wikimedia Commons · CC BY-SA 2.5', source: 'https://commons.wikimedia.org/wiki/File:Tectonic_plates_boundaries_detailed-fr.svg' },
  ],
  sediments: [
    { title: 'Ammonite — coquille fossile en spirale', image: '/references/fossil-ammonite.jpg', credit: 'USGS · Annie Scott · domaine public', source: 'https://www.usgs.gov/media/images/fossil-ammonite' },
    { title: 'Poisson fossile — Fossil Butte', image: '/references/fossil-fish.jpg', credit: 'NPS · Jim Tynsky · domaine public', source: 'https://npgallery.nps.gov/AssetDetail/8e3b95ea-1005-4c34-b4f0-05086409dbd4' },
    { title: 'Trilobite fossile — invertébré marin', image: '/references/fossil-trilobite.jpg', credit: 'USGS · Bruce Avera Hunter · domaine public', source: 'https://www.usgs.gov/media/images/trilobite-fossil' },
    { title: 'Strates sédimentaires inclinées', image: '/references/sedimentary-outcrop.jpg', credit: 'USGS · domaine public', source: 'https://www.usgs.gov/media/images/sedimentary-rock' },
  ],
};

function RockGallery({ selected, onSelect }) {
  const [filter, setFilter] = useState('Toutes');
  const filtered = rocks.filter((rock) => filter === 'Toutes' || rock.group === filter);
  const current = rocks.find((rock) => rock.name === selected) || rocks[0];
  return <section className="rock-library" aria-label="Photothèque de roches">
    <div className="rock-library-head"><div><span className="photo-kicker">COLLECTION PHOTOGRAPHIQUE · ÉCHANTILLONS 2D</span><p>18 roches à observer, classées par origine.</p></div><div className="rock-filters" role="group" aria-label="Filtrer les roches">{['Toutes', 'Ignée', 'Sédimentaire', 'Métamorphique'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item === 'Toutes' ? 'Toutes' : `${item}${item === 'Ignée' ? 's' : 's'}`}</button>)}</div></div>
    <div className="rock-feature"><img src={`/rocks/${current.file}.jpg`} alt={`Photographie d’un échantillon de ${current.name}`} /><div><span>{current.group.toUpperCase()} · ÉCHANTILLON RÉEL</span><h3>{current.name}</h3><p>{current.note}</p><a href="https://commons.wikimedia.org/wiki/Category:Ward%27s_University_Rock_Collection" target="_blank" rel="noreferrer">Source des photographies · collection GeoDIL ↗</a></div></div>
    <div className="rock-grid">{filtered.map((rock) => <button key={rock.name} className={`rock-card ${rock.name === current.name ? 'active' : ''}`} onClick={() => onSelect(rock.name)} aria-pressed={rock.name === current.name}><img loading="lazy" src={`/rocks/${rock.file}.jpg`} alt="" /><span>{rock.name}</span><small>{rock.group}</small></button>)}</div>
  </section>;
}

function FieldReferences({ mode }) {
  const items = references[mode] || [];
  const [index, setIndex] = useState(0);
  const item = items[index % items.length];
  return <div className={`field-reference reference-${mode}`}>
    <img src={item.image} alt={item.title} />
    <div className="reference-caption"><span>RÉFÉRENCE VISUELLE · {mode === 'plates' ? 'CARTE EN FRANÇAIS' : 'PHOTOGRAPHIE DOCUMENTÉE'}</span><b>{item.title}</b><small>{item.credit}</small><a href={item.source} target="_blank" rel="noreferrer">Consulter la source ↗</a></div>
    {items.length > 1 && <div className="reference-nav"><button onClick={() => setIndex((index + items.length - 1) % items.length)} aria-label="Référence précédente">←</button><span>{index + 1} / {items.length}</span><button onClick={() => setIndex((index + 1) % items.length)} aria-label="Référence suivante">→</button></div>}
  </div>;
}

export default function App() {
  const orbitApiRef = useRef(null);
  const [active, setActive] = useState('volcano');
  const [boundary, setBoundary] = useState('Divergente');
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [intenseEruption, setIntenseEruption] = useState(false);
  const [selectedRock, setSelectedRock] = useState('Granite');
  const [view, setView] = useState('model');
  const module = modules.find((item) => item.id === active);
  const canReference = active !== 'rocks';
  const referenceMode = view === 'reference' && canReference;
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Terra accueil"><span className="brand-mark">T</span><span><b>TERRA</b><small>FUTUR HAÏTI · SCIENCES DE LA TERRE</small></span></a>
      <div className="top-center"><span className="live-dot" /> LABORATOIRE INTERACTIF <i>·</i> VERSION DÉMO</div>
      <button className="about-button" onClick={() => document.getElementById('sources')?.scrollIntoView({ behavior: 'smooth' })}>Sources & méthode <span>↗</span></button>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <div className="side-kicker">EXPLORER</div><h1><span>La Terre</span><em>en mouvement.</em></h1>
        <p className="intro">Observe les processus géologiques et compare les modèles à des références du monde réel.</p>
        <div className="module-list" role="tablist" aria-label="Modules géologiques">
          {modules.map((item, index) => <button key={item.id} role="tab" aria-selected={active === item.id} className={`module-tab ${active === item.id ? 'active' : ''}`} onClick={() => { setActive(item.id); setView('model'); }}>
            <span className="module-index">0{index + 1}</span><span className="module-icon">{item.icon}</span><span className="module-name"><b>{item.title}</b><small>{item.eyebrow}</small></span><span className="tab-arrow">↗</span>
          </button>)}
        </div>
        {active === 'plates' && <div className="side-control"><label htmlFor="boundary">TYPE DE LIMITE</label><select id="boundary" value={boundary} onChange={(event) => setBoundary(event.target.value)}><option>Divergente</option><option>Convergente</option><option>Transformante</option></select></div>}
        <div className="side-bottom"><span className="source-dot" /> Références et modèles pédagogiques <span>·</span> FR</div>
      </aside>
      <section className="main-panel">
        <div className="scene-topline"><div><span className="scene-kicker">{module.eyebrow} <b>/</b> {active === 'rocks' ? 'PHOTOTHÈQUE' : referenceMode ? 'RÉFÉRENCE DU TERRAIN' : 'EXPLORATION 3D'}</span><h2>{module.heading}</h2></div><div className="scene-actions">{active !== 'rocks' && <div className="view-toggle" role="group" aria-label="Choisir modèle ou référence"><button className={!referenceMode ? 'active' : ''} onClick={() => setView('model')}>Modèle</button><button className={referenceMode ? 'active' : ''} onClick={() => setView('reference')}>{active === 'plates' ? 'Carte en français' : 'Photo réelle'}</button></div>}{active === 'volcano' && !referenceMode && <button className={`eruption-button ${intenseEruption ? 'active' : ''}`} aria-pressed={intenseEruption} onClick={() => { setIntenseEruption((value) => !value); setPlaying(true); }}>{intenseEruption ? 'Éruption intense · ON' : 'Simuler une éruption intense'}</button>}{!referenceMode && active !== 'rocks' && <button className="icon-button" title={playing ? 'Mettre en pause' : 'Lire'} onClick={() => setPlaying((value) => !value)}>{playing ? 'Ⅱ' : '▶'}</button>}</div></div>
        {active === 'rocks' ? <RockGallery selected={selectedRock} onSelect={setSelectedRock} /> : <div className={`scene-wrap ${referenceMode ? 'reference-wrap' : ''}`}>
          {referenceMode ? <FieldReferences key={active} mode={active} /> : <><GeologyScene mode={active} boundary={boundary} speed={speed} playing={playing} intense={intenseEruption} selectedRock={selectedRock} orbitApiRef={orbitApiRef} />
            <div className="scene-stamp"><span>{active === 'volcano' ? 'MONT ST. HELENS · RELIEF USGS' : active === 'sediments' ? 'CERRO BALLENA · SCAN 3D CC0' : active === 'plates' && boundary === 'Convergente' ? 'PLAQUE COCOS · USGS SLAB2' : 'TERRE · 3D'}</span><span>SCÈNE {String(modules.findIndex((entry) => entry.id === active) + 1).padStart(2, '0')} / 04</span></div>
            <div className="orbit-tools" role="group" aria-label="Commandes de la caméra 3D">
              <button aria-label="Zoom avant" title="Zoom avant" onClick={() => orbitApiRef.current?.zoomIn()}>+</button>
              <button aria-label="Recentrer la vue" title="Recentrer la vue" onClick={() => orbitApiRef.current?.reset()}>↺</button>
              <button aria-label="Zoom arrière" title="Zoom arrière" onClick={() => orbitApiRef.current?.zoomOut()}>−</button>
            </div>
            {active === 'plates' && <>
              <div className="scene-legend" aria-label="Légende des éléments tectoniques">
                {(boundary === 'Divergente'
                  ? [['legend-stone', 'Plaques océaniques'], ['legend-copper', 'Dorsale médio-océanique'], ['legend-mantle', 'Manteau supérieur']]
                  : boundary === 'Convergente'
                    ? [['legend-continent', 'Plaque continentale'], ['legend-stone', 'Plaque océanique Cocos'], ['legend-copper', 'Fosse + arc volcanique'], ['legend-mantle', 'Manteau · plaque plongeante']]
                    : [['legend-continent', 'Plaque nord'], ['legend-stone', 'Plaque sud'], ['legend-copper', 'Faille transformante'], ['legend-mantle', 'Manteau supérieur']]
                ).map(([tone, name]) => <span key={name}><i className={tone} />{name}</span>)}
              </div>
              <div className="movement-caption"><b>{boundary === 'Divergente' ? '←  ÉCARTEMENT  →' : boundary === 'Convergente' ? '→  CONVERGENCE  ←' : '⇄  COULISSAGE  ⇄'}</b><span>{boundary === 'Divergente' ? 'Les plaques s’écartent; le magma remonte et forme une dorsale.' : boundary === 'Convergente' ? 'La plaque océanique Cocos plonge sous la plaque continentale.' : 'Deux plaques coulissent latéralement en sens opposés.'}</span><small>Mouvement pédagogique, accéléré et bouclé · schéma non à l’échelle</small></div>
            </>}
            <div className="scene-controls"><span className="gesture-desktop">Glisser : tourner <i>·</i> Clic droit : déplacer <i>·</i> Molette : zoomer</span><span className="gesture-mobile">1 doigt : tourner <i>·</i> 2 doigts : déplacer et zoomer</span><label className="speed-control">VITESSE <input aria-label="Vitesse de simulation" type="range" min="0.25" max="2.5" step="0.25" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><b>{speed.toFixed(2)}×</b></label></div></>}
        </div>}
        <div className="info-grid">
          <article className="explain-card"><div className="card-label"><span>01 / COMPRENDRE</span><span>↗</span></div><p>{module.body}</p><div className="tag-row">{module.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>
          <article className="fact-card"><div className="card-label"><span>À RETENIR</span><span>✳</span></div><p>{module.fact}</p><div className="fact-foot"><span className="live-dot" /> {active === 'rocks' ? 'ÉCHANTILLONS PHOTOGRAPHIÉS' : referenceMode ? 'SOURCE DOCUMENTÉE' : active === 'sediments' ? 'SCAN 3D CC0 · SMITHSONIAN' : active === 'volcano' ? 'RELIEF USGS · VERTICALITÉ ADAPTÉE' : active === 'plates' && boundary === 'Convergente' ? 'SURFACE USGS SLAB2 · PROFONDEUR ADAPTÉE' : 'MODÈLE PÉDAGOGIQUE SCHÉMATIQUE'}</div></article>
        </div>
        <footer id="sources" className="sources"><span>SOURCES SCIENTIFIQUES</span><a href="https://pubs.usgs.gov/publication/ds904" target="_blank" rel="noreferrer">USGS · DEM St. Helens 2009 ↗</a><a href="https://earthquake.usgs.gov/static/lfs/data/slab/models/" target="_blank" rel="noreferrer">USGS · géométries Slab2 ↗</a><a href="https://www.si.edu/object/3d/fossil-whale-excavation-site-mpc-677:a4068a00-9712-4c8e-8948-a9e2ea27fe0a" target="_blank" rel="noreferrer">Smithsonian · scan Cerro Ballena CC0 ↗</a><a href="https://www.usgs.gov/educational-resources/plate-tectonics" target="_blank" rel="noreferrer">USGS · tectonique ↗</a><a href="https://www.nps.gov/subjects/fossils/how-fossils-form.htm" target="_blank" rel="noreferrer">NPS · fossiles ↗</a><a href="https://commons.wikimedia.org/wiki/Category:Ward%27s_University_Rock_Collection" target="_blank" rel="noreferrer">GeoDIL · photos de roches CC0 ↗</a></footer>
      </section>
    </div>
  </main>;
}
