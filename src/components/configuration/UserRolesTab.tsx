import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NidoRolesPanel from "@/components/configuration/NidoRolesPanel";
import ManageUsersPanel from "@/components/configuration/ManageUsersPanel";
import { ArrowLeft } from "lucide-react";

export default function UserRolesTab() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("roles");

  return (
    <div>
      <Header title="Configuration" />
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate("/configuration")}
          >
            <ArrowLeft size={14} /> Back to Configuration
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground">Nido-Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage roles and platform users
          </p>
        </div>

        <Tabs value={activePanel} onValueChange={setActivePanel}>
          <TabsList className="bg-muted h-auto p-1 gap-1">
            <TabsTrigger value="roles" className="text-sm">
              Roles
            </TabsTrigger>
            <TabsTrigger value="users" className="text-sm">
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-4">
            <NidoRolesPanel />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <ManageUsersPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
