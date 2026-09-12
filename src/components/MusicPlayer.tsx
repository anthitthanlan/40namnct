"use client";

import { useEffect, useRef, useState } from "react";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = new Audio("/roadmap_music.mp3");
    audio.loop = true;
    audio.volume = 0.65;
    audioRef.current = audio;

    const tryPlay = () => {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setReady(true);
          cleanupGesture();
        })
        .catch(() => {
          /* trình duyệt chặn autoplay → chờ tương tác đầu tiên */
        });
    };

    const onFirstGesture = () => tryPlay();

    function cleanupGesture() {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("wheel", onFirstGesture);
    }

    // Cố gắng phát ngay; bị chặn thì gắn listener tương tác đầu tiên
    tryPlay();
    if (!ready) {
      window.addEventListener("pointerdown", onFirstGesture, { once: true });
      window.addEventListener("keydown", onFirstGesture, { once: true });
      window.addEventListener("touchstart", onFirstGesture, { once: true });
      window.addEventListener("wheel", onFirstGesture, { once: true });
    }

    return () => {
      cleanupGesture();
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1d4ed8] text-xl text-white shadow-[7px_7px_0_-1px_#0f172a,7px_7px_0_0_rgba(15,23,42,0.35),12px_14px_26px_rgba(15,23,42,0.25)] transition-transform hover:scale-105 active:scale-95"
    >
      {playing ? (
        // Đĩa nhạc quay
        <span className="relative grid place-items-center">
          <span
            className="absolute h-11 w-11 rounded-full border-2 border-white/40"
            style={{ animation: "spin 3s linear infinite" }}
          />
          🎵
        </span>
      ) : (
        <span className="opacity-80">🔇</span>
      )}
    </button>
  );
}
