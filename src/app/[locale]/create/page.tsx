import { serverAuthGuard } from "@/lib/auth/server-guards";
import { Metadata } from "next";
import CreateForm from "./CreateForm";

export const metadata: Metadata = {
  title: "Create - Protected Route",
  description: "Create something new",
};

export default async function CreatePage() {
  await serverAuthGuard({ returnTo: "/create" });
  return (
    <div>
      <h1>Create</h1>
      <CreateForm />
    </div>
  );
}
