import { notFound } from "next/navigation";
import { BudgetDetailView } from "@/components/views/budget-views";
import { departmentBudgetById, departmentBudgetList } from "@/lib/data/budgeting";

// Every budget is known at build time, so each detail page is prerendered.
export function generateStaticParams() {
  return departmentBudgetList.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: departmentBudgetById[id]?.name ?? "Cost Center" };
}

export default async function Page({ params }) {
  const { id } = await params;
  if (!departmentBudgetById[id]) notFound();
  return <BudgetDetailView kind="department" id={id} />;
}
