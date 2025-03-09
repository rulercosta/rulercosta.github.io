import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ theme: "light", setTheme: () => {} })

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
}) {
  const [theme, setTheme] = useState(() => {
    // Check if mounted on client (not SSR)
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
