import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NotificationsPage() {
  const { notificationRules, updateNotificationRule } = useData();
  const { isOwner } = useAuth();

  const toggleChannel = (id: string, channel: "emailEnabled" | "smsEnabled" | "inAppEnabled") => {
    const rule = notificationRules.find(r => r.id === id);
    if (!rule) return;
    updateNotificationRule(id, { [channel]: !rule[channel] });
    toast({ title: "Notification Updated" });
  };

  return (
    <div>
      <Header title="Notifications" />
      <div className="p-6 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">Notification Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Email Notifications", icon: Mail, enabled: true, desc: "Send email notifications" },
            { title: "SMS Notifications", icon: Smartphone, enabled: false, desc: "Send SMS alerts" },
            { title: "In-App Notifications", icon: Bell, enabled: true, desc: "Show in-app notifications" },
          ].map(ch => (
            <Card key={ch.title}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><ch.icon className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-sm font-medium">{ch.title}</p><p className="text-xs text-muted-foreground">{ch.desc}</p></div>
                </div>
                <Switch defaultChecked={ch.enabled} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notification Rules</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">SMS</TableHead>
                  <TableHead className="text-center">In-App</TableHead>
                  <TableHead>Recipients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationRules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-sm">{rule.event}</TableCell>
                    <TableCell className="text-center"><Switch checked={rule.emailEnabled} onCheckedChange={() => toggleChannel(rule.id, "emailEnabled")} disabled={!isOwner} /></TableCell>
                    <TableCell className="text-center"><Switch checked={rule.smsEnabled} onCheckedChange={() => toggleChannel(rule.id, "smsEnabled")} disabled={!isOwner} /></TableCell>
                    <TableCell className="text-center"><Switch checked={rule.inAppEnabled} onCheckedChange={() => toggleChannel(rule.id, "inAppEnabled")} disabled={!isOwner} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {rule.recipients.map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Reminder & Escalation Pacing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {["First Reminder", "Second Reminder", "Escalation"].map((label, i) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-sm font-medium w-36">{label}</span>
                <Input type="number" defaultValue={[24, 48, 72][i]} className="w-24" />
                <span className="text-sm text-muted-foreground">hours after trigger</span>
              </div>
            ))}
            <Button onClick={() => toast({ title: "Settings Saved" })} disabled={!isOwner}>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
