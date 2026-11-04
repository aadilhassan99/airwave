 "use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RadioStation = {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved?: string;
  favicon?: string;
  country?: string;
  language?: string;
  tags?: string;
  codec?: string;
  bitrate?: number;
  votes?: number;
  homepage?: string;
};

const CATEGORIES = ["All stations", "Music", "News", "Talk", "Jazz", "Rock", "Pop", "Sports"];
const API_SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
];

function categoryQuery(category: string) {
  if (category === "All stations") return "";
  if (category === "Music") return "music";
  return category.toLowerCase();
}

function stationMatchesCategory(station: RadioStation, category: string) {
  if (category === "All stations") return true;
  const tags = (station.tags || "").toLowerCase();
  const name = station.name.toLowerCase();
  if (category === "Music") return /music|pop|rock|jazz|dance|classical|hits/.test(tags);
  if (category === "Talk") return /talk|spoken|podcast/.test(`${tags} ${name}`);
  if (category === "Sports") return /sport/.test(`${tags} ${name}`);
  return `${tags} ${name}`.includes(category.toLowerCase());
}

function prettyCountry(country?: string) {
  return country?.trim() || "Worldwide";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All stations");
  const [volume, setVolume] = useState(0.75);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [error, setError] = useState("");
  const [streamError, setStreamError] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("airwave-favorites");
      if (saved) setFavorites(JSON.parse(saved) as string[]);
    } catch {
      // Local storage may be unavailable in private browsing.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("airwave-favorites", JSON.stringify(favorites));
    } catch {
      // Favorites still work for this session if storage is unavailable.
    }
  }, [favorites]);

  const loadStations = useCallback(async (query: string) => {
    setLoading(true);
    setError("");
    let lastError = "Radio directory is temporarily unavailable. Please try again.";
    for (const server of API_SERVERS) {
      try {
        const params = new URLSearchParams({
          limit: "72",
          order: "clickcount",
          reverse: "true",
          hidebroken: "true",
          ...(query ? { name: query } : {}),
        });
        const response = await fetch(`${server}/json/stations/search?${params.toString()}`);
        if (!response.ok) throw new Error("Radio directory request failed.");
        const data = (await response.json()) as RadioStation[];
        const usable = data.filter((station) => station.name && (station.url_resolved || station.url));
        setStations(usable);
        setLoading(false);
        if (usable.length === 0) setError("No stations found. Try another search.");
        return;
      } catch {
        lastError = "Could not connect to the radio directory. Check your connection and try again.";
      }
    }
    setStations([]);
    setError(lastError);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStations("");
  }, [loadStations]);

  const filteredStations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return stations.filter((station) => {
      const matchesSearch =
        !normalizedSearch ||
        station.name.toLowerCase().includes(normalizedSearch) ||
        (station.country || "").toLowerCase().includes(normalizedSearch) ||
        (station.tags || "").toLowerCase().includes(normalizedSearch);
      const matchesCategory = stationMatchesCategory(station, category);
      const matchesFavorites = !showFavorites || favorites.includes(station.stationuuid);
      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [stations, search, category, showFavorites, favorites]);

  const toggleFavorite = (station: RadioStation) => {
    setFavorites((current) =>
      current.includes(station.stationuuid)
        ? current.filter((id) => id !== station.stationuuid)
        : [...current, station.stationuuid],
    );
  };

  const playStation = async (station: RadioStation) => {
    const audio = audioRef.current;
    if (!audio) return;
    setActiveStation(station);
    setStreamError(false);
    audio.src = station.url_resolved || station.url;
    audio.volume = volume;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setStreamError(true);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (!activeStation) {
      const first = filteredStations[0] || stations[0];
      if (first) await playStation(first);
      return;
    }
    setStreamError(false);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setStreamError(true);
      setPlaying(false);
    }
  };

  const changeVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (query) void loadStations(query);
    else void loadStations("");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Airwave home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>airwave<span className="brand-dot">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="live-indicator"><span className="live-dot" /> LIVE RADIO, EVERYWHERE</span>
          <a className="about-link" href="#stations">Explore stations <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR WORLD, ON AIR</div>
          <h1>Find your<br />frequency<span className="hero-period">.</span></h1>
          <p className="hero-description">The sounds of somewhere else. Discover live radio from around the world, all in one place.</p>
          <a className="hero-cta" href="#stations">Explore the dial <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-label="Decorative radio waves">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="orbit-core"><span className="core-dot" /><span className="core-wave wave-one" /><span className="core-wave wave-two" /><span className="core-wave wave-three" /></div>
          <div className="art-label art-label-top">88.4 <span>FM</span></div>
          <div className="art-label art-label-bottom"><span className="art-pulse" /> ON AIR</div>
          <div className="art-cross cross-one">+</div>
          <div className="art-cross cross-two">+</div>
        </div>
        <div className="hero-footer">
          <span>01 / DISCOVER</span>
          <span>INDEPENDENT SOUND. INFINITE STORIES.</span>
        </div>
      </section>

      <section className="stations-section" id="stations">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THE AIRWAVE</div>
            <h2>What&apos;s playing <span>out there?</span></h2>
          </div>
          <div className="station-count"><strong>{filteredStations.length.toString().padStart(2, "0")}</strong><span> STATIONS<br />IN THE MIX</span></div>
        </div>

        <div className="controls-row">
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stations, countries, genres..." aria-label="Search stations" />
            <button type="submit" className="search-submit">SEARCH</button>
          </form>
          <button className={`favorites-toggle ${showFavorites ? "selected" : ""}`} onClick={() => setShowFavorites((value) => !value)} aria-pressed={showFavorites}>
            <span aria-hidden="true">♡</span> Favorites <span className="favorite-number">{favorites.length}</span>
          </button>
        </div>

        <div className="category-row" role="group" aria-label="Filter by genre">
          {CATEGORIES.map((item) => (
            <button key={item} className={`category-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>

        {error && <div className="notice"><span>!</span><div><strong>We hit a quiet patch.</strong><p>{error}</p><button onClick={() => void loadStations("")}>Try again ↗</button></div></div>}

        {loading ? (
          <div className="loading-grid">{Array.from({ length: 8 }, (_, index) => <div className="station-skeleton" key={index} />)}</div>
        ) : filteredStations.length > 0 ? (
          <div className="station-grid">
            {filteredStations.map((station, index) => {
              const isActive = activeStation?.stationuuid === station.stationuuid;
              const isFavorite = favorites.includes(station.stationuuid);
              return (
                <article className={`station-card ${isActive ? "is-active" : ""}`} key={station.stationuuid}>
                  <button className="station-main" onClick={() => void playStation(station)} aria-label={`Play ${station.name}`}>
                    <div className={`station-art art-${index % 6}`}>
                      {station.favicon ? <img src={station.favicon} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
                      <span className="station-initials">{initials(station.name)}</span>
                      {isActive && playing && <span className="mini-equalizer"><i /><i /><i /><i /></span>}
                    </div>
                    <div className="station-info">
                      <span className="station-country">{prettyCountry(station.country)}</span>
                      <h3>{station.name}</h3>
                      <p>{station.tags?.split(",").slice(0, 2).join(" · ") || station.codec || "Radio station"}</p>
                    </div>
                    <span className="station-play-icon">{isActive && playing ? "Ⅱ" : "▶"}</span>
                  </button>
                  <div className="station-meta">
                    <span>{station.bitrate ? `${station.bitrate} KBPS` : "LIVE STREAM"}</span>
                    <button className={`heart-button ${isFavorite ? "hearted" : ""}`} onClick={() => toggleFavorite(station)} aria-label={isFavorite ? `Remove ${station.name} from favorites` : `Add ${station.name} to favorites`} aria-pressed={isFavorite}>{isFavorite ? "♥" : "♡"}</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : !error ? (
          <div className="empty-state"><span className="empty-icon">⌁</span><h3>No stations on this frequency.</h3><p>Try another genre or turn off your favorites filter.</p><button onClick={() => { setSearch(""); setCategory("All stations"); setShowFavorites(false); void loadStations(""); }}>Reset filters</button></div>
        ) : null}
        <div className="directory-credit">STATION DIRECTORY POWERED BY <a href="https://www.radio-browser.info/" target="_blank" rel="noreferrer">RADIO BROWSER ↗</a><span>Free to tune in. Made for curious ears.</span></div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><span /><span /><span /><span /></span><span>airwave<span className="brand-dot">.</span></span></a>
        <span>GOOD SOUNDS. NO BORDERS.</span>
        <span>© {new Date().getFullYear()} AIRWAVE</span>
      </footer>

      <div className="player-dock">
        <div className="dock-station">
          <div className={`dock-art ${activeStation ? "has-station" : ""}`}>{activeStation ? initials(activeStation.name) : <span className="dock-wave">⌁</span>}</div>
          <div className="dock-info"><strong>{activeStation?.name || "Your next favorite station"}</strong><span>{activeStation ? prettyCountry(activeStation.country) : "Pick a station and press play"}</span></div>
          {activeStation && <button className={`dock-heart ${favorites.includes(activeStation.stationuuid) ? "hearted" : ""}`} onClick={() => toggleFavorite(activeStation)} aria-label="Toggle current station favorite">{favorites.includes(activeStation.stationuuid) ? "♥" : "♡"}</button>}
        </div>
        <div className="dock-controls">
          <div className="dock-live"><span className={playing ? "live-dot" : "idle-dot"} />{playing ? "ON AIR" : "READY"}</div>
          <button className="main-play" onClick={() => void togglePlayback()} aria-label={playing ? "Pause radio" : "Play radio"}>{playing ? <span className="pause-symbol">Ⅱ</span> : <span className="play-symbol">▶</span>}</button>
          <div className="dock-hint">{playing ? "TUNED IN" : "PRESS TO LISTEN"}</div>
        </div>
        <div className="dock-volume">
          <span className="volume-icon" aria-hidden="true">{volume === 0 ? "×" : "◖))"}</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="Volume" style={{ "--volume": `${volume * 100}%` } as React.CSSProperties} />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
        {streamError && <div className="stream-error" role="status">This station&apos;s stream could not play. Try another station.</div>}
      </div>
      <audio ref={audioRef} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { if (activeStation) { setPlaying(false); setStreamError(true); } }} preload="none" />
    </main>
  );
}
