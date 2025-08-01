"use client";

import { Play, Pause, Settings, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Badge } from "@/library/components/atoms/badge";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { useTradingStatus, useTradeMutations } from "@/library/api/hooks/use-trades";

export function TradingControls() {
  const { data: status, isLoading } = useTradingStatus();
  const { pauseTrading, resumeTrading, isPausing, isResuming } = useTradeMutations();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const handleToggleTrading = () => {
    if (status.isActive) {
      pauseTrading("Manual pause by user");
    } else {
      resumeTrading();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Trading Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge 
              variant={status.isActive ? "default" : "secondary"}
              className={status.isActive ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
            >
              {status.isActive ? "Active" : "Paused"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {status.isActive ? "AI trading is running" : "AI trading is paused"}
            </span>
          </div>
          
          <Button
            onClick={handleToggleTrading}
            disabled={isPausing || isResuming}
            variant={status.isActive ? "outline" : "default"}
            size="sm"
            className="flex items-center gap-2"
          >
            {isPausing || isResuming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : status.isActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPausing ? "Pausing..." : isResuming ? "Resuming..." : status.isActive ? "Pause Trading" : "Resume Trading"}
          </Button>
        </div>

        {status.pausedAt && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                Trading paused since {new Date(status.pausedAt).toLocaleString()}
              </p>
              {status.pauseReason && (
                <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                  Reason: {status.pauseReason}
                </p>
              )}
              {status.nextResumeAt && (
                <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                  Scheduled to resume: {new Date(status.nextResumeAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            When paused, the AI will stop making new trading decisions but existing trades will continue to execute.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}