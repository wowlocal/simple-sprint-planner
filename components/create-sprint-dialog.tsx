"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays, isBefore, isAfter, isSameDay, parseISO } from "date-fns"
import type { Sprint } from "@/app/page"
import { CalendarIcon, ArrowRight } from "lucide-react"

interface CreateSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSprint: (sprint: Omit<Sprint, "id" | "color">) => void
}

// Sprint duration options
type DurationOption = {
  label: string
  days: number
}

const durationOptions: DurationOption[] = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "3 weeks", days: 21 },
  { label: "4 weeks", days: 28 },
]

export default function CreateSprintDialog({ open, onOpenChange, onCreateSprint }: CreateSprintDialogProps) {
  // Get the last sprint end date from localStorage when component mounts
  const [lastSprintEndDate, setLastSprintEndDate] = useState<Date | null>(null)

  // Initialize start date based on last sprint end date or current date
  const getInitialStartDate = () => {
    if (lastSprintEndDate) {
      return addDays(lastSprintEndDate, 1) // Start the day after the last sprint ended
    }
    return new Date() // Default to today if no previous sprint
  }

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(getInitialStartDate())
  const [selectedDuration, setSelectedDuration] = useState<number>(14) // Default to 2 weeks
  const [customDuration, setCustomDuration] = useState<boolean>(false)

  // Load the last sprint end date from localStorage when component mounts
  useEffect(() => {
    const savedEndDate = localStorage.getItem("lastSprintEndDate")
    if (savedEndDate) {
      try {
        const parsedDate = parseISO(savedEndDate)
        setLastSprintEndDate(parsedDate)
        // Only update the start date when the dialog opens
        if (open) {
          setStartDate(addDays(parsedDate, 1))
        }
      } catch (error) {
        console.error("Failed to parse saved end date:", error)
      }
    }
  }, [open])

  // Calculate end date based on start date and duration
  const endDate = addDays(startDate, selectedDuration - 1) // Subtract 1 to include start day

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !startDate) {
      return
    }

    onCreateSprint({
      name,
      startDate,
      endDate,
      description,
    })

    // Save the end date of this sprint to localStorage
    localStorage.setItem("lastSprintEndDate", endDate.toISOString())
    setLastSprintEndDate(endDate)

    // Reset form
    setName("")
    setDescription("")
    setSelectedDuration(14) // Reset to 2 weeks
    setCustomDuration(false)
    onOpenChange(false)
  }

  // Handle custom duration input change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setSelectedDuration(value)
    }
  }

  // Custom day renderer to highlight the sprint duration
  const isDayInSprintRange = (date: Date) => {
    return (
      (isSameDay(date, startDate) || isAfter(date, startDate)) && (isSameDay(date, endDate) || isBefore(date, endDate))
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-xl">Create New Sprint</DialogTitle>
          <DialogDescription>Plan your sprint timeline and add details</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 space-y-5">
            {/* Sprint Name */}
            <div>
              <Label htmlFor="name" className="text-base font-medium">
                Sprint Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                placeholder="Enter sprint name"
                required
              />
            </div>

            {/* Sprint Description */}
            <div>
              <Label htmlFor="description" className="text-base font-medium">
                Description
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px] p-3 mt-1.5 rounded-md border border-input bg-background resize-vertical"
                placeholder="What are the goals for this sprint?"
              />
            </div>

            {/* Sprint Duration */}
            <div>
              <Label className="text-base font-medium">Duration</Label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {durationOptions.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    variant={!customDuration && selectedDuration === option.days ? "default" : "outline"}
                    className="text-sm"
                    onClick={() => {
                      setSelectedDuration(option.days)
                      setCustomDuration(false)
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant={customDuration ? "default" : "outline"}
                  className="text-sm"
                  onClick={() => setCustomDuration(true)}
                >
                  Custom
                </Button>
                {customDuration && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={selectedDuration}
                      onChange={handleDurationChange}
                      className="w-20"
                    />
                    <span className="text-sm">days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Display */}
            <div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 flex items-center gap-2 p-2 border rounded-md bg-background">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{format(startDate, "MMM d, yyyy")}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 p-2 border rounded-md bg-background">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{format(endDate, "MMM d, yyyy")}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selectedDuration} day sprint</p>
            </div>

            {/* Calendar - Only for selecting start date but highlighting the full sprint range */}
            <div className="border rounded-md bg-muted/10 p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                className="w-full"
                modifiers={{
                  sprintRange: isDayInSprintRange,
                  sprintStart: (date) => isSameDay(date, startDate),
                  sprintEnd: (date) => isSameDay(date, endDate),
                }}
                modifiersClassNames={{
                  sprintRange: "bg-primary/20",
                  sprintStart: "bg-primary text-primary-foreground rounded-l-md",
                  sprintEnd: "bg-primary text-primary-foreground rounded-r-md",
                }}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Sprint</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

