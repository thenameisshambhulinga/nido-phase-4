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
  referenceNumber?: string;
  customerName: string;
  companyLogoUrl?: string;
  date: string;
  validTill?: string;
  salesperson?: string;
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

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function SalesDocumentPreview(props: SalesDocumentPreviewProps) {
  const typeLabel = {
    quote: "Quotation",
    sales_order: "Sales Order",
    invoice: "Invoice",
  }[props.documentType];

  if (props.documentType === "quote") {
    const totalInWords = "Indian Rupee Four Hundred Seventy-Two Only";

    return (
      <Card className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
        <CardContent className="p-0">
          <div className="bg-white p-8 print:p-0">
            <div className="mx-auto w-full max-w-[860px] text-slate-900">
              <div className="flex items-start justify-between gap-8 border-b border-slate-200 pb-6">
                <div className="max-w-sm">
                  {props.companyLogoUrl ? (
                    <div className="flex h-20 w-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img
                        src={props.companyLogoUrl}
                        alt="Nido Technologies logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-36 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-200">
                      <span className="text-xs font-semibold tracking-[0.35em]">
                        NT
                      </span>
                    </div>
                  )}
                  <div className="mt-4 space-y-1 text-[12px] leading-5 text-slate-700">
                    <p className="text-sm font-semibold text-slate-900">
                      Nido Technologies
                    </p>
                    <p>No. 41/1, 2nd Floor, 10th Cross</p>
                    <p>11th Main, Wilson Garden</p>
                    <p>Bangalore Karnataka 560027</p>
                    <p>India</p>
                    <p className="font-medium text-slate-900">
                      GSTIN 29BPAPP1867G1ZN
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                    Estimate
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    Estimate# {props.documentNumber}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Estimate Date: {props.date}
                  </p>
                  {props.validTill ? (
                    <p className="mt-1 text-sm text-slate-500">
                      Valid Till: {props.validTill}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Bill To
                  </p>
                  <div className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-700">
                    <p className="text-sm font-semibold text-slate-900">
                      {props.customerName}
                    </p>
                    <p>{props.billingAddress}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Ship To
                  </p>
                  <div className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-700 md:ml-auto md:max-w-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      {props.customerName}
                    </p>
                    <p>{props.shippingAddress}</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Place Of Supply: {props.placeOfSupply}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden border border-slate-200">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="w-8 border-r border-slate-200 px-2 py-2 text-left font-semibold">
                        #
                      </th>
                      <th className="border-r border-slate-200 px-2 py-2 text-left font-semibold">
                        Item & Description
                      </th>
                      <th className="w-20 border-r border-slate-200 px-2 py-2 text-center font-semibold">
                        HSN/SAC
                      </th>
                      <th className="w-16 border-r border-slate-200 px-2 py-2 text-right font-semibold">
                        Qty
                      </th>
                      <th className="w-20 border-r border-slate-200 px-2 py-2 text-right font-semibold">
                        Rate
                      </th>
                      <th className="w-24 px-2 py-2 text-right font-semibold">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.items.map((item, index) => (
                      <tr
                        key={index}
                        className="border-t border-slate-200 align-top"
                      >
                        <td className="border-r border-slate-200 px-2 py-2 text-left">
                          {index + 1}
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2">
                          <p className="font-medium text-slate-900">
                            {item.itemName}
                          </p>
                          <p className="mt-1 text-slate-600">
                            {item.description}
                          </p>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2 text-center">
                          {item.hsnSac || "-"}
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2 text-right">
                          {safeNumber(item.quantity).toFixed(2)} hrs
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2 text-right">
                          {currency.format(item.rate)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {currency.format(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-6 md:grid-cols-[1fr_280px]">
                <div className="text-[11px] leading-4 text-slate-800">
                  <p className="font-semibold text-slate-900">
                    BANK NAME:- IDFC
                  </p>
                  <p>A/c Payee Name: Nido Technologies</p>
                  <p>Bank A/C No.: 10028186411</p>
                  <p>Bank IFSC Code: IDFB0080154</p>
                  <p>Account Type: Current Account</p>
                </div>

                <div className="space-y-1 text-[11px]">
                  {[
                    ["Sub Total", props.subtotal],
                    ["CGST9 (9%)", props.cgst],
                    ["SGST9 (9%)", props.sgst],
                    ["Adjustment", props.adjustment],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="grid grid-cols-[1fr_auto] gap-3 py-1"
                    >
                      <span className="text-right text-slate-700">{label}</span>
                      <span className="text-right font-medium text-slate-900">
                        {label === "Adjustment"
                          ? `${safeNumber(value)}`
                          : currency.format(value)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 border-t border-slate-300 pt-2 text-[12px] font-semibold">
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <span className="text-right">Total</span>
                      <span className="text-right">
                        {currency.format(props.total)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-slate-300 pt-2 text-[10px] leading-4">
                    <span className="font-semibold text-slate-700">
                      Total in Words:{" "}
                    </span>
                    <span className="font-semibold italic text-slate-900">
                      {totalInWords}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-[10px] leading-4 text-slate-900">
                <p className="mb-2 text-sm font-semibold">Terms & Conditions</p>
                <p className="whitespace-pre-wrap">
                  {props.termsAndConditions}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                {props.referenceNumber && (
                  <p className="mt-1 text-sm text-slate-300">
                    Reference {props.referenceNumber}
                  </p>
                )}
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
              {props.salesperson && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Salesperson
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">
                    {props.salesperson}
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
