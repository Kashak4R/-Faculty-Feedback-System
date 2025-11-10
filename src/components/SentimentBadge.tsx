import { Badge } from "@/components/ui/badge";
import { getSentimentColor } from "@/lib/sentiment";

interface SentimentBadgeProps {
  sentiment: string;
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const colorClass = getSentimentColor(sentiment);
  
  return (
    <Badge 
      className={`
        ${colorClass === 'success' ? 'bg-success text-success-foreground' : ''}
        ${colorClass === 'destructive' ? 'bg-destructive text-destructive-foreground' : ''}
        ${colorClass === 'neutral' ? 'bg-neutral text-neutral-foreground' : ''}
      `}
    >
      {sentiment}
    </Badge>
  );
}
