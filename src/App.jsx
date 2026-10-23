import React, { useState, useEffect, useRef } from 'react';

const TMDB_API_KEY = '3fd13673b37363d5107711b6d2b311ad';
const CORS_PROXY = 'https://corsproxy.io/?url=';

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
  const [currentScreen, setCurrentScreen] = useState('guide'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Dual-Player Buffering State
  const [activePlayer, setActivePlayer] = useState('A');
  const [playerASrc, setPlayerASrc] = useState('');
  const [playerBSrc, setPlayerBSrc] = useState('');
  
  const [currentEpisodeInfo, setCurrentEpisodeInfo] = useState(null);
  const [isCommercialActive, setIsCommercialActive] = useState(false);
  const [debridStatusMsg, setDebridStatusMsg] = useState('');

  // Debrid State
  const [debridProvider, setDebridProvider] = useState(localStorage.getItem('debrid_provider') || 'realdebrid');
  const [debridKey, setDebridKey] = useState(localStorage.getItem('debrid_api_key') || '');

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const rowRefs = useRef([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedRow]);

  // Keybindings
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
        if (e.key === 'Escape' || e.key === 'BackSpace' || keyCode === 4 || keyCode === 27) {
          setCurrentScreen('guide');
        }
      }
    };

    window.addEventListener('keydown', handleRemoteControl);
    return () => window.removeEventListener('keydown', handleRemoteControl);
  }, [currentScreen, selectedRow]);

  // Test Debrid Key Validity
  const verifyDebridKey = async (key) => {
    if (!key) return;
    try {
      const targetUrl = encodeURIComponent('https://api.real-debrid.com/rest/1.0/user');
      const res = await fetch(`${CORS_PROXY}${targetUrl}`, {
        headers: { Authorization: `Bearer ${key}` }
      });
      const data = await res.json();
      if (data.username) {
        setDebridStatusMsg(`Connected as: ${data.username} (${data.type})`);
      } else {
        setDebridStatusMsg('Invalid API Key or expired Real-Debrid account!');
      }
    } catch (e) {
      setDebridStatusMsg('Network error validating Debrid key.');
    }
  };

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
        const cleanMagnet = hashOrMagnet.startsWith('magnet:') 
          ? hashOrMagnet 
          : `magnet:?xt=urn:btih:${hashOrMagnet}`;
        
        const addUrl = encodeURIComponent(`https://api.real-debrid.com/rest/1.0/torrents/addMagnet`);
        const formData = new URLSearchParams();
        formData.append('magnet', cleanMagnet);

        const addRes = await fetch(`${CORS_PROXY}${addUrl}`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${debridKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString(),
        });
        const addData = await addRes.json();

        if (addData.id) {
          const infoUrl = encodeURIComponent(`https://api.real-debrid.com/rest/1.0/torrents/info/${addData.id}`);
          const infoRes = await fetch(`${CORS_PROXY}${infoUrl}`, {
            headers: { Authorization: `Bearer ${debridKey}` },
          });
          const infoData = await infoRes.json();

          if (infoData.links && infoData.links.length > 0) {
            const randomLink = infoData.links[Math.floor(Math.random() * infoData.links.length)];
            const unrestrictUrl = encodeURIComponent(`https://api.real-debrid.com/rest/1.0/unrestrict/link`);
            
            const unrestrictForm = new URLSearchParams();
            unrestrictForm.append('link', randomLink);

            const unrestrictRes = await fetch(`${CORS_PROXY}${unrestrictUrl}`, {
              method: 'POST',
              headers: { 
                Authorization: `Bearer ${debridKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: unrestrictForm.toString(),
            });
            const unrestrictData = await unrestrictRes.json();
            return unrestrictData.download;
          }
        }
      } else if (debridProvider === 'premiumize') {
        const pmUrl = encodeURIComponent(`https://www.premiumize.me/api/transfer/directdl?apikey=${debridKey}&src=magnet:?xt=urn:btih:${hashOrMagnet}`);
        const pmRes = await fetch(`${CORS_PROXY}${pmUrl}`);
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
      const torrentioTarget = encodeURIComponent(`https://torrentio.strem.fun/stream/series/${channel.tmdbId}:${epInfo.season}:${epInfo.episode}.json`);
      const torrentioRes = await fetch(`${CORS_PROXY}${torrentioTarget}`);
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

  const activeCh = OPTIMUM_CHANNELS[selectedRow];

  return (
    <div className="w-screen h-screen bg-black font-sans select-none overflow-hidden flex flex-col text-white">
      
      {/* ----------------- MOBILE RESPONSIVE LAYOUT (PHONES) ----------------- */}
      {isMobile ? (
        <div className="flex flex-col h-full bg-[#0a0f1d] overflow-y-auto">
          <div className="flex justify-between items-center bg-[#002855] px-4 py-3 border-b-2 border-cyan-800 sticky top-0 z-20">
            <div className="flex items-center space-x-2">
              <span className="bg-[#e63946] text-white font-bold px-2 py-0.5 rounded text-sm">OPTIMUM</span>
              <span className="text-sm font-bold text-cyan-300">Retro Mobile</span>
            </div>
            <button
              onClick={() => setCurrentScreen('settings')}
              className="bg-cyan-700 text-white px-3 py-1 rounded text-xs font-bold"
            >
              ⚙ Settings
            </button>
          </div>

          {currentScreen === 'guide' && (
            <div className="flex-1 p-3 flex flex-col space-y-3">
              <p className="text-xs text-gray-400 text-center mb-1">Tap any channel to launch random Debrid broadcast:</p>
              
              {OPTIMUM_CHANNELS.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => launchBroadcast(ch)}
                  className="bg-[#001026] border border-cyan-900 rounded-lg p-3 flex justify-between items-center active:bg-cyan-950 transition-all shadow-md"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="bg-cyan-800 text-cyan-200 text-xs px-1.5 py-0.5 rounded font-mono font-bold">CH {ch.id}</span>
                      <span className="font-bold text-base text-yellow-400">{ch.callsign}</span>
                    </div>
                    <span className="text-xs text-gray-300 mt-1">Now Playing: {ch.showNow}</span>
                  </div>
                  <span className="text-lime-400 text-sm font-bold bg-lime-950/60 px-3 py-1.5 rounded-full border border-lime-800">▶ Play</span>
                </div>
              ))}
            </div>
          )}

          {currentScreen === 'settings' && (
            <div className="p-6 flex flex-col justify-center h-full">
              <div className="bg-[#001026] p-4 border border-cyan-800 rounded-lg">
                <h2 className="text-lg font-bold text-lime-400 mb-3">Debrid Setup</h2>
                
                {debridStatusMsg && (
                  <div className="mb-3 text-xs bg-cyan-950 text-cyan-200 p-2 rounded border border-cyan-800">
                    {debridStatusMsg}
                  </div>
                )}

                <label className="block text-xs text-cyan-200 mb-1">Provider:</label>
                <select
                  value={debridProvider}
                  onChange={(e) => {
                    setDebridProvider(e.target.value);
                    localStorage.setItem('debrid_provider', e.target.value);
                  }}
                  className="w-full p-2 bg-black text-white border border-cyan-800 text-sm rounded mb-3"
                >
                  <option value="realdebrid">Real-Debrid</option>
                  <option value="premiumize">Premiumize.me</option>
                </select>

                <label className="block text-xs text-cyan-200 mb-1">API Key:</label>
                <input
                  type="password"
                  placeholder="Paste Real-Debrid Key..."
                  value={debridKey}
                  onChange={(e) => {
                    setDebridKey(e.target.value);
                    localStorage.setItem('debrid_api_key', e.target.value);
                  }}
                  className="w-full p-2 bg-black text-white border border-cyan-800 text-sm rounded mb-4"
                />

                <button
                  onClick={() => {
                    verifyDebridKey(debridKey);
                    setCurrentScreen('guide');
                  }}
                  className="w-full bg-lime-500 text-black font-bold py-2 rounded text-sm"
                >
                  Save & Validate Key
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ----------------- TV i-GUIDE LAYOUT (ANDROID TV BOX) ----------------- */
        <div className="flex flex-col h-full bg-[#0a0f1d] relative border border-gray-800 p-2">
          {currentScreen === 'guide' && (
            <div className="flex flex-col h-full bg-[#0a0f1d] relative">
              <div className="grid grid-cols-12 h-[45%] border-b border-cyan-900">
                <div className="col-span-4 bg-black flex flex-col border-r border-cyan-900 relative">
                  <div className="flex-1 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center border-b border-gray-800 relative">
                    <span className="text-gray-600 text-xs tracking-widest font-mono">[ MINI LIVE PREVIEW ]</span>
                  </div>
                  <div className="h-7 bg-black flex items-center px-2 text-cyan-300 font-bold text-xs space-x-1">
                    <span>♥</span>
                    <span>{activeCh.id}</span>
                    <span>{activeCh.callsign}</span>
                  </div>
                </div>

                <div className="col-span-2 bg-[#004b87] flex flex-col items-center justify-center border-r border-cyan-800">
                  <span className="text-cyan-200 font-extrabold text-lg tracking-widest uppercase">CHANNEL</span>
                </div>

                <div className="col-span-6 bg-[#001026] p-3 flex flex-col justify-between relative">
                  <div className="flex justify-between items-center text-cyan-300 font-bold text-sm border-b border-cyan-900/50 pb-1">
                    <span className="text-gray-400 text-xs">Optimum Interactive</span>
                    <span>MON 2:39 PM</span>
                  </div>

                  <div className="my-1">
                    <h1 className="text-cyan-300 text-xl font-extrabold tracking-wide">{activeCh.showNow}</h1>
                    <div className="flex items-center space-x-2 text-xs text-gray-300 my-1">
                      <span>2:30-3:00PM,</span>
                      <span>{activeCh.rating},</span>
                      <span className="border border-gray-400 px-1 text-[10px] rounded font-bold">HD</span>
                    </div>
                    
                    <div className="flex items-start space-x-2 mt-2">
                      <span className="bg-red-700 text-white font-bold text-[10px] px-1 rounded flex items-center space-x-1">
                        <span>●</span><span>REC</span>
                      </span>
                      <p className="text-gray-300 text-xs leading-tight line-clamp-3">
                        {activeCh.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-cyan-400 font-semibold">
                    CH {activeCh.id} {activeCh.name}
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-12 bg-[#001026] relative overflow-hidden">
                <div className="col-span-1 bg-[#121927] flex flex-col items-center justify-center border-r border-gray-800 text-gray-400">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-gray-500 transform -rotate-90">ARCHIVE</span>
                  <span className="text-cyan-400 font-bold text-sm mt-4">◄</span>
                </div>

                <div className="col-span-10 flex flex-col h-full overflow-hidden">
                  <div className="grid grid-cols-12 bg-[#00264d] text-cyan-300 font-black text-sm uppercase px-2 py-1 border-b border-cyan-800">
                    <div className="col-span-4 pl-8"></div>
                    <div className="col-span-4 text-left tracking-wider">NOW</div>
                    <div className="col-span-4 text-left text-cyan-500 tracking-wider">NEXT</div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {OPTIMUM_CHANNELS.map((ch, idx) => {
                      const isSelected = idx === selectedRow;
                      return (
                        <div
                          key={ch.id}
                          ref={(el) => (rowRefs.current[idx] = el)}
                          onClick={() => {
                            setSelectedRow(idx);
                            launchBroadcast(ch);
                          }}
                          className="grid grid-cols-12 items-center text-sm border-b border-cyan-950/60 transition-all min-h-[38px]"
                        >
                          <div className="col-span-4 flex items-center space-x-2 pl-4 text-cyan-200 font-bold">
                            {isSelected && <span className="text-cyan-400 font-black text-xs">▲</span>}
                            <span className="w-6 text-right font-mono">{ch.id}</span>
                            <span className="truncate">{ch.callsign}</span>
                          </div>

                          <div className="col-span-4 px-2 py-1">
                            <div
                              className={`flex items-center justify-between px-2 py-1 rounded transition-all font-semibold ${
                                isSelected
                                  ? 'bg-[#a3e635] text-black font-extrabold shadow-md scale-[1.01]'
                                  : 'bg-[#003366] text-cyan-100 hover:bg-[#004080]'
                              }`}
                            >
                              <span className="truncate">{ch.showNow}</span>
                              {isSelected && <span className="text-red-600 font-black text-xs ml-1">●</span>}
                            </div>
                          </div>

                          <div className="col-span-4 px-2 py-1">
                            <div className="bg-[#001f3f]/80 text-cyan-400/80 px-2 py-1 rounded truncate font-medium">
                              {ch.showNext}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-1 bg-[#121927] flex flex-col items-center justify-center border-l border-gray-800 text-gray-400">
                  <span className="text-cyan-400 font-bold text-sm mb-4">►</span>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-gray-500 transform rotate-90">AHEAD</span>
                </div>
              </div>

              <div className="h-8 bg-[#000d1a] border-t border-cyan-900 flex justify-between items-center px-4 text-xs font-bold text-cyan-200">
                <div className="flex items-center space-x-1">
                  <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] font-black">▲</span>
                  <span>OPTIONS</span>
                </div>
                
                <button
                  onClick={() => setCurrentScreen('settings')}
                  className="flex items-center space-x-1 bg-cyan-700 text-white px-2 py-0.5 rounded hover:bg-cyan-600 text-[11px]"
                >
                  <span className="bg-cyan-900 px-1 rounded text-[10px]">C</span>
                  <span>EXPAND / SETTINGS</span>
                </button>
              </div>
            </div>
          )}

          {currentScreen === 'settings' && (
            <div className="flex flex-col items-center justify-center h-full bg-[#0a0f1d]">
              <div className="bg-[#001026] p-6 border-4 border-cyan-700 rounded w-2/3 shadow-2xl">
                <h2 className="text-xl font-bold text-lime-400 mb-2 tracking-wider">i-Guide Settings & Debrid Setup</h2>
                
                {debridStatusMsg && (
                  <div className="mb-4 text-xs bg-cyan-950 text-cyan-200 p-2 rounded border border-cyan-800">
                    {debridStatusMsg}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs text-cyan-200 mb-1">Debrid Provider:</label>
                  <select
                    value={debridProvider}
                    onChange={(e) => {
                      setDebridProvider(e.target.value);
                      localStorage.setItem('debrid_provider', e.target.value);
                    }}
                    className="w-full p-2 bg-black text-white border border-cyan-800 text-sm rounded"
                  >
                    <option value="realdebrid">Real-Debrid</option>
                    <option value="premiumize">Premiumize.me</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-cyan-200 mb-1">API Key:</label>
                  <input
                    type="password"
                    placeholder="Paste Real-Debrid API Key..."
                    value={debridKey}
                    onChange={(e) => {
                      setDebridKey(e.target.value);
                      localStorage.setItem('debrid_api_key', e.target.value);
                    }}
                    className="w-full p-2 bg-black text-white border border-cyan-800 text-sm rounded"
                  />
                </div>

                <button 
                  onClick={() => {
                    verifyDebridKey(debridKey);
                    setCurrentScreen('guide');
                  }} 
                  className="bg-lime-500 text-black font-extrabold px-4 py-2 w-full text-base mt-2 hover:bg-lime-400 rounded transition-all"
                >
                  Save & Validate Key [BACK]
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- VIDEO PLAYER ----------------- */}
      {currentScreen === 'player' && (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {currentEpisodeInfo && (
            <div className="absolute top-4 left-4 z-30 bg-[#001026] border-2 border-cyan-600 px-4 py-2 rounded shadow-2xl text-white font-mono">
              <span className="text-lime-400 font-bold block text-sm">{currentEpisodeInfo.showName}</span>
              <span className="text-xs text-cyan-200">
                Season {currentEpisodeInfo.season} Ep {currentEpisodeInfo.episode}: "{currentEpisodeInfo.title}"
              </span>
              {isCommercialActive && (
                <span className="block text-[11px] text-red-500 font-bold mt-1 animate-pulse">● DEBRID VINTAGE COMMERCIAL BREAK</span>
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
    </div>
  );
}
