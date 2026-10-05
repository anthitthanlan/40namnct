"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const pathname = usePathname();
  const isOverlapPage = pathname === "/thu-moi" || pathname === "/xac-nhan-dong-gop";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo Audio
  useEffect(() => {
    const audio = new Audio();
    audio.src = "/bg_music.mp3";
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0.7;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    // Cố gắng phát nhạc khi có tương tác đầu tiên của người dùng
    const tryAutoplay = () => {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          cleanupGesture();
        })
        .catch(() => {
          // Trình duyệt chặn autoplay, chờ click của người dùng
        });
    };

    const onFirstGesture = () => tryAutoplay();

    function cleanupGesture() {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    }

    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    window.addEventListener("touchstart", onFirstGesture, { once: true });

    return () => {
      cleanupGesture();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audioRef.current = null;
    };
  }, [isSeeking]);

  // Điều khiển Phát / Tạm dừng
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => { });
    } else {
      audio.pause();
    }
  }, []);

  // Xử lý Tua thời gian (Seek)
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const target = e.currentTarget as HTMLInputElement;
    const val = parseFloat(target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  // Tua nhanh 5s tới hoặc lùi
  const skipTime = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + delta), duration || 9999);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Điều khiển Âm lượng
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.7;
      setVolume(restored);
      setIsMuted(false);
      audioRef.current.volume = restored;
      audioRef.current.muted = false;
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
      audioRef.current.volume = 0;
      audioRef.current.muted = true;
    }
  };

  // Hover handlers cho desktop (có delay chống chớp tắt khi di chuột)
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 450);
  };

  const showExpanded = isExpanded || isHovered;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed right-5 sm:bottom-6 sm:right-6 z-50 select-none flex items-end justify-end transition-all duration-300 ${isOverlapPage ? "bottom-24" : "bottom-5"}`}
    >
      <motion.div
        animate={{
          width: showExpanded ? 320 : 230,
          height: showExpanded ? 204 : 52,
          borderRadius: showExpanded ? 32 : 26,
        }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        onClick={() => { if (!showExpanded) setIsExpanded(true); }}
        className="mx-auto overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200/60 text-slate-900 shadow-xl transition-colors cursor-pointer relative origin-bottom-right"
      >
        <AnimatePresence initial={false}>
          {!showExpanded ? (
            /* ========================================================
               TRẠNG THÁI THU GỌN: PILL CAPSULE DYNAMIC ISLAND
               ======================================================== */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-between px-3.5 pt-[2px]"
            >
              {/* ĐĨA NHẠC LOGO NGUYỄN CÔNG TRỨ XOAY TRÒN */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-inner bg-slate-900 border border-slate-700/60 flex items-center justify-center">
                <div
                  className={`w-full h-full relative rounded-full flex items-center justify-center ${isPlaying ? "animate-spin" : ""
                    }`}
                  style={{
                    animationDuration: "4s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                  }}
                >
                  {/* Rãnh đĩa vinyl */}
                  <div className="absolute inset-0 rounded-full border border-slate-700/50" />
                  <div className="absolute inset-1 rounded-full border border-slate-800/40" />
                  {/* Logo trường Nguyễn Công Trứ làm tâm đĩa */}
                  <Image
                    src="/images/logo_nct.webp"
                    alt="NCT Vinyl"
                    width={24}
                    height={24}
                    className="object-contain rounded-full drop-shadow-sm"
                  />
                  {/* Lỗ trục đĩa */}
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-950 border border-white/60" />
                </div>
              </div>

              {/* Tên bài hát & Sóng nhạc Waveform (Yêu cầu 2 + 1) */}
              <div className="flex items-center gap-2 pr-1">
                <div className="flex flex-col">
                  <div
                    className="w-[100px] overflow-hidden whitespace-nowrap"
                    style={{ WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)', maskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}
                  >
                    <div
                      className={`flex w-fit ${isPlaying ? "animate-marquee-slow" : ""}`}
                      style={{ animationPlayState: isPlaying ? "running" : "paused" }}
                    >
                      <span className="text-xs font-bold text-slate-900 tracking-wide leading-none pr-6">
                        NCT Đón Chào Ngày Mai
                      </span>
                      <span className="text-xs font-bold text-slate-900 tracking-wide leading-none pr-6">
                        NCT Đón Chào Ngày Mai
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5 tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                </div>

                {/* Sóng nhạc kiểu thanh dọc (Waveform) */}
                {isPlaying ? (
                  <div className="flex items-center gap-0.5 h-[18px] ml-1">
                    <div className="w-[3px] bg-blue-400 rounded-full animate-bounce [animation-delay:0ms] h-[60%]" />
                    <div className="w-[3px] bg-blue-400 rounded-full animate-bounce [animation-delay:150ms] h-[80%]" />
                    <div className="w-[3px] bg-blue-400 rounded-full animate-bounce [animation-delay:300ms] h-[100%]" />
                    <div className="w-[3px] bg-blue-400 rounded-full animate-bounce [animation-delay:75ms] h-[70%]" />
                    <div className="w-[3px] bg-blue-400 rounded-full animate-bounce [animation-delay:200ms] h-[50%]" />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 ml-1">❚❚</span>
                )}
              </div>

              {/* Nút Play/Pause nhanh */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Tạm dừng" : "Phát nhạc"}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-900 transition-all ml-0.5"
              >
                <span className="material-symbols-rounded text-base">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
            </motion.div>
          ) : (
            /* ========================================================
               TRẠNG THÁI MỞ RỘNG: DYNAMIC ISLAND PLAYER
               ======================================================== */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="absolute inset-0 flex flex-col p-4 sm:p-5"
            >
              {/* HEADER: ĐĨA NHẠC + THÔNG TIN BÀI HÁT + NÚT THU GỌN */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* ĐĨA NHẠC VINYL LỚN */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-lg bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-800 border-2 border-slate-700/60 flex items-center justify-center p-1">
                    <div
                      className={`w-full h-full relative rounded-full flex items-center justify-center ${isPlaying ? "animate-spin" : ""
                        }`}
                      style={{
                        animationDuration: "5s",
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                      }}
                    >
                      {/* Các vòng rãnh đĩa than */}
                      <div className="absolute inset-0 rounded-full border border-slate-700/60" />
                      <div className="absolute inset-1 rounded-full border border-slate-800/80" />
                      <div className="absolute inset-2 rounded-full border border-slate-700/40" />

                      {/* Logo NCT ở tâm đĩa */}
                      <Image
                        src="/images/logo_nct.webp"
                        alt="NCT Vinyl Disc"
                        width={28}
                        height={28}
                        className="object-contain rounded-full drop-shadow-md z-10"
                      />

                      {/* Trục tâm */}
                      <div className="absolute w-2 h-2 rounded-full bg-slate-950 border border-white/70 z-20" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div
                      className="w-[170px] overflow-hidden whitespace-nowrap mt-0.5"
                      style={{ WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)', maskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}
                    >
                      <div
                        className={`flex w-fit ${isPlaying ? "animate-marquee-slower" : ""}`}
                        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
                      >
                        <h4 className="text-sm font-bold text-slate-900 leading-snug pr-8">
                          Trường Nguyễn Công Trứ đón chào ngày mai
                        </h4>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug pr-8">
                          Trường Nguyễn Công Trứ đón chào ngày mai
                        </h4>
                      </div>
                    </div>
                    <motion.p layout="position" className="text-[11px] text-slate-500 truncate mt-0.5">
                      Phạm Gia Khang
                    </motion.p>
                  </div>
                </div>

                {/* Nút thu nhỏ lại */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                    setIsHovered(false);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shrink-0"
                  title="Thu gọn"
                >
                  <span className="material-symbols-rounded text-lg">expand_more</span>
                </button>
              </div>

              {/* THANH PROGRESS TÙY CHỈNH (Yêu cầu 4) & THỜI GIAN TABULAR NUMS (Yêu cầu 1) */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-sans font-medium text-slate-500">
                <p className="tabular-nums w-8 text-right">{formatTime(currentTime)}</p>
                <div className="relative h-4 w-full touch-none select-none">
                  <div className="absolute inset-0 flex h-full w-full cursor-pointer items-center px-1">
                    {/* Thanh nền (Track) */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200" style={{ transformOrigin: "right center" }}>
                      {/* Thanh chạy (Fill) */}
                      <div
                        className="absolute h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 transition-all duration-150"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {/* Input seek range vô hình nằm đè lên để kéo tua mượt */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeekChange}
                    onMouseDown={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    onTouchStart={handleSeekStart}
                    onTouchEnd={handleSeekEnd}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Tua bài hát"
                  />
                </div>
                <p className="tabular-nums w-8 text-left">-{formatTime(duration > currentTime ? duration - currentTime : 0)}</p>
              </div>

              {/* BỘ ĐIỀU KHIỂN & CHỈNH ÂM LƯỢNG */}
              <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100">
                {/* Nút điều khiển: Lùi 5s, Play/Pause, Tới 5s */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => skipTime(-5, e)}
                    title="Lùi 5 giây"
                    className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-90 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
                  >
                    <span className="material-symbols-rounded text-lg">replay_5</span>
                  </button>

                  <motion.button
                    layout="position"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    aria-label={isPlaying ? "Tạm dừng" : "Phát nhạc"}
                    className="w-10 h-10 rounded-full bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center transition-all font-bold"
                  >
                    <span className="material-symbols-rounded text-2xl">
                      {isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={(e) => skipTime(5, e)}
                    title="Tua tới 5 giây"
                    className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-90 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
                  >
                    <span className="material-symbols-rounded text-lg">forward_5</span>
                  </button>
                </div>

                {/* Điều khiển Âm lượng (Volume Slider) */}
                <div className="flex items-center gap-2 flex-1 max-w-[120px] justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                    title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
                  >
                    <span className="material-symbols-rounded text-lg">
                      {isMuted || volume === 0
                        ? "volume_off"
                        : volume < 0.5
                          ? "volume_down"
                          : "volume_up"}
                    </span>
                  </button>
                  <div className="relative w-16 flex items-center touch-none select-none h-4">
                    <div className="absolute inset-0 flex h-full w-full cursor-pointer items-center">
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-slate-800 transition-all duration-150"
                          style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
