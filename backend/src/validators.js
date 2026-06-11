import Joi from 'joi';

const latinTextPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ ,.!?"'()\-]+$/;
const latinKeyPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ,.!?"'()\-]+$/;
const latinIdentifierPattern = /^[A-Za-z0-9_]+$/;

const latinText = Joi.string().pattern(latinTextPattern).min(2).required().messages({
  'string.pattern.base': 'Faqat lotin harflari, bo‘shliq va belgilardan foydalaning',
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

const sectionSchema = Joi.object({
  id: Joi.number().integer().optional(),
  key: Joi.string().pattern(latinIdentifierPattern).optional(),
  label: Joi.string().min(1).required(),
  sort_order: Joi.number().integer().min(0).default(0),
});

export const criteriaSchema = Joi.object({
  key: Joi.string().pattern(latinKeyPattern).min(2).required().messages({
    'string.pattern.base': 'Kriteriya kaliti faqat lotin harflari, raqamlar va maxsus belgilardan iborat bo‘lishi mumkin',
    'string.empty': 'Kriteriya kaliti talab qilinadi',
  }),
  label: Joi.string().min(2).required(),
  short_label: Joi.string().min(1).required(),
  sort_order: Joi.number().integer().min(0).default(0),
  sections: Joi.array().items(sectionSchema).default([]),
});

export const employeeSchema = Joi.object({
  full_name: Joi.string().pattern(latinTextPattern).min(3).required().messages({
    'string.pattern.base': 'F.I.O faqat lotin harflari, bo‘shliq va maxsus belgilarni o‘z ichiga olishi mumkin',
    'string.empty': 'F.I.O talab qilinadi',
  }),
  position: Joi.string().pattern(latinTextPattern).min(2).required().messages({
    'string.pattern.base': 'Lavozim faqat lotin harflari, bo‘shliq va maxsus belgilarni o‘z ichiga olishi mumkin',
    'string.empty': 'Lavozim talab qilinadi',
  }),
  region_id: Joi.number().integer().required(),
  district_id: Joi.number().integer().required(),
  scores: Joi.object().pattern(
    Joi.string().min(1),
    Joi.alternatives().try(
      Joi.number().integer().min(0).max(100),
      Joi.string().allow(''),
      Joi.allow(null)
    )
  ).optional(),
  chosen_sections: Joi.object().pattern(
    Joi.string().min(1),
    Joi.alternatives().try(
      Joi.string().min(1),
      Joi.array().items(Joi.string().min(1))
    )
  ).optional(),
});
