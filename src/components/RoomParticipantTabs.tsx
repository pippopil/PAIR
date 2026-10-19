import React from 'react';
import { UserParticipant } from '../types';
import { UserPlus, Trash2, ShieldAlert } from 'lucide-react';

interface RoomParticipantTabsProps {
  participants: UserParticipant[];
  activeParticipantId: string;
  onSelectParticipant: (id: string) => void;
  onAddParticipant: () => void;
  onRemoveParticipant: (id: string) => void;
  mode: 'duo' | 'party';
}

export const RoomParticipantTabs: React.FC<RoomParticipantTabsProps> = ({
  participants,
  activeParticipantId,
  onSelectParticipant,
  onAddParticipant,
  onRemoveParticipant,
  mode,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {participants.map((p, idx) => {
        const isActive = p.id === activeParticipantId;
        const vetoCount = (p.vetoes || []).length;
        const genresCount = (p.favoriteGenres || []).length;
        const moviesCount = (p.favoriteMovies || []).length;

        return (
          <div
            key={p.id}
            onClick={() => onSelectParticipant(p.id)}
            className={`group relative cursor-pointer shrink-0 min-w-[140px] sm:min-w-[170px] p-2.5 rounded-2xl border transition-all ${
              isActive
                ? 'bg-slate-900 border-rose-500 shadow-md shadow-rose-500/10'
                : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl select-none">{p.avatar || '👤'}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 truncate max-w-[90px]">
                    {p.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block">
                    Участник {idx + 1}
                  </span>
                </div>
              </div>

              {/* Remove button if party mode and > 2 */}
              {mode === 'party' && participants.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveParticipant(p.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  title="Удалить участника"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                {genresCount} жанр.
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                {moviesCount} тайтл.
              </span>
              {vetoCount > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  {vetoCount} вето
                </span>
              )}
            </div>

            {isActive && (
              <div className="absolute -bottom-[1px] left-4 right-4 h-0.5 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" />
            )}
          </div>
        );
      })}

      {/* Add participant button in party mode */}
      {mode === 'party' && participants.length < 5 && (
        <button
          onClick={onAddParticipant}
          className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-4 rounded-2xl border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/30 hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-300 text-xs font-semibold transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Человек</span>
        </button>
      )}
    </div>
  );
};
