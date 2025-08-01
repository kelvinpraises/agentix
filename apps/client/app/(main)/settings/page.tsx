"use client";

import { useState } from "react";
import { useAuth } from "@/library/api/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { Input } from "@/library/components/atoms/input";
import { Label } from "@/library/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { Switch } from "@/library/components/atoms/switch";
import { Separator } from "@/library/components/atoms/separator";
import { Badge } from "@/library/components/atoms/badge";
import { Skeleton } from "@/library/components/atoms/skeleton";
import {
  User,
  Wallet,
  Palette,
  Bell,
  Shield,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Globe,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications] = useState({
    trades: true,
    portfolio: true,
    security: true,
    marketing: false,
  });

  const [userSettings, setUserSettings] = useState({
    email: user?.email || "",
    walletAddressEth: user?.walletAddressEth || "",
    walletAddressSol: user?.walletAddressSol || "",
    language: "en",
    timezone: "UTC",
    currency: "USD",
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 border-blue-500/20"
        >
          {user?.email}
        </Badge>
      </div>

      {/* Account Settings - Primary */}
      <AccountSettingsSection
        userSettings={userSettings}
        setUserSettings={setUserSettings}
      />

      {/* Wallet Management - Primary */}
      <WalletManagementSection
        userSettings={userSettings}
        setUserSettings={setUserSettings}
      />

      {/* Theme & Preferences - Secondary */}
      <ThemePreferencesSection
        theme={theme}
        setTheme={setTheme}
        userSettings={userSettings}
        setUserSettings={setUserSettings}
      />

      {/* Notifications - Secondary */}
      <NotificationsSection
        notifications={notifications}
        setNotifications={setNotifications}
      />

      {/* Security Settings - Tertiary */}
      <SecuritySettingsSection showApiKey={showApiKey} setShowApiKey={setShowApiKey} />
    </div>
  );
}

function AccountSettingsSection({
  userSettings,
  setUserSettings,
}: {
  userSettings: any;
  setUserSettings: (settings: any) => void;
}) {
  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-500" />
          Account Settings
          <Badge variant="secondary" className="text-xs">
            Primary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your basic account information and preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userSettings.email}
              onChange={(e) =>
                setUserSettings({
                  ...userSettings,
                  email: e.target.value,
                })
              }
              placeholder="your@email.com"
            />
            <p className="text-xs text-muted-foreground">
              Used for login and important notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={userSettings.language}
              onValueChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  language: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={userSettings.timezone}
              onValueChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  timezone: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Display Currency</Label>
            <Select
              value={userSettings.currency}
              onValueChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  currency: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button>Save Account Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}
function WalletManagementSection({
  userSettings,
  setUserSettings,
}: {
  userSettings: any;
  setUserSettings: (settings: any) => void;
}) {
  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-green-500" />
          Wallet Management
          <Badge variant="secondary" className="text-xs">
            Primary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your crypto wallet addresses for trading
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eth-wallet">Ethereum Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="eth-wallet"
                value={userSettings.walletAddressEth}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    walletAddressEth: e.target.value,
                  })
                }
                placeholder="0x..."
                className="font-mono text-sm"
              />
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Ethereum wallet for ERC-20 token trading
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sol-wallet">Solana Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="sol-wallet"
                value={userSettings.walletAddressSol}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    walletAddressSol: e.target.value,
                  })
                }
                placeholder="Base58 address..."
                className="font-mono text-sm"
              />
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Solana wallet for SPL token trading
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Security Notice
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Your private keys are never stored on our servers. We only use wallet
                addresses for transaction routing.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Wallet Connection Status</h4>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Connected and verified</span>
            </div>
          </div>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function ThemePreferencesSection({
  theme,
  setTheme,
  userSettings,
  setUserSettings,
}: {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  userSettings: any;
  setUserSettings: (settings: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          Theme & Preferences
          <Badge variant="outline" className="text-xs">
            Secondary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize your visual experience and interface preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="MM/DD/YYYY">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number Format</Label>
              <Select defaultValue="1,234.56">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,234.56">1,234.56</SelectItem>
                  <SelectItem value="1.234,56">1.234,56</SelectItem>
                  <SelectItem value="1 234.56">1 234.56</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">
                Reduce spacing and padding for a more compact interface
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Animations</Label>
              <p className="text-xs text-muted-foreground">
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function NotificationsSection({
  notifications,
  setNotifications,
}: {
  notifications: any;
  setNotifications: (notifications: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Notifications
          <Badge variant="outline" className="text-xs">
            Secondary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control what notifications you receive and how
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Trade Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when trades are executed or require approval
              </p>
            </div>
            <Switch
              checked={notifications.trades}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  trades: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Portfolio Updates</Label>
              <p className="text-xs text-muted-foreground">
                Daily portfolio performance and milestone notifications
              </p>
            </div>
            <Switch
              checked={notifications.portfolio}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  portfolio: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Security Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Important security notifications and login alerts
              </p>
            </div>
            <Switch
              checked={notifications.security}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  security: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Marketing Communications</Label>
              <p className="text-xs text-muted-foreground">
                Product updates, tips, and promotional content
              </p>
            </div>
            <Switch
              checked={notifications.marketing}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  marketing: checked,
                })
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-muted-foreground">
                  Receive notifications via email
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Push Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Browser push notifications
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function SecuritySettingsSection({
  showApiKey,
  setShowApiKey,
}: {
  showApiKey: boolean;
  setShowApiKey: (show: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          Security Settings
          <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600">
            Tertiary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Advanced security configuration and API access
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? "text" : "password"}
                value="sk-1234567890abcdef1234567890abcdef"
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this API key to integrate with external applications
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Key className="h-4 w-4 mr-2" />
              Setup 2FA
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Login Sessions</Label>
              <p className="text-xs text-muted-foreground">
                Manage active sessions and devices
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              View Sessions
            </Button>
          </div>
        </div>

        <Separator />

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Danger Zone
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                These actions are irreversible. Please proceed with caution.
              </p>
              <div className="mt-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Reset API Key
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 ml-2"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
