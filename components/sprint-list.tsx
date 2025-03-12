"use client"

import { useState } from "react"
import type { Sprint } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isWithinInterval } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Trash2, Edit, Save, X } from "lucide-react"

interface SprintListProps {
  sprints: Sprint[]
  onDelete: (id: string) => void
  onUpdate: (updatedSprint: Sprint) => void
  selectedDate: Date
  selectedSprintId: string | null
  onSprintSelect: (sprintId: string) => void
  onDateChange?: (date: Date) => void
}

export default function SprintList({
  sprints,
  onDelete,
  onUpdate,
  selectedDate,
  selectedSprintId,
  onSprintSelect,
  onDateChange,
}: SprintListProps) {
  const [editingSprint, setEditingSprint] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined)
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined)
  const [datePickerView, setDatePickerView] = useState<"start" | "end" | null>(null)
  const [editDescription, setEditDescription] = useState<string>("")

  // Sort sprints by start date (newest first)
  const sortedSprints = [...sprints].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  // Check if the selected date is within a sprint
  const isDateInSprint = (sprint: Sprint, date: Date) => {
    try {
      return isWithinInterval(date, {
        start: new Date(sprint.startDate),
        end: new Date(sprint.endDate),
      })
    } catch (error) {
      return false
    }
  }

  const handleEdit = (sprint: Sprint) => {
    setEditingSprint(sprint.id)
    setEditName(sprint.name)
    setEditDescription(sprint.description || "")
    setEditStartDate(new Date(sprint.startDate))
    setEditEndDate(new Date(sprint.endDate))
    setDatePickerView(null)
  }

  const handleSave = (sprint: Sprint) => {
    if (!editName || !editStartDate || !editEndDate) return

    const updatedSprint = {
      ...sprint,
      name: editName,
      description: editDescription,
      startDate: editStartDate,
      endDate: editEndDate,
    };

    onUpdate(updatedSprint);

    // If we have a date change handler and this is the selected sprint
    if (onDateChange && selectedSprintId === sprint.id) {
      // Check if the selected date is within the updated sprint
      const sprintStart = new Date(updatedSprint.startDate);
      const sprintEnd = new Date(updatedSprint.endDate);
      const currentDate = new Date(selectedDate);

      // Reset time parts for comparison
      sprintStart.setHours(0, 0, 0, 0);
      sprintEnd.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      // If the current selected date is not within the sprint range,
      // update the calendar view to show the start of the sprint
      if (currentDate < sprintStart || currentDate > sprintEnd) {
        onDateChange(new Date(updatedSprint.startDate));
      }
    }

    setEditingSprint(null);
    setDatePickerView(null);
  }

  const handleCancel = () => {
    setEditingSprint(null)
    setDatePickerView(null)
  }

  const handleSprintClick = (sprintId: string) => {
    // Only trigger selection if not in edit mode
    if (editingSprint === null) {
      onSprintSelect(sprintId)

      // If we have a date change handler and the sprint is being selected (not deselected)
      if (onDateChange && (selectedSprintId !== sprintId)) {
        // Find the sprint
        const sprint = sprints.find(s => s.id === sprintId);
        if (sprint) {
          // Check if the selected date is within the sprint
          const sprintStart = new Date(sprint.startDate);
          const sprintEnd = new Date(sprint.endDate);
          const currentDate = new Date(selectedDate);

          // Reset time parts for comparison
          sprintStart.setHours(0, 0, 0, 0);
          sprintEnd.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);

          // If the current selected date is not within the sprint range,
          // update the calendar view to show the start of the sprint
          if (currentDate < sprintStart || currentDate > sprintEnd) {
            onDateChange(new Date(sprint.startDate));
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprints</CardTitle>
        <CardDescription>
          {sprints.length === 0
            ? "No sprints created yet"
            : `${sprints.length} sprint${sprints.length === 1 ? "" : "s"} created`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSprints.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Click "New Sprint" to create your first sprint</div>
          ) : (
            sortedSprints.map((sprint) => (
              <div
                key={sprint.id}
                className={`p-3 rounded-md border ${sprint.color} ${
                  isDateInSprint(sprint, selectedDate) ? "ring-1 ring-primary" : ""
                } ${selectedSprintId === sprint.id ? "ring-2 ring-primary shadow-sm" : ""} ${
                  editingSprint !== sprint.id ? "cursor-pointer" : ""
                }`}
                onClick={() => editingSprint !== sprint.id && handleSprintClick(sprint.id)}
              >
                {editingSprint === sprint.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Sprint name"
                      className="bg-white/80 dark:bg-gray-800/80"
                    />

                    <textarea
                      value={editDescription || ""}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Sprint description (optional)"
                      className="w-full min-h-[60px] p-2 rounded-md border mt-2 bg-white/80 dark:bg-gray-800/80"
                    />

                    <div className="flex justify-between gap-2 text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white/80 dark:bg-gray-800/80"
                        onClick={() => {
                          setDatePickerView(datePickerView === "start" ? null : "start")
                        }}
                      >
                        {editStartDate ? format(editStartDate, "MMM d, yyyy") : "Start date"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white/80 dark:bg-gray-800/80"
                        onClick={() => {
                          setDatePickerView(datePickerView === "end" ? null : "end")
                        }}
                      >
                        {editEndDate ? format(editEndDate, "MMM d, yyyy") : "End date"}
                      </Button>
                    </div>

                    {datePickerView && (
                      <div className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-md max-w-[280px] mx-auto overflow-hidden">
                        <Calendar
                          mode="single"
                          selected={datePickerView === "start" ? editStartDate : editEndDate}
                          onSelect={(date) => {
                            if (datePickerView === "start") {
                              setEditStartDate(date)
                              // If end date is before start date, update it
                              if (editEndDate && date && editEndDate < date) {
                                setEditEndDate(date)
                              }
                            } else {
                              setEditEndDate(date)
                            }
                          }}
                          disabled={(date) =>
                            datePickerView === "end" && editStartDate ? date < editStartDate : false
                          }
                          initialFocus
                          className="w-full scale-90 origin-top"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave(sprint)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{sprint.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sprint.startDate), "MMM d")} -{" "}
                        {format(new Date(sprint.endDate), "MMM d, yyyy")}
                      </p>
                      {sprint.description && (
                        <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{sprint.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(sprint)
                        }}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit sprint</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(sprint.id)
                        }}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete sprint</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

