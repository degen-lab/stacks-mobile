import { isValidElement, ReactElement, useEffect, useState } from "react";
import { applyEmptyStateStyles } from "../shared/utils";
import { Status } from "@/features/dual-stacking/types/status";
import { Card } from "../shared/card";
import { CardHeader } from "../shared/card-header";
import { CardBody } from "../shared/card-body";
// import { scrollToAndHighlight } from '@/lib/ui/utils';

export interface BalanceCardProps {
  title: string;
  balance: number;
  currency: string;
  icon: ReactElement<{ className?: string; isEmpty?: boolean }>;
  status?: Status;
  isCollapsible?: boolean;
}

export function BalanceCard({
  title,
  balance,
  currency,
  icon,
  status,
  isCollapsible = false,
}: BalanceCardProps) {
  const hasBalance = balance !== 0;
  const iconWithEmptyState =
    icon && isValidElement(icon)
      ? applyEmptyStateStyles(icon, !hasBalance)
      : icon;
  // TODO: Add scroll to and highlight
  //   const highlightSection = hasBalance ? 'enroll-button' : 'get-sbtc-button';
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    setIsCollapsed(isCollapsible);
  }, [isCollapsible]);

  const handleBadgeClick = () => {
    if (status === Status.NotEnrolled) {
      //   scrollToAndHighlight(highlightSection, {
      //     isOrange: true,
      //     padding: 1.5,
      //     headerOffset: 50,
      //     visibleMs: 2000,
      //   });
    }
  };
  return (
    <Card>
      <CardHeader
        title={title}
        status={status}
        onBadgeClick={handleBadgeClick}
        isCollapsible={isCollapsible}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
      {(!isCollapsible || !isCollapsed) && (
        <CardBody
          icon={iconWithEmptyState}
          value={`${balance.toFixed(8)} ${currency}`}
          valueClassName={`${hasBalance ? "text-primary" : "text-tertiary"}`}
          layout="after-value"
        />
      )}
    </Card>
  );
}
