"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface DualRangeSliderProps {
  min: number
  max: number
  minValue: number
  maxValue: number
  onChange: (minValue: number, maxValue: number) => void
  step?: number
  className?: string
}

export default function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
  step = 1,
  className = "",
}: DualRangeSliderProps) {
  const [isDraggingMin, setIsDraggingMin] = useState(false)
  const [isDraggingMax, setIsDraggingMax] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const minThumbRef = useRef<HTMLDivElement>(null)
  const maxThumbRef = useRef<HTMLDivElement>(null)

  // Calculate positions as percentages
  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100
  }

  const minPos = getPercentage(minValue)
  const maxPos = getPercentage(maxValue)

  // Handle slider track click
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const clickPos = ((e.clientX - rect.left) / rect.width) * 100

    // Determine which thumb to move based on click position
    const distToMin = Math.abs(clickPos - minPos)
    const distToMax = Math.abs(clickPos - maxPos)

    if (distToMin <= distToMax) {
      // Move min thumb
      const newMinValue = Math.round(((clickPos / 100) * (max - min) + min) / step) * step
      if (newMinValue < maxValue) {
        onChange(newMinValue, maxValue)
      }
    } else {
      // Move max thumb
      const newMaxValue = Math.round(((clickPos / 100) * (max - min) + min) / step) * step
      if (newMaxValue > minValue) {
        onChange(minValue, newMaxValue)
      }
    }
  }

  // Handle thumb movement
  const handleMove = (clientX: number) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const newValue = Math.round(((percentage / 100) * (max - min) + min) / step) * step

    if (isDraggingMin && newValue < maxValue) {
      onChange(newValue, maxValue)
    } else if (isDraggingMax && newValue > minValue) {
      onChange(minValue, newValue)
    }
  }

  // Mouse event handlers
  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    setIsDraggingMin(false)
    setIsDraggingMax(false)
  }

  // Touch event handlers
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    setIsDraggingMin(false)
    setIsDraggingMax(false)
  }

  // Set up event listeners
  useEffect(() => {
    if (isDraggingMin || isDraggingMax) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDraggingMin, isDraggingMax])

  return (
    <div className={`relative h-10 ${className}`}>
      {/* Background track */}
      <div
        ref={sliderRef}
        className="absolute top-1/2 left-0 right-0 h-2 bg-[#E5E7EB] rounded-full transform -translate-y-1/2 cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Filled track */}
        <div
          className="absolute h-full bg-[#B3D250] rounded-full"
          style={{
            left: `${minPos}%`,
            right: `${100 - maxPos}%`,
          }}
        ></div>
      </div>

      {/* Min thumb */}
      <div
        ref={minThumbRef}
        className="absolute top-1/2 w-6 h-6 bg-[#B3D250] rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none"
        style={{ left: `${minPos}%` }}
        onMouseDown={() => setIsDraggingMin(true)}
        onTouchStart={() => setIsDraggingMin(true)}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={minValue}
        tabIndex={0}
      ></div>

      {/* Max thumb */}
      <div
        ref={maxThumbRef}
        className="absolute top-1/2 w-6 h-6 bg-[#B3D250] rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none"
        style={{ left: `${maxPos}%` }}
        onMouseDown={() => setIsDraggingMax(true)}
        onTouchStart={() => setIsDraggingMax(true)}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={maxValue}
        tabIndex={0}
      ></div>
    </div>
  )
}
