"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "Topic must be at least 2 characters.",
  }),
  learnMore: z.string().optional(),
  speakerInfo: z.string().optional(),
  date: z.date(),
  timeStart: z.string().min(1, "Start time required"),
  timeEnd: z.string().min(1, "End time required"),
  room: z.string().min(1, "Please select a room"),
  limitSeats: z.coerce.number().min(1, "At least 1 seat"),
  showOnRegPage: z.boolean().default(true),
  publicSession: z.boolean().default(false),
  photo: z.any().optional(),
})

interface ConferenceFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
}

export function ConferenceForm({ onSubmit, defaultValues }: ConferenceFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      learnMore: "",
      speakerInfo: "",
      timeStart: "09:00",
      timeEnd: "10:00",
      room: "",
      limitSeats: 50,
      showOnRegPage: true,
      publicSession: false,
      ...defaultValues,
    },
  })

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Input placeholder="Conference Topic" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
             <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="room"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Room</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Main Hall">Main Hall</SelectItem>
                    <SelectItem value="Room A">Room A</SelectItem>
                    <SelectItem value="Room B">Room B</SelectItem>
                    <SelectItem value="Auditorium">Auditorium</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="timeStart"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="timeEnd"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
            control={form.control}
            name="limitSeats"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Seat Limit</FormLabel>
                <FormControl>
                    <Input type="number" {...field} value={field.value as number} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="grid grid-cols-1 gap-4">
            <FormField
            control={form.control}
            name="learnMore"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Learn More (Detail)</FormLabel>
                <FormControl>
                    <Textarea 
                      placeholder="Enter details about the conference..." 
                      className="resize-none min-h-[100px]" 
                      {...field} 
                    />
                </FormControl>
                <FormDescription>
                    You can use Markdown or plain text.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
              <FormField
            control={form.control}
            name="speakerInfo"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Speaker Info</FormLabel>
                <FormControl>
                    <Textarea 
                      placeholder="Bio and details about the speaker..." 
                      className="resize-none min-h-[80px]" 
                      {...field} 
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

         <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Photo</FormLabel>
              <FormControl>
                  <div className="flex items-center gap-4">
                    <Input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="cursor-pointer"
                        onChange={(e) => {
                            field.onChange(e.target.files ? e.target.files[0] : null);
                        }}
                    />
                  </div>
              </FormControl>
              <FormDescription>
                Recommended size: 300x300px. JPG or PNG.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/20">
            <FormField
            control={form.control}
            name="showOnRegPage"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                <div className="space-y-0.5">
                    <FormLabel className="text-base">Show on Registration Page</FormLabel>
                    <FormDescription>
                    Visible to public on the main registration site.
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="publicSession"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Session</FormLabel>
                    <FormDescription>
                    Anyone can join without pre-registration approval.
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all shadow-lg hover:shadow-xl">Save Conference</Button>
      </form>
    </Form>
  )
}
