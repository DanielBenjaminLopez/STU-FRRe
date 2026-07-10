import type { Meta, StoryObj } from "@storybook/react-vite";
import Horarios from "./Horarios";

const meta: Meta<typeof Horarios> = {
  title: "Widgets/Horarios",
  component: Horarios,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
