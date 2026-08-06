import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { PhoneOutlined, EyeOutlined, MessageOutlined, CloseOutlined } from '@ant-design/icons';
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  Chat,
  useConnectionState,
  useParticipants
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState } from 'livekit-client';
import axios from 'axios';

const serverUrl = import.meta.env.VITE_LIVEKIT_URL;
const backendApiUrl = import.meta.env.VITE_BACKEND_URL;
const FONT_IMPORTS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .bc-root {
    --bc-void: #0a0b0d;
    --bc-panel: #14171b;
    --bc-panel-raised: #1a1e23;
    --bc-line: #262b31;
    --bc-text: #f2f0ea;
    --bc-muted: #8b92a0;
    --bc-live: #ff3b30;
    --bc-live-dim: #7a2622;
    --bc-signal: #ffc53d;
    --bc-viewer: #3ddc97;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .bc-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
  .bc-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

  @keyframes bc-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.82); }
  }
  .bc-live-dot { animation: bc-pulse 1.6s ease-in-out infinite; }

  @keyframes bc-scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  .bc-chat-theme, .bc-chat-theme * {
    box-sizing: border-box;
  }
  .bc-chat-theme {
    --lk-bg: #14171b;
    --lk-bg2: #1a1e23;
    --lk-bg3: #20252b;
    --lk-fg: #f2f0ea;
    --lk-fg2: #8b92a0;
    --lk-border-color: #262b31;
    --lk-accent-bg: #ff3b30;
    --lk-accent-fg: #0a0b0d;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .bc-chat-theme .lk-chat { height: 100%; width: 100%; display: flex; flex-direction: column; }
  .bc-chat-theme .lk-chat-header { color: #ffffff; }
  .bc-chat-theme .lk-list { flex: 1; width: 100%; overflow-y: auto; overflow-x: hidden; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .bc-chat-theme .lk-list::-webkit-scrollbar { width: 6px; }
  .bc-chat-theme .lk-list::-webkit-scrollbar-thumb { background: #262b31; border-radius: 999px; }
  .bc-chat-theme .lk-list::-webkit-scrollbar-track { background: transparent; }

  .bc-chat-theme .lk-chat-entry {
    max-width: 88%;
    padding: 8px 12px;
    border-radius: 12px;
    background: #1a1e23;
    border: 1px solid #262b31;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .bc-chat-theme .lk-chat-entry[data-lk-message-origin="local"] {
    align-self: flex-end;
    background: rgba(255, 59, 48, 0.12);
    border-color: rgba(255, 59, 48, 0.35);
    border-bottom-right-radius: 4px;
  }
  .bc-chat-theme .lk-chat-entry:not([data-lk-message-origin="local"]) {
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  .bc-chat-theme .lk-meta-data { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
  .bc-chat-theme .lk-participant-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    font-weight: 500;
    color: #ffc53d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .bc-chat-theme .lk-timestamp {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    color: #8b92a0;
  }
  .bc-chat-theme .lk-message-body {
    color: #f2f0ea;
    font-size: 13px;
    line-height: 1.45;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .bc-chat-theme .lk-chat-form {
    display: flex;
    width: 100%;
    gap: 8px;
    padding: 10px;
    background: #0a0b0d;
    border-top: 1px solid #262b31;
  }
  .bc-chat-theme .lk-form-control,
  .bc-chat-theme .lk-chat-form-input {
    flex: 1;
    background: #1a1e23;
    border: 1px solid #262b31;
    border-radius: 999px;
    padding: 8px 14px;
    color: #f2f0ea;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .bc-chat-theme .lk-form-control:focus,
  .bc-chat-theme .lk-chat-form-input:focus {
    border-color: #ff3b30;
  }
  .bc-chat-theme .lk-chat-form-button,
  .bc-chat-theme .lk-button {
    background: #ff3b30;
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .bc-chat-theme .lk-chat-form-button:hover,
  .bc-chat-theme .lk-button:hover {
    background: #e32e24;
  }

  .bc-controlbar {
    --lk-control-bg: #14171b;
    --lk-control-fg: #f2f0ea;
    --lk-control-hover-bg: #20252b;
    --lk-danger: #ff3b30;
    --lk-border-color: #262b31;
  }

  @media (prefers-reduced-motion: reduce) {
    .bc-live-dot, .bc-scan-line { animation: none !important; }
  }
`;

const LivestreamPage = () => {
  const { roomID } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [token, setToken] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get(`${backendApiUrl}/v1/api/livestream/token?room=${roomID}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        if (response.data && response.data.EC === 0) {
          setToken(response.data.data.token);
        }
      } catch (error) {
        console.error("Failed to fetch token", error);
        alert("Không thể lấy token để kết nối Livestream!");
      }
    };

    if (auth.isAuthenticated) {
      fetchToken();
    }
  }, [auth.isAuthenticated, roomID]);

  const isAdmin = auth?.user?.role === 'admin';

  if (!token) {
    return (
      <div className="bc-root w-screen h-screen flex items-center justify-center" style={{ background: 'var(--bc-void)' }}>
        <style>{FONT_IMPORTS}</style>
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 rounded-full bc-live-dot" style={{ background: 'var(--bc-live)' }} />
          <p className="bc-mono text-sm tracking-widest uppercase" style={{ color: 'var(--bc-muted)' }}>
            Đang chuẩn bị kết nối Livestream...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bc-root w-screen h-screen flex flex-col" style={{ background: 'var(--bc-void)' }}>
      <style>{FONT_IMPORTS}</style>

      {/* Chassis header */}
      <div
        className="px-3 md:px-5 py-2 md:py-3 flex items-center justify-between shadow-md z-10"
        style={{ background: 'var(--bc-panel)', borderBottom: '1px solid var(--bc-line)' }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-md flex items-center justify-center font-bold bc-display text-sm"
            style={{ background: 'var(--bc-panel-raised)', color: 'var(--bc-text)', border: '1px solid var(--bc-line)' }}
          >
            {auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div>
            <h2 className="bc-display text-sm md:text-base font-semibold leading-tight" style={{ color: 'var(--bc-text)' }}>
              Phòng Livestream
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span
            className="bc-mono text-[9px] md:text-[11px] px-2 py-1 rounded uppercase tracking-wider hidden sm:inline-block"
            style={{
              color: isAdmin ? 'var(--bc-signal)' : 'var(--bc-viewer)',
              border: `1px solid ${isAdmin ? 'var(--bc-signal)' : 'var(--bc-viewer)'}`,
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            {isAdmin ? 'Admin' : 'Viewer'}
          </span>
          <button
            onClick={() => navigate('/')}
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-md font-medium transition-colors flex items-center gap-1 md:gap-2 bc-display text-xs md:text-sm"
            style={{ background: 'var(--bc-live)', color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e32e24')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bc-live)')}
          >
            <PhoneOutlined className="rotate-[135deg]" /> <span className="hidden sm:inline">Rời livestream</span>
          </button>
        </div>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        video={isAdmin}
        audio={isAdmin}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        className="flex-1 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Video / console area */}
        <div className="flex-1 p-0 md:p-4 flex flex-col relative min-w-0 w-full bg-black md:bg-transparent">
          <div
            className="flex-1 md:rounded-2xl overflow-hidden md:shadow-lg relative border-0 md:border md:border-[#262b31] bg-black"
          >
            {/* viewfinder corner brackets — the signature detail */}
            <div className="hidden md:block">
              <Corner style={{ top: 12, left: 12, borderRight: 'none', borderBottom: 'none' }} />
              <Corner style={{ top: 12, right: 12, borderLeft: 'none', borderBottom: 'none' }} />
              <Corner style={{ bottom: 12, left: 12, borderRight: 'none', borderTop: 'none' }} />
              <Corner style={{ bottom: 12, right: 12, borderLeft: 'none', borderTop: 'none' }} />
            </div>

            <LivestreamVideo />

            {/* Floating Chat Button for Mobile */}
            <button
              className={`
                md:hidden absolute bottom-6 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                ${isMobileChatOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}
              `}
              style={{ background: 'var(--bc-live)', color: 'white', boxShadow: '0 4px 12px rgba(255,59,48,0.4)' }}
              onClick={() => setIsMobileChatOpen(true)}
            >
              <MessageOutlined className="text-xl" />
            </button>
          </div>

          {isAdmin && (
            <div className="mt-4 flex justify-center bc-controlbar">
              <ControlBar />
            </div>
          )}
        </div>

        {/* Chat / feed area (Bottom Sheet on Mobile) */}
        <div
          className={`
            fixed inset-x-0 bottom-0 top-[35vh] z-50 flex flex-col transition-transform duration-300 ease-out
            rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none
            ${isMobileChatOpen ? 'translate-y-0' : 'translate-y-full'}
            md:static md:translate-y-0 md:w-80 lg:w-96 md:flex-1 md:min-h-0
          `}
          style={{ background: 'var(--bc-panel)', borderLeft: '1px solid var(--bc-line)' }}
        >
          <div
            className="px-4 py-3 flex flex-col bc-display font-semibold text-sm rounded-t-3xl md:rounded-none"
            style={{ background: 'var(--bc-void)', borderBottom: '1px solid var(--bc-line)', color: 'var(--bc-text)' }}
          >
            {/* Drag handle for mobile */}
            <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto mb-3 md:hidden opacity-70" />
            
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>Live Feed</span>
                <span className="w-1.5 h-1.5 rounded-full bc-live-dot" style={{ background: 'var(--bc-live)' }} />
              </div>
              <div className="flex items-center gap-3">
                <ViewerCountBadge />
                <button 
                  className="md:hidden w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                  onClick={() => setIsMobileChatOpen(false)}
                >
                  <CloseOutlined className="text-xs" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bc-chat-theme">
            <Chat />
          </div>
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

/* Small decorative corner bracket used on the video monitor */
const Corner = ({ style }) => (
  <div
    className="absolute w-6 h-6 pointer-events-none z-10"
    style={{ border: '2px solid rgba(255,255,255,0.35)', ...style }}
  />
);



const LivestreamVideo = () => {
  // withPlaceholder: false — viewers never publish, so this only ever
  // resolves to a real track when the broadcaster (admin) is actually
  // sending video. No empty placeholder tiles for the audience.
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const connectionState = useConnectionState();

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex items-center justify-center h-full w-full bc-mono text-sm" style={{ color: 'var(--bc-muted)' }}>
        Đang kết nối đến máy chủ Livestream...
      </div>
    );
  }

  // Prefer a screen share if the broadcaster is presenting one, otherwise
  // fall back to camera. There is only ever one publisher, so this is
  // always the admin's stream.
  const activeTrack =
    tracks.find((t) => t.source === Track.Source.ScreenShare) ??
    tracks.find((t) => t.source === Track.Source.Camera);

  if (!activeTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div
          className="w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--bc-panel-raised)', border: '1px solid var(--bc-line)' }}
        />
        <p className="bc-mono text-sm" style={{ color: 'var(--bc-muted)' }}>
          Chưa có phiên livestream...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <VideoTrack trackRef={activeTrack} className="h-full w-full object-contain md:object-cover" />
      <div
        className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-md"
        style={{ background: 'rgba(10,11,13,0.7)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--bc-live)' }} />
        <span className="bc-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--bc-text)' }}>
          {activeTrack.participant?.name || activeTrack.participant?.identity || 'Broadcaster'}
        </span>
      </div>
    </div>
  );
};

const ViewerCountBadge = () => {
  const participants = useParticipants();
  
  // Đếm những người KHÔNG có quyền publish (tức là những người xem bình thường)
  const viewerCount = participants.filter(p => p.permissions && !p.permissions.canPublish).length;

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--bc-line)' }}>
      <span style={{ fontSize: '11px', color: 'var(--bc-viewer)' }}><EyeOutlined style={{color: 'white'}}/></span>
      <span className="bc-mono text-[11px]" style={{ color: 'var(--bc-text)' }}>
        {viewerCount}
      </span>
    </div>
  );
};

export default LivestreamPage;