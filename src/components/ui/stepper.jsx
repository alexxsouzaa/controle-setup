'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import * as Stepperize from '@stepperize/react'

import { cn } from '@/lib/utils'

const StepperContext = createContext(undefined)

const StepItemContext = createContext(undefined)

function useStepper() {
  const ctx = useContext(StepperContext)

  if (!ctx) throw new Error('useStepper must be used within a Stepper')

  return ctx
}

function useStepItem() {
  const ctx = useContext(StepItemContext)

  if (!ctx) throw new Error('useStepItem must be used within a StepperItem')

  return ctx
}

function Stepper({
  steps,
  defaultValue,
  orientation = 'horizontal',
  responsive = false,
  className,
  children,
  indicators = {},
  value,
  onValueChange,
  ...props
}) {
  // Define stepper once — steps are expected to be stable references
  const stepperDefRef = useRef(null)

  if (stepperDefRef.current === null) {
    stepperDefRef.current = Stepperize.defineStepper(...steps)
  }

  const stepper = stepperDefRef.current.useStepper({ initialStep: defaultValue || steps[0]?.id })

  const [triggerNodes, setTriggerNodes] = useState([])

  // Track viewport breakpoint (tailwind md = 768px). If `responsive` is true
  // and the configured orientation is horizontal, switch to vertical on
  // Viewport width smaller than md.
  const [isMdUp, setIsMdUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true)

  useEffect(() => {
    if (!responsive) return

    const mql = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsMdUp('matches' in e ? e.matches : mql.matches)

    if ('addEventListener' in mql) {
      // modern browsers

      mql.addEventListener('change', handler)
    } else {
      // fallback
      // @ts-expect-error - legacy
      mql.addListener(handler)
    }

    return () => {
      if ('removeEventListener' in mql) {
        mql.removeEventListener('change', handler)
      } else {
        // @ts-expect-error - legacy
        mql.removeListener(handler)
      }
    };
  }, [responsive])

  // Register/unregister triggers
  const registerTrigger = useCallback((node, remove = false) => {
    setTriggerNodes(prev => {
      if (!node) return prev

      if (remove) return prev.filter(n => n !== node);

      return prev.includes(node) ? prev : [...prev, node];
    })
  }, [])

  // Keyboard navigation logic
  const focusNext = useCallback(
    (currentIdx) => triggerNodes[(currentIdx + 1) % triggerNodes.length]?.focus(),
    [triggerNodes]
  )

  const focusPrev = useCallback(
    (currentIdx) => triggerNodes[(currentIdx - 1 + triggerNodes.length) % triggerNodes.length]?.focus(),
    [triggerNodes]
  )

  const focusFirst = useCallback(() => triggerNodes[0]?.focus(), [triggerNodes])

  const focusLast = useCallback(() => triggerNodes[triggerNodes.length - 1]?.focus(), [triggerNodes])

  // Determine effective orientation when responsive behavior is enabled.
  const effectiveOrientation = useMemo(() => {
    if (responsive && orientation === 'horizontal') {
      return isMdUp ? 'horizontal' : 'vertical'
    }

    return orientation
  }, [responsive, orientation, isMdUp])

  // Context value
  const contextValue = useMemo(() => ({
    stepper,
    steps,
    orientation: effectiveOrientation,
    configOrientation: orientation,
    responsive,
    registerTrigger,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
    triggerNodes,
    indicators
  }), [
    stepper,
    steps,
    effectiveOrientation,
    orientation,
    responsive,
    registerTrigger,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
    triggerNodes,
    indicators
  ])

  // Controlled behavior: if `value` is provided, navigate to it when it changes
  useEffect(() => {
    if (typeof value === 'string' && value !== stepper.state.current.data.id) {
      stepper.navigation.goTo(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Notify parent when internal step changes
  useEffect(() => {
    onValueChange?.(stepper.state.current.data.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepper.state.current.data.id])

  return (
    <StepperContext.Provider value={contextValue}>
      <div
        role='tablist'
        aria-orientation={effectiveOrientation}
        data-slot='stepper'
        className={cn('w-full', className)}
        data-orientation={effectiveOrientation}
        {...props}>
        {children}
      </div>
    </StepperContext.Provider>
  );
}

function StepperItem({
  stepId,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}) {
  const { stepper, steps } = useStepper()
  const stepIndex = stepper.lookup.getIndex(stepId)
  const currentIndex = stepper.lookup.getIndex(stepper.state.current.data.id)
  const step = steps.find(s => s.id === stepId)

  const state =
    completed || stepIndex < currentIndex ? 'completed' : currentIndex === stepIndex ? 'active' : 'inactive'

  const isLoading = loading && currentIndex === stepIndex

  return (
    <StepItemContext.Provider
      value={{ step, index: stepIndex, state, isDisabled: disabled, isLoading }}>
      <div
        data-slot='stepper-item'
        className={cn(
          'group/step flex items-center justify-center not-last:flex-1 group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col',
          className
        )}
        data-state={state}
        {...(isLoading ? { 'data-loading': true } : {})}
        {...props}>
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

function StepperTrigger({
  asChild = false,
  className,
  children,
  tabIndex,
  ...props
}) {
  const { state, isLoading } = useStepItem()
  const { stepper, registerTrigger, triggerNodes, focusNext, focusPrev, focusFirst, focusLast } = useStepper()

  const { step, isDisabled } = useStepItem()
  const isSelected = stepper.state.current.data.id === step.id
  const id = `stepper-tab-${step.id}`
  const panelId = `stepper-panel-${step.id}`

  // Register this trigger via callback ref for correct mount/unmount handling
  const btnRef = useRef(null)

  const triggerRef = useCallback((node) => {
    if (node) {
      btnRef.current = node
      registerTrigger(node)
    } else if (btnRef.current) {
      registerTrigger(btnRef.current, true)
      btnRef.current = null
    }
  }, [registerTrigger])

  // Find our index among triggers for navigation
  const myIdx = useMemo(() => triggerNodes.findIndex((n) => n === btnRef.current), [triggerNodes])

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        if (myIdx !== -1 && focusNext) focusNext(myIdx)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        if (myIdx !== -1 && focusPrev) focusPrev(myIdx)
        break
      case 'Home':
        e.preventDefault()
        if (focusFirst) focusFirst()
        break
      case 'End':
        e.preventDefault()
        if (focusLast) focusLast()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        stepper.navigation.goTo(step.id)
        break
    }
  }

  if (asChild) {
    return (
      <span data-slot='stepper-trigger' data-state={state} className={className}>
        {children}
      </span>
    );
  }

  return (
    <button
      ref={triggerRef}
      role='tab'
      id={id}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={typeof tabIndex === 'number' ? tabIndex : isSelected ? 0 : -1}
      data-slot='stepper-trigger'
      data-state={state}
      data-loading={isLoading}
      className={cn(
        'inline-flex cursor-pointer items-center outline-none disabled:pointer-events-none disabled:opacity-60',
        'gap-2.5 rounded-full',
        className
      )}
      onClick={() => stepper.navigation.goTo(step.id)}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      {...props}>
      {children}
    </button>
  );
}

function StepperIndicator({
  children,
  className,
  variant = 'default'
}) {
  const { state, isLoading, step } = useStepItem()
  const { indicators } = useStepper()

  const base =
    'relative flex size-8 shrink-0 items-center justify-center overflow-hidden transition-all duration-300 rounded-md text-sm font-medium'

  const defaultClasses = cn(
    'border-background bg-muted data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ring-offset-background group-data-[state=active]/step:ring-primary/30 group-data-[state=active]/step:ring-2 group-data-[state=active]/step:ring-offset-3',
    base
  )

  const outlineClasses = cn(
    'bg-transparent border border-primary/20 text-muted-foreground data-[state=completed]:border-foreground data-[state=completed]:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground',
    base
  )

  const classes = variant === 'outline' ? outlineClasses : defaultClasses

  return (
    <div
      data-slot='stepper-indicator'
      data-state={state}
      className={cn(classes, className)}>
      <div className='absolute'>
        {(isLoading ? indicators?.loading : indicators?.[state]) ??
          (step?.icon ? <span className='*:[svg]:size-4'>{step.icon}</span> : children)}
      </div>
    </div>
  );
}

function StepperSeparator({
  className
}) {
  const { state } = useStepItem()

  return (
    <div
      data-slot='stepper-separator'
      data-state={state}
      className={cn(
        'bg-muted group-data-[state=completed]/step:bg-primary m-2 rounded-sm transition-colors duration-500 group-data-[orientation=horizontal]/stepper-nav:h-0.5 group-data-[orientation=horizontal]/stepper-nav:flex-1 group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-0.5',
        className
      )} />
  );
}

function StepperTitle({
  children,
  className
}) {
  const { state } = useStepItem()

  return (
    <h3
      data-slot='stepper-title'
      data-state={state}
      className={cn('text-sm font-medium', className)}>
      {children}
    </h3>
  );
}

function StepperDescription({
  children,
  className
}) {
  const { state } = useStepItem()

  return (
    <div
      data-slot='stepper-description'
      data-state={state}
      className={cn('text-muted-foreground text-xs font-medium', className)}>
      {children}
    </div>
  );
}

function StepperNav({
  children,
  className
}) {
  const { stepper, orientation, configOrientation, responsive } = useStepper()

  const responsiveNavClasses = responsive && configOrientation === 'horizontal' ? 'flex-col md:flex-row md:w-full' : ''

  return (
    <nav
      data-slot='stepper-nav'
      data-state={stepper.state.current.data.id}
      data-orientation={orientation}
      className={cn(
        'group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
        responsiveNavClasses,
        className
      )}>
      {children}
    </nav>
  );
}

function StepperPanel({
  children,
  className
}) {
  const { stepper } = useStepper()

  return (
    <div
      data-slot='stepper-panel'
      data-state={stepper.state.current.data.id}
      className={cn('w-full', className)}>
      {children}
    </div>
  );
}

function StepperContent({
  value,
  forceMount,
  children,
  className
}) {
  const { stepper } = useStepper()
  const isActive = value === stepper.state.current.data.id

  if (!forceMount && !isActive) {
    return null
  }

  return (
    <div
      role='tabpanel'
      id={`stepper-panel-${value}`}
      aria-labelledby={`stepper-tab-${value}`}
      data-slot='stepper-content'
      data-state={stepper.state.current.data.id}
      className={cn('w-full', className, !isActive && forceMount && 'hidden')}
      hidden={!isActive && forceMount}>
      {children}
    </div>
  );
}

export { useStepper, useStepItem, Stepper, StepperItem, StepperTrigger, StepperIndicator, StepperSeparator, StepperTitle, StepperDescription, StepperPanel, StepperContent, StepperNav };
