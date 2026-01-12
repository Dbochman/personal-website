import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlaceholderProject() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        This is a placeholder project to test the projects infrastructure. It will be
        replaced with real interactive projects.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Theme Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">Primary Color</p>
            <p className="text-sm text-muted-foreground">
              This text should change with theme toggle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Component Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">UI Components</p>
            <p className="text-sm text-muted-foreground">
              Using shared Card component from ui library
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm">
          Infrastructure verified. Projects can now use any React component and will
          inherit the site's theme and styling.
        </p>
      </div>
    </div>
  );
}
