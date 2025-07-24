// Test utilities for better testability

import type { 
  Product, 
  PickupWindow, 
  FormSettings, 
  Reservation,
  FormConfigResponse 
} from '@/types';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

// Mock data factories
export const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'テスト商品',
  price: 1000,
  category_id: 1,
  description: 'テスト用の商品です',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockProducts = (count: number = 3): Product[] =>
  Array.from({ length: count }, (_, i) =>
    createMockProduct({
      id: i + 1,
      name: `テスト商品 ${i + 1}`,
      price: (i + 1) * 1000,
      category_id: (i % 3) + 1,
    })
  );

export const createMockPickupWindow = (overrides: Partial<PickupWindow> = {}): PickupWindow => ({
  id: 1,
  product_id: 1,
  pickup_date: '2024-12-25',
  start_time: '10:00',
  end_time: '18:00',
  available_slots: 10,
  max_slots: 10,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPickupWindows = (count: number = 5): PickupWindow[] =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date('2024-12-25');
    date.setDate(date.getDate() + i);
    
    return createMockPickupWindow({
      id: i + 1,
      product_id: (i % 3) + 1,
      pickup_date: date.toISOString().split('T')[0],
      available_slots: Math.max(0, 10 - i),
    });
  });

export const createMockFormSettings = (overrides: Partial<FormSettings> = {}): FormSettings => ({
  require_address: false,
  enable_furigana: false,
  enable_gender: false,
  enable_birthday: false,
  show_price: true,
  allow_multiple_products: true,
  max_quantity_per_product: 10,
  ...overrides,
});

export const createMockFormConfig = (overrides: Partial<FormConfigResponse> = {}): FormConfigResponse => ({
  preset: {
    id: 1,
    preset_name: 'テストプリセット',
    description: 'テスト用のプリセットです',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  form_settings: createMockFormSettings(),
  products: createMockProducts(),
  pickup_windows: createMockPickupWindows(),
  ...overrides,
});

export const createMockReservationFormData = (
  overrides: Partial<ReservationFormData> = {}
): ReservationFormData => ({
  user_name: '山田太郎',
  phone_number: '090-1234-5678',
  products: [
    {
      product_id: 1,
      product_name: 'テスト商品',
      quantity: 2,
      unit_price: 1000,
      total_price: 2000,
      category: '1',
    },
  ],
  pickup_date: '2024-12-25',
  pickup_dates: {
    '1': '2024-12-25',
  },
  note: '',
  ...overrides,
});

export const createMockReservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  id: 'test-reservation-id',
  user_id: 'test-user-id',
  user_name: '山田太郎',
  phone_number: '090-1234-5678',
  product: ['テスト商品'],
  quantity: 2,
  unit_price: 1000,
  total_amount: 2000,
  pickup_date: '2024-12-25',
  status: 'confirmed',
  note: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Component testing helpers
export const createMockFormMethods = () => ({
  register: jest.fn(),
  handleSubmit: jest.fn((fn) => fn),
  watch: jest.fn(),
  setValue: jest.fn(),
  control: {} as any,
  formState: {
    errors: {},
    isSubmitting: false,
    isDirty: false,
    isValid: true,
  },
  trigger: jest.fn(),
  getValues: jest.fn(),
  reset: jest.fn(),
});

// API response mocks
export const createMockApiResponse = <T>(data: T, success: boolean = true) => ({
  ok: success,
  status: success ? 200 : 400,
  json: async () => (success ? { data } : { error: 'API Error' }),
});

// Environment variable mocks
export const createMockEnv = (overrides: Record<string, string> = {}) => ({
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  NEXT_PUBLIC_LINE_LIFF_ID: 'test-liff-id',
  NEXT_PUBLIC_BASE_URL: 'https://test.example.com',
  ...overrides,
});

// Date utilities for testing
export const createMockDate = (dateString: string = '2024-01-01T12:00:00Z') => {
  const mockDate = new Date(dateString);
  const originalDate = Date;
  
  // Mock Date constructor
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.now = jest.fn(() => mockDate.getTime());
  global.Date.parse = originalDate.parse;
  global.Date.UTC = originalDate.UTC;
  
  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
};

// Local storage mock
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};

// Fetch mock helper
export const createMockFetch = (responses: Array<{ url?: string; response: any }>) => {
  let callIndex = 0;
  
  return jest.fn((url: string) => {
    const response = responses.find(r => !r.url || r.url === url) || responses[callIndex];
    callIndex++;
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response?.response || {}),
      text: () => Promise.resolve(JSON.stringify(response?.response || {})),
    });
  });
};

// Component render helpers
export const createTestContext = () => ({
  user: {
    id: 'test-user-id',
    name: '山田太郎',
    email: 'test@example.com',
  },
  settings: createMockFormSettings(),
  products: createMockProducts(),
  pickupWindows: createMockPickupWindows(),
});

// Async testing helpers
export const waitFor = (condition: () => boolean, timeout: number = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const interval = 10;
    let elapsed = 0;
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (elapsed >= timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        elapsed += interval;
        setTimeout(check, interval);
      }
    };
    
    check();
  });
};

// Form validation testing
export const createValidationTestCases = () => ({
  validUserName: '山田太郎',
  invalidUserName: '',
  validPhoneNumber: '090-1234-5678',
  invalidPhoneNumber: '123',
  validEmail: 'test@example.com',
  invalidEmail: 'invalid-email',
  validZipCode: '123-4567',
  invalidZipCode: '123456',
  validDate: '2024-12-25',
  invalidDate: 'invalid-date',
});

// Performance testing helpers
export const measureRenderTime = (component: React.ComponentType, props: any) => {
  const start = performance.now();
  // Component render would happen here in actual test
  const end = performance.now();
  return end - start;
};

// Error testing helpers
export const createMockError = (type: string = 'Error', message: string = 'Test error') => {
  const error = new Error(message);
  error.name = type;
  return error;
};

// Accessibility testing helpers
export const createAccessibilityTestHelpers = () => ({
  hasAriaLabel: (element: HTMLElement) => element.hasAttribute('aria-label'),
  hasAriaDescribedBy: (element: HTMLElement) => element.hasAttribute('aria-describedby'),
  hasProperRoleAttribute: (element: HTMLElement, expectedRole: string) => 
    element.getAttribute('role') === expectedRole,
  isKeyboardAccessible: (element: HTMLElement) => 
    element.tabIndex >= 0 || ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName),
});