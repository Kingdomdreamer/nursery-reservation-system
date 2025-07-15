import { ReservationService } from '../../app/lib/services/ReservationService'

// Mock the Supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-id', 
              reservation_number: 'TEST-001',
              status: 'pending',
              customer_id: 'customer-1',
              reservation_date: '2024-01-01',
              total_amount: 1000
            }, 
            error: null 
          })),
          limit: jest.fn(() => Promise.resolve({ 
            data: [
              { 
                id: 'test-id', 
                reservation_number: 'TEST-001',
                status: 'pending'
              }
            ], 
            error: null 
          })),
        })),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ 
        data: { 
          id: 'new-reservation-id',
          reservation_number: 'TEST-002'
        }, 
        error: null 
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ 
          data: { 
            id: 'test-id',
            status: 'confirmed'
          }, 
          error: null 
        })),
      })),
    })),
  },
}))

describe('ReservationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllReservations', () => {
    it('should return all reservations', async () => {
      const result = await ReservationService.getAllReservations()
      
      expect(result).toEqual([
        { 
          id: 'test-id', 
          reservation_number: 'TEST-001',
          status: 'pending'
        }
      ])
    })
  })

  describe('getReservationById', () => {
    it('should return reservation by id', async () => {
      const result = await ReservationService.getReservationById('test-id')
      
      expect(result).toEqual({
        id: 'test-id',
        reservation_number: 'TEST-001',
        status: 'pending',
        customer_id: 'customer-1',
        reservation_date: '2024-01-01',
        total_amount: 1000
      })
    })
  })

  describe('createReservation', () => {
    it('should create a new reservation', async () => {
      const newReservation = {
        customer_id: 'customer-1',
        reservation_date: '2024-01-01',
        total_amount: 1500,
        status: 'pending' as const,
        items: []
      }

      const result = await ReservationService.createReservation(newReservation)
      
      expect(result).toEqual({
        id: 'new-reservation-id',
        reservation_number: 'TEST-002'
      })
    })
  })

  describe('updateReservationStatus', () => {
    it('should update reservation status', async () => {
      const result = await ReservationService.updateReservationStatus('test-id', 'confirmed')
      
      expect(result).toEqual({
        id: 'test-id',
        status: 'confirmed'
      })
    })
  })
})