
"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, UserCog, Loader2 } from "lucide-react";
import type { UserProfile, UserRole } from "@/types";

interface UsersTableProps {
    users: UserProfile[];
    onRoleUpdate: (userId: string, role: UserRole, password: string) => Promise<{ success: boolean; message: string }>;
}

const roleVariant: Record<UserRole, "default" | "secondary" | "destructive"> = {
    patient: "secondary",
    hospital: "default",
    server: "destructive",
};

export function UsersTable({ users, onRoleUpdate }: UsersTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [targetRole, setTargetRole] = useState<UserRole | null>(null);
    const [password, setPassword] = useState("");
    
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openUpdateDialog = (user: UserProfile, role: UserRole) => {
        setSelectedUser(user);
        setTargetRole(role);
        setPassword("");
    };

    const closeDialog = () => {
        setSelectedUser(null);
        setTargetRole(null);
        setPassword("");
    }

    const handleUpdate = async () => {
        if (!selectedUser || !targetRole || !password) return;
        setIsSubmitting(true);
        const result = await onRoleUpdate(selectedUser.uid, targetRole, password);
        setIsSubmitting(false);
        if (result.success) {
            closeDialog();
        }
    };

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={roleVariant[user.role]} className="capitalize">
                                           {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openUpdateDialog(user, 'hospital')}>Make Hospital</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openUpdateDialog(user, 'server')}>Make Admin</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openUpdateDialog(user, 'patient')}>Make Patient</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No users found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           <UserCog /> Update User Role
                        </DialogTitle>
                        <DialogDescription>
                            To change the role for <span className="font-bold">{selectedUser?.email}</span> to <span className="font-bold capitalize">{targetRole}</span>, please enter the corresponding admin password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input 
                            type="password"
                            placeholder="Enter password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isSubmitting || !password}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
