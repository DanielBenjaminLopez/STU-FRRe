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

    const onLoadedMetadata = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.load();

    return () => video.removeEventListener("loadedmetadata", onLoadedMetadata);
  }, [url]);

  return (
    <div className="col-span-4 row-span-6 overflow-hidden rounded-4xl relative h-full w-full">
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
    </div>
  );
}
