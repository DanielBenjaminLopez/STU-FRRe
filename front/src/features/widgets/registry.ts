import type { ComponentType } from "react";
import { Calendario } from "../calendario";
import { Examenes } from "../examenes";
import { Horarios } from "../horarios";
import { Mapa } from "../mapa";
import { Noticias, Novedades } from "../noticias";
import type { WidgetDefinition, WidgetType } from "./types";

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  horarios: {
    type: "horarios",
    label: "Horarios",
    component: Horarios,
    colSpan: 4,
    rowSpan: 2,
    color: "from-gray-100 to-gray-200",
  },
  examenes: {
    type: "examenes",
    label: "Exámenes",
    component: Examenes,
    colSpan: 4,
    rowSpan: 2,
    color: "from-green-100 to-green-200",
  },
  calendario: {
    type: "calendario",
    label: "Calendario",
    component: Calendario,
    colSpan: 2,
    rowSpan: 2,
    color: "from-blue-100 to-blue-200",
  },
  mapa: {
    type: "mapa",
    label: "Mapa",
    component: Mapa,
    colSpan: 2,
    rowSpan: 2,
    color: "from-orange-100 to-orange-200",
  },
  noticias: {
    type: "noticias",
    label: "Noticias",
    component: Noticias,
    colSpan: 4,
    rowSpan: 2,
    color: "from-purple-100 to-purple-200",
  },
  novedades: {
    type: "novedades",
    label: "Eventos",
    component: Novedades,
    colSpan: 4,
    rowSpan: 2,
    color: "from-amber-100 to-amber-200",
  },
};

export const WIDGET_COMPONENTS: Record<WidgetType, ComponentType> =
  Object.fromEntries(
    Object.entries(WIDGET_REGISTRY).map(([type, definition]) => [
      type,
      definition.component,
    ]),
  );
