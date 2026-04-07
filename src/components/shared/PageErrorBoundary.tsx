import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PageErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  resetKey?: string;
};

type PageErrorBoundaryState = {
  hasError: boolean;
};

export default class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: PageErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="mx-auto max-w-2xl border-border/60 shadow-sm">
            <CardContent className="space-y-4 py-8 text-center">
              <div>
                <p className="text-lg font-semibold">
                  {this.props.title || "Unable to open page"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The page hit a runtime error. Reloading or navigating back
                  will restore the app shell.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={() => window.location.reload()}>Reload</Button>
                <Button variant="outline" onClick={() => history.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
