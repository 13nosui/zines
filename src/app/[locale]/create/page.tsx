import { serverAuthGuard } from "@/lib/auth/server-guards";
import { Metadata } from "next";
import CreateForm from "./CreateForm";
import { FABNavigation } from '@/components/navigation/FABNavigation';
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import { Button } from "@heroui/react";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Create Post",
  description: "Create a new post",
};

export default async function CreatePage() {
  await serverAuthGuard({ returnTo: "/create" });
  const t = await getTranslations();
  
  const fabItems = [
    { icon: 'home', label: t('common.home'), path: '/' },
    { icon: 'person', label: t('settings.profile'), path: '/me' },
    { icon: 'settings', label: t('common.settings'), path: '/settings' },
  ];
  
  return (
    <>
      <div className="max-w-[480px] mx-auto">
        <CreateForm />
      </div>
      
      {/* FAB Back Button */}
      <div className="fixed bottom-6 left-6 z-50">
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
      
      {/* FAB Navigation Menu */}
      <FABNavigation items={fabItems} />
    </>
  );
}
