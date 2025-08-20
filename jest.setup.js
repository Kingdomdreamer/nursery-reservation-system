// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-line-token'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ size, className, ...props }) => <div data-testid="AlertTriangle" data-size={size} className={className} {...props} />,
  X: ({ size, className, ...props }) => <div data-testid="X" data-size={size} className={className} {...props} />,
  RefreshCw: ({ size, className, ...props }) => <div data-testid="RefreshCw" data-size={size} className={className} {...props} />,
  ChevronDown: ({ size, className, ...props }) => <div data-testid="ChevronDown" data-size={size} className={className} {...props} />,
  ChevronUp: ({ size, className, ...props }) => <div data-testid="ChevronUp" data-size={size} className={className} {...props} />,
  Search: ({ size, className, ...props }) => <div data-testid="Search" data-size={size} className={className} {...props} />,
  Plus: ({ size, className, ...props }) => <div data-testid="Plus" data-size={size} className={className} {...props} />,
  Edit: ({ size, className, ...props }) => <div data-testid="Edit" data-size={size} className={className} {...props} />,
  Trash: ({ size, className, ...props }) => <div data-testid="Trash" data-size={size} className={className} {...props} />,
  Eye: ({ size, className, ...props }) => <div data-testid="Eye" data-size={size} className={className} {...props} />,
  EyeOff: ({ size, className, ...props }) => <div data-testid="EyeOff" data-size={size} className={className} {...props} />,
  Check: ({ size, className, ...props }) => <div data-testid="Check" data-size={size} className={className} {...props} />,
  Calendar: ({ size, className, ...props }) => <div data-testid="Calendar" data-size={size} className={className} {...props} />,
  Clock: ({ size, className, ...props }) => <div data-testid="Clock" data-size={size} className={className} {...props} />,
  Download: ({ size, className, ...props }) => <div data-testid="Download" data-size={size} className={className} {...props} />,
  Upload: ({ size, className, ...props }) => <div data-testid="Upload" data-size={size} className={className} {...props} />,
  Settings: ({ size, className, ...props }) => <div data-testid="Settings" data-size={size} className={className} {...props} />,
  User: ({ size, className, ...props }) => <div data-testid="User" data-size={size} className={className} {...props} />,
  Phone: ({ size, className, ...props }) => <div data-testid="Phone" data-size={size} className={className} {...props} />,
  Mail: ({ size, className, ...props }) => <div data-testid="Mail" data-size={size} className={className} {...props} />,
  Loading: ({ size, className, ...props }) => <div data-testid="Loading" data-size={size} className={className} {...props} />,
  ChevronLeft: ({ size, className, ...props }) => <div data-testid="ChevronLeft" data-size={size} className={className} {...props} />,
  ChevronRight: ({ size, className, ...props }) => <div data-testid="ChevronRight" data-size={size} className={className} {...props} />,
  Info: ({ size, className, ...props }) => <div data-testid="Info" data-size={size} className={className} {...props} />,
}))

// Mock LIFF SDK
jest.mock('@line/liff', () => ({
  __esModule: true,
  default: {
    init: jest.fn(() => Promise.resolve()),
    ready: Promise.resolve(),
    isLoggedIn: jest.fn(() => false),
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(() => Promise.resolve({
      userId: 'test-user-id',
      displayName: 'Test User',
    })),
    isInClient: jest.fn(() => false),
    os: 'web',
  },
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  })),
}))

// Global test utilities
global.console.error = jest.fn()
global.console.warn = jest.fn()

// Setup fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
)

// Mock Request and Response for Next.js API testing
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Headers(options.headers || {});
    this.body = options.body || null;
  }
  
  async json() {
    return JSON.parse(this.body || '{}');
  }
  
  async text() {
    return this.body || '';
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(options.headers || {});
  }
  
  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this.map = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
  
  get(name) {
    return this.map.get(name.toLowerCase());
  }
  
  set(name, value) {
    this.map.set(name.toLowerCase(), String(value));
  }
  
  has(name) {
    return this.map.has(name.toLowerCase());
  }
  
  delete(name) {
    this.map.delete(name.toLowerCase());
  }
  
  *entries() {
    yield* this.map.entries();
  }
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
})