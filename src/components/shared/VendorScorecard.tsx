import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Vendor, Order } from "@/contexts/DataContext";

interface VendorScorecardProps {
  vendor: Vendor;
  orders: Order[];
}

interface MetricData {
  label: string;
  score: number;
  prevScore: number;
  weight: number;
}

export default function VendorScorecard({
  vendor,
  orders,
}: VendorScorecardProps) {
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>(
    {},
  );
  const randSeed = useMemo(() => vendor.id.charCodeAt(0) % 100, [vendor.id]);

  const metrics: MetricData[] = useMemo(() => {
    const totalOrders = orders.length || 1;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const onTime = orders.filter((o) => o.slaStatus === "within_sla").length;
    const breached = orders.filter((o) => o.slaStatus === "breached").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;

    const deliveryRate = Math.round((delivered / totalOrders) * 100);
    const onTimeRate = Math.round((onTime / totalOrders) * 100);
    const qualityRate = Math.round(
      Math.max(0, 100 - (cancelled / totalOrders) * 100),
    );
    const slaCompliance = Math.round(
      Math.max(0, 100 - (breached / totalOrders) * 100),
    );
    const costEfficiency = Math.round(70 + (randSeed % 25));
    const communication = Math.round(65 + ((randSeed + 5) % 30));

    return [
      {
        label: "Delivery Rate",
        score: deliveryRate,
        prevScore: Math.max(0, deliveryRate - (randSeed % 10)),
        weight: 25,
      },
      {
        label: "On-Time Performance",
        score: onTimeRate,
        prevScore: Math.max(0, onTimeRate - ((randSeed + 2) % 8)),
        weight: 25,
      },
      {
        label: "Quality Score",
        score: qualityRate,
        prevScore: Math.max(0, qualityRate - ((randSeed + 4) % 5)),
        weight: 20,
      },
      {
        label: "SLA Compliance",
        score: slaCompliance,
        prevScore: Math.max(0, slaCompliance - ((randSeed + 6) % 7)),
        weight: 15,
      },
      {
        label: "Cost Efficiency",
        score: costEfficiency,
        prevScore: Math.max(0, costEfficiency - (randSeed % 10)),
        weight: 10,
      },
      {
        label: "Communication",
        score: communication,
        prevScore: Math.max(0, communication - ((randSeed + 8) % 12)),
        weight: 5,
      },
    ];
  }, [orders, randSeed]);

  const overallScore = useMemo(() => {
    return Math.round(
      metrics.reduce((sum, m) => sum + (m.score * m.weight) / 100, 0),
    );
  }, [metrics]);

  const prevOverall = useMemo(() => {
    return Math.round(
      metrics.reduce((sum, m) => sum + (m.prevScore * m.weight) / 100, 0),
    );
  }, [metrics]);

  // Animate scores
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    metrics.forEach((m) => {
      let current = 0;
      const step = m.score / 30;
      const timer = setInterval(() => {
        current = Math.min(current + step, m.score);
        setAnimatedScores((prev) => ({
          ...prev,
          [m.label]: Math.round(current),
        }));
        if (current >= m.score) clearInterval(timer);
      }, 30);
      timers.push(timer);
    });
    return () => timers.forEach(clearInterval);
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getGrade = (score: number) => {
    if (score >= 90)
      return { grade: "A+", color: "bg-success text-success-foreground" };
    if (score >= 80)
      return { grade: "A", color: "bg-success text-success-foreground" };
    if (score >= 70)
      return { grade: "B", color: "bg-info text-info-foreground" };
    if (score >= 60)
      return { grade: "C", color: "bg-warning text-warning-foreground" };
    return { grade: "D", color: "bg-destructive text-destructive-foreground" };
  };

  const TrendIcon = ({
    current,
    previous,
  }: {
    current: number;
    previous: number;
  }) => {
    const diff = current - previous;
    if (diff > 2) return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (diff < -2)
      return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const grade = getGrade(overallScore);

  const handleExport = () => {
    const headers = ["Metric", "Score", "Previous", "Change", "Weight"];
    const rows = metrics.map((m) => [
      m.label,
      `${m.score}%`,
      `${m.prevScore}%`,
      `${m.score - m.prevScore > 0 ? "+" : ""}${m.score - m.prevScore}%`,
      `${m.weight}%`,
    ]);
    rows.push([
      "OVERALL",
      `${overallScore}%`,
      `${prevOverall}%`,
      `${overallScore - prevOverall > 0 ? "+" : ""}${overallScore - prevOverall}%`,
      "100%",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([`Vendor Scorecard: ${vendor.name}\n\n${csv}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorecard-${vendor.name.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Scorecard Exported" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Vendor Scorecard
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Score */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold ${grade.color}`}
          >
            {grade.grade}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-3xl font-bold ${getScoreColor(overallScore)}`}
              >
                {overallScore}%
              </span>
              <TrendIcon current={overallScore} previous={prevOverall} />
              <span className="text-xs text-muted-foreground">
                {overallScore - prevOverall > 0 ? "+" : ""}
                {overallScore - prevOverall}% vs last period
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Weighted composite score across {metrics.length} dimensions
            </p>
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-3">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {m.weight}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <TrendIcon current={m.score} previous={m.prevScore} />
                  <span
                    className={`font-semibold ${getScoreColor(animatedScores[m.label] || 0)}`}
                  >
                    {animatedScores[m.label] || 0}%
                  </span>
                </div>
              </div>
              <Progress value={animatedScores[m.label] || 0} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
