import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Sparkles,
  UserCircle2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Truck,
  ShieldCheck,
  PackageCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  buildProductGallery,
  getProductEmoji,
  resolveProductImage,
} from "@/lib/catalogMedia";

type EnquiryMessage = {
  id: string;
  sender: "buyer" | "owner" | "vendor" | "system";
  text: string;
  timestamp: string;
  attachment?: string;
  read?: boolean;
};

const storageKeyFor = (productId: string) => `product_enquiry_${productId}`;
const unreadKeyFor = (productId: string) => `enquiry_unread_${productId}`;

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
        <UserCircle2 className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-[22px] bg-slate-100 px-4 py-3">
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: EnquiryMessage }) {
  const time = new Date(message.timestamp);
  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = time.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      className={cn(
        "flex gap-3",
        message.sender === "buyer" && "justify-end",
        message.sender === "system" && "justify-center",
      )}
    >
      {message.sender === "system" ? (
        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs text-emerald-700">
          <CheckCircle className="h-3 w-3" />
          <span>{message.text}</span>
        </div>
      ) : (
        <>
          {message.sender !== "buyer" && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
              <UserCircle2 className="h-4 w-4" />
            </div>
          )}
          <div
            className={cn(
              "max-w-[75%] rounded-[22px] px-4 py-3 text-sm shadow-sm",
              message.sender === "buyer"
                ? "bg-slate-950 text-white"
                : message.sender === "vendor"
                  ? "bg-amber-50 text-slate-900 border border-amber-200"
                  : "bg-sky-50 text-slate-900 border border-sky-200",
            )}
          >
            <div className="mb-1.5 flex items-center justify-between gap-4 text-[10px] opacity-60">
              <span className="font-semibold uppercase tracking-[0.14em]">
                {message.sender}
              </span>
              <span>
                {formattedDate} · {formattedTime}
              </span>
            </div>
            {message.attachment && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-current/20 bg-white/20 p-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs">{message.attachment}</span>
              </div>
            )}
            <p className="leading-6">{message.text}</p>
            {!message.read && message.sender !== "buyer" && (
              <div className="mt-1 flex items-center gap-1 text-[10px] opacity-40">
                <AlertCircle className="h-3 w-3" />
                <span>Unread</span>
              </div>
            )}
          </div>
          {message.sender === "buyer" && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
              <UserCircle2 className="h-4 w-4" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductEnquiryPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { masterCatalogItems } = useData();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<EnquiryMessage[]>([]);
  const [attachmentName, setAttachmentName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const product = useMemo(
    () =>
      masterCatalogItems.find(
        (item) => (item.id || item.masterProductId) === productId,
      ),
    [masterCatalogItems, productId],
  );

  const emoji = product
    ? getProductEmoji(product.category, product.name)
    : "📦";

  const gallery = useMemo(() => {
    if (!product) return [];
    return buildProductGallery({
      name: product.name,
      category: product.category,
      brand: product.brand,
      image: product.image,
      emoji,
    });
  }, [product, emoji]);

  const keySpecs = useMemo(() => {
    if (!product) return [];
    return [
      {
        label: "Function",
        value: product.productType || product.category,
        icon: PackageCheck,
      },
      {
        label: "Connectivity",
        value: product.connectivity || "Standard",
        icon: ShieldCheck,
      },
      {
        label: "Warranty",
        value: product.warranty || "Standard warranty",
        icon: ShieldCheck,
      },
      {
        label: "Lead Time",
        value: product.leadTime || "5-7 Days",
        icon: Truck,
      },
      {
        label: "Print Speed",
        value: product.printSpeed || "Refer spec sheet",
        icon: Star,
      },
      {
        label: "Paper Size",
        value: product.paperSize || "A4 / Standard",
        icon: PackageCheck,
      },
    ].filter((spec) => spec.value && spec.value !== "undefined");
  }, [product]);

  const specRows = useMemo(
    () =>
      [
        ["Product Code", product?.productCode],
        ["Brand", product?.brand || "Nido"],
        ["Category", product?.category],
        ["Sub Category", product?.subCategory || "General"],
        ["Warranty", product?.warranty || "Standard warranty"],
        ["Lead Time", product?.leadTime || "5-7 Days"],
        [
          "Primary Vendor",
          product?.primaryVendor || "Preferred vendor network",
        ],
        ["HSN/SAC", product?.hsnCode || "Not specified"],
      ].filter(([, v]) => v),
    [product],
  );

  useEffect(() => {
    if (!productId) return;
    const saved = localStorage.getItem(storageKeyFor(productId));
    const savedUnread = localStorage.getItem(unreadKeyFor(productId));
    if (saved) {
      const parsed = JSON.parse(saved) as EnquiryMessage[];
      setMessages(parsed);
      if (savedUnread) setUnreadCount(parseInt(savedUnread, 10));
      return;
    }
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "system",
        text: `Enquiry started for ${product?.name || "selected product"}`,
        timestamp: new Date().toLocaleString(),
        read: true,
      },
      {
        id: crypto.randomUUID(),
        sender: "owner",
        text: `Hello! You are now connected with our procurement team for ${product?.name || "this product"}. Ask anything about price, availability, specifications, customisation, or negotiation — we're here to help.`,
        timestamp: new Date().toLocaleString(),
        read: true,
      },
    ]);
  }, [product, productId]);

  useEffect(() => {
    if (!productId || !messages.length) return;
    localStorage.setItem(storageKeyFor(productId), JSON.stringify(messages));
  }, [messages, productId]);

  useEffect(() => {
    if (!productId) return;
    localStorage.setItem(unreadKeyFor(productId), String(unreadCount));
  }, [unreadCount, productId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleAttach = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAttachedFile(file);
        setAttachmentName(file.name);
        toast.success(`Attached: ${file.name}`);
      }
    };
    input.click();
  };

  const sendMessage = () => {
    if (!draft.trim() && !attachedFile) return;
    const now = new Date().toLocaleString();
    const newMessages: EnquiryMessage[] = [
      ...messages,
      ...(draft.trim()
        ? [
            {
              id: crypto.randomUUID(),
              sender: "buyer" as const,
              text: draft.trim(),
              timestamp: now,
              attachment: attachedFile ? attachedFile.name : undefined,
              read: false,
            },
          ]
        : []),
    ];
    setMessages(newMessages);
    setDraft("");
    setAttachedFile(null);
    setAttachmentName("");
    setUnreadCount((prev) => prev + 1);

    toast.success("Message sent");

    setIsTyping(true);
    setTimeout(
      () => {
        setIsTyping(false);

        // Owner canned reply
        const ownerReply: EnquiryMessage = {
          id: crypto.randomUUID(),
          sender: "owner",
          text: "Thanks for your enquiry. Our team is reviewing your message and will respond shortly. For urgent matters, feel free to call our procurement desk.",
          timestamp: new Date().toLocaleString(),
          read: false,
        };

        // AI-generated helper reply (lightweight keyword-based)
        const generateAiReply = (text: string) => {
          const t = text.toLowerCase();
          if (/price|cost|rate|how much|range/.test(t)) {
            const p = product?.price
              ? `around ₹${Number(product.price).toLocaleString()}`
              : "within the listed price range";
            return `Estimated pricing is ${p}. For exact quotes, please specify quantity and delivery location.`;
          }
          if (/stock|availability|available|in stock/.test(t)) {
            const status = product?.status || "In Stock";
            return `Current stock status: ${status}. For bulk quantities, we can confirm vendor allocations on request.`;
          }
          if (/spec|specification|feature|warranty|dimension/.test(t)) {
            const specs = [];
            if (product?.warranty) specs.push(`Warranty: ${product.warranty}`);
            if ((product as any)?.dimensions)
              specs.push(`Dimensions: ${(product as any).dimensions}`);
            if ((product as any)?.printSpeed)
              specs.push(`Print Speed: ${(product as any).printSpeed}`);
            return specs.length
              ? `Key specs — ${specs.join("; ")}`
              : `Please specify which specification you need and I'll provide details.`;
          }
          // fallback
          return "Thanks — our procurement specialist will follow up with more details. Meanwhile, tell us if you need pricing, lead time, or customisation options.";
        };

        const aiReply: EnquiryMessage = {
          id: crypto.randomUUID(),
          sender: "owner",
          text: generateAiReply(draft),
          timestamp: new Date().toLocaleString(),
          read: false,
        };

        const replyMessages: EnquiryMessage[] = [
          ...newMessages,
          ownerReply,
          aiReply,
          {
            id: crypto.randomUUID(),
            sender: "system",
            text: "A team member will respond within 2 business hours",
            timestamp: new Date().toLocaleString(),
            read: false,
          },
        ];
        setMessages(replyMessages);
        setUnreadCount((prev) => prev + 3);
      },
      1200 + Math.random() * 1200,
    );
  };

  if (!product) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Product not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedImage = gallery[0] || {
    src: resolveProductImage({
      name: product.name,
      category: product.category,
      brand: product.brand,
      image: product.image,
      emoji,
    }),
  };

  const statusColor =
    product.status === "Out of Stock"
      ? "text-rose-600"
      : product.status === "Low Stock"
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <div className="space-y-5 p-4 md:p-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-950">
              Product Enquiry
            </h1>
            <p className="text-xs text-slate-500">Real-time conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="rounded-full bg-rose-100 text-rose-700 gap-1">
              <MessageSquare className="h-3 w-3" />
              {unreadCount} unread
            </Badge>
          )}
          <Badge className="rounded-full bg-emerald-100 text-emerald-700">
            Live
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Product Context Sidebar */}
        <Card className="overflow-hidden rounded-[22px] border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-3">
              <img
                src={selectedImage.src}
                alt={product.name}
                className="h-[200px] w-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                {product.category}
              </p>
              <h2 className="text-xl font-semibold leading-tight text-slate-950">
                {product.name}
              </h2>
              <p className="line-clamp-2 text-sm text-slate-600">
                {product.description || "Enterprise procurement product"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Price
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  ₹{Number(product.price || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500">Excl. taxes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  MOQ
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  1 Unit
                </p>
                <p className="text-[10px] text-slate-500">Minimum order</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Stock
                </p>
                <span className={cn("text-sm font-semibold", statusColor)}>
                  {product.status || "In Stock"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Truck className="h-3.5 w-3.5 text-sky-500" />
                <span>Lead: {product.leadTime || "5-7 Days"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                <span>Warranty: {product.warranty || "Standard"}</span>
              </div>
            </div>

            {keySpecs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Key Specifications
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {keySpecs.slice(0, 4).map((spec) => {
                    const Icon = spec.icon;
                    return (
                      <div
                        key={spec.label}
                        className="rounded-xl border border-slate-200 bg-white p-2"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="h-3.5 w-3.5 text-sky-600" />
                          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {spec.label}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {spec.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                General Specs
              </p>
              <div className="space-y-1">
                {specRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Vendor Info
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>
                  {product.primaryVendor || "Preferred vendor network"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>
                  Rating: {(product.performanceRating || 4.8).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="overflow-hidden rounded-[22px] border-slate-200 bg-white shadow-sm flex flex-col">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span>Enquiry Conversation</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Response within 2h</span>
              </div>
            </CardTitle>
          </CardHeader>

          <ScrollArea
            ref={scrollRef}
            className="flex-1 max-h-[480px] min-h-[400px]"
          >
            <div className="space-y-4 p-5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          </ScrollArea>

          <div className="border-t border-slate-100 p-4">
            {attachedFile && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                <FileText className="h-4 w-4 text-sky-600" />
                <span className="flex-1 text-xs font-medium text-sky-700">
                  {attachedFile.name}
                </span>
                <button
                  onClick={() => {
                    setAttachedFile(null);
                    setAttachmentName("");
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            )}
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about pricing, availability, specs, customization, or negotiation..."
              rows={3}
              className="rounded-2xl resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  type="button"
                  onClick={handleAttach}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attach
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  type="button"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Image
                </Button>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!draft.trim() && !attachedFile}
                className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Enquiry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
