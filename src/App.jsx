import React, { useState, useEffect } from 'react';

const RETRO_CHANNELS = [
  { id: 102, name: 'CBS (2001)', show: 'Survivor / CSI', hash: '8093132bf6e1e8b792ff4a682a201b1a4732d847' },
  { id: 104, name: 'NBC Comedy', show: 'Friends / Seinfeld', hash: '8093132bf6e1e8b792ff4a682a201b1a4732d847' },
  { id: 107, name: 'FOX Sci-Fi', show: 'The X-Files', hash: '8093132bf6e1e8b792ff4a682a201b1a4732d847' },
  { id: 132, name: 'Cartoon Network', show: 'Dexter\'s Lab / Johnny Bravo', hash: '8093132bf6e1e8b792ff4a682a201b1a4732d847' },
  { id: 145, name: 'MTV Classic', show: 'TRL / Beavis & Butt-Head', hash: '8093132bf6e1e8b792ff4a682a201b1a4732d847' },
];

const YOUTUBE_COMMERCIALS = ['K38xNqZwB4s', 'v1PBpt81C98', '4o4pL1L4V_E', 'L_jWHffIx5E'];

export default function App() {
  const [selectedRow, setSelectedRow] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('guide'); // 'guide', 'player', 'settings'
  const [activeStreamUrl, setActiveStreamUrl] = useState(null);
  const [debridKey, setDebridKey] = useState(localStorage.getItem('debrid_api_key') || '');
  const [isPlayingCommercial, setIsPlayingCommercial] = useState(false);
  const [commercialId, setCommercialId] = useState('');

  // Handle D-Pad Navigation for TV Remotes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentScreen === 'guide') {
        if (e.key === 'ArrowDown') setSelectedRow((prev) => Math.min(prev + 1, RETRO_CHANNELS.length - 1));
        if (e.key === 'ArrowUp') setSelectedRow((prev) => Math.max(prev - 1, 0));
        if (e.key === 'Enter') playChannelStream(RETRO_CHANNELS[selectedRow]);
        if (e.key === 'c' || e.key === 'Menu') setCurrentScreen('settings');
      } else if (currentScreen === 'player') {
        if (e.key === 'Escape' || e.key === 'BackSpace') {
          setCurrentScreen('guide');
          setActiveStreamUrl(null);
          setIsPlayingCommercial(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, selectedRow]);

  const playChannelStream = async (channel) => {
    const randomComm = YOUTUBE_COMMERCIALS[Math.floor(Math.random() * YOUTUBE_COMMERCIALS.length)];
    setCommercialId(randomComm);
    setIsPlayingCommercial(true);
    setCurrentScreen('player');

    try {
      let resolvedUrl = '';
      if (debridKey) {
        const response = await fetch(`https://www.premiumize.me/api/transfer/directdl?apikey=${debridKey}&src=magnet:?xt=urn:btih:${channel.hash}`);
        const data = await response.json();
        if (data.status === 'success' && data.content.length > 0) {
          resolvedUrl = data.content[0].link;
        }
      }
      if (!resolvedUrl) {
        resolvedUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      }
      setTimeout(() => setActiveStreamUrl(resolvedUrl), 4000);
    } catch (err) {
      console.error('Debrid resolution failed', err);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#001845] font-mono select-none overflow-hidden flex flex-col p-4">
      {currentScreen === 'guide' && (
        <div className="flex flex-col h-full border-8 border-[#001233] p-2 bg-[#001845]">
          {/* Header */}
          <div className="flex justify-between items-center bg-[#002855] p-3 border-b-4 border-[#0466c8]">
            <div className="flex items-center space-x-3">
              <span className="bg-[#e63946] text-white font-bold px-3 py-1 rounded text-xl">OPTIMUM</span>
              <span className="text-xl font-bold text-[#90e0ef]">i-GUIDE TV (2003)</span>
            </div>
            <div className="text-[#caf0f8] font-bold">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Guide Content */}
          <div className="grid grid-cols-3 gap-4 my-4 h-1/3">
            <div className="bg-black border-4 border-[#0466c8] flex items-center justify-center text-xs text-[#90e0ef]">
              PREVIEW SCREEN
            </div>
            <div className="col-span-2 bg-[#002855] p-4 border-2 border-[#0466c8]">
              <h2 className="text-2xl font-bold text-yellow-400">{RETRO_CHANNELS[selectedRow].name}</h2>
              <p className="text-gray-300 mt-2">Now Playing: {RETRO_CHANNELS[selectedRow].show}</p>
            </div>
          </div>

          {/* EPG Table */}
          <div className="flex-1 bg-[#001233] border-2 border-[#0466c8] overflow-y-auto">
            {RETRO_CHANNELS.map((ch, idx) => (
              <div
                key={ch.id}
                onClick={() => playChannelStream(ch)}
                className={`grid grid-cols-4 p-3 border-b border-blue-900 cursor-pointer ${
                  idx === selectedRow ? 'bg-yellow-500 text-black font-bold' : 'text-white'
                }`}
              >
                <div>CH {ch.id}</div>
                <div className="col-span-3">{ch.show}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-300">D-PAD to navigate | OK/ENTER to watch | Menu/C for Settings</div>
        </div>
      )}

      {currentScreen === 'player' && (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {isPlayingCommercial ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-yellow-400 font-bold mb-2">RETRO COMMERCIAL BREAK</span>
              <iframe
                className="w-3/4 h-3/4 pointer-events-none"
                src={`https://www.youtube.com/embed/${commercialId}?autoplay=1&controls=0`}
                title="Commercial"
              />
              <button
                onClick={() => setIsPlayingCommercial(false)}
                className="mt-4 bg-yellow-500 text-black font-bold px-4 py-2 rounded"
              >
                Skip to Broadcast
              </button>
            </div>
          ) : (
            <video className="w-full h-full" src={activeStreamUrl} autoPlay controls />
          )}
        </div>
      )}

      {currentScreen === 'settings' && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-[#002855] p-6 border-4 border-[#0466c8] rounded w-1/2">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Debrid API Configuration</h2>
            <input
              type="password"
              placeholder="Paste Real-Debrid / Premiumize Key..."
              value={debridKey}
              onChange={(e) => {
                setDebridKey(e.target.value);
                localStorage.setItem('debrid_api_key', e.target.value);
              }}
              className="w-full p-2 bg-black text-white border border-[#0466c8] mb-4"
            />
            <button onClick={() => setCurrentScreen('guide')} className="bg-yellow-500 text-black font-bold px-4 py-2 w-full">
              Save & Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
