import { redirect } from "next/navigation";

export default function CategoriesRedirect() {
  redirect("/lessons?tab=categories");
}
