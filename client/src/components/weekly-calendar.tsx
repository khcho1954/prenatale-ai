import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
  userId: number;
}

export function WeeklyCalendar({ userId }: WeeklyCalendarProps) {
  const { data: readingDates = [] } = useQuery({
    queryKey: ["/api/users", userId, "weekly-reading"],
    enabled: !!userId,
  });



  const getDayOfWeek = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Sunday=6, Monday=1 to Monday=0
  };

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    
    // Convert Sunday=0 to Sunday=6 for proper Monday-start week calculation
    const dayOfWeek = currentDay === 0 ? 6 : currentDay - 1;
    
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - dayOfWeek);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const today = new Date();
  const readingDateStrings = readingDates.map((date: string) => 
    new Date(date).toDateString()
  );



  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="weekly-calendar">
      {weekDates.map((date, index) => {
        const isToday = date.toDateString() === today.toDateString();
        const hasReading = readingDateStrings.includes(date.toDateString());
        
        return (
          <div key={index} className="weekly-calendar-day">
            <span className="text-xs text-gray-500 mb-2">
              {dayLabels[index]}
            </span>
            <div
              className={cn(
                "weekly-calendar-circle",
                {
                  "bg-lavender text-white": isToday,
                  "text-gray-custom": !isToday,
                }
              )}
              style={{
                backgroundColor: hasReading && !isToday ? "#9680c259" : (!hasReading && !isToday ? "#e5e7eb40" : undefined)
              }}
            >
              <span>{date.getDate()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
