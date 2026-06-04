import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function ScoreCircle({ score, size = "md", label, className }: ScoreCircleProps) {
  // Determine color based on score
  let colorClass = "text-emerald-500";
  if (score < 50) colorClass = "text-destructive";
  else if (score < 75) colorClass = "text-amber-500";

  // Dimensions
  const dimensions = {
    sm: { size: 64, strokeWidth: 6, fontSize: "text-lg" },
    md: { size: 100, strokeWidth: 8, fontSize: "text-2xl" },
    lg: { size: 140, strokeWidth: 12, fontSize: "text-4xl" },
  };

  const { size: svgSize, strokeWidth, fontSize } = dimensions[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        {/* Background circle */}
        <svg className="absolute transform -rotate-90" width={svgSize} height={svgSize}>
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted"
          />
          {/* Foreground circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-1000 ease-in-out", colorClass)}
            strokeLinecap="round"
          />
        </svg>
        <span className={cn("font-bold absolute", fontSize)}>{Math.round(score)}</span>
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
