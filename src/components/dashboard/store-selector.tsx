"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Replace with real store data from DB
const PLACEHOLDER_STORES = [
  { id: "all", name: "All Stores", domain: "" },
];

export function StoreSelector() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("all");

  const selected = PLACEHOLDER_STORES.find((s) => s.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between"
          />
        }
      >
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{selected?.name ?? "Select store"}</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2">
        {PLACEHOLDER_STORES.map((store) => (
          <button
            key={store.id}
            onClick={() => {
              setSelectedId(store.id);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
              selectedId === store.id && "bg-muted"
            )}
          >
            <Check
              className={cn(
                "h-4 w-4",
                selectedId === store.id ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="truncate">{store.name}</span>
            {store.domain && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {store.domain}
              </Badge>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
