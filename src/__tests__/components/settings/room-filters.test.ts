import { filterRooms, type RoomColumnFilters } from "@/components/settings/room-filters"
import type { Room } from "@/app/actions/settings"

const defaultFilters: RoomColumnFilters = {
  roomName: "",
  roomType: "",
  location: "",
  deviceId: "",
  isActive: "all",
}

function createRoom(room: Partial<Room>): Room {
  return {
    room_uuid: "room-1",
    event_uuid: "event-1",
    room_name: "Hall B1",
    location_detail: "Hall B1",
    capacity: 10000,
    is_active: true,
    ...room,
  }
}

describe("filterRooms", () => {
  it("filters rooms when optional event_name is missing", () => {
    const rooms = [
      createRoom({ room_uuid: "room-1", room_name: "Hall B1", event_name: undefined }),
      createRoom({ room_uuid: "room-2", room_name: "Dahlia", location_detail: "Dahlia" }),
    ]

    expect(filterRooms(rooms, "dahlia", defaultFilters)).toEqual([rooms[1]])
  })

  it("matches optional room fields without throwing", () => {
    const rooms = [
      createRoom({
        room_uuid: "room-1",
        room_name: "Sunflower A&B",
        event_name: undefined,
        device_id: undefined,
      }),
    ]

    expect(filterRooms(rooms, "sunflower", defaultFilters)).toEqual(rooms)
    expect(filterRooms(rooms, "missing", defaultFilters)).toEqual([])
  })
})
