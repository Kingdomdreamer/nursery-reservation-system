import { z } from 'zod';

// Phone number validation for Japanese format
const phoneNumberRegex = /^0\d{1,4}-\d{1,4}-\d{4}$|^0\d{9,10}$/;

// Zip code validation for Japanese format (〒123-4567)
const zipCodeRegex = /^\d{3}-\d{4}$/;

export const productSelectionSchema = z.object({
  product_id: z.number().min(1, '商品を選択してください'),
  product_name: z.string().min(1, '商品名が必要です'),
  quantity: z.number().min(1, '数量は1以上で入力してください').max(99, '数量は99以下で入力してください'),
  unit_price: z.number().min(0, '価格は0以上である必要があります'),
  total_price: z.number().min(0, '合計価格は0以上である必要があります'),
  category: z.string().optional(),
  variation: z.string().optional(),
  comment: z.string().optional(),
});

export const reservationFormSchema = z.object({
  user_name: z
    .string()
    .min(1, '名前を入力してください')
    .max(50, '名前は50文字以内で入力してください'),
  
  furigana: z
    .string()
    .max(50, 'ふりがなは50文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  phone_number: z
    .string()
    .min(1, '電話番号を入力してください')
    .regex(phoneNumberRegex, '正しい電話番号の形式で入力してください（例：090-1234-5678）'),
  
  zip: z
    .string()
    .regex(zipCodeRegex, '正しい郵便番号の形式で入力してください（例：123-4567）')
    .optional()
    .or(z.literal('')),
  
  address: z
    .string()
    .max(200, '住所は200文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  
  gender: z
    .enum(['male', 'female', 'other'])
    .optional(),
  
  birthday: z
    .string()
    .optional()
    .or(z.literal('')),
  
  products: z
    .array(productSelectionSchema)
    .min(1, '少なくとも1つの商品を選択してください')
    .max(10, '商品は10個まで選択可能です'),
  
  pickup_dates: z
    .record(z.string(), z.string())
    .refine(
      (dates) => Object.keys(dates).length > 0,
      '引き取り日を選択してください'
    ),
  
  note: z
    .string()
    .max(500, '備考は500文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

// Conditional validation based on form settings
export const createConditionalSchema = (formSettings: {
  require_address: boolean;
  enable_furigana: boolean;
  enable_gender: boolean;
  enable_birthday: boolean;
}) => {
  // Build the schema dynamically based on settings
  const schemaFields = {
    user_name: z
      .string()
      .min(1, '名前を入力してください')
      .max(50, '名前は50文字以内で入力してください'),
    
    furigana: formSettings.enable_furigana
      ? z
          .string()
          .min(1, 'ふりがなを入力してください')
          .max(50, 'ふりがなは50文字以内で入力してください')
      : z
          .string()
          .max(50, 'ふりがなは50文字以内で入力してください')
          .optional()
          .or(z.literal('')),
    
    phone_number: z
      .string()
      .min(1, '電話番号を入力してください')
      .regex(phoneNumberRegex, '正しい電話番号の形式で入力してください（例：090-1234-5678）'),
    
    zip: formSettings.require_address
      ? z
          .string()
          .min(1, '郵便番号を入力してください')
          .regex(zipCodeRegex, '正しい郵便番号の形式で入力してください（例：123-4567）')
      : z
          .string()
          .regex(zipCodeRegex, '正しい郵便番号の形式で入力してください（例：123-4567）')
          .optional()
          .or(z.literal('')),
    
    address: formSettings.require_address
      ? z
          .string()
          .min(1, '住所を入力してください')
          .max(200, '住所は200文字以内で入力してください')
      : z
          .string()
          .max(200, '住所は200文字以内で入力してください')
          .optional()
          .or(z.literal('')),
    
    gender: formSettings.enable_gender
      ? z
          .enum(['male', 'female', 'other'])
          .refine((val) => val !== undefined, {
            message: '性別を選択してください',
          })
      : z
          .enum(['male', 'female', 'other'])
          .optional(),
    
    birthday: formSettings.enable_birthday
      ? z
          .string()
          .min(1, '生年月日を入力してください')
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            '正しい生年月日の形式で入力してください（例：1990-01-01）'
          )
      : z
          .string()
          .optional()
          .or(z.literal('')),
    
    products: z
      .array(productSelectionSchema)
      .min(1, '少なくとも1つの商品を選択してください')
      .max(10, '商品は10個まで選択可能です'),
    
    pickup_dates: z
      .record(z.string(), z.string())
      .refine(
        (dates) => Object.keys(dates).length > 0,
        '引き取り日を選択してください'
      ),
    
    note: z
      .string()
      .max(500, '備考は500文字以内で入力してください')
      .optional()
      .or(z.literal('')),
  };

  return z.object(schemaFields);
};

export type ReservationFormData = z.infer<typeof reservationFormSchema>;
export type ProductSelectionData = z.infer<typeof productSelectionSchema>;