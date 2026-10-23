import React, { useState, useEffect, useRef } from 'react';

const TMDB_API_KEY = '3fd13673b37363d5107711b6d2b311ad';

const RETRO_COMMERCIAL_TORRENTS = [
  '8093132bf6e1e8b792ff4a682a201b1a4732d847',
];

const OPTIMUM_CHANNELS = [
  { id: 14, callsign: 'OPTHD', name: 'Optimum Channel', showNow: "What's On", showNext: "What's On", rating: 'PG/TV-PG', desc: "Tune in to find out what's on when and see highlights of some of the hundreds of programs...", tmdbId: 1668 },
  { id: 15, callsign: 'QVCHD', name: 'QVC HD', showNow: 'Isaac Mizrahi Live', showNext: 'orYANY Handbags', rating: 'TV-G', desc: 'Live shopping showcase featuring fashion, home decor, and electronics.', tmdbId: 1900 },
  { id: 16, callsign: 'WNJUH', name: 'Telemundo 47', showNow: 'Lo Mejor de Caso...', showNext: 'Suelta la Sopa', rating: 'TV-14', desc: 'Programa de entretenimiento y noticias de la farandula internacional.', tmdbId: 2046 },
  { id: 17, callsign: 'UNIHD', name: 'Univision HD', showNow: '¿Quién Tiene la...', showNext: 'Casos de Familia', rating: 'TV-PG', desc: 'Debates y casos familiares de la vida real conducidos en vivo.', tmdbId: 4607 },
  { id: 18, callsign: 'GOVT', name: 'Government Ch', showNow: 'Government Access', showNext: 'Government Access', rating: 'G', desc: 'Local municipal board meetings, public announcements, and community updates.', tmdbId: 4626 },
  { id: 102, callsign: 'CBSHD', name: 'CBS Network', showNow: 'Friends', showNext: 'Frasier', rating: 'TV-PG', desc: 'Six young adults navigate life, love, and careers in New York City.', tmdbId: 1668 },
  { id: 104, callsign: 'NBCHD', name: 'NBC Comedy', showNow: 'Seinfeld', showNext: '30 Rock', rating: 'TV-14', desc: 'The continuous comedic misadventures of neurotic New York comedian Jerry Seinfeld.', tmdbId: 1900 },
  { id: 105, callsign: 'FOXHD', name: 'FOX Sci-Fi', showNow: 'The X-Files', showNext: 'Fringe', rating: 'TV-14', desc: 'FBI agents Fox Mulder and Dana Scully investigate unsolved paranormal cases.', tmdbId: 2046 },
  { id: 140, callsign: 'COMHD', name: 'Comedy Central', showNow: 'South Park', showNext: 'Futurama', rating: 'TV-MA', desc: 'Follow the misadventures of four young boys in the quiet mountain town of South Park.', tmdbId: 2190 },
  { id: 160, callsign: 'NICK', name: 'Nickelodeon', showNow: 'SpongeBob SquarePants', showNext: 'The Fairly OddParents', rating: 'TV-Y7', desc: 'The nautical adventures of a optimistic yellow sea sponge in Bikini Bottom.', tmdbId: 1622 },
];

export default function App() {
  const [selectedRow, setSelectedRow] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('guide'); // 'guide', 'player', 'settings'
  
  // Dual-Player Buffering State
  const [activePlayer, setActivePlayer] = useState('A');
  const [playerASrc, setPlayerASrc] = useState('');
  const [playerBSrc, setPlayerBSrc] = useState('');
  
  const [currentEpisodeInfo, setCurrentEpisodeInfo] = useState(null);
  const [isCommercialActive, setIsCommercialActive] = useState(false);

  // Debrid State
  const [debridProvider, setDebridProvider] = useState(localStorage.getItem('debrid_provider') || 'realdebrid');
  const [debridKey, setDebridKey] = useState(localStorage.getItem('debrid_api_key') || '');

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const rowRefs = useRef([]);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedRow]);

  // Android TV Remote Control Handler
  useEffect(() => {
    const handleRemoteControl = (e) => {
      const keyCode = e.keyCode || e.which;

      if (currentScreen === 'guide') {
        if (e.key === 'ArrowDown' || keyCode === 40) {
          setSelectedRow((prev) => Math.min(prev + 1, OPTIMUM_CHANNELS.length - 1));
        } else if (e.key === 'ArrowUp' || keyCode === 38) {
          setSelectedRow((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' || keyCode === 13 || keyCode === 23) {
          launchBroadcast(OPTIMUM_CHANNELS[selectedRow]);
        } else if (e.key === 'c' || keyCode === 82 || keyCode === 189) { // Menu / Options button
          setCurrentScreen('settings');
        }
      } else if (currentScreen === 'player') {
        if (e.key === 'Escape' || e.key === 'BackSpace' || keyCode === 4 || keyCode === 27) {
          setCurrentScreen('guide');
          setPlayerASrc('');
          setPlayerBSrc('');
        }
      } else if (currentScreen === 'settings') {
        if (e.key === 'Escape' || e.key === 'BackSpace' || keyCode === 4 || keyCode === 27) {
          setCurrentScreen('guide');
        }
      }
    };

    window.addEventListener('keydown', handleRemoteControl);
    return () => window.removeEventListener('keydown', handleRemoteControl);
  }, [currentScreen, selectedRow]);

  const fetchRandomEpisode = async (tmdbId) => {
    try {
      const showRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
      const showData = await showRes.json();
      const validSeasons = showData.seasons.filter((s) => s.season_number > 0);
      const randomSeason = validSeasons[Math.floor(Math.random() * validSeasons.length)];
      
      const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${randomSeason.season_number}?api_key=${TMDB_API_KEY}`);
      const seasonData = await seasonRes.json();
      const randomEp = seasonData.episodes[Math.floor(Math.random() * seasonData.episodes.length)];
      
      return {
        tmdbId,
        showName: showData.name,
        season: randomSeason.season_number,
        episode: randomEp.episode_number,
        title: randomEp.name,
      };
    } catch (err) {
      return { tmdbId, showName: 'Retro Broadcast', season: 1, episode: 1, title: 'Classic Broadcast' };
    }
  };

  const resolveDebridLink = async (hashOrMagnet) => {
    if (!debridKey) return null;
    try {
      if (debridProvider === 'realdebrid') {
        const formData = new FormData();
        formData.append('magnet', hashOrMagnet.startsWith('magnet:') ? hashOrMagnet : `magnet:?xt=urn:btih:${hashOrMagnet}`);
        
        const addRes = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/addMagnet`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${debridKey}` },
          body: formData,
        });
        const addData = await addRes.json();

        if (addData.id) {
          const infoRes = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${addData.id}`, {
            headers: { Authorization: `Bearer ${debridKey}` },
          });
          const infoData = await infoRes.json();

          if (infoData.links && infoData.links.length > 0) {
            const randomLink = infoData.links[Math.floor(Math.random() * infoData.links.length)];
            const unrestrictForm = new FormData();
            unrestrictForm.append('link', randomLink);

            const unrestrictRes = await fetch(`https://api.real-debrid.com/rest/1.0/unrestrict/link`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${debridKey}` },
              body: unrestrictForm,
            });
            const unrestrictData = await unrestrictRes.json();
            return unrestrictData.download;
          }
        }
      } else if (debridProvider === 'premiumize') {
        const pmRes = await fetch(`https://www.premiumize.me/api/transfer/directdl?apikey=${debridKey}&src=magnet:?xt=urn:btih:${hashOrMagnet}`);
        const pmData = await pmRes.json();
        if (pmData.status === 'success' && pmData.content.length > 0) {
          const randomFile = pmData.content[Math.floor(Math.random() * pmData.content.length)];
          return randomFile.link;
        }
      }
    } catch (err) {
      console.error('Debrid stream resolution error:', err);
    }
    return null;
  };

  const launchBroadcast = async (channel) => {
    setCurrentScreen('player');
    setIsCommercialActive(true);

    const epInfo = await fetchRandomEpisode(channel.tmdbId);
    setCurrentEpisodeInfo(epInfo);

    let epStreamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    try {
      const torrentioRes = await fetch(`https://torrentio.strem.fun/stream/series/${channel.tmdbId}:${epInfo.season}:${epInfo.episode}.json`);
      const torrentioData = await torrentioRes.json();
      if (torrentioData.streams && torrentioData.streams.length > 0) {
        const hash = torrentioData.streams[0].infoHash || torrentioData.streams[0].url;
        const resolvedEp = await resolveDebridLink(hash);
        if (resolvedEp) epStreamUrl = resolvedEp;
      }
    } catch (e) {
      console.error('Episode resolution fallback', e);
    }

    let commStreamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    if (debridKey) {
      const randomCommHash = RETRO_COMMERCIAL_TORRENTS[Math.floor(Math.random() * RETRO_COMMERCIAL_TORRENTS.length)];
      const resolvedComm = await resolveDebridLink(randomCommHash);
      if (resolvedComm) commStreamUrl = resolvedComm
