import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import TipTapEditor from '../components/TipTapEditor'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../lib/api'

const SiteSettingsPage = () => {
  const [settings, setSettings] = useState({
    site_title: '',
    site_description: '',
    posts_per_page: 10,
    introduction: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: ''
  })
  const [adminInfo, setAdminInfo] = useState({
    username: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [usernameData, setUsernameData] = useState({
    newUsername: '',
    password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
    usernamePassword: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingUsername, setIsChangingUsername] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch site settings
        const settingsResponse = await apiGet('/api/settings')
        if (!settingsResponse.ok) throw new Error('Failed to fetch settings')
        const settingsData = await settingsResponse.json()
        
        // Set defaults for any missing values
        setSettings({
          site_title: settingsData.site_title || 'Blogger',
          site_description: settingsData.site_description || '',
          posts_per_page: settingsData.posts_per_page || 10,
          introduction: settingsData.introduction || '',
          github_url: settingsData.github_url || '',
          linkedin_url: settingsData.linkedin_url || '',
          twitter_url: settingsData.twitter_url || ''
        })
        
        // Fetch admin info
        const adminResponse = await apiGet('/api/auth/admin-info')
        if (!adminResponse.ok) throw new Error('Failed to fetch admin info')
        const adminData = await adminResponse.json()
        
        setAdminInfo({
          username: adminData.username || '',
        })
        
        // Pre-fill the username field
        setUsernameData(prev => ({
          ...prev,
          newUsername: adminData.username || ''
        }))
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Site settings handlers
  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleIntroductionChange = (value) => {
    setSettings(prev => ({
      ...prev,
      introduction: value
    }))
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    // Ensure it's a positive number
    const numValue = Math.max(1, parseInt(value) || 1)
    setSettings(prev => ({
      ...prev,
      [name]: numValue
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const response = await apiPut('/api/settings', settings)
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      toast({
        title: "Settings Saved",
        description: "Your site settings have been updated successfully.",
      })
      
      // Refresh page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save site settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Password change handlers
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }
  
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!passwordData.currentPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Current password is required.",
      })
      return
    }
    
    if (!passwordData.newPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New password is required.",
      })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New password must be at least 6 characters.",
      })
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match.",
      })
      return
    }
    
    try {
      setIsChangingPassword(true)
      
      const requestBody = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      }
      
      const response = await apiPost('/api/auth/change-password', requestBody)
      
      let data
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { error: text || 'Unknown error occurred' }
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      })
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      console.error('Error changing password:', error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  // Username change handlers
  const handleUsernameInputChange = (e) => {
    const { name, value } = e.target
    setUsernameData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleUsernameChange = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!usernameData.newUsername) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username is required.",
      })
      return
    }
    
    if (usernameData.newUsername.length < 3) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username must be at least 3 characters.",
      })
      return
    }
    
    if (!usernameData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password is required to change username.",
      })
      return
    }
    
    try {
      setIsChangingUsername(true)
      
      const requestBody = {
        username: usernameData.newUsername,
        password: usernameData.password
      }
      
      const response = await apiPost('/api/auth/update-username', requestBody)
      
      let data
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { error: text || 'Unknown error occurred' }
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change username')
      }
      
      toast({
        title: "Username Updated",
        description: "Your username has been changed successfully.",
      })
      
      // Update the displayed username
      setAdminInfo(prev => ({
        ...prev,
        username: usernameData.newUsername
      }))
      
      // Reset password field
      setUsernameData(prev => ({
        ...prev,
        password: ''
      }))
      
    } catch (error) {
      console.error('Error changing username:', error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change username. Please try again.",
      })
    } finally {
      setIsChangingUsername(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Socials</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="site_title">Site Title</Label>
            <Input
              id="site_title"
              name="site_title"
              value={settings.site_title}
              onChange={handleChange}
              placeholder="My Blog"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site_description">Site Description</Label>
            <Input
              id="site_description"
              name="site_description"
              value={settings.site_description}
              onChange={handleChange}
              placeholder="A description of your blog"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="posts_per_page">Posts Per Page</Label>
            <Input
              id="posts_per_page"
              name="posts_per_page"
              type="number"
              min="1"
              value={settings.posts_per_page}
              onChange={handleNumberChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="introduction">Introduction</Label>
            <p className="text-sm text-muted-foreground mb-2">
              This content will be displayed on your homepage. You can use formatting and add images.
            </p>
            <TipTapEditor
              content={settings.introduction}
              onChange={handleIntroductionChange}
              placeholder="Write your introduction here..."
            />
          </div>
        </TabsContent>
        
        <TabsContent value="social" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              name="github_url"
              value={settings.github_url}
              onChange={handleChange}
              placeholder="https://github.com/yourusername"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              value={settings.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourusername"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter_url">Twitter URL</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              value={settings.twitter_url}
              onChange={handleChange}
              placeholder="https://twitter.com/yourusername"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6 pt-4">
          <div className="space-y-6 border p-4 rounded-md">
            <h3 className="text-lg font-medium">Change Username</h3>
            <p className="text-sm text-muted-foreground">
              Current username: <span className="font-medium">{adminInfo.username}</span>
            </p>
            
            <form onSubmit={handleUsernameChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUsername">New Username</Label>
                <Input
                  id="newUsername"
                  name="newUsername"
                  value={usernameData.newUsername}
                  onChange={handleUsernameInputChange}
                  placeholder="Enter new username"
                  minLength={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="usernamePassword">Your Password</Label>
                <div className="relative">
                  <Input
                    id="usernamePassword"
                    name="password"
                    type={showPasswords.usernamePassword ? "text" : "password"}
                    value={usernameData.password}
                    onChange={handleUsernameInputChange}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('usernamePassword')}
                  >
                    {showPasswords.usernamePassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={isChangingUsername}
                className="w-full sm:w-auto"
              >
                {isChangingUsername ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-background"></div>
                    Updating...
                  </>
                ) : (
                  'Update Username'
                )}
              </Button>
            </form>
          </div>
          
          <div className="space-y-6 border p-4 rounded-md">
            <h3 className="text-lg font-medium">Change Password</h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPasswords.currentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                  >
                    {showPasswords.currentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.newPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('newPassword')}
                  >
                    {showPasswords.newPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="w-full sm:w-auto"
              >
                {isChangingPassword ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-background"></div>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
      
      {activeTab !== 'account' && (
        <div className="pt-4 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-background"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default SiteSettingsPage
