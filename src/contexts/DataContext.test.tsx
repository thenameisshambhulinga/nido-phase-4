import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DataProvider, useData } from "@/contexts/DataContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DataProvider>{children}</DataProvider>
);

const NIDO_STORAGE_KEYS = [
  "nido_orders",
  "nido_vendors",
  "nido_clients",
  "nido_locations",
  "nido_audit",
  "nido_order_statuses",
  "nido_workflows",
  "nido_vendor_categories",
  "nido_notification_rules",
  "nido_roles",
  "nido_organizations",
  "nido_general_settings",
  "nido_user_roles",
  "nido_app_users",
  "nido_master_catalog",
  "nido_client_catalog",
  "nido_pricing_rules",
  "nido_discount_rules",
  "nido_tax_settings",
];

describe("DataContext production flows", () => {
  beforeEach(() => {
    NIDO_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  });

  it("bulk updates only selected client orders", () => {
    const { result } = renderHook(() => useData(), { wrapper });

    const before = result.current.orders.map((order) => ({
      id: order.id,
      status: order.status,
      comments: order.comments,
    }));

    act(() => {
      result.current.bulkUpdateOrders(["ord-1", "ord-2"], {
        status: "Completed",
        comments: "Bulk closure for client profile",
      });
    });

    const ord1 = result.current.orders.find((order) => order.id === "ord-1");
    const ord2 = result.current.orders.find((order) => order.id === "ord-2");
    const ord3 = result.current.orders.find((order) => order.id === "ord-3");
    const ord3Before = before.find((order) => order.id === "ord-3");

    expect(ord1?.status).toBe("Completed");
    expect(ord2?.status).toBe("Completed");
    expect(ord1?.comments).toBe("Bulk closure for client profile");
    expect(ord2?.comments).toBe("Bulk closure for client profile");

    expect(ord3?.status).toBe(ord3Before?.status);
    expect(ord3?.comments).toBe(ord3Before?.comments);
  });

  it("computes pricing -> discount -> tax in order", () => {
    const { result } = renderHook(() => useData(), { wrapper });

    const computed = result.current.computeOrderPricing({
      amount: 100000,
      quantity: 10,
      category: "IT Hardware",
      orderDate: "2026-04-02",
    });

    expect(computed.baseAmount).toBe(100000);
    expect(computed.adjustedAmount).toBe(95000);
    expect(computed.discountedAmount).toBe(92150);
    expect(computed.taxedAmount).toBe(108737);
    expect(computed.total).toBe(108737);
  });

  it("upserts a single active primary tax setting", () => {
    const { result } = renderHook(() => useData(), { wrapper });

    act(() => {
      result.current.upsertPrimaryTaxSetting({
        taxType: "GST",
        taxRate: 12,
        taxRegistrationNo: "27AAAAA0000A1Z5",
        active: true,
      });
    });

    const activeSettings = result.current.taxSettings.filter(
      (setting) => setting.active,
    );

    expect(activeSettings).toHaveLength(1);
    expect(activeSettings[0].taxRate).toBe(12);
    expect(activeSettings[0].taxRegistrationNo).toBe("27AAAAA0000A1Z5");
  });
});
