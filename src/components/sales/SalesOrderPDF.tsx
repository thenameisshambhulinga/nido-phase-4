import type { SalesOrder } from "@/contexts/DataContext";
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

export default function SalesOrderPDF({
  order,
  companyLogoUrl,
}: {
  order: SalesOrder;
  companyLogoUrl?: string;
}) {
  return (
    <div className="sales-print-sheet mx-auto w-[794px] rounded-3xl bg-white px-10 py-8 text-slate-900 shadow-none ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-5 text-white">
        <div className="max-w-sm">
          {companyLogoUrl ? (
            <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm">
              <img
                src={companyLogoUrl}
                alt="Nido Technologies logo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-16 w-32 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm ring-1 ring-white/15">
              <span className="text-xs font-semibold tracking-[0.35em]">
                NT
              </span>
            </div>
          )}
          <div className="mt-4 space-y-1 text-[12px] leading-5 text-slate-200">
            <p className="text-sm font-semibold text-white">
              Nido Technologies
            </p>
            <p>No. 41/1, 2nd Floor, 10th Cross</p>
            <p>11th Main, Wilson Garden</p>
            <p>Bangalore Karnataka 560027</p>
            <p>India</p>
            <p className="font-medium text-white">GSTIN 29BPAPP1867G1ZN</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300">
            Sales Order
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Sales Order# {order.salesOrderNumber}
          </p>
          <p className="mt-2 text-sm text-slate-300">{order.salesOrderDate}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Bill To
          </p>
          <div className="mt-2 text-[12px] leading-5 text-slate-700 whitespace-pre-wrap">
            <p className="text-sm font-semibold text-slate-900">
              {order.customerName}
            </p>
            <p>{order.billingAddress}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Ship To
          </p>
          <div className="mt-2 text-[12px] leading-5 text-slate-700 whitespace-pre-wrap md:ml-auto md:max-w-sm">
            <p className="text-sm font-semibold text-slate-900">
              {order.customerName}
            </p>
            <p>{order.shippingAddress}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-[12px] md:grid-cols-2">
        <div>
          <span className="text-slate-500">Order Date:</span>{" "}
          <span className="font-medium text-slate-900">
            {order.salesOrderDate}
          </span>
        </div>
        <div className="md:text-right">
          <span className="text-slate-500">Reference:</span>{" "}
          <span className="font-medium text-slate-900">
            {order.referenceNumber || "-"}
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900 hover:bg-slate-900">
              <TableHead className="text-white">#</TableHead>
              <TableHead className="text-white">Item & Description</TableHead>
              <TableHead className="text-white">HSN/SAC</TableHead>
              <TableHead className="text-white text-right">Qty</TableHead>
              <TableHead className="text-white text-right">Rate</TableHead>
              <TableHead className="text-white text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <p className="font-medium text-slate-900">{item.itemName}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </TableCell>
                <TableCell>{item.hsnSac || "-"}</TableCell>
                <TableCell className="text-right">
                  {item.quantity.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {currency.format(item.rate)}
                </TableCell>
                <TableCell className="text-right">
                  {currency.format(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between py-1 text-[12px]">
            <span className="text-slate-600">Sub Total</span>
            <span className="font-semibold">
              {currency.format(order.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 text-[12px]">
            <span className="text-slate-600">CGST (9%)</span>
            <span className="font-semibold">{currency.format(order.cgst)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-[12px]">
            <span className="text-slate-600">SGST (9%)</span>
            <span className="font-semibold">{currency.format(order.sgst)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-[12px]">
            <span className="text-slate-600">Shipping</span>
            <span className="font-semibold">
              {currency.format(order.shippingCharges ?? 0)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <span>Total</span>
            <span>{currency.format(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-600">
            {order.customerNotes || "-"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Terms & Conditions
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-600">
            {order.termsAndConditions || "-"}
          </p>
        </div>
      </div>

      <div className="mt-8 text-[12px] text-slate-700">
        <p className="font-semibold text-slate-800">Authorized Signature</p>
        <div className="mt-4 h-px w-64 bg-slate-400" />
      </div>
    </div>
  );
}
