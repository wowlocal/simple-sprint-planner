"use client"

import { useState, useEffect } from "react"
import YearView from "./components/year-view"
import CreateSprintDialog from "./components/create-sprint-dialog"
import SprintList from "./components/sprint-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Plus, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Sprint type definition
export type Sprint = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  color: string
  description?: string
}

// Color palette for sprints - expanded with more colors
const sprintColors = [
  "bg-red-200 hover:bg-red-300",
  "bg-blue-200 hover:bg-blue-300",
  "bg-green-200 hover:bg-green-300",
  "bg-yellow-200 hover:bg-yellow-300",
  "bg-purple-200 hover:bg-purple-300",
  "bg-pink-200 hover:bg-pink-300",
  "bg-indigo-200 hover:bg-indigo-300",
  "bg-orange-200 hover:bg-orange-300",
  "bg-teal-200 hover:bg-teal-300",
  "bg-cyan-200 hover:bg-cyan-300",
  "bg-lime-200 hover:bg-lime-300",
  "bg-emerald-200 hover:bg-emerald-300",
  "bg-sky-200 hover:bg-sky-300",
  "bg-fuchsia-200 hover:bg-fuchsia-300",
  "bg-amber-200 hover:bg-amber-300",
  "bg-rose-200 hover:bg-rose-300",
  "bg-violet-200 hover:bg-violet-300",
  "bg-slate-200 hover:bg-slate-300",
  "bg-neutral-200 hover:bg-neutral-300",
  "bg-stone-200 hover:bg-stone-300",
]

// Local storage key
const STORAGE_KEY = "sprint-calendar-data"

export default function SprintCalendarPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [colorIndex, setColorIndex] = useState(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [view, setView] = useState<"month" | "year">("month")
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)

  // Load sprints from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const { sprints: savedSprints, colorIndex: savedColorIndex } = JSON.parse(savedData)

        // Convert date strings back to Date objects
        const processedSprints = savedSprints.map((sprint: any) => ({
          ...sprint,
          startDate: new Date(sprint.startDate),
          endDate: new Date(sprint.endDate),
        }))

        setSprints(processedSprints)
        setColorIndex(savedColorIndex || 0)
      } catch (error) {
        console.error("Error loading sprints from localStorage:", error)
      }
    }
  }, [])

  // Save sprints to localStorage whenever they change
  useEffect(() => {
    const dataToSave = {
      sprints,
      colorIndex,
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(dataToSave, (key, value) => {
        if (key === "startDate" || key === "endDate") {
          return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
        }
        return value
      }),
    )
  }, [sprints, colorIndex])

  // Function to add a new sprint
  const addSprint = (sprint: Omit<Sprint, "id" | "color">) => {
    const newSprint = {
      ...sprint,
      id: Date.now().toString(),
      color: sprintColors[colorIndex],
    }

    setSprints([...sprints, newSprint])
    setColorIndex((colorIndex + 1) % sprintColors.length)
  }

  // Function to delete a sprint
  const deleteSprint = (id: string) => {
    if (selectedSprintId === id) {
      setSelectedSprintId(null)
    }
    setSprints(sprints.filter((sprint) => sprint.id !== id))
  }

  // Function to update a sprint
  const updateSprint = (updatedSprint: Sprint) => {
    setSprints(sprints.map((sprint) => (sprint.id === updatedSprint.id ? updatedSprint : sprint)))
  }

  // Function to clear all sprints
  const clearAllSprints = () => {
    setSprints([])
    setSelectedSprintId(null)
    setColorIndex(0)
    setIsClearDialogOpen(false)
  }

  // Function to export sprints
  const exportSprints = () => {
    const dataStr = JSON.stringify(sprints, (key, value) => {
      if (key === "startDate" || key === "endDate") {
        // Ensure the value is a Date object before calling toISOString
        return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
      }
      return value
    })
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `sprints-${format(new Date(), "yyyy-MM-dd")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Function to import sprints
  const importSprints = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedSprints = JSON.parse(content)

          // Convert date strings back to Date objects
          const processedSprints = importedSprints.map((sprint: any) => ({
            ...sprint,
            startDate: new Date(sprint.startDate),
            endDate: new Date(sprint.endDate),
          }))

          setSprints(processedSprints)
          setSelectedSprintId(null)

          // Find the highest color index to continue rotation
          let maxIndex = 0
          processedSprints.forEach((sprint: Sprint) => {
            const index = sprintColors.indexOf(sprint.color)
            if (index > maxIndex) maxIndex = index
          })
          setColorIndex((maxIndex + 1) % sprintColors.length)
        } catch (error) {
          console.error("Error importing sprints:", error)
          alert("Failed to import sprints. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }

    input.click()
  }

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sprint Calendar</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportSprints}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={importSprints}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={() => setIsClearDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Sprint
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="month" onValueChange={(value) => setView(value as "month" | "year")}>
              <TabsList className="mb-4">
                <TabsTrigger value="month">Month View</TabsTrigger>
                <TabsTrigger value="year">Year View</TabsTrigger>
              </TabsList>
              <TabsContent value="month">
                <div className="border rounded-lg p-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="rounded-md"
                    modifiers={{
                      sprint: (date) => getSprintForDate(date) !== undefined,
                      selectedSprint: (date) => isDateInSelectedSprint(date),
                    }}
                    modifiersClassNames={{
                      sprint: "sprint-day",
                      selectedSprint: "ring-2 ring-primary",
                    }}
                    components={{
                      Day: (props) => {
                        const sprint = getSprintForDate(props.date)
                        const isSelected = isDateInSelectedSprint(props.date)

                        return (
                          <div
                            onClick={() => {
                              props.onClick?.()
                              // If this date is in a sprint, select that sprint
                              if (sprint) {
                                setSelectedSprintId(sprint.id === selectedSprintId ? null : sprint.id)
                              } else {
                                setSelectedSprintId(null)
                              }
                            }}
                            className={`relative h-9 w-9 p-0 font-normal aria-selected:opacity-100 ${
                              sprint ? sprint.color : ""
                            } ${isSelected ? "ring-2 ring-primary" : ""}`}
                          >
                            <div className="flex h-full w-full items-center justify-center rounded-md">
                              {props.date.getDate()}
                            </div>
                          </div>
                        )
                      },
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="year">
                <YearView
                  year={date.getFullYear()}
                  sprints={sprints}
                  selectedSprintId={selectedSprintId}
                  onDateSelect={(date) => setDate(date)}
                  onSprintSelect={(sprintId) => setSelectedSprintId(sprintId === selectedSprintId ? null : sprintId)}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <SprintList
              sprints={sprints}
              onDelete={deleteSprint}
              onUpdate={updateSprint}
              selectedDate={date}
              selectedSprintId={selectedSprintId}
              onSprintSelect={(sprintId) => setSelectedSprintId(sprintId === selectedSprintId ? null : sprintId)}
            />
          </div>
        </div>
      </div>

      <CreateSprintDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onCreateSprint={addSprint} />

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Sprints</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all sprints from your calendar. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllSprints} className="bg-destructive text-destructive-foreground">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

