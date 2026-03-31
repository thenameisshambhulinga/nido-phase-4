import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NidoRolesPanel from "@/components/configuration/NidoRolesPanel";
import ManageUsersPanel from "@/components/configuration/ManageUsersPanel";

export default function UserRolesTab() {
  const [activePanel, setActivePanel] = useState("roles");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Nido-Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage roles and platform users
        </p>
      </div>

      <Tabs value={activePanel} onValueChange={setActivePanel}>
        <TabsList className="bg-muted h-auto p-1 gap-1">
          <TabsTrigger value="roles" className="text-sm">
            User Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="text-sm">
            Add / Manage Users
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
  );
}
