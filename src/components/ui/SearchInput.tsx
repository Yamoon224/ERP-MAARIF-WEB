import { type InputHTMLAttributes, forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Rechercher...", ...props }, ref) => {
    return (
      <div className={cn("relative w-full max-w-sm", className)}>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          role="searchbox"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            // rounded-full : les champs de recherche partagent la forme des boutons.
            "h-10 w-full rounded-full border border-border bg-surface pr-9 pl-10 text-sm text-foreground",
            "placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          )}
          {...props}
        />
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
