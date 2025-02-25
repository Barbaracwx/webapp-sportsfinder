'use client'

import { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'

interface User {
  telegramId: string
  firstName: string
  gender: string
  age: number
  points: number
  location: string[]
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [sports, setSports] = useState<{ [key: string]: string }>({})
  const [gender, setGender] = useState<string>('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])

  /* to add in user if not in the database yet */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()

      const initData = tg.initData || ''
      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initDataUnsafe.user),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data)
              setGender(data.gender)
              setSelectedLocations(data.location || [])
              setSports(data.sports || {})
              // Ensure age is set from the database
              setUser((prevUser) => (prevUser ? { ...prevUser, age: data.age || 18 } : null))
            }
          })
          .catch((err) => {
            setError('Failed to fetch user data')
          })
      } else {
        setError('No user data available')
      }
    } else {
      setError('This app should be opened in Telegram')
    }
  }, [])

  /* to increase points function in database */
  const handleIncreasePoints = async () => {
    if (!user) return

    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: user.telegramId }),
      })
      const data = await res.json()
      if (data.success) {
        setUser({ ...user, points: data.points })
        setNotification('Points increased successfully!')
        setTimeout(() => setNotification(''), 3000)
      } else {
        setError('Failed to increase points')
      }
    } catch (err) {
      setError('An error occurred while increasing points')
    }
  }

  /*to save profile data in database*/
  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const currentAge = user.age // Capture the current age
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          gender: user.gender,
          location: selectedLocations,
          age: currentAge, // Use the captured age
          sports: sports, // Send the sports data
        }),
      })
      const data = await res.json()

      if (data.success) {
        setUser({ ...user, gender: data.gender, location: selectedLocations, age: data.age })
      } else {
        setError('Failed to save profile')
      }
    } catch (err) {
      setError('An error occurred while saving profile')
    }
  }

  /*update sports choices*/
  const handleSportChange = (sport: string, selected: boolean) => {
    if (selected) {
      setSports((prev) => ({ ...prev, [sport]: 'Newbie' }))
    } else {
      setSports((prev) => {
        const newSports = { ...prev }
        delete newSports[sport]
        return newSports
      })
    }
  }

  /*update skill level*/
  const handleSkillLevelChange = (sport: string, level: string) => {
    setSports((prev) => ({ ...prev, [sport]: level }))
  }

  /*handle location change*/
  const handleLocationChange = (location: string) => {
    setSelectedLocations((prevLocations) =>
      prevLocations.includes(location)
        ? prevLocations.filter((loc) => loc !== location)
        : [...prevLocations, location]
    )
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>

  return (
    <div className="container mx-auto p-4 text-black min-h-screen" style={{ backgroundColor: '#d9f8e1' }}>
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>
      <h2 className="text-2xl font-bold mb-4">Profile Page</h2>

      {/* Age Slider */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your age?</label>
        <input
          type="range"
          min="1"
          max="100"
          value={user.age || 18} // Default to 18 if age is not set
          onChange={(e) => setUser({ ...user, age: Number(e.target.value) })} // Convert to number
          className="w-full cursor-pointer"
        />
        <p className="mt-2 text-center text-lg font-semibold">{user.age || 18} years old</p>
      </div>

      {/* Gender Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your gender?</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="Male"
              checked={user.gender === "Male"}
              onChange={(e) => setUser({ ...user, gender: e.target.value })}
              className="mr-2"
            />
            Male
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="Female"
              checked={user.gender === "Female"}
              onChange={(e) => setUser({ ...user, gender: e.target.value })}
              className="mr-2"
            />
            Female
          </label>
        </div>
      </div>

      {/* Preferred Location Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">Where is your preferred location for games?</label>
        {['North', 'South', 'East', 'West', 'Central'].map((location) => (
          <div key={location} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selectedLocations.includes(location)}
              onChange={() => handleLocationChange(location)}
              className="mr-2"
            />
            {location}
          </div>
        ))}
      </div>

      {/* Sports Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What sports do you play?</label>
        {['Tennis', 'Badminton', 'Table Tennis', 'Pickleball'].map((sport) => (
          <div key={sport} className="flex items-center gap-4 mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!sports[sport]}
                onChange={(e) => handleSportChange(sport, e.target.checked)}
                className="mr-2"
              />
              {sport}
            </label>
            {sports[sport] && (
              <select
                value={sports[sport]}
                onChange={(e) => handleSkillLevelChange(sport, e.target.value)}
                className="p-1 border rounded"
              >
                <option value="Newbie">Newbie</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Pro">Pro</option>
              </select>
            )}
          </div>
        ))}
      </div>

      <p>Your current points: {user.points}</p>

      {/* Increase Points Button */}
      <button
        onClick={handleIncreasePoints}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Increase Points
      </button>

      {/* Save profile Button */}
      <button
        onClick={handleSaveProfile}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Save Profile
      </button>

      {notification && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {notification}
        </div>
      )}
    </div>
  )
}