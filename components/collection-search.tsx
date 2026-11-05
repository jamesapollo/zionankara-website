/** GET search form for the ERP catalogue: submits to /collections?q=. */
export function CollectionSearch({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/collections" method="get" role="search" className="mb-10 flex max-w-[560px] gap-3">
      <input
        type="search"
        name="q"
        required
        minLength={2}
        defaultValue={defaultValue}
        aria-label="Search the collections"
        placeholder="Search the collections"
        className="h-(--za-control-sm) min-w-0 flex-1 border border-line-strong px-4 text-sm"
      />
      <button
        type="submit"
        className="h-(--za-control-sm) cursor-pointer border border-ink px-6 text-small uppercase tracking-button hover:bg-ink hover:text-white"
      >
        Search
      </button>
    </form>
  );
}
