import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchFeed,
  fetchFeedScraping,
  fetchFeedCreados,
  type Noticia,
} from "../noticias";
import * as client from "../client";
import * as eventosApi from "../eventos";

vi.mock("../client", () => ({
  publicFetch: vi.fn(),
  apiFetch: vi.fn(),
  apiUpload: vi.fn(),
}));

vi.mock("../eventos", () => ({
  fetchEventos: vi.fn(),
}));

const mockPublicFetch = vi.mocked(client.publicFetch);
const mockFetchEventos = vi.mocked(eventosApi.fetchEventos);

describe("noticias API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const NOTICIAS: Noticia[] = [
    {
      id: 1,
      titulo: "Noticia Manual",
      contenido: "Contenido 1",
      fecha_publicacion: "2026-09-01T10:00:00Z",
      fecha_expiracion: null,
      imagen_url: "",
      enlace: "",
      origen: "manual",
    },
    {
      id: 2,
      titulo: "Noticia Scraping",
      contenido: "Contenido 2",
      fecha_publicacion: "2026-09-02T10:00:00Z",
      fecha_expiracion: null,
      imagen_url: "",
      enlace: "",
      origen: "scraping",
    },
  ];

  const EVENTOS: eventosApi.Evento[] = [
    {
      id: 10,
      titulo: "Torneo de Ajedrez",
      tipo: "recreativo",
      tipo_otro: "",
      descripcion: "Torneo abierto",
      fecha_hora_inicio: "2026-09-05T14:00:00Z",
      fecha_hora_fin: "2026-09-05T18:00:00Z",
      imagen_url: "",
      espacio: null,
      espacio_nombre: null,
      destacado: false,
    },
    {
      id: 11,
      titulo: "Semana de la Ingeniería",
      tipo: "charla",
      tipo_otro: "",
      descripcion: "Evento destacado anual",
      fecha_hora_inicio: "2026-09-10T09:00:00Z",
      fecha_hora_fin: "2026-09-10T20:00:00Z",
      imagen_url: "",
      espacio: "Aula Magna",
      espacio_nombre: "Aula Magna",
      destacado: true,
    },
  ];

  it("fetchFeed combina noticias y eventos ordenados por fecha", async () => {
    mockPublicFetch.mockResolvedValue(NOTICIAS);
    mockFetchEventos.mockResolvedValue([EVENTOS[0]]);

    const feed = await fetchFeed();
    expect(feed.length).toBe(3);
    expect(feed[0].id).toBe(10); // 2026-09-05 es más reciente que 2026-09-02
  });

  it("fetchFeedScraping solo devuelve noticias de origen scraping", async () => {
    mockPublicFetch.mockResolvedValue(NOTICIAS);

    const feed = await fetchFeedScraping();
    expect(feed.length).toBe(1);
    expect(feed[0].titulo).toBe("Noticia Scraping");
  });

  it("fetchFeedCreados devuelve únicamente el evento destacado si existe uno", async () => {
    mockPublicFetch.mockResolvedValue(NOTICIAS);
    mockFetchEventos.mockResolvedValue(EVENTOS);

    const feed = await fetchFeedCreados();
    expect(feed.length).toBe(1);
    expect(feed[0].id).toBe(11);
    expect(feed[0].titulo).toBe("Semana de la Ingeniería");
    expect(feed[0].destacado).toBe(true);
  });

  it("fetchFeedCreados devuelve todos los manuales y eventos si ninguno está destacado", async () => {
    mockPublicFetch.mockResolvedValue(NOTICIAS);
    mockFetchEventos.mockResolvedValue([EVENTOS[0]]); // destacado: false

    const feed = await fetchFeedCreados();
    expect(feed.length).toBe(2);
    expect(feed.map((f) => f.titulo)).toContain("Noticia Manual");
    expect(feed.map((f) => f.titulo)).toContain("Torneo de Ajedrez");
  });
});
