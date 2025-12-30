'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onDateChange?: () => void // Callback para quando as datas mudarem
}

/**
 * Componente de seleção de intervalo de datas usando shadcn/ui
 * Permite selecionar data inicial e final para filtrar retornos
 */
export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDateChange,
}: DateRangePickerProps) {
  // Função helper para criar Date sem problemas de timezone
  const createDateFromString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const start = startDate ? createDateFromString(startDate) : undefined
    const end = endDate ? createDateFromString(endDate) : undefined
    if (start || end) {
      return { from: start, to: end }
    }
    return undefined
  })

  // Sincronizar quando props mudarem (apenas se realmente mudaram)
  React.useEffect(() => {
    const start = startDate ? createDateFromString(startDate) : undefined
    const end = endDate ? createDateFromString(endDate) : undefined
    
    // Verificar se as datas realmente mudaram para evitar loops
    const currentStart = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null
    const currentEnd = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null
    
    if (start && end && (currentStart !== startDate || currentEnd !== endDate)) {
      setDateRange({ from: start, to: end })
    } else if (start && !end && currentStart !== startDate) {
      setDateRange({ from: start, to: undefined })
    } else if (!start && !end && (currentStart || currentEnd)) {
      setDateRange(undefined)
    }
  }, [startDate, endDate])

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    
    // Atualizar datas apenas quando houver mudança real
    if (range?.from) {
      const year = range.from.getFullYear()
      const month = String(range.from.getMonth() + 1).padStart(2, '0')
      const day = String(range.from.getDate()).padStart(2, '0')
      const startDateStr = `${year}-${month}-${day}`
      
      if (startDateStr !== startDate) {
        onStartDateChange(startDateStr)
      }
    }
    
    if (range?.to) {
      const year = range.to.getFullYear()
      const month = String(range.to.getMonth() + 1).padStart(2, '0')
      const day = String(range.to.getDate()).padStart(2, '0')
      const endDateStr = `${year}-${month}-${day}`
      
      if (endDateStr !== endDate) {
        onEndDateChange(endDateStr)
      }
      // Chamar callback quando o intervalo estiver completo
      onDateChange?.()
    } else if (range?.from && !range?.to) {
      // Se só selecionou a data inicial, limpar a final
      if (endDate) {
        onEndDateChange('')
      }
    }
  }

  // Opções de intervalo rápido
  const quickRanges = [
    { label: 'Hoje', days: 0 },
    { label: 'Últimos 7 dias', days: -7 },
    { label: 'Últimos 30 dias', days: -30 },
    { label: 'Este mês', days: -new Date().getDate() + 1 },
  ]

  const applyQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() + days)
    
    // Formatar datas corretamente
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const range: DateRange = { from: start, to: end }
    setDateRange(range)
    onStartDateChange(formatDate(start))
    onEndDateChange(formatDate(end))
    // Chamar callback para atualizar a lista
    onDateChange?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <CalendarIcon className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium">Filtro de Data</label>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                      {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                  )
                ) : (
                  <span>Selecione o intervalo de datas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 self-center">Rápido:</span>
        {quickRanges.map((range) => (
          <Button
            key={range.label}
            variant="outline"
            size="sm"
            onClick={() => applyQuickRange(range.days)}
            className="h-7 text-xs"
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
