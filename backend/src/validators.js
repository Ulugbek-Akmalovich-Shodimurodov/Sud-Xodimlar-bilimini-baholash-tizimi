import Joi from 'joi';

const latinTextPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' \-]+$/;
const latinIdentifierPattern = /^[A-Za-z0-9_]+$/;

const latinText = Joi.string().pattern(latinTextPattern).min(2).required().messages({
  'string.pattern.base': 'Faqat lotin alifbosida yozing',
  'string.empty': 'Bu maydon bo‘sh bo‘la olmaydi',
});

const latinIdentifier = Joi.string().pattern(latinIdentifierPattern).min(3).required().messages({
  'string.pattern.base': 'Foydalanuvchi nomi faqat lotin harflari, raqamlar va pastki chiziqni o‘z ichiga olishi kerak',
  'string.empty': 'Foydalanuvchi nomi talab qilinadi',
});

export const loginSchema = Joi.object({
  username: latinIdentifier,
  password: Joi.string().required().messages({ 'any.required': 'Parol talab qilinadi' }),
});

export const adminSchema = Joi.object({
  username: latinIdentifier,
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('super_admin', 'admin').required(),
  assigned_regions: Joi.array().items(Joi.number().integer()).default([]),
});

export const adminUpdateSchema = Joi.object({
  username: latinIdentifier,
  password: Joi.string().min(6).allow('').optional(),
  role: Joi.string().valid('super_admin', 'admin').required(),
  assigned_regions: Joi.array().items(Joi.number().integer()).default([]),
});

export const regionSchema = Joi.object({
  name: latinText,
});

export const districtSchema = Joi.object({
  name: latinText,
  region_id: Joi.number().integer().required(),
});

export const positionSchema = Joi.object({
  name: latinText,
});

export const employeeSchema = Joi.object({
  full_name: Joi.string().pattern(latinTextPattern).min(3).required().messages({
    'string.pattern.base': 'F.I.O faqat lotin harflari va bo‘shliqdan iborat bo‘lishi kerak',
    'string.empty': 'F.I.O talab qilinadi',
  }),
  position: Joi.string().pattern(latinTextPattern).min(2).required().messages({
    'string.pattern.base': 'Lavozim faqat lotin harflari va bo‘shliqdan iborat bo‘lishi kerak',
    'string.empty': 'Lavozim talab qilinadi',
  }),
  region_id: Joi.number().integer().required(),
  district_id: Joi.number().integer().required(),
  score: Joi.number().integer().min(0).max(100).required(),
});
