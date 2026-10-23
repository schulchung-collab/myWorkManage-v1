import {
  Box,
  DraftingCompass,
  FileText,
  ListChecks,
  Network,
  Presentation,
  type LucideProps,
} from "lucide-react";
import type { AppIconName } from "@/lib/apps";

const ICONS = {
  tasks: ListChecks,
  model3d: Box,
  cad2d: DraftingCompass,
  fem: Network,
  pdf: FileText,
  ppt: Presentation,
} satisfies Record<AppIconName, React.ComponentType<LucideProps>>;

export function AppIcon({ name, ...props }: { name: AppIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
