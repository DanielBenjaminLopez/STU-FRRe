import { useEffect, useRef } from "react";

interface VideoPanelProps {
  url: string;
  onEnded: () => void;
}

export default function VideoPanel({ url, onEnded }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    video.play().catch(() => {});
  }, [url]);

  return (
    <div className="col-span-4 row-span-6 overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        onEnded={onEnded}
      >
        <source src={url} />
      </video>
    </div>
  );
}
