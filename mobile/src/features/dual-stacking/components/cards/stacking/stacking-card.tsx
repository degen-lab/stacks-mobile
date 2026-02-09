import { ReactElement, isValidElement, useEffect, useState } from "react";
import { Card } from "../shared/card";
import { CardHeader } from "../shared/card-header";
import { CardBody } from "../shared/card-body";
import { applyEmptyStateStyles, formatNumberToEnUs } from "../shared/utils";

export interface StackingCardProps {
  title: string;
  stxStacked: number;
  stxBalance: number;
  icon: ReactElement<{ className?: string }>;
  isCollapsible?: boolean;
}

export function StackingCard({
  title,
  stxStacked,
  stxBalance,
  icon,
  isCollapsible = false,
}: StackingCardProps) {
  const hasStacked = stxStacked > 0;
  const iconWithEmptyState =
    icon && isValidElement(icon)
      ? applyEmptyStateStyles(icon, !hasStacked)
      : icon;
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    setIsCollapsed(isCollapsible);
  }, [isCollapsible]);

  return (
    <Card>
      <CardHeader
        title={title}
        isCollapsible={isCollapsible}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        showTooltip
        tooltipContent={
          <>Boost your sBTC rewards by up to 10x by stacking STX.</>
        }
      />
      {(!isCollapsible || !isCollapsed) && (
        <CardBody
          icon={iconWithEmptyState}
          value={`${formatNumberToEnUs(stxStacked)} STX`}
          valueClassName={hasStacked ? "text-primary" : "text-tertiary"}
          subtitle={`/ ${formatNumberToEnUs(stxBalance)} STX total balance`}
          layout="stacked"
        />
      )}
    </Card>
  );
}
