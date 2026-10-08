import { BudgetListView } from "@/components/views/budget-views";

export const metadata = { title: "Cost Center" };

export default function Page() {
  return <BudgetListView kind="department" />;
}
