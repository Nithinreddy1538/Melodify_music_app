# 🎵 Melodify — Spotify-like Music Player

> Pure HTML · CSS · JavaScript — no frameworks, no build tools.

---

## 📁 Folder Structure (match this exactly!)

```
spotify-clone/
├── index.html              ← open this in your browser
├── style.css               ← all styling
├── app.js                  ← all JavaScript
├── README.md               ← this file
│
└── assets/
    ├── songs.json          ⭐ ADD NEW SONGS HERE
    ├── songs/
    │   ├── song1.mp3
    │   ├── song2.mp3
    │   └── ...
    └── posters/
        ├── poster1.jpg
        ├── poster2.jpg
        └── ...
```

---

## 🚀 Running the App

>  https://nithinreddy1538.github.io/Melodify_music_app/
### Option 1 — VS Code Live Server (easiest)
1. Install VS Code + the **Live Server** extension
2. Right-click `index.html` → **"Open with Live Server"**
3. Opens at `http://127.0.0.1:5500`

### Option 2 — Python
```bash
cd spotify-clone
python -m http.server 8000
# visit http://localhost:8000
```

### Option 3 — Node.js
```bash
cd spotify-clone
npx serve .
```

---

## ➕ Adding New Songs (3 steps)

### Step 1 — Add your audio file
```
assets/songs/  ← drop your .mp3 here
```

### Step 2 — Add your cover image
```
assets/posters/  ← drop your .jpg / .png here
```

### Step 3 — Edit songs.json
Open `assets/songs.json` and add a new object to the array:
```json
{
  "id": 9,
  "title": "Your Song Title",
  "artist": "Artist Name",
  "src": "assets/songs/your-file.mp3",
  "poster": "assets/posters/your-cover.jpg",
  "category": "Lo-Fi",
  "color": "#1db954"
}
```

**Refresh the browser — done!** No HTML changes, no JS changes.

### Available categories (sidebar filters):
| Category | Sidebar icon |
|----------|-------------|
| Electronic | ⚡ |
| Ambient | 💨 |
| Lo-Fi | 🎧 |
| Chill | ❄️ |
| Jazz | 🎵 |

Want a new category? Add a `<a class="nav-link" data-filter="YourCategory">` in `index.html`.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `/` | Focus search bar |
| `Alt + →` | Next song |
| `Alt + ←` | Previous song |
| `M` | Toggle mute |
| `Esc` | Close search / sidebar |

---

## ✨ Features

- Spotify-dark UI with animated equalizer bars
- Loads songs from `songs.json` — add songs without touching HTML/JS
- Loading skeleton while JSON fetches
- Song cards with poster, genre chip, hover overlay
- Real-time search (title · artist · category)
- Sidebar category filter
- Play · Pause · Next · Previous
- Shuffle mode (random, non-repeating)
- Repeat mode (single song, native `audio.loop`)
- Drag-to-seek scrubber
- Volume slider + mute toggle
- Like / heart button (persisted in localStorage)
- Time-based greeting
- Animated "Now Playing" hero banner with dynamic tint colour
- Currently playing card highlight + green dot + EQ animation
- Fully responsive (mobile sidebar with hamburger)
- XSS-safe innerHTML (escapes all data)
- Graceful fallback demo data if `songs.json` is missing

---

## 🔧 Customising

### Change accent colour
Edit CSS variables at the top of `style.css`:
```css
--clr-green: #1db954;   /* main play button colour */
--clr-accent: #7c5cfc;  /* secondary accent */
```

### Add a per-song tint colour
Set `"color": "#hexcode"` in each song's JSON entry.
The hero banner and card background will tint accordingly.

---

## 📈 Ways to Scale This Project

| Level | Idea |
|-------|------|
| Beginner | Save last-played song + position with `localStorage` |
| Beginner | Add song duration to `songs.json` and show in cards |
| Intermediate | Playlist support — `playlists.json` + drag-to-reorder |
| Intermediate | Web Audio API visualiser (waveform bars) |
| Intermediate | PWA — `manifest.json` + service worker for offline use |
| Advanced | Node.js + Express backend, user accounts, database |
| Advanced | Fetch real lyrics via Genius / Musixmatch API |
| Advanced | IndexedDB to cache audio buffers for offline playback |
| Advanced | WebSockets for a "listen together" shared session |
