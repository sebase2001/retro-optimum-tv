import React, { useState, useEffect, useRef } from 'react';

const TMDB_API_KEY = '3fd13673b37363d5107711b6d2b311ad';

// Multi-gigabyte Retro Commercial Compilations (Infohashes)
const RETRO_COMMERCIAL_TORRENTS = [
  '8093132bf6e1e8b792ff4a682a201b1a4732d847', // 80s, 90s, 2000s Commercial Compilation
];

// 30 POPULAR RETRO TV NETWORKS (TMDB Show Mapping)
const RETRO_BROADCAST_CHANNELS = [
  // --- MAJOR NETWORKS ---
  { id: 102, name: 'CBS Classic', tmdbId: 1668, showName: 'Friends', category: 'Primetime Sitcom' },
  { id: 104, name: 'NBC Comedy', tmdbId: 1900, showName: 'Seinfeld', category: '90s Sitcom' },
  { id: 105, name: 'FOX Retro', tmdbId: 2046, showName: 'The X-Files', category: 'Mystery & Sci-Fi' },
  { id: 107, name: 'ABC Primetime', tmdbId: 4607, showName: 'Lost', category: '2000s Drama' },
  { id: 110, name: 'The WB Network', tmdbId: 4626, showName: 'Buffy the Vampire Slayer', category: 'Teen Drama' },
  { id: 111, name: 'UPN 69', tmdbId: 4604, showName: 'Star Trek: Voyager', category: 'Sci-Fi Block' },

  // --- CABLE DRAMA & PREMIUM ---
  { id: 120, name: 'HBO Primetime', tmdbId: 1438, showName: 'The Wire', category: 'Prestige Drama' },
  { id: 122, name: 'HBO Late Night', tmdbId: 1398, showName: 'The Sopranos', category: 'Crime Drama' },
  { id: 125, name: 'FX Network', tmdbId: 1402, showName: 'The Shield', category: 'Action & Crime' },
  { id: 128, name: 'AMC Retro', tmdbId: 1396, showName: 'Breaking Bad', category: '2000s Drama' },
  { id: 130, name: 'USA Network', tmdbId: 888, showName: 'Monk', category: 'Mystery Comedy' },

  // --- COMEDY & CARTOONS ---
  { id: 140, name: 'Comedy Central', tmdbId: 2190, showName: 'South Park', category: 'Adult Animation' },
  { id: 142, name: 'Comedy Central Sitcoms', tmdbId: 2316, showName: 'The Office (US)', category: '00s Comedy' },
  { id: 150, name: 'Cartoon Network', tmdbId: 987, showName: 'Dexter\'s Laboratory', category: 'Late 90s Toons' },
  { id: 152, name: 'Cartoon Network Action', tmdbId: 105, showName: 'Samurai Jack', category: 'Action Animation' },
  { id: 155, name: 'Adult Swim', tmdbId: 2174, showName: 'Aqua Teen Hunger Force', category: 'Late Night Animation' },
  { id: 160, name: 'Nickelodeon', tmdbId: 1622, showName: 'SpongeBob SquarePants', category: '2000s Cartoons' },
  { id: 162, name: 'Nicktoons Classic', tmdbId: 826, showName: 'Rugrats', category: '90s Nicktoons' },
  { id: 165, name: 'Disney Channel', tmdbId: 2382, showName: 'That\'s So Raven', category: 'Kids Sitcom' },

  // --- MUSIC & YOUTH CULTURE ---
  { id: 170, name: 'MTV Classic', tmdbId: 2124, showName: 'Beavis and Butt-Head', category: 'MTV Animation' },
  { id: 172, name: 'MTV Reality', tmdbId: 1563, showName: 'The Real World', category: 'Retro Reality' },
  { id: 175, name: 'VH1 Nostalgia', tmdbId: 4402, showName: 'Flavor of Love', category: '2000s Reality' },
  { id: 180, name: 'G4 TV', tmdbId: 1740, showName: 'X-Play', category: 'Gaming & Tech' },
  { id: 185, name: 'Spike TV', tmdbId: 2313, showName: '1000 Ways to Die', category: 'Action Cable' },

  // --- SYNDICATION & CULT FAVS ---
  { id: 201, name: 'Sci-Fi Channel', tmdbId: 1637, showName: 'Stargate SG-1', category: '90s Sci-Fi' },
  { id: 205, name: 'E! Entertainment', tmdbId: 14818, showName: 'The Simple Life', category: 'Pop Culture' },
  { id: 210, name: 'TNT Drama', tmdbId: 1416, showName: 'ER', category: '90s Medical Drama' },
  { id: 215, name: 'TBS Very Funny', tmdbId: 2382, showName: 'King of Queens', category: 'Syndicated Comedy' },
  { id: 220, name: 'Fox Kids Retro', tmdbId: 1555, showName: 'Mighty Morphin Power Rangers', category: '90s Kids' },
  { id: 225, name: 'Toonami', tmdbId: 12609, showName: 'Dragon Ball Z', category: 'Anime Block' },
];

export default function App() {
  const [selectedRow, setSelectedRow] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('guide'); 
  
  // Dual-Player Buffering State
  const [activePlayer, setActivePlayer] = useState('A'); // 'A' or 'B'
  const [playerASrc, setPlayerASrc] = useState('');
  const [playerBSrc, setPlayerBSrc] = useState('');
  
  const [currentEpisodeInfo, setCurrentEpisodeInfo] = useState(null);
  const [isCommercialActive, setIsCommercialActive] = useState(false);

  // Debrid Configuration State
  const [debridProvider, setDebridProvider] = useState(localStorage.getItem('debrid_provider') || 'realdebrid');
  const [debridKey, setDebridKey] = useState(localStorage.getItem('debrid_api_key') || '');

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);

  // D-Pad Remote Navigation Handler
  useEffect(() => {
    const handleRemoteControl = (e) => {
      const keyCode = e.keyCode || e.which;

      if (currentScreen === 'guide') {
        if (e.key === 'ArrowDown' || keyCode === 40) {
          setSelectedRow((prev) => Math.min(prev + 1, RETRO_BROADCAST_CHANNELS.length - 1));
        } else if (e.key === 'ArrowUp' || keyCode === 38) {
          setSelectedRow((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' || keyCode === 13 || keyCode === 23 || e.key === 'Select') {
          launchBroadcast(RETRO_BROADCAST_CHANNELS[selectedRow]);
        } else if (e.key === 'c' || keyCode === 82 || keyCode === 189) {
          setCurrentScreen('settings');
        }
      } else if (currentScreen === 'player') {
        if (e.key === 'Escape' || e.key === 'BackSpace' || keyCode === 4 || keyCode === 27) {
          setCurrentScreen('guide');
          setPlayerASrc('');
          setPlayerBSrc('');
        }
      } else if (currentScreen === 'settings') {
        if (e.key === 'Escape' || e.key === 'BackSpace' || keyCode === 4) {
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
      if (resolvedComm) commStreamUrl = resolvedComm;
    }

    setPlayerASrc(commStreamUrl);
    setPlayerBSrc(epStreamUrl);
    setActivePlayer('A');

    setTimeout(() => {
      if (videoRefA.current) videoRefA.current.play();
    }, 200);
  };

  const handleCommercialEnded = () => {
    setIsCommercialActive(false);
    setActivePlayer('B');
    if (videoRefB.current) {
      videoRefB.current.play();
    }
  };

  return (
    <div className="w-screen h-screen bg-[#001845] font-mono select-none overflow-hidden flex flex-col p-4">
      {/* GUIDE SCREEN */}
      {currentScreen === 'guide' && (
        <div className="flex flex-col h-full border-8 border-[#001233] p-2 bg-[#001845]">
          <div className="flex justify-between items-center bg-[#002855] p-3 border-b-4 border-[#0466c8]">
            <div className="flex items-center space-x-3">
              <span className="bg-[#e63946] text-white font-bold px-3 py-1 rounded text-xl">OPTIMUM</span>
              <span className="text-xl font-bold text-[#90e0ef]">i-GUIDE TV (2003)</span>
            </div>
            <div className="text-[#caf0f8] font-bold text-lg">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 my-4 h-1/3">
            <div className="bg-black border-4 border-[#0466c8] flex flex-col items-center justify-center text-[#90e0ef] p-2 text-center">
              <span className="text-xs text-yellow-400 font-bold mb-1">DEBRID ENGINE</span>
              <span className="text-xs text-gray-400">Zero-Lag Dual Buffer</span>
            </div>
            <div className="col-span-2 bg-[#002855] p-4 border-2 border-[#0466c8] flex flex-col justify-center">
              <span className="text-xs text-[#90e0ef]">CH {RETRO_BROADCAST_CHANNELS[selectedRow].id} - {RETRO_BROADCAST_CHANNELS[selectedRow].category}</span>
              <h2 className="text-2xl font-bold text-yellow-400">{RETRO_BROADCAST_CHANNELS[selectedRow].showName} ({RETRO_BROADCAST_CHANNELS[selectedRow].name})</h2>
              <p className="text-gray-300 mt-2 text-sm">Tune in to stream pre-buffered Debrid commercials followed seamlessly by random TV episodes.</p>
            </div>
          </div>

          <div className="flex-1 bg-[#001233] border-2 border-[#0466c8] overflow-y-auto">
            {RETRO_BROADCAST_CHANNELS.map((ch, idx) => {
              const isFocused = idx === selectedRow;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setSelectedRow(idx);
                    launchBroadcast(ch);
                  }}
                  className={`grid grid-cols-4 p-3 border-b border-blue-900 cursor-pointer ${
                    isFocused ? 'bg-yellow-500 text-black font-bold scale-[1.01]' : 'text-white hover:bg-[#002855]'
                  }`}
                >
                  <div className="font-bold border-r border-blue-800 pr-2">CH {ch.id}</div>
                  <div className="font-bold truncate">{ch.name}</div>
                  <div className="col-span-2 text-sm truncate">{ch.showName} 24/7 Feed</div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-xs text-gray-300 flex justify-between bg-[#002855] p-2 border-t border-[#0466c8]">
            <span>[▲/▼] Scroll Channels</span>
            <span>[OK] Watch Broadcast</span>
            <span>[MENU / C] Debrid Settings</span>
          </div>
        </div>
      )}

      {/* PLAYER SCREEN */}
      {currentScreen === 'player' && (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {currentEpisodeInfo && (
            <div className="absolute top-4 left-4 z-30 bg-[#002855] border-2 border-[#0466c8] px-4 py-2 rounded shadow-lg text-white font-mono">
              <span className="text-yellow-400 font-bold block">{currentEpisodeInfo.showName}</span>
              <span className="text-xs text-[#90e0ef]">
                Season {currentEpisodeInfo.season} Ep {currentEpisodeInfo.episode}: "{currentEpisodeInfo.title}"
              </span>
              {isCommercialActive && (
                <span className="block text-xs text-red-400 font-bold mt-1">● DEBRID COMMERCIAL BREAK</span>
              )}
            </div>
          )}

          <video
            ref={videoRefA}
            src={playerASrc}
            onEnded={handleCommercialEnded}
            className={`absolute inset-0 w-full h-full object-contain ${activePlayer === 'A' ? 'block z-20' : 'hidden z-10'}`}
            playsInline
          />

          <video
            ref={videoRefB}
            src={playerBSrc}
            className={`absolute inset-0 w-full h-full object-contain ${activePlayer === 'B' ? 'block z-20' : 'hidden z-10'}`}
            playsInline
            controls={activePlayer === 'B'}
          />
        </div>
      )}

      {/* SETTINGS SCREEN */}
      {currentScreen === 'settings' && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-[#002855] p-6 border-4 border-[#0466c8] rounded w-2/3">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Debrid API Account Setup</h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-300 mb-1">Debrid Provider:</label>
              <select
                value={debridProvider}
                onChange={(e) => {
                  setDebridProvider(e.target.value);
                  localStorage.setItem('debrid_provider', e.target.value);
                }}
                className="w-full p-2 bg-black text-white border border-[#0466c8]"
              >
                <option value="realdebrid">Real-Debrid</option>
                <option value="premiumize">Premiumize.me</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-300 mb-1">API Key:</label>
              <input
                type="password"
                placeholder="Paste Debrid API Key..."
                value={debridKey}
                onChange={(e) => {
                  setDebridKey(e.target.value);
                  localStorage.setItem('debrid_api_key', e.target.value);
                }}
                className="w-full p-2 bg-black text-white border border-[#0466c8]"
              />
            </div>

            <button 
              onClick={() => setCurrentScreen('guide')} 
              className="bg-yellow-500 text-black font-bold px-4 py-2 w-full text-lg mt-2 hover:bg-yellow-400"
            >
              Save & Exit [BACK]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
