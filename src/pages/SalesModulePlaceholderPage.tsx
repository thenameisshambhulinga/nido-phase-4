import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesModulePlaceholderPageProps {
  title: string;
  description: string;
}

export default function SalesModulePlaceholderPage({
  title,
  description,
}: SalesModulePlaceholderPageProps) {
  return (
    <div>
      <Header title={title} />
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
