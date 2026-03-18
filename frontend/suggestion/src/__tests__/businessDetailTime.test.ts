import { formatDate, timeAgo, timeAgoDeps } from '../pages/business-dashboard/utils/businessDetailTime'

describe('businessDetailTime', () => {
  beforeEach(() => {
    timeAgoDeps.formatLongAgo = (iso: string) => formatDate(iso)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('timeAgo uses formatLongAgo when older than 7 days', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-03-20T12:00:00.000Z'))
    expect(timeAgo('2025-03-01T12:00:00.000Z')).toBe(formatDate('2025-03-01T12:00:00.000Z'))
  })

  it('timeAgo catch returns iso when formatLongAgo throws', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-03-20T12:00:00.000Z'))
    timeAgoDeps.formatLongAgo = () => {
      throw new Error('format failed')
    }
    expect(timeAgo('2025-03-01T12:00:00.000Z')).toBe('2025-03-01T12:00:00.000Z')
  })
})
