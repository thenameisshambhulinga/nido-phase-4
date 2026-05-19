import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { useEffect } from "react";

interface SalesModulePlaceholderPageProps {
  title: string;
  description: string;
}

export default function SalesModulePlaceholderPage({
  title,
  description,
}: SalesModulePlaceholderPageProps) {
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({ title: "Sales" });
  }, [setMeta]);

  return (
    <div>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
