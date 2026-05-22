import React from "react";

export function TutorOutputSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-10 w-48 bg-secondary rounded-2xl" />
        <div className="h-6 w-32 bg-secondary rounded-full" />
      </div>
      
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-secondary rounded-full" />
          <div className="h-6 w-40 bg-secondary rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-24 bg-secondary rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-secondary rounded-full" />
          <div className="h-6 w-40 bg-secondary rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-secondary rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-secondary rounded-full" />
          <div className="h-6 w-40 bg-secondary rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-secondary/50 rounded" />
          <div className="h-4 w-[90%] bg-secondary/50 rounded" />
          <div className="h-4 w-[95%] bg-secondary/50 rounded" />
          <div className="h-4 w-[85%] bg-secondary/50 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="h-12 w-full bg-secondary rounded-2xl" />
      ))}
    </div>
  );
}
