import type { ComponentType } from "react";

export type WidgetType = string;

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  component: ComponentType;
  preview?: ComponentType;
  colSpan: number;
  rowSpan: number;
  color?: string;
}

export interface WidgetPlacement {
  id: string;
  type: WidgetType;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export const GRID_COLS = 4;
export const GRID_ROWS = 6;
