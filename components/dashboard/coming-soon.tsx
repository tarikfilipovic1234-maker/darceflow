import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  phase,
  highlights,
}: {
  title: string;
  description: string;
  phase: string;
  highlights: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title={title} description={description} />

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {phase}
            </Badge>
            <CardTitle className="text-base font-semibold">In progress</CardTitle>
          </div>
          <CardDescription>
            This area is scaffolded but the full experience lands later in the build. Here&apos;s
            what it will include:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
