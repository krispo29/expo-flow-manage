"use client"

import { useTransition, useRef } from "react"
import { toast } from "sonner"
import { addRoom, deleteRoom } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { X } from "lucide-react"

interface RoomSettingsProps {
  rooms: string[]
}

export function RoomSettings({ rooms }: Readonly<RoomSettingsProps>) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleAdd(formData: FormData) {
    const roomName = formData.get('roomName') as string
    if (!roomName) return

    startTransition(async () => {
      const result = await addRoom(roomName)
      if (result.success) {
        toast.success("Room added")
        formRef.current?.reset()
      } else {
        toast.error("Failed to add room")
      }
    })
  }

  async function handleDelete(roomName: string) {
    if (!confirm(`Delete room "${roomName}"?`)) return

    startTransition(async () => {
      const result = await deleteRoom(roomName)
      if (result.success) {
        toast.success("Room deleted")
      } else {
        toast.error("Failed to delete room")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Management</CardTitle>
        <CardDescription>
          Manage the list of available rooms for conferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} action={handleAdd} className="flex gap-2 items-end">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="roomName">New Room Name</Label>
            <Input id="roomName" name="roomName" placeholder="e.g. Hall A" required />
          </div>
          <Button type="submit" disabled={isPending}>Add Room</Button>
        </form>

        <div className="border rounded-md divide-y">
            {rooms.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">No rooms added yet.</div>
            )}
            {rooms.map((room) => (
                <div key={room} className="p-3 flex items-center justify-between text-sm">
                    <span>{room}</span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(room)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
