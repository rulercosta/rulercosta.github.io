import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Settings, LogOut, FileEdit } from 'lucide-react'

const SettingsModal = ({ open, onOpenChange }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const handleOpenSettings = () => {
    // Close this modal first
    onOpenChange(false)
    // Navigate to settings page
    navigate('/site-settings')
  }

  const handleManagePages = () => {
    // Close this modal first
    onOpenChange(false)
    // Navigate to manage pages
    navigate('/manage')
  }

  const handleLogout = async () => {
    await logout()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-[425px] border-card-border p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Options</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-2">
          <Button
            variant="outline"
            className="flex w-full justify-start gap-2 border border-card-border h-auto py-2"
            onClick={handleManagePages}
          >
            <FileEdit className="h-4 w-4 shrink-0" />
            <span className="text-start">Manage Pages</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex w-full justify-start gap-2 border border-card-border h-auto py-2"
            onClick={handleOpenSettings}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="text-start">Settings</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex w-full justify-start gap-2 border border-card-border h-auto py-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="text-start">Logout</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
