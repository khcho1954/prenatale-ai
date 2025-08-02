import { Card } from "@/components/ui/card";

export function StorySkeleton() {
  return (
    <Card className="w-full h-[500px] mx-auto bg-white animate-pulse">
      <div className="relative h-full">
        {/* Image placeholder */}
        <div className="h-48 bg-gray-200 rounded-t-lg"></div>
        
        {/* Content placeholder */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          
          {/* Excerpt lines */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
          
          {/* Tags */}
          <div className="flex gap-2 mt-4">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
        </div>
        
        {/* Button placeholder */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </Card>
  );
}

export function WeeklyCalendarSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-4 bg-gray-200 rounded w-6 mx-auto mb-2"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentlyReadSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
          <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}