import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SalesLineItemPreview {
  itemName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

interface SalesDocumentPreviewProps {
  documentType: "quote" | "sales_order" | "invoice";
  documentNumber: string;
  customerName: string;
  date: string;
  validTill?: string;
  items: SalesLineItemPreview[];
  subtotal: number;
  cgst: number;
  sgst: number;
  adjustment: number;
  total: number;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  bankDetails: string;
  termsAndConditions: string;
  customerNotes: string;
}

export default function SalesDocumentPreview(props: SalesDocumentPreviewProps) {
  const typeLabel = {
    quote: "Quotation",
    sales_order: "Sales Order",
    invoice: "Invoice",
  }[props.documentType];

  return (
    <Card className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <CardContent className="p-0">
        <div
          className="space-y-6 bg-white p-8 print:p-0"
          style={{ pageBreakAfter: "avoid" }}
        >
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                  Nido Tech
                </p>
                <h1 className="mt-2 text-3xl font-semibold">CorpEssentials</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  Premium commercial document preview for{" "}
                  {typeLabel.toLowerCase()}s, designed for quick review and
                  clean export.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                  {typeLabel}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {props.documentNumber}
                </p>
                <p className="mt-1 text-sm text-slate-300">{props.date}</p>
                {props.validTill && (
                  <p className="mt-1 text-sm text-slate-300">
                    Valid till {props.validTill}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Bill To
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {props.customerName}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {props.billingAddress}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Ship To
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {props.customerName}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 md:ml-auto md:max-w-sm">
                {props.shippingAddress}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  Place of Supply:
                </span>{" "}
                {props.placeOfSupply}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-3 text-left font-semibold">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    HSN/SAC
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Rate</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Tax %</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {props.items.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.itemName}
                    </td>
                    <td className="px-4 py-3 text-xs leading-5 text-slate-600">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {item.hsnSac}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.rate.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.discount}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {item.taxRate}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {[
                ["Subtotal", props.subtotal],
                ["CGST (9%)", props.cgst],
                ["SGST (9%)", props.sgst],
                ["Adjustment", props.adjustment],
              ].map(([label, value], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"
                >
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-900">
                    {(value as number).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                <span>Total</span>
                <span>{props.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {(props.customerNotes ||
            props.termsAndConditions ||
            props.bankDetails) && (
            <div className="grid gap-4 border-t border-slate-200 pt-4 text-sm md:grid-cols-3">
              {props.customerNotes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">
                    {props.customerNotes}
                  </p>
                </div>
              )}
              {props.termsAndConditions && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Terms & Conditions
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">
                    {props.termsAndConditions}
                  </p>
                </div>
              )}
              {props.bankDetails && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Bank Details
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">
                    {props.bankDetails}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200 print:block hidden">
            <p>
              This document was generated electronically and does not require
              signature.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
