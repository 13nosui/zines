import { serverAuthGuard } from "@/lib/auth/server-guards";
import { Metadata } from "next";
import CreateForm from "./CreateForm";
import { Button } from "@heroui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Post - Protected Route",
  description: "Create a new post with images",
};

export default async function CreatePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await serverAuthGuard({ returnTo: "/create" });
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-content1 border-b sticky top-0 z-10">
          <Button
            as={Link}
            href={`/${locale}`}
            isIconOnly
            variant="light"
            className="material-symbols-rounded"
          >
            arrow_back
          </Button>
          <h1 className="text-lg font-semibold flex-1">Create Post</h1>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <CreateForm />
        </div>
      </div>
    </div>
  );
}
