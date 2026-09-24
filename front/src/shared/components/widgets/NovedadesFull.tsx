import NoticiasFull from "./NoticiasFull";

export default function NovedadesFull({ onClose }: { onClose: () => void }) {
  return <NoticiasFull onClose={onClose} filter="creados" title="Eventos" />;
}
