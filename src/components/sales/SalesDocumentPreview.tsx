import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="print:hidden"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div
          className="space-y-6 p-8 bg-white print:p-0"
          style={{ pageBreakAfter: "avoid" }}
        >
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nido Tech</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  CorpEssentials
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-700">
                  {typeLabel}
                </h2>
                <p className="text-sm text-gray-500">{props.documentNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Document Date</p>
                <p className="text-gray-900">{props.date}</p>
              </div>
              {props.validTill && (
                <div>
                  <p className="text-gray-500 font-medium">Valid Till</p>
                  <p className="text-gray-900">{props.validTill}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">
                Bill To
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {props.customerName}
              </p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap mt-1">
                {props.billingAddress}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">
                Ship To
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {props.customerName}
              </p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap mt-1">
                {props.shippingAddress}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Place of Supply:</strong> {props.placeOfSupply}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  <th className="px-3 py-2 text-left text-gray-700 font-semibold">
                    Item Name
                  </th>
                  <th className="px-3 py-2 text-left text-gray-700 font-semibold">
                    Description
                  </th>
                  <th className="px-3 py-2 text-center text-gray-700 font-semibold">
                    HSN/SAC
                  </th>
                  <th className="px-3 py-2 text-right text-gray-700 font-semibold">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right text-gray-700 font-semibold">
                    Rate
                  </th>
                  <th className="px-3 py-2 text-right text-gray-700 font-semibold">
                    Discount
                  </th>
                  <th className="px-3 py-2 text-right text-gray-700 font-semibold">
                    Tax %
                  </th>
                  <th className="px-3 py-2 text-right text-gray-700 font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((item, idx) => (
                  <tr key={idx} className="border border-gray-300">
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {item.itemName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 text-xs">
                      {item.description}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">
                      {item.hsnSac}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {item.rate.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {item.discount}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {item.taxRate}%
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900 font-medium">
                      {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              {[
                ["Subtotal", props.subtotal],
                ["CGST (9%)", props.cgst],
                ["SGST (9%)", props.sgst],
                ["Adjustment", props.adjustment],
              ].map(([label, value], idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm px-3 py-1 border border-gray-300"
                >
                  <span className="text-gray-700">{label}</span>
                  <span className="text-gray-900 font-medium">
                    {(value as number).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold px-3 py-2 bg-gray-100 border-2 border-gray-400">
                <span className="text-gray-900">TOTAL</span>
                <span className="text-gray-900">
                  {props.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          {(props.customerNotes || props.termsAndConditions) && (
            <div className="border-t pt-4 text-xs text-gray-700 space-y-2">
              {props.customerNotes && (
                <div>
                  <p className="font-semibold text-gray-700">Notes</p>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {props.customerNotes}
                  </p>
                </div>
              )}
              {props.termsAndConditions && (
                <div>
                  <p className="font-semibold text-gray-700">
                    Terms & Conditions
                  </p>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {props.termsAndConditions}
                  </p>
                </div>
              )}
              {props.bankDetails && (
                <div>
                  <p className="font-semibold text-gray-700">Bank Details</p>
                  <p className="text-gray-600">{props.bankDetails}</p>
                </div>
              )}
            </div>
          )}

          {/* Print Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t mt-6 print:block hidden">
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
