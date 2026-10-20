import type { Metadata } from "next";
import KoolskullOS from "../page";
import { BRAND_NAME } from "@/lib/buildFlags";
import { getAppPackage } from "@/lib/apps/catalog";
import { appFoldersToBuild, appIdFromPathname } from "@/lib/apps/paths";

export function generateStaticParams() {
  return appFoldersToBuild().map((appPath) => ({ appPath }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ appPath: string }>;
}): Promise<Metadata> {
  const { appPath } = await params;
  const id = appIdFromPathname(`/${appPath}`);
  const pkg = id ? getAppPackage(id) : undefined;
  const title = pkg ? pkg.defaultWindow.title : "APP";
  return { title: `${title} — ${BRAND_NAME}` };
}

export default function AppFolderPage() {
  return <KoolskullOS />;
}
