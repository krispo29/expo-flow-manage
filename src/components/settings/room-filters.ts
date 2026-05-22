import type { Room } from "@/app/actions/settings"

export interface RoomColumnFilters {
  roomName: string
  roomType: string
  location: string
  deviceId: string
  isActive: string
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "").toLowerCase()
}

function includesQuery(value: unknown, query: string) {
  return normalizeSearchValue(value).includes(query)
}

export function filterRooms(
  rooms: Room[],
  searchQuery: string,
  columnFilters: RoomColumnFilters
) {
  const query = normalizeSearchValue(searchQuery)

  return rooms.filter((room) => {
    const matchesSearch = !query ||
      includesQuery(room.room_name, query) ||
      includesQuery(room.event_name, query) ||
      includesQuery(room.location_detail, query) ||
      includesQuery(room.device_id, query)

    const roomNameQuery = normalizeSearchValue(columnFilters.roomName)
    const matchesRoomName = !roomNameQuery || includesQuery(room.room_name, roomNameQuery)

    const roomTypeQuery = normalizeSearchValue(columnFilters.roomType)
    const matchesRoomType = !roomTypeQuery || roomTypeQuery === "all" ||
      includesQuery(room.room_type, roomTypeQuery)

    const locationQuery = normalizeSearchValue(columnFilters.location)
    const matchesLocation = !locationQuery || includesQuery(room.location_detail, locationQuery)

    const deviceIdQuery = normalizeSearchValue(columnFilters.deviceId)
    const matchesDeviceId = !deviceIdQuery || includesQuery(room.device_id, deviceIdQuery)

    const matchesStatus = columnFilters.isActive === "all" ||
      (columnFilters.isActive === "active" && room.is_active) ||
      (columnFilters.isActive === "inactive" && !room.is_active)

    return matchesSearch && matchesRoomName && matchesRoomType && matchesLocation && matchesDeviceId && matchesStatus
  })
}
