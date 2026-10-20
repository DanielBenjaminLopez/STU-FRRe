import type { ComponentType } from "react";

export type WidgetType = string;

export interface WidgetComponentProps {
  colSpan?: number;
  rowSpan?: number;
}

export interface WidgetSizeVariant {
  colSpan: number;
  rowSpan: number;
  label?: string;
}

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  component: ComponentType<WidgetComponentProps>;
  preview?: ComponentType;
  colSpan: number;
  rowSpan: number;
  variants?: WidgetSizeVariant[];
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
