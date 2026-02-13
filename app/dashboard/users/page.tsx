"use client"

import * as React from "react"
import { BadgeCode, MemberType } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"

interface User {
  id: string;
  name: string;
  email: string;
  type: MemberType;
  badgeCode: BadgeCode;
  company: string;
  status: "Active" | "Pending";
}

const MOCK_USERS: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", type: "Preregister", badgeCode: "VI", company: "AgriCorp", status: "Active" },
  { id: "2", name: "Bob Smith", email: "bob@organic.co", type: "Exhibitor", badgeCode: "EX", company: "Organic Co", status: "Active" },
  { id: "3", name: "Carol White", email: "carol@press.com", type: "Press", badgeCode: "PR", company: "Daily News", status: "Active" },
  { id: "4", name: "Dave Brown", email: "dave@vip.com", type: "VIP", badgeCode: "VP", company: "VIP Group", status: "Active" },
  { id: "5", name: "Eve Black", email: "eve@speaker.org", type: "Speaker", badgeCode: "SP", company: "Uni of Ag", status: "Pending" },
  { id: "6", name: "Frank Green", email: "frank@buyer.net", type: "Buyer", badgeCode: "BY", company: "Green Foods", status: "Active" },
  { id: "7", name: "Grace Lee", email: "grace@group.com", type: "Group", badgeCode: "VG", company: "Farmers Assoc", status: "Active" },
  { id: "8", name: "Hank Hill", email: "hank@onsite.com", type: "Onsite", badgeCode: "VO", company: "Propane Acc", status: "Active" },
  { id: "9", name: "Ivy Rose", email: "ivy@org.com", type: "Organizer", badgeCode: "OR", company: "Expo Org", status: "Active" },
  { id: "10", name: "Jack Blue", email: "jack@staff.com", type: "Staff", badgeCode: "ST", company: "Expo Staff", status: "Active" },
];

export default function UsersPage() {
  const [search, setSearch] = React.useState("")

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company.toLowerCase().includes(search.toLowerCase())
  )

  const getBadgeColor = (code: BadgeCode) => {
      switch(code) {
          case 'OR': return "bg-red-500 hover:bg-red-600";
          case 'ST': return "bg-orange-500 hover:bg-orange-600";
          case 'EX': return "bg-blue-600 hover:bg-blue-700";
          case 'VP': return "bg-purple-600 hover:bg-purple-700";
          case 'SP': return "bg-pink-500 hover:bg-pink-600";
          case 'PR': return "bg-cyan-500 hover:bg-cyan-600";
          case 'BY': return "bg-emerald-600 hover:bg-emerald-700";
          default: return "bg-zinc-500 hover:bg-zinc-600";
      }
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage participants, exhibitors, and staff.
          </p>
        </div>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>All Users</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
              </div>
              <CardDescription>
                  List of all registered users across the platform.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Badge Code</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>{user.company}</TableCell>
                            <TableCell>{user.type}</TableCell>
                            <TableCell className="text-center">
                                <Badge className={`${getBadgeColor(user.badgeCode)} text-white border-none w-10 justify-center`}>
                                    {user.badgeCode}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {user.status}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  )
}
