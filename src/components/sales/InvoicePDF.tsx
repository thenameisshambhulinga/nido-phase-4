import type { Invoice } from "@/contexts/DataContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: unknown) => currency.format(safeNumber(value));

const parseBankDetails = (bankDetails: string) => {
  const lines = bankDetails
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const findValue = (pattern: RegExp) => {
    const match = lines.find((line) => pattern.test(line));
    if (!match) return "";
    const parts = match.split(":");
    return parts.length > 1 ? parts.slice(1).join(":").trim() : match.trim();
  };
  return {
    bankName: findValue(/bank\s*name/i) || lines[0] || "Not provided",
    accountNumber:
      findValue(/account\s*(number|no|#)/i) ||
      lines.find((line) => /\d{8,}/.test(line)) ||
      "Not provided",
    ifsc: findValue(/ifsc/i) || "Not provided",
    raw: lines,
  };
};

export default function InvoicePDF({
  invoice,
  companyLogoUrl,
}: {
  invoice: Invoice;
  companyLogoUrl?: string;
}) {
  const invoiceSubtotal = safeNumber(invoice.subtotal);
  const invoiceCgst = safeNumber(invoice.cgst);
  const invoiceSgst = safeNumber(invoice.sgst);
  const invoiceShipping = safeNumber(invoice.shippingCharges);
  const invoiceTotal = safeNumber(
    invoice.total,
    invoiceSubtotal + invoiceCgst + invoiceSgst + invoiceShipping,
  );
  const invoiceBalanceDue = safeNumber(
    invoice.balanceDue,
    Math.max(0, invoiceTotal - safeNumber(invoice.amountPaid)),
  );
  const bankDetails = parseBankDetails(invoice.bankDetails || "");

  return (
    <div
      id="print-area"
      className="mx-auto w-[794px] bg-white p-8 text-slate-900 print:p-0"
    >
      <div className="relative min-h-[1123px]">
        {/* Decorative elements - top right */}
        <div className="pointer-events-none absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 opacity-100">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path d="M 100 0 L 200 100 L 100 200 L 100 0" fill="url(#grad1)" />
            <path
              d="M 120 20 L 180 80 L 120 140 L 120 20"
              fill="none"
              stroke="#1e40af"
              strokeWidth="8"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Decorative elements - bottom right */}
        <div className="pointer-events-none absolute bottom-0 right-0 -mr-20 -mb-20 h-56 w-56 opacity-100">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <linearGradient id="grad2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1e40af" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M 0 100 L 100 0 L 200 100 L 100 200 Z"
              fill="url(#grad2)"
            />
          </svg>
        </div>

        {/* Header - INVOICE title and invoice details */}
        <div className="mb-8 flex items-start justify-between gap-12">
          <div>
            <h1 className="text-5xl font-bold tracking-wider text-slate-900">
              INVOICE
            </h1>
            <div className="mt-2 h-1 w-16 bg-slate-900" />
          </div>
          <div className="text-right text-sm">
            <div className="space-y-1 text-slate-700">
              <p>
                <span className="font-semibold">INVOICE NO:</span>{" "}
                {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-semibold">DATE:</span>{" "}
                {invoice.invoiceDate || invoice.issueDate}
              </p>
              <p>
                <span className="font-semibold">DUE DATE:</span>{" "}
                {invoice.dueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Issue To section */}
        <div className="mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-600">
            Issue To
          </p>
          <div className="inline-block rounded-full bg-blue-600 px-6 py-2 text-white">
            <p className="text-lg font-bold">
              {invoice.customerName || invoice.vendorOrClient || "-"}
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {/* Placeholder for customer title/role if available */}
            Customer
          </p>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left">
                <th className="pb-3 font-bold uppercase text-slate-900">
                  Description
                </th>
                <th className="pb-3 text-right font-bold uppercase text-slate-900">
                  Unit Price
                </th>
                <th className="pb-3 text-right font-bold uppercase text-slate-900">
                  QTY
                </th>
                <th className="pb-3 text-right font-bold uppercase text-slate-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const lineAmount = safeNumber(
                  item.amount,
                  safeNumber(item.quantity) * safeNumber(item.rate),
                );
                return (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="py-4">
                      <p className="font-medium text-slate-900">
                        {item.itemName}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-600">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="text-right">{formatMoney(item.rate)}</td>
                    <td className="text-right">
                      {safeNumber(item.quantity).toFixed(2)}
                    </td>
                    <td className="text-right font-semibold text-slate-900">
                      {formatMoney(lineAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals section */}
        <div className="mb-8 space-y-2 text-right">
          <div className="flex justify-end gap-20">
            <span className="font-semibold text-slate-900">SUBTOTAL</span>
            <span className="w-24 text-right">
              {formatMoney(invoiceSubtotal)}
            </span>
          </div>
          <div className="flex justify-end gap-20">
            <span className="text-slate-600">Tax</span>
            <span className="w-24 text-right text-slate-600">
              {(((invoiceCgst + invoiceSgst) / invoiceSubtotal) * 100).toFixed(
                0,
              )}
              %
            </span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2">
            <div className="flex justify-end gap-20">
              <span className="font-bold text-slate-900">TOTAL</span>
              <span className="w-24 text-right font-bold text-slate-900">
                {formatMoney(invoiceTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {invoice.termsAndConditions && (
          <div className="mb-8">
            <p className="mb-3 font-bold uppercase tracking-wider text-slate-900">
              Terms and Conditions
            </p>
            <p className="whitespace-pre-wrap text-xs leading-5 text-slate-600">
              {invoice.termsAndConditions}
            </p>
          </div>
        )}

        {/* Signature section */}
        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-4 border-t border-slate-200">
          <div className="flex gap-16">
            <div>
              <div className="mb-12 h-16" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Signature
              </p>
            </div>
            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
