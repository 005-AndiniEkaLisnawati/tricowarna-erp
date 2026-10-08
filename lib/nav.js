import {
  BookOpen,
  Bot,
  Calculator,
  ClipboardList,
  FileCode2,
  FileUp,
  Gavel,
  HandCoins,
  LayoutGrid,
  Library,
  LineChart,
  PackageCheck,
  PiggyBank,
  Receipt,
  Scale,
  ShoppingCart,
  Wallet,
  Building2,
  BadgeDollarSign,
  ClipboardCheck,
  FileText,
  ReceiptText,
  Truck,
  UserPlus,
} from "lucide-react";

export const navGroups = [
  {
    id: "command",
    label: "Command Center",
    items: [
      { href: "/", label: "Action Items", icon: LayoutGrid, badge: "10" },
      { href: "/command/insight", label: "AI Executive Summary", icon: Bot },
    ],
  },
  {
    id: "tender",
    label: "Estimasi & Tender",
    items: [
      { href: "/tender", label: "List Tender", icon: Gavel },
      { href: "/tender/upload", label: "Upload Dokumen Tender", icon: FileUp },
      { href: "/tender/ahsp", label: "Master AHSP & Koefisien", icon: Library },
      { href: "/tender/boq", label: "Rekap BOQ & Margin", icon: Calculator },
    ],
  },
  {
    id: "p2p",
    label: "Procurement (P2P)",
    items: [
      { href: "/procurement/pr", label: "Purchase Request", icon: ClipboardList, badge: "4" },
      { href: "/procurement/po", label: "Purchase Order", icon: ShoppingCart },
      { href: "/procurement/gr", label: "Goods Receipt", icon: PackageCheck },
      { href: "/procurement/bill", label: "Vendor Bill (AP)", icon: Receipt },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { href: "/sales/leads", label: "Leads", icon: UserPlus },
      { href: "/sales/quotations", label: "Quotations", icon: FileText },
      { href: "/sales/orders", label: "Sales Orders", icon: ClipboardCheck },
      { href: "/sales/delivery", label: "Delivery Order", icon: Truck },
      { href: "/sales/invoices", label: "Sales Invoice", icon: ReceiptText },
      { href: "/sales/payments", label: "Payments", icon: BadgeDollarSign },
    ],
  },
  {
    id: "finance",
    label: "Finance & Kas Lapangan",
    items: [
      { href: "/finance/advances", label: "Advances (Kasbon)", icon: HandCoins },
      { href: "/finance/expenses", label: "Expenses", icon: Wallet },
      { href: "/finance/settlement", label: "Settlement", icon: Scale },
    ],
  },
  {
    id: "budget",
    label: "Budgeting",
    items: [
      { href: "/budget/project", label: "Project Budget", icon: PiggyBank },
      { href: "/budget/cost-center", label: "Cost Center", icon: Building2 },
    ],
  },
  {
    id: "accounting",
    label: "Accounting & Pajak",
    items: [
      { href: "/accounting/gl", label: "General Ledger", icon: BookOpen },
      { href: "/accounting/reports", label: "Laporan Keuangan", icon: LineChart },
      { href: "/accounting/tax", label: "Pajak & Coretax", icon: FileCode2 },
    ],
  },
];

export const navItems = navGroups.flatMap((g) =>
  g.items.map((item) => ({ ...item, group: g.label })),
);

/** Exact match, or the deepest item whose href prefixes the path (e.g. /budget/project/x). */
export function findNav(pathname) {
  return (
    navItems.find((i) => i.href === pathname) ??
    navItems
      .filter((i) => i.href !== "/" && pathname.startsWith(i.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0] ??
    null
  );
}

export function isActiveNav(href, pathname) {
  return findNav(pathname)?.href === href;
}

