"use client"

import type { Sprint } from "@/app/page"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

interface YearViewProps {
  year: number
  sprints: Sprint[]
  selectedSprintId: string | null
  onDateSelect: (date: Date) => void
  onSprintSelect: (sprintId: string) => void
}

export default function YearView({ year, sprints, selectedSprintId, onDateSelect, onSprintSelect }: YearViewProps) {
  const [currentYear, setCurrentYear] = useState(year)

  // Generate months for the year
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1)
    return {
      name: format(date, "MMMM"),
      date,
    }
  })

  // Function to check if a date is within a sprint
  const getSprintForDate = (date: Date) => {
    // If there's a selected sprint, check if the date is in that sprint first
    if (selectedSprintId) {
      const selectedSprint = sprints.find((sprint) => sprint.id === selectedSprintId)
      if (selectedSprint) {
        const checkDate = new Date(date)
        const startDate = new Date(selectedSprint.startDate)
        const endDate = new Date(selectedSprint.endDate)

        // Reset time parts for comparison
        checkDate.setHours(0, 0, 0, 0)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)

        if (checkDate >= startDate && checkDate <= endDate) {
          return selectedSprint
        }
      }
    }

    // Otherwise, find any sprint that contains this date
    return sprints.find((sprint) => {
      const checkDate = new Date(date)
      const startDate = new Date(sprint.startDate)
      const endDate = new Date(sprint.endDate)

      // Reset time parts for comparison
      checkDate.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)

      return checkDate >= startDate && checkDate <= endDate
    })
  }

  // Function to check if a date is within the selected sprint
  const isDateInSelectedSprint = (date: Date) => {
    if (!selectedSprintId) return false

    const selectedSprint = sprints.find((sprint) => sprint.id === selectedSprintId)
    if (!selectedSprint) return false

    const checkDate = new Date(date)
    const startDate = new Date(selectedSprint.startDate)
    const endDate = new Date(selectedSprint.endDate)

    // Reset time parts for comparison
    checkDate.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    return checkDate >= startDate && checkDate <= endDate
  }

  // Generate days for a month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Create array for all days in the month plus empty slots for the days before the first day
    const days = []

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentYear(currentYear - 1)}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous Year</span>
        </Button>
        <h2 className="text-xl font-bold">{currentYear}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentYear(currentYear + 1)}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next Year</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map((month) => (
          <div key={month.name} className="border rounded-md p-2">
            <h3 className="text-center font-medium mb-2">{month.name}</h3>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}

              {getDaysInMonth(month.date).map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-6" />
                }

                const sprint = getSprintForDate(day)
                const isSelected = isDateInSelectedSprint(day)

                return (
                  <button
                    key={day.toISOString()}
                    className={`h-6 w-full rounded-sm flex items-center justify-center ${
                      sprint ? sprint.color : ""
                    } ${isSelected ? "ring-2 ring-primary" : ""}`}
                    onClick={() => {
                      onDateSelect(day)
                      if (sprint) {
                        onSprintSelect(sprint.id)
                      }
                    }}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

