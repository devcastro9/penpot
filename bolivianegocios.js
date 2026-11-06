window.addEventListener('DOMContentLoaded', () => {
  'use strict';
  // Datos de demostración procedentes del HTML original. Campos de precio/pago añadidos para probar filtros.
  const photos = { cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop', hardware: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop', gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop', fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop', tech: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop' };

  const businesses = [
    {
      id: 1,
      name: 'Café Andino',
      category: 'Restaurantes',
      subcategory: 'Cafeterías',
      zone: 'Centro Histórico',
      rating: 4.8,
      reviews: 124,
      distance: 0.5,
      phone: '+591 71234567',
      open: true,
      photo: photos.cafe,
      lat: -19.0333,
      lng: -65.2627,
      featured: true,
      price: 'moderado',
      payments: ['efectivo', 'qr', 'tarjeta'],
      description: 'Café de especialidad, repostería artesanal y ambiente acogedor en el Centro Histórico de Sucre.'
    },
    {
      id: 2,
      name: 'Ferretería El Constructor',
      category: 'Tiendas',
      subcategory: 'Ferreterías',
      zone: 'Mercado Campesino',
      rating: 4.6,
      reviews: 98,
      distance: 2.5,
      phone: '+591 76543210',
      open: true,
      photo: photos.hardware,
      lat: -19.0415,
      lng: -65.2490,
      price: 'economico',
      payments: ['efectivo', 'qr'],
      description: 'Herramientas, materiales y soluciones para proyectos de construcción.'
    },
    {
      id: 3,
      name: 'FitZone Gym',
      category: 'Salud y Bienestar',
      subcategory: 'Gimnasios',
      zone: 'Zona Recoleta',
      rating: 4.7,
      reviews: 76,
      distance: 1.8,
      phone: '+591 77778888',
      open: null,
      photo: photos.gym,
      lat: -19.0450,
      lng: -65.2570,
      price: 'premium',
      payments: ['efectivo', 'qr', 'tarjeta'],
      description: 'Entrenamiento, acondicionamiento físico y bienestar en Sucre.'
    },
    {
      id: 4,
      name: 'Rincón de Moda',
      category: 'Tiendas',
      subcategory: 'Moda',
      zone: 'Zona Central',
      rating: 4.5,
      reviews: 63,
      distance: 0.9,
      phone: '+591 78889990',
      open: true,
      photo: photos.fashion,
      lat: -19.0365,
      lng: -65.2660,
      price: 'moderado',
      payments: ['efectivo', 'qr'],
      description: 'Ropa y accesorios para todos los estilos.'
    },
    {
      id: 5,
      name: 'TecnoSol',
      category: 'Servicios',
      subcategory: 'Tecnología',
      zone: 'Zona Terminal',
      rating: 4.4,
      reviews: 52,
      distance: 2.1,
      phone: '+591 73221100',
      open: null,
      photo: photos.tech,
      lat: -19.0280,
      lng: -65.2500,
      price: 'moderado',
      payments: ['efectivo', 'qr', 'tarjeta'],
      description: 'Soporte informático, mantenimiento y soluciones tecnológicas en Sucre.'
    }
  ];

  const categories = [{ name: 'Restaurantes', color: '#F97316', letter: 'R', icon: 'utensils' }, { name: 'Tiendas', color: '#146EF5', letter: 'T', icon: 'shopping-bag' }, { name: 'Servicios', color: '#0D9488', letter: 'S', icon: 'wrench' }, { name: 'Salud y Bienestar', color: '#A855F7', letter: 'B', icon: 'heart-pulse' }, { name: 'Hoteles', color: '#7C3AED', letter: 'H', icon: 'bed-double' }];
  const categoryByName = new Map(categories.map(category => [category.name, category]));
  const businessById = new Map(businesses.map(business => [business.id, business]));
  const initialView = { center: [-19.0333, -65.2627], zoom: 13 };
  const $ = id => document.getElementById(id); const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const defaultFilters = Object.freeze({ search: '', category: 'all', subcategory: 'all', price: 'all', payment: 'all', open: false, minRating: 'all', sort: 'default', favoritesOnly: false });
  const state = { ...defaultFilters, selected: null, favorites: new Set(), location: null };
  try { state.favorites = new Set(JSON.parse(localStorage.getItem('bn-favorites') || '[]')) } catch { state.favorites = new Set() }
  const currencyLabel = { economico: 'Económico', moderado: 'Moderado', premium: 'Premium' };
  let map, markers, userMarker, markerById = new Map(), toastTimer, previousFocus = null;
  const icon = (name, klass = 'icon-sm') => `<i data-lucide="${name}" class="${klass}"></i>`;
  const refreshIcons = () => { if (window.lucide) lucide.createIcons() };
  const choices = (items, current) => items.map(([value, label]) => `<option value="${esc(value)}" ${current === value ? 'selected' : ''}>${esc(label)}</option>`).join('');
  const subcats = () => [...new Set(businesses.filter(b => state.category === 'all' || b.category === state.category).map(b => b.subcategory))].sort();
  function filterMarkup(target) {
    return `
        <div class="filter-group"><label class="label">Busqueda</label><div class="relative"><i data-lucide="search"
          class="icon pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400" aria-hidden="true"></i><input id="${target === 'desktop' ? 'searchInput' : 'searchInputDrawer'}"
          type="search" autocomplete="off" aria-label="Buscar negocios, categorías o zonas"
          placeholder="Negocio, categoría o zona..."
          class="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[13px] text-ink outline-none placeholder:text-slate-400 focus:border-[#80b5ff] focus:ring-2 focus:ring-[#80b5ff]/40">
        </div></div>
        <details class="filter-group" open><summary>Ciudad / región ${icon('chevron-down')}</summary><select class="field" aria-label="Ciudad / región" disabled title="Próximamente más ciudades"><option>Sucre · Bolivia</option></select><p class="mt-1.5 text-[10px] text-muted">Por ahora, disponible solo en Sucre.</p></details>
        <details class="filter-group" open><summary>Categoría ${icon('chevron-down')}</summary><div class="mt-3"><select class="field" data-filter="category" aria-label="Categoría">${choices([['all', 'Todas las categorías'], ...categories.map(c => [c.name, c.name])], state.category)}</select><label class="label mt-3">Subcategoría</label><select class="field" data-filter="subcategory" aria-label="Subcategoría">${choices([['all', 'Todas las subcategorías'], ...subcats().map(s => [s, s])], state.subcategory)}</select></div></details>
        <details class="filter-group" open><summary>Presupuesto y pagos ${icon('chevron-down')}</summary><div class="mt-3"><label class="label">Rango de precios</label><select class="field" data-filter="price">${choices([['all', 'Todos los precios'], ['economico', 'Económico'], ['moderado', 'Moderado'], ['premium', 'Premium']], state.price)}</select><label class="label mt-3">Forma de pago</label><select class="field" data-filter="payment">${choices([['all', 'Cualquier método'], ['efectivo', 'Efectivo'], ['qr', 'QR'], ['tarjeta', 'Tarjeta']], state.payment)}</select></div></details>
        <details class="filter-group" open><summary>Disponibilidad y valoración ${icon('chevron-down')}</summary><div class="mt-3"><label class="check"><input type="checkbox" data-filter="open" ${state.open ? 'checked' : ''}>Abierto ahora <span class="ml-auto text-[10px] text-muted">Demostración</span></label><label class="label mt-3">Calificación mínima</label><select class="field" data-filter="minRating">${choices([['all', 'Cualquiera'], ['4.5', '4.5 estrellas o más'], ['4.7', '4.7 estrellas o más'], ['4.8', '4.8 estrellas o más']], state.minRating)}</select></div></details>
        <details class="filter-group" open><summary>Ordenar resultados ${icon('chevron-down')}</summary><div class="mt-3"><select class="field" data-filter="sort">${choices([['default', 'Más relevantes'], ['rating', 'Mejor valorados'], ['near', 'Más cercanos'], ['name', 'Nombre A–Z']], state.sort)}</select></div></details>`
  }
  function getResults() {
    const q = state.search.trim().toLocaleLowerCase('es'); const matches = businesses.filter(b =>
      (state.category === 'all' || b.category === state.category) &&
      (state.subcategory === 'all' || b.subcategory === state.subcategory) &&
      (state.price === 'all' || b.price === state.price) &&
      (state.payment === 'all' || b.payments.includes(state.payment)) &&
      (!state.open || b.open === true) &&
      (state.minRating === 'all' || b.rating >= Number(state.minRating)) &&
      (!state.favoritesOnly || state.favorites.has(b.id)) &&
      (!q || [b.name, b.category, b.subcategory, b.zone, 'Sucre', b.description].some(s => s.toLocaleLowerCase('es').includes(q))));
    const comparators = {
      rating: (a, b) => b.rating - a.rating,
      near: (a, b) => distanceOf(a) - distanceOf(b),
      name: (a, b) => a.name.localeCompare(b.name, 'es'),
      default: (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.rating - a.rating
    };
    return matches.sort(comparators[state.sort] || comparators.default);
  }
  function distanceOf(b) { if (!state.location) return b.distance; const rad = Math.PI / 180; const dLat = (b.lat - state.location.lat) * rad, dLng = (b.lng - state.location.lng) * rad; const a = Math.sin(dLat / 2) ** 2 + Math.cos(state.location.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
  function badges(b) { return `<span class="badge-small ${b.open === true ? 'status-open' : 'status-unknown'}">${b.open === true ? '● Abierto (demo)' : 'Horario no verificado'}</span>` }
  function card(b, mini = false) {
    const fav = state.favorites.has(b.id), active = state.selected === b.id; return `<article data-business="${b.id}" tabindex="0" role="button" aria-label="Ver ${esc(b.name)} en el mapa" class="business-card ${active ? 'selected' : ''} ${mini ? 'w-[min(83vw,325px)] shrink-0 snap-center shadow-float' : ''}">
        <div class="flex gap-3"><img src="${esc(b.photo)}" alt="Imagen ilustrativa de ${esc(b.name)}" loading="lazy" width="108" height="112"><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-1"><div class="min-w-0">${b.featured ? '<span class="mb-1 inline-block rounded-md bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">Destacado · Promoción</span>' : ''}<h3 class="text-[13px] font-extrabold leading-5 text-ink">${esc(b.name)}</h3></div><button data-favorite="${b.id}" class="favorite shrink-0" type="button" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de' : 'Agregar a'} favoritos: ${esc(b.name)}" title="Favoritos">${icon('heart', 'icon')}</button></div><p class="mt-1 truncate text-[11px] text-muted">${esc(b.subcategory)} · ${esc(b.category)}</p><p class="mt-1 flex items-center gap-1 text-[11px]"><span class="font-bold text-amber-500">★</span><strong>${b.rating.toFixed(1)}</strong><span class="text-muted">(${b.reviews} reseñas · demo)</span></p><p class="mt-1 truncate text-[10px] text-muted">${icon('map-pin')} Sucre · ${esc(b.zone)}</p></div></div>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2"><span class="flex items-center gap-1 text-[10px] text-muted">${icon('navigation')} ${distanceOf(b).toFixed(1)} km ${state.location ? 'aprox.' : '· demo'}</span>${badges(b)}</div>
        <div class="mt-3 flex gap-2"><a href="tel:${b.phone.replace(/\s/g, '')}" class="btn btn-secondary min-w-0 flex-1 px-2" aria-label="Llamar a ${esc(b.name)}">${icon('phone')} Llamar</a><a href="https://wa.me/${b.phone.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" class="btn btn-primary min-w-0 flex-[1.4] px-2" aria-label="Contactar a ${esc(b.name)} por WhatsApp">${icon('message-circle')} WhatsApp</a></div></article>`
  }
  function renderFilterContainer(id, target) { $(id).innerHTML = filterMarkup(target) }
  function renderFilters() { renderFilterContainer('filterContent', 'desktop'); renderFilterContainer('drawerContent', 'drawer'); }
  function chips() {
    const data = [state.search && ['Búsqueda: ' + state.search, 'search'], state.category !== 'all' && [state.category, 'category'], state.subcategory !== 'all' && [state.subcategory, 'subcategory'], state.price !== 'all' && [currencyLabel[state.price], 'price'], state.payment !== 'all' && [state.payment.toUpperCase(), 'payment'], state.open && ['Abiertos (demo)', 'open'], state.minRating !== 'all' && ['★ ' + state.minRating + '+', 'minRating'], state.favoritesOnly && ['Favoritos', 'favoritesOnly']].filter(Boolean);
    $('activeChips').innerHTML = data.map(([label, key]) => `<button data-remove="${key}" type="button" class="inline-flex min-h-[28px] items-center gap-1 rounded-full border border-[#d2e5ff] bg-[#eff6ff] px-2.5 text-[10px] font-semibold text-[#1754b8]">${esc(label)} ${icon('x')}</button>`).join('');
  }
  function renderTabs() { const cats = [{ name: 'Todas', value: 'all', icon: 'layout-grid' }, ...categories.map(c => ({ name: c.name, value: c.name, icon: c.icon }))]; $('categoryChips').innerHTML = cats.map(c => `<button type="button" class="pill shadow-soft" data-category="${esc(c.value)}" aria-pressed="${state.category === c.value}">${icon(c.icon)}${esc(c.name)}</button>`).join(''); }
  function renderCounts(count) {
    $('resultCount').textContent = `${count} ${count === 1 ? 'negocio encontrado' : 'negocios encontrados'} · Sucre`;
    $('mobileCount').textContent = `(${count})`;
  }
  function renderCards(data) {
    renderCounts(data.length);
    $('results').innerHTML = data.length ? data.map(b => card(b)).join('') : `<div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eff6ff] text-brand">${icon('search-x', 'icon-lg')}</div><h2 class="mt-4 font-bold">No encontramos coincidencias</h2><p class="mt-2 text-xs leading-5 text-muted">Prueba otra búsqueda o elimina algunos filtros.</p><button class="btn btn-primary mt-5" data-action="reset" type="button">Limpiar filtros</button></div>`;
    $('mobileCards').innerHTML = data.slice(0, 5).map(b => card(b, true)).join(''); $('mobileCards').hidden = !data.length;
  }
  function markerIcon(b, active) { const c = categoryByName.get(b.category) || categories[0]; return L.divIcon({ className: '', html: `<div class="map-marker ${active ? 'is-active' : ''}" style="background:${c.color}"><span>${c.letter}</span></div>`, iconSize: [42, 42], iconAnchor: [18, 37], popupAnchor: [0, -30] }) }
  function renderMap(data) {
    if (!map) return; markers.clearLayers(); markerById = new Map(); data.forEach(b => { const m = L.marker([b.lat, b.lng], { icon: markerIcon(b, b.id === state.selected), title: b.name, alt: b.name }); m.on('click', () => selectBusiness(b.id, { pan: false })); m.bindPopup(() => `<div style="max-width:220px"><strong style="font-size:13px">${esc(b.name)}</strong><p style="font-size:11px;color:#64748B;margin:6px 0">${esc(b.subcategory)} · ${esc(b.zone)}</p><p style="font-size:11px;margin:0 0 8px">★ ${b.rating.toFixed(1)} · ${b.reviews} reseñas (demo)</p><a style="color:#146EF5;font-weight:700;font-size:12px" href="https://wa.me/${b.phone.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer">Contactar por WhatsApp ↗</a></div>`); markerById.set(b.id, m); markers.addLayer(m) });
    if (state.selected && !markerById.has(state.selected)) { state.selected = null; map.closePopup() }
  }
  function render({ filters = false } = {}) {
    const data = getResults();
    if (state.selected && !data.some(b => b.id === state.selected)) state.selected = null;
    if (filters) renderFilters();
    renderTabs();
    chips();
    renderCards(data);
    renderMap(data);
    $('favoritesOnly').setAttribute('aria-pressed', String(state.favoritesOnly));
    $('favoritesOnly').classList.toggle('text-rose-300', state.favoritesOnly);
    for (const id of ['searchInput', 'searchInputDrawer']) {
      if ($(id) && $(id).value !== state.search) $(id).value = state.search;
    }
    refreshIcons();
  }
  function setFilter(key, value) { if (key === 'open' || key === 'favoritesOnly') state[key] = Boolean(value); else state[key] = value; if (key === 'category') state.subcategory = 'all'; render({ filters: true }); }
  function toast(text) { const t = $('toast'); clearTimeout(toastTimer); t.textContent = text; t.hidden = false; toastTimer = setTimeout(() => t.hidden = true, 2500) }
  function selectBusiness(id, { pan = true } = {}) { const b = businessById.get(id); if (!b) return; state.selected = id; const data = getResults(); renderCards(data); markerById.forEach((m, mid) => { const found = businessById.get(mid); m.setIcon(markerIcon(found, mid === id)) }); const m = markerById.get(id); if (m) { if (markers.zoomToShowLayer) { markers.zoomToShowLayer(m, () => { if (pan) map.panTo([b.lat, b.lng]); m.openPopup() }) } else { if (pan) map.panTo([b.lat, b.lng]); m.openPopup() } } if (window.innerWidth >= 768) { document.querySelector(`#results [data-business="${id}"]`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }) } refreshIcons(); }
  function reset() { Object.assign(state, defaultFilters, { selected: null }); render({ filters: true }); if (map) { map.setView(initialView.center, initialView.zoom); map.closePopup(); } }
  function toggleFavorite(id) { if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id); try { localStorage.setItem('bn-favorites', JSON.stringify([...state.favorites])) } catch { } toast(state.favorites.has(id) ? 'Guardado en favoritos' : 'Eliminado de favoritos'); render() }
  function openModal(modalId, focusId) { previousFocus = document.activeElement; $('overlay').hidden = false; $(modalId).hidden = false; document.body.style.overflow = 'hidden'; $(focusId)?.focus() }
  function openDrawer() { openModal('filterDrawer', 'closeDrawer') }
  function closeModal() { const wasOpen = !$('filterDrawer').hidden || !$('infoDialog').hidden; $('overlay').hidden = true; $('filterDrawer').hidden = true; $('infoDialog').hidden = true; document.body.style.overflow = ''; if (wasOpen) previousFocus?.focus() }
  function openInfo(message) { openModal('infoDialog', 'closeInfo'); $('infoMessage').textContent = message }
  function mobileMode(mode) { document.body.classList.toggle('list-mode', mode === 'list'); for (const [id, active] of [['mapMode', mode === 'map'], ['listMode', mode === 'list']]) { const b = $(id); b.setAttribute('aria-pressed', String(active)); b.classList.toggle('bg-[#eaf2ff]', active); b.classList.toggle('text-brand', active); b.classList.toggle('text-muted', !active) } if (mode === 'map' && map) setTimeout(() => map.invalidateSize(), 80) }
  function closeMenu() { $('menu').hidden = true; $('menuButton').setAttribute('aria-expanded', 'false') }
  document.addEventListener('click', e => { const fav = e.target.closest('[data-favorite]'); if (fav) { e.stopPropagation(); toggleFavorite(Number(fav.dataset.favorite)); return } const remove = e.target.closest('[data-remove]'); if (remove) { const key = remove.dataset.remove; setFilter(key, key === 'open' || key === 'favoritesOnly' ? false : key === 'search' ? '' : 'all'); return } const cat = e.target.closest('[data-category]'); if (cat) { setFilter('category', cat.dataset.category); return } const action = e.target.closest('[data-action]'); if (action) { closeMenu(); if (action.dataset.action === 'reset') reset(); else if (action.dataset.action === 'about') openInfo('Esta versión funciona con 5 negocios de demostración del archivo original. La ubicación y las coordenadas son ilustrativas; horarios, distancias, precios, pagos y calificaciones no son datos verificados en vivo. Para producción se requiere poseer una base de datos y REST API.'); return } const cardEl = e.target.closest('[data-business]'); if (cardEl && !e.target.closest('a,button')) { selectBusiness(Number(cardEl.dataset.business)); if (window.innerWidth < 768 && document.body.classList.contains('list-mode')) mobileMode('map') } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeModal() } if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-business]')) { e.preventDefault(); selectBusiness(Number(e.target.dataset.business)); if (window.innerWidth < 768) mobileMode('map') } });
  document.addEventListener('change', e => {
    const target = e.target.closest('[data-filter]');
    if (!target) return;
    const container = target.closest('#filterContent, #drawerContent');
    const key = target.dataset.filter;
    setFilter(key, target.type === 'checkbox' ? target.checked : target.value);
    container?.querySelector(`[data-filter="${key}"]`)?.focus({ preventScroll: true });
  });
  // El buscador permanece dentro del grupo existente de filtros, sin formulario ni barra adicional.
  let searchTimer;
  const searchSelector = '#searchInput, #searchInputDrawer';
  function applySearch(value) {
    state.search = value.trim();
    render();
  }
  document.addEventListener('input', e => {
    if (!e.target.matches(searchSelector)) return;
    clearTimeout(searchTimer);
    const value = e.target.value;
    searchTimer = setTimeout(() => applySearch(value), 220);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches(searchSelector)) return;
    e.preventDefault();
    clearTimeout(searchTimer);
    applySearch(e.target.value);
  });
  document.querySelectorAll('.clearFilters').forEach(el => el.addEventListener('click', reset)); $('brand').addEventListener('click', e => { e.preventDefault(); reset() });
  $('favoritesOnly').addEventListener('click', () => setFilter('favoritesOnly', !state.favoritesOnly)); $('openFiltersTablet').addEventListener('click', openDrawer); $('mobileFilters').addEventListener('click', openDrawer);
  $('closeDrawer').addEventListener('click', closeModal); document.querySelectorAll('.applyFilters').forEach(button => button.addEventListener('click', () => { closeModal(); if (window.innerWidth < 768) mobileMode('list') })); $('overlay').addEventListener('click', closeModal); $('closeInfo').addEventListener('click', closeModal); $('okInfo').addEventListener('click', closeModal);
  $('menuButton').addEventListener('click', () => { const hidden = $('menu').hidden; $('menu').hidden = !hidden; $('menuButton').setAttribute('aria-expanded', String(hidden)) });
  document.addEventListener('click', e => { if (!e.target.closest('#menuButton,#menu')) closeMenu() });
  $('mapMode').addEventListener('click', () => mobileMode('map')); $('listMode').addEventListener('click', () => mobileMode('list'));
  $('locate').addEventListener('click', () => { if (!navigator.geolocation) { toast('La geolocalización no está disponible'); return } const button = $('locate'); button.disabled = true; toast('Consultando tu ubicación…'); navigator.geolocation.getCurrentPosition(pos => { button.disabled = false; state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude }; if (userMarker) map.removeLayer(userMarker); userMarker = L.circleMarker([state.location.lat, state.location.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#146EF5', fillOpacity: 1 }).addTo(map).bindPopup('Tu ubicación aproximada'); map.setView([state.location.lat, state.location.lng], 14); render(); toast('Ubicación actualizada') }, () => { button.disabled = false; toast('No se pudo obtener la ubicación. Revisa los permisos.') }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }) });
  try { if (typeof L === 'undefined') throw Error('Leaflet no disponible'); map = L.map('map', { zoomControl: false, preferCanvas: true }).setView(initialView.center, initialView.zoom); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>', maxZoom: 19 }).addTo(map); L.control.zoom({ position: 'topright' }).addTo(map); markers = typeof L.markerClusterGroup === 'function' ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 48, iconCreateFunction: cluster => L.divIcon({ html: `<div class="map-cluster">${cluster.getChildCount()}</div>`, className: '', iconSize: [42, 42] }) }) : L.layerGroup(); map.addLayer(markers); render({ filters: true }); setTimeout(() => map.invalidateSize(), 200) } catch (err) { console.error(err); $('map').innerHTML = '<div class="grid h-full place-items-center p-8 text-center"><div><strong>Mapa no disponible</strong><p class="mt-2 text-sm text-muted">Comprueba tu conexión y vuelve a cargar la página.</p><button class="btn btn-primary mt-3" onclick="location.reload()">Reintentar</button></div></div>'; render({ filters: true }); }
  const updateLayout = () => { const header = document.querySelector('header'); const switcher = $('mobileSwitch'); const reserved = header.getBoundingClientRect().height + (getComputedStyle(switcher).display === 'none' ? 0 : switcher.getBoundingClientRect().height); document.documentElement.style.setProperty('--header', `${Math.ceil(reserved)}px`); if (window.innerWidth >= 768) document.body.classList.remove('list-mode'); if (map) requestAnimationFrame(() => map.invalidateSize()) };
  new ResizeObserver(updateLayout).observe(document.querySelector('header'));
  window.addEventListener('resize', updateLayout);
  updateLayout();
});
