import { notFound } from "next/navigation";
import { BudgetDetailView } from "@/components/views/budget-views";
import { projectBudgetById, projectBudgetList } from "@/lib/data/budgeting";

// Every budget is known at build time, so each detail page is prerendered.
export function generateStaticParams() {
  return projectBudgetList.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: projectBudgetById[id]?.name ?? "Project Budget" };
}

export default async function Page({ params }) {
  const { id } = await params;
  if (!projectBudgetById[id]) notFound();
  return <BudgetDetailView kind="project" id={id} />;
}
