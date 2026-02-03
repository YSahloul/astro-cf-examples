import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ApiTokenMissingCard() {
  return (
    <Card className={cn("space-y-4", "border-yellow-500")}>
      <CardHeader>
        <CardTitle>API token not configured</CardTitle>
        <CardDescription>
          External API access will not work until an API token is configured.
          The admin UI uses Astro Actions and works without a token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          To enable external API access, configure an API token by setting a{" "}
          <a
            className="text-primary underline"
            href="https://developers.cloudflare.com/workers/configuration/secrets/"
          >
            secret
          </a>{" "}
          named <code>API_TOKEN</code>.
        </p>
      </CardContent>
    </Card>
  );
}
