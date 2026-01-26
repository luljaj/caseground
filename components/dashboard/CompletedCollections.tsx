import Link from "next/link";

export type CompletedCollectionCard = {
  id: string;
  name: string;
  slug: string;
  completedAt: string;
};

export default function CompletedCollections({
  collections,
}: {
  collections: CompletedCollectionCard[];
}) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-zinc-700/50 bg-zinc-800/50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
          Completed Collections
        </h2>
        <Link
          href="/collections"
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Browse Collections
        </Link>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}/complete`}
            className="rounded-2xl border border-white/10 bg-surface/40 p-4 transition-all hover:border-white/20"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="line-clamp-1">{collection.name}</span>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Completed {new Date(collection.completedAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
