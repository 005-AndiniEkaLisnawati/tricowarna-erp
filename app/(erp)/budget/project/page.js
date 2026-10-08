import { BudgetListView } from "@/components/views/budget-views";

export const metadata = { title: "Project Budget" };

export default function Page() {
  return <BudgetListView kind="project" />;
}
