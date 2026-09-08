import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface VideoPanelProps {
  url: string;
  onEnded: () => void;
}

export default function VideoPanel({ url, onEnded }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      const d = video.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      setDuration(d);
      video.play().catch(() => {});
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.load();

    return () => video.removeEventListener("loadedmetadata", onLoadedMetadata);
  }, [url]);

  useEffect(() => {
    if (!Number.isFinite(duration) || duration <= 0) return;

    const video = videoRef.current;
    if (!video) return;

    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const onPlaying = () => {
      const showAt = duration * 0.25 * 1000;
      const hideAt = duration * 0.75 * 1000;
      showTimer = setTimeout(() => setShowCard(true), showAt);
      hideTimer = setTimeout(() => setShowCard(false), hideAt);
    };

    video.addEventListener("playing", onPlaying);

    return () => {
      video.removeEventListener("playing", onPlaying);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  return (
    <div className="col-span-4 row-span-6 overflow-hidden rounded-2xl relative h-full w-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        onEnded={onEnded}
        onError={onEnded}
      >
        <source src={url} />
      </video>

      <AnimatePresence>
        {showCard && (
          <motion.div
            className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-4xl px-10 py-6 whitespace-nowrap">
              <span className="text-4xl font-medium text-gray-700">
                Tocá para interactuar
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
