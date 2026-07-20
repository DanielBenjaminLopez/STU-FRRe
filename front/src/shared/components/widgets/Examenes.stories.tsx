import type { Meta, StoryObj } from "@storybook/react-vite";
import Examenes from "./Examenes";

const meta: Meta<typeof Examenes> = {
  title: "Widgets/Examenes",
  component: Examenes,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
