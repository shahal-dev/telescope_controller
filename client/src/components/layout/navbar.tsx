import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location === path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
  };

  return (
    <nav className="bg-card shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/logo/CASSA-Logo_Color-w_cropped-300x109 copy.png" 
                alt="CASSA Logo" 
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              <Link href="/">
                <div className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${isActive("/")}`}>
                  Dashboard
                </div>
              </Link>
              <Link href="/telescopes">
                <div className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${isActive("/telescopes")}`}>
                  Telescopes
                </div>
              </Link>
              <Link href="/observation-plans">
                <div className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${isActive("/observation-plans")}`}>
                  Observation Plans
                </div>
              </Link>
              <Link href="/logs">
                <div className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${isActive("/logs")}`}>
                  Logs
                </div>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" alt="User profile" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/users">
                  <DropdownMenuItem className="cursor-pointer">
                    User Management
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className={`${isMenuOpen ? 'block' : 'hidden'} px-2 pt-2 pb-3 space-y-1`}>
          <Link href="/">
            <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${isActive("/")}`}>
              Dashboard
            </div>
          </Link>
          <Link href="/telescopes">
            <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${isActive("/telescopes")}`}>
              Telescopes
            </div>
          </Link>
          <Link href="/observation-plans">
            <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${isActive("/observation-plans")}`}>
              Observation Plans
            </div>
          </Link>
          <Link href="/logs">
            <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${isActive("/logs")}`}>
              Logs
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
