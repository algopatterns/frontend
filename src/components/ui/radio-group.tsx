"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
  disabled: boolean
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup")
  }
  return context
}

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

function RadioGroup({
  value = "",
  onValueChange,
  disabled = false,
  className,
  children,
}: RadioGroupProps) {
  const name = React.useId()

  return (
    <RadioGroupContext.Provider
      value={{
        value,
        onValueChange: onValueChange ?? (() => {}),
        disabled,
        name,
      }}
    >
      <div role="radiogroup" className={cn("grid gap-2", className)}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps {
  value: string
  id?: string
  disabled?: boolean
  className?: string
}

function RadioGroupItem({
  value,
  id,
  disabled: itemDisabled = false,
  className,
}: RadioGroupItemProps) {
  const { value: groupValue, onValueChange, disabled: groupDisabled, name } = useRadioGroup()
  const checked = value === groupValue
  const disabled = groupDisabled || itemDisabled

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow-xs",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {checked && (
        <span className="flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-primary" />
        </span>
      )}
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
