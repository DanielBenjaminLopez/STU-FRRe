import type { Meta, StoryObj } from "@storybook/react-vite";
import Encabezado from "./Encabezado";

const meta: Meta<typeof Encabezado> = {
  title: "Widgets/Encabezado",
  component: Encabezado,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
