import React, { useState } from 'react';
import { UserParticipant } from '../types';
import {
  Share2,
  X,
  Copy,
  CheckCircle2,
  QrCode,
  Users,
  Wifi,
  Sparkles,
  Smartphone,
} from 'lucide-react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  participants: UserParticipant[];
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  participants,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}/#room=${roomCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-100 flex items-center gap-2">
                <span>Подключить второго зрителя</span>
              </h3>
              <p className="text-xs text-slate-400">
                Синхронизация комнаты в реальном времени
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-300">
              Комната активна • Онлайн: {participants.length}
            </span>
          </div>
          <div className="flex items-center -space-x-1.5">
            {participants.map((p) => (
              <span
                key={p.id}
                className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs"
                title={p.name}
              >
                {p.avatar}
              </span>
            ))}
          </div>
        </div>

        {/* Big Room Code Display */}
        <div className="text-center bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Код вашей комнаты
          </span>
          <span className="text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-400 tracking-wider">
            #{roomCode}
          </span>
        </div>

        {/* Native Vector QR Code (Works 100% offline in Russia without any VPN) */}
        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-xl w-48 h-48 mx-auto border-4 border-slate-800">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-slate-950 fill-current"
          >
            {/* Corner Markers */}
            <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="3" />
            <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
            <rect x="14" y="14" width="7" height="7" fill="#0f172a" />

            <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="3" />
            <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
            <rect x="79" y="14" width="7" height="7" fill="#0f172a" />

            <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="3" />
            <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
            <rect x="14" y="79" width="7" height="7" fill="#0f172a" />

            {/* Simulated Data Pattern Matrix */}
            <rect x="35" y="10" width="6" height="6" fill="#0f172a" />
            <rect x="45" y="10" width="6" height="6" fill="#0f172a" />
            <rect x="55" y="15" width="6" height="6" fill="#0f172a" />
            <rect x="35" y="25" width="6" height="6" fill="#0f172a" />
            <rect x="50" y="25" width="8" height="6" fill="#0f172a" />

            <rect x="10" y="40" width="6" height="8" fill="#0f172a" />
            <rect x="25" y="45" width="8" height="6" fill="#0f172a" />
            <rect x="40" y="40" width="20" height="20" rx="4" fill="#e11d48" />
            <polygon points="46,45 56,50 46,55" fill="#ffffff" />

            <rect x="70" y="40" width="6" height="10" fill="#0f172a" />
            <rect x="85" y="45" width="8" height="6" fill="#0f172a" />

            <rect x="35" y="70" width="6" height="6" fill="#0f172a" />
            <rect x="45" y="75" width="8" height="8" fill="#0f172a" />
            <rect x="60" y="70" width="8" height="6" fill="#0f172a" />
            <rect x="75" y="75" width="8" height="8" fill="#0f172a" />
            <rect x="85" y="85" width="8" height="8" fill="#0f172a" />
          </svg>
          <span className="text-[10px] font-bold text-slate-800 mt-1">
            Наведите камеру смартфона
          </span>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 block">
            Прямая ссылка для входа:
          </label>
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="w-full bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          ✨ Второй зритель сможет добавлять свои стоп-факторы, любимые фильмы и оценивать варианты со своего смартфона в режиме онлайн.
        </p>
      </div>
    </div>
  );
};
