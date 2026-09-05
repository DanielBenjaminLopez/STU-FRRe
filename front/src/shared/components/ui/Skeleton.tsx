export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-white/50 rounded animate-pulse ${className}`} />;
}

export function ClaseRowSkeleton() {
  return (
    <div className="flex flex-col justify-center gap-2 items-start w-full p-4 border border-gray-200 bg-white/50 rounded-2xl">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-14 rounded-2xl" />
        <Skeleton className="h-6 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function ClaseListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-1 overflow-auto">
      {Array.from({ length: count }).map((_, i) => (
        <ClaseRowSkeleton key={i} />
      ))}
    </div>
  );
}

function ScheduleRowSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200 bg-white/50">
      <Skeleton className="shrink-0 h-3 w-24 mt-0.5" />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function ScheduleDaySkeleton({ itemCount = 2 }: { itemCount?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <ScheduleRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ScheduleGridSkeleton() {
  return (
    <div className="flex flex-col gap-6 overflow-auto p-4 h-full mx-4">
      <ScheduleDaySkeleton itemCount={2} />
      <ScheduleDaySkeleton itemCount={3} />
      <ScheduleDaySkeleton itemCount={4} />
      <ScheduleDaySkeleton itemCount={2} />
    </div>
  );
}

function MesGrillaSkeleton() {
  return (
    <div className="flex flex-col gap-1 w-full h-full">
      <Skeleton className="h-3 w-16 mx-auto" />
      <div className="grid grid-cols-7 gap-0.5 h-full">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full h-4" />
        ))}
      </div>
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 h-full w-full">
      <div className="grid w-full gap-4 grid-cols-3 grid-rows-4 flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/50 border border-gray-200 px-2.5 py-3 text-center flex flex-col w-full h-full"
          >
            <MesGrillaSkeleton />
          </div>
        ))}
      </div>
      <div className="flex gap-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="w-full h-full flex flex-col justify-between items-center rounded-4xl bg-white/50 border border-gray-200 p-4">
      <div className="flex flex-col gap-2 items-center w-full">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-7 gap-1 w-full">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

function NoticiaRowSkeleton() {
  return (
    <div className="flex gap-4 items-start w-full p-4 border border-gray-200 bg-white/50 rounded-2xl">
      <Skeleton className="shrink-0 w-24 h-24 rounded-2xl" />
      <div className="flex flex-col justify-center gap-2 items-start min-w-0 flex-1">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function NoticiaListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-auto">
      {Array.from({ length: count }).map((_, i) => (
        <NoticiaRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function NoticiaCarouselSkeleton() {
  return (
    <div className="col-span-4 row-span-2 relative rounded-4xl overflow-hidden bg-linear-to-br from-purple-400 to-purple-600">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/70" />
      <div className="absolute bottom-4 left-0 right-0 z-10 p-6 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
          <Skeleton className="h-3 w-20 bg-white/20" />
        </div>
        <Skeleton className="h-6 w-3/4 bg-white/20" />
        <Skeleton className="h-4 w-1/2 bg-white/20" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        <Skeleton className="w-2 h-2 rounded-full bg-white/20" />
        <Skeleton className="w-2 h-2 rounded-full bg-white/20" />
        <Skeleton className="w-2 h-2 rounded-full bg-white/20" />
      </div>
      <div className="absolute top-8 left-8 z-20">
        <Skeleton className="h-5 w-40 bg-white/20" />
      </div>
      <Skeleton className="absolute top-8 right-8 z-20 h-8 w-24 rounded-2xl bg-white/20" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col w-full h-full p-16 gap-16">
      <div className="flex items-center w-full justify-between">
        <Skeleton className="w-80 h-8" />
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-8 w-28 rounded-4xl" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4">
        <div
          className="col-span-4 row-span-2 rounded-4xl bg-blue-100/50"
          style={{ gridColumn: "1 / span 4", gridRow: "1 / span 2" }}
        />
        <div
          className="col-span-4 row-span-2 rounded-4xl bg-green-100/50"
          style={{ gridColumn: "1 / span 4", gridRow: "3 / span 2" }}
        />
        <div
          className="col-span-2 row-span-2 rounded-4xl bg-teal-100/50"
          style={{ gridColumn: "1 / span 2", gridRow: "5 / span 2" }}
        />
        <div
          className="col-span-2 row-span-2 rounded-4xl bg-indigo-100/50"
          style={{ gridColumn: "3 / span 2", gridRow: "5 / span 2" }}
        />
      </div>
    </div>
  );
}

export function AdminCalendarSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex gap-6">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3 items-center">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 grid-rows-4 gap-4 w-full flex-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-3"
            >
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, j) => (
                  <Skeleton key={j} className="aspect-square w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-56 shrink-0 flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminTemplatesSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Barra lateral de widgets */}
        <div className="w-72 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col gap-1.5">
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-52 rounded-md" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col"
              >
                <div className="h-36 bg-gray-50/50 p-3 flex items-center justify-center">
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
                <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <Skeleton className="h-3.5 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas central: Tótem vertical (9:16) */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-hidden p-4">
          <div className="h-full aspect-[9/16] max-h-full bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col gap-6 overflow-hidden">
            {/* Encabezado simulado del tótem */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
            {/* Grilla 4x6 simulada */}
            <div className="flex-1 grid grid-cols-4 grid-rows-6 gap-3 min-h-0">
              <Skeleton className="col-span-4 row-span-2 rounded-2xl" />
              <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
              <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
              <Skeleton className="col-span-4 row-span-2 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior: Pestañas de plantillas y botones de acción */}
      <div className="flex items-center justify-between px-6 h-16 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-2xl" />
          <Skeleton className="h-9 w-28 rounded-2xl" />
          <Skeleton className="h-9 w-9 rounded-2xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <Skeleton className="h-9 w-24 rounded-2xl" />
          <Skeleton className="h-9 w-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminSchedulesSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-28 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64 rounded-2xl" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <Skeleton className="h-12 w-full rounded-none" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 px-4 py-4 border-t border-gray-100"
            >
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
