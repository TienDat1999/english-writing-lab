import { DraftwiseBrand } from "@draftwise/ui";

export function AppBrand({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return <DraftwiseBrand className={className} inverted={inverted} />;
}
