"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/library/components/atoms/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/library/components/atoms/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/library/components/atoms/toggle-group";
import { useMediaQuery } from "@/library/hooks/use-media-query";
import { usePortfolioHistory } from "@/library/api/hooks/use-portfolio";
import { Skeleton } from "@/library/components/atoms/skeleton";

const chartConfig = {
  portfolio: {
    label: "Portfolio",
    color: "var(--chart-1)",
  },
  inflation: {
    label: "Inflation Baseline",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [timeRange, setTimeRange] = React.useState<30 | 90 | 7>(30);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange(7);
    } else {
      setTimeRange(30);
    }
  }, [isMobile]);

  const { data: portfolioHistory, isLoading } = usePortfolioHistory(timeRange);

  // Transform data to include inflation baseline
  const chartData = React.useMemo(() => {
    if (!portfolioHistory) return [];
    
    const baseValue = portfolioHistory[0]?.totalValue || 100000;
    const inflationRate = 0.068; // 6.8% annual inflation
    const dailyInflationRate = Math.pow(1 + inflationRate, 1/365) - 1;
    
    return portfolioHistory.map((snapshot, index) => {
      const inflationValue = baseValue * Math.pow(1 + dailyInflationRate, index);
      return {
        date: snapshot.snapshotDate,
        portfolio: snapshot.totalValue,
        inflation: inflationValue,
      };
    });
  }, [portfolioHistory]);

  return (
    <Card className=" @container/card">
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Portfolio value over time
          </span>
          <span className=" @[540px]/card:hidden">Value over time</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) =>
              setTimeRange(
                (value as 90 | 30 | 7) || 30,
              )
            }
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value={90}>Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value={30}>Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value={7}>Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange.toString()}
            onValueChange={(value) =>
              setTimeRange(
                parseInt(value) as 90 | 30 | 7 || 30,
              )
            }
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-portfolio)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-portfolio)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillInflation" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-inflation)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-inflation)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    name === 'portfolio' ? 'Portfolio Value' : 'Inflation Baseline'
                  ]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="inflation"
              type="natural"
              fill="url(#fillInflation)"
              stroke="var(--color-inflation)"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
            <Area
              dataKey="portfolio"
              type="natural"
              fill="url(#fillPortfolio)"
              stroke="var(--color-portfolio)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
