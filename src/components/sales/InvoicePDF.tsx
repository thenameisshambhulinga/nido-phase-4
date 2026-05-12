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

const numberToWords = (value: number) => {
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const chunkToWords = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const remainder = num % 10;
      return `${tens[ten]}${remainder ? ` ${ones[remainder]}` : ""}`;
    }
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return `${ones[hundred]} Hundred${remainder ? ` ${chunkToWords(remainder)}` : ""}`;
  };

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const parts = [
    crore ? `${chunkToWords(crore)} Crore` : "",
    lakh ? `${chunkToWords(lakh)} Lakh` : "",
    thousand ? `${chunkToWords(thousand)} Thousand` : "",
    rest ? chunkToWords(rest) : "",
  ].filter(Boolean);

  const rupeeWords = parts.length ? parts.join(" ") : "Zero";
  const paiseWords = paise ? ` and ${chunkToWords(paise)} Paise` : "";
  return `Indian Rupee ${rupeeWords}${paiseWords} Only`;
};

const splitAddress = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

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
  const totalInWords = numberToWords(invoiceTotal);
  const customerName = invoice.customerName || invoice.vendorOrClient || "-";
  const billingLines = splitAddress(invoice.billingAddress || "");
  const shippingLines = splitAddress(invoice.shippingAddress || "");
  const invoiceDate = invoice.invoiceDate || invoice.issueDate || "-";
  const taxPercent =
    invoiceSubtotal > 0
      ? Math.round(((invoiceCgst + invoiceSgst) / invoiceSubtotal) * 100)
      : 0;

  return (
    <div
      id="print-area"
      className="mx-auto w-[794px] bg-white p-8 text-slate-900 print:p-0"
    >
      <div className="relative min-h-[1123px] overflow-hidden border border-slate-200 bg-white px-8 py-6">
        {invoice.status === "DRAFT" && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 -translate-x-8 translate-y-5 -rotate-45 bg-slate-400 px-10 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
            Draft
          </div>
        )}

        <div className="flex items-start justify-between gap-8">
          <div className="max-w-[300px]">
            {companyLogoUrl ? (
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden">
                <img
                  src={companyLogoUrl}
                  alt="Nido Technologies logo"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-24 w-40 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-900 shadow-sm">
                <span className="text-xs font-semibold tracking-[0.35em]">
                  NT
                </span>
              </div>
            )}
          </div>
          <div className="text-right text-[11px] leading-4 text-slate-900">
            <p className="font-semibold">Nido Technologies</p>
            <p>No. 41/1, 2nd Floor, 10th Cross,</p>
            <p>11th Main, Wilson Garden,</p>
            <p>Bangalore Karnataka 560027</p>
            <p>India</p>
            <p className="font-semibold">GSTIN 29BPAPP1867G1ZN</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-600" />
          <h1 className="text-2xl font-medium tracking-[0.2em] text-slate-900">
            TAX INVOICE
          </h1>
          <div className="h-px flex-1 bg-slate-600" />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_220px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              Bill To
            </p>
            <p className="mt-2 text-[13px] font-semibold text-blue-700">
              {customerName}
            </p>
            <div className="mt-1 text-[11px] leading-5 text-slate-700">
              {billingLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {!billingLines.length && <p>-</p>}
              <p className="mt-1">
                GSTIN {invoice.customerGst || "29BPAPP1867G1ZN"}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                Ship To
              </p>
              <p className="mt-2 text-[13px] font-semibold text-slate-900">
                {customerName}
              </p>
              <div className="mt-1 text-[11px] leading-5 text-slate-700">
                {shippingLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {!shippingLines.length && <p>-</p>}
                <p className="mt-1">
                  Place Of Supply: {invoice.placeOfSupply || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="self-start rounded-sm border border-slate-400 text-[11px] leading-4">
            <div className="grid grid-cols-[1fr_1fr] border-b border-slate-400 bg-slate-100">
              <div className="border-r border-slate-400 px-3 py-2 font-semibold text-slate-700">
                Invoice#
              </div>
              <div className="px-3 py-2 text-slate-900">
                {invoice.invoiceNumber}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_1fr] border-b border-slate-400">
              <div className="border-r border-slate-400 px-3 py-2 font-semibold text-slate-700">
                Invoice Date
              </div>
              <div className="px-3 py-2 text-slate-900">{invoiceDate}</div>
            </div>
            <div className="grid grid-cols-[1fr_1fr] border-b border-slate-400">
              <div className="border-r border-slate-400 px-3 py-2 font-semibold text-slate-700">
                Terms
              </div>
              <div className="px-3 py-2 text-slate-900">
                {invoice.paymentTerms}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_1fr]">
              <div className="border-r border-slate-400 px-3 py-2 font-semibold text-slate-700">
                Due Date
              </div>
              <div className="px-3 py-2 text-slate-900">{invoice.dueDate}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden border border-slate-400">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700">
                <TableHead className="w-10 text-white">#</TableHead>
                <TableHead className="text-white">Item & Description</TableHead>
                <TableHead className="w-24 text-white">HSN/SAC</TableHead>
                <TableHead className="w-20 text-right text-white">
                  Qty
                </TableHead>
                <TableHead className="w-24 text-right text-white">
                  Rate
                </TableHead>
                <TableHead className="w-24 text-right text-white">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => {
                const lineAmount = safeNumber(
                  item.amount,
                  safeNumber(item.quantity) * safeNumber(item.rate),
                );

                return (
                  <TableRow key={item.id} className="align-top">
                    <TableCell className="text-sm">{index + 1}</TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium text-slate-900">
                        {item.itemName}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-600">
                          {item.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.hsnSac || "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {safeNumber(item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatMoney(item.rate)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatMoney(lineAmount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-4 text-[11px] leading-5 text-slate-800">
            <div>
              <p className="font-semibold text-slate-900">
                BANK NAME:- {bankDetails.bankName}
              </p>
              <p>A/c Payee Name: Nido Technologies</p>
              <p>Bank A/C No.: {bankDetails.accountNumber}</p>
              <p>Bank IFSC Code: {bankDetails.ifsc}</p>
              <p>Account Type: Current Account</p>
            </div>
            {invoice.attachments && invoice.attachments.length > 0 && (
              <div>
                <p className="font-semibold text-slate-900">Attachments</p>
                {invoice.attachments.map((attachment) => (
                  <p key={attachment}>{attachment}</p>
                ))}
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="font-semibold text-slate-900">Notes</p>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            {invoice.termsAndConditions && (
              <div>
                <p className="font-semibold text-slate-900">
                  Terms & Conditions
                </p>
                <p className="whitespace-pre-wrap">
                  {invoice.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="grid grid-cols-[1fr_auto] gap-3 py-1">
              <span className="text-right text-slate-700">Sub Total</span>
              <span className="text-right font-medium text-slate-900">
                {formatMoney(invoiceSubtotal)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 py-1">
              <span className="text-right text-slate-700">
                CGST9 ({taxPercent / 2 || 0}%)
              </span>
              <span className="text-right font-medium text-slate-900">
                {formatMoney(invoiceCgst)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 py-1">
              <span className="text-right text-slate-700">
                SGST9 ({taxPercent / 2 || 0}%)
              </span>
              <span className="text-right font-medium text-slate-900">
                {formatMoney(invoiceSgst)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 py-1">
              <span className="text-right text-slate-700">
                Shipping Charges
              </span>
              <span className="text-right font-medium text-slate-900">
                {formatMoney(invoiceShipping)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 py-1">
              <span className="text-right text-slate-700">Balance Due</span>
              <span className="text-right font-medium text-slate-900">
                {formatMoney(invoiceBalanceDue)}
              </span>
            </div>
            <div className="mt-2 border-t border-slate-400 pt-2 text-[12px] font-semibold">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="text-right">Total</span>
                <span className="text-right">{formatMoney(invoiceTotal)}</span>
              </div>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 text-[10px] leading-4 text-slate-700">
              <span className="font-semibold">Total in Words: </span>
              <span className="font-semibold italic text-slate-900">
                {totalInWords}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-8 border-t border-slate-200 pt-6">
          <div className="text-[11px] leading-5 text-slate-700">
            <p className="font-semibold text-slate-900">Authorized Signature</p>
          </div>
          <div className="h-24 w-24 rounded-full border-2 border-slate-400" />
        </div>
      </div>
    </div>
  );
}
