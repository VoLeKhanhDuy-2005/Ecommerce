import { z } from "zod";

export const putProfileSchema = z.object({
  userId: z.string().min(1, "userId là bắt buộc"), //
  phone: z
    .string()
    .regex(/^\d+$/, "Số điện thoại chỉ được chứa chữ số")
    .max(11, "Tối đa 11 số")
    .optional()
    .or(z.literal("")),
  fullname: z
    .string()
    .trim()
    .max(50, "Họ tên không được quá 50 ký tự")
    .optional()
    .or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  birthday: z.string().optional().nullable(),
});
