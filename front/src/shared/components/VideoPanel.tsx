import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Typewriter, { Cursor } from "react-mk";

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

    const onCanPlay = () => {
      setDuration(video.duration);
      video.play().catch(() => {});
    };

    video.addEventListener("canplay", onCanPlay);
    video.load();

    return () => video.removeEventListener("canplay", onCanPlay);
  }, [url]);

  useEffect(() => {
    if (duration <= 0) return;

    const showAt = duration * 0.5 * 1000;
    const showCardTimer = setTimeout(() => setShowCard(true), showAt);
    const hideTimer = setTimeout(() => setShowCard(false), showAt + 5000);

    return () => {
      clearTimeout(showCardTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  return (
    <div className="col-span-4 row-span-6 overflow-hidden rounded-2xl relative">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        onEnded={onEnded}
      >
        <source src={url} />
      </video>

      <AnimatePresence>
        {showCard && (
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-4xl px-10 py-6 whitespace-nowrap">
              <span className="text-4xl font-medium text-gray-700">
                <Typewriter
                  typeSpeed={[40, 70]}
                  mistakeChance={0.04}
                  loop={false}
                >
                  Tocá para interactuar
                </Typewriter>
                <Cursor blinkSpeed={530} />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
