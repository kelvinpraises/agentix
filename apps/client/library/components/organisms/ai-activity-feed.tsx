"use client";

import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Badge } from "@/library/components/atoms/badge";
import { ScrollArea } from "@/library/components/atoms/scroll-area";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { useAIActivity } from "@/library/api/hooks/use-ai-activity";
import type { AIActivity } from "@/library/api/types";

const getActivityIcon = (type: AIActivity['type']) => {
  switch (type) {
    case 'analysis':
      return Brain;
    case 'decision':
      return CheckCircle;
    case 'recommendation':
      return TrendingUp;
    case 'execution':
      return Clock;
    default:
      return AlertTriangle;
  }
};

const getActivityColor = (type: AIActivity['type']) => {
  switch (type) {
    case 'analysis':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'decision':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'recommendation':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'execution':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
};

const getConfidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-green-500 bg-green-500/10';
  if (score >= 0.6) return 'text-yellow-500 bg-yellow-500/10';
  return 'text-red-500 bg-red-500/10';
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};

const ActivityItem = ({ activity }: { activity: AIActivity }) => {
  const Icon = getActivityIcon(activity.type);
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
      <div className={`p-2 rounded-full border ${getActivityColor(activity.type)}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge variant="outline" className="capitalize text-xs">
            {activity.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground mb-2 line-clamp-2">
          {activity.message}
        </p>
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`text-xs ${getConfidenceColor(activity.confidenceScore)}`}
          >
            {Math.round(activity.confidenceScore * 100)}% confidence
          </Badge>
        </div>
      </div>
    </div>
  );
};

const LoadingItem = () => (
  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

export function AIActivityFeed() {
  const { data: activities, isLoading } = useAIActivity(8);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[min(400px,calc(100vh-500px))] px-6 pb-6">
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <LoadingItem key={i} />
              ))
            ) : activities && activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No AI activity yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}