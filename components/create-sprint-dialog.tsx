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
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date()) // Initialize with current date
  const [selectedDuration, setSelectedDuration] = useState<number>(14) // Default to 2 weeks
  const [customDuration, setCustomDuration] = useState<boolean>(false)

  // Load the last sprint end date and duration from localStorage when component mounts
  useEffect(() => {
    const savedEndDate = localStorage.getItem("lastSprintEndDate")
    if (savedEndDate) {
      try {
        const parsedDate = parseISO(savedEndDate)
        setLastSprintEndDate(parsedDate)
      } catch (error) {
        console.error("Failed to parse saved end date:", error)
      }
    }
  }, [])

  // Load saved duration and update start date when dialog opens
  useEffect(() => {
    if (open) {
      // Load the last selected duration when dialog opens
      const savedDuration = localStorage.getItem("lastSprintDuration")
      if (savedDuration) {
        try {
          const parsedDuration = parseInt(savedDuration, 10)
          if (!isNaN(parsedDuration) && parsedDuration > 0) {
            setSelectedDuration(parsedDuration)
            // Set customDuration to true if the saved duration is not one of the predefined options
            setCustomDuration(!durationOptions.some(option => option.days === parsedDuration))
          }
        } catch (error) {
          console.error("Failed to parse saved duration:", error)
        }
      }

      // Set start date based on last sprint end date
      if (lastSprintEndDate) {
        setStartDate(addDays(lastSprintEndDate, 1)) // Start the day after the last sprint ended
      } else {
        setStartDate(new Date()) // Default to today if no previous sprint
      }
    }
  }, [open, lastSprintEndDate])

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

    // Save the selected duration to localStorage
    localStorage.setItem("lastSprintDuration", selectedDuration.toString())

    // Reset form
    setName("")
    setDescription("")
    // Don't reset duration as we want to remember it for next time
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
      <DialogContent className="sm:max-w-[600px] lg:max-w-[900px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex-shrink-0 bg-primary/5">
          <DialogTitle className="text-xl text-primary">Create New Sprint</DialogTitle>
          <DialogDescription className="text-muted-foreground">Plan your sprint timeline and add details</DialogDescription>
          <div className="h-0"></div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 space-y-5">
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
              {/* Left Column - Sprint Details */}
              <div className="space-y-5">
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
                    className="w-full min-h-[120px] lg:min-h-[180px] p-3 mt-1.5 rounded-md border border-input bg-background resize-vertical"
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
              </div>

              {/* Right Column - Calendar */}
              <div className="flex flex-col">
                <Label className="text-base font-medium mb-1.5 lg:block hidden">Select Start Date</Label>
                <div className="border rounded-md bg-muted/10 p-4 flex justify-center flex-grow">
                  <Calendar
                    key={`calendar-${open ? 'open' : 'closed'}-${startDate.toISOString()}`}
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    defaultMonth={startDate}
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
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
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

