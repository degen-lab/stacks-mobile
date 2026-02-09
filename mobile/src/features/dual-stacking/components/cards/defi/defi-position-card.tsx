import { isValidElement, ReactElement, useEffect, useState } from "react";
import { Text } from "react-native";
import { Card } from "../shared/card";
import { CardHeader } from "../shared/card-header";
import { CardBody } from "../shared/card-body";
import { applyEmptyStateStyles } from "../shared/utils";

export interface PositionCardProps {
  title: string;
  amount: number;
  protocol: string;
  icon?: ReactElement<{ className?: string }>;
  isCollapsible?: boolean;
}

export function PositionCard({
  title,
  amount,
  protocol,
  icon,
  isCollapsible = false,
}: PositionCardProps) {
  const hasDefiPosition = amount !== 0;
  const iconWithEmptyState =
    icon && isValidElement(icon)
      ? applyEmptyStateStyles(icon, !hasDefiPosition)
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
          <Text className="font-instrument-sans text-xs font-medium text-neutral-sand-50">
            Boost your sBTC rewards by 10x by{"\n"}deploying sBTC into Stacks
            DeFi apps.
          </Text>
        }
      />
      {(!isCollapsible || !isCollapsed) && (
        <CardBody
          icon={iconWithEmptyState}
          value={`${amount.toFixed(5)} sBTC`}
          valueClassName={hasDefiPosition ? "text-primary" : "text-tertiary"}
          subtitle={hasDefiPosition ? protocol : undefined}
          layout="inline"
        />
      )}
    </Card>
  );
}
