"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm, RegisterForm } from "@/library/components/organisms/auth-forms";
import { Button } from "@/library/components/atoms/button";
import { Card, CardContent } from "@/library/components/atoms/card";
import { Badge } from "@/library/components/atoms/badge";
import { useAuth } from "@/library/api/hooks/use-auth";
import { ChevronDown, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const scrollToLanding = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  const scrollToAuth = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Auth Section - First 100vh */}
      <section className="h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToLanding}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm mb-2">Learn more</span>
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>

      {/* Landing Section - Second 100vh */}
      <section className="min-h-screen bg-gradient-to-br from-background to-muted/20 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              AI-Powered Trading Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Beat Inflation While You Sleep
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your savings account earns 0.5% while inflation runs at 7%. 
              Agentix uses AI-powered crypto trading to automatically beat inflation.
            </p>
            <Button 
              size="lg" 
              onClick={scrollToAuth}
              className="text-lg px-8 py-6"
            >
              Start Trading Now
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Driven Strategy</h3>
                <p className="text-muted-foreground text-sm">
                  Advanced algorithms analyze market conditions 24/7 to maximize returns
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
                <p className="text-muted-foreground text-sm">
                  Built-in stop-loss and take-profit protection on every trade
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Automated Trading</h3>
                <p className="text-muted-foreground text-sm">
                  Set your preferences once, then let AI handle the rest
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Transparent Results</h3>
                <p className="text-muted-foreground text-sm">
                  Track every decision and see exactly how AI beats inflation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-8">How Agentix Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold">Set Your Preferences</h3>
                <p className="text-muted-foreground">
                  Define your risk tolerance, investment goals, and trading parameters
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold">AI Takes Control</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes markets, identifies opportunities, and executes trades automatically
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold">Beat Inflation</h3>
                <p className="text-muted-foreground">
                  Watch your portfolio grow faster than inflation while you focus on life
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who are already beating inflation with AI
            </p>
            <Button 
              size="lg" 
              onClick={scrollToAuth}
              className="text-lg px-8 py-6"
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}