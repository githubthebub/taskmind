import { notFound } from "next/navigation";
import { getTechniqueById, techniques } from "@/lib/techniques";
import SessionPlayer from "@/components/SessionPlayer";

export function generateStaticParams() {
  return techniques.map((t) => ({ id: t.id }));
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const technique = getTechniqueById(id);

  if (!technique) {
    notFound();
  }

  return <SessionPlayer technique={technique} />;
}
