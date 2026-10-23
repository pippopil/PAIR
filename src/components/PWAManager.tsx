import React, { useState } from 'react';
import { Download, RefreshCw, WifiOff, X, Smartphone, Check, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { usePWA } from '../usePWA';

interface PWAManagerProps {
  isDataFromCache?: boolean;
}

export const PWAManager: React.FC<PWAManagerProps> = ({ isDataFromCache }) => {
  const { isOnline, isInstalled, isInstallable, isIOS, updateAvailable, applyUpdate, installPWA } = usePWA();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios'>('android');
  const [dismissOfflineNotice, setDismissOfflineNotice] = useState(false);

  return (
    <>
      {/* 1. App Update Banner (Без переустановки приложения) */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 text-white px-4 py-2.5 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-full bg-white/20 animate-spin">
                <RefreshCw className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong>Новая версия готова!</strong> Обновите приложение в один клик без переустановки.
              </span>
            </div>
            <button
              onClick={applyUpdate}
              className="px-4 py-1.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition shadow active:scale-95 text-xs whitespace-nowrap"
            >
              Обновить сейчас ⚡
            </button>
          </div>
        </div>
      )}

      {/* 2. Offline / Cached Mode Indicator */}
      {(!isOnline || isDataFromCache) && !dismissOfflineNotice && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-amber-300 truncate">
                {!isOnline ? 'Офлайн-режим' : 'Данные из кэша'}
              </p>
              <p className="text-[11px] text-slate-300 leading-tight">
                Сохранённые рекомендации доступны без интернета через Service Worker.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissOfflineNotice(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
            title="Скрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Header / Floating Install Button */}
      {!isInstalled && (
        <div className="flex items-center gap-1.5">
          {isInstallable ? (
            <button
              onClick={installPWA}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-md hover:shadow-rose-500/20 transition active:scale-95"
              title="Установить PWA приложение"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Установить PWA</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveGuideTab(isIOS ? 'ios' : 'android');
                setShowGuideModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
              title="Инструкция по установке приложения"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Как установить</span>
              <span className="sm:hidden">PWA</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Detailed Step-by-Step PWA Installation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20 shrink-0">
                <img src="/icon.svg" alt="KinoMatch" className="w-full h-full rounded-[14px]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Установка KinoMatch</h3>
                <p className="text-xs text-slate-400">Работает офлайн, с иконкой на экране телефона</p>
              </div>
            </div>

            {/* Platform Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl mb-5 border border-slate-800">
              <button
                onClick={() => setActiveGuideTab('android')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  activeGuideTab === 'android'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🤖 Android / Chrome</span>
              </button>
              <button
                onClick={() => setActiveGuideTab('ios')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  activeGuideTab === 'ios'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🍏 iPhone / iPad (Safari)</span>
              </button>
            </div>

            {/* Android instructions */}
            {activeGuideTab === 'android' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Откройте меню браузера Chrome / Яндекс</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Нажмите на три точки <strong>⋮</strong> в правом верхнем углу экрана.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Выберите «Установить приложение»</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Или нажмите <strong>«Добавить на главный экран»</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Подтвердите установку</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Иконка 🎬 KinoMatch появится среди ваших приложений на рабочем столе телефона.
                    </p>
                  </div>
                </div>

                {isInstallable && (
                  <button
                    onClick={() => {
                      setShowGuideModal(false);
                      installPWA();
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold hover:brightness-110 transition shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Установить прямо сейчас</span>
                  </button>
                )}
              </div>
            )}

            {/* iOS instructions */}
            {activeGuideTab === 'ios' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>Нажмите «Поделиться»</span>
                      <Share2 className="w-4 h-4 text-blue-400" />
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      В нижней панели браузера <strong>Safari</strong> нажмите иконку квадрата со стрелочкой вверх.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <span>Выберите «На экран „Домой“»</span>
                      <PlusSquare className="w-4 h-4 text-amber-400" />
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Прокрутите список действий вниз и выберите этот пункт.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Нажмите «Добавить»</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      В правом верхнем углу. Фирменная иконка KinoMatch мгновенно появится на домашнем экране iOS!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PWA Advantages */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/50 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Преимущества PWA приложения:</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Работает офлайн даже без сотовой связи и интернета</li>
                <li>Мгновенный запуск в полноэкранном режиме без адресной строки</li>
                <li>Обновляется автоматически прямо в приложении без переустановки</li>
                <li>Занимает меньше 5 МБ памяти на телефоне</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
