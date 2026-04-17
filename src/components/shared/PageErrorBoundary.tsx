import { Component, type ReactNode } from "react";
import ModernErrorPage from "@/components/shared/ModernErrorPage";

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
      const offline =
        typeof navigator !== "undefined" && navigator.onLine === false;
      return (
        <ModernErrorPage
          variant={offline ? "offline" : "server"}
          title={this.props.title || "Unable to open page"}
          description={
            offline
              ? "The page could not load because the device is offline. Reconnect to the network and try again."
              : "The page hit a runtime error. Reloading or navigating back will restore the app shell."
          }
          detail={
            offline
              ? "Offline mode detected by the browser connection monitor."
              : undefined
          }
          primaryActionLabel={offline ? "Retry connection" : "Reload page"}
          secondaryActionLabel="Go back"
          onPrimaryAction={() => window.location.reload()}
          onSecondaryAction={() => history.back()}
        />
      );
    }

    return this.props.children;
  }
}
