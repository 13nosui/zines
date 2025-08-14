import { serverAuthGuard } from "@/lib/auth/server-guards";
import { Metadata } from "next";
import CreateForm from "./CreateForm";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Create Post",
  description: "Create a new post",
};

export default async function CreatePage() {
  await serverAuthGuard({ returnTo: "/create" });
  
  return (
    <>
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Post</h1>
        <CreateForm />
      </div>
      
      {/* FAB Back Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          as={Link}
          href="/"
          isIconOnly
          color="default"
          variant="shadow"
          className="rounded-full w-14 h-14"
          aria-label="Go back"
        >
          <Icon name="chevron_backward" size="lg" />
        </Button>
      </div>
    </>
  );
}
