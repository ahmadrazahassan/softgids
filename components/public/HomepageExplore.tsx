"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoftwareCard } from "@/components/public/SoftwareCard";
import type { Category, Software } from "@/lib/types";

/** Category-tabbed product explorer on the home page. */
export function HomepageExplore({
  categories,
  softwareByCategory,
}: {
  categories: Category[];
  softwareByCategory: Record<string, Software[]>;
}) {
  const usable = categories.filter((c) => (softwareByCategory[c.slug] ?? []).length > 0);
  if (usable.length === 0) return null;

  return (
    <Tabs defaultValue={usable[0].slug} className="w-full gap-10">
      {/* Tab bar — scrolls from the start on mobile, centers once it fits (sm+).
         `justify-center` alone would clip the first tab out of reach on narrow
         screens, so we only center when there is room. */}
      <div className="-mx-4 flex snap-x justify-start overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
        <TabsList className="h-11">
          {usable.map((category) => (
            <TabsTrigger
              key={category.slug}
              value={category.slug}
              className="snap-start px-4"
            >
              {category.name.replace(" Software", "")}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {usable.map((category) => (
        <TabsContent key={category.slug} value={category.slug} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(softwareByCategory[category.slug] ?? []).slice(0, 3).map((software) => (
              <SoftwareCard key={software.id} software={software} />
            ))}
          </div>
          <div className="text-center">
            <Link
              href={`/category/${category.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
            >
              Browse all {category.name.toLowerCase()} in South Africa
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
