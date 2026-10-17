import { AlertIcon, CloseIcon, InboxIcon } from "@/components/ui/icons";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="card state state--error" role="alert">
      <AlertIcon className="state__icon" />
      <p className="state__title">{title}</p>
      <p className="state__message">{message}</p>
      {onRetry ? (
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="card state">
      <InboxIcon className="state__icon" />
      <p className="state__title">{title}</p>
      <p className="state__message">{message}</p>
    </div>
  );
}

type ErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="banner banner--error" role="alert">
      <AlertIcon />
      <span className="banner__message">{message}</span>
      <button type="button" className="banner__close" onClick={onDismiss} aria-label="Dismiss message">
        <CloseIcon />
      </button>
    </div>
  );
}
