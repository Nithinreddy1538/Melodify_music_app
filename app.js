'use strict';

/*  1.  STATE */

const state = {
  allSongs:      [],    
  filtered:      [],    
  currentIdx:    -1,   
  isPlaying:     false,
  isShuffle:     false,
  isRepeat:      false,
  isMuted:       false,
  prevVolume:    0.75,
  activeFilter:  'all',
  searchQuery:   '',
  likedIds:      new Set(), // store liked song IDs
};


/*  2.  DOM CACHE */

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const EL = {
  // Audio engine
  audio:           $('audio'),

  // Greeting
  greetingHeading: $('greeting-heading'),
  greetingSub:     $('greeting-sub'),

  // Search
  searchInput:     $('search-input'),

  // Hero banner
  heroBanner:      $('hero-banner'),
  heroBg:          $('hero-bg'),
  heroPoster:      $('hero-poster'),
  heroTitle:       $('hero-title'),
  heroArtist:      $('hero-artist'),
  heroCategory:    $('hero-category'),
  heroBars:        $('hero-bars'),

  // Songs grid
  songsGrid:       $('songs-grid'),
  skeletonGrid:    $('skeleton-grid'),
  sectionTitle:    $('songs-section-title'),
  countBadge:      $('songs-count-badge'),
  noResults:       $('no-results'),
  noResultsQuery:  $('no-results-query'),
  noResultsClear:  $('no-results-clear'),

  // Player — info
  playerThumb:     $('player-thumb'),
  playerThumbRing: $('player-thumb-ring'),
  playerTrack:     $('player-track'),
  playerArtistName:$('player-artist-name'),
  likeBtn:         $('like-btn'),

  // Player — controls
  btnPlay:         $('btn-play'),
  btnPrev:         $('btn-prev'),
  btnNext:         $('btn-next'),
  btnShuffle:      $('btn-shuffle'),
  btnRepeat:       $('btn-repeat'),
  playPauseIcon:   $('play-pause-icon'),

  // Player — scrubber
  scrubberTrack:   $('scrubber-track'),
  scrubberFill:    $('scrubber-fill'),
  timeCurrent:     $('time-current'),
  timeTotal:       $('time-total'),

  // Player — volume
  btnMute:         $('btn-mute'),
  volumeIcon:      $('volume-icon'),
  volumeRange:     $('volume-range'),

  // Sidebar
  sidebar:         $('sidebar'),
  hamburgerBtn:    $('hamburger-btn'),
  sidebarOverlay:  $('sidebar-overlay'),
  navLinks:        $$('.nav-link'),
};

async function loadSongs() {
  try {
    const res = await fetch('assets/songs.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty array');

    bootstrap(data);
  } catch (err) {
    console.warn('⚠ Could not load songs.json — using built-in demo data.', err.message);
    bootstrap(getDemoSongs());
  }
}
function getDemoSongs() {
  // Colour-coded placeholder images (no external images needed)
  const colours = [
    ['1a1a2e','7c5cfc'], ['0f2027','1db954'], ['1a0a00','ff6b6b'],
    ['001e3c','00d2ff'], ['2c1654','f953c6'], ['1a1400','ffd700'],
    ['0d1b0d','56ab2f'], ['1a0014','ff4dff'],
  ];
  const cats = ['Electronic','Ambient','Lo-Fi','Chill','Electronic','Jazz','Ambient','Electronic'];
  const names = [
    ['Neon Pulse','Synthwave Studio'], ['Midnight Rain','Luna Waves'],
    ['City Lights','Urban Echo'],       ['Echoes of Space','Cosmos Drift'],
    ['Retrograde','80s Revival'],       ['Café Reverie','Jazzwave Project'],
    ['Forest Walk','Nature Sounds Co.'],['Signal Lost','Binary Dream'],
  ];
  const accentColors = ['#7c5cfc','#1db954','#ff6b6b','#00d2ff','#f953c6','#ffd700','#56ab2f','#ff4dff'];

  return names.map(([title, artist], i) => ({
    id: i + 1,
    title, artist,
    src: '',   // no real audio in demo mode
    poster: `https://placehold.co/300x300/${colours[i][0]}/${colours[i][1]}?text=${encodeURIComponent(title.slice(0,2))}`,
    category: cats[i],
    color: accentColors[i],
  }));
}
function bootstrap(songs) {
  state.allSongs = songs;
  state.filtered = [...songs];

   EL.skeletonGrid.hidden = true;

  renderSongs(state.filtered);
  console.log(`🎵 Melodify ready — ${songs.length} songs loaded.`);
  console.log('💡 Keyboard: Space = play/pause | / = search | Alt+← → = prev/next');
}


/*   RENDERING */

/**
 * renderSongs(list)
 * Clears the grid and injects a card for every song in `list`.
 * @param {Object[]} list – subset of state.allSongs to display
 */
function renderSongs(list) {
  EL.songsGrid.innerHTML = '';
  EL.countBadge.textContent = `${list.length} track${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    EL.noResults.hidden = false;
    EL.noResultsQuery.textContent = state.searchQuery || state.activeFilter;
    return;
  }

  EL.noResults.hidden = true;
 
  const frag = document.createDocumentFragment();
  list.forEach(song => frag.appendChild(buildCard(song)));
  EL.songsGrid.appendChild(frag);
}

/**
 * buildCard(song)
 * Creates one song card element.
 * @param {Object} song – single song data object
 * @returns {HTMLElement}
 */
function buildCard(song) {
  const globalIdx = state.allSongs.findIndex(s => s.id === song.id);
  const isCurrent = state.currentIdx === globalIdx;
  const isPlaying = isCurrent && state.isPlaying;

  const card = document.createElement('div');
  card.className = 'song-card' + (isCurrent ? ' is-active' : '');
  card.dataset.idx = globalIdx;

  // Apply tinted glow colour from song metadata
  if (song.color) card.style.setProperty('--card-accent', song.color);

  // Fallback poster image
  const posterSrc = song.poster || `https://placehold.co/300x300/181818/535353?text=${encodeURIComponent(song.title.slice(0,2))}`;

  card.innerHTML = `
    <div class="card-img-wrap">
      <img
        src="${escHtml(posterSrc)}"
        alt="${escHtml(song.title)} cover"
        loading="lazy"
        onerror="this.src='https://placehold.co/300x300/181818/535353?text=♪'"
      />
      <span class="card-genre">${escHtml(song.category || 'Music')}</span>
      <div class="card-overlay">
        <button class="card-play-btn" aria-label="${isPlaying ? 'Pause' : 'Play'} ${escHtml(song.title)}">
          ${isCurrent && isPlaying
            ? `<span class="card-eq"><span></span><span></span><span></span></span>`
            : isCurrent
              ? `<i class="fa-solid fa-play"></i>`
              : `<i class="fa-solid fa-play"></i>`
          }
        </button>
      </div>
    </div>
    <p class="card-title">
      ${escHtml(song.title)}
      ${isCurrent ? '<span class="playing-dot"></span>' : ''}
    </p>
    <p class="card-artist">${escHtml(song.artist)}</p>
  `;

  // Clicking the card or its play button triggers playback
  card.addEventListener('click', (e) => {
     if (e.target.closest('.card-play-btn') || e.target.closest('.card-img-wrap') || true) {
      if (state.currentIdx === globalIdx) {
        togglePlay();
      } else {
        playSong(globalIdx);
      }
    }
  });

  return card;
}

/**
 * escHtml(str)
 * Prevents XSS when injecting data into innerHTML.
 * @param {*} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}


/*  5.  PLAYBACK CORE*/

/**
 * playSong(idx)
 * Load + play a song by its index in state.allSongs.
 * @param {number} idx
 */
function playSong(idx) {
  if (idx < 0 || idx >= state.allSongs.length) return;

  const song = state.allSongs[idx];
  state.currentIdx = idx;

  // Set audio source and volume
  EL.audio.src = song.src || '';
  EL.audio.volume = state.isMuted ? 0 : parseFloat(EL.volumeRange.value);
 
  const playPromise = EL.audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        state.isPlaying = true;
        syncAll(song);
      })
      .catch(() => {
         
        state.isPlaying = false;
        syncAll(song);
      });
  } else {
    state.isPlaying = false;
    syncAll(song);
  }
}

 
function togglePlay() {
  if (state.currentIdx === -1) {
    playSong(0);
    return;
  }
  if (state.isPlaying) {
    EL.audio.pause();
    state.isPlaying = false;
  } else {
    EL.audio.play().catch(() => {});
    state.isPlaying = true;
  }
  syncPlayState();
}

/*playNext()*/
function playNext() {
  const len = state.allSongs.length;
  if (len === 0) return;

  let next;
  if (state.isShuffle) {
    // Random, different from current
    do { next = Math.floor(Math.random() * len); }
    while (next === state.currentIdx && len > 1);
  } else {
    next = (state.currentIdx + 1) % len;
  }
  playSong(next);
}

/*playPrev()*/
function playPrev() {
  const len = state.allSongs.length;
  if (len === 0) return;

  if (EL.audio.currentTime > 3) {
    EL.audio.currentTime = 0;
    return;
  }
  const prev = (state.currentIdx - 1 + len) % len;
  playSong(prev);
}
/**
 * syncAll(song)
 * Master sync: call after a new song is selected.
 * @param {Object} song
 */
function syncAll(song) {
  syncPlayerInfo(song);
  syncPlayState();
  syncHero(song);
  syncCards();
  syncLikeBtn();
}
 
function syncPlayerInfo(song) {
  const src = song.poster || 'https://placehold.co/54x54/181818/535353?text=♪';
  EL.playerThumb.src = src;
  EL.playerThumb.onerror = () => {
    EL.playerThumb.src = 'https://placehold.co/54x54/181818/535353?text=♪';
  };
  EL.playerTrack.textContent      = song.title;
  EL.playerArtistName.textContent = song.artist;
}

function syncPlayState() {
  const playing = state.isPlaying;

  // Play/pause button icon
  EL.playPauseIcon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  EL.btnPlay.classList.toggle('playing', playing);

  // Poster pulsing ring
  EL.playerThumbRing.classList.toggle('active', playing);

  // Hero bars
  EL.heroBars.classList.toggle('paused', !playing);
 
  syncCards();
}
function syncHero(song) {
  EL.heroBanner.hidden = false;
  EL.heroPoster.src = song.poster || 'https://placehold.co/80x80/181818/535353?text=♪';
  EL.heroPoster.onerror = () => {
    EL.heroPoster.src = 'https://placehold.co/80x80/181818/535353?text=♪';
  };
  EL.heroTitle.textContent    = song.title;
  EL.heroArtist.textContent   = song.artist;
  EL.heroCategory.textContent = song.category || '';
 
  const col = song.color || '#1db954';
  EL.heroBg.style.background =
    `linear-gradient(135deg, ${hexToRgba(col, .25)} 0%, rgba(0,0,0,.65) 100%)`;
}
 
function syncCards() {
  document.querySelectorAll('.song-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const isCurrent = idx === state.currentIdx;
    const isPlaying = isCurrent && state.isPlaying;

    card.classList.toggle('is-active', isCurrent);

    // Update overlay button content
    const playBtn = card.querySelector('.card-play-btn');
    if (!playBtn) return;

    if (isCurrent && isPlaying) {
      playBtn.innerHTML = `<span class="card-eq"><span></span><span></span><span></span></span>`;
      playBtn.setAttribute('aria-label', 'Pause');
    } else {
      playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      playBtn.setAttribute('aria-label', 'Play');
    }

    // Playing dot in title
    const titleEl = card.querySelector('.card-title');
    if (titleEl) {
      // Remove old dot
      titleEl.querySelector('.playing-dot')?.remove();
      if (isCurrent) {
        const dot = document.createElement('span');
        dot.className = 'playing-dot';
        titleEl.appendChild(dot);
      }
    }

    // Scroll active card into view
    if (isCurrent) card.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });
}

function syncLikeBtn() {
  if (state.currentIdx === -1) return;
  const song = state.allSongs[state.currentIdx];
  const liked = state.likedIds.has(song.id);
  EL.likeBtn.classList.toggle('liked', liked);
  EL.likeBtn.querySelector('i').className = liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
}


/* 7.  PROGRESS / SEEK  */

/**
 * formatTime(secs)
 * 203 → "3:23"
 * @param {number} secs
 * @returns {string}
 */
function formatTime(secs) {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function onTimeUpdate() {
  const cur = EL.audio.currentTime;
  const dur = EL.audio.duration || 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  EL.scrubberFill.style.width = `${pct}%`;
  EL.timeCurrent.textContent  = formatTime(cur);
  EL.timeTotal.textContent    = formatTime(dur);
}

/**
 * seekFromEvent(e)
 * Converts a pointer event on the scrubber to a playback position.
 * @param {PointerEvent|MouseEvent} e
 */
function seekFromEvent(e) {
  const rect  = EL.scrubberTrack.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (isFinite(EL.audio.duration)) {
    EL.audio.currentTime = ratio * EL.audio.duration;
  }
}

// Drag-to-seek state
let isScrubbing = false;

function startScrub(e) {
  isScrubbing = true;
  seekFromEvent(e);
}
function onScrubMove(e) {
  if (isScrubbing) seekFromEvent(e);
}
function stopScrub() {
  isScrubbing = false;
}


/* 8.  VOLUME / MUTE  */

/**
 * applyVolume(val)
 * Set audio volume (0–1) and update icon + slider UI.
 * @param {number} val
 */
function applyVolume(val) {
  val = Math.max(0, Math.min(1, val));
  EL.audio.volume     = val;
  EL.volumeRange.value = val;
  if (val > 0) state.prevVolume = val;

  // Choose icon
  if (val === 0) {
    EL.volumeIcon.className = 'fa-solid fa-volume-xmark';
    state.isMuted = true;
  } else if (val < 0.4) {
    EL.volumeIcon.className = 'fa-solid fa-volume-low';
    state.isMuted = false;
  } else {
    EL.volumeIcon.className = 'fa-solid fa-volume-high';
    state.isMuted = false;
  }
}

/**
 * toggleMute()
 * Mute ↔ restore previous volume.
 */
function toggleMute() {
  if (state.isMuted || EL.audio.volume === 0) {
    applyVolume(state.prevVolume || 0.75);
  } else {
    state.prevVolume = EL.audio.volume;
    applyVolume(0);
  }
}


/*  9.  SEARCH  */

 
function handleSearch() {
  state.searchQuery = EL.searchInput.value.trim().toLowerCase();
  applyFilters();
}

 
function clearSearch() {
  EL.searchInput.value = '';
  state.searchQuery = '';
  applyFilters();
  EL.searchInput.focus();
}


/*  10.  CATEGORY FILTER  */

/**
 * handleNavClick(e)
 * Fired when a sidebar link is clicked.
 * @param {Event} e
 */
function handleNavClick(e) {
  e.preventDefault();
  const link = e.currentTarget;
  state.activeFilter = link.dataset.filter;
  // Update active class on links
  EL.navLinks.forEach(l => l.classList.toggle('active', l === link));
  // Update section title
  EL.sectionTitle.textContent =
    state.activeFilter === 'all' ? 'All Songs' : state.activeFilter;
  applyFilters();
  closeSidebar();
}
 
function applyFilters() {
  let list = state.allSongs;
  // Category filter
  if (state.activeFilter !== 'all') {
    list = list.filter(s => s.category === state.activeFilter);
  }
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(s =>
      s.title.toLowerCase().includes(q)  ||
      s.artist.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }
  state.filtered = list;
  renderSongs(list);
}


/* 11.  SHUFFLE / REPEAT  */
function toggleShuffle() {
  state.isShuffle = !state.isShuffle;
  EL.btnShuffle.classList.toggle('active', state.isShuffle);
  EL.btnShuffle.title = state.isShuffle ? 'Shuffle: On' : 'Shuffle';
}

function toggleRepeat() {
  state.isRepeat = !state.isRepeat;
  EL.btnRepeat.classList.toggle('active', state.isRepeat);
  EL.audio.loop = state.isRepeat; // native HTML5 loop
  EL.btnRepeat.title = state.isRepeat ? 'Repeat: On' : 'Repeat';
}


/* 12.  LIKE  */
function toggleLike() {
  if (state.currentIdx === -1) return;
  const id = state.allSongs[state.currentIdx].id;
  if (state.likedIds.has(id)) {
    state.likedIds.delete(id);
  } else {
    state.likedIds.add(id);
  }
  syncLikeBtn();

  try {
    localStorage.setItem('melodify-likes', JSON.stringify([...state.likedIds]));
  } catch (_) { /* localStorage might be blocked */ }
}

 
function restoreLikes() {
  try {
    const saved = JSON.parse(localStorage.getItem('melodify-likes') || '[]');
    if (Array.isArray(saved)) saved.forEach(id => state.likedIds.add(id));
  } catch (_) {}
}


/* 13.  GREETING  */
function setGreeting() {
  const h = new Date().getHours();
  let text, sub;

  if (h >= 5  && h < 12) { text = 'Good Morning ☀️'; sub = 'Start your day with great music!'; }
  else if (h < 17)        { text = 'Good Afternoon 🌤️'; sub = 'Keep the energy going!'; }
  else if (h < 21)        { text = 'Good Evening 🌆'; sub = 'Wind down with your favourites.'; }
  else                    { text = 'Good Night 🌙'; sub = 'Perfect music for late nights.'; }

  EL.greetingHeading.textContent = text;
  EL.greetingSub.textContent     = sub;
}


/* 14.  MOBILE SIDEBAR */
function openSidebar() {
  EL.sidebar.classList.add('open');
  EL.sidebarOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  EL.sidebar.classList.remove('open');
  EL.sidebarOverlay.classList.remove('show');
  document.body.style.overflow = '';
}


/* 15.  KEYBOARD SHORTCUTS  */
function handleKeydown(e) {
  const tag = document.activeElement.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA';

  switch (e.code) {
    case 'Space':
      if (!typing) { e.preventDefault(); togglePlay(); }
      break;

    case 'Slash':
      if (!typing) { e.preventDefault(); EL.searchInput.focus(); EL.searchInput.select(); }
      break;

    case 'ArrowRight':
      if (!typing && e.altKey) { e.preventDefault(); playNext(); }
      break;

    case 'ArrowLeft':
      if (!typing && e.altKey) { e.preventDefault(); playPrev(); }
      break;

    case 'KeyM':
      if (!typing) toggleMute();
      break;

    case 'Escape':
      if (typing) EL.searchInput.blur();
      closeSidebar();
      break;
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}


/* 16.  EVENT WIRING */
function wireEvents() {

  /* ── Playback controls ── */
  EL.btnPlay.addEventListener('click', togglePlay);
  EL.btnPrev.addEventListener('click', playPrev);
  EL.btnNext.addEventListener('click', playNext);
  EL.btnShuffle.addEventListener('click', toggleShuffle);
  EL.btnRepeat.addEventListener('click', toggleRepeat);
  EL.likeBtn.addEventListener('click', toggleLike);

  /* ── Audio events ── */
  EL.audio.addEventListener('timeupdate', onTimeUpdate);
  EL.audio.addEventListener('loadedmetadata', onTimeUpdate);
  EL.audio.addEventListener('ended', () => {
    if (!state.isRepeat) playNext();
  });
  EL.audio.addEventListener('play', () => {
    state.isPlaying = true;
    syncPlayState();
  });
  EL.audio.addEventListener('pause', () => {
    state.isPlaying = false;
    syncPlayState();
  });
  EL.audio.addEventListener('error', () => {
     state.isPlaying = false;
    syncPlayState();
  });

  /* ── Scrubber (click + drag) ── */
  EL.scrubberTrack.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    EL.scrubberTrack.setPointerCapture(e.pointerId);
    startScrub(e);
  });
  EL.scrubberTrack.addEventListener('pointermove', onScrubMove);
  EL.scrubberTrack.addEventListener('pointerup',   stopScrub);
  EL.scrubberTrack.addEventListener('pointercancel', stopScrub);

  /* ── Volume ── */
  EL.volumeRange.addEventListener('input', (e) => applyVolume(parseFloat(e.target.value)));
  EL.btnMute.addEventListener('click', toggleMute);

  /* ── Search ── */
  EL.searchInput.addEventListener('input', handleSearch);
  // Clear on Escape when search is focused
  EL.searchInput.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') { clearSearch(); EL.searchInput.blur(); }
  });
  EL.noResultsClear.addEventListener('click', clearSearch);

  /* ── Sidebar nav ── */
  EL.navLinks.forEach(link => link.addEventListener('click', handleNavClick));

  /* ── Mobile sidebar ── */
  EL.hamburgerBtn.addEventListener('click', openSidebar);
  EL.sidebarOverlay.addEventListener('click', closeSidebar);

  /* ── Keyboard ── */
  document.addEventListener('keydown', handleKeydown);
}


/*  17.  BOOTSTRAP — entry point  */

async function initApp() {
  console.log('🎵 Melodify initialising…');

  setGreeting();
  restoreLikes();
  applyVolume(0.75);
  wireEvents();

  // Load songs last (async — skeleton shows meanwhile)
  await loadSongs();
}

// Kick everything off when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
