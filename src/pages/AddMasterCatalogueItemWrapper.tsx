import React from "react";
import { Navigate } from "react-router-dom";
import AddMasterCatalogueItemPage from "@/pages/AddMasterCatalogueItemPage";

export default function AddMasterCatalogueItemWrapper() {
  // In case route is mounted under a different base segment in future,
  // keep navigation stable.
  return <AddMasterCatalogueItemPage />;
}
